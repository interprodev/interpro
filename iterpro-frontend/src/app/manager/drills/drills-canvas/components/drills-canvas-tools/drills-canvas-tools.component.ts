import { NgClass } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowPointer, faPenLine, faScribble, faText } from '@fortawesome/pro-solid-svg-icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Textbox } from 'fabric';
import { TooltipModule } from 'primeng/tooltip';
import { DrillCanvasMode, DrillCanvasModeType } from '../../models/drills-canvas.types';

@Component({
	standalone: true,
	imports: [NgClass, TranslateModule, FontAwesomeModule, TooltipModule],
	selector: 'iterpro-drills-canvas-tools',
	templateUrl: 'drills-canvas-tools.component.html'
})
export class DrillCanvasToolsComponent {
	/** Services */
	readonly #translateService = inject(TranslateService);
	readonly canvasModes = DrillCanvasMode;

	/** Input & Outputs */
	@Input() canvasMode: DrillCanvasModeType;
	@Output() drawingMode = new EventEmitter<boolean>();
	@Output() cursorMode = new EventEmitter<boolean>();
	@Output() addTextbox = new EventEmitter<Textbox>();

	/** Icons */
	readonly icons = {
		faArrowPointer,
		faPenLine,
		faScribble,
		faText
	};

	/** Methods */
	activateDrawing(dashed: boolean = false): void {
		this.drawingMode.emit(dashed);
	}

	activateCursor(): void {
		this.cursorMode.emit();
	}

	addText(): void {
		const textbox: Textbox = new Textbox(this.#translateService.instant('drillCanvas.editor.placeholderText'), {
			left: 100,
			top: 100,
			width: 150,
			fontSize: 20,
			fontFamily: 'Gotham',
			fill: 'white',
			backgroundColor: 'black',
			padding: 10
		});
		this.addTextbox.emit(textbox);
	}
}
