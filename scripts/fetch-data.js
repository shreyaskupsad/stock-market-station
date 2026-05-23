const fs = require("fs");
const path = require("path");
const https = require("https");

const dataDir = path.join(__dirname, "..", "data");

const stockUniverse = [
  ["ADANIENT.NS", "Adani Enterprises", "Infrastructure"],
  ["ADANIPORTS.NS", "Adani Ports", "Logistics"],
  ["APOLLOHOSP.NS", "Apollo Hospitals", "Healthcare"],
  ["ASIANPAINT.NS", "Asian Paints", "Consumer"],
  ["AXISBANK.NS", "Axis Bank", "Banking"],
  ["BAJAJ-AUTO.NS", "Bajaj Auto", "Auto"],
  ["BAJFINANCE.NS", "Bajaj Finance", "Lending"],
  ["BAJAJFINSV.NS", "Bajaj Finserv", "Financials"],
  ["BEL.NS", "Bharat Electronics", "Defence"],
  ["BHARTIARTL.NS", "Bharti Airtel", "Telecom"],
  ["BPCL.NS", "BPCL", "Energy"],
  ["BRITANNIA.NS", "Britannia", "Consumer"],
  ["CIPLA.NS", "Cipla", "Pharma"],
  ["COALINDIA.NS", "Coal India", "Mining"],
  ["DIVISLAB.NS", "Divi's Labs", "Pharma"],
  ["DRREDDY.NS", "Dr. Reddy's", "Pharma"],
  ["EICHERMOT.NS", "Eicher Motors", "Auto"],
  ["GRASIM.NS", "Grasim", "Materials"],
  ["HCLTECH.NS", "HCLTech", "IT"],
  ["HDFCBANK.NS", "HDFC Bank", "Banking"],
  ["HDFCLIFE.NS", "HDFC Life", "Insurance"],
  ["HEROMOTOCO.NS", "Hero MotoCorp", "Auto"],
  ["HINDALCO.NS", "Hindalco", "Metals"],
  ["HINDUNILVR.NS", "Hindustan Unilever", "Consumer"],
  ["ICICIBANK.NS", "ICICI Bank", "Banking"],
  ["INDUSINDBK.NS", "IndusInd Bank", "Banking"],
  ["INFY.NS", "Infosys", "IT"],
  ["ITC.NS", "ITC", "Consumer"],
  ["JSWSTEEL.NS", "JSW Steel", "Metals"],
  ["KOTAKBANK.NS", "Kotak Mahindra Bank", "Banking"],
  ["LT.NS", "Larsen & Toubro", "Infrastructure"],
  ["M&M.NS", "Mahindra & Mahindra", "Auto"],
  ["MARUTI.NS", "Maruti Suzuki", "Auto"],
  ["NESTLEIND.NS", "Nestle India", "Consumer"],
  ["NTPC.NS", "NTPC", "Power"],
  ["ONGC.NS", "ONGC", "Energy"],
  ["POWERGRID.NS", "Power Grid", "Power"],
  ["RELIANCE.NS", "Reliance", "Energy"],
  ["SBILIFE.NS", "SBI Life", "Insurance"],
  ["SBIN.NS", "State Bank of India", "Banking"],
  ["SHRIRAMFIN.NS", "Shriram Finance", "Lending"],
  ["SUNPHARMA.NS", "Sun Pharma", "Pharma"],
  ["TATACONSUM.NS", "Tata Consumer", "Consumer"],
  ["TATAMOTORS.NS", "Tata Motors", "Auto"],
  ["TATASTEEL.NS", "Tata Steel", "Metals"],
  ["TCS.NS", "TCS", "IT"],
  ["TECHM.NS", "Tech Mahindra", "IT"],
  ["TITAN.NS", "Titan", "Consumer"],
  ["TRENT.NS", "Trent", "Retail"],
  ["ULTRACEMCO.NS", "UltraTech Cement", "Materials"],
  ["WIPRO.NS", "Wipro", "IT"]
];

const indices = [
  ["^NSEI", "Nifty 50", "Large-cap pulse"],
  ["^BSESN", "Sensex", "BSE benchmark"],
  ["^NSEBANK", "Nifty Bank", "Banking strength"],
  ["^CNXIT", "Nifty IT", "Technology exporters"],
  ["^CNXAUTO", "Nifty Auto", "Mobility and manufacturing"]
];

const timeframeDays = {
  "1w": 6,
  "2w": 11,
  "4w": 18
};

function request(url, parser = JSON.parse) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 IndiaMarketCompass/1.0",
          Accept: "application/json,text/xml,text/plain,*/*"
        },
        timeout: 15000
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          try {
            resolve(parser(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
  });
}

async function loadChart(symbol) {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=1mo&interval=1d&includePrePost=false&events=history`;
  const data = await request(url);
  const result = data.chart && data.chart.result && data.chart.result[0];
  const closes = result?.indicators?.quote?.[0]?.close?.filter((value) => Number.isFinite(value));
  if (!closes || closes.length < 2) {
    throw new Error(`No chart data for ${symbol}`);
  }
  return closes;
}

function normalizePoints(values) {
  const sample = values;
  const min = Math.min(...sample);
  const max = Math.max(...sample);
  if (max === min) {
    return sample.map(() => 50);
  }
  return sample.map((value) => Math.round(18 + ((value - min) / (max - min)) * 64));
}

function metricFromValues(values) {
  const startPrice = values[0];
  const endPrice = values[values.length - 1];
  return {
    changePct: Number((((endPrice - startPrice) / startPrice) * 100).toFixed(2)),
    startPrice: Number(startPrice.toFixed(2)),
    endPrice: Number(endPrice.toFixed(2)),
    points: normalizePoints(values)
  };
}

function timelinesFromCloses(closes) {
  return Object.fromEntries(
    Object.entries(timeframeDays).map(([key, days]) => {
      const values = closes.slice(-days);
      return [key, metricFromValues(values.length >= 2 ? values : closes)];
    })
  );
}

function movementFromCloses(closes, meta) {
  const timelines = timelinesFromCloses(closes);
  return {
    symbol: meta[0],
    name: meta[1],
    sector: meta[2],
    role: meta[2],
    timelines,
    ...timelines["4w"]
  };
}

function cleanHeadline(value) {
  return value
    .replace(/\s+([,.;:%])/g, "$1")
    .replace(/(\d),\s+(\d)/g, "$1,$2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function tagValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

async function buildMarket() {
  const stockResults = await Promise.allSettled(
    stockUniverse.map(async (stock) => movementFromCloses(await loadChart(stock[0]), stock))
  );
  const indexResults = await Promise.allSettled(
    indices.map(async (index) => movementFromCloses(await loadChart(index[0]), index))
  );
  const stocks = stockResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .sort((a, b) => b.timelines["4w"].changePct - a.timelines["4w"].changePct);
  const indexData = indexResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  if (stocks.length < 5 || indexData.length < 5) {
    throw new Error("Not enough market data to publish");
  }

  return {
    source: "live",
    updatedAt: new Date().toISOString(),
    stocks,
    indices: indexData
  };
}

async function buildLesson() {
  const url =
    "https://news.google.com/rss/search?q=India%20stock%20market%20NSE%20OR%20Sensex%20when:2d&hl=en-IN&gl=IN&ceid=IN:en";
  const xml = await request(url, (body) => body);
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  const item = items.find((entry) => tagValue(entry, "title") && tagValue(entry, "link"));
  if (!item) {
    throw new Error("No news article found");
  }
  const rawTitle = tagValue(item, "title");
  const titleParts = rawTitle.split(" - ");

  return {
    source: "live",
    title: cleanHeadline(titleParts[0] || rawTitle),
    outlet: tagValue(item, "source") || titleParts.slice(1).join(" - ") || "India market news",
    url: tagValue(item, "link"),
    date: tagValue(item, "pubDate") || new Date(Date.now() - 86400000).toISOString(),
    quote: "The lesson is rarely in the noise; it is in what the market chose to reprice.",
    lesson:
      "Use yesterday's market news as a question, not an instruction. Ask what changed, whether it is temporary, and whether the price has already reacted before you act."
  };
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });
  const [market, lesson] = await Promise.all([buildMarket(), buildLesson()]);
  fs.writeFileSync(path.join(dataDir, "market.json"), `${JSON.stringify(market, null, 2)}\n`);
  fs.writeFileSync(path.join(dataDir, "lesson.json"), `${JSON.stringify(lesson, null, 2)}\n`);
  console.log("Wrote data/market.json and data/lesson.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
