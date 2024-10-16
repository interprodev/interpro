import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { environment } from '@iterpro/config';
import { TranslateModule } from '@ngx-translate/core';
import { FabricImage } from 'fabric';
import { TooltipModule } from 'primeng/tooltip';
import { defaulObjOptions } from '../../models/drills-canvas.const';
import { DrillCanvasItem } from '../../models/drills-canvas.types';

@Component({
	standalone: true,
	imports: [NgClass, TranslateModule, TooltipModule],
	selector: 'iterpro-drills-canvas-item',
	templateUrl: 'drills-canvas-item.component.html'
})
export class DrillsCanvasItemComponent {
	/** Input & Output */
	@Input({ required: true }) item: DrillCanvasItem;
	@Input() isBackground: boolean = false;
	@Output() addItem: EventEmitter<FabricImage> = new EventEmitter();

	/** Data */
	readonly CDN_URL: string = environment.CDN_URL + '/';

	/** Methods */
	async addImgItem(itemURL: string): Promise<void> {
		const imgUrl: string = `${this.CDN_URL}/${itemURL}`;
		const img: FabricImage = await FabricImage.fromURL(imgUrl, { crossOrigin: 'anonymous' }, { ...defaulObjOptions });

		// Set size
		img.scaleToWidth(50);

		// Preserve aspect ratio hiding some controls
		img.setControlsVisibility({
			mb: false,
			ml: false,
			mr: false,
			mt: false
		});

		// Set position
		img.set({
			top: this.isBackground ? 0 : 100,
			left: this.isBackground ? 0 : 100
		});

		this.addItem.emit(img);
	}
}
