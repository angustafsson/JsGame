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
        // TODO:    also check if frame took too long here. physics may get out of hand if too long frame time.

        if (!viewModel.pause()) {
            var deltaTime = deltaTimeInMilliseconds / 1000;

            viewModel.ctx.clear(true);
            for (var i = 0; i < viewModel.players().length; i++) {
                var player = viewModel.players()[i];
                player.move(deltaTime);
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
    // position.
    player.x = 0;
    player.y = 0;
    // velocity.
    player.vx = (-0.5 + Math.random()) * 32;
    player.vy = (-0.5 + Math.random()) * 32;

    player.inverseMass = 1.0 / 10;
    player.restitution = 1;

    player.ctx = context;
    player.width = 15;
    player.height = 15;


    player.move = function (deltaTime) {
        // calculate how much distance we should move.
        var dx = player.vx * deltaTime,
            dy = player.vy * deltaTime;

        //Left or right
        if (dx < 0) {//Left

            if (player.x === 0 || (player.x + dx < 0)) {
                //do nothinh cant move any further to left
                dx = 0;
                // update the velocity, will come in effect next frame.
                player.resolveCollision(1, 0, { inverseMass: 0 /* infinite mass for walls*/, restitution: 1, vx: 0, vy: 0 /* use 0 velocity for walls*/ })
            }
        }
        else {//right

            //cant move any further to right
            if (player.x + dx > (player.boardWith - player.width)) {
                dx = 0;
                // update the velocity, will come in effect next frame.
                player.resolveCollision(-1, 0, { inverseMass: 0 /* infinite mass for walls*/, restitution: 1, vx: 0, vy: 0 /* use 0 velocity for walls*/ })
            }
        }


        //Upp or down
        if (dy < 0) {
            //upp
            if (player.y === 0 || (player.y + dy < 0) ) {
                //do nothing cant move any further up
                dy = 0;
                // update the velocity, will come in effect next frame.
                player.resolveCollision(0, -1, { inverseMass: 0 /* infinite mass for walls*/, restitution: 1, vx: 0, vy: 0 /* use 0 velocity for walls*/ })
            }
        }
        else {

            //down
            if (player.y === (player.boardHeight - player.height) || (player.y + dy > (player.boardHeight - player.height))) {
                //do nothing cant move any further down
                dy = 0;
                // update the velocity, will come in effect next frame.
                player.resolveCollision(0, 1, { inverseMass: 0 /* infinite mass for walls*/, restitution: 1, vx: 0, vy: 0 /* use 0 velocity for walls*/ })
            }
        }

        // add distance moved to position.
        player.x += dx;
        player.y += dy;
    };


    player.draw = function() {
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
        // from link above, but must be wrong... if (velAlongNormal > 0) {
        if (velAlongNormal <= 0) {
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
        player.x = Math.floor(Math.random() * parseInt(viewModel.width))
        player.y = Math.floor(Math.random() * parseInt(viewModel.width))
        viewModel.players.push(player);
    };

}