/* eslint-disable no-undef, no-unused-vars */

/* * * * * * * * * * * * * * * * *

  CONSTANTS AND VARS

* * * * * * * * * * * * * * * * * */
const EPSILON = 0.00001;
const TEXT_OFFSET = 5;
const RESOLUTION = 400;
const GRIDS = 10 + 2;
const BUTTON_X_SIZE = 90;
const BUTTON_Y_SIZE = 20;
var mirrors = [];
var interval_exchange = null;
var ray = null;
var clickCount = 0;

const HORIZONTAL = 0; // -
const VERTICAL = 1; // |
const DIAGONAL_UP = 2; // /
const DIAGONAL_DOWN = 3; // \

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

  addPointToPath(point) {
    this.path.push(point);
  }

  _computeDirections() {
    // FIXME only 4 direction
    let directions = [];
    directions.push(new Point(this.dir.x, this.dir.y)); // +x +y (12h)
    directions.push(new Point(this.dir.y, this.dir.x)); // +y +x (UP-RIGHT)
    directions.push(new Point(this.dir.y, -this.dir.x)); // +y -x (3h) (RIGHT)
    directions.push(new Point(this.dir.x, -this.dir.y)); // +x -y (DOWN-RIGHT)
    directions.push(new Point(-this.dir.x, -this.dir.y)); // -x -y (6h) (DOWN)
    directions.push(new Point(-this.dir.y, -this.dir.x)); // -y -x (DOWN-LEFT)
    directions.push(new Point(-this.dir.y, this.dir.x)); // -y +x (9h) (LEFT)
    directions.push(new Point(-this.dir.x, this.dir.y)); // -x +y (UP-LEFT)
    return directions;
  }

  print() {
    console.log(
      `Laser: from (${this.start.x},${this.start.y}) with direction (${this.dir.x},${this.dir.y})`
    );
  }
}

class Mirror {
  constructor(x1, y1, x2, y2) {
    this.start = new Point(x1, y1);
    this.end = new Point(x2, y2);
    this.size = max(abs(x1 - x2), abs(y1 - y2)); // nbr of unit segment
    this.orientation = this._determineOrientation();
    this.reflective = true; //fixme
    this.print();
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

class IntegerInterval {
  constructor(ray, mirrors) {
    this.intervals = []; // List of 'Bounce' of the integer interval ('Bounce' contains in_dir, point, out_dir)
    this.exchange = []; // Mapping for the intervals

    this._compute(ray, mirrors);
    console.log("INTERVALS", this.intervals);
    console.log("EXCHANGE", this.exchange);
  }

  f(ray, n) {
    let previous_idx = null;
    let bounce_idx = this._getFirstBounce(ray);
    for (let i = 0; i < n; i++) {
      ray.addPointToPath(this.intervals[bounce_idx].point);
      previous_idx = bounce_idx;
      bounce_idx = this.exchange[bounce_idx];
      if (bounce_idx === null || bounce_idx === -1) {
        console.log(
          "oups. ",
          "i:",
          i,
          "prev:",
          previous_idx,
          "next:",
          bounce_idx,
          "next_bounce",
          this.intervals[previous_idx]
        );
        break;
      }
    }
  }

  _getFirstBounce(ray) {
    let candidate = null;
    let min_dist = +Infinity;
    for (let idx = 0; idx < this.intervals.length; idx++) {
      let next_bounce = this.intervals[idx];
      if (ray.dir.isEqual(next_bounce.in_dir)) {
        // Check same directions
        let lambda_x = (next_bounce.point.x - ray.start.x) / ray.dir.x;
        let lambda_y = (next_bounce.point.y - ray.start.y) / ray.dir.y;
        if (abs(lambda_x - lambda_y) <= EPSILON && lambda_x > 0) {
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

  // returns idx of the first bounce
  _OLDgetFirstBounce(ray) {
    // ULTRA FIXME: works for 1 case only (test purpose)
    let candidates = [];
    for (let i = 0; i < this.intervals.length; i++) {
      let bounce = this.intervals[i];
      if (
        bounce.point.x === 5.5 &&
        bounce.point.y === 0 &&
        bounce.in_dir.x === ray.dir.x &&
        bounce.in_dir.y === ray.dir.y
      ) {
        candidates.push(i);
      } else {
      }
    }
    // console.log("Candidates length test:", candidates.length);
    return candidates[0];
  }

  _compute(ray, mirrors) {
    for (let dir of ray.directions) {
      for (let mirror of mirrors) {
        let [nb_splits, bounce_dir] = this._getAllBounces(mirror, dir);
        this._addBounces(mirror, nb_splits, dir, bounce_dir);
      }
    }
    this._computeMapping();
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
      // throw "Unexpected case (fct: _getAllBounces())";
    }
  }

  _addBounces(mirror, nb_splits, in_dir, out_dir) {
    this.intervals.push(new Bounce(in_dir, mirror.start, null)); // miroir endpoint does not reflects
    for (let i = 1; i < nb_splits; i++) {
      let lambda = i / nb_splits;
      let point = new Point(
        lambda * mirror.end.x + (1 - lambda) * mirror.start.x,
        lambda * mirror.end.y + (1 - lambda) * mirror.start.y
      );
      this.intervals.push(new Bounce(in_dir, point, out_dir));
    }
    this.intervals.push(new Bounce(in_dir, mirror.end, null)); // miroir endpoint does not reflects
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
        let lambda_x =
          (next_bounce.point.x - bounce.point.x) / bounce.out_dir.x;
        let lambda_y =
          (next_bounce.point.y - bounce.point.y) / bounce.out_dir.y;
        if (abs(lambda_x - lambda_y) <= EPSILON && lambda_x > 0) {
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

function computeReflections() {
  interval_exchange = new IntegerInterval(ray, mirrors);
}

/* * * * * * * * * * * * * * * * *

  TESTS

* * * * * * * * * * * * * * * * * */

function runTests() {}

function createTestEnv1() {
  /*
    Example from Figure 5. (erronous?)
    POINTS
      A = (0,0)  B = (0,2)
      C = (2,2)  D = (1, 0)
    MIRRORS
      AB, BC, CD
    RAY
      (1,1) with -1/2 slope (0, 0) -> (-2, 1)
  */
  mirrors.push(new Mirror(0, 0, 0, 2)); // AB
  mirrors.push(new Mirror(0, 2, 2, 2)); // BC
  mirrors.push(new Mirror(2, 2, 1, 0)); // CD
  ray = new Ray(1, 1, -2 + 1, 1 + 1);
}

function createTestEnv2() {
  /*
    Example from Figure 1. (erronous?)
    POINTS
      A = (0, 0)  B = (4, 4)
      C = (5, 4)  D = (6, 3)
      E = (6, 2)  F = (6, 0)
    MIRRORS
      AB, BC, CD, DE, FA
    RAY
      (?) I suppose it is (7, 3) going to (6, 1)
  */
  mirrors.push(new Mirror(0, 0, 4, 4)); // AB
  mirrors.push(new Mirror(4, 4, 5, 4)); // BC
  mirrors.push(new Mirror(5, 4, 6, 3)); // CD
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
  button = makeButton("Test #2", 425, 20 + 25 * 12, importTest2);
}

/* * * * * * * * * * * * * * * * *

  BUTTONS

* * * * * * * * * * * * * * * * * */
function makeButton(name, xpos, ypox, foo) {
  let button = createButton(name);
  button.position(xpos, ypox);
  button.mousePressed(foo);
  button.size(BUTTON_X_SIZE, BUTTON_Y_SIZE);
  return button;
}

function resetEnv() {
  console.clear();
  ray = null;
  mirrors = [];
  interval_exchange = null;

  clickCount = 0;
  x1_input.value("");
  y1_input.value("");
  x2_input.value("");
  y2_input.value("");
  x1_text.html("x1 ←");
  y1_text.html("y1 ←");
  x2_text.html("x2");
  y2_text.html("y2");

  console.log("[Environment reset]");
}

function addRay() {
  ray = new Ray(
    parseInt(x1_input.value(), 10),
    parseInt(y1_input.value(), 10),
    parseInt(x2_input.value(), 10),
    parseInt(y2_input.value(), 10)
  );
  console.log("[Ray added]");
}

function addMirror() {
  let [x1, x2, y1, y2] = [
    parseInt(x1_input.value(), 10),
    parseInt(x2_input.value(), 10),
    parseInt(y1_input.value(), 10),
    parseInt(y2_input.value(), 10)
  ];
  if (x1 === x2 || y1 === y2 || abs(x2 - x1) === abs(y2 - y1)) {
    // If correct orientation
    mirrors.push(new Mirror(x1, y1, x2, y2));
    console.log("[Mirror added]");
  }
}

function fireTheRay() {
  console.log("[Fire]");
  computeReflections();
  console.log("[Earth]");
  interval_exchange.f(ray, 999);
  console.log("[Water]");
}

function importTest1() {
  resetEnv();
  createTestEnv1();
  console.log(mirrors);
  console.log(ray);
}

function importTest2() {
  resetEnv();
  createTestEnv2();
}

/* * * * * * * * * * * * * * * * *

  DRAW FUNCTIONS

* * * * * * * * * * * * * * * * * */

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

/* * * * * * * * * * * * * * * * *

  OTHER P5 FUNCTIONS

* * * * * * * * * * * * * * * * * */

function draw() {
  const CANVAS_SIZE = 400;
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  background(230, 255, 255);
  drawIntegerGrid();
  drawMirrors();
  drawRay();
}

function drawMirrors() {
  let msg1, msg2;
  for (const mirror of mirrors) {
    line(
      xToP5(mirror.start.x),
      yToP5(mirror.start.y),
      xToP5(mirror.end.x),
      yToP5(mirror.end.y)
    );
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
  if (interval_exchange) {
    stroke(1, 1, 255);
    for (let bounce of interval_exchange.intervals) {
      ellipse(xToP5(bounce.point.x), yToP5(bounce.point.y), 4, 4);
    }
    stroke(0);
  }
}

function drawRay() {
  let msg;
  drawRayDirections(ray);
  stroke(255, 1, 1);
  line(
    xToP5(ray.start.x),
    yToP5(ray.start.y),
    xToP5(ray.start.x + ray.dir.x),
    yToP5(ray.start.y + ray.dir.y)
  );
  ellipse(xToP5(ray.start.x), yToP5(ray.start.y), 8, 8);
  msg = "(" + ray.start.x.toString() + "," + ray.start.y.toString() + ")";
  text(msg, xToP5(ray.start.x) + TEXT_OFFSET, yToP5(ray.start.y) - TEXT_OFFSET);

  stroke(0);

  drawRayPath();
}

function drawRayPath() {
  stroke("pink");
  for (let i = 0; i < ray.path.length - 1; i++) {
    let start = ray.path[i];
    let end = ray.path[i + 1];
    line(xToP5(start.x), yToP5(start.y), xToP5(end.x), yToP5(end.y));
  }
  stroke("black");
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
  redraw();
}
