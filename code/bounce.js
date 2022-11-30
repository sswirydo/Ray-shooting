class Bounce {
  /*
    A 'Bounce' object representing a bounce in our environment and is discribed by 3 attributs:
      - in_dir: The input direction of the light ray before the reflection.
      - point: A 'Point' (x,y) representing the location of the bounce (i.e. location of the collision between ray and mirror).
      - out_dir: The output direction of the ligth ray after the reflection (depends on the 'in_dir' and mirror's orientation).
      - is_reflective: Boolean if the bounce reflects or not (i.e. if it is not an endpoint mirror or part of non-reflective surface).
  */
  constructor(in_dir, point, out_dir, reflects=true) {
    this.in_dir = in_dir;
    this.point = point;
    this.out_dir = out_dir;
    this.reflects = reflects;
  }
}

