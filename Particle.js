class Particle {
    constructor(x, y, c) {
      this.pos = createVector(x, y);
      this.color = c;
      this.size = 2;
      this.brightness = brightness(color(this.color));
      this.z = map(this.brightness, 0, 255, -100, 100);
    }
  
    draw() {
      push();
      translate(this.pos.x, this.pos.y, this.z);
      fill(this.color);
      ellipse(0, 0, this.size, this.size);
      pop();
    }
  }