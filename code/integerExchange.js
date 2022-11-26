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
