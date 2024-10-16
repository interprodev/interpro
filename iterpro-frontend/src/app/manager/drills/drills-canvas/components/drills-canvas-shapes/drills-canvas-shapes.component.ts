import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircle, faSquare } from '@fortawesome/pro-regular-svg-icons';
import { faArrowLeft, faDash, faPencil, faText } from '@fortawesome/pro-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { Canvas, Circle, Group, Line, Path, Rect, Triangle } from 'fabric';
import { FabricObject } from 'fabric/dist/src/shapes/Object/Object';
import { TooltipModule } from 'primeng/tooltip';
import { arrowHeadHeight, arrowHeadWidth, defaulObjOptions } from '../../models/drills-canvas.const';
import { Arrow, DrillCanvasMode, DrillCanvasModeType } from '../../models/drills-canvas.types';

@Component({
	standalone: true,
	imports: [NgClass, TranslateModule, FontAwesomeModule, TooltipModule],
	selector: 'iterpro-drills-canvas-shapes',
	templateUrl: 'drills-canvas-shapes.component.html'
})
export class DrillsCanvasShapesComponent {
	/** Inputs & Outputs */
	@Input({ required: true }) canvas!: Canvas;
	@Input({ required: true }) canvasMode!: DrillCanvasModeType;
	@Output() addShape = new EventEmitter<FabricObject>();
	@Output() addArrow = new EventEmitter<Group>();
	@Output() toggleEvents = new EventEmitter<boolean>();
	@Output() arrowMode = new EventEmitter<{ enabled: boolean; dashed: boolean }>(); // true = dashed
	@Output() lineMode = new EventEmitter<{ enabled: boolean; dashed: boolean }>(); // true = dashed

	/** Icons */
	readonly icons = {
		faText,
		faPencil,
		faArrowLeft,
		faDash,
		faSquare,
		faCircle
	};

	/** Toggle Line Drawing */
	isLineDrawing: boolean = false;
	line: Line | null = null;

	/** Toggle Arrow Drawing */
	isArrowDrawing: boolean = false;
	currentArrow: Arrow = { arrowLine: null, arrowHead: null };
	currentArrowGroup: Group | null = null;
	readonly canvasModes = DrillCanvasMode;

	/** Methods */

	// region SQUARE
	addSquare(): void {
		const square: Rect = new Rect({
			left: 100,
			top: 100,
			width: 30,
			height: 30,
			stroke: 'black',
			fill: 'rgba(0, 0, 0, 0.05)',
			strokeWidth: 3,
			strokeUniform: true,
			...defaulObjOptions
		});
		this.addShape.emit(square);
	}

	// region CIRCLE
	addCircle(): void {
		const square: Circle = new Circle({
			left: 100,
			top: 100,
			radius: 15,
			fill: 'rgba(0, 0, 0, 0.05)',
			stroke: 'black',
			strokeWidth: 3,
			strokeUniform: true,
			...defaulObjOptions
		});

		this.addShape.emit(square);
	}

	// region LINE
	activateLineDrawing(dashed: boolean): void {
		/** Disable drawing if active */
		this.lineMode.emit({ enabled: true, dashed });
		this.createStraightLine(dashed);
	}

	createStraightLine(dashed: boolean = false): void {
		/** Add "mousedown" logic */
		this.canvas.on('mouse:down', e => {
			if (this.canvasMode !== DrillCanvasMode.Line && this.canvasMode !== DrillCanvasMode.LineDashed) return;

			// Start Drawing
			this.isLineDrawing = true;

			// Starting Points
			const startX: number = e.scenePoint.x;
			const startY: number = e.scenePoint.y;

			// Create the Line
			this.line = new Line([startX, startY, startX, startY], {
				stroke: 'black',
				strokeWidth: 2,
				selectable: true,
				originX: 'center',
				originY: 'center',
				strokeUniform: true,
				strokeDashArray: dashed ? [5, 5] : [],
				...defaulObjOptions
			});

			// Add to canvas
			this.canvas.add(this.line);
			this.canvas.renderAll();
		});

		/** Add "mousemove" logic */
		this.canvas.on('mouse:move', e => {
			if (
				(this.canvasMode !== DrillCanvasMode.Line && this.canvasMode !== DrillCanvasMode.LineDashed) ||
				!this.isLineDrawing
			)
				return;

			// Update the position of the arrow line
			const pointer = this.canvas.getScenePoint(e.e);
			this.line.set({ x2: pointer.x, y2: pointer.y });
			this.canvas.renderAll();
		});

		/** Add "mouseup" logic */
		this.canvas.on('mouse:up', () => {
			if (this.canvasMode !== DrillCanvasMode.Line && this.canvasMode !== DrillCanvasMode.LineDashed) return;

			// Disable drawing and listeners
			this.isLineDrawing = false;
			this.lineMode.emit({ enabled: false, dashed: false });
		});
	}

	// region STRAIGHT ARROW
	activateArrowDrawing(dashed: boolean): void {
		/** Disable drawing if active */
		this.arrowMode.emit({ enabled: true, dashed });
		this.createStraightArrow(dashed);
	}

	createStraightArrow(dashed: boolean = false): void {
		/** Add "mousedown" logic */
		this.canvas.on('mouse:down', e => {
			if (this.canvasMode !== DrillCanvasMode.Arrow && this.canvasMode !== DrillCanvasMode.ArrowDashed) return;

			// Start Drawing
			this.isArrowDrawing = true;
			this.currentArrow.arrowHead = null;
			this.currentArrow.arrowLine = null;

			// Compose the arrow
			const startX: number = e.scenePoint.x;
			const startY: number = e.scenePoint.y;

			/** Silent Events */
			this.toggleEvents.emit(false);

			// Create the arrow with line and head
			this.currentArrow.arrowLine = new Line([startX, startY, startX, startY], {
				stroke: 'black',
				strokeWidth: 2,
				selectable: false,
				evented: false,
				originX: 'center',
				originY: 'center',
				strokeUniform: true,
				strokeDashArray: dashed ? [5, 5] : []
			});

			this.currentArrow.arrowHead = new Triangle({
				fill: 'black',
				left: startX,
				top: startY,
				lockScalingX: true,
				lockScalingY: true,
				originX: 'center',
				originY: 'center',
				selectable: false,
				evented: false,
				width: arrowHeadWidth,
				height: arrowHeadHeight,
				objectCaching: false
			});

			// Add to canvas
			this.canvas.add(this.currentArrow.arrowLine);
		});

		/** Add "mousemove" logic */
		this.canvas.on('mouse:move', e => {
			if (
				(this.canvasMode !== DrillCanvasMode.Arrow && this.canvasMode !== DrillCanvasMode.ArrowDashed) ||
				!this.isArrowDrawing
			)
				return;

			// Update the position of the arrow line
			const pointer = this.canvas.getScenePoint(e.e);
			this.currentArrow.arrowLine.set({ x2: pointer.x, y2: pointer.y });

			// Update the position of the arrowhead
			const angle =
				(Math.atan2(pointer.y - this.currentArrow.arrowLine.y1, pointer.x - this.currentArrow.arrowLine.x1) * 180) /
				Math.PI;
			this.currentArrow.arrowHead.set({
				left: pointer.x,
				top: pointer.y,
				angle: angle + 90
			});

			this.canvas.renderAll();
		});

		/** Create the arrow group on "mouseup" */
		this.canvas.on('mouse:up', () => {
			if (this.canvasMode !== DrillCanvasMode.Arrow && this.canvasMode !== DrillCanvasMode.ArrowDashed) return;

			// Disable drawing and listeners
			this.isArrowDrawing = false;
			this.arrowMode.emit({ enabled: false, dashed: false });

			// Create arrow group
			this.currentArrowGroup = new Group([this.currentArrow.arrowLine, this.currentArrow.arrowHead], {
				selectable: true,
				hasControls: true,
				lockScalingFlip: true,
				...defaulObjOptions
			});

			/** Lock stretch */
			this.currentArrowGroup.setControlsVisibility({
				mb: false,
				ml: false,
				mr: false,
				mt: false
			});

			/** Set the arrow flag */
			this.currentArrowGroup?.set({ arrow: true });

			/** Lock ArrowHead scaling */
			this.currentArrowGroup.on('scaling', () => {
				const scaleX: number = this.currentArrowGroup.scaleX;
				const scaleY: number = this.currentArrowGroup.scaleY;
				const arrowHead: Triangle = this.currentArrowGroup._objects[1] as Triangle;
				arrowHead.width = arrowHeadWidth / scaleX;
				arrowHead.height = arrowHeadHeight / scaleY;
				this.canvas.renderAll();
			});

			/** Reset the arrow status */
			this.canvas.remove(this.currentArrow.arrowLine);
			this.canvas.remove(this.currentArrow.arrowHead);
			this.canvas.renderAll();

			/** Restore Events and group */
			this.toggleEvents.emit(true);
			this.addArrow.emit(this.currentArrowGroup);
		});
	}

	// region ARROWS WITH QUADRATIC CURVE
	createArrow(): void {
		/** Create the quadratic curve starting points */
		const startX = 200,
			startY = 300,
			endX = 600,
			endY = 300,
			controlX = 400,
			controlY = 300;

		/**  Create the arrow line (quadratic curve) */
		const arrowLine: Path = new Path(`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`, {
			stroke: 'black',
			fill: 'transparent',
			objectCaching: false,
			hasControls: false,
			perPixelTargetFind: true,
			selectable: false,
			lockMovementX: true,
			lockMovementY: true
			// strokeDashArray: [5, 5],
		});

		/** Create the arrowhead */
		const arrowHeadWidth = 10;
		const arrowHeadHeight = 20;
		const arrowHead = new Triangle({
			left: endX,
			top: endY,
			width: arrowHeadWidth,
			height: arrowHeadHeight / 1.5,
			fill: 'black',
			selectable: false,
			originX: 'center',
			originY: 'center',
			angle: 90,
			rx: 15, // Rounded corners
			ry: 15 // Rounded corners
		});

		/** Add control points */
		const controlPoints: Circle[] = [
			new Circle({
				left: startX,
				top: startY,
				radius: 5,
				fill: 'rgba(255, 0, 0, 0.2)',
				stroke: 'rgba(0, 0, 0, 0.2)',
				strokeWidth: 1,
				originX: 'center',
				originY: 'center',
				hasBorders: false,
				hasControls: false,
				lockScalingX: true,
				lockSkewingY: true,
				selectable: true
			}),
			new Circle({
				left: controlX,
				top: controlY,
				radius: 5,
				fill: 'rgba(255, 0, 0, 0.2)',
				stroke: 'rgba(0, 0, 0, 0.2)',
				strokeWidth: 1,
				originX: 'center',
				originY: 'center',
				hasBorders: false,
				hasControls: false,
				lockScalingX: true,
				lockSkewingY: true,
				selectable: true
			}),
			new Circle({
				left: endX,
				top: endY,
				radius: 5,
				fill: 'rgba(255, 0, 0, 0.2)',
				stroke: 'rgba(0, 0, 0, 0.2)',
				strokeWidth: 1,
				originX: 'center',
				originY: 'center',
				hasBorders: false,
				hasControls: false,
				lockScalingX: true,
				lockSkewingY: true,
				selectable: true
			})
		];

		/** Create Group */
		const arrowGroup: Group = new Group([arrowLine, arrowHead, ...controlPoints], {
			hasBorders: false,
			selectable: true,
			hasControls: false,
			subTargetCheck: true,
			interactive: true,
			lockMovementX: true,
			lockMovementY: true
		});

		/** Add event handlers */
		controlPoints.forEach(point => point.on('moving', () => this.updateArrow(arrowGroup)));
		arrowGroup.on('selected', () => this.showControlPoints(arrowGroup));
		arrowGroup.on('deselected', () => this.hideControlPoints(arrowGroup));

		/** Return the arrow */
		arrowGroup.set('arrow', true);
		this.addArrow.emit(arrowGroup);
	}

	updateArrow(group: Group): void {
		const arrowLine: Path = group._objects[0] as Path;
		const controlPoints: Circle[] = [group._objects[2], group._objects[3], group._objects[4]] as Circle[];
		const [start, control, end] = controlPoints;

		// Update the arrow path
		arrowLine.path[0][1] = start.getX();
		arrowLine.path[0][2] = start.getY();
		arrowLine.path[1][1] = control.getX();
		arrowLine.path[1][2] = control.getY();
		arrowLine.path[1][3] = end.getX();
		arrowLine.path[1][4] = end.getY();

		arrowLine.set({
			path: arrowLine.path
		});

		this.updateArrowHead(group);
		this.canvas.renderAll();
	}

	updateArrowHead(group: Group): void {
		const controlPoints: Circle[] = [group._objects[2], group._objects[3], group._objects[4]] as Circle[];
		const arrowHead: Triangle = group._objects[1] as Triangle;
		const [_, middle, end] = controlPoints;

		// Update the position of the arrowhead
		const x1 = middle.left,
			y1 = middle.top;
		const x2 = end.left,
			y2 = end.top;

		const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

		arrowHead.set({
			left: x2,
			top: y2,
			angle: angle + 90 // Adjust arrowhead orientation
		});

		arrowHead.setCoords();
	}

	/** Show control points */
	showControlPoints(group: Group): void {
		const controlPoints: Circle[] = [group._objects[2], group._objects[3], group._objects[4]] as Circle[];
		controlPoints.forEach(point => {
			point.set('visible', true);
		});
		this.canvas.renderAll();
	}

	/** Hide control points */
	hideControlPoints(group: Group): void {
		const controlPoints: Circle[] = [group._objects[2], group._objects[3], group._objects[4]] as Circle[];
		controlPoints.forEach(point => {
			point.set('visible', false);
		});
		this.canvas.renderAll();
	}
}
