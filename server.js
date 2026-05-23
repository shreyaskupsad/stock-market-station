const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const CACHE_TTL_MS = 1000 * 60 * 20;

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

const fallbackStocks = [
  { symbol: "BEL.NS", name: "Bharat Electronics", sector: "Defence", changePct: 18.4, startPrice: 274, endPrice: 324, points: [40, 43, 44, 47, 50, 54, 58, 61, 66, 71, 76, 82] },
  { symbol: "TRENT.NS", name: "Trent", sector: "Retail", changePct: 15.8, startPrice: 5320, endPrice: 6161, points: [38, 41, 45, 44, 49, 52, 55, 59, 63, 65, 69, 74] },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports", sector: "Logistics", changePct: 12.9, startPrice: 1320, endPrice: 1490, points: [36, 39, 42, 44, 46, 45, 50, 53, 57, 61, 65, 69] },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", sector: "Auto", changePct: 11.6, startPrice: 2870, endPrice: 3203, points: [42, 43, 45, 48, 50, 49, 54, 57, 60, 63, 67, 70] },
  { symbol: "COALINDIA.NS", name: "Coal India", sector: "Mining", changePct: 9.7, startPrice: 385, endPrice: 422, points: [44, 45, 48, 46, 50, 52, 54, 57, 59, 61, 64, 66] }
];

const fallbackIndices = [
  { symbol: "^NSEI", name: "Nifty 50", role: "Large-cap pulse", changePct: 3.4, points: [42, 44, 43, 45, 47, 48, 50, 53, 52, 55, 57, 59] },
  { symbol: "^BSESN", name: "Sensex", role: "BSE benchmark", changePct: 3.1, points: [41, 42, 44, 43, 46, 47, 49, 51, 52, 54, 55, 57] },
  { symbol: "^NSEBANK", name: "Nifty Bank", role: "Banking strength", changePct: 2.6, points: [48, 47, 49, 51, 50, 53, 55, 56, 57, 59, 58, 61] },
  { symbol: "^CNXIT", name: "Nifty IT", role: "Technology exporters", changePct: -1.2, points: [62, 61, 59, 60, 58, 57, 55, 54, 56, 53, 52, 51] },
  { symbol: "^CNXAUTO", name: "Nifty Auto", role: "Mobility and manufacturing", changePct: 4.2, points: [38, 40, 42, 44, 43, 46, 49, 51, 54, 56, 59, 61] }
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const cache = new Map();

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 IndiaMarketCompass/1.0",
          Accept: "application/json,text/plain,*/*"
        },
        timeout: 12000
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
            resolve(JSON.parse(body));
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

function requestText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 IndiaMarketCompass/1.0",
          Accept: "application/rss+xml,text/xml,text/plain,*/*"
        },
        timeout: 12000
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
          resolve(body);
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
  });
}

async function cached(key, loader, forceRefresh = false) {
  const hit = cache.get(key);
  if (!forceRefresh && hit && Date.now() - hit.savedAt < CACHE_TTL_MS) {
    return hit.value;
  }
  const value = await loader();
  cache.set(key, { savedAt: Date.now(), value });
  return value;
}

function yahooChartUrl(symbol) {
  const encoded = encodeURIComponent(symbol);
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=1mo&interval=1d&includePrePost=false&events=history`;
}

async function loadChart(symbol) {
  const data = await requestJson(yahooChartUrl(symbol));
  const result = data.chart && data.chart.result && data.chart.result[0];
  if (!result || !result.indicators || !result.indicators.quote) {
    throw new Error(`No chart data for ${symbol}`);
  }
  const closes = result.indicators.quote[0].close
    .filter((value) => typeof value === "number" && Number.isFinite(value));
  if (closes.length < 2) {
    throw new Error(`Not enough chart data for ${symbol}`);
  }
  return closes;
}

function normalizePoints(values) {
  const sample = values.slice(-18);
  const min = Math.min(...sample);
  const max = Math.max(...sample);
  if (max === min) {
    return sample.map(() => 50);
  }
  return sample.map((value) => Math.round(18 + ((value - min) / (max - min)) * 64));
}

function movementFromCloses(closes, meta) {
  const startPrice = closes[0];
  const endPrice = closes[closes.length - 1];
  return {
    symbol: meta[0],
    name: meta[1],
    sector: meta[2],
    role: meta[2],
    changePct: Number((((endPrice - startPrice) / startPrice) * 100).toFixed(2)),
    startPrice: Number(startPrice.toFixed(2)),
    endPrice: Number(endPrice.toFixed(2)),
    points: normalizePoints(closes)
  };
}

async function loadMarket(forceRefresh = false) {
  return cached("market", async () => {
    const stockResults = await Promise.allSettled(
      stockUniverse.map(async (stock) => movementFromCloses(await loadChart(stock[0]), stock))
    );
    const indexResults = await Promise.allSettled(
      indices.map(async (index) => movementFromCloses(await loadChart(index[0]), index))
    );

    const stocks = stockResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, 5);

    const liveIndices = indexResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    return {
      source: stocks.length >= 5 && liveIndices.length >= 5 ? "live" : "fallback",
      updatedAt: new Date().toISOString(),
      stocks: stocks.length >= 5 ? stocks : fallbackStocks,
      indices: liveIndices.length >= 5 ? liveIndices : fallbackIndices
    };
  }, forceRefresh);
}

function formatGdeltDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}000000`;
}

function yesterdayWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { start, end };
}

function fallbackLesson() {
  return {
    source: "fallback",
    title: "Indian markets moved with sector rotation and earnings expectations.",
    outlet: "Market lesson",
    url: "https://www.nseindia.com/",
    date: new Date(Date.now() - 86400000).toISOString(),
    quote: "Begin with the business story, then look at the price.",
    lesson:
      "A one-day headline can explain why prices moved, but a beginner investor should ask whether the reason affects long-term earnings, debt, cash flow, or competitive strength."
  };
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

function cleanHeadline(value) {
  return value
    .replace(/\s+([,.;:%])/g, "$1")
    .replace(/(\d),\s+(\d)/g, "$1,$2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function loadGdeltLesson(start, end) {
  const query = encodeURIComponent(
    '(India stock market OR NSE OR BSE OR Sensex OR Nifty) sourceCountry:IN'
  );
  const url =
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}` +
    `&mode=ArtList&format=json&maxrecords=10&sort=HybridRel` +
    `&startdatetime=${formatGdeltDate(start)}&enddatetime=${formatGdeltDate(end)}`;

  const data = await requestJson(url);
  const article = data.articles && data.articles.find((item) => item.title && item.url);
  if (!article) {
    throw new Error("No GDELT article found");
  }

  return {
    source: "live",
    title: article.title,
    outlet: article.domain || "Indian market news",
    url: article.url,
    date: article.seendate || start.toISOString()
  };
}

async function loadRssLesson() {
  const url =
    "https://news.google.com/rss/search?q=India%20stock%20market%20NSE%20OR%20Sensex%20when:2d&hl=en-IN&gl=IN&ceid=IN:en";
  const xml = await requestText(url);
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  const item = items.find((entry) => tagValue(entry, "title") && tagValue(entry, "link"));
  if (!item) {
    throw new Error("No RSS article found");
  }

  const rawTitle = tagValue(item, "title");
  const titleParts = rawTitle.split(" - ");
  return {
    source: "live",
    title: cleanHeadline(titleParts[0] || rawTitle),
    outlet: tagValue(item, "source") || titleParts.slice(1).join(" - ") || "India market news",
    url: tagValue(item, "link"),
    date: tagValue(item, "pubDate") || new Date(Date.now() - 86400000).toISOString()
  };
}

async function loadLesson(forceRefresh = false) {
  const key = `lesson-${new Date().toISOString().slice(0, 10)}`;
  return cached(key, async () => {
    const { start, end } = yesterdayWindow();
    let article;
    try {
      article = await loadGdeltLesson(start, end);
    } catch (error) {
      article = await loadRssLesson();
    }

    return {
      source: "live",
      title: cleanHeadline(article.title),
      outlet: article.outlet || article.domain || "Indian market news",
      url: article.url,
      date: article.seendate || start.toISOString(),
      quote: "The lesson is rarely in the noise; it is in what the market chose to reprice.",
      lesson:
        "Use yesterday's market news as a question, not an instruction. Ask what changed, whether it is temporary, and whether the price has already reacted before you act."
    };
  }, forceRefresh);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const forceRefresh = requestUrl.searchParams.get("refresh") === "1";
    if (req.url.startsWith("/api/market")) {
      sendJson(res, 200, await loadMarket(forceRefresh));
      return;
    }
    if (req.url.startsWith("/api/lesson")) {
      sendJson(res, 200, await loadLesson(forceRefresh));
      return;
    }
    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 200, {
      source: "fallback",
      error: error.message,
      ...(req.url.startsWith("/api/lesson")
        ? fallbackLesson()
        : { updatedAt: new Date().toISOString(), stocks: fallbackStocks, indices: fallbackIndices })
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`India Market Compass running at http://localhost:${PORT}`);
});
