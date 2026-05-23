const stockList = document.querySelector("#stockList");
const indexList = document.querySelector("#indexList");
const stockTemplate = document.querySelector("#stockTemplate");
const indexTemplate = document.querySelector("#indexTemplate");
const dataStatus = document.querySelector("#dataStatus");
const refreshButton = document.querySelector("#refreshButton");
const lessonQuote = document.querySelector("#lessonQuote");
const lessonTitle = document.querySelector("#lesson-title");
const lessonText = document.querySelector("#lessonText");
const lessonSource = document.querySelector("#lessonSource");
const lessonLink = document.querySelector("#lessonLink");

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

function setLoading() {
  stockList.innerHTML = Array.from({ length: 5 }, () => '<div class="skeleton"></div>').join("");
  indexList.innerHTML = Array.from({ length: 5 }, () => '<div class="skeleton"></div>').join("");
}

function renderStocks(stocks) {
  stockList.innerHTML = "";
  stocks.forEach((stock, index) => {
    const node = stockTemplate.content.firstElementChild.cloneNode(true);
    const change = node.querySelector(".change-pill");
    node.querySelector(".rank").textContent = index + 1;
    node.querySelector("h3").textContent = stock.name;
    node.querySelector("p").textContent = `${stock.sector} · ${stock.symbol}`;
    change.textContent = formatPct(stock.changePct);
    change.classList.toggle("negative", stock.changePct < 0);
    node.querySelector(".sparkline").style.setProperty("--points", pointsToPolygon(stock.points));
    node.querySelector(".card-note").textContent =
      stock.startPrice && stock.endPrice
        ? `${formatRupees(stock.startPrice)} to ${formatRupees(stock.endPrice)} over roughly four weeks`
        : "Recent price path, simplified for trend reading";
    stockList.appendChild(node);
  });
}

function renderIndices(indices) {
  indexList.innerHTML = "";
  indices.forEach((item) => {
    const node = indexTemplate.content.firstElementChild.cloneNode(true);
    const label = node.querySelector(".trend-label");
    node.querySelector("h3").textContent = item.name;
    node.querySelector("p").textContent = item.role || item.sector;
    node.querySelector(".mini-chart").style.setProperty("--points", pointsToPolygon(item.points));
    label.textContent = `${formatPct(item.changePct)} over 4 weeks`;
    label.classList.toggle("negative", item.changePct < 0);
    indexList.appendChild(node);
  });
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

    renderStocks(market.stocks);
    renderIndices(market.indices);
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

refreshButton.addEventListener("click", () => loadDashboard(true));
loadDashboard();
