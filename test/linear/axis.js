function point(x, y, axis) {
	this.transform = {
		i: {
			x: 1,
			y: 0
		},
		j: {
			x: 0,
			y: 1
		}
	};

	if (axis.transform != null) {
		this.transform = axis.transform;
	}

	// this.orgPoint = new point(x, y, axis);

	this.x = this.transform.i.x * x + this.transform.j.x * y;
	this.y = this.transform.i.y * x + this.transform.j.y * y;

	this.axis = axis;

	this.toString = function() {
		return JSON.stringify({
			x,
			y
		});
	}

	this.render = function(ctx, color) {
		let renderPoint = {
			x: this.x * this.axis.stepWidth + this.axis.center.x,
			y: this.y * axis.stepWidth + this.axis.center.y,
		};

		// ctx.strokeStyle = this.color;
		// ctx.beginPath();
		// ctx.moveTo(renderPoint.x, renderPoint.y);
		// ctx.closePath();
		// ctx.stroke();

		ctx.fillStyle = color;
		ctx.fillRect(renderPoint.x, renderPoint.y, 1, 1);
	}
}

function line(axis, startPoint, endPoint, color) {
	this.axis = axis;
	this.startPoint = startPoint;
	this.endPoint = endPoint;
	this.color = color;

	this.renderStartPoint = null;
	this.renderEndPoint = null;

	// init
	let startX = axis.center.x - startPoint.x * axis.stepWidth;
	let startY = axis.center.y - startPoint.y * axis.stepWidth;
	let endX = axis.center.x - endPoint.x * axis.stepWidth;
	let endY = axis.center.y - endPoint.y * axis.stepWidth;
	this.renderStartPoint = {
		x: startX,
		y: startY
	};
	this.renderEndPoint = {
		x: endX,
		y: endY
	};

	this.render = function(ctx) {
		ctx.strokeStyle = this.color;
		ctx.beginPath();
		ctx.moveTo(this.renderStartPoint.x, this.renderStartPoint.y);
		ctx.lineTo(this.renderEndPoint.x, this.renderEndPoint.y);
		ctx.closePath();
		ctx.stroke();
	}
}

/**
 * @param {Number} x轴正半轴的刻度数量
 * @param {Number} x轴正半轴的刻度数量
 * @param {Number} 刻度步长
 * @param {Object} canvas画布实体
 * @param {Object} canvas上坐标轴的原点
 */
function axis(x, y, stepWidth, ctx, center, transform = null) {
	this.x = x;
	this.y = y;
	this.stepWidth = stepWidth;
	this.ctx = ctx;
	this.center = center;
	this.transform = transform;

	this.allXSteps = this.x * 2;
	this.allYSteps = this.y * 2;

	this.mainLines = [];
	this.otherLines = [];

	this.render = function() {
		// 渲染其他轴
		this.renderLines();
		// 渲染主轴
		this.renderMainXY();
	};

	this.renderMainXY = function() {
		let lineColor = '#6c6c6c';
		if (!!this.transform) {
			lineColor = '#ffffff';
		}
		let lHor = new line(this, new point(-1 * y, 0, this), new point(y, 0, this), lineColor);
		let lVer = new line(this, new point(0, y, this), new point(0, -1 * y, this), lineColor);

		this.mainLines.push(lHor);
		this.mainLines.push(lVer);
		lHor.render(this.ctx);
		lVer.render(this.ctx);
	};

	this.renderLines = function() {
		let lineColor = '#6c6c6c';
		if (!!this.transform) {
			lineColor = 'red';
		}

		// 横轴
		for (let i = 1; i <= y; i++) {
			let lPositive = new line(this, new point(-1 * y, i, this), new point(y, i, this), lineColor);
			let lNegtive = new line(this, new point(-1 * y, -1 * i, this), new point(y, -1 * i, this), lineColor);
			this.otherLines.push(lPositive);
			this.otherLines.push(lNegtive);
		}

		// 纵轴
		for (let i = 1; i <= x; i++) {
			let lPositive = new line(this, new point(i, this.y, this), new point(i, this.y * -1, this), lineColor);
			let lNegtive = new line(this, new point(-1 * i, this.y, this), new point(-1 * i, this.y * -1, this), lineColor);
			this.otherLines.push(lPositive);
			this.otherLines.push(lNegtive);
		}

		for (let l of this.otherLines) {
			l.render(this.ctx);
		}
	}
}
