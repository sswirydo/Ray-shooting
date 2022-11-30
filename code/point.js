class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  isEqual(point) {
    return this.x === point.x && this.y === point.y;
  }

  /*
    Returns the squared euclidean distance between self and another point.
    NB: We are just interested to compare 2 distances, not to compute the exact distance.
    Therefore, the square root is not useful.
  */
  getSquareDist(point) {
    return (this.x - point.x) ** 2 + (this.y - point.y) ** 2;
  }

  /*
    Return the slope of the line passing through self and another point.
  */
  getSlope(point) {
    return (point.y2 - this.y) / (point.x - this.x);
  }
}
