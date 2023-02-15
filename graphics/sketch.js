let particles = [];

let res = 6;

let img;
let imgCpy;

function preload() {
  img = loadImage("duomo.jpg");  
}

function setup() {
  createCanvas(img.width, img.height, WEBGL);
  imgCpy = img;
  sobelFilter(img);
  placeParticles();
  noStroke();
}

function draw() {
  background(0);
  orbitControl();
  translate(-width / 2, -height / 2, 0);
  for(let i = 0; i < particles.length; i++) {
    particles[i].draw();
  } 
}

function placeParticles() {
  for(let i = 0; i < width; i += res) {
    for(let j = 0; j < height; j += res) {
      let x = (i/width) * img.width;
      let y = (j/height) * img.height;
      let c = img.get(x, y);
      let edgeThreshold = 80;
      let edgeIndex = (x + y * img.width) * 4;
      let edgeValue = img.pixels[edgeIndex];
      if (edgeValue > edgeThreshold) {
        let z = map(edgeValue, 0, 255, 0, -height);
        particles.push(new Particle(i, j, c))
      }
    }
  }
}

// Prewitt
/* var xKernel = [
  [-1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1]
]; 
var yKernel = [
  [-1, -1, -1],
  [0, 0, 0],
  [1, 1, 1]
]; */

// Sobel
var xKernel = [
   [1, 0, -1],
   [2, 0, -2],
   [1, 0, -1]
 ];
 var yKernel = [
   [1, 2, 1],
   [0, 0, 0],
   [-1, -2, -1]
];

function sobelFilter(img) {
  img.loadPixels();
  var n = img.width * img.height;
  var sobel_array = new Uint32Array(n);

  // compute the gradient in soble_array
  var index;
  var x, y;
  var xk, yk;
  var xGradient, xMultiplier;
  var yGradient, yMultiplier;
  var pixelValue;
  for (x = 1; x < img.width - 1; x++) {
    for (y = 1; y < img.height- 1; y++) {
      i = x + y * img.width;
      xGradient = 0;
      yGradient = 0;
      for (xk = -1; xk <= 1; xk ++) {
        for (yk = -1; yk <= 1; yk ++) {
          pixelValue = img.pixels[4 * ((x + xk) + (y + yk) * img.width)];
          xGradient += pixelValue * xKernel[yk + 1][xk + 1];
          yGradient += pixelValue * yKernel[yk + 1][xk + 1];
        }
      }
      sobel_array[i] = Math.sqrt(
        Math.pow(xGradient, 2) + Math.pow(yGradient, 2)
      );
    }
  }

  // copy sobel_array to image pixels;
  for (x = 0; x < img.width; x++) {
    for (y = 0; y < img.height; y++) {
      i = x + y * img.width;
      img.pixels[4 * i] = sobel_array[i];
      img.pixels[4 * i + 1] = sobel_array[i];
      img.pixels[4 * i + 2] = sobel_array[i];
    }
  }
  img.updatePixels();
}