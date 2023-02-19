let font;
let points;
let bounds;
let startTime;

function preload() {
    font = loadFont('./../Seven Segment.ttf');
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    points = font.textToPoints(
        'FEEL THE DATA', 0, 0, 200, {
        sampleFactor: 1,
        simplifyThreshold: 0
    });

    bounds = font.textBounds(
        'FEEL THE DATA', 0, 0, 200);

    cursor(CROSS);
    fill(255, 127);
    noStroke();
    startTime = millis();
}

function draw() {
    background(0);

    stroke(51);
    noStroke();

    let elapsedTime = millis() - startTime;

    let targetAlpha = elapsedTime >= 600 ? 255 : 0;
    let transparency = lerp(0, targetAlpha, (elapsedTime-600)/1000);
    transparency = constrain(transparency, 0, 255);
    fill(255, transparency);

    let jiggle = map(elapsedTime, 2000, 0, 1, 300, true);
    translate((width - abs(bounds.w)) / 2,
        (height + abs(bounds.h)) / 2);

    // 	stroke(255, 0, 0);
    //   rect(bounds.x, bounds.y, bounds.w, bounds.h);

    //   console.log("x: " + bounds.x 
    //               + ", y: " + bounds.y
    //               + ", w: " + bounds.w
    //               + ", h: " + bounds.h);

    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        ellipse(p.x + jiggle * randomGaussian(),
            p.y + jiggle * randomGaussian(), 5, 5);
    }

    //noLoop();
}