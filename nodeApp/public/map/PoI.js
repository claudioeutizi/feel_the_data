class PoI {
  constructor(lat, lng, x, y, w, h, place) {
    this.lat = lat; //Note that in geojson notation longitude comes first, not latitude as usual.
    this.lng = lng;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.place = place;
  }

  over(px, py, zoom) {
    let d = dist(px, py, this.x, this.y);
    if (d < this.w + 5) {
      this.y = this.y - 10;
      textSize(25);
      textFont('Gloock');
      fill(150);
      stroke(255);
      ellipse(px, py, zoom*10, zoom*10);
      text(this.place, this.x + 10, this.y);
      if (this.isSelected(px, py, zoom)) {
        selectedPoI = this;
      }
    }else{
      /* For "Click on a city to Feel the Data!" font */
      textFont('Gloock');
      stroke(0);
    }
  }

  isSelected(px, py, zoom) {
    let d = dist(px, py, this.x, this.y);
    if (d < this.w + 5) {
      return true;
    } else {
      return false;
    }   
}

  show() {
    fill(255);
    imageMode(CENTER);
    //image(icon,this.x,this.y-this.h/2,this.w,this.h);
  }

  mouseClicked() {
    window.location.href = `/city.html?lat=${this.lat}&lng=${this.lng}&city=${this.place.split(",")[0]}`;
  }

  isSelected(px, py, zoom) {
    let d = dist(px, py, this.x, this.y);
    return d < (this.w + 5) * zoom;
  }
  

  updatePos(_x, _y, _zoom) {
    //adjust if map is moved
    let zoomExpWidth = map(_zoom, 0, 22, 0, 5);
    let zoomExpHeight = map(_zoom, 0, 22, 0, 5);
    this.x = _x;
    this.y = _y;
    this.w = exp(zoomExpWidth);
    this.h = exp(zoomExpHeight);
  }
}
