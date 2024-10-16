import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { ErrorService } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, filter, forkJoin, switchMap, take } from 'rxjs';
import { DrillCanvasStore } from './+state/drills-canvas.state';
import { DrillsCanvasGalleryComponent } from './components/drills-canvas-gallery/drills-canvas-gallery.component';
import { DrillCanvasWizardComponent } from './components/drills-canvas-wizard/drill-canvas-wizard.component';
import { DrillCanvas } from './models/drills-canvas.types';
import { DrillsCanvasService } from './services/drills-canvas.service';
import { sortBy } from 'lodash';
import { SelectItem } from 'primeng/api';

@Component({
	templateUrl: './drills-canvas.component.html',
	selector: 'iterpro-drills-canvas',
	standalone: true,
	imports: [
		CommonModule,
		TranslateModule,
		DynamicDialogModule,
		DrillsCanvasGalleryComponent,
		DrillCanvasWizardComponent
	],
	providers: [DrillCanvasStore]
})
export class DrillsTemplatesComponent implements OnInit {
	/** Services */
	readonly #dialogService = inject(DialogService);
	readonly #drillsCanvasService = inject(DrillsCanvasService);
	readonly #errorService = inject(ErrorService);
	readonly #router = inject(Router);
	readonly #authStore = inject(Store<AuthState>);
	readonly #translateService = inject(TranslateService);
	readonly #drillCanvasStore = inject(DrillCanvasStore);

	/** Data */
	isLoading: boolean = false;
	drillCanvas: DrillCanvas[] | null = null;
	currentTeamID: string | null = null;

	/** Methods */
	ngOnInit(): void {
		this.loadDrillCanvases();
	}

	loadDrillCanvases(): void {
		this.#authStore
			.select(AuthSelectors.selectCurrentTeamId)
			.pipe(
				take(1),
				filter(id => !!id),
				switchMap(id => this.#drillsCanvasService.loadCanvases(id))
			)
			.subscribe({
				next: (drillCanvas: DrillCanvas[]) => (this.drillCanvas = sortBy(drillCanvas, 'lastUpdated.timestamp').reverse()),
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	addCanvas(): void {
		const options: SelectItem[] = [
			{ label:  this.#translateService.instant('drillCanvas.wizard.new'), value: 'new' },
			...(this.drillCanvas || []).map(canvas => ({ label: canvas.name, value: canvas.id }))
		]
		const dialogRef: DynamicDialogRef<DrillCanvasWizardComponent> = this.#dialogService.open(
			DrillCanvasWizardComponent,
			{
				header: this.#translateService.instant('drillCanvas.wizard.new'),
				closable: false,
				data: {
					drillCanvasOptions: options
				}
			}
		);

		dialogRef.onClose.pipe(take(1)).subscribe((canvasId?: string) => {
			if (canvasId) {
				if (canvasId === 'new') {
					this.#router.navigate([`manager/drills/canvas/new`])
				} else {
					this.cloneCanvas(canvasId);
				}
			}
		});
	}

	editCanvas(canvas: DrillCanvas): void {
		this.#router.navigate([`manager/drills/canvas/${canvas.id}`]);
	}

	deleteCanvases(ids: string[]): void {
		this.#authStore
			.select(AuthSelectors.selectCurrentTeamId)
			.pipe(
				take(1),
				filter(id => !!id),
				switchMap(id => {
					this.currentTeamID = id;
					const deletObs: Observable<boolean>[] = ids.map(id =>
						this.#drillsCanvasService.deleteDrillCanvas(this.currentTeamID, id)
					);
					return forkJoin(deletObs).pipe(switchMap(() => this.#drillsCanvasService.loadCanvases(this.currentTeamID)));
				})
			)
			.subscribe(drillCanvases => (this.drillCanvas = [...drillCanvases]));
	}

	cloneCanvas(id: string): void {
		this.#router.navigate([`manager/drills/canvas/new`], { queryParams: { id } });
	}
}
