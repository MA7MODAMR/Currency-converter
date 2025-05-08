//Selecting all DOM elements
const fromCurrencyOptions = document.querySelector(".from-currency select");
const toCurrencyOptions = document.querySelector(".to-currency select");
const fromAmount = document.querySelector(".from-amount input");
const fromResult = document.getElementById("from-result");
const toResult = document.getElementById("to-result");
const convertBtn = document.getElementById("convert-btn");
const swapBtn = document.getElementById("swap-btn");

//a list to holds all rates
let rates = [];

// fetch all live concurrencies rates from API
async function loadCountrySymbols() {
  try {
    const ApiURL = `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=83a944cb84fc41428251174154a46368`;
    const result = await fetch(ApiURL);
    const data = await result.json();
    rates = data.rates;
    let symbolList = Object.keys(rates).sort();
    showData(symbolList);
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}
//add event listener on page load to fetch & display currency option immediately
document.addEventListener("DOMContentLoaded", () => {
  loadCountrySymbols();
});

function showData(symbolList) {
  let html = "";
  symbolList.forEach((symbol) => {
    html += `<option value="${symbol}" data-id = "${symbol}"> ${symbol} </option>`;
  });

  fromCurrencyOptions.innerHTML = html;
  fromCurrencyOptions.querySelectorAll("option").forEach((option) => {
    if (option.dataset.id === "USD") option.selected = "true";
  });

  toCurrencyOptions.innerHTML = html;
  toCurrencyOptions.querySelectorAll("option").forEach((option) => {
    if (option.dataset.id === "EUR") option.selected = "true";
  });
}

//validate the amount to be converted if valid number
fromAmount.addEventListener("keyup", function () {
  let amount = Number(this.value);
  if (!amount) fromAmount.style.borderColor = "#de3f44";
  else fromAmount.style.borderColor = "#c6c7c9";
});

//event listener when user clicks convert btn
convertBtn.addEventListener("click", async () => {
  let fromCurrency = fromCurrencyOptions.value;
  let toCurrency = toCurrencyOptions.value;
  let fromAmt = Number(fromAmount.value);
  if (fromAmt) getConvertedData(fromCurrency, toCurrency, fromAmt);

  // Fetch historical data and draw chart
  const start = "2023-01-01";
  const end = "2023-01-10";

  const chartData = await fetchHistoricalRates(
    fromCurrency,
    toCurrency,
    start,
    end
  );
  drawExchangeChart(chartData, toCurrency, fromCurrency);
});

function getConvertedData(from, to, amount) {
  try {
    if (!rates[from] || !rates[to]) throw new Error("Currency not supported");
    let rateFrom = parseFloat(rates[from]);
    let rateTo = parseFloat(rates[to]);
    let conversionRate = rateTo / rateFrom;
    let convertedAmount = amount * conversionRate;
    displayConvertedData(from, to, amount, convertedAmount);
  } catch (error) {
    alert("Failed to convert currency: " + error.message);
  }
}

// display the amount & converted result alomg with currencies code
function displayConvertedData(fromCurrency, toCurrency, fromAmt, toAmt) {
  fromResult.innerHTML = `${fromAmt.toFixed(2)} ${fromCurrency}`;
  toResult.innerHTML = `${toAmt.toFixed(2)} ${toCurrency}`;
}

// swap or reverse the currency
swapBtn.addEventListener("click", () => {
  let fromIndex = fromCurrencyOptions.selectedIndex;
  let toIndex = toCurrencyOptions.selectedIndex;
  fromCurrencyOptions.querySelectorAll("option")[toIndex].selected = "true";
  toCurrencyOptions.querySelectorAll("option")[fromIndex].selected = "true";
});

//THE ONLY SUPPORTED CURRENCIES//
/**{"AUD":"Australian Dollar","BGN":"Bulgarian Lev","BRL":"Brazilian Real","CAD":"Canadian Dollar","CHF":"Swiss Franc",
 * "CNY":"Chinese Renminbi Yuan","CZK":"Czech Koruna","DKK":"Danish Krone","EUR":"Euro","GBP":"British Pound","HKD":"Hong Kong Dollar",
 * "HUF":"Hungarian Forint","IDR":"Indonesian Rupiah","ILS":"Israeli New Sheqel","INR":"Indian Rupee","ISK":"Icelandic Króna",
 * "JPY":"Japanese Yen","KRW":"South Korean Won","MXN":"Mexican Peso","MYR":"Malaysian Ringgit","NOK":"Norwegian Krone",
 * "NZD":"New Zealand Dollar","PHP":"Philippine Peso","PLN":"Polish Złoty","RON":"Romanian Leu","SEK":"Swedish Krona","SGD":"Singapore Dollar",
 * "THB":"Thai Baht","TRY":"Turkish Lira","USD":"United States Dollar","ZAR":"South African Rand"} */
async function fetchHistoricalRates(from, to, startDate, endDate) {
  try {
    const url = `https://api.frankfurter.app/${startDate}..${endDate}?from=${from}&to=${to}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    const data = await response.json();

    const chartData = Object.entries(data.rates)
      .map(([date, rates]) => ({
        date,
        rate: rates[to],
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    return chartData;
  } catch (error) {
    console.error("Failed to fetch historical rates:", error);
    return null;
  }
}

function drawExchangeChart(chartData, to, from) {
  if (!chartData || chartData.length === 0) {
    console.error("No data to draw chart.");
    return;
  }
  const labels = chartData.map((entry) => entry.date);
  const dataPoints = chartData.map((entry) => entry.rate);

  const datasets = [
    {
      label: `Exchange Rate (${from} to ${to})`,
      data: dataPoints,
      borderColor: "#36A2EB",
      fill: false,
      tension: 0.1,
    },
  ];
  const ctx = document.getElementById("exchangeChart").getContext("2d");
  if (window.exchangeChartInstance) {
    window.exchangeChartInstance.destroy();
  }
  window.exchangeChartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Exchange Rates Over Time (Base: ${from})`,
        },
        tooltip: { mode: "index", intersect: false },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      scales: {
        x: { display: true, title: { display: true, text: "Date" } },
        y: { display: true, title: { display: true, text: "Exchange Rate" } },
      },
    },
  });
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("mode", isDark ? "dark" : "light");
  document.getElementById("mode-btn").textContent = isDark
    ? "Switch to Light Mode"
    : "Switch to Dark Mode";
}

window.addEventListener("DOMContentLoaded", function () {
  const modeBtn = document.getElementById("mode-btn");
  if (!modeBtn) {
    console.error('Button with id "mode-btn" not found!');
    return;
  }

  if (localStorage.getItem("mode") === "dark") {
    document.body.classList.add("dark-mode");
    modeBtn.textContent = "Switch to Light Mode";
  } else {
    modeBtn.textContent = "Switch to Dark Mode";
  }

  modeBtn.addEventListener("click", toggleDarkMode);
});
