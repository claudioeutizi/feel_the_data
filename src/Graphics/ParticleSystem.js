import { useState, useEffect, useRef } from 'react';

const ParticleSystem = ({ myImage }) => {
  const filigrana = 1;
  const dim = 5;
  const [particlesArray, setParticlesArray] = useState([]);
  const image = new Image();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef) return;
    if (!myImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 1000;
    canvas.height = 700;

    image.src = myImage;
    image.onload = () => {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let mappedImage = [];
      for (let y = 0; y < canvas.height; y++) {
        let row = [];
        for (let x = 0; x < canvas.width; x++) {
          const red = pixels.data[y * 4 * pixels.width + x * 4];
          const green = pixels.data[y * 4 * pixels.width + x * 4 + 1];
          const blue = pixels.data[y * 4 * pixels.width + x * 4 + 2];
          const brightness = calculateRelativeBrightness(red, green, blue);

          const cell = {
            cellBrightness: brightness,
            cellColor: 'rgb(' + red + ',' + green + ',' + blue + ')',
          };

          row.push(cell);
        }
        mappedImage.push(row);
      }

      function calculateRelativeBrightness(red, green, blue) {
        return (
          (Math.sqrt(red * red * 0.299 + green * green * 0.587 + blue * blue * 0.114)) / 100
        );
      }

      function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      class Particle {
        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.speed = 0;
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

          if ((mappedImage[this.position1]) &&
            (this.speed = mappedImage[this.position1][this.position2])) {
            this.speed = mappedImage[this.position1][this.position2].cellBrightness;
          }

          let movement = (2.5 - this.speed) + this.velocity;
          this.angle++;
          //this.angle+=0.2;
          //this.angle += this.speed/10;


          // For vertical top-down movement
          /*
          this.y += movement+Math.sin(this.angle)*2;
          if(this.y >= canvas.height){
              //this.y = 0;
              this.y = Math.random() * canvas.height;
              this.x = Math.random() * canvas.width;
          }
          */

          // For vertical down-top movement
          this.y -= movement + Math.sin(this.angle) * 2;
          if (this.y <= 0) {
            //this.y = 0;
            this.y = Math.random() * canvas.height;
            this.x = Math.random() * canvas.width;
          }



          //For orizontal left-right movement
          //We can also add Math.sin(this.angle)*2 to this.x, but it could be lag a lot
          this.x += movement;
          if (this.x >= canvas.width) {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
          }
        }

        draw(r, g, b) {
          ctx.beginPath();

          if ((mappedImage[this.position1]) &&
            (this.speed = mappedImage[this.position1][this.position2])) {
            //ctx.fillStyle = 'rgb('+r+','+g+','+b+')';
            ctx.fillStyle = mappedImage[this.position1][this.position2].cellColor;
          }
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 0.3);
          ctx.fill();
        }
      }

      function init() {
        let tempParticlesArray = [];
        const numberOfParticles = 5000;
        for (let i = 0; i < numberOfParticles; i++) {
          tempParticlesArray.push(new Particle(canvas, mappedImage, random, filigrana, dim));
        }
        setParticlesArray(tempParticlesArray);
      }

      init();

      function animate() {
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = 'rgb(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < particlesArray.length; i++) {
          particlesArray[i].update();
          ctx.globalAlpha = particlesArray[i].speed * 0.5;
          particlesArray[i].draw(255, 255, 255);
        }

        requestAnimationFrame(animate);
      }
      animate();
    }
  }, []);

  return <canvas id="canvas1" ref={canvasRef} />;
};

export default ParticleSystem;