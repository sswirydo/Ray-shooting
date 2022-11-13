/* eslint-disable no-undef, no-unused-vars */

/* * * * * * * * * * * * * * * * *

  CONSTANTS AND VARS

* * * * * * * * * * * * * * * * * */
const TEXT_OFFSET = 5;
const RESOLUTION = 400;
const GRIDS = 8 + 2;
const BUTTON_X_SIZE = 90;
const BUTTON_Y_SIZE = 20;
var rays = [];
var mirrors = [];
var interval_exchange = null;
var clickCount = 0;

/* * * * * * * * * * * * * * * * *

  CLASSES

* * * * * * * * * * * * * * * * * */

class Ray {
  constructor(_xpos, _ypos, _xvector, _yvector) {
    this.x = _xpos;
    this.y = _ypos;
    this.xvector = _xvector;
    this.yvector = _yvector;

    this.directions = [];
    this._computeDirections();

    // start point + each intersection in order
    this.path = [[this.x, this.y]];
  }

  addPointToPath(x, y) {
    this.path.push([x, y]);
  }

  getPath() {
    return this.path;
  }

  getAllDirections() {
    return this.directions;
  }

  _computeDirections() {
    let x_delta = this.xvector - this.x;
    let y_delta = this.yvector - this.y;

    // FIXME only 4 directions
    this.directions.push([x_delta, y_delta]); // +x +y (12h)
    this.directions.push([y_delta, x_delta]); // +y +x (UP-RIGHT)
    this.directions.push([y_delta, -x_delta]); // +y -x (3h) (RIGHT)
    this.directions.push([x_delta, -y_delta]); // +x -y (DOWN-RIGHT)
    this.directions.push([-x_delta, -y_delta]); // -x -y (6h) (DOWN)
    this.directions.push([-y_delta, -x_delta]); // -y -x (DOWN-LEFT)
    this.directions.push([-y_delta, x_delta]); // -y +x (9h) (LEFT)
    this.directions.push([-x_delta, y_delta]); // -x +y (UP-LEFT)
  }
}

const HORIZONTAL = 0; // -
const VERTICAL = 1; // |
const DIAGONAL_UP = 2; // /
const DIAGONAL_DOWN = 3; // \

class Mirror {
  constructor(_x1, _y1, _x2, _y2) {
    this.x1 = _x1;
    this.y1 = _y1;
    this.x2 = _x2;
    this.y2 = _y2;
    this.reflective = true; //fixme
  }

  getLength() {
    return ((this.x2 - this.x1) ** 2 + (this.y2 - this.y1) ** 2) ** -2;
  }

  getSlope() {
    return (this.y2 - this.y1) / (this.x2 - this.x1);
  }

  getType() {
    let ans = false;
    if (this.x1 === this.x2) {
      ans = VERTICAL;
    } else if (this.y1 === this.y2) {
      ans = HORIZONTAL;
    } else if (
      (this.x1 < this.x2 && this.y1 < this.y2) ||
      (this.x1 > this.x2 && this.y1 > this.y2)
    ) {
      ans = DIAGONAL_UP;
    } else {
      ans = DIAGONAL_DOWN;
    }
    return ans;
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
}

class SlicedMirror extends Mirror {
  constructor(mirror, ray) {
    super(mirror.x1, mirror.y1, mirror.x2, mirror.y2);

    // -- ARGUMENTS -- //
    this.nb_unit_segments = max(abs(this.x2 - this.x1), abs(this.y2 - this.y1)); // number of unit segments in the mirror
    this.slices = []; // slices [direction] [slice] [x or y coord]

    // -- CONSTRUCTION -- //
    this._slice(ray);
  }

  getAllSlices() {
    return this.slices;
  }

  getSlices(ray_direction) {
    return this.slices[ray_direction];
  }

  getTotalOfSlices(ray_direction) {
    return this.slices[ray_direction].length;
  }

  _slice(ray) {
    /*
      TODO+FIXME: create ray-mirror intersection points
                  that directly contain the input
                  and the ouput ray directions
    */

    for (const direction of ray.getAllDirections()) {
      // FIXME (optimization) use 4 directions (computations /2)
      let ray_slope = direction[1] / direction[0];
      let nb_slices; // number of mirror slices
      if (this.getType() === HORIZONTAL) {
        nb_slices = this.nb_unit_segments * abs(direction[1]); // intersections = |y|
      } else if (this.getType() === VERTICAL) {
        nb_slices = this.nb_unit_segments * abs(direction[0]); // intersections = |x|
      } else if (
        (this.getType() === DIAGONAL_UP && ray_slope > 0) ||
        (this.getType() === DIAGONAL_DOWN && ray_slope < 0)
      ) {
        nb_slices =
          this.nb_unit_segments * abs(abs(direction[0]) - abs(direction[1])); // intersections same slope = ||x|-|y||
      } else {
        nb_slices =
          this.nb_unit_segments * abs(abs(direction[0]) + abs(direction[1])); // intersections opp slope = ||x|+|y||
      }

      let slice_dir_coords = [[this.x1, this.y1]];
      for (let i = 1; i <= nb_slices; i++) {
        let lambda = i / nb_slices; // linear combination
        slice_dir_coords.push([
          lambda * this.x2 + (1 - lambda) * this.x1,
          lambda * this.y2 + (1 - lambda) * this.y1
        ]);
      }
      this.slices.push(slice_dir_coords);
    }
  }
}

class IntervalExchange {
  constructor(mirrors, ray) {
    // -- ATTRIBUTES -- //
    this.nb_orientations = ray.getAllDirections().length;
    this.sliced_mirrors = [];
    this.exchange = null;

    // -- CONSTRUCTION -- //
    //this._createFakeEscapeMirror();
    this._divideMirrors(mirrors, ray);
    this._formBigIntInterval();
    this._map();
    //this._optimiseWithTopology();
  }

  _optimiseWithTopology() {}
  getNext(mirror, slope) {}
  getPrevious(mirror, slope) {}
  _createFakeEscapeMirror() {}

  /*
    "Count positions at which a ray of that slope can hit."
  */
  _divideMirrors(mirrors, ray) {
    for (const mirror of mirrors) {
      this.sliced_mirrors.push(new SlicedMirror(mirror, ray));
    }
  }

  /*
    "Concatenate all these sequences of positions
    for (mirror, slope) pairs into one big integer interval."
  */
  _formBigIntInterval() {}

  /*
    "Form subintervals for where a reflected ray will go next."
  */
  _map(ray) {}

}

class ReflectivePoint {
  constructor(x, y, input_orientation, output_orientation) {
    this.x = x;
    this.y = y;
    this.input = input_orientation;
    this.output = output_orientation;
  }
}

/* bah quoi.. dans tous les cas t'as dis tu vas refactor.. */
class Transformer {
  static inputRayToOutputRay(input_ray, mirror) {
    let output_ray = null;
    let is_horizontal = mirror.getType() === HORIZONTAL;
    let is_vertical = mirror.getType() === VERTICAL;
    let is_rising =
      (this.getType() === DIAGONAL_UP && ray_slope > 0) ||
      (this.getType() === DIAGONAL_DOWN && ray_slope < 0);

    if (is_horizontal) {
    } else if (is_vertical) {
    } else if (is_rising) {
    } else {
    }

    return output_ray;
  }
}

class Node {
  constructor(x, y, input_orientation, mirror) {
    this.x = x;
    this.y = y;

    this.input_orientation = input_orientation;
    this.output_orientation = null;

    this.next_node = null;
    this.previous_node = null;

    this.mirror = mirror;
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
  interval_exchange = new IntervalExchange(mirrors, rays[0]);
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
  rays.push(new Ray(1, 1, -2 + 1, 1 + 1));
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
  rays.push(new Ray(7, 3, 6, 1));
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
  rays = [];
  mirrors = [];
  interval_exchange = null;
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
  console.log("[Fire]");
  computeReflections();
}

function importTest1() {
  resetEnv();
  createTestEnv1();
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
      xToP5(mirror.x1),
      yToP5(mirror.y1),
      xToP5(mirror.x2),
      yToP5(mirror.y2)
    );
    drawMirrorSlices();
    msg1 = "(" + mirror.x1.toString() + "," + mirror.y1.toString() + ")";
    msg2 = "(" + mirror.x2.toString() + "," + mirror.y2.toString() + ")";
    text(msg1, xToP5(mirror.x1) + TEXT_OFFSET, yToP5(mirror.y1) - TEXT_OFFSET);
    text(msg2, xToP5(mirror.x2) + TEXT_OFFSET, yToP5(mirror.y2) - TEXT_OFFSET);
  }
}

function drawMirrorSlices() {
  if (interval_exchange !== null) {
    stroke(1, 1, 255);
    for (const sliced_mirror of interval_exchange.sliced_mirrors) {
      for (const slice_per_ray_dir of sliced_mirror.getAllSlices()) {
        for (const slice of slice_per_ray_dir) {
          ellipse(xToP5(slice[0]), yToP5(slice[1]), 4, 4);
        }
      }
    }
    stroke(0);
  }
}

function drawRay() {
  let msg;
  for (const ray of rays) {
    drawRayDirections(ray);
    stroke(255, 1, 1);
    line(xToP5(ray.x), yToP5(ray.y), xToP5(ray.xvector), yToP5(ray.yvector));
    ellipse(xToP5(ray.x), yToP5(ray.y), 8, 8);
    msg = "(" + ray.x.toString() + "," + ray.y.toString() + ")";
    text(msg, xToP5(ray.x) + TEXT_OFFSET, yToP5(ray.y) - TEXT_OFFSET);
  }
  stroke(0);
}

windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
};

function drawRayDirections(ray) {
  let count = 0;
  for (const dir of ray.getAllDirections()) {
    stroke(1, 255, 1);
    line(
      xToP5(ray.x),
      yToP5(ray.y),
      xToP5(ray.x + dir[0]),
      yToP5(ray.y + dir[1])
    );
    let msg = "[" + count.toString() + "]";
    fill("black");
    text(
      msg,
      xToP5(ray.x + dir[0]) + TEXT_OFFSET,
      yToP5(ray.y + dir[1]) + TEXT_OFFSET
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
}
