class Mirror {
  /*
    A 'Mirror' object represent a mirror in our environnement and is composed of 5 attributs:
      - start: A 'Point' (x,y) representing the first endpoint of the mirror.
      - end: A 'Point' (x,y)  representing the second endpoint of the mirror.
      - size: An integer representing the number of unit segment inside the mirror (i.e. the number of cases by which passing through).
      - orientation: An integer representing the orientation of the mirror (horizontal, vertical, 45° diagonal-up and 45° diagonal-down).
  */
  constructor(x1, y1, x2, y2, reflective = true) {
    this.start = new Point(x1, y1);
    this.end = new Point(x2, y2);
    this.size = max(abs(x1 - x2), abs(y1 - y2)); // nbr of unit segment
    this.orientation = this._determineOrientation();
    this.print();
    /* Note:
      actually EACH SIDE of the mirror COULD be marked as reflective or non reflective
      but we simplified it to both side as it would unnecessarily complicate the implementation for not much
    */
    this.is_reflective = reflective;
  }

  getLength() {
    return this.start.getSquareDist(this.end);
  }

  getSlope() {
    return this.start.getSlope(this.end);
  }

  /*
    Returns if the mirror if horizontal, vertical or diagonal.
  */
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
