let bugs = [];
let nextBugs = [];
let grid = [];

const CHART_HEIGHT = 75;
let CHART_WIDTH = 200;
let chartCanvas;
let chartData = {};
let activeCounts = {};

let mX = 0;
let mY = 0;
let mouseIsPressed = false;

let LIGHT_RADIUS = 27;
let TOTAL_BUGS = 5000;
let STARTING_ACTIVE = 0.005;
let RANDOM_WALK_SCALE = 2;
let DRAIN_RATE = 0.1;
let RECOVERY_RATE = 0.08;


const GRID_SIZE = 2 * LIGHT_RADIUS + 5;
const MAX_ENERGY = 1;
const DIAMETER = 5;

let colorSets = [
    ['#D3DD55'],
    ['#F40', '#1D3', '#06F'],
    ['#F93827', '#FF9D23', '#EFE63A', '#16C47F', '#0079FF', '#8538F7']
];
let currentColorSetIndex = 0;
let colors = colorSets[currentColorSetIndex];

function setup() {
    let canvasContainer = select('#canvasContainer');
    let cnv = createCanvas(windowWidth, windowHeight, WEBGL);
    cnv.parent(canvasContainer);

    let chartDiv = select('#chart');
    CHART_WIDTH = chartDiv.elt.clientWidth;
    chartCanvas = createGraphics(CHART_WIDTH, CHART_HEIGHT);
    chartCanvas.parent("chart");
    chartCanvas.style('display', 'flex');
    chartCanvas.style('align-self', 'flex-end');
    
    
    frameRate(20);

    let colorSetDropdown = select('#colorSet');
    colorSetDropdown.changed(() => {
        currentColorSetIndex = parseInt(colorSetDropdown.value());
        colors = colorSets[currentColorSetIndex];
        initializeColors();
    });

    select('#totalBugs').input(() => TOTAL_BUGS = parseInt(select('#totalBugs').value()));
    select('#lightRadius').input(() => LIGHT_RADIUS = parseInt(select('#lightRadius').value()));
    select('#startingActive').input(() => STARTING_ACTIVE = parseFloat(select('#startingActive').value()));
    select('#randomWalkScale').input(() => RANDOM_WALK_SCALE = parseInt(select('#randomWalkScale').value()));
    select('#drainRate').input(() => DRAIN_RATE = parseFloat(select('#drainRate').value()));
    select('#recoveryRate').input(() => RECOVERY_RATE = parseFloat(select('#recoveryRate').value()));
    // select('#staggeredStart').changed(() => staggeredStart = select('#staggeredStart').checked());

    select('#resetButton').mousePressed(resetSimulation);

    initializeColors();
    initializeBugs();
    initializeGrid();

    window.addEventListener('resize', windowResized);
}

function draw() {
    background(color("#102124"));
    translate(-width / 2, -height / 2);
    
    updateGrid();

    Object.keys(activeCounts).forEach(color => {
        activeCounts[color] = 0;
    });

    bugs.forEach(lightbug => {
        if (lightbug.active) {
            let c = color(lightbug.color);
            c.setAlpha(255 * (lightbug.energy / MAX_ENERGY));
            fill(c);
            ellipse(lightbug.x, lightbug.y, DIAMETER);
            activeCounts[lightbug.color]++;
        } else {
            noFill();
            ellipse(lightbug.x, lightbug.y, DIAMETER);
        }
    });

    update();
    swapBugs();
    drawChart();
}

function initializeColors() {
    chartData = {};
    activeCounts = {};
    colors.forEach(color => {
        chartData[color] = Array(CHART_WIDTH).fill(0);
        activeCounts[color] = 0;
    });

    bugs.forEach(bug => {
        bug.color = random(colors);
    });
}

function initializeBugs() {
    bugs = [];
    nextBugs = [];
    for (let i = 0; i < TOTAL_BUGS; i++) {
        let active = random() < STARTING_ACTIVE;
        let c = random(colors);

        let bug = new Lightbug(
            random(windowWidth),
            random(windowHeight),
            active,
            c,
            random(MAX_ENERGY));
        let nextBug = new Lightbug(
            bug.x,
            bug.y,
            bug.active,
            c,
            bug.energy);
        bugs.push(bug);
        nextBugs.push(nextBug);
    }
}

function update() {
    if (mouseIsPressed) {
        let mX = Math.floor(mouseX / GRID_SIZE);
        let mY = Math.floor(mouseY / GRID_SIZE);
        
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let newCol = mX + i;
                let newRow = mY + j;
                if (newCol >= 0 && newCol < grid.length && newRow >= 0 && newRow < grid[0].length) {
                    grid[newCol][newRow].forEach(lightbug => {
                        let distance = dist(mouseX, mouseY, lightbug.x, lightbug.y);
                        if (distance < LIGHT_RADIUS) {
                            lightbug.active = true;
                            lightbug.color = random(colors);
                            lightbug.energy = MAX_ENERGY-DRAIN_RATE;
                        }
                    });
                }
            }
        }
        mouseIsPressed = false;
    }

    for (let i = 0; i < bugs.length; i++) {
        let lightbug = bugs[i];
        let litNeighbors = getLitNeighbors(lightbug);
        let majorityColor = getMajorityColor(litNeighbors);
        if (typeof majorityColor === 'undefined') {
            majorityColor = lightbug.color;
        }

        let nextBug = nextBugs[i];
        nextBug.x = (lightbug.x + random(-RANDOM_WALK_SCALE, RANDOM_WALK_SCALE) + windowWidth) % windowWidth;
        nextBug.y = (lightbug.y + random(-RANDOM_WALK_SCALE, RANDOM_WALK_SCALE) + windowHeight) % windowHeight;
        nextBug.active = lightbug.active;
        nextBug.color = majorityColor;
        nextBug.energy = lightbug.energy;

        if (litNeighbors.length >= 1 && lightbug.energy >= MAX_ENERGY) {
            nextBug.active = true;
            nextBug.energy = MAX_ENERGY;
            nextBug.energy -= DRAIN_RATE;
        } 
        else if (lightbug.active && lightbug.energy > 0) {
            nextBug.active = true;
            nextBug.energy -= DRAIN_RATE;
        } 
        else if (!lightbug.active && lightbug.energy < MAX_ENERGY) {
            nextBug.active = false;
            nextBug.energy += RECOVERY_RATE;
        } 
        else if (lightbug.energy <= 0) {
            nextBug.active = false;
        }
    }
}

function swapBugs() {
    let temp = bugs;
    bugs = nextBugs;
    nextBugs = temp;
}

function initializeGrid() {
    let cols = Math.ceil(windowWidth / GRID_SIZE);
    let rows = Math.ceil((windowHeight) / GRID_SIZE);
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

function drawChart() {
    chartCanvas.background(color("#101017"));
    Object.keys(chartData).forEach(color => {
        chartData[color].push(activeCounts[color]);

        if (chartData[color].length > CHART_WIDTH) {
            chartData[color].shift();
        }

        chartCanvas.stroke(color);
        chartCanvas.noFill();
        chartCanvas.beginShape();
        for (let i = 0; i < chartData[color].length; i++) {
            let x = i;
            let y = map(chartData[color][i], -10, TOTAL_BUGS, CHART_HEIGHT, 0);
            chartCanvas.vertex(x, y);
        }
        chartCanvas.endShape();
    });
}

function mousePressed(event) {
    let cnv = document.querySelector('#defaultCanvas0');
    if (event.target !== cnv) {
        return;
    }

    mX = mouseX;
    mY = mouseY;
    mouseIsPressed = true;
}

function windowResized() {
    let canvasContainer = select('#canvasContainer');
    resizeCanvas(windowWidth, windowHeight);
    
    let chartDiv = select('#chart');
    chartDiv.html('');
    CHART_WIDTH = chartDiv.elt.clientWidth;
    chartCanvas = createGraphics(CHART_WIDTH, CHART_HEIGHT);
    chartCanvas.parent("chart");
    
    initializeGrid();
    initializeColors();
    initializeBugs();
}

function resetSimulation() {
    initializeColors();
    initializeBugs();
    initializeGrid();
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

