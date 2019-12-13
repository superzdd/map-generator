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

// 地图单元格类型和数字的对应关系,用于生成最后的数组
let TYPE_TILE_INFO = {
	BLACK: {
		id: 0,
		color: '#000000',
	},
	WALL: {
		id: 1,
		color: '#808080',
	},
	FLOOR: {
		id: 2,
		color: '#ffcc66',
	},
	COIN: {
		id: 3,
		color: '#ffff33',
	},
	ITEM: {
		id: 4,
		color: '#ff0033',
	},
	BORN: {
		id: 5,
		color: '#00ff00',
	},
	EXIT: {
		id: 6,
		color: '#0000ff',
	},
	NONE: {
		id: 7,
		color: 'transparent',
	}
}

let TYPE_TILE = {};
for (let key of Object.keys(TYPE_TILE_INFO)) {
	TYPE_TILE[key] = key;
}

/**
 * lineIndex: 行
 * columnIndex: 列
 */
let tilePoint = function(lineIndex = 0, columnIndex = 0, width = 0, type = TYPE_TILE.NONE) {
	this.lineIndex = lineIndex;
	this.columnIndex = columnIndex;
	this.width = width;
	this.lastType = TYPE_TILE.NONE;
	this.type = type;
	this.needUpdate = true;

	this.update = function(type, force = false) {
		if (this.type != type) {
			this.lastType = this.type;
			this.type = type;
			this.needUpdate = true;
		} else if (!force) {
			this.type = this.lastType;
			this.lastType = TYPE_TILE.NONE;
			this.needUpdate = true;
		}
	}

	this.render = function(ctx) {
		if (!this.needUpdate) {
			return;
		}

		this.needUpdate = false;

		let _w = this.width;
		let _y = this.lineIndex * _w;
		let _x = this.columnIndex * _w;

		ctx.strokeStyle = '#000000';
		ctx.fillStyle = TYPE_TILE_INFO[this.type].color;

		ctx.clearRect(_x, _y, _w, _w);
		ctx.fillRect(_x, _y, _w, _w);
		ctx.strokeRect(_x, _y, _w, _w);
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
	mini_grid_count: 1,
	tiles_each_line: 13, // 每行的单元格数量
	tiles_each_column: 9, // 每列的单元格数量
	// div_grid_width: 20, // 页面展示的每个div正方形格子的宽高
	canvas_tile_width: 10, // 最终生成到canvas时每个正方形格子的宽高
	result_canvas_total_width: 0, // 最终生成canvas地图的总宽度
	result_canvas_total_height: 0, // 最终生成canvas地图的总高度
	tileContainerInfo: {
		width: 0,
		height: 0,
	},
	listTile: [], // 记录地图上每个点的信息,
	imgBackgroundInfo: {
		src: '',
		width: 0,
		height: 0,
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
	 * 更新地图中每行单元格的数量
	 * @param {Object} n
	 */
	updateTilesPerLine: function(n) {
		// 根据传过来的数量,在有背景地图的条件下,需要同时计算每列单元格的数量,单元格的宽度
		appModel.tiles_each_line = n;

		if (appView.backgroundInfo.width <= 0) {
			return;
		}

		let eachTileWidth = appView.backgroundInfo.width / n;
		appModel.tiles_each_column = Math.ceil(appView.backgroundInfo.height / eachTileWidth);

		appController.init();
	},
	updateTileContainerInfo: function(width, height) {
		appModel.tileContainerInfo.width = width;
		appModel.tileContainerInfo.height = height;
	},
	/**
	 * 从图片中初始化所有单元格信息
	 * @param {Array} data 通过canvas读取的image数组数据
	 */
	initlistTileFromImageData(data) {
		let model = appModel;
		model.listTile = [];
		// 逐行导入点
		for (let line = 0, index = 0; line < model.result_canvas_total_height; line += model.canvas_tile_width) {
			for (let column = 0; column < model.result_canvas_total_width; column += model.canvas_tile_width, index++) {
				let si = column + line * model.result_canvas_total_width;
				let color_key = hexify(
					data[si * 4],
					data[si * 4 + 1],
					data[si * 4 + 2]);

				let point = new tilePoint(line / model.canvas_tile_width, column / model.canvas_tile_width, appView.canvasTilesInfo
					.width);

				for (const [key, value] of Object.entries(TYPE_TILE_INFO)) {
					if (value.color == color_key) {
						point.type = TYPE_TILE[key];
					}
				}

				model.listTile.push(point);
			}
		}
	},
	updateTileType(index, type) {
		appModel.listTile[index - 1].type = type;
	},
	updateTile(x, y, type, forceUpdate = false) {
		x = x - appView.canvasTilesInfo.x;
		y = y - appView.canvasTilesInfo.y;
		const tileWidth = appView.canvasTilesInfo.width;
		const lines = appModel.tiles_each_line; // 每行的单元格数量
		const cols = appModel.tiles_each_column; // 每列的单元格数量

		const index = Math.floor(x / tileWidth) + Math.floor(y / tileWidth) * lines;

		console.log(`update tile ${index} to type ${type}===${JSON.stringify({x,y,tileWidth,lines,cols})}`);

		appModel.listTile[index].update(type, forceUpdate);
	},
	getTileById(id) {
		return appModel.listTile[parseInt(id) - 1];
	},
	fillListTileByBlack() {
		for (let tile of appModel.listTile) {
			if (tile.type == TYPE_TILE.NONE) {
				tile.update(TYPE_TILE.BLACK);
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
			let new_p = new tilePoint(p.lineIndex, p.columnIndex, appView.canvasTilesInfo.width, TYPE_TILE_INFO[p.type].id);

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
	$addUploadBgInput: $('#add-upload-bg-input'),
	$bg: $('#bg'),
	$canvasUploadImage: $('#canvas-upload-image'),
	$grid_container: $('#tile-container'),
	$print: $('#print'),
	$type_container: $('#type-container'),
	$canvas: $('#canvas'),
	$iptGridsPerline: $('#ipt-grids-perline'),
	$btnGridLineOK: $("#btn-grid-line-ok"),
	canvasTilesInfo: {
		x: 0, // 距离屏幕左边的距离
		y: 0, // 距离屏幕上方的距离
		width: 0, // 方块格宽度
		ctx: null, // 画布实例
	},
	$fillBlank: $('#fill-blank'),
	$textJsonResult: $('#text-json-result'),
	$hintLast: $('#hint-last'),
	$hintCurrent: $('#hint-current'),
	allowPainting: false, // 标志位，表示允许在鼠标滑动的过程中绘制单元格
	lastPaintingColor: '', // 记录上一个正在绘制的单元格颜色
	currentPaintingColor: '', // 记录当前正在绘制的单元格类型
	listTile: [],
	mousePosition: {
		x: 0,
		y: 0,
	},
	backgroundInfo: {
		width: 0,
		height: 0,
		src: ''
	},
	lastRenderTime: 0,
	fps: 1000 / 60,
	init: async function() {
		let model = appController.getModel();
		appView.$addUploadInput.change(appView.uploadImageHandler);
		appView.$addUploadBgInput.change(appView.uploadBGImageHandler);
		appView.initResultCanvas();
		appView.initUploadCanvas();
		appView.initTypeGrids();
		appView.$fillBlank.click(appView.fillBlank);
		appView.$btnGridLineOK.click(appView.btnGridLineOKHandler);

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
		appView.$print.click(appView.drawResult);

		appView.render();
	},
	initBackgroundImage: function() {
		return new Promise((res, rej) => {
			console.log('demo read image');
			let image = new Image();

			image.onload = function() {
				console.log(`load image success: ${JSON.stringify({width:image.width,height:image.height})}`);

				appView.backgroundInfo.width = image.width;
				appView.backgroundInfo.height = image.height;
				res();
			}
			image.src = './img/2.jpg';
		});
	},
	initTileContainer: function() {
		// await appView.initBackgroundImage();
		appController.updateTileContainerInfo(appView.backgroundInfo.width, appView.backgroundInfo.height);
		appView.$grid_container.css({
			width: appView.backgroundInfo.width + 'px',
			height: appView.backgroundInfo.height + 'px'
		});
	},
	canvasTileMouseMoveHandler: function(e) {
		if (!appView.allowPainting) return;
		if (!appView.currentPaintingColor) {
			alert('请先选择一种地图类型');
			return;
		}

		let {
			pageX,
			pageY
		} = e;

		appController.updateTile(pageX, pageY, appView.currentPaintingColor, true);
	},
	canvasTileMouseClickHandler: function(e) {
		if (!appView.currentPaintingColor) {
			alert('请先选择一种地图类型');
			return;
		}

		let {
			pageX,
			pageY
		} = e;

		appController.updateTile(pageX, pageY, appView.currentPaintingColor, false);
	},
	initCanvasTiles: function() {
		console.log('initTilesCtx');
		const model = appController.getModel();

		const container = document.getElementById('tile-container');
		const y = container.offsetTop;
		const x = container.offsetLeft;

		let canvas = document.getElementById('cvs-tiles');
		canvas.width = appView.backgroundInfo.width;
		canvas.height = appView.backgroundInfo.height;

		let ctx = canvas.getContext('2d');
		ctx.globalAlpha = 0.5;

		appView.canvasTilesInfo.x = x;
		appView.canvasTilesInfo.y = y;
		appView.canvasTilesInfo.ctx = ctx;
		appView.canvasTilesInfo.width = model.tileContainerInfo.width / model.tiles_each_line;

		$('#cvs-tiles').unbind('mousemove', appView.canvasTileMouseMoveHandler);
		$('#cvs-tiles').unbind('click', appView.canvasTileMouseClickHandler);
		$('#cvs-tiles').mousemove(appView.canvasTileMouseMoveHandler);
		$('#cvs-tiles').click(appView.canvasTileMouseClickHandler);
	},
	initTypeGrids: function() {
		for (let key of Object.keys(TYPE_TILE)) {
			let low_key = key.toString().toLowerCase();
			appView.$type_container.append($(`<div class="${low_key}" gridtype="${key}">${low_key}</div>`));
		}

		$('#type-container div').click(function() {
			let $this = $(this);

			if ($this.attr('gridtype') == appView.currentPaintingColor) return;

			appView.lastPaintingColor = appView.currentPaintingColor;
			appView.currentPaintingColor = $this.attr('gridtype');
			$('#type-container div').removeClass('hl');
			$this.addClass('hl');

			appView.$hintCurrent.removeClass().addClass(appView.currentPaintingColor.toLowerCase());
			appView.$hintLast.removeClass().addClass(appView.lastPaintingColor.toLowerCase());
		});
	},
	initAllTiles: function() {
		let model = appController.getModel();
		// const view = appView;
		model.listTile = [];

		let width = appView.canvasTilesInfo.width;
		console.log(`each tile width: ${width}`);

		// 一行一行加入点
		for (let line = 0, index = 1; line < model.tiles_each_column; line++) {
			for (let column = 0; column < model.tiles_each_line; column++, index++) {
				let p = new tilePoint(line, column, width, TYPE_TILE.NONE);
				model.listTile.push(p);
			}
		}
	},
	initResultCanvas: function() {
		console.log('set canvas attr');
		const model = appController.getModel();
		appView.$canvas.attr({
			width: model.result_canvas_total_width,
			height: model.result_canvas_total_height,
		});
	},
	initUploadCanvas: function() {
		const model = appController.getModel();
		appView.$canvasUploadImage.attr({
			width: model.result_canvas_total_width,
			height: model.result_canvas_total_height,
		});
	},
	btnGridLineOKHandler: function() {
		let n = appView.$iptGridsPerline.val();
		if (!n || isNaN(n) || n <= 0) {
			alert('请输入正确的单元格数量');
			return;
		}

		n = parseInt(n);
		appController.updateTilesPerLine(n);
		appView.initTileContainer();
		appView.initCanvasTiles();
		appView.initAllTiles();
		appView.initResultCanvas();
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
				_temp = _temp.getContext('2d');
				_temp.drawImage(image, 0, 0);
				appView.readDatasToMap(_temp.getImageData(0, 0, model.result_canvas_total_width, model.result_canvas_total_height)
					.data);
			}
		}
	},
	uploadBGImageHandler: function(e) {
		const model = appController.getModel();
		let file = e.target.files[0];
		// 确认选择的文件是图片
		if (file.type.indexOf('image') != 0) return;
		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function(e) {
			let image = new Image();
			image.src = e.target.result;
			image.onload = function() {
				let w = image.width;
				let h = image.height;
				if (w < 1024) {
					w = 1024;
					h = w * image.height / image.width;
				}

				appView.backgroundInfo.width = w;
				appView.backgroundInfo.height = h;
				appView.backgroundInfo.src = image.src;

				appView.$bg.attr('src', image.src);
				appView.initTileContainer();
				appView.initCanvasTiles();
				appView.initAllTiles();
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

		for (let tile of model.listTile) {
			ctx.fillStyle = TYPE_TILE_INFO[tile.type].color;
			ctx.fillRect(tile.columnIndex * model.canvas_tile_width, tile.lineIndex * model.canvas_tile_width, model.canvas_tile_width,
				model.canvas_tile_width);
		}

		let mapJSON = appController.generateJsonResult();
		appView.$textJsonResult.text(JSON.stringify(mapJSON));

		console.log('draw result done');
	},
	render: function() {
		const now = Date.now();

		if (now - appView.lastRenderTime < appView.fps) {
			requestAnimationFrame(appView.render);
			return;
		}

		appView.lastRenderTime = now;

		let model = appController.getModel();

		for (let p of model.listTile) {
			p.render(appView.canvasTilesInfo.ctx);
		}

		requestAnimationFrame(appView.render);
	}
};


$(document).ready(function() {
	appController.init();
	appView.init();
});
