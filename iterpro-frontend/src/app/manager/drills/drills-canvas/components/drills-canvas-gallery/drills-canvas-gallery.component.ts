import { Location, NgClass, NgIf, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCopy, faIdCard, faList, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	ActionButtonsComponent,
	BackButtonComponent,
	IconModalPreviewComponent,
	SkeletonGridComponent,
	SkeletonTableComponent
} from '@iterpro/shared/ui/components';
import { ArrayFromNumberPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { AzureStoragePipe, FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { SelectButtonChangeEvent } from 'primeng/selectbutton';
import { take } from 'rxjs';
import { DrillViewType, drillViews } from '../../../models/drills.types';
import { DrillCanvas } from '../../models/drills-canvas.types';
import { DrillCanvasCardComponent } from '../drills-canvas-card/drills-canvas-card.component';

@Component({
	standalone: true,
	imports: [
		NgStyle,
		TranslateModule,
		FontAwesomeModule,
		FormsModule,
		PrimeNgModule,
		FormatDateUserSettingPipe,
		AzureStoragePipe,
		IconModalPreviewComponent,
		NgClass,
		DrillCanvasCardComponent,
		SkeletonTableComponent,
		ArrayFromNumberPipe,
		ActionButtonsComponent,
		SkeletonGridComponent,
		BackButtonComponent,
		AzureStoragePipe,
		NgIf
	],
	selector: 'iterpro-drills-canvas-gallery',
	templateUrl: './drills-canvas-gallery.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrillsCanvasGalleryComponent implements OnInit {
	/** Services */
	readonly #authStore = inject(Store<AuthState>);
	readonly #router = inject(Router);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #translateService = inject(TranslateService);
	readonly location = inject(Location);
	/** Input & Outputs */
	@Input({ required: true }) set drillCanvas(value: DrillCanvas[] | null) {
		this.canvas = value;
		this.filteredCanvas = this.canvas;
	}
	@Output() addCanvas = new EventEmitter<void>();
	@Output() editCanvas = new EventEmitter<DrillCanvas>();
	@Output() deleteCanvas = new EventEmitter<string[]>();
	@Output() cloneCanvas = new EventEmitter<string>();

	/** Data */
	readonly viewModes = drillViews;

	canvas: DrillCanvas[] | null;
	filteredCanvas: DrillCanvas[] | null = null;
	selectedCanvas: DrillCanvas[] = [];
	currentTeamID: string | null = null;

	/** Icons */
	readonly icons = {
		faIdCard,
		faList,
		faCopy,
		faTrash
	};

	viewTypes: MenuItem[] = [
		{
			id: drillViews.Card,
			label: 'admin.squads.cardView',
			faIcon: this.icons.faIdCard,
			command: () => this.activeViewType = this.viewTypes[0]
		},
		{
			id: drillViews.List,
			label: 'admin.squads.tableView',
			faIcon: this.icons.faList,
			command: () => this.activeViewType = this.viewTypes[1]
		}
	];
	activeViewType: MenuItem = this.viewTypes[0];

	/** Methods */
	ngOnInit(): void {
		/** Init Team ID */
		this.#authStore
			.select(AuthSelectors.selectCurrentTeamId)
			.pipe(take(1))
			.subscribe(id => (this.currentTeamID = id));
	}

	changeView() {
		this.selectedCanvas = [];
	}

	addNewTemplate() {
		this.selectedCanvas = [];
		const path: string = `/manager/drills/templates/new`;
		this.#router.navigate([path]);
	}

	openTemplateDetails(canvas: DrillCanvas) {
		this.editCanvas.emit(canvas);
	}

	discard() {
		this.selectedCanvas = [];
	}

	// region CLONE
	askToClone(e: MouseEvent, id: string) {
		/** Avoid opening detail */
		e.stopPropagation();

		/** Confirm Delete */
		this.#confirmationService.confirm({
			message: this.#translateService.instant('drillCanvas.cloneConfirm'),
			header: this.#translateService.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.cloneCanvas.emit(id)
		});
	}

	// region DELETE
	askToDelete(e?: MouseEvent, id?: string) {
		/** Avoid opening detail */
		e?.stopPropagation();

		/** Confirm Delete */
		const ids = this.selectedCanvas.map(({ id }) => id);
		this.#confirmationService.confirm({
			message: this.#translateService.instant('confirm.deleteAll'),
			header: this.#translateService.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.deleteTemplates(id ? [id] : ids)
		});
	}

	private deleteTemplates(ids: string[]) {
		this.selectedCanvas = [];
		this.deleteCanvas.emit(ids);
	}

	// region CARD VIEW UTILS
	handleSelected(checked: boolean, templateId: string) {
		this.selectedCanvas = checked
			? [...this.selectedCanvas, this.canvas!.find(({ id }) => id === templateId)!]
			: this.selectedCanvas!.filter(({ id }) => id !== templateId);
	}

	searchTemplates(ev) {
		const val = ev.target.value;
		if (val && val.trim() !== '') {
			this.filteredCanvas = cloneDeep(this.canvas).filter(item => {
				return item.name.toLowerCase().indexOf(val.toLowerCase()) > -1;
			});
		} else {
			this.filteredCanvas = cloneDeep(this.canvas);
		}
	}
}
