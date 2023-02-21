//Access token
const access_key = 'pk.eyJ1IjoiZmVkZXJpY2F6ZSIsImEiOiJjbGU3ZnVtdGIwNTI1M3drYjNsZmI2dXFqIn0.iuLx-zbshEuL8xarAB3pQw';

//Mapbox style
const style = "mapbox://styles/federicaze/clebipzey000101n3s0nzzzhi";

// Options for map
const options = {
  lat: 30.189634,
  lng: 25.464194,
  zoom: 2,
  style: style,
};

let selectedPoI = null;

// Create an instance of MapboxGL
const mappa = new Mappa('MapboxGL', access_key);
let myMap;
var poiPoints = [];
var data;
var overCity = false;

//
function preload() {
  data = loadJSON("features.json");
}

function mouseClicked() {
  // Determina se il clic è avvenuto su una delle istanze di PoI.
  for (let i = 0; i < poiPoints.length; i++) {
    if (poiPoints[i].isSelected(mouseX, mouseY, myMap.zoom())) {
      poiPoints[i].mouseClicked(mouseX, mouseY);
    }
  }
}


var loaded = false;

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  // Create a tile map and overlay the canvas on top.
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);
    // if (myMap.ready && !loaded) {
    loadPoiCoord();
  // }
}

function draw() {
  background(51);
  clear();

  textSize(28);
  fill(255, 255, 255, 70);
  stroke(255);
  textFont('Gloock');
  text('Click on a city to Feel the Data!', 10, 30);

  if (loaded) {
    for (let i = 0; i < poiPoints.length; i++) {
      var pos = myMap.latLngToPixel(poiPoints[i].lat, poiPoints[i].lng);
      fill(255);
      ellipse(pos.x, pos.y, myMap.zoom()*2, myMap.zoom()*2);
      poiPoints[i].updatePos(pos.x, pos.y, myMap.zoom());
      poiPoints[i].over(mouseX, mouseY, myMap.zoom());
      poiPoints[i].show();
    }
  }
}

function loadPoiCoord() {
  var pois = data['features']; // Create an object that contains the features.
  //iterate trough the pois object. If it contains a PoI transform the latitude and longitude to pixels, and create a new instance of the class PoI
  for (let i = 0; i < pois.length; i++) {
    if (pois[i].properties.place_name) {
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
        pois[i].properties.place_name
      );
      poiPoints.push(poi);
    }
    loaded = true;
  }

}
