let bugs = [];
let nextBugs = [];
let grid = [];
const MAX_ENERGY = 8;
const DIAMETER = 5;
const LIGHT_RADIUS = 25;
const GRID_SIZE = 60;


function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(20);

    let colors = ['#D3DD55'];

    for (let i = 0; i < 5000; i++) {
        let active = random() < 0.05;
        let c = random(colors);
        let bug = new Lightbug(random(windowWidth), random(windowHeight), active, c, random(MAX_ENERGY));
        let nextBug = new Lightbug(bug.x, bug.y, bug.active, c, bug.energy);
        bugs.push(bug);
        nextBugs.push(nextBug);
    }
    initializeGrid();
}


function draw() {
    background(color("#102124"));
    updateGrid();

    bugs.forEach(lightbug => {
        if (lightbug.active) {
            let c = color(lightbug.color);
            c.setAlpha(255 * (lightbug.energy / MAX_ENERGY));
            fill(c);
            ellipse(lightbug.x, lightbug.y, DIAMETER);
        } else {
            noFill();
            ellipse(lightbug.x, lightbug.y, DIAMETER);
        }
    });

    update();

    swapBugs();
}

function update() {
    for (let i = 0; i < bugs.length; i++) {
        let lightbug = bugs[i];
        let litNeighbors = getLitNeighbors(lightbug);
        let majorityColor = getMajorityColor(litNeighbors);
        if (typeof majorityColor === 'undefined') {
            majorityColor = lightbug.color;
        }

        let nextBug = nextBugs[i];
        nextBug.x = lightbug.x + random(-1, 1);
        nextBug.y = lightbug.y + random(-1, 1);
        nextBug.active = lightbug.active;
        nextBug.color = majorityColor;
        nextBug.energy = lightbug.energy;

        if (litNeighbors.length >= 1 && lightbug.energy >= MAX_ENERGY) {
            nextBug.active = true;
            nextBug.energy--;
        } else if (lightbug.active && lightbug.energy > 0) {
            nextBug.active = true;
            nextBug.energy--;
        } else if (!lightbug.active && lightbug.energy < MAX_ENERGY) {
            nextBug.active = false;
            nextBug.energy++;
        } else if (lightbug.energy <= 0) {
            nextBug.active = false;
        }
    }
}

// We use a grid to index bugs for faster neighbor lookups
function initializeGrid() {
    let cols = Math.ceil(windowWidth / GRID_SIZE);
    let rows = Math.ceil(windowHeight / GRID_SIZE);
    grid = Array.from({ length: cols }, () => Array.from({ length: rows }, () => []));
}


function updateGrid() {
    grid.forEach(col => col.forEach(cell => cell.length = 0));
    bugs.forEach(bug => {
        let col = Math.floor(bug.x / GRID_SIZE);
        let row = Math.floor(bug.y / GRID_SIZE);
        if (col >= 0 && col < grid.length && row >= 0 && row < grid[0].length) {
            grid[col][row].push(bug);
        }
    });
}


function getLitNeighbors(bug) {
    let neighbors = [];
    let col = Math.floor(bug.x / GRID_SIZE);
    let row = Math.floor(bug.y / GRID_SIZE);

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let newCol = col + i;
            let newRow = row + j;
            if (newCol >= 0 && newCol < grid.length && newRow >= 0 && newRow < grid[0].length) {
                grid[newCol][newRow].forEach(lightbug => {
                    if (lightbug !== bug) {
                        let distance = dist(bug.x, bug.y, lightbug.x, lightbug.y);
                        if (distance < LIGHT_RADIUS && lightbug.active) {
                            neighbors.push(lightbug);
                        }
                    }
                });
            }
        }
    }
    return neighbors;
}


function getMajorityColor(neighbors) {
    let colorCount = {};
    neighbors.forEach(neighbor => {
        if (neighbor.color in colorCount) {
            colorCount[neighbor.color]++;
        } else {
            colorCount[neighbor.color] = 1;
        }
    });

    let maxKey, maxValue = 0;

    for (const [key, value] of Object.entries(colorCount)) {
        if (value > maxValue) {
            maxValue = value;
            maxKey = key;
        }
    }
    return maxKey;
}


function swapBugs() {
    let temp = bugs;
    bugs = nextBugs;
    nextBugs = temp;
}


class Lightbug {
    constructor(x, y, active, color, energy) {
        this.x = x;
        this.y = y;
        this.active = active;
        this.color = color;
        this.energy = energy;
    }
}

