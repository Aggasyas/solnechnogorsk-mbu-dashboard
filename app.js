const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const tabs = $$(".nav-tab");
const sections = $$(".dashboard-section");
const chartInstances = new Map();
let chartsInitialized = false;

function openSection(id) {
  tabs.forEach(tab => {
    const active = tab.dataset.section === id;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  sections.forEach(section => section.classList.toggle("active", section.id === id));
  $(".workspace").scrollTop = 0;
  document.body.classList.remove("nav-open");
  if (!chartsInitialized) initCharts();
  requestAnimationFrame(() => chartInstances.forEach(chart => chart.resize()));
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => openSection(tab.dataset.section));
  tab.addEventListener("keydown", event => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let target = index;
    if (event.key === "ArrowDown") target = (index + 1) % tabs.length;
    if (event.key === "ArrowUp") target = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") target = 0;
    if (event.key === "End") target = tabs.length - 1;
    tabs[target].focus();
    openSection(tabs[target].dataset.section);
  });
});

$("#menuToggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
$("#navBackdrop").addEventListener("click", () => document.body.classList.remove("nav-open"));

$("#themeToggle").addEventListener("click", () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  if (chartsInitialized) {
    chartInstances.forEach(chart => chart.destroy());
    chartInstances.clear();
    chartsInitialized = false;
    initCharts();
  }
});

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function chartDefaults() {
  Chart.defaults.font.family = '"Satoshi", "Segoe UI", Arial, sans-serif';
  Chart.defaults.color = cssVar("--muted");
  Chart.defaults.borderColor = cssVar("--line");
}

function baseOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 650 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 7, boxHeight: 7, padding: 18, font: { size: 10 } } },
      tooltip: { backgroundColor: cssVar("--nav"), titleColor: "#fff", bodyColor: "#d5e1e6", padding: 11, cornerRadius: 9, displayColors: true }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 } } },
      y: { beginAtZero: true, grid: { color: cssVar("--line") }, border: { display: false }, ticks: { font: { size: 10 } } }
    },
    ...extra
  };
}

function makeChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  chartInstances.set(id, new Chart(canvas, config));
}

function initCharts() {
  chartDefaults();
  const accent = cssVar("--accent");
  const accent2 = cssVar("--accent-2");
  const navy = cssVar("--nav-2");
  const muted = cssVar("--faint");
  const positive = cssVar("--positive");

  makeChart("overviewFundingChart", {
    type: "bar",
    data: {
      labels: ["2024", "2025", "2026"],
      datasets: [
        { label: "Дворы + общественные территории", data: [488.4, 544.0, 697.6], backgroundColor: accent, borderRadius: 5 },
        { label: "Дороги", data: [250.0, 585.6, 703.0], backgroundColor: navy, borderRadius: 5 }
      ]
    },
    options: baseOptions({ scales: { x: { stacked: true, grid: { display: false }, border: { display: false } }, y: { stacked: true, grid: { color: cssVar("--line") }, border: { display: false }, ticks: { callback: value => `${value} млн` } } } })
  });

  makeChart("roadsChart", {
    type: "line",
    data: { labels: ["2024", "2025", "2026"], datasets: [{ label: "км", data: [870.2, 870.2, 946.5], borderColor: accent, backgroundColor: `${accent}20`, fill: true, tension: .25, pointRadius: 5, pointBackgroundColor: accent }] },
    options: baseOptions({ plugins: { legend: { display: false }, tooltip: { backgroundColor: cssVar("--nav") } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { min: 800, grid: { color: cssVar("--line") }, border: { display: false }, ticks: { callback: value => `${value} км` } } } })
  });

  makeChart("financeChart", {
    type: "bar",
    data: {
      labels: ["2024", "2025", "2026"],
      datasets: [
        { label: "Территории", data: [488.4, 544.0, 697.6], backgroundColor: accent, borderRadius: 5 },
        { label: "Дороги", data: [250.0, 585.6, 703.0], backgroundColor: navy, borderRadius: 5 }
      ]
    },
    options: baseOptions({ scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: cssVar("--line") }, border: { display: false }, ticks: { callback: value => `${value} млн` } } } })
  });

  const appealOptions = () => baseOptions({
    plugins: { legend: { display: false }, tooltip: { backgroundColor: cssVar("--nav") } },
    scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: false, grid: { color: cssVar("--line") }, border: { display: false } } }
  });
  makeChart("yardsAppealsChart", {
    type: "line",
    data: { labels: ["2023", "2024", "2025", "2026"], datasets: [{ data: [9601, 10210, 9427, 7465], borderColor: accent, backgroundColor: `${accent}18`, fill: true, tension: .28, pointRadius: 4 }] },
    options: appealOptions()
  });
  makeChart("roadsAppealsChart", {
    type: "line",
    data: { labels: ["2023", "2024", "2025", "2026"], datasets: [{ data: [3461, 3876, 3980, 3334], borderColor: navy, backgroundColor: `${accent2}18`, fill: true, tension: .28, pointRadius: 4 }] },
    options: appealOptions()
  });

  makeChart("staffChart", {
    type: "bar",
    data: {
      labels: ["Рабочие", "Водители", "Трактористы"],
      datasets: [
        { label: "2024", data: [68.5, 91.3, 82.5], backgroundColor: muted, borderRadius: 4 },
        { label: "2025", data: [92.3, 91.3, 82.5], backgroundColor: accent2, borderRadius: 4 },
        { label: "2026", data: [98.5, 97.4, 95.7], backgroundColor: navy, borderRadius: 4 }
      ]
    },
    options: baseOptions({ scales: { x: { grid: { display: false }, border: { display: false } }, y: { max: 100, grid: { color: cssVar("--line") }, border: { display: false }, ticks: { callback: value => `${value}%` } } } })
  });

  makeChart("salaryChart", {
    type: "line",
    data: {
      labels: ["2024", "2025", "2026"],
      datasets: [
        { label: "Рабочие", data: [71.5, 74.2, 75.8], borderColor: muted, backgroundColor: muted, tension: .25, pointRadius: 4 },
        { label: "Водители", data: [82.3, 86.5, 91.3], borderColor: accent, backgroundColor: accent, tension: .25, pointRadius: 4 },
        { label: "Трактористы", data: [91.5, 102.8, 120], borderColor: positive, backgroundColor: positive, tension: .25, pointRadius: 4 },
        { label: "Средневзвешенная", data: [78.4, 82.2, 87.6], borderColor: navy, backgroundColor: navy, borderDash: [5, 4], tension: .25, pointRadius: 3 }
      ]
    },
    options: baseOptions({ scales: { x: { grid: { display: false }, border: { display: false } }, y: { min: 60, grid: { color: cssVar("--line") }, border: { display: false }, ticks: { callback: value => `${value} тыс.` } } } })
  });

  chartsInitialized = true;
}

initCharts();
