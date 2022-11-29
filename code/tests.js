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
  // loop
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
