//Access token
const access_key = 'pk.eyJ1IjoiZmVkZXJpY2F6ZSIsImEiOiJjbGU3ZnVtdGIwNTI1M3drYjNsZmI2dXFqIn0.iuLx-zbshEuL8xarAB3pQw';

//Mapbox style
const style = "mapbox://styles/federicaze/cle7ggjxk002j01qldo0aupi9";

// Options for map
const options = {
  lat: 55.615,
  lng: 12.421,
  zoom: 5,
  style: style,
};

// Create an instance of MapboxGL
const mappa = new Mappa('MapboxGL', access_key);
let myMap;
var poiPoints = [];
var data;

//
function preload() {
  data = loadJSON("features.json");
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  // Create a tile map and overlay the canvas on top.
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);
}

var loaded = false;

function draw() {
 clear();
  if (myMap.ready && !loaded) {
    loadPoiCoord();
  }
  if (loaded) {
    for(let i=0; i<poiPoints.length; i++){
      var pos = myMap.latLngToPixel(poiPoints[i].lat, poiPoints[i].lng);

      poiPoints[i].updatePos(pos.x,pos.y, myMap.zoom());
      poiPoints[i].over(mouseX,mouseY);
      poiPoints[i].show();

    }
  }
}


function loadPoiCoord() {
  var pois = data['features']; // Create an object that contains the features.
  //iterate trough the pois object. If it contains a PoI transform the latitude and longitude to pixels, and create a new instance of the class PoI
  for (let i = 0; i < pois.length; i++) {
    if (pois[i].properties.wikidata) {
      var pos = myMap.latLngToPixel(pois[i].geometry.coordinates[1], pois[i].geometry.coordinates[0]);

      // Creates an instance of PoI with the position data of every point fro the data
      var poi = new PoI(
        //lat, lng, x, y, w, h, title
        pois[i].geometry.coordinates[1],
        pois[i].geometry.coordinates[0],
        pos.x,
        pos.y,
        pos.w,
        pos.h,
        pois[i].properties.wikidata
      );
      poiPoints.push(poi);
    }
    loaded = true;
  }
}
