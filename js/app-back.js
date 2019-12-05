function hexify(intR, intG, intB) {
	let a = 1,
		r = Math.floor(a * intR + (1 - a) * 255),
		g = Math.floor(a * intG + (1 - a) * 255),
		b = Math.floor(a * intB + (1 - a) * 255);
	return "#" +
		("0" + r.toString(16)).slice(-2) +
		("0" + g.toString(16)).slice(-2) +
		("0" + b.toString(16)).slice(-2);
}

const TILE_WIDTH = 256;

let TYPE_TILE = {
	BLACK: 'BLACK',
	WALL: 'WALL',
	FLOOR: 'FLOOR',
	COIN: 'COIN',
	ITEM: 'ITEM',
	BORN: 'BORN',
	EXIT: 'EXIT',
	NONE: 'NONE',
}

// 地图单元格类型和数字的对应关系,用于生成最后的数组
let TYPE_TILE_NUMBER = {
	BLACK: 0,
	WALL: 1,
	FLOOR: 2,
	COIN: 3,
	ITEM: 4,
	BORN: 5,
	EXIT: 6,
	NONE: 7,
}

let tilePoint = function(x = 0, y = 0, type = TYPE_TILE.NONE) {
	this.x = x;
	this.y = y;
	this.type = type;
	this.render = function(ctx){
		
	}
}

let mapJson = function() {
	this.tileWidth = 0; // 一个小个子的宽度px
	this.tilesEachLine = 0; // 每行的小格子数量
	this.tilesEachColumn = 0; // 每列的小格子数量
	this.bornPoint = new tilePoint(); // 出生点
	this.exitPoint = new tilePoint(); // 终点
	this.coinPoints = [];
	this.itemPoints = [];
	this.allPoints = [];
}

let appModel = {
	mini_grid_count: 8,
	tiles_each_line: 13, // 每行的单元格数量
	tiles_each_column: 9, // 每列的单元格数量
	div_grid_width: 35, // 页面展示的每个div正方形格子的宽高
	canvas_tile_width: 10, // 最终生成到canvas时每个正方形格子的宽高
	result_canvas_total_width: 0, // 最终生成canvas地图的总宽度
	result_canvas_total_height: 0, // 最终生成canvas地图的总高度
	listTile: [], // 记录地图上每个点的信息,
	imgBackgroundInfo:{
		src:'',
		width:0,
		height:0,
	}
};

let appController = {
	init: function() {
		appModel.tiles_each_line = appModel.tiles_each_line * appModel.mini_grid_count;
		appModel.tiles_each_column = appModel.tiles_each_column * appModel.mini_grid_count;

		appModel.result_canvas_total_width = appModel.tiles_each_line * appModel.canvas_tile_width;
		appModel.result_canvas_total_height = appModel.tiles_each_column * appModel.canvas_tile_width;
	},
	getModel: function() {
		return appModel;
	},
	/**
	 * 从图片中初始化所有单元格信息
	 * @param {Array} data 通过canvas读取的image数组数据
	 */
	initlistTileFromImageData(data) {
		let model = appModel;
		model.listTile = [];
		for (let y = 0, index = 0; y < model.result_canvas_total_height; y += model.canvas_tile_width) {
			for (let x = 0; x < model.result_canvas_total_width; x += model.canvas_tile_width, index++) {
				console.log(index);
				let si = x + y * model.result_canvas_total_width;
				let color_key = hexify(
					data[si * 4],
					data[si * 4 + 1],
					data[si * 4 + 2]);

				let point = new tilePoint(x, y);

				switch (color_key) {
					// wall
					case '#808080':
						point.type = TYPE_TILE.WALL;
						break;
						// floor
					case '#ffffff':
						point.type = TYPE_TILE.FLOOR;
						break;
						// coin
					case '#ffff33':
						point.type = TYPE_TILE.COIN;
						break;
						// item
					case '#ff0033':
						point.type = TYPE_TILE.ITEM;
						break;
						// born
					case '#00ff00':
						point.type = TYPE_TILE.BORN;
						break;
						// exit
					case '#0000ff':
						point.type = TYPE_TILE.EXIT;
						break;
						// black
					case '#000000':
						point.type = TYPE_TILE.BLACK;
						break;
					default:
						point.type = TYPE_TILE.NONE;
						break;
				}

				model.listTile.push(point);
			}
		}
	},
	updateTileType(index, type) {
		appModel.listTile[index - 1].type = type;
	},
	getTileById(id) {
		return appModel.listTile[parseInt(id) - 1];
	},
	fillListTileByBlack() {
		for (let tile of appModel.listTile) {
			if (tile.type == TYPE_TILE.NONE) {
				tile.type = TYPE_TILE.BLACK;
			}
		}
	},
	/**
	 * 导出json结果
	 */
	generateJsonResult() {
		// 单个单元格宽高
		// 横向格子数量
		// 纵向格子数量
		// 出生点
		// 逃离点
		// 金币点
		// 道具点
		// 所有点

		let m = appModel;
		let result = new mapJson()
		result.tileWidth = TILE_WIDTH / m.mini_grid_count;
		result.tilesEachLine = m.tiles_each_line;
		result.tilesEachColumn = m.tiles_each_column;
		for (let p of m.listTile) {
			let new_p = new tilePoint(p.x, p.y, TYPE_TILE_NUMBER[p.type]);

			if (p.type === TYPE_TILE.BORN) {
				result.bornPoint = new_p;
			}

			if (p.type === TYPE_TILE.EXIT) {
				result.exitPoint = new_p;
			}

			if (p.type === TYPE_TILE.COIN) {
				result.coinPoints.push(new_p);
			}

			if (p.type === TYPE_TILE.ITEM) {
				result.itemPoints.push(new_p);
			}

			result.allPoints.push(new_p);
		}

		return result;
	}
};

let appView = {
	$addUploadInput: $('#add-upload-input'),
	$canvasUploadImage: $('#canvas-upload-image'),
	$grid_container: $('#tile-container'),
	$print: $('#print'),
	$type_container: $('#type-container'),
	$canvas: $('#canvas'),
	ctxTiles: null,
	$fillBlank: $('#fill-blank'),
	$textJsonResult: $('#text-json-result'),
	allowPainting: false, // 标志位，表示允许在鼠标滑动的过程中绘制单元格
	currentPaintingColor: '', // 记录当前正在绘制的单元格类型
	listTile: [],
	init: function() {
		const model = appController.getModel();
		console.log('set grid container css');
		appView.$grid_container.css({
			width: model.tiles_each_line * model.div_grid_width + 'px',
			height: model.tiles_each_column * model.div_grid_width + 'px'
		});
		
		appView.initTilesCtx();

		console.log('set canvas attr');
		appView.$canvas.attr({
			width: model.result_canvas_total_width,
			height: model.result_canvas_total_height,
		});

		appView.$canvasUploadImage.attr({
			width: model.result_canvas_total_width,
			height: model.result_canvas_total_height,
		});

		console.log('appView.initTypeGrids');
		appView.initTypeGrids();

		console.log('appView.initAllTiles');
		// appView.initAllTiles();

		appView.$addUploadInput.change(appView.uploadImageHandler);

		appView.$fillBlank.click(appView.fillBlank);
		
		document.addEventListener('keydown', function(e) {
			// console.log(e.code);
			if (e.code == 'KeyA') {
				appView.allowPainting = true;
			}
		});

		document.addEventListener('keyup', function(e) {
			// console.log(e.code);
			appView.allowPainting = false;
		});

		// 生成结果
		appView.$print.click(() => {
			appView.drawResult();
		});
	},
	initTilesCtx: function() {
		console.log('initTilesCtx');
		let canvas = document.getElementById('cvs-tiles');
		canvas.width = appView.$grid_container.css('width').replace(/px/g,'');
		canvas.height = appView.$grid_container.css('height').replace(/px/g,'');
		
		appView.ctxTiles = canvas.getContext('2d');
		
		// let model = appController.getModel();
		
		// let image = new Image();
		
		// image.onload = function() {
		// 	console.log('img onload');
		// 	canvas.width = image.width;
		// 	canvas.height = image.height;
		// }
		// image.src = './img/2.jpg';
	},
	initTypeGrids: function() {
		for (let key of Object.keys(TYPE_TILE)) {
			let low_key = key.toString().toLowerCase();
			appView.$type_container.append($(`<div class="${low_key}" gridtype="${key}">${low_key}</div>`));
		}

		$('#type-container div').click(function() {
			let $this = $(this);
			appView.currentPaintingColor = $this.attr('gridtype');
			$('#type-container div').removeClass('hl');
			$this.addClass('hl');
		});
	},
	initAllTiles: function() {
		let model = appController.getModel();
		const view = appView;
		model.listTile = [];

		for (let y = 0, index = 1; y < model.tiles_each_line; y++) {
			for (let x = 0; x < model.tiles_each_column; x++, index++) {
				let p = new tilePoint(x, y);
				model.listTile.push(p);
				// view.$grid_container.append($('<div id="' + index + '">' + '' + '</div>'));
				p.render(appView.ctxTiles);
			}
		}

		$('#tile-container div').click(function(e) {
			let $cur = $(this);
			let id = $cur.attr('id');
			let tile = appController.getTileById(id);

			if (tile.type != appView.currentPaintingColor.toLowerCase()) {
				appController.updateTileType(id, TYPE_TILE[appView.currentPaintingColor]);
				$cur.removeClass().addClass(appView.currentPaintingColor.toLowerCase());
			} else {
				appController.updateTileType(id, TYPE_TILE.NONE);
				$cur.removeClass();
			}
		});

		$('#tile-container div').mousemove(function(e) {
			let $cur = $(this);
			if (!appView.allowPainting) return;

			let id = $cur.attr('id');
			let tile = appController.getTileById(id);
			appController.updateTileType(id, TYPE_TILE[appView.currentPaintingColor]);
			$cur.removeClass().addClass(appView.currentPaintingColor.toLowerCase());
		});
	},
	uploadImageHandler: function(e) {
		const model = appController.getModel();
		let file = e.target.files[0];
		let _temp, datas;
		// 确认选择的文件是图片
		if (file.type.indexOf('image') != 0) return;
		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function(e) {
			// 图片base64化
			// let newUrl = this.result;
			let image = new Image();
			image.src = e.target.result;
			image.onload = function() {
				_temp = document.getElementById('canvas-upload-image');
				// _temp.width = _temp.height = model.canvas_tile_width; // assume square levels
				_temp = _temp.getContext('2d');
				_temp.drawImage(image, 0, 0);
				appView.readDatasToMap(_temp.getImageData(0, 0, model.result_canvas_total_width, model.result_canvas_total_height)
					.data);
			}
		}
	},
	readDatasToMap: function(uint8Arr) {
		appController.initlistTileFromImageData(uint8Arr);
		appView.renderAllTiles();
	},
	renderAllTiles: function() {
		let tiles = appView.$grid_container.children();
		const listTile = appController.getModel().listTile;
		for (let i = 0; i < tiles.length; i++) {
			let $tile = $(tiles[i]);
			let tileData = listTile[i];
			$tile.removeClass().addClass(tileData.type.toLowerCase());
		}
	},
	fillBlank: function() {
		appController.fillListTileByBlack();
		appView.renderAllTiles();
	},
	// 生成地图结果图像
	drawResult: function() {
		console.log('draw result begin');
		const model = appController.getModel();
		let ctx = document.getElementById('canvas').getContext('2d');

		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, model.tiles_each_line * model.canvas_tile_width, model.tiles_each_column * model.canvas_tile_width);
		$('#tile-container div').each(function() {
			let $cur = $(this);
			let id = parseInt($cur.attr('id'));
			let y = Math.floor((id - 1) / model.tiles_each_line);
			let x = (id - 1) % model.tiles_each_line;
			let gridColor = $cur.css('background-color');
			ctx.fillStyle = gridColor;
			ctx.fillRect(x * model.canvas_tile_width, y * model.canvas_tile_width, model.canvas_tile_width,
				model.canvas_tile_width);
		})

		let mapJSON = appController.generateJsonResult();
		appView.$textJsonResult.text(JSON.stringify(mapJSON));

		console.log('draw result done');
	}
};


$(document).ready(function() {
	appController.init();
	appView.init();
	// setTimeout(function(){appView.init();},2000);
});
