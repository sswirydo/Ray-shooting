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

  /*
    Stores the points from which the ray has been reflected.
    Useful for drawing.
  */
  addPointToPath(point) {
    this.path.push(point);
  }

  /*
    Returns all the possible direction to which a ray can reflect.
  */
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
