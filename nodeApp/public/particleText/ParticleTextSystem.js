let font;
let titlePoints;
let titleBounds;
let subtitlePoints;
let subtitleBounds;
let startTime;

let buttonWidth = 80;
let buttonHeight = 40;
let button;

var showStartButton = 3000; //Milliseconds

function preload() {
    font = loadFont('./../Gloock.ttf');
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    titlePoints = font.textToPoints(
        'FEEL THE DATA', 800, -150, 80, {
        sampleFactor: 0.8,
        simplifyThreshold: 0
    });

    titleBounds = font.textBounds(
        'FEEL THE DATA', 0, 0, 250);

    subtitlePoints = font.textToPoints(
        'A data sonification project.', 300, -300, 50, {
        sampleFactor: 0.5,
        simplifyThreshold: 0
    });

    subtitleBounds = font.textBounds(
        'A data sonification project.', 0, 0, 100);

    cursor(CROSS);
    fill(255, 127);
    noStroke();
    startTime = millis();

    /* Function for draw the start button after showStartButton milliseconds */
    setTimeout(() => {
            button = createButton('START');
            button.id('play-button')
            button.position(windowWidth/2 - 100, windowHeight - windowHeight/4);
            button.style('font-family','Gloock');
            button.style('letter-spacing', 2);
            button.mousePressed();
            
        }, showStartButton);
}

function mousePressed(){
    window.location.href = "/map.html";
}

function draw() {
    noStroke();
    background(27, 24, 24);

    

    let elapsedTime = millis() - startTime;

    let targetAlpha = elapsedTime >= 600 ? 255 : 0;
    let transparency = lerp(0, targetAlpha, (elapsedTime - 600) / 1000);
    transparency = constrain(transparency, 0, 255);
    fill(250, transparency);
    

    let jiggle = map(elapsedTime, 2000, 0, 1, 300, true);
    translate((width - abs(titleBounds.w)) / 2,
        (height + abs(titleBounds.h)) / 2);

    for (let i = 0; i < titlePoints.length; i++) {
        let p = titlePoints[i];
        ellipse(p.x + jiggle * randomGaussian(),
            p.y + jiggle * randomGaussian(), 3, 3);
    }

    translate((width - abs(subtitleBounds.w)) / 3.5,
        (height + abs(subtitleBounds.h)) / 4);

    for (let i = 0; i < subtitlePoints.length; i++) {
        let p = subtitlePoints[i];
        ellipse(p.x + jiggle * randomGaussian(),
            p.y + jiggle * randomGaussian(), 2, 2);
    }
}
