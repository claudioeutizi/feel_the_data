const lat = parseFloat(urlParams.get('lat'));
const lng = parseFloat(urlParams.get('lng'));
const timeout = 100;  //milliseconds
var weather, pollution;

/*- - - - - - - - Functions - - - - - - - - */

// Function that creates the URL for get the data from OpenWeather
// inputs: index = 0 for weather, other for pollution; l1 = latitude; l2 = longitude
// return: string of url
function getURLFromOpenWeather(index, lati, long) {
  // index == 0 for weather, index 1= 0 for pollution
  var api;
  var url;
  if (index == 0) {
    api = 'https://api.openweathermap.org/data/2.5/weather?';
  } else {
    api = 'https://api.openweathermap.org/data/2.5/air_pollution?';
  }
  var latitude = 'lat=' + lati;
  var longitude = '&lon=' + long;
  var city = latitude + longitude;
  var apiKey = '&appid=dc36bb48e82a90d6e689af6a87acdb60';
  //or
  //var apiKey = 'eee14d518f12c7d04a5f226ee1292c16';
  var units = '&units=metric';
  url = api + city + apiKey + units;
  return url;
}

// Function that save the json of weather in the global varaible weather
function renderWeather(w) { weather = w; }

// Function that save the json of pollution in the global varaible pollution
function renderPollution(p) { pollution = p; }

// Function for fetch the json of weather
function fetchWeather() {
  var url = getURLFromOpenWeather(0, lat, lng);
  fetch(url)
    .then((response) => response.json())
    .then((data) => renderWeather(data));
}

// Function for fetch the json of pollution
function fetchPollution() {
  var url = getURLFromOpenWeather(1, lat, lng);
  fetch(url)
    .then((response) => response.json())
    .then((data) => renderPollution(data));
}

// Function for fetch the jsons of weather and pollution and save them into global varaibles
function getDataFromOpenWeatherSupremo() {
  fetchWeather();
  fetchPollution();
}

// Function that sets a delay time of 'timeout' milliseconds
function delay() {
  return new Promise(function (resolve) {
    setTimeout(resolve, timeout);
  });
}

// Function for the setup of the global variables
async function mainOpenWeather() {

  /*------------------------------*/
  /* First phase : setup */

  //Getting data from Openweather
  getDataFromOpenWeatherSupremo();

  //Wait for some milliseconds until the variables are not undefined
  while (weather == undefined || pollution == undefined) { await delay(); }

  //Ready to move one
  console.log("Ready to go!!!");
  /*------------------------------*/

  /* Second phase */
  returned_data = {
    "weather": weather,
    "pollution": pollution
  /*------------------------------*/
  }

  return returned_data;
}
