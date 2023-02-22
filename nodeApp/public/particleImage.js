const urlParams = new URLSearchParams(window.location.search);
const city = urlParams.get('city');
const myImage = new Image();
myImage.crossOrigin = "Anonymous";
//myImage.src = "duomo.png";

const epicStrings = [
    "As people, not only are we starting to see the impact",
    "of our actions on our planet, but it’s becoming impossible to deny it...",
    "You never change things by fighting the existing reality. ",
    "To change something, build a new model that makes the existing model obsolete.",
    "Climate change is real. It is happening right now, it is the most urgent threat facing,",
    "our entire species and we need to work collectively together and stop procrastinating.",
    "We don’t have time to sit on our hands as our planet burns. For young people,",
    " climate change is bigger than election or re-election. It’s life or death."
];

/*---------------------------------------------------------------------------------------*/
var filigrana = 0;
//var dim = 3;
var dim = 0.3;
var raggio = 0.4;
var val = true;
var epics = 0;
var biggo = true;

var deltaTemp = 0;
var deltaTempMax = 0;
var deltaTempMin = 0;

let particleAngle = Math.PI;
let particleVelocity = 0;
let valpollution = 0;
let valoriOttenuti = false;
let imageGeneration = false;

let loadingIndicator = document.getElementById("loading");

function roundTo5(num) {
    return Math.round(num * 100000) / 100000;
  }

function getRandomValue(value1, value2, value3, value4) {
    const values = [value1, value2, value3, value4];
    const randomIndex = Math.floor(Math.random() * values.length);
    return values[randomIndex];
  }

/* Selection of strings to print out */
epics = getRandomValue(0,2,4,6);

/*Function that returns a random value between min number and max number*/
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*Function that returns a random value between treu and false*/
function getRandomBoolean() {
    return Math.random() < 0.5;
  }

function buccoliComanducci(min,max) {
    if(biggo && dim <=max){
        dim = dim + 0.00001;
    }else if(biggo && dim > max){
        biggo = false;
        console.log(biggo);
    } else if(!biggo && dim >=min){
        dim = dim - 0.00001;
    }else if(!biggo && dim < min){
        biggo = true;
        console.log(biggo);
    }
  }

function setImage(OWdata){
    
    console.log(OWdata["pollution"].list[0].main.aqi);

    switch (OWdata["pollution"].list[0].main.aqi) {
        case 1:
            pollutionString = "unpolluted, pure air, realistic";
            break;
        case 2:
            pollutionString = "trees, realistic";
            break;
        case 3:
            pollutionString = "realistic";
            break;
        case 4:
            pollutionString = "slightly polluted";
            break;
        case 5: 
            pollutionString = "very polluted";
            break;
        default:
            break;
    }

    id = OWdata["weather"].weather[0].id;

    if(id == 800){
        //clear
        weatherString = "in a sunny day";
      } else if(id >= 200 && id <= 232){
        //thunderstorm
        weatherString = "in a thunderstorm";
      } else if(id >= 500 && id <= 531){
        //rain
        weatherString = "in a rainy day";
      } else if(id >= 600 && id <= 622){
        //snow
        weatherString = "in a snowy day";
      } else if(id >= 701 && id <= 781){
        //atmosphere
        weatherString = "in a misty day";
      } else if(id >= 300 && id <= 321){
        //drizzle
        weatherString = "in a drizzle";
      } else if(id >= 801 && id <= 804){
        //clouds
        weatherString = "in a cloudy day";
      }
    
      promptString = "a famous monument of " + city + " " + weatherString + " " + pollutionString;

    dalleData = JSON.stringify({
        prompt: promptString,
        n: 1,
        size: "1024x1024"
      });
    
    imageGeneration = true;

    postData('https://api.openai.com/v1/images/generations')
    .then((data) => {
        console.log(data.error);
        if(data.error){
            console.log("Error loading image");
            
            console.log("./images/" + city + ".jpg");
            myImage.src = "./images/" + city + ".jpg";
            console.log(myImage);
        } else {
            myImage.src = data["data"][0]["url"];
            console.log("URL retrieved: " + data["data"][0]["url"]); // JSON data parsed by `data.json()` call
        }
        valoriOttenuti = true;
        //la generazione/set dell'immagine fa partire musica e finire il caricamento
        Tone.Transport.start();
    });
}

function setGraphicParameters(data) {
    console.log("wind speed " + data["weather"].wind.speed);
    particleAngle = data["weather"].wind.deg * (Math.PI / 180);
    console.log("wind degrees " + data["weather"].wind.deg);
    particleVelocity = data["weather"].wind.speed;

    /* Dimension of particles depends on the weather: closer to max temperture means huge dimension */
    
    dim = roundTo5(mapValue(data["weather"].main.temp, data["weather"].main.temp_min, data["weather"].main.temp_max, 1, 20));
    deltaTemp = Math.abs(roundTo5(mapValue(data["weather"].main.feels_like,data["weather"].main.temp_min,data["weather"].main.temp_max,1,20)));
    deltaTempMax = dim + deltaTemp;
    deltaTempMin = dim - deltaTemp;
    console.log("Delta temp " + deltaTemp);
    if(deltaTempMax>20){deltaTempMax = 20;}
    if(deltaTempMin<1){deltaTempMin = 1;}
    biggo = getRandomBoolean();

    console.log("Biggo = "+biggo);
    
    console.log("MIN TEMP " + data["weather"].main.temp_min);
    console.log("MAX TEMP " + data["weather"].main.temp_max);
    console.log("dim: "+dim+" DeltaT: "+deltaTemp+" DMIN: "+deltaTempMin+" DMAX: "+deltaTempMax);
    /*------------------------------------------------------------------------------------------------*/

    pm10 = data["pollution"].list[0].components.pm10;
    if (pm10 > 160) pm10 = 160;
    valpollution = mapValue(pm10, 0, 160, 0, 1);
    console.log("perlin noise: " + valpollution);

    no2 = data["pollution"].list[0].components.no2;
    if (no2 > 350) no2 = 350;
    filigrana = mapValue(no2, 0, 350, 0.5, 7);
    console.log("filigrana: " + filigrana);
    
    if(!imageGeneration) setImage(data);
}

const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth-20;
canvas.height = window.innerHeight-20;

ctx.fillStyle = 'rgb(0, 0, 0, 50)';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.globalAplha = 0.2;
ctx.fill();

ctx.fillStyle = "white";
ctx.font = "30px Gloock";
ctx.fillText(epicStrings[epics], (canvas.width / 2)-500, canvas.height / 2);
ctx.fillText(epicStrings[epics+1], (canvas.width / 2)-450, canvas.height / 2 + 50);

myImage.addEventListener('load', function () {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    ctx.drawImage(myImage, (canvas.width / 2) - (canvas.height / 2) - 25, 0, canvas.height, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Otteniamo il riferimento al canvas e al contesto
    var back2Map = document.getElementById('canvas1');

    // Definiamo la posizione e le dimensioni dell'area cliccabile
    var areaIndietro = { x: 0, y: 0, w: 150, h: 50 };

    // Aggiungiamo un listener per l'evento click del mouse
    back2Map.addEventListener("click", function(event) {
    // Otteniamo le coordinate del click all'interno del canvas
    var rect = canvas.getBoundingClientRect();
    var mouseX = event.clientX - rect.left;
    var mouseY = event.clientY - rect.top;
    // Verifichiamo se il click è avvenuto all'interno dell'area cliccabile
    if (mouseX >= areaIndietro.x && mouseX <= areaIndietro.x + areaIndietro.w &&
          mouseY >= areaIndietro.y && mouseY <= areaIndietro.y + areaIndietro.h) {
        // Se sì, ritorniamo alla pagina precedente
        window.history.back();
    }

});
    
    let particlesArray = [];
    //Max 10000, Min 1000
    const numberOfParticles = 3500;
    let noise = new perlinNoise3d();
    let noiseValue = 0;
    let angle;
    ctx.font = "24px Arial";
    let mappedImage = [];
    let movement = 0;

    for (let y = 0; y < canvas.height; y++) {
        let row = [];
        for (let x = 0; x < canvas.width; x++) {
            const red = pixels.data[(y * 4 * pixels.width) + (x * 4)];
            const green = pixels.data[(y * 4 * pixels.width) + (x * 4 + 1)];
            const blue = pixels.data[(y * 4 * pixels.width) + (x * 4 + 2)];
            const brightness = calculateRelativeBrightness(red, green, blue);

            const cell = [
                cellBrightness = brightness,
                //cellColor = 'rgb(' + red + ',' + green + ',' + blue + ')',
                cellColor = 'rgb(' + red + ',' + green + ',' + blue + ')',
            ];

            row.push(cell);
        }
        mappedImage.push(row);
    }

    /* Compute the values of brightness of rgb color perceived by the human eye */
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
            this.size = Math.random() * 1.5 + dim;
            this.position1 = Math.floor(this.y);
            this.position2 = Math.floor(this.x);
            this.angle = 0;
            this.noiseScale = 0.01;
            this.noiseOffset = Math.random() * 1000;
        }


        update() {

            buccoliComanducci(deltaTempMin,deltaTempMax);

            this.position1 = Math.floor(this.y);
            this.position2 = Math.floor(this.x);

            if ((mappedImage[this.position1]) &&
                (this.speed = mappedImage[this.position1][this.position2])) {
                this.speed = mappedImage[this.position1][this.position2][0];
            }

            noiseValue = noise.get(this.x * this.noiseScale, this.y * this.noiseScale, this.noiseOffset);

            /*Calculate the new position of the particle based on the noise value*/
            angle = noiseValue * Math.PI * 2 * valpollution;

            /*Set velocity and size*/
            this.velocity = particleVelocity * filigrana;//Math.random() ;
            this.size = Math.random() * 1.5 + dim;

            movement = (2.5 - this.speed) + this.velocity;
            this.angle++;

            this.x -= movement * Math.cos(angle + particleAngle);
            this.y -= movement * Math.sin(angle + particleAngle);
            

            /* For vertical bottom-up movement */
            //this.y -= movement * Math.sin(particleAngle);// + Math.sin(this.angle)*20;

            if (this.y <= 0 || this.y >= canvas.height) {
                this.y = Math.random() * canvas.height;
                this.x = Math.random() * canvas.width;
            }

            /* 
            For orizontal left-right movement.
            We can also add Math.sin(this.angle)*2 to this.x, but it could be lag a lot.
            */
            //this.x += movement * Math.cos(particleAngle); //+ Math.sin(this.angle/(1/this.velocity))*2;

            if (this.x >= canvas.width || this.x <= 0) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            }

        }

        draw() {
            if (valoriOttenuti) {
                //ctx.drawImage(myImage,  (canvas.width / 2) - (canvas.height / 2) - 25, 0,0,canvas.height,canvas.height);
                
                ctx.beginPath();

                if ((mappedImage[this.position1]) &&
                    (this.speed = mappedImage[this.position1][this.position2])) {
                    ctx.fillStyle = mappedImage[this.position1][this.position2][1];
                }
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * raggio);
                ctx.fill();
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

        /* Animation for back2map button" */
        setTimeout(() => {
            ctx.fillStyle = "black";
            ctx.fillRect(areaIndietro.x, areaIndietro.y, areaIndietro.w, areaIndietro.h);
            ctx.font = "20px Gloock";
            ctx.fillStyle = "white";
            ctx.fillText("BACK TO MAP", areaIndietro.x + 10, areaIndietro.y + 30);
        }, 3000);
        /*---------------------*/
        
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

