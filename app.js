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


(function(){
	var playerBoardWidth = 150;
	var playerBoardHeight = 150;
	var canvas;
	var context;
	var viewModel;


	window.addEventListener("keydown", function(event){

			var player = viewModel.players()[0];
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
				player.draw();
	});

	function Start()
	{
		canvas = document.getElementById('canvas');
		canvas.width = playerBoardWidth;
		canvas.height = playerBoardHeight;
		context = canvas.getContext('2d');
		viewModel = new ViewModel(context, playerBoardWidth, playerBoardHeight);
		ko.applyBindings(viewModel, document.getElementById('content-wrapper'));

		//viewModel.addPlayer();
		//var player = viewModel.players()[0];
		//player.draw();
		setInterval(Update, 100);
	}

	function Update()
	{
		if(!viewModel.pause())
		{
			viewModel.ctx.clear(true);
			for(var i = 0; i < viewModel.players().length; i++)
			{
				var player = viewModel.players()[i];
				var x = Math.floor((Math.random()*31) - 15);
				var y = Math.floor((Math.random()*31) - 15);
				player.move(x, y);
				if(viewModel.log().length > 500)
				{
					
				}

				viewModel.log.splice(0,0,"Player moved to: " + player.x + " " + player.y)
				player.draw();

			}
		}
	}


	Start();

})();

function Player(context, boardWith, boardHeight)
{
	var player = this;
	player.boardHeight = boardHeight;
	player.boardWith = boardWith;
	player.x = 0;
	player.y = 0;
	player.ctx = context;
	player.width = 15;
	player.height = 15;


	player.move = function(x, y){
			
			//Left or right
			if(x < 0){//Left

				if(player.x === 0 || (player.x + x < 0))
				{
					//do nothinh cant move any further to left
					player.x = 0;
				}else{
					//move to left 
					//set new position
					player.x += x;
				}

			}else{//right

				//cant move any further to right
				if(player.x + x > (player.boardWith - player.width))
				{
					player.x = player.boardWith - player.width;

				}else{
					//move to right
					//set new position
					player.x += x;
				}
			}


			//Upp or down
			if(y < 0)
			{	
				//upp
				if(player.y === 0 || (player.y + y < 0) )
				{
					//do nothing cant move any further up
					player.y = 0;
				}else{
					//move up
					player.y += y;
				}

			}else{

				//down
				if(player.y === (player.boardHeight - player.height) || (player.y + y > (player.boardHeight - player.height)))
				{
						//do nothing cant move any further down
					player.y = player.boardHeight - player.height;
				}else{
					//move down
					player.y += y;
				}
			}


			//upp or down went wrong
			if(player.y > (player.boardHeight - player.height) || player.x < 0)
			{
				debugger;
			}



	};


	player.draw = function(){
		player.ctx.fillRect(player.x, player.y, player.width, player.height);
	}
}

function ViewModel(context, width, height)
{
	var viewModel = this;
	viewModel.ctx = context;
	viewModel.height = height;
	viewModel.width = width;
	viewModel.players = ko.observableArray();
	this.pause = ko.observable(false);
	viewModel.log = ko.observableArray();

	viewModel.togglePause = function(){
		viewModel.pause(!viewModel.pause());
	};

	viewModel.restart = function(){
		viewModel.players.removeAll();
		viewModel.log.removeAll();
	};

	viewModel.addPlayer = function(){
		var player = new Player(viewModel.ctx, viewModel.width, viewModel.height);
		player.x = Math.floor(Math.random() * parseInt(viewModel.width))
		player.y = Math.floor(Math.random() * parseInt(viewModel.width))
		viewModel.players.push(player);
	};

}