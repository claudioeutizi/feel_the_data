const urlParams = new URLSearchParams(window.location.search);
const city = urlParams.get('city');
const myImage = new Image();

myImage.src = cities.find(c => c.name === city).imgSrc;

/*---------------------------------------------------------------------------------------*/
var filigrana = 0;
var dim = 6;
var raggio = 0.4;
var val = true;

let particleAngle = Math.PI;
let particleVelocity = 0;
let valpollution = 0;
let valoriOttenuti = false;

let loadingIndicator = document.getElementById("loading");

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Every 5 seconds  val became true or false

function setGraphicParameters(data) {
    console.log("wind speed " + data["weather"].wind.speed);
    particleAngle = data["weather"].wind.deg * (Math.PI / 180);
    console.log("wind degrees " + data["weather"].wind.deg);
    particleVelocity = data["weather"].wind.speed;

    pm10 = data["pollution"].list[0].components.pm10;
    if (pm10 > 160) pm10 = 160;
    valpollution = mapValue(pm10, 0, 160, 0, 1);
    console.log(valpollution);

    no2 = data["pollution"].list[0].components.no2;
    if (no2 > 350) no2 = 350;
    filigrana = mapValue(no2, 0, 350, 0.5, 7);
    console.log(filigrana);

    Tone.Transport.start();

    valoriOttenuti = true;
    //loadingIndicator.textContent = "";
    console.log("fine set graphic");
}

/*
setInterval(function() {
    val = !val;
  }, 10000);
  */

myImage.addEventListener('load', function () {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    ctx.drawImage(myImage, (canvas.width / 2) - (myImage.width / 2) - 25, 0, myImage.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let particlesArray = [];
    //Max 10000, Min 1000
    const numberOfParticles = 3000;
    let noise = new perlinNoise3d();
    let noiseValue = 0;
    let angle;

    let mappedImage = [];

    for (let y = 0; y < canvas.height; y++) {
        let row = [];
        for (let x = 0; x < canvas.width; x++) {
            const red = pixels.data[(y * 4 * pixels.width) + (x * 4)];
            const green = pixels.data[(y * 4 * pixels.width) + (x * 4 + 1)];
            const blue = pixels.data[(y * 4 * pixels.width) + (x * 4 + 2)];
            const brightness = calculateRelativeBrightness(red, green, blue);

            const cell = [
                cellBrightness = brightness,
                cellColor = 'rgb(' + red + ',' + green + ',' + blue + ')',
            ];

            row.push(cell);
        }
        mappedImage.push(row);
    }

    function calculateRelativeBrightness(red, green, blue) {
        return Math.sqrt(
            (red * red) * 0.299 +
            (green * green) * 0.587 +
            (blue * blue) * 0.114
        ) / 100;
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
            this.noiseScale = 0.01;
            this.noiseOffset = Math.random() * 1000;
        }


        update() {
            this.position1 = Math.floor(this.y);
            this.position2 = Math.floor(this.x);

            if ((mappedImage[this.position1]) &&
                (this.speed = mappedImage[this.position1][this.position2])) {
                this.speed = mappedImage[this.position1][this.position2][0];
            }

            noiseValue = noise.get(this.x * this.noiseScale, this.y * this.noiseScale, this.noiseOffset);

            // Calculate the new position of the particle based on the noise value
            angle = noiseValue * Math.PI * 2 * valpollution;

            //Set velocity and size 
            this.velocity = particleVelocity * filigrana;//Math.random() ;
            this.size = Math.random() * 1.5 + dim;

            let movement = (2.5 - this.speed) + this.velocity;
            this.angle++;

            this.x -= movement * Math.cos(angle + particleAngle);
            this.y -= movement * Math.sin(angle + particleAngle);


            // For vertical bottom-up movement
            //this.y -= movement * Math.sin(particleAngle);// + Math.sin(this.angle)*20;

            if (this.y <= 0 || this.y >= canvas.height) {
                //this.y = 0;
                this.y = Math.random() * canvas.height;
                this.x = Math.random() * canvas.width;
            }

            //For orizontal left-right movement
            //We can also add Math.sin(this.angle)*2 to this.x, but it could be lag a lot
            //this.x += movement * Math.cos(particleAngle); //+ Math.sin(this.angle/(1/this.velocity))*2;

            if (this.x >= canvas.width || this.x <= 0) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            }
        }

        draw() {
            ctx.font = "24px Arial";

            if (valoriOttenuti) {
                ctx.beginPath();

                if ((mappedImage[this.position1]) &&
                    (this.speed = mappedImage[this.position1][this.position2])) {
                    //ctx.fillStyle = 'rgb('+r+','+g+','+b+')';
                    ctx.fillStyle = mappedImage[this.position1][this.position2][1];
                }
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * raggio);
                ctx.fill();
            } else {

                ctx.fillStyle = "white";

                ctx.fillText("As people, not only are we starting to see the impact", (canvas.width / 2) - 250, canvas.height / 2);
                ctx.fillText("of our actions on our planet, but it’s becoming impossible to deny it...", (canvas.width / 2) - 350, canvas.height / 2 + 50);
            }
        }
    }

    function init() {
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle);
        }
    }

    init();

    function animate() {
        //ctx.drawImage(myImage,0,0,canvas.width,canvas.height);
        ctx.globalAplha = 0.05;
        ctx.fillStyle = 'rgb(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAplha = 0.2;
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        requestAnimationFrame(animate);

    }
    animate();

});

