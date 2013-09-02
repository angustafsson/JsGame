CanvasRenderingContext2D.prototype.clear =
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
      if (preserveTransform) {
          this.save();
          this.setTransform(1, 0, 0, 1, 0, 0);
      }

      this.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (preserveTransform) {
          this.restore();
      }           
  };

(function () {
    // hook up request animation frame.
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;

})();

(function() {
    var playerBoardWidth = 150;
    var playerBoardHeight = 150;
    var canvas;
    var context;
    var viewModel;
    var previousTimestamp;

    window.addEventListener("keydown", function(event) {

        /*var player = viewModel.players()[0];
        var x = 0;
        var y = 0;
        switch(event.keyCode)
        {
            case 38: //up
                y = Math.floor(Math.random() * parseInt(viewModel.width))	
                break;
            case 39: //right
                x = Math.floor(Math.random() * parseInt(viewModel.width))
                break;
            case 40: //down
                y = Math.floor(Math.random() * parseInt(viewModel.width))
                break;
            case 37: //left
                x = Math.floor(Math.random() * parseInt(viewModel.width))
                break;	

        }

        viewModel.ctx.clear(true); 
        player.move(x, y)	
        player.draw();*/
    });

    function Start() {
        canvas = document.getElementById('canvas');
        canvas.width = playerBoardWidth;
        canvas.height = playerBoardHeight;
        context = canvas.getContext('2d');
        viewModel = new ViewModel(context, playerBoardWidth, playerBoardHeight);
        ko.applyBindings(viewModel, document.getElementById('content-wrapper'));

        previousTimestamp = window.mozAnimationStartTime || Date.now();  // Only supported in FF. Other browsers can use something like Date.now().
        window.requestAnimationFrame(Update);
    }

    function Update(timestamp) {
        var deltaTimeInMilliseconds = timestamp - previousTimestamp;
        previousTimestamp = timestamp;

        if (deltaTimeInMilliseconds <= 0) {
            // if going to fast... make the simulation go at ~60 FPS.
            deltaTimeInMilliseconds = 16.66666667;
        }
        if (deltaTimeInMilliseconds > 66.66666667) {
            // if going to slow, maybe break point... make the simulation go at ~15 FPS.
            deltaTimeInMilliseconds = 66.66666667;
        }

        if (!viewModel.pause()) {
            var deltaTime = deltaTimeInMilliseconds / 1000;

            viewModel.ctx.clear(true);
            var players = viewModel.players();

            for (var i = 0; i < players.length; i++) {
                players[i].collideWithEntityIndexes = {};
            }

            for (var i = 0; i < players.length; i++) {
                var player = players[i];
                player.move(deltaTime, players, i);
                player.draw();

            }
        }
        window.requestAnimationFrame(Update);
    }


    Start();

})();

function Player(context, boardWith, boardHeight) {
    var player = this;
    player.boardHeight = boardHeight;
    player.boardWith = boardWith;
    // position, top left.
    player.x = 0;
    player.y = 0;
    // velocity.
    player.vx = (-0.5 + Math.random()) * 32;
    player.vy = (-0.5 + Math.random()) * 32;

    // TODO:    tweak consts' from UI.
    player.inverseMass = 1.0 / (Math.random() < 0.4 ? 100 : 10);
    player.restitution = 0.8;

    player.ctx = context;
    player.width = 15;
    player.height = 15;

    player.collideWithEntityIndexes = {};

    player.move = function (deltaTime, entities, currentEntityIndex) {
        // calculate how much distance we should move this frame.
        var dx = player.vx * deltaTime,
            dy = player.vy * deltaTime;

        // check and handle collision with the walls.
        // TODO:    should be handle just like any aother object, but with no velocity and infinite mass.
        player.checkCollisionWithWalls(dx, dy);

        // add distance moved to position.
        player.x += dx;
        player.y += dy;

        for (var i = 0; i < entities.length; i++) {
            if (i != currentEntityIndex && !player.collideWithEntityIndexes[i]) {

                var other = entities[i];
                var manifold = player.collideWithOther(other);

                if (manifold.collied) {
                    player.collideWithEntityIndexes[i] = true;
                    other.collideWithEntityIndexes[currentEntityIndex] = true;

                    player.resolveCollision(manifold.nx, manifold.ny, other);

                    player.positionalCorrection(manifold.nx, manifold.ny, manifold.penetration, other);
                }
            }
        }        
    };


    player.draw = function () {
        if (player.inverseMass < 0.1) {
            player.ctx.fillStyle = '#00f'; // blue
        }
        else {
            player.ctx.fillStyle = '#000'; // blue
        }
        player.ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // http://gamedev.tutsplus.com/tutorials/implementation/create-custom-2d-physics-engine-aabb-circle-impulse-resolution/

    player.resolveCollision = function (collisionNormalX, collisionNormalY, other) {
        // calculate relative velocity.
        var rvx = other.vx - player.vx,
            rvy = other.vy - player.vy;
 
        // calculate relative velocity in terms of the normal direction.
        var velAlongNormal =  rvx * collisionNormalX + rvy * collisionNormalY;
 
        // do not resolve if velocities are separating.
        if (velAlongNormal > 0) {
            return;
        }
        // calculate restitution.
        var e = Math.min(player.restitution, other.restitution);
 
        // calculate impulse scalar.
        var j = -(1 + e) * velAlongNormal
        j /= player.inverseMass + other.inverseMass;
 
        // apply impulse.
        var impulseX = j * collisionNormalX,
            impulseY = j * collisionNormalY;

        player.vx -= player.inverseMass * impulseX;
        player.vy -= player.inverseMass * impulseY;
        other.vx += other.inverseMass * impulseX;
        other.vy += other.inverseMass * impulseY;
    }

    player.checkCollisionWithWalls = function (dx, dy) {
        //Left or right
        if (dx < 0) {//Left

            if (player.x === 0 || (player.x + dx < 0)) {
                //do nothinh cant move any further to left
                // update the velocity.
                player.resolveCollision(-1, 0, { inverseMass: 0 /* infinite mass for walls*/, restitution: 1, vx: 0, vy: 0 /* use 0 velocity for walls*/ })
            }
        }
        else {//right

            //cant move any further to right
            if (player.x + dx > (player.boardWith - player.width)) {
                // update the velocity.
                player.resolveCollision(1, 0, { inverseMass: 0 /* infinite mass for walls*/, restitution: 1, vx: 0, vy: 0 /* use 0 velocity for walls*/ })
            }
        }


        //Upp or down
        if (dy < 0) {
            //upp
            if (player.y === 0 || (player.y + dy < 0)) {
                //do nothing cant move any further up
                // update the velocity.
                player.resolveCollision(0, -1, { inverseMass: 0 /* infinite mass for walls*/, restitution: 1, vx: 0, vy: 0 /* use 0 velocity for walls*/ })
            }
        }
        else {

            //down
            if (player.y === (player.boardHeight - player.height) || (player.y + dy > (player.boardHeight - player.height))) {
                //do nothing cant move any further down
                // update the velocity.
                player.resolveCollision(0, 1, { inverseMass: 0 /* infinite mass for walls*/, restitution: 1, vx: 0, vy: 0 /* use 0 velocity for walls*/ })
            }
        }
    }

    player.collideWithOther = function (other) {
        var manifold = { collied: false, nx: 0, ny: 0, penetration: 0 };

        // vector from player to other.
        var nx = other.x - player.x,
            ny = other.y - player.y;
        
        // calculate half extents along x axis for each object.
        var a_extent = (player.width) / 2,
            b_extent = (other.width) / 2;
  
        // calculate overlap on x axis.
        var x_overlap = a_extent + b_extent - Math.abs(nx);
  
        // SAT test on x axis.
        if (x_overlap > 0) {
            // calculate half extents along y axis for each object.
            a_extent = (player.height) / 2,
            b_extent = (other.height) / 2;

            // calculate overlap on y axis.
            var y_overlap = a_extent + b_extent - Math.abs(ny);

            // SAT test on y axis.
            if (y_overlap > 0) {
                // find out which axis is axis of least penetration.
                if (x_overlap < y_overlap) {
                    // point towards other knowing that n points from player to other.
                    if (nx < 0) {
                        manifold.nx = -1;
                        manifold.ny = 0;
                    }
                    else {
                        manifold.nx = 1;
                        manifold.ny = 0;
                    }
                    manifold.penetration = x_overlap
                    manifold.collied = true;
                    return manifold;
                }
                else {
                    // point toward other knowing that n points from player to other.
                    if (ny < 0) {
                        manifold.nx = 0;
                        manifold.ny = -1;
                    }
                    else {
                        manifold.nx = 0;
                        manifold.ny = 1;
                    }
                    manifold.penetration = y_overlap
                    manifold.collied = true;
                    return manifold;
                }
            }
        }
        return manifold;
    }

    player.positionalCorrection = function (nx, ny, penetration, other) {
        // TODO:    tweak consts' from UI.
        var percent = 0.8; // usually 20% to 80%
        var k_slop = 0.01; // usually 0.01 to 0.1
        var term = Math.max((penetration - k_slop), 0) / (player.inverseMass + other.inverseMass) * percent;

        var correctionx = term * nx,
            correctiony = term * ny;

        player.x -= player.inverseMass * correctionx;
        player.y -= player.inverseMass * correctiony;
        other.x += other.inverseMass * correctionx;
        other.y += other.inverseMass * correctiony;        
    }
}

function ViewModel(context, width, height) {
    var viewModel = this;
    viewModel.ctx = context;
    viewModel.height = height;
    viewModel.width = width;
    viewModel.players = ko.observableArray();
    this.pause = ko.observable(false);
    viewModel.log = ko.observableArray();

    viewModel.togglePause = function() {
        viewModel.pause(!viewModel.pause());
    };

    viewModel.restart = function() {
        viewModel.players.removeAll();
        viewModel.log.removeAll();
    };

    viewModel.addPlayer = function() {
        var player = new Player(viewModel.ctx, viewModel.width, viewModel.height);
        player.x = Math.floor(Math.random() * parseInt(viewModel.width));
        player.y = Math.floor(Math.random() * parseInt(viewModel.width));
        viewModel.players.push(player);
    };

    var player = new Player(viewModel.ctx, viewModel.width, viewModel.height);
    player.x = 0
    player.y = 0;
    player.vx = 10;
    player.vy = 0;
    viewModel.players.push(player);

    player = new Player(viewModel.ctx, viewModel.width, viewModel.height);
    player.x = player.width;
    player.y = 0;
    player.vx = -10;
    player.vy = 0;
    viewModel.players.push(player);
}