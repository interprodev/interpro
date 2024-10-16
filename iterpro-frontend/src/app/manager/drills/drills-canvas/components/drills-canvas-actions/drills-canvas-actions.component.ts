import { NgClass } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
	faArrowPointer,
	faBringFront,
	faBroom,
	faCopy,
	faObjectGroup,
	faObjectUngroup,
	faPalette,
	faRotateLeft,
	faRotateRight,
	faSendBack,
	faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { Canvas, FabricObject, Group, Triangle } from 'fabric';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TooltipModule } from 'primeng/tooltip';
import { arrowHeadHeight, arrowHeadWidth, defaulObjOptions, propertiesToKeep } from '../../models/drills-canvas.const';
import { DrillEditorCanvas } from '../../models/drills-canvas.types';

@Component({
	standalone: true,
	imports: [NgClass, ButtonModule, ColorPickerModule, FontAwesomeModule, TranslateModule, TooltipModule],
	selector: 'iterpro-drills-canvas-actions',
	templateUrl: 'drills-canvas-actions.component.html'
})
export class DrillsCanvasActionsComponent {
	/** Input & Outputs */
	@Input({ required: true }) canvas!: Canvas;
	@Input({ required: true }) undoStack!: DrillEditorCanvas[];
	@Input({ required: true }) redoStack!: DrillEditorCanvas[];
	@Input({ required: true }) set activeSelection(value: FabricObject[]) {
		this.activeObjects = value;
		this.checkActions();
	}

	@Output() defaultMode = new EventEmitter<void>();
	@Output() resetCanvas = new EventEmitter<void>();
	@Output() deleteObjects = new EventEmitter<FabricObject[]>();
	@Output() copyObject = new EventEmitter<FabricObject>();
	@Output() groupObjects = new EventEmitter<FabricObject[]>();
	@Output() ungroupObjects = new EventEmitter<Group>();
	@Output() undoAction = new EventEmitter<void>();
	@Output() redoAction = new EventEmitter<void>();
	@Output() colorChange = new EventEmitter<string>();
	@Output() bringFront = new EventEmitter<FabricObject>();
	@Output() sendBack = new EventEmitter<FabricObject>();

	/** Data */
	activeObjects: FabricObject[] = [];
	canGroup: boolean = false;
	canUngroup: boolean = false;
	canClone: boolean = false;
	canDelete: boolean = false;
	canUpdateZIndex: boolean = false;

	/** Icons */
	readonly icons = {
		faArrowPointer,
		faPalette,
		faBroom,
		faTrash,
		faCopy,
		faRotateLeft,
		faRotateRight,
		faObjectGroup,
		faObjectUngroup,
		faBringFront,
		faSendBack
	};

	private checkActions(): void {
		if (this.activeObjects && this.activeObjects.length > 0) {
			this.canDelete = true;
			if (this.activeObjects.length > 1) {
				this.canGroup = true;
				this.canClone = false;
				this.canUngroup = false;
			} else {
				const obj: FabricObject = this.activeObjects[0];
				this.canClone = true;
				this.canUpdateZIndex = true;
				this.canGroup = false;

				if (obj.type === 'group' && !obj.get('arrow')) {
					this.canUngroup = true;
				}
			}
		} else {
			/** Reset actions */
			this.canClone = false;
			this.canUngroup = false;
			this.canGroup = false;
			this.canUpdateZIndex = false;
			this.canDelete = false;
		}
	}

	/** Methods */
	group(): void {
		this.groupObjects.emit(this.activeObjects);
	}

	ungroup(): void {
		this.ungroupObjects.emit(this.activeObjects[0] as Group);
	}

	undo(): void {
		this.undoAction.emit();
	}

	redo(): void {
		this.redoAction.emit();
	}

	async copy(): Promise<void> {
		/** Clone the object */
		const clonedObject: FabricObject = await this.activeObjects[0].clone([...propertiesToKeep]);
		clonedObject.left += 10;
		clonedObject.top += 10;
		const isArrow = clonedObject.get('arrow');

		clonedObject.set({
			arrow: isArrow,
			...defaulObjOptions
		});

		/** Check object type and preserve aspect ratio */
		if (clonedObject.type === 'image' || isArrow) {
			clonedObject.setControlsVisibility({
				mb: false,
				ml: false,
				mr: false,
				mt: false
			});
		}

		if (isArrow) {
			clonedObject.on('scaling', e => {
				const scaleX: number = clonedObject.scaleX;
				const scaleY: number = clonedObject.scaleY;
				const arrowHead: Triangle = (clonedObject as Group)._objects[1] as Triangle;
				arrowHead.width = arrowHeadWidth / scaleX;
				arrowHead.height = arrowHeadHeight / scaleY;
				this.canvas.renderAll();
			});
		}

		this.copyObject.emit(clonedObject);
	}

	bringObjFront(): void {
		this.bringFront.emit(this.activeObjects[0]);
	}

	sendObjBack(): void {
		this.sendBack.emit(this.activeObjects[0]);
	}

	delete(): void {
		this.deleteObjects.emit(this.activeObjects);
	}

	updateObjColor(event: { originalEvent: MouseEvent; value: string }): void {
		this.colorChange.emit(event.value);
	}

	get isObject(): boolean {
		const obj: FabricObject = this.canvas.getActiveObject();
		return !!obj && obj?.type !== 'group' && obj.type !== 'image';
	}

	// region Listeners
	@HostListener('window:keydown', ['$event'])
	handleKeyDown(event: KeyboardEvent): void {
		/** Check events */
		if (this.canDelete && event.key === 'Backspace') {
			event.preventDefault();
			this.delete();
		} else if (this.canClone && (event.ctrlKey || event.metaKey) && event.key === 'd') {
			event.preventDefault();
			this.copy();
		} else if (this.undoStack.length > 1 && (event.ctrlKey || event.metaKey) && event.key === 'z') {
			event.preventDefault();
			this.undo();
		} else if (this.redoStack.length > 0 && (event.ctrlKey || event.metaKey) && event.key === 'y') {
			event.preventDefault();
			this.redo();
		}
	}
}
