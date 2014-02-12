function vector(x, y) {
    this.px = this.x = x || 0;
    this.py = this.y = y || 0;
    this.vx = 0;
    this.vy = 0;
    this.constraints = [];
}

vector.prototype.pin = function() {
    this.pinned = true;
}

vector.prototype.add = function(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
}

vector.prototype.sub = function(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
}

vector.prototype.mul = function(v) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
}

vector.prototype.scale = function(coef) {
    this.x *= coef;
    this.y *= coef;
    return this;
}

vector.prototype.equals = function(v) {
    return this.x == v.x && this.y == v.y;
}

vector.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
}

vector.prototype.dist = function(v) {
    var x = v.x - this.x;
    var y = v.y - this.y;
    return Math.sqrt(x * x + y * y);
}

vector.prototype.normal = function() {
    var m = Math.sqrt(this.x * this.x + this.y * this.y);
    return new vector(this.x / m, this.y / m);
}

vector.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y;
}

vector.prototype.angle = function(v) {
    return Math.atan((v.y - this.y) / (v.x - this.x));
}

vector.prototype.rotate = function(origin, theta) {
    if(this.pinned) return this;
    var x = this.x - origin.x;
    var y = this.y - origin.y;
    this.x = x * Math.cos(theta) - y * Math.sin(theta) + origin.x;
    this.y = x * Math.sin(theta) + y * Math.cos(theta) + origin.y;
    return this;
}

vector.prototype.rotateBy = function(origin, theta) {
    if(this.pinned) return this;
    var x = this.x - origin.x;
    var y = this.y - origin.y;
    this.vx = x * Math.cos(theta) - y * Math.sin(theta) + origin.x;
    this.vy = x * Math.sin(theta) + y * Math.cos(theta) + origin.y;
    return this;
}

vector.prototype.attach = function (/** points **/) {
    var points = [].slice.call(arguments),
        self = this;
    forEach(points, function(point, i){
        (self.constraints.indexOf(point) === -1) && self.constraints.push(new Constraint(self, point));
    });
}

vector.prototype.resolveConstraints = function () {
    var i = this.constraints.length;
    while (i--) this.constraints[i].resolve();
}

vector.prototype.addForce = function (x, y) {
    this.vx += x;
    this.vy += y;
}

vector.prototype.update = function (delta) {
    if(this.pinned) return this;

    // this.addForce(0, 100); //gravity?

    nx = this.x + ((this.x - this.px) * .99) + ((this.vx / 2) * delta);
    ny = this.y + ((this.y - this.py) * .99) + ((this.vy / 2) * delta);

    this.px = this.x;
    this.py = this.y;

    this.x = nx;
    this.y = ny;

    this.vy = this.vx = 0
};

vector.prototype.clone = function() {
    return new vector(this.x, this.y);
}

vector.prototype.toString = function() {
    return "(" + this.x + ", " + this.y + ")";
}

/**
 * -------------------------------> Constraints
 */
function Constraint (p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = p1.dist(p2);
};

Constraint.prototype.resolve = function () {
    var diff_x = this.p1.x - this.p2.x,
        diff_y = this.p1.y - this.p2.y,
        dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y),
        diff = (this.length - dist) / dist;

    var px = diff_x * diff * .5;
    var py = diff_y * diff * .5;

    if(!this.p1.pinned) {
        this.p1.x += px;
        this.p1.y += py;
    }
    if(!this.p2.pinned) {
        this.p2.x -= px;
        this.p2.y -= py;
    }
};
