import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import Mappa from 'mappa-mundi';
import data from './features.json';

const access_key = 'pk.eyJ1IjoiZmVkZXJpY2F6ZSIsImEiOiJjbGU3ZnVtdGIwNTI1M3drYjNsZmI2dXFqIn0.iuLx-zbshEuL8xarAB3pQw';
const style = 'mapbox://styles/federicaze/cle7ggjxk002j01qldo0aupi9';
const options = {
  lat: 55.615,
  lng: 12.421,
  zoom: 5,
  style: style
};

const Map = () => {

  const [myP5, setMyP5] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    setMyP5(new p5(Sketch, mapRef.current));
  },[])

  const Sketch = (p) => {
    let myMap;
    let poiPoints = [];
  
    p.load = () => {
      p.loadJSON(data);
    };
  
    p.setup = () => {
      const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
      myMap = new Mappa('MapboxGL', access_key);
      myMap.tileMap(options);
      myMap.overlay(canvas);
    };
  
    const loadPoiCoord = () => {
      const pois = data.features;
      for (let i = 0; i < pois.length; i++) {
        if (pois[i].properties.wikidata) {
          const pos = myMap.latLngToPixel(pois[i].geometry.coordinates[1], pois[i].geometry.coordinates[0]);
          const poi = new PoI(
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
      }
    };
  
    p.draw = () => {
      p.clear();
      if (myMap.ready && poiPoints.length === 0) {
        loadPoiCoord();
      }
      if (poiPoints.length > 0) {
        for (let i = 0; i < poiPoints.length; i++) {
          const pos = myMap.latLngToPixel(poiPoints[i].lat, poiPoints[i].lng);
          poiPoints[i].updatePos(pos.x, pos.y, myMap.zoom());
          poiPoints[i].over(p.mouseX, p.mouseY);
          poiPoints[i].show();
        }
      }
    }
  
    class PoI {
      constructor(lat, lng, x, y, w, h, title) {
        this.lat = lat; //Note that in geojson notation longitude comes first, not latitude as usual.
        this.lng = lng;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.title = title;
      }
  
      over(px, py) {
        let d = p.dist(px, py, this.x, this.y);
        if (d < this.w) {
          this.y = this.y - 10;
          p.textSize(12);
          p.fill(50);
          p.text(this.title, this.x, this.y);
        }
      }
  
      show() {
        p.stroke(255);
        //fill(color);
        p.imageMode(p.CENTER);
        //image(icon,this.x,this.y-this.h/2,this.w,this.h);
  
      }
  
      updatePos(_x, _y, _zoom) {
        //adjust if map is moved
        let zoomExpWidth = p.map(_zoom, 0, 22, 0, 5);
        let zoomExpHeight = p.map(_zoom, 0, 22, 0, 5);
        this.x = _x;
        this.y = _y;
        this.w = p.exp(zoomExpWidth);
        this.h = p.exp(zoomExpHeight);
      }
    }
  };

  return (
    <div className = "map-component" ref = {mapRef}>
    </div>
  )
}

export default Map;
