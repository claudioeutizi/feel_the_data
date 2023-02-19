class PoI {
  constructor(lat,lng, x, y, w, h, title) {
    this.lat = lat; //Note that in geojson notation longitude comes first, not latitude as usual.
    this.lng = lng;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.title = title;
  }

  over(px, py) {
    let d = dist(px, py, this.x, this.y);
    if (d < this.w) {
      this.y = this.y-10;
      textSize(12);
      fill(50);
      text(this.title,this.x,this.y);
    }
  }

  show() {
    stroke(255);
    //fill(color);
    imageMode(CENTER);
    //image(icon,this.x,this.y-this.h/2,this.w,this.h);

  }

  updatePos(_x, _y, _zoom) {
    //adjust if map is moved
    let zoomExpWidth = map(_zoom,0,22,0,5);
    let zoomExpHeight = map(_zoom,0,22,0,5);
    this.x = _x;
    this.y = _y;
    this.w = exp(zoomExpWidth);
    this.h = exp(zoomExpHeight);

  }

}
