import { useState, useEffect, useRef } from 'react';
import { Particle } from './Particle'

const ParticleSystem = ({ myImage, filigrana, dim }) => {
  const image = new Image();
  const [particlesArray, setParticlesArray] = useState([]);
  const canvasRef = useRef(null);

  function calculateRelativeBrightness(red, green, blue) {
    return (
      (Math.sqrt(red * red * 0.299 + green * green * 0.587 + blue * blue * 0.114)) / 100
    );
  }

  // function random(min, max) {
  //   return Math.floor(Math.random() * (max - min + 1)) + min;
  // }

  useEffect(() => {
    const animate = () => {
      if (canvasRef) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
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
    }
    animate();
  }, [particlesArray])

  useEffect(() => {

    if (!canvasRef) return;
    if (!myImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 1000;
    canvas.height = 700;
    image.src = myImage;

    const handleLoadImage = () => {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      //ctx.clearRect(0, 0, canvas.width, canvas.height);

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
      const numberOfParticles = 1000;
      const newParticlesArray = [];
      for (let i = 0; i < numberOfParticles; i++) {
        newParticlesArray.push(new Particle(canvas, ctx, mappedImage, filigrana, dim));
      }
      setParticlesArray(newParticlesArray);
    }
    image.addEventListener('load', handleLoadImage);
    return () => {
      image.removeEventListener('load', handleLoadImage);
    }
  }, []);

  return <canvas id="canvas1" ref={canvasRef} />;
};

export default ParticleSystem;