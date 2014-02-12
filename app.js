function Color() {}

Color.prototype.hexToRGB = function(hex) {
    if (!hex) return null;

    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function Polygon(points) {
    this.topLeft = points[0];
    this.topRight = points[1];
    this.bottomLeft = points[2];
    this.bottomRight = points[3];
    this.fill = randColor("#15ac4f", null, true);
    this.center = new vector(
        this.topLeft.x + (this.topRight.x - this.topLeft.x) / 2,
        this.topLeft.y + (this.bottomLeft.y - this.topLeft.y) / 2
    );
}

Polygon.prototype.update = function(delta){
    this.bottomRight.update(delta);
}

Polygon.prototype.resolveConstraints = function(rows, row, cols, col){
    this.bottomRight.resolveConstraints();
}

Polygon.prototype.rgb = function() {
    return 'rgb(' + this.fill.r + ',' + this.fill.g + ',' + this.fill.b + ')';
}

Polygon.prototype.appendTo = function(svg) {
    if (this.el) {
        return;
    }
    this.el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    svg.appendChild(this.el);
}

Polygon.prototype.render = function(svg, dimensions) {
    if (!this.el) {
        this.appendTo(svg);
    }

    var path = '';
    for (var i = 0, arr = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft], len = arr.length; i < len; i++) {
        path += " " + Math.floor((arr[i].x / 100) * dimensions.w) + ',' + Math.floor((arr[i].y / 100) * dimensions.h);
    }

    this.el.setAttribute('style', 'fill: ' + this.rgb() + ';fill-opacity:1;');
    this.el.setAttribute('points', path);
}

function matrix2d(rows, cols) {
    var result = new Array(rows);
    for (var i = 0; i < rows; i++) {
        result[i] = new Array(cols);
    }
    return result;
}

function generatePoints(cols, rows) {
    var polygons = matrix2d(rows, cols),
        rowHeight = 100 / rows,
        colWidth = 100 / cols;

    forEach(polygons, function(row, r){
        forEach(row, function(col, c){
            var topLeft,
                topRight,
                bottomLeft,
                bottomRight,
                bottom,
                right;

            if (!r) {
                topRight = new vector((c + 1) * colWidth, 0);
            } else {
                topRight = polygons[r - 1][c].bottomRight;
            }

            if (c === 0) {
                if (r === 0) {
                    topLeft = new vector(0, 0);
                } else {
                    topLeft = polygons[r - 1][0].bottomLeft;
                }
                bottomLeft = new vector(0, (r + 1) * rowHeight);
            } else {
                topLeft = polygons[r][c - 1].topRight;
                bottomLeft = polygons[r][c - 1].bottomRight;
            }

            bottomRight = new vector((c + 1) * colWidth, (r + 1) * rowHeight);

            // pin the outer vectors
            if(c === row.length - 1) {
                bottomRight.pin();
                topRight.pin();
            }
            if(r === polygons.length - 1) {
                bottomRight.pin();
                bottomLeft.pin();
            }
            if(c === 0) {
                bottomLeft.pin();
                topLeft.pin();
            }
            if(r === 0) {
                topLeft.pin();
                topRight.pin();
            }

            // jitter - top right x - if i is 0
            // jitter - bottom left y - if j is 0
            // jitter - bottom right x and y - y if i < rows,  x if j < cols

            if (c === 0 && r < rows - 1) {
                jitter(bottomLeft, 'y', rowHeight);
            }

            if (r === 0 && c < cols - 1) {
                jitter(topRight, 'x', colWidth);
            }

            if (r < rows - 1) {
                jitter(bottomRight, 'y', rowHeight);
            }

            if (c < cols - 1) {
                jitter(bottomRight, 'x', colWidth);
            }


            //attach constrains for Verlet engine
            bottomRight.attach(topLeft, bottomLeft, topRight);

            polygons[r][c] = new Polygon([topLeft, topRight, bottomLeft, bottomRight]);
        })
    })

    return polygons;
}

function jitter(point, attr, dimension) {
    point[attr] += Math.random() * (Math.random() > .5 ? -1 : 1) * dimension * .175;
}

function randColor(hex, distance, monochrome) {
    var rgb = new Color().hexToRGB(hex),
        distance = distance || 10,
        obj = {},
        args = ['r', 'g', 'b'];

    if (!rgb) {
        distance = 127.5;
        rgb = {};
        rgb.r = rgb.g = rgb.b = 127.5;
    }

    if (!monochrome) {
        for (var i = 0, len = args.length; i < len; i++) {
            var selectedColor = rgb[args[i]],
                colorVariance = rgb ? [Math.max(0, selectedColor - distance), Math.min(255, selectedColor + distance)] : [0, 255],
                colorRangeDistance = colorVariance[1] - colorVariance[0];
            obj[args[i]] = Math.floor(Math.random() * colorRangeDistance) + colorVariance[0];
        }
    } else {
        var selectedColor = rgb.r,
            colorVariance = rgb ? [Math.max(0, selectedColor - distance), Math.min(255, selectedColor + distance)] : [0, 255],
            colorRangeDistance = colorVariance[1] - colorVariance[0],
            colorDelta = Math.floor(Math.random() * colorRangeDistance);

        for (var i = 0, len = args.length; i < len; i++) {
            obj[args[i]] = colorDelta + rgb[args[i]];
        }
    }

    return obj;
}

function createSVG(el) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("version", "1.1");
    (el || document.body).appendChild(svg);
    return svg;
}

function renderScene() {
    var self = this;

    requestAnimationFrame(function() {
        for (var i = 0; i < self.rows; i++) {
            for (var j = 0; j < self.cols; j++) {
                self.pointCloud[i][j].render(self.svg, {
                    w: self.w,
                    h: self.h
                });
            }
        }
    });
}

function theLoop(renderer) {
    var iterations = 1,
        self = this;

    forEach(self.pointCloud, function(Row, row) {
        if (row === self.pointCloud.length - 1) return;
        forEach(Row, function(polygon, col) {
            polygon.resolveConstraints(self.pointCloud.length, row, Row.length, col);
        });
    });

    var forcePower = .35;

    if(this.mouse.on){
        var dx = this.mouse.x - (this.center.topLeft.x/100)*this.w,
            dy = this.mouse.y - (this.center.topLeft.y/100)*this.h,
            center = this.center;

        center.topLeft.addForce(dx*forcePower, dy*forcePower);
        center.topRight.addForce(dx*forcePower, dy*forcePower);
        center.bottomLeft.addForce(dx*forcePower, dy*forcePower);
        center.bottomRight.addForce(dx*forcePower, dy*forcePower);
    }

    forEach(self.pointCloud, function(Row, r) {
        if (r === self.pointCloud.length - 1) return;
        forEach(Row, function(polygon, col) {
            polygon.update(forcePower/2, self);
        });
    });
    renderer();
}

function forEach(arr, fn) {
    arr = arr instanceof Array ? arr : [].slice.call(arr);
    for (var i = 0, len = arr.length; i < len; i++) {
        fn(arr[i], i);
    }
}

function bind(fn, context /**, args **/ ) {
    var args = [].slice.call(arguments);
    args.splice(0, 2);
    return function() {
        fn.apply(context, args.concat([].slice.call(arguments)));
    }
}

function init() {
    var width = parseInt(window.getComputedStyle(document.querySelector('html')).width, 10),
        height = parseInt(window.getComputedStyle(document.querySelector('html')).height, 10),
        rows = 15,
        cols = 20,
        matrix = generatePoints(cols, rows),
        renderContext = {
            svg: createSVG(),
            rows: rows,
            cols: cols,
            pointCloud: matrix,
            mouse: { distance: 200 },
            center: matrix[Math.round(rows/2) - 1][Math.round(cols/2) - 1],
            w: width,
            h: height
        };

    var renderer = bind(renderScene, renderContext);

    window.addEventListener('resize', function() {
        renderContext.w = parseInt(window.getComputedStyle(document.querySelector('html')).width, 10);
        renderContext.h = parseInt(window.getComputedStyle(document.querySelector('html')).height, 10);
        renderer();
    });

    var loop = bind(theLoop, renderContext, renderer);
    var recursiveAnim = function() {
        loop();
        requestAnimationFrame(recursiveAnim);
    };
    requestAnimationFrame(recursiveAnim);

    window.addEventListener("mousemove", function(e){
        renderContext.mouse.x = e.pageX;
        renderContext.mouse.y = e.pageY;
        renderContext.mouse.on = true;
    })

    window.addEventListener("mouseout", function(e){
        renderContext.mouse.on = false;
    })
}

window.addEventListener("load", init);