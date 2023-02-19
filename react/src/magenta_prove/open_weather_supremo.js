
const timeout = 100;  //milliseconds
var weather,pollution;

//Milan

var la = 45.464664;
var lo = 9.188540;


//London

//var la = 51.507351;
//var lo = -0.127758;

var a,b,c;

/*- - - - - - - - Functions - - - - - - - - */

// Function that creates the URL for get the data from OpenWeather
// inputs: index = 0 for weather, other for pollution; l1 = latitude; l2 = longitude
// return: string of url
function getURLFromOpenWeather(index,l1,l2){
  // index == 0 for weather, index 1= 0 for pollution
    var api;
    var url; 
    if(index == 0)
    {
      api = 'https://api.openweathermap.org/data/2.5/weather?';
    }else{
      api = 'https://api.openweathermap.org/data/2.5/air_pollution?';
    }
    var latitude = 'lat='+l1;
    var longitude = '&lon='+l2;
    var city = latitude+longitude;
    var apiKey = '&appid=dc36bb48e82a90d6e689af6a87acdb60';
    //or
    //var apiKey = 'eee14d518f12c7d04a5f226ee1292c16';
    var units = '&units=metric';
    url = api+city+apiKey+units;
    return url;  
  }

// Function that save the json of weather in the global varaible weather
function renderWeather(w){weather = w;}

// Function that save the json of pollution in the global varaible pollution
function renderPollution(p){pollution=p;}

// Function for fetch the json of weather
function fetchWeather(){
  var url = getURLFromOpenWeather(0,la,lo);
  fetch(url)
  .then((response)=>response.json())
  .then((data)=> renderWeather(data));
}

// Function for fetch the json of pollution
function fetchPollution(){
  var url = getURLFromOpenWeather(1,la,lo);
  fetch(url)
  .then((response)=>response.json())
  .then((data)=> renderPollution(data));
}

// Function for fetch the jsons of weather and pollution and save them into global varaibles
function getData(){
  fetchWeather();
  fetchPollution();
}

// Function that sets a delay time of 'timeout' milliseconds
function delay(){
  return new Promise(function(resolve){
      setTimeout(resolve,timeout);
  });
}

// Function for the setup of the global variables
async function mainOpenWeather(){

  /*------------------------------*/
  /* First phase : setup */

  //Getting data from Openweather
  getData();

  //Wait for some milliseconds until the variables are not undefined
  while(weather == undefined || pollution == undefined){await delay();}

  //Ready to move one
  console.log("Ready to go!!!");
  /*------------------------------*/

  /* Second phase */
  /*------------------------------*/
  //console.log(weather);
  //console.log(pollution);
  /*------------------------------*/
  returned_data = {
    "weather": weather,
    "pollution": pollution
  }

  return returned_data;
}


/*- - - - Main - - - -*/
//mainFunction();