class IntegerExchange {

  /*
    Constructor. 
    Takes the mirror environment and the initial ray as reference for construction.
    Starts by surrounding the mirror environment using a non-reflective bounding box,
    then computes all the possible bounces.
  */
  constructor(ray, mirrors) {
    this.intervals = []; // List of 'Bounce' of the integer interval ('Bounce' contains: (in_dir, point, out_dir))
    this.max_nbr_bounces = null;
    this.trap_idxs = []; // Indexes where to add trap
    this.exchange = []; // Mapping for the intervals

    let bbox = [ // The big surronding box absorbing exiting rays
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

  /*
    Debug function that allows to retrieve all the bounces
    at (x,y) position.
  */
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

  /*
    Takes as input the light ray 'ray' we want to know the output,
    and the number 'n' for the maximal number of iterations.

    The function start by seeking the first bounce
    by matching the output direction of the ray
    with the first bounce of the same input direction
    in its path.
    Then, it simply loops from bounce to bounce at most n times.

    The output is stored in the ray.path path list. 
  */
  f(ray, n) {
    let previous_idx = null;
    let bounce_idx = this._getFirstBounce(ray);
    if (bounce_idx) {
      for (let i = 0; i < n; i++) {
        if (this.intervals[bounce_idx] !== "TRAP") {
          ray.addPointToPath(this.intervals[bounce_idx].point);
        }
        previous_idx = bounce_idx;
        bounce_idx = this.exchange[bounce_idx];
        /*if (bounce_idx === null || bounce_idx === -1) {
          break;
        }*/
      }
    } else {
      console.log(">> Ray does not intersect any mirror.");
      ray.print();
    }
  }



  /* 
    Checks if two points are aligned.
    Returns true/false.
  */
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

  /*
    Main creation process.
    Loops each mirror in each direction,
    creates the bounces and maps them
    one to another.
  */
  _compute(ray, mirrors) {
    for (let dir of ray.directions) {
      for (let mirror of mirrors) {
        let [nb_splits, bounce_dir] = this._getAllBouncesPerMirror(mirror, dir);
        this._addBounces(mirror, nb_splits, dir, bounce_dir);
      }
    }
    this.max_nbr_bounces = this.intervals.length;
    this._addTraps(this.max_nbr_bounces);
    this._computeMapping(this.max_nbr_bounces);
  }

  /*
    Returns the total number of bounces that lie on a mirror,
    and the output direction by which the ray will exit the bounce.
  */
  _getAllBouncesPerMirror(mirror, dir) {
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
      console.error("Unexpected case (fct: _getAllBouncesPerMirror())");
    }
  }

  /*
    Creates the bounce objects.
    Stores them in the this.intervals list.
  */
  _addBounces(mirror, nb_splits, in_dir, out_dir) {

    let bounce = null;
    bounce =  new Bounce(in_dir, mirror.start, in_dir.reverse(), false); // mirror endpoint does not reflects (virtually send back the light ray)
    if (! this._is_bounce_duplicate(bounce.in_dir, bounce.point)) {
      this.trap_idxs.push(this.intervals.length);
      this.intervals.push(bounce);
    }
    
    for (let i = 1; i < nb_splits; i++) {
      let lambda = i / nb_splits;
      let point = new Point(
        lambda * mirror.end.x + (1 - lambda) * mirror.start.x,
        lambda * mirror.end.y + (1 - lambda) * mirror.start.y
      );
      if (mirror.is_reflective) { 
        bounce = new Bounce(in_dir, point, out_dir);
      } else {
        bounce = new Bounce(in_dir, point, out_dir, false); // non-reflective surface does not reflects (virtually reflects like a mirror)
      }
      if (! this._is_bounce_duplicate(bounce.in_dir, bounce.point)) {
        if (! bounce.reflects) { this.trap_idxs.push(this.intervals.length); }
        this.intervals.push(bounce);
      }
    }
    bounce = new Bounce(in_dir, mirror.end, in_dir.reverse(), false); // mirror endpoint does not reflects  (virtually send back the light ray)
    if (! this._is_bounce_duplicate(bounce.in_dir, bounce.point)) {
      this.trap_idxs.push(this.intervals.length);
      this.intervals.push(bounce);
    }
  }

  /*
    Add traps in 'intervals'.
    It consits in adding 'n' (= size of 'intervals') intermediate nodes when non-reflective bounce.
  */
  _addTraps(size_trap) {
    for (let idx of this.trap_idxs.reverse()) { // reverse to start insertion by the end (easier to add in a list)
      for (let i=0; i< size_trap; i++) {
        this.intervals.splice(idx+1, 0, "TRAP");
      }
    }
  }

  /*
    Maps a bounce to the next bounce.
  */
  _computeMapping(size_trap) {
    let idx = 0;
    while (idx < this.intervals.length) {
      let bounce = this.intervals[idx];
      let next = this._getNext(bounce);
      if (! bounce.reflects) {
        for (let i=0; i<size_trap; i++) {
          idx += 1;
          this.exchange.push(idx);
        }
      }
      this.exchange.push(next);
      idx += 1;
    }
  }

  /*
    Seeks the first bounce a given ray encounters.
    Returns the index of the first bounce.
  */
  _getFirstBounce(ray) {
    return this._getNextCandidate(ray.start, ray.dir);
  }

  /*
    Seeks the first bounce a given bounce encounters.
    Returns the index of the first bounce.
  */
  _getNext(bounce) {
    if (!bounce.out_dir) return -1;
    return this._getNextCandidate(bounce.point, bounce.out_dir);
  }

  /*
    Seeks the first bounce a given ray/bounce encounters.
    Returns the index of that bounce.
  */
  _getNextCandidate(pos, dir) {
    let candidate = null;
    let min_dist = +Infinity;
    for (let idx = 0; idx < this.intervals.length; idx++) {
      let next_bounce = this.intervals[idx];
      if (next_bounce !== "TRAP" && dir.isEqual(next_bounce.in_dir)) {
        // check if bounces have the same direction (in vs out)
        if (this._areAlign(pos, next_bounce.point, dir)) {
          // checks if the bounces are aligned
          let dist = pos.getSquareDist(next_bounce.point);
          // chooses the nearest bounce using simple euclidean distance
          if (dist < min_dist) {
            min_dist = dist;
            candidate = idx;
          }
        }
      }
    }
    return candidate;
  }

 

  /*
    Checks if multiple bounces that have the same position
    and the same input direction exist.
    This might happen if two mirror intersect.
    
    Returns true/false if the given bounce is already stored,
    and sets the out direction of the stored bounce 
    to null to mark it as not reflective.

    Important note.
    Will this might stop the ray from bouncing in cases
    where it shouldn't bounce in the first place,
    it might prevent some "wanted" bounces 
    from bouncing as well, if an endpoint and
    a non-endpoint bounce intersect.
    ("wanted" between quotes, as following
    the article endpoints are non-reflective,
    and technically it is still an endpoint)

    Example. Let's take two reflective mirrors that will
    form a 'T' shape.
    The middle bounce of the horizontal bar is reflective. 
    The upper bounce of the vertical bounce is non-reflective 
    as it is an endpoint.
    Note that those bounces intersect.
    Setting bounce.out_dir = null; prevent a ray hitting from the bottom
    to reflect, as the path is blocked.
    However, if the path reflects from the top, this will
    block that reflection as well.

    Possible way to fix:
    add to the bounce a tag telling if it is an endpoint or not,
    and allow incoming rays only from a given set range.
  */
  _is_bounce_duplicate(in_dir, point) {
    let ans = false;
    for (let bounce of this.intervals) {
      if (bounce.point.isEqual(point) && bounce.in_dir.isEqual(in_dir)){
        ans = true;
        bounce.out_dir = bounce.in_dir.reverse();
      }
    }
    return ans;
  }
}
