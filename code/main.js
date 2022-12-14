/* eslint-disable no-undef, no-unused-vars */

/* * * * * * * * * * * * * * * * *

  CONSTANTS AND VARS

* * * * * * * * * * * * * * * * * */
const EPSILON = 0.00001;
const CANVAS_SIZE = 400;
const TEXT_OFFSET = 5;
const RESOLUTION = 400;
const GRIDS_DEFAULT = 10 + 2;

const BUTTON_X_SIZE = 90;
const BUTTON_Y_SIZE = 20;

const N_STEPS_DEFAULT = 100;

var GRIDS = GRIDS_DEFAULT;
var mirrors = [];
var integer_exchange = null;
var ray = null;
var clickCount = 0;

const HORIZONTAL = 0; // -
const VERTICAL = 1; // |
const DIAGONAL_UP = 2; // /
const DIAGONAL_DOWN = 3; // \

const REFLECTIVE = true;
const NON_REFLECTIVE = false;

/* * * * * * * * * * * * * * * * *

  FUNCTIONS

* * * * * * * * * * * * * * * * * */

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

function computeReflections() {
  ray.clear();
  integer_exchange = new IntegerExchange(ray, mirrors);
}

/* * * * * * * * * * * * * * * * *

  SETUP FUNCTION

* * * * * * * * * * * * * * * * * */

function setup() {

  // ENVIRONMENT
  createCanvas(windowWidth, windowHeight);
  fill("black");
  textSize(100);

  // BUTTONS
  clear_button = makeButton("Clear", 425, 20 + 25 * 0, resetEnv);

  x1_input = makeInput(425, 20 + 25 * 2);
  y1_input = makeInput(425, 20 + 25 * 3);
  x2_input = makeInput(425, 20 + 25 * 4);
  y2_input = makeInput(425, 20 + 25 * 5);
  x1_text = createElement("h3", "x1 ←");
  y1_text = createElement("h3", "y1 ←");
  x2_text = createElement("h3", "x2");
  y2_text = createElement("h3", "y2");
  x1_text.position(x1_input.x + x1_input.width + 5, x1_input.y - 20);
  y1_text.position(y1_input.x + y1_input.width + 5, y1_input.y - 20);
  x2_text.position(x2_input.x + x2_input.width + 5, x2_input.y - 20);
  y2_text.position(y2_input.x + y2_input.width + 5, y2_input.y - 20);

  mirror_button = makeButton("Add Mirror", 425, 20 + 25 * 6, addMirror);
  mirror_checkbox = createCheckbox("reflective", true);
  mirror_checkbox.position(425 + mirror_button.width, 20 + 25 * 6);

  ray_button = makeButton("Add Ray", 425, 20 + 25 * 7, addRay);

  mapping_button = makeButton("Mapping", 425, 20 + 25 * 9, computeMapping);

  n_steps_input = makeInput(425, 20 + 25 * 10, N_STEPS_DEFAULT);
  n_steps_text = createElement("h3", "steps");
  n_steps_text.position(
    n_steps_input.x + n_steps_input.width + 5,
    n_steps_input.y - 20
  );
  fire_button = makeButton("Fire the ray!", 425, 20 + 25 * 11, fireTheRay);

  test_select = createSelect();
  test_select.size(BUTTON_X_SIZE, BUTTON_Y_SIZE);
  test_select.position(425, 20 + 25 * 13);
  test_select.changed(selectHandler);
  test_select.option("None", 0);
  test_select.option("Test 1: article reference", 1);
  test_select.option("Test 2: loop", 2);
  test_select.option("Test 3: article + non-reflective", 3);

  test_text = createElement("h3", "tests");
  test_text.position(test_select.x + test_select.width + 5, test_select.y - 20);

  grid_slider = createSlider(8, 50, 12, 2); // min,max,default,step
  grid_slider.position(425, 20 + 25 * 14);
  grid_slider.style("width", "80px");
  grid_text = createElement("h3", "grid");
  grid_text.html("grids: " + (GRIDS_DEFAULT - 2));
  grid_text.position(grid_slider.x + grid_slider.width + 5, grid_slider.y - 20);
  makeButton("Change grid", 425, 20 + 25 * 15, changeGrid);
}

/* * * * * * * * * * * * * * * * *

  BUTTONS

* * * * * * * * * * * * * * * * * */
function makeButton(name, xpos, ypos, foo) {
  let button = createButton(name);
  button.position(xpos, ypos);
  button.mousePressed(foo);
  button.size(BUTTON_X_SIZE, BUTTON_Y_SIZE);
  return button;
}

function makeInput(xpos, ypos, defaultText = "") {
  let input = createInput();
  input.size(BUTTON_X_SIZE);
  input.position(xpos, ypos);
  input.value(defaultText);
  return input;
}

// Tests
function selectHandler() {
  resetEnv();
  switch (test_select.value()) {
    case "1":
      createTestEnv1();
      break;
    case "2":
      createTestEnv2();
      break;
    case "3":
      createTestEnv3();
      break;
    default:
  }
  redraw();
}

function resetEnv() {
  console.clear();
  GRIDS = GRIDS_DEFAULT;
  ray = null;
  mirrors = [];
  integer_exchange = null;

  clickCount = 0;
  x1_input.value("");
  y1_input.value("");
  x2_input.value("");
  y2_input.value("");
  x1_text.html("x1 ←");
  y1_text.html("y1 ←");
  x2_text.html("x2");
  y2_text.html("y2");

  colorElement(ray_button, "black");
  colorElement(mirror_button, "black");
  colorElement(fire_button, "black");

  console.log("[Environment reset]");
}

function addRay() {
  let [x1, y1, x2, y2] = [
    parseInt(x1_input.value(), 10),
    parseInt(y1_input.value(), 10),
    parseInt(x2_input.value(), 10),
    parseInt(y2_input.value(), 10)
  ];

  let nan_check = !(isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2));
  let move_check = x1 !== x2 || y1 !== y2;

  if (nan_check && move_check) {
    colorElement(ray_button, "green");
    ray = new Ray(x1, y1, x2, y2);
    console.log("[Ray added]");
  } else {
    colorElement(ray_button, "red");
  }
}

function addMirror() {
  let [x1, y1, x2, y2] = [
    parseInt(x1_input.value(), 10),
    parseInt(y1_input.value(), 10),
    parseInt(x2_input.value(), 10),
    parseInt(y2_input.value(), 10)
  ];

  let nan_check = !(isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2));
  let axis_check = x1 === x2 || y1 === y2 || abs(x2 - x1) === abs(y2 - y1);

  if (nan_check && axis_check) {
    let is_reflective = mirror_checkbox.checked();
    colorElement(mirror_button, "green");
    mirrors.push(new Mirror(x1, y1, x2, y2, is_reflective));
    console.log("[Mirror added]");
  } else {
    colorElement(mirror_button, "red");
  }
}

function computeMapping() {
  if (ray !== null && mirrors.length > 0) {
    computeReflections();
    colorElement(mapping_button, "green");
  }
  else {
    colorElement(mapping_button, "red");
  }
}

function fireTheRay() {
  let n = parseInt(n_steps_input.value(), 10);

  colorElement(fire_button, "red");

  if (integer_exchange !== null && !isNaN(n) && ray !== null && mirrors.length > 0) {
    colorElement(fire_button, "green");
    console.log("[Fire]");

    console.log("[Earth]");
    integer_exchange.f(ray, n);

    console.log("[Water]");
  } else {
    colorElement(fire_button, "red");
  }
}

function changeGrid() {
  let val = parseInt(grid_slider.value(), 10);
  GRIDS = val;
}

/* * * * * * * * * * * * * * * * *

  DRAW FUNCTIONS

* * * * * * * * * * * * * * * * * */

function draw() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  background(230, 255, 255);
  updateSlider();
  drawIntegerGrid();
  drawMirrors();
  drawRay();
  drawSelect();
}

function colorElement(element, color) {
  element.style(`color: ${color};`);
}

function updateSlider() {
  let val = parseInt(grid_slider.value(), 10);
  grid_text.html("grids: " + (val - 2));
}

function drawSelect() {
  let [x1, y1, x2, y2] = [
    parseInt(x1_input.value(), 10),
    parseInt(y1_input.value(), 10),
    parseInt(x2_input.value(), 10),
    parseInt(y2_input.value(), 10)
  ];

  fill("lightgreen");
  if (!(isNaN(x1) || isNaN(y1))) {
    ellipse(xToP5(x1), yToP5(y1), 5, 5);
  }
  if (!(isNaN(x2) || isNaN(y2))) {
    ellipse(xToP5(x2), yToP5(y2), 5, 5);
  }
  fill("white");
}

// draws the cartesian plane
function drawIntegerGrid() {
  let xStep = width / GRIDS;
  let yStep = height / GRIDS;
  for (let x = xStep; x < width; x += xStep) {
    for (let y = yStep; y < height; y += yStep) {
      stroke(102, 204, 255);
      line(x, xStep, x, height - yStep);
      line(xStep, y, width - xStep, y);
      stroke(0);
    }
  }
}

function drawMirrors() {
  let msg1, msg2;
  for (const mirror of mirrors) {
    if (!mirror.is_reflective) {
      stroke("orange");
    }
    line(
      xToP5(mirror.start.x),
      yToP5(mirror.start.y),
      xToP5(mirror.end.x),
      yToP5(mirror.end.y)
    );
    stroke("black");
    drawBounceCoords();
    msg1 =
      "(" + mirror.start.x.toString() + "," + mirror.start.y.toString() + ")";
    msg2 = "(" + mirror.end.x.toString() + "," + mirror.end.y.toString() + ")";
    text(
      msg1,
      xToP5(mirror.start.x) + TEXT_OFFSET,
      yToP5(mirror.start.y) - TEXT_OFFSET
    );
    text(
      msg2,
      xToP5(mirror.end.x) + TEXT_OFFSET,
      yToP5(mirror.end.y) - TEXT_OFFSET
    );
  }
}

function drawBounceCoords() {
  if (integer_exchange) {
    stroke(1, 1, 255);
    for (let bounce of integer_exchange.intervals) {
      ellipse(xToP5(bounce.point.x), yToP5(bounce.point.y), 4, 4);
    }
    stroke(0);
  }
}

function drawRay() {
  if (ray !== null) {
    let msg;
    // drawRayDirections(ray);
    stroke(255, 1, 1);
    line(
      xToP5(ray.start.x),
      yToP5(ray.start.y),
      xToP5(ray.start.x + ray.dir.x),
      yToP5(ray.start.y + ray.dir.y)
    );
    ellipse(xToP5(ray.start.x), yToP5(ray.start.y), 8, 8);
    msg = "(" + ray.start.x.toString() + "," + ray.start.y.toString() + ")";
    text(
      msg,
      xToP5(ray.start.x) + TEXT_OFFSET,
      yToP5(ray.start.y) - TEXT_OFFSET
    );

    stroke(0);
    drawRayPath();
  }
}

function drawRayPath() {
  fill("purple");
  stroke("purple");
  for (let i = 0; i < ray.path.length - 1; i++) {
    let start = ray.path[i];
    let end = ray.path[i + 1];
    line(xToP5(start.x), yToP5(start.y), xToP5(end.x), yToP5(end.y));
  }
  let end = ray.path[ray.path.length - 1];
  ellipse(xToP5(end.x), yToP5(end.y), 8, 8);
  stroke("black");
  fill("white");
}

windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
};

function drawRayDirections(ray) {
  let count = 0;
  for (const dir of ray.directions) {
    stroke(1, 255, 1);
    line(
      xToP5(ray.start.x),
      yToP5(ray.start.y),
      xToP5(ray.start.x + dir.x),
      yToP5(ray.start.y + dir.y)
    );
    let msg = "[" + count.toString() + "]";
    fill("black");
    text(
      msg,
      xToP5(ray.x + dir.x) + TEXT_OFFSET,
      yToP5(ray.y + dir.y) + TEXT_OFFSET
    );
    count++;
    fill("white");
  }
}

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
  //redraw();
}
