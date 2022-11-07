/* eslint-disable no-undef, no-unused-vars */
/*

  CONSTANTS AND VARS

*/
const RESOLUTION = 400;
const GRIDS = 12;
const BUTTON_X_SIZE = 90;
const BUTTON_Y_SIZE = 20;
var rays = []; // fixme multiple rays allowed ?
var mirrors = [];
var clickCount = 0;

/*

  CLASSES

*/

class Ray {
  constructor(_xpos, _ypos, _xvector, _yvector) {
    this.x = _xpos;
    this.y = _ypos;
    this.xvector = _xvector;
    this.yvector = _yvector;
  }
}

class Mirror {
  constructor(_x1, _y1, _x2, _y2) {
    this.x1 = _x1;
    this.y1 = _y1;
    this.x2 = _x2;
    this.y2 = _y2;
  }

  print() {
    console.log(
      "Mirror:",
      "\n",
      "x1:",
      this.x1,
      "y1:",
      this.y1,
      "\n",
      "x2:",
      this.x2,
      "y2:",
      this.y2
    );
  }
  printP5() {
    console.log(
      "Mirror:",
      "\n",
      "x1:",
      xToP5(this.x1),
      "y1:",
      yToP5(this.y1),
      "\n",
      "x2:",
      xToP5(this.x2),
      "y2:",
      yToP5(this.y2)
    );
  }
}

/* * * * * * * * * * * * * * * * *

  FUNCTIONS (MAIN IMPLEMENTATION)

* * * * * * * * * * * * * * * * * */

function tranformCoordsToGrid(x, y) {
  let new_x = xToGrid(x);
  let new_y = yToGrid(y);

  console.log("Previous coords:", x, y);
  console.log("New coords:", new_x, new_y);
}

function xToGrid(x) {
  return -1 + (GRIDS * x) / RESOLUTION;
}
function yToGrid(y) {
  return -1 + (RESOLUTION - y) / (RESOLUTION / GRIDS);
}

function xToP5(x) {
  return ((x + 1) * RESOLUTION) / GRIDS;
}
function yToP5(y) {
  return RESOLUTION - (y + 1) * (RESOLUTION / GRIDS);
}

/* * * * * * * * * * * * * * * * *

  TESTS

* * * * * * * * * * * * * * * * * */

function runTests() {}

function createTestEnv1() {
  /*
    Example from 
    POINTS
      A = (0,0)  B = (0,2)
      C = (2,2)  D = (1, 0)
    SEGMENTS
      AB, BC, CD
    RAY
      (1,1) with -1/2 slope (-2, 1)
  */

  mirrors.push(new Mirror(0, 0, 0, 2));
  mirrors.push(new Mirror(0, 2, 2, 2));
  mirrors.push(new Mirror(2, 2, 1, 0));
  rays.push(new Ray(1, 1, -2, 1)); // fixme (-2,1) from (0,0), not (1,1)
}

/*

  SETUP FUNCTION

*/

function setup() {
  // TESTS
  runTests();

  // ENVIRONMENT
  createCanvas(windowWidth, windowHeight);
  fill("black");
  textSize(100);

  // BUTTONS
  clear_button = makeButton("Clear", 425, 20 + 25 * 0, resetEnv);

  x1_input = createInput();
  y1_input = createInput();
  x2_input = createInput();
  y2_input = createInput();
  x1_input.size(BUTTON_X_SIZE);
  y1_input.size(BUTTON_X_SIZE);
  x2_input.size(BUTTON_X_SIZE);
  y2_input.size(BUTTON_X_SIZE);
  x1_input.position(425, 20 + 25 * 2);
  y1_input.position(425, 20 + 25 * 3);
  x2_input.position(425, 20 + 25 * 4);
  y2_input.position(425, 20 + 25 * 5);
  x1_text = createElement("h3", "x1 ←");
  y1_text = createElement("h3", "y1 ←");
  x2_text = createElement("h3", "x2");
  y2_text = createElement("h3", "y2");
  x1_text.position(x1_input.x + x1_input.width + 5, x1_input.y - 20);
  y1_text.position(y1_input.x + y1_input.width + 5, y1_input.y - 20);
  x2_text.position(x2_input.x + x2_input.width + 5, x2_input.y - 20);
  y2_text.position(y2_input.x + y2_input.width + 5, y2_input.y - 20);
  button = makeButton("Add Mirror", 425, 20 + 25 * 6, addMirror);
  button = makeButton("Add Ray", 425, 20 + 25 * 7, addRay);
  button = makeButton("Fire the ray!", 425, 20 + 25 * 9, fireTheRay);

  button = makeButton("Test #1", 425, 20 + 25 * 11, importTest1);
}

/*

  BUTTONS

*/
function makeButton(name, xpos, ypox, foo) {
  let button = createButton(name);
  button.position(xpos, ypox);
  button.mousePressed(foo);
  button.size(BUTTON_X_SIZE, BUTTON_Y_SIZE);
  return button;
}

function resetEnv() {
  rays = [];
  mirrors = [];
  console.log("[Environment reset]");
}

function addRay() {
  rays.push(
    new Ray(
      parseInt(x1_input.value(), 10),
      parseInt(y1_input.value(), 10),
      parseInt(x2_input.value(), 10),
      parseInt(y2_input.value(), 10)
    )
  );
  console.log("[Ray added]");
}

function addMirror() {
  mirrors.push(
    new Mirror(
      parseInt(x1_input.value(), 10),
      parseInt(y1_input.value(), 10),
      parseInt(x2_input.value(), 10),
      parseInt(y2_input.value(), 10)
    )
  );
  console.log("[Mirror added]");
}

function fireTheRay() {
  console.log("[Fire (todo)]");
}

function importTest1() {
  resetEnv();
  createTestEnv1();
}

/*

  DRAW FUNCTIONS

*/

// draws the cartesian plane
function drawIntegerGrid() {
  let xStep = width / GRIDS;
  let yStep = height / GRIDS;
  for (let x = xStep; x < width - xStep; x += xStep) {
    for (let y = yStep; y < height - yStep; y += yStep) {
      stroke(102, 204, 255);
      line(x, xStep, x, height - yStep);
      line(xStep, y, width - xStep, y);
      stroke(0);
    }
  }
}

/*

  OTHER P5 FUNCTIONS

*/

function draw() {
  const CANVAS_SIZE = 400;
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  background(230, 255, 255);
  drawIntegerGrid();
  drawMirrors();
  drawRay();
}

function drawMirrors() {
  const TEXT_OFFSET = 5;
  let msg1, msg2;
  for (const mirror of mirrors) {
    line(
      xToP5(mirror.x1),
      yToP5(mirror.y1),
      xToP5(mirror.x2),
      yToP5(mirror.y2)
    );
    msg1 = "(" + mirror.x1.toString() + "," + mirror.y1.toString() + ")";
    msg2 = "(" + mirror.x2.toString() + "," + mirror.y2.toString() + ")";
    text(msg1, xToP5(mirror.x1) + TEXT_OFFSET, yToP5(mirror.y1) - TEXT_OFFSET);
    text(msg2, xToP5(mirror.x2) + TEXT_OFFSET, yToP5(mirror.y2) - TEXT_OFFSET);
  }
}

function drawRay() {
  for (const ray of rays) {
    ellipse(xToP5(ray.x), yToP5(ray.y), 4, 4);
  }
  // TODO: vactor slope
}

windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
};

function mousePressed() {
  if (mouseX > 25 && mouseX < 375 && mouseY > 25 && mouseY < 375) {
    clickCount += 1;
    let grid_x = round(xToGrid(mouseX));
    let grid_y = round(yToGrid(mouseY));

    if (clickCount % 2 === 1) {
      x1_input.value(grid_x);
      y1_input.value(grid_y);
      x1_text.html("x1");
      y1_text.html("y1");
      x2_text.html("x2 ←");
      y2_text.html("y2 ←");
    } else {
      x2_input.value(grid_x);
      y2_input.value(grid_y);
      x1_text.html("x1 ←");
      y1_text.html("y1 ←");
      x2_text.html("x2");
      y2_text.html("y2");
    }
  }
}
