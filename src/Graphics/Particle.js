

export class Particle {
    constructor(canvas, ctx, mappedImage, filigrana, dim) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.canvas = canvas;
      this.speed = 0;
      this.mappedImage = mappedImage;
      this.ctx = ctx;
      this.velocity = Math.random() * filigrana;
      //Più è grande filigrana più l'immagine è fitta, 0.01 <= filigrana <= 20 è ok
      this.size = Math.random() * 1.5 + dim;
      this.position1 = Math.floor(this.y);
      this.position2 = Math.floor(this.x);
      this.angle = 0;
    }
  
    update() {
      this.position1 = Math.floor(this.y);
      this.position2 = Math.floor(this.x);
  
      if ((this.mappedImage[this.position1]) &&
        (this.speed = this.mappedImage[this.position1][this.position2])) {
        this.speed = this.mappedImage[this.position1][this.position2].cellBrightness;
      }
      let movement = (2.5 - this.speed) + this.velocity;
      //this.angle+=0.2;
      this.angle += this.speed/10;
  
      // For vertical top-down movement
      this.y += movement + Math.sin(this.angle) * 2;
      this.x += movement + Math.cos(this.angle) * 1;
      if (this.y >= this.canvas.height) {
        //this.y = 0;
        this.y = Math.random() * this.canvas.height;
        this.x = Math.random() * this.canvas.width;
      }
  
      // // For vertical down-top movement
      // this.y -= movement + Math.cos(this.angle) * 2;
      // if (this.y <= 0) {
      //   //this.y = 0;
      //   this.y = Math.random() * canvas.height;
      //   this.x = Math.random() * canvas.width;
      // }
  
  
  
      //For orizontal left-right movement
      //We can also add Math.sin(this.angle)*2 to this.x, but it could be lag a lot
      // this.x += movement;
      if (this.x >= this.canvas.width) {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
      }
    }
  
    draw(r, g, b) {
      this.ctx.beginPath();
  
      if ((this.mappedImage[this.position1]) &&
        (this.speed = this.mappedImage[this.position1][this.position2])) {
        //ctx.fillStyle = 'rgb('+r+','+g+','+b+')';
        this.ctx.fillStyle = this.mappedImage[this.position1][this.position2].cellColor;
      }
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 0.3);
      this.ctx.fill();
    }
}