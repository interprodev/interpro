import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { environment } from '@iterpro/config';
import { ControlsOf, getCorrectTextColorUtil } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Circle, FabricObject, Group, Path, Textbox } from 'fabric';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { TooltipModule } from 'primeng/tooltip';
import { defaulObjOptions, drillCanvasColors, drillCanvasColorsMap, shirtSVG } from '../../models/drills-canvas.const';
import { DrillCanvasItem, PlayerCanvas, PlayerCanvasType } from '../../models/drills-canvas.types';
import { playerJerseyValidator } from '../../utils/player-jersey.validator';
import { DrillsCanvasItemComponent } from '../drills-canvas-item/drills-canvas-item.component';

@Component({
	standalone: true,
	imports: [
		TranslateModule,
		TooltipModule,
		DrillsCanvasItemComponent,
		ButtonModule,
		ColorPickerModule,
		InputTextModule,
		OverlayPanelModule,
		FormsModule,
		ReactiveFormsModule
	],
	selector: 'iterpro-drills-canvas-players',
	templateUrl: 'drills-canvas-players.component.html'
})
export class DrillsCanvasPlayersComponent {
	/** Services */
	readonly #translateService = inject(TranslateService);
	readonly #formBuilder = inject(FormBuilder);

	/** Inputs & Outputs */
	@Input({ required: true }) players!: DrillCanvasItem[];
	@Output() addPlayer = new EventEmitter<Group>();

	/** Data */
	readonly CDN_URL = environment.CDN_URL;
	readonly colors: string[] = drillCanvasColors;

	/** Variables */
	playerForm: FormGroup<ControlsOf<{ number: string }>> | null = this.#formBuilder.group({
		number: ['', playerJerseyValidator()]
	});
	selectedPlayerColor: string = '#000000';
	overplayPanelParams: {
		type: PlayerCanvasType;
		title: string;
	};

	/** Methods */
	createPlayer(type: PlayerCanvasType): void {
		/** Get number and jersey */
		const numberText: string = this.playerForm.value.number ? String(this.playerForm.value.number) : '';
		const jerseyColor: string = this.selectedPlayerColor;

		/** Player Obj */
		let playerObject: FabricObject;
		const playerOptions: any = {
			radius: 15,
			fill: jerseyColor,
			stroke: getCorrectTextColorUtil(jerseyColor),
			strokeWidth: 2,
			originX: 'center',
			originY: 'center'
		};

		if (type === PlayerCanvas.Dot) {
			playerObject = new Circle(playerOptions);
		} else {
			playerObject = new Path(shirtSVG, playerOptions);
		}

		/** Number  */
		const number: Textbox = new Textbox(numberText, {
			fontFamily: 'Gotham',
			fontSize: type === PlayerCanvas.Dot ? 15 : 20,
			fill: getCorrectTextColorUtil(jerseyColor),
			originX: 'center',
			originY: 'center'
		});

		/** Group */
		const jerseyGroup: Group = new Group([playerObject, number], {
			top: 100,
			left: 100,
			originX: 'center',
			originY: 'center',
			...defaulObjOptions
		});

		if (type === PlayerCanvas.TShirt) {
			number.set({
				left: numberText.length === 1 ? 2 : 6,
				top: 5
			});
		}

		jerseyGroup.scaleToWidth(type === PlayerCanvas.TShirt ? 50 : 40);

		/** Finalize Group Logic and constraints */
		jerseyGroup.setControlsVisibility({
			mb: false,
			ml: false,
			mr: false,
			mt: false
		});

		/** Emit Player */
		this.addPlayer.emit(jerseyGroup);
	}

	togglePanel(type: PlayerCanvasType, color: string, op: OverlayPanel, event: MouseEvent): void {
		this.selectedPlayerColor = type === PlayerCanvas.TShirt ? drillCanvasColorsMap[color.split('shirt-')[1]] : color;
		this.overplayPanelParams = {
			type,
			title:
				type === PlayerCanvas.TShirt
					? this.#translateService.instant('drillCanvas.editor.addTShirtNumber')
					: this.#translateService.instant('drillCanvas.editor.addDotNumber')
		};

		op.toggle(event);
	}
}
