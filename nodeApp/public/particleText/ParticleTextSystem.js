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
        'FEEL THE DATA', 0, 0, 100, {
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
    noStroke();
    background(51);
    let elapsedTime = millis() - startTime;

    let targetAlpha = elapsedTime >= 600 ? 255 : 0;
    let transparency = lerp(0, targetAlpha, (elapsedTime - 600) / 1000);
    transparency = constrain(transparency, 0, 255);
    fill(255, transparency);

    let jiggle = map(elapsedTime, 2000, 0, 1, 300, true);
    translate((width - abs(bounds.w)) / 2,
        (height + abs(bounds.h)) / 2);

    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        fill('rgba(255,255,255,0.5)');
        ellipse(p.x + jiggle * randomGaussian(),
            p.y + jiggle * randomGaussian(), 5, 5);
    }
}