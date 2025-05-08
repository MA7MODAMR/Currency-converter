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
//checkes if currencies exists in the lists
//calculates conversion using rates relative to USD
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
     // Frankfurter API time series endpoint
    /**fetch(url): Sends an HTTP GET request to the API.
       await: Waits for the response.
       If the response isn’t OK (e.g., 404 or 500), throws an error.
      await response.json(): Parses the JSON response. */
    const url = `https://api.frankfurter.app/${startDate}..${endDate}?from=${from}&to=${to}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    const data = await response.json();

    // data.rates is an object with date keys and rates as values
    // Convert to array of {date, rate}
    /**data.rates: An object where each key is a date ("2023-01-01") and each value is an object of rates for that day.
       Object.entries(data.rates): Converts the object to an array of [date, rates] pairs.
       .map(([date, rates]) => ({date, rate: rates[to]})): For each pair, create an object with:
       date: the date string
       rate: the rate for the target currency (rates["EUR"])
       .sort(...): Ensures the array is sorted by date in ascending order*/
    const chartData = Object.entries(data.rates)
      .map(([date, rates]) => ({
        date,
        rate: rates[to],
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
        /**returns the array of {date, rate} objects.
      If any error occurs (network, API, etc.), logs the error and returns null. */
    return chartData;
  } catch (error) {
    console.error("Failed to fetch historical rates:", error);
    return null;
  }
}
// Draws a line chart of exchange rates over time using Chart.js, 
// based on the data returned by fetchHistoricalRates.
function drawExchangeChart(chartData, to, from) {
  //Checks if chartData is empty or null. If null show an error and exits.
  if (!chartData || chartData.length === 0) {
    console.error("No data to draw chart.");
    return;
  }
  //labels: Array of date strings for the x-axis.
  //dataPoints: Array of exchange rate values for the y-axis.
  const labels = chartData.map((entry) => entry.date);
  const dataPoints = chartData.map((entry) => entry.rate);
  /**datasets: Chart.js expects an array of dataset objects.
     label: The legend label.
     data: The y-values.
     borderColor: Line color.
     fill: No area fill under the line.
     tension: Controls line smoothness. */
  const datasets = [
    {
      label: `Exchange Rate (${from} to ${to})`,
      data: dataPoints,
      borderColor: "#36A2EB",
      fill: false,
      tension: 0.1,
    },
  ];
    //Gets the 2D drawing context from the <canvas id="exchangeChart"> element.
  const ctx = document.getElementById("exchangeChart").getContext("2d");
    //If a chart already exists, destroy it to prevent overlap.
  if (window.exchangeChartInstance) {
    window.exchangeChartInstance.destroy();
  }
   /**Creates a new Chart.js line chart:
     type: 'line': Line chart.
     data: Uses the labels (dates) and datasets (rates).
     options:
      responsive: true: Chart resizes with window.
      plugins.title: Shows a title with the base currency.
      tooltip: Shows tooltips for data points.
      interaction: Nearest point on x-axis is highlighted.
      scales: X and Y axes have titles */
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
  //the toggle method add the css class dark-mode if not applied else remove it
  const isDark = document.body.classList.toggle("dark-mode");//return a boolean (true) if class dark-mode added otherwise (false)
  localStorage.setItem("mode", isDark ? "dark" : "light");//save user prefernce in the localstorage under (mode) name
  document.getElementById("mode-btn").textContent = isDark
    ? "Switch to Light Mode"
    : "Switch to Dark Mode";
}

//validation on getting the button id & stores it in modeBtn 
//on page loades checkes if user previously selected dark mode
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
