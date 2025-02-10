let bugs = [];
const MAX_ENERGY = 5;
const DIAMETER = 5;
const LIGHT_RADIUS = 20;

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(20);

    let colors = ['red', 'green', 'blue']

    for (let i = 0; i < 5000; i++) {
        light = random() < 0.05;
        bugs.push(new Lightbug(random(windowWidth), random(windowHeight), DIAMETER, light, random(colors), random(MAX_ENERGY)));
    }
}

function draw() {
    background(color("#0a1214"));

    bugs.forEach(lightbug => {
        if (lightbug.on) {
            fill(lightbug.color);
            ellipse(lightbug.x, lightbug.y, lightbug.diameter);
        }
        else {
            noFill();
            ellipse(lightbug.x, lightbug.y, lightbug.diameter);
        }
    });


    let tempBugs = [];
    bugs.forEach(lightbug => {
        let litNeighbors = getLitNeighbors(lightbug);
        let majorityColor = getMajorityColor(litNeighbors);
        if (typeof majorityColor == 'undefined') {
            majorityColor = lightbug.color;
        }

        let tempBug = new Lightbug(lightbug.x, lightbug.y, lightbug.diameter, lightbug.on, majorityColor, lightbug.energy);
        if (litNeighbors.length >= 1 && lightbug.energy >= MAX_ENERGY) {
            tempBug.on = true;
            tempBug.energy--;
        } else if (lightbug.on && lightbug.energy > 0) {
            tempBug.on = true;
            tempBug.energy--;
        } else if (!lightbug.on && lightbug.energy < MAX_ENERGY) {
            tempBug.on = false;
            tempBug.energy++;
        } else if (lightbug.energy <= 0) {
            tempBug.on = false;
        }

        tempBugs.push(tempBug);

    });
    bugs = tempBugs;

    // console.log(bugs[0].on, bugs[0].energy);

}

function getLitNeighbors(bug) {
    let neighbors = [];
    bugs.forEach(lightbug => {
        if (lightbug !== bug) {
            let distance = dist(bug.x, bug.y, lightbug.x, lightbug.y);
            if (distance < LIGHT_RADIUS && lightbug.on) {
                neighbors.push(lightbug);
            }
        }
    });
    return neighbors;
}

function getMajorityColor(neighbors) {
    color_count = {};
    neighbors.forEach(neighbor => {
        
        if (neighbor.color in color_count) {
            color_count[neighbor.color] ++;
        } else {
            color_count[neighbor.color] = 1;
        }

    })

    let maxKey, maxValue = 0;

    for(const [key, value] of Object.entries(color_count)) {

    if(value > maxValue) {
        maxValue = value;
        maxKey = key;
    }
    }
    return maxKey
}

class Lightbug {
    constructor(x, y, diameter, on, color, energy = MAX_ENERGY) {
        this.x = x;
        this.y = y;
        this.diameter = diameter;
        this.on = on;
        this.color = color;
        this.energy = energy;
        this.maxEnergy = MAX_ENERGY;
    }
}

