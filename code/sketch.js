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

  CLASSES

* * * * * * * * * * * * * * * * * */
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  isEqual(point) {
    return this.x === point.x && this.y === point.y;
  }

  getSquareDist(point) {
    return (this.x - point.x) ** 2 + (this.y - point.y) ** 2;
  }

  getSlope(point) {
    return (point.y2 - this.y) / (point.x - this.x);
  }
}

class Ray {
  constructor(x_pos, y_pos, x_vector, y_vector) {
    this.start = new Point(x_pos, y_pos);
    this.dir = new Point(x_vector - x_pos, y_vector - y_pos);
    this.directions = this._computeDirections();
    this.path = [this.start];
    this.print();
  }

  clear() {
    this.path = [this.start];
  }

  addPointToPath(point) {
    this.path.push(point);
  }

  _computeDirections() {
    let directions = [];
    if (this.dir.x === 0 || this.dir.y === 0 || this.dir.x === this.dir.y || this.dir.x === -this.dir.y) {
      directions.push(new Point(this.dir.x, this.dir.y)); // +x +y (12h)
      directions.push(new Point(this.dir.y, -this.dir.x)); // +y -x (3h) (RIGHT)
      directions.push(new Point(-this.dir.x, -this.dir.y)); // -x -y (6h) (DOWN)
      directions.push(new Point(-this.dir.y, this.dir.x)); // -y +x (9h) (LEFT)
    }
    else {
      directions.push(new Point(this.dir.x, this.dir.y)); // +x +y (12h)
      directions.push(new Point(this.dir.y, -this.dir.x)); // +y -x (3h) (RIGHT)
      directions.push(new Point(-this.dir.x, -this.dir.y)); // -x -y (6h) (DOWN)
      directions.push(new Point(-this.dir.y, this.dir.x)); // -y +x (9h) (LEFT)
      directions.push(new Point(this.dir.y, this.dir.x)); // +y +x (UP-RIGHT)
      directions.push(new Point(this.dir.x, -this.dir.y)); // +x -y (DOWN-RIGHT)
      directions.push(new Point(-this.dir.y, -this.dir.x)); // -y -x (DOWN-LEFT)
      directions.push(new Point(-this.dir.x, this.dir.y)); // -x +y (UP-LEFT)
    }
    return directions;
  }

  print() {
    console.log(
      `Laser: from (${this.start.x},${this.start.y}) with direction (${this.dir.x},${this.dir.y})`
    );
  }
}

class Mirror {
  constructor(x1, y1, x2, y2, reflective = true) {
    this.start = new Point(x1, y1);
    this.end = new Point(x2, y2);
    this.size = max(abs(x1 - x2), abs(y1 - y2)); // nbr of unit segment
    this.orientation = this._determineOrientation();
    this.print();

    // actually EACH SIDE of the mirror
    // COULD be marked as reflective or non reflective
    // but we simplified it to both side
    // as it would unnecessarily complicate
    // the implementation for not much
    this.is_reflective = reflective;
  }

  getLength() {
    return this.start.getSquareDist(this.end);
  }

  getSlope() {
    return this.start.getSlope(this.end);
  }

  _determineOrientation() {
    let ans = null;
    if (this.start.x === this.end.x) {
      ans = VERTICAL;
    } else if (this.start.y === this.end.y) {
      ans = HORIZONTAL;
    } else if (
      (this.start.x < this.end.x && this.start.y < this.end.y) ||
      (this.start.x > this.end.x && this.start.y > this.end.y)
    ) {
      ans = DIAGONAL_UP;
    } else {
      ans = DIAGONAL_DOWN;
    }
    return ans;
  }

  print() {
    console.log(
      `Mirror: (${this.start.x},${this.start.y}) to (${this.end.x},${this.end.y}) of size ${this.size} with orientation = ${this.orientation}`
    );
  }
}

class Bounce {
  constructor(in_dir, point, out_dir) {
    this.in_dir = in_dir;
    this.point = point;
    this.out_dir = out_dir;
  }
}


class IntegerExchange {
  constructor(ray, mirrors) {
    this.intervals = []; // List of 'Bounce' of the integer interval ('Bounce' contains in_dir, point, out_dir)
    this.exchange = []; // Mapping for the intervals

    let bbox = [
      new Mirror(
        xToGrid(0),
        yToGrid(0),
        xToGrid(CANVAS_SIZE),
        yToGrid(0),
        NON_REFLECTIVE
      ),
      new Mirror(
        xToGrid(CANVAS_SIZE),
        yToGrid(0),
        xToGrid(CANVAS_SIZE),
        yToGrid(CANVAS_SIZE),
        NON_REFLECTIVE
      ),
      new Mirror(
        xToGrid(CANVAS_SIZE),
        yToGrid(CANVAS_SIZE),
        xToGrid(0),
        yToGrid(CANVAS_SIZE),
        NON_REFLECTIVE
      ),
      new Mirror(
        xToGrid(0),
        yToGrid(CANVAS_SIZE),
        xToGrid(0),
        yToGrid(0),
        NON_REFLECTIVE
      )
    ];
    let mirrors_and_bbox = bbox.concat(mirrors);

    this._compute(ray, mirrors_and_bbox);
    console.log("INTERVALS", this.intervals);
    console.log("EXCHANGE", this.exchange);
  }

  _debugTestFindBounce(x, y) {
    for (let idx = 0; idx < this.intervals.length; idx++) {
      let bounce = this.intervals[idx];
      if (bounce.point.x === x && bounce.point.y === y) {
        console.log(">>> ", "idx:", idx, bounce);
      } else {
        //console.log(">", bounce.point.x, bounce.point.y);
      }
    }
  }

  // technically,
  // the function should be called n-times,
  // rather than looping n times
  f(ray, n) {
    // this._debugTestFindBounce(ray, 2, 9);

    this._debugTestFindBounce(5, 5);

    let previous_idx = null;
    let bounce_idx = this._getFirstBounce(ray);
    if (bounce_idx) {
      for (let i = 0; i < n; i++) {
        // TODO : stop loop if ray re-enters same path (?)
        ray.addPointToPath(this.intervals[bounce_idx].point);
        previous_idx = bounce_idx;
        bounce_idx = this.exchange[bounce_idx];
        if (bounce_idx === null || bounce_idx === -1) {
          break;
        }
      }
    } else {
      console.log(">> Ray does not intersect any mirror.");
      ray.print();
    }
  }

  _getFirstBounce(ray) {
    let candidate = null;
    let min_dist = +Infinity;
    for (let idx = 0; idx < this.intervals.length; idx++) {
      let next_bounce = this.intervals[idx];
      if (ray.dir.isEqual(next_bounce.in_dir)) {
        // Check same directions
        if (this._areAlign(ray.start, next_bounce.point, ray.dir)) {
          // then candidate
          let dist = ray.start.getSquareDist(next_bounce.point);
          if (dist < min_dist) {
            min_dist = dist;
            candidate = idx;
          }
        }
      }
    }
    return candidate;
  }

  _areAlign(start, end, dir) {
    if (dir.x === 0) {
      // if vertical direction
      // Check direction
      if ((dir.y > 0 && end.y > start.y) || (dir.y < 0 && end.y < start.y)) {
        return abs(end.x - start.x) < EPSILON;
      }
    } else if (dir.y === 0) {
      // if horizontal direction
      // Check direction
      if ((dir.x > 0 && end.x > start.x) || (dir.x < 0 && end.x < start.x)) {
        return abs(end.y - start.y) < EPSILON;
      }
    } else {
      let lambda_x = (end.x - start.x) / dir.x;
      let lambda_y = (end.y - start.y) / dir.y;
      return abs(lambda_x - lambda_y) < EPSILON && lambda_x > 0;
    }
    return false;
  }

  _compute(ray, mirrors) {
    for (let dir of ray.directions) {
      for (let mirror of mirrors) {
        let [nb_splits, bounce_dir] = this._getAllBounces(mirror, dir);
        this._addBounces(mirror, nb_splits, dir, bounce_dir);
      }
    }

    this._findSimilarBounces();

    this._computeMapping();
  }

  _findSimilarBounces() {
    console.log(this.intervals);
    let bounces = this.intervals;
    let duplicates = []
    for (let i = 0; i < bounces.length; i++) {
      for (let j = 0; j < bounces.length; j++) {
        if (i !== j) {
          let posA = bounces[i].point;
          let posB = bounces[j].point;
          let in_dirA = bounces[i].in_dir;
          let in_dirB = bounces[j].in_dir;
          let out_dirA = bounces[i].out_dir;
          let out_dirB = bounces[j].out_dir;
          if (posA.isEqual(posB) && in_dirA.isEqual(in_dirB)){
            let test1 = true;
            let test2 = true;
            if (! duplicates.includes(i)) {
             duplicates.push(i);
             test1 = false;
            }
            if (! duplicates.includes(j)) {
              duplicates.push(j);
              test2 = false;
            }
            if (!test1 && !test2) {
             console.error("_findSimilarBounces: duplicate: ", i, j, bounces[i], bounces[j]);
            }
            
          } 
        }
      }
    }    
  }
  

  _getAllBounces(mirror, dir) {
    if (mirror.orientation === HORIZONTAL) {
      return [mirror.size * abs(dir.y), new Point(dir.x, -dir.y)];
    } else if (mirror.orientation === VERTICAL) {
      return [mirror.size * abs(dir.x), new Point(-dir.x, dir.y)];
    } else if (mirror.orientation === DIAGONAL_UP) {
      if (dir.x * dir.y > 0) {
        return [
          mirror.size * abs(abs(dir.x) - abs(dir.y)),
          new Point(dir.y, dir.x)
        ];
      } else {
        return [
          mirror.size * abs(abs(dir.x) + abs(dir.y)),
          new Point(dir.y, dir.x)
        ];
      }
    } else if (mirror.orientation === DIAGONAL_DOWN) {
      if (dir.x * dir.y < 0) {
        return [
          mirror.size * abs(abs(dir.x) - abs(dir.y)),
          new Point(-dir.y, -dir.x)
        ];
      } else {
        return [
          mirror.size * abs(abs(dir.x) + abs(dir.y)),
          new Point(-dir.y, -dir.x)
        ];
      }
    } else {
      console.error("Unexpected case (fct: _getAllBounces())");
    }
  }

  _addBounces(mirror, nb_splits, in_dir, out_dir) {

    let bounce = null;
    bounce =  new Bounce(in_dir, mirror.start, null); // mirror endpoint does not reflects
    if (! this._is_bounce_duplicate(bounce.in_dir, bounce.point)) {
      this.intervals.push(bounce);
    }
    
    for (let i = 1; i < nb_splits; i++) {
      let lambda = i / nb_splits;
      let point = new Point(
        lambda * mirror.end.x + (1 - lambda) * mirror.start.x,
        lambda * mirror.end.y + (1 - lambda) * mirror.start.y
      );
      if (mirror.is_reflective) { //if bounce already existing
        bounce = new Bounce(in_dir, point, out_dir);
      } else {
        bounce = new Bounce(in_dir, point, null);
      }
      if (! this._is_bounce_duplicate(bounce.in_dir, bounce.point)) {
        this.intervals.push(bounce);
      }
    }
    bounce = new Bounce(in_dir, mirror.end, null); // mirror endpoint does not reflects
    if (! this._is_bounce_duplicate(bounce.in_dir, bounce.point)) {
      this.intervals.push(bounce);
    }
  }

  _is_bounce_duplicate(in_dir, point) {
    let ans = false;
    for (let bounce of this.intervals) {
      if (bounce.point.isEqual(point) && bounce.in_dir.isEqual(in_dir)){
        ans = true;
        bounce.out_dir = null;
      }
    }
    return ans;
  }

  _computeMapping() {
    for (let bounce of this.intervals) {
      this.exchange.push(this._getNext(bounce));
    }
  }

  _getNext(bounce) {
    if (!bounce.out_dir) {
      // If no bounce
      return -1;
    }
    // Optimize with dico
    let candidate = null;
    let min_dist = +Infinity;
    for (let idx = 0; idx < this.intervals.length; idx++) {
      let next_bounce = this.intervals[idx];
      if (bounce.out_dir.isEqual(next_bounce.in_dir)) {
        // Check same directions
        if (this._areAlign(bounce.point, next_bounce.point, bounce.out_dir)) {
          // then candidate
          let dist = bounce.point.getSquareDist(next_bounce.point);
          if (dist < min_dist) {
            min_dist = dist;
            candidate = idx;
          }
        }
      }
    }
    return candidate;
  }
}

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

  TESTS

* * * * * * * * * * * * * * * * * */

function runTests() {}

function createTestEnv1() {
  /*
    Example from Figure 1.
    POINTS
      A = (0, 0)  B = (4, 4)
      C = (5, 4)  D = (6, 3)
      E = (6, 2)  F = (6, 0)
    MIRRORS
      AB, BC, CD, DE, FA
    RAY
      (7, 3) going to (6, 1)
  */
  mirrors.push(new Mirror(0, 0, 4, 4)); // AB
  mirrors.push(new Mirror(4, 4, 5, 4)); // BC
  mirrors.push(new Mirror(5, 4, 6, 3)); // CD
  mirrors.push(new Mirror(6, 3, 6, 2)); // DE
  mirrors.push(new Mirror(6, 0, 0, 0)); // FA
  ray = new Ray(7, 3, 6, 1);
}

function createTestEnv2() {
  GRIDS = 20;
  mirrors.push(new Mirror(0, 3, 0, 7));
  mirrors.push(new Mirror(0, 7, 3, 10));
  mirrors.push(new Mirror(3, 10, 7, 10));
  mirrors.push(new Mirror(7, 10, 10, 7));
  mirrors.push(new Mirror(10, 7, 10, 3));
  mirrors.push(new Mirror(10, 3, 7, 0));
  mirrors.push(new Mirror(7, 0, 3, 0));
  mirrors.push(new Mirror(3, 0, 0, 3));
  ray = new Ray(2, 4, 2, 6);
}

function createTestEnv3() {
  // basically test 1 but with CD non-reflective
  mirrors.push(new Mirror(0, 0, 4, 4)); // AB
  mirrors.push(new Mirror(4, 4, 5, 4)); // BC
  mirrors.push(new Mirror(5, 4, 6, 3, NON_REFLECTIVE)); // CD
  mirrors.push(new Mirror(6, 3, 6, 2)); // DE
  mirrors.push(new Mirror(6, 0, 0, 0)); // FA
  ray = new Ray(7, 3, 6, 1);
}

/* * * * * * * * * * * * * * * * *

  SETUP FUNCTION

* * * * * * * * * * * * * * * * * */

function setup() {
  // TESTS
  runTests();

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

  n_steps_input = makeInput(425, 20 + 25 * 9, N_STEPS_DEFAULT);
  n_steps_text = createElement("h3", "steps");
  n_steps_text.position(
    n_steps_input.x + n_steps_input.width + 5,
    n_steps_input.y - 20
  );

  fire_button = makeButton("Fire the ray!", 425, 20 + 25 * 10, fireTheRay);

  test_select = createSelect();
  test_select.size(BUTTON_X_SIZE, BUTTON_Y_SIZE);
  test_select.position(425, 20 + 25 * 12);
  test_select.changed(selectHandler);
  test_select.option("None", 0);
  test_select.option("Test 1: article reference", 1);
  test_select.option("Test 2: loop", 2);
  test_select.option("Test 3: article + non-reflective", 3);

  test_text = createElement("h3", "tests");
  test_text.position(test_select.x + test_select.width + 5, test_select.y - 20);

  grid_slider = createSlider(8, 50, 12, 2); // min,max,default,step
  grid_slider.position(425, 20 + 25 * 13);
  grid_slider.style("width", "80px");
  grid_text = createElement("h3", "grid");
  grid_text.html("grids: " + (GRIDS_DEFAULT - 2));
  grid_text.position(grid_slider.x + grid_slider.width + 5, grid_slider.y - 20);
  makeButton("Change grid", 425, 20 + 25 * 14, changeGrid);
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

function fireTheRay() {
  let n = parseInt(n_steps_input.value(), 10);

  colorElement(fire_button, "red");

  if (!isNaN(n) && ray !== null && mirrors.length > 0) {
    colorElement(fire_button, "green");
    console.log("[Fire]");
    computeReflections();

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
