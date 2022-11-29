class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  isEqual(point) {
    return this.x === point.x && this.y === point.y;
  }

  /*
    Returns the euclidean distance between self and another point.
  */
  getSquareDist(point) {
    return (this.x - point.x) ** 2 + (this.y - point.y) ** 2;
  }

  getSlope(point) {
    return (point.y2 - this.y) / (point.x - this.x);
  }
}
