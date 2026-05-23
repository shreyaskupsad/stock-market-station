const stockList = document.querySelector("#stockList");
const indexList = document.querySelector("#indexList");
const stockTemplate = document.querySelector("#stockTemplate");
const indexTemplate = document.querySelector("#indexTemplate");
const dataStatus = document.querySelector("#dataStatus");
const refreshButton = document.querySelector("#refreshButton");
const timelineSelect = document.querySelector("#timelineSelect");
const stocksWindowLabel = document.querySelector("#stocksWindowLabel");
const lessonQuote = document.querySelector("#lessonQuote");
const lessonTitle = document.querySelector("#lesson-title");
const lessonText = document.querySelector("#lessonText");
const lessonSource = document.querySelector("#lessonSource");
const lessonLink = document.querySelector("#lessonLink");
const detailDialog = document.querySelector("#detailDialog");
const closeDetail = document.querySelector("#closeDetail");
const detailMeta = document.querySelector("#detailMeta");
const detailTitle = document.querySelector("#detailTitle");
const detailTabs = document.querySelector("#detailTabs");
const detailChart = document.querySelector("#detailChart");
const detailChange = document.querySelector("#detailChange");
const detailPrices = document.querySelector("#detailPrices");

const timelineLabels = {
  "1w": "1 week",
  "2w": "2 weeks",
  "4w": "4 weeks"
};

let selectedTimeline = "4w";
let marketState = { stocks: [], indices: [] };
let activeDetailItem = null;
let activeDetailKind = "stock";
let activeDetailTimeline = "4w";

function formatPct(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatRupees(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value > 999 ? 0 : 2
  }).format(value);
}

function metricFor(item, timeline = selectedTimeline) {
  if (item.timelines && item.timelines[timeline]) {
    return item.timelines[timeline];
  }
  return {
    changePct: item.changePct,
    startPrice: item.startPrice,
    endPrice: item.endPrice,
    points: item.points || []
  };
}

function pointsToPolygon(points) {
  if (!points || points.length < 2) {
    return "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)";
  }

  const step = 100 / (points.length - 1);
  const topLine = points
    .map((point, index) => `${(index * step).toFixed(2)}% ${(100 - point).toFixed(2)}%`)
    .join(", ");
  return `polygon(${topLine}, 100% 100%, 0 100%)`;
}

function pointsToPolyline(points) {
  if (!points || points.length < 2) {
    return "0,50 100,50";
  }

  const step = 100 / (points.length - 1);
  return points
    .map((point, index) => `${(index * step).toFixed(2)},${(100 - point).toFixed(2)}`)
    .join(" ");
}

function setLoading() {
  stockList.innerHTML = Array.from({ length: 5 }, () => '<div class="skeleton"></div>').join("");
  indexList.innerHTML = Array.from({ length: 5 }, () => '<div class="skeleton"></div>').join("");
}

function paintChart(chart, metric) {
  chart.style.setProperty("--points", pointsToPolygon(metric.points));
  chart.classList.toggle("negative", metric.changePct < 0);
}

function renderStocks() {
  stockList.innerHTML = "";
  const stocks = [...marketState.stocks]
    .sort((a, b) => metricFor(b).changePct - metricFor(a).changePct)
    .slice(0, 5);

  stocks.forEach((stock, index) => {
    const metric = metricFor(stock);
    const node = stockTemplate.content.firstElementChild.cloneNode(true);
    const change = node.querySelector(".change-pill");
    const chart = node.querySelector(".chart-button");
    node.querySelector(".rank").textContent = index + 1;
    node.querySelector("h3").textContent = stock.name;
    node.querySelector("p").textContent = `${stock.sector} · ${stock.symbol}`;
    change.textContent = formatPct(metric.changePct);
    change.classList.toggle("negative", metric.changePct < 0);
    paintChart(chart, metric);
    chart.setAttribute(
      "aria-label",
      `Open ${stock.name} ${timelineLabels[selectedTimeline]} performance detail`
    );
    chart.addEventListener("click", () => openDetail(stock, "stock", selectedTimeline));
    node.querySelector(".card-note").textContent =
      metric.startPrice && metric.endPrice
        ? `${formatRupees(metric.startPrice)} to ${formatRupees(metric.endPrice)} over ${timelineLabels[selectedTimeline]}`
        : `Recent ${timelineLabels[selectedTimeline]} price path`;
    stockList.appendChild(node);
  });
}

function renderIndices() {
  indexList.innerHTML = "";
  marketState.indices.forEach((item) => {
    const metric = metricFor(item);
    const node = indexTemplate.content.firstElementChild.cloneNode(true);
    const label = node.querySelector(".trend-label");
    const chart = node.querySelector(".chart-button");
    node.querySelector("h3").textContent = item.name;
    node.querySelector("p").textContent = item.role || item.sector;
    paintChart(chart, metric);
    chart.setAttribute(
      "aria-label",
      `Open ${item.name} ${timelineLabels[selectedTimeline]} performance detail`
    );
    chart.addEventListener("click", () => openDetail(item, "index", selectedTimeline));
    label.textContent = `${formatPct(metric.changePct)} over ${timelineLabels[selectedTimeline]}`;
    label.classList.toggle("negative", metric.changePct < 0);
    indexList.appendChild(node);
  });
}

function renderMarket() {
  stocksWindowLabel.textContent = `Last ${timelineLabels[selectedTimeline]}`;
  renderStocks();
  renderIndices();
}

function renderLesson(lesson) {
  lessonQuote.textContent = `“${lesson.quote}”`;
  lessonTitle.textContent = lesson.title;
  lessonText.textContent = lesson.lesson;
  lessonSource.textContent = `${lesson.outlet} · refreshed daily from yesterday's news`;
  lessonLink.href = lesson.url;
}

function withCacheBust(url, isManualRefresh) {
  if (!isManualRefresh) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}refresh=1&t=${Date.now()}`;
}

function renderDetailChart(item, kind, timeline) {
  const metric = metricFor(item, timeline);
  const isNegative = metric.changePct < 0;
  detailMeta.textContent = `${kind === "stock" ? item.sector : item.role || item.sector} · ${item.symbol}`;
  detailTitle.textContent = item.name;
  detailTabs.innerHTML = "";

  Object.entries(timelineLabels).forEach(([key, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = key === timeline ? "active" : "";
    button.addEventListener("click", () => {
      activeDetailTimeline = key;
      renderDetailChart(item, kind, key);
    });
    detailTabs.appendChild(button);
  });

  detailChart.classList.toggle("negative", isNegative);
  detailChart.innerHTML = `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="${item.name} ${timelineLabels[timeline]} chart">
      <polyline class="chart-area" points="${pointsToPolyline(metric.points)} 100,100 0,100"></polyline>
      <polyline class="chart-line" points="${pointsToPolyline(metric.points)}"></polyline>
    </svg>
  `;
  detailChange.textContent = `${formatPct(metric.changePct)} over ${timelineLabels[timeline]}`;
  detailChange.classList.toggle("negative", isNegative);
  detailPrices.textContent =
    metric.startPrice && metric.endPrice
      ? `${formatRupees(metric.startPrice)} to ${formatRupees(metric.endPrice)}`
      : "Price range unavailable";
}

function openDetail(item, kind, timeline) {
  activeDetailItem = item;
  activeDetailKind = kind;
  activeDetailTimeline = timeline;
  renderDetailChart(item, kind, timeline);
  detailDialog.showModal();
}

async function loadDashboard(isManualRefresh = false) {
  refreshButton.disabled = true;
  dataStatus.textContent = isManualRefresh ? "Refreshing India market data" : "Fetching India market data";
  setLoading();

  try {
    const isLocalServer = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const marketUrl = isLocalServer ? "/api/market" : "data/market.json";
    const lessonUrl = isLocalServer ? "/api/lesson" : "data/lesson.json";
    const [marketResponse, lessonResponse] = await Promise.all([
      fetch(withCacheBust(marketUrl, isManualRefresh), { cache: "no-store" }),
      fetch(withCacheBust(lessonUrl, isManualRefresh), { cache: "no-store" })
    ]);
    const [market, lesson] = await Promise.all([marketResponse.json(), lessonResponse.json()]);

    marketState = {
      stocks: market.stocks || [],
      indices: market.indices || []
    };
    renderMarket();
    renderLesson(lesson);

    const updateTime = new Date(market.updatedAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
    const checkedTime = new Date().toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit"
    });
    const refreshNote = isManualRefresh ? ` · checked ${checkedTime}` : "";
    dataStatus.textContent =
      market.source === "live"
        ? `Live public data refreshed ${updateTime}${refreshNote}`
        : `Showing resilient sample data · live source was unavailable at ${updateTime}${refreshNote}`;
  } catch (error) {
    dataStatus.textContent = "Unable to load data. Try refreshing in a moment.";
  } finally {
    refreshButton.disabled = false;
  }
}

timelineSelect.addEventListener("change", (event) => {
  selectedTimeline = event.target.value;
  renderMarket();
  if (detailDialog.open && activeDetailItem) {
    activeDetailTimeline = selectedTimeline;
    renderDetailChart(activeDetailItem, activeDetailKind, activeDetailTimeline);
  }
});

refreshButton.addEventListener("click", () => loadDashboard(true));
closeDetail.addEventListener("click", () => detailDialog.close());
detailDialog.addEventListener("click", (event) => {
  if (event.target === detailDialog) {
    detailDialog.close();
  }
});
loadDashboard();
