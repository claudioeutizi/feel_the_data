const myImage = new Image();

myImage.src = "duomo.png";

/*---------------------------------------------------------------------------------------*/
var filigrana = 8;
var dim = 12;
var raggio = 0.4;
var val= true;

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Every 5 seconds  val became true or false

setInterval(function() {
    val = !val;
    console.log(val);
    console.log(filigrana);
  }, 10000);
  

myImage.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth-50;
    canvas.height = window.innerHeight-20;
    
    ctx.drawImage(myImage,0,0,canvas.width,canvas.height);
    const pixels = ctx.getImageData(0,0,canvas.width,canvas.height);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    let particlesArray = [];
    //Max 10000, Min 1000
    const numberOfParticles = 1500;

    let mappedImage = [];
    for(let y=0; y < canvas.height; y++){
        let row = [];
        for (let x = 0; x < canvas.width; x++){
            const red = pixels.data[(y * 4 * pixels.width) + (x * 4)];
            const green = pixels.data[(y * 4 *pixels.width)+(x*4 + 1)];
            const blue = pixels.data[(y*4*pixels.width)+(x*4 + 2)];
            const brightness = calculateRelativeBrightness(red,green,blue);
            
            const cell = [
                cellBrightness = brightness,
                cellColor = 'rgb('+red+','+green+','+blue+')',
            ];

            row.push(cell);
        }
        mappedImage.push(row);
    }

    function calculateRelativeBrightness(red,green,blue){
        return Math.sqrt(
            (red*red)* 0.299 + 
            (green*green)* 0.587 + 
            (blue*blue)* 0.114
            )/100;
    }


    class Particle{
        constructor(){
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

        
        update(){
            this.position1 = Math.floor(this.y);
            this.position2 = Math.floor(this.x);

            if((mappedImage[this.position1])&&
            (this.speed = mappedImage[this.position1][this.position2])){
                this.speed = mappedImage[this.position1][this.position2][0];
            }

            //Set velocity and size 
            this.velocity = Math.random() * filigrana;
            this.size = Math.random() * 1.5 + dim;

            let movement = (2.5 - this.speed) + this.velocity;

            if(val){
                this.angle++; 
                // For vertical bottom-up movement
                this.y -= movement+Math.sin(this.angle)*2;
                if(this.y <=  0){
                //this.y = 0;
                this.y = Math.random() * canvas.height;
                this.x = Math.random() * canvas.width;
                }
            }
            else{
                this.angle += this.speed/50;
                this.y += movement+Math.sin(this.angle)*2;
                if(this.y >= canvas.height){
                //this.y = 0;
                this.y = Math.random() * canvas.height;
                this.x = Math.random() * canvas.width;
                }
            }
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
        
            
            
            //For orizontal left-right movement
            //We can also add Math.sin(this.angle)*2 to this.x, but it could be lag a lot
            this.x += movement;
            if(this.x >= canvas.width){
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            }
            
            

        }

        draw(r,g,b){

            ctx.beginPath();

            if((mappedImage[this.position1])&&
            (this.speed = mappedImage[this.position1][this.position2])){
                //ctx.fillStyle = 'rgb('+r+','+g+','+b+')';
            ctx.fillStyle = mappedImage[this.position1][this.position2][1];
            }
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * raggio);
            ctx.fill();
        }
    }

    function init(){
        for(let i=0; i<numberOfParticles; i++){
            particlesArray.push(new Particle);
        }
    }

    init();

    function animate(){
        //ctx.drawImage(myImage,0,0,canvas.width,canvas.height);
        ctx.globalAplha = 0.05;
        ctx.fillStyle = 'rgb(0, 0, 0, 0.05)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.globalAplha = 0.2;
        for(let i=0; i< particlesArray.length; i++){
            particlesArray[i].update();
            //ctx.globalAplha = particlesArray[i].speed * 0.5;
            particlesArray[i].draw(255,255,255);
        }

        requestAnimationFrame(animate);
    }
    animate();

});

