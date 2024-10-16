import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlassMinus, faMagnifyingGlassPlus } from '@fortawesome/pro-solid-svg-icons';
import { environment } from '@iterpro/config';
import { DrillFiltersConfig } from '@iterpro/manager/drills/data-access';
import { DrillsSearchComponent } from '@iterpro/manager/drills/ui';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { Attachment, Customer, Drill, DrillApi, Team, TeamApi } from '@iterpro/shared/data-access/sdk';
import { BackButtonComponent } from '@iterpro/shared/ui/components';
import { ClickOutsideDirective, FocusOutDirective } from '@iterpro/shared/ui/directives';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	AzureStorageService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ControlsOf,
	downloadFromBase64,
	DrillsMapping,
	DrillsMappingService,
	ErrorService,
	FormatDateUserSettingPipe,
	ImageService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActiveSelection, Canvas, FabricImage, FabricObject, Group, PencilBrush, Triangle } from 'fabric';
import { sortBy } from 'lodash';
import { ConfirmationService } from 'primeng/api';
import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { ContextMenuModule } from 'primeng/contextmenu';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PanelModule } from 'primeng/panel';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { distinctUntilChanged, filter, first } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { arrowHeadHeight, arrowHeadWidth, defaultBgImage, propertiesToKeep } from '../../models/drills-canvas.const';
import {
	DrillCanvas,
	DrillCanvasChangelog,
	DrillCanvasMapping,
	DrillCanvasMode,
	DrillCanvasModeType,
	DrillEditorCanvas
} from '../../models/drills-canvas.types';
import { DrillsCanvasService } from '../../services/drills-canvas.service';
import { DrillsCanvasActionsComponent } from '../drills-canvas-actions/drills-canvas-actions.component';
import { DrillsCanvasItemComponent } from '../drills-canvas-item/drills-canvas-item.component';
import { DrillsCanvasPlayersComponent } from '../drills-canvas-players/drills-canvas-players.component';
import { DrillsCanvasShapesComponent } from '../drills-canvas-shapes/drills-canvas-shapes.component';
import { DrillCanvasToolsComponent } from '../drills-canvas-tools/drills-canvas-tools.component';
@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		NgIf,
		NgClass,
		AsyncPipe,
		FormsModule,
		ReactiveFormsModule,
		TranslateModule,
		ButtonModule,
		InputSwitchModule,
		InputTextModule,
		ContextMenuModule,
		PanelModule,
		AutoFocusModule,
		FormsModule,
		FontAwesomeModule,
		FocusOutDirective,
		DrillsCanvasItemComponent,
		DrillsCanvasActionsComponent,
		DrillsCanvasShapesComponent,
		DrillsCanvasPlayersComponent,
		DrillCanvasToolsComponent,
		BackButtonComponent,
		DrillsSearchComponent,
		FormatDateUserSettingPipe,
		NgForOf,
		OverlayPanelModule,
		PrimeNgModule,
		ClickOutsideDirective
	],
	selector: 'iterpro-drills-canvas-edit',
	templateUrl: './drills-canvas-edit.component.html'
})
export class DrillsCanvasEditComponent implements OnInit, AfterViewInit, CanComponentDeactivate {
	/** Services */
	readonly #route = inject(ActivatedRoute);
	readonly #router = inject(Router);
	readonly #azureStorageService = inject(AzureStorageService);
	readonly #translateService = inject(TranslateService);
	readonly #drillCanvasService = inject(DrillsCanvasService);
	readonly #authStore = inject(Store<AuthState>);
	readonly #imageDownloadService = inject(ImageService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #formBuilder = inject(FormBuilder);
	readonly #errorService = inject(ErrorService);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly #teamApi = inject(TeamApi);
	readonly #drillsMappingService = inject(DrillsMappingService);
	readonly #alertService = inject(AlertService);
	readonly #drillApi = inject(DrillApi);

	/** Data */
	@ViewChild('canvasContainer') canvasContainer: ElementRef<HTMLDivElement> | null = null;
	/** HTML Canvas Container */
	drillCanvas: Canvas | null = new Canvas();
	drillCanvasMode: DrillCanvasModeType = DrillCanvasMode.Default;
	activeSelection: FabricObject[] | null = null;
	/** Actual canvas */
	drillMappings$: Observable<DrillCanvasMapping> | null = null;
	currentBackground: FabricImage | null = null;
	/** Undo/Redo */
	undoStack: DrillEditorCanvas[] = [];
	redoStack: DrillEditorCanvas[] = [];
	isRestoringCanvas: boolean = false;
	eventsTracked: boolean = true;

	/** Canvas Data */
	drillCanvasForm: FormGroup<ControlsOf<{ name: string }>> | null = this.#formBuilder.group({
		name: ['', Validators.required]
	});
	currentTeam: Team | null = null;
	currentTeamID: string | null = null;
	currentUser: Customer | null = null;
	cloningCanvas: DrillCanvas | null = null;
	editingCanvas: DrillCanvas | null = null;
	lastChangelog: DrillCanvasChangelog | null = null;

	/** Icons */
	readonly icons = {
		faMagnifyingGlassPlus,
		faMagnifyingGlassMinus
	};

	/** LinkToDrill */
	showDrillSearch: boolean;
	drillsListBackup: Drill[] = [];
	drillsMapping: DrillsMapping;
	readonly drillFiltersConfig: DrillFiltersConfig[] = [
		'theme',
		'goal',
		'duration',
		'numberOfPlayers',
		'pitchSize',
		'ageGroup'
	];

	/** Loading */
	isLoading: boolean = false;

	constructor() {
		/** Drill Canvas Mapping */
		this.drillMappings$ = this.#drillCanvasService.loadMappings();

		/** Init currentTeam and currentUser */
		combineLatest([
			this.#authStore.select(AuthSelectors.selectCurrentTeam),
			this.#authStore.select(AuthSelectors.selectCustomer)
		])
			.pipe(
				distinctUntilChanged(),
				filter(([currentTeam, customer]: [Team, Customer]) => !!currentTeam && !!customer)
			)
			.subscribe({
				next: ([currentTeam, customer]: [Team, Customer]) => {
					this.currentTeam = currentTeam;
					this.currentTeamID = currentTeam.id;
					this.currentUser = customer;
					this.loadDrills();
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	canDeactivate(): boolean {
		return this.undoStack.length === 0;
	}

	ngOnInit(): void {
		/** Check if editing */
		this.editingCanvas = this.#route.snapshot.data['drillCanvas'];
		this.cloningCanvas = this.#route.snapshot.data['clonedCanvas'];
	}

	async ngAfterViewInit(): Promise<void> {
		/** Init Canvas */
		this.drillCanvas = await this.createCanvas();

		/** Load Canvas */
		if (this.editingCanvas || this.cloningCanvas) {
			const canvas: DrillCanvas = this.editingCanvas || this.cloningCanvas;
			this.drillCanvasForm.patchValue({
				name: this.cloningCanvas ? canvas.name + '(1)' : canvas.name
			});
			this.restoreCanvas(canvas.canvas);
			this.lastChangelog = sortBy(canvas.changelog, 'timestamp').reverse()[0];
		} else {
			const defaultBackground: FabricImage = await FabricImage.fromURL(`${environment.CDN_URL}/${defaultBgImage}`, {
				crossOrigin: 'anonymous'
			});
			this.setBackgroundImage(defaultBackground);

			/** Add default Undo */
			const json = this.convertCanvasToJson(this.drillCanvas);
			this.undoStack.push(json);
		}
	}

	setBackgroundImage(backgroundImage: FabricImage): void {
		const containerDimensions: DOMRect = this.canvasContainer?.nativeElement.getBoundingClientRect();
		this.currentBackground = backgroundImage;
		this.drillCanvas.backgroundImage = backgroundImage;

		/** Set canvas width and height to keep aspect ratio of 5:3 */
		const height = containerDimensions.width * (3 / 5);

		if (height > containerDimensions.height) {
			this.drillCanvas.backgroundImage.scaleToHeight(containerDimensions.height);
		} else {
			this.drillCanvas.backgroundImage.scaleToHeight(height);
		}

		/** Render */
		this.drillCanvas.renderAll();
	}

	private async createCanvas(): Promise<Canvas> {
		/** Get elements */
		const containerDimensions: DOMRect = this.canvasContainer?.nativeElement.getBoundingClientRect();
		const canvas: HTMLCanvasElement = this.canvasContainer.nativeElement.children[0] as HTMLCanvasElement;

		/** Set canvas width and height to keep aspect ratio of 5:3 */
		let width = containerDimensions.width;
		let height = width * (3 / 5);

		if (height > containerDimensions.height) {
			height = containerDimensions.height;
			width = height * (5 / 3);
		}

		/** Create Canvas */
		const drillCanvas = new Canvas(canvas, {
			width,
			height,
			selectionColor: 'rgba(137, 207, 240, 0.05)',
			selectionBorderColor: '#89cff0',
			selectionLineWidth: 2,
			preserveObjectStacking: true,
			perPixelTargetFind: true,
			targetFindTolerance: 5
		});

		/** Track all events */
		drillCanvas.on({
			'selection:created': e => (this.activeSelection = e.selected),
			'selection:updated': e => (this.activeSelection = e.selected),
			'object:added': () => this.pushToHistory(),
			'object:modified': () => this.pushToHistory(),
			'object:removed': () => this.pushToHistory()
		});

		return drillCanvas;
	}

	clearSelection(): void {
		this.activeSelection = null;
	}

	toggleArrowMode({ enabled, dashed }: { enabled: boolean; dashed?: boolean }): void {
		if (enabled) {
			this.drillCanvas.isDrawingMode = false;
			this.drillCanvasMode = dashed ? DrillCanvasMode.ArrowDashed : DrillCanvasMode.Arrow;
		} else {
			this.drillCanvasMode = DrillCanvasMode.Default;
		}
	}

	toggleLineMode({ enabled, dashed }: { enabled: boolean; dashed?: boolean }): void {
		if (enabled) {
			this.drillCanvas.isDrawingMode = false;
			this.drillCanvasMode = dashed ? DrillCanvasMode.LineDashed : DrillCanvasMode.Line;
		} else {
			this.drillCanvasMode = DrillCanvasMode.Default;
		}
	}

	toggleEvents(enabled: boolean): void {
		this.eventsTracked = enabled;
	}

	addObj(obj: FabricObject): void {
		/** Add Obj */
		this.drillCanvas.add(obj);
		this.drillCanvas.setActiveObject(obj);
		this.drillCanvas.requestRenderAll();
		/** Reset Mode */
		this.drillCanvas.isDrawingMode = false;
		this.drillCanvasMode = DrillCanvasMode.Default;

		/** Push To History */
	}

	group(objects: FabricObject[]): void {
		const group: Group = new Group(objects);
		this.drillCanvas.add(group);
		this.drillCanvas.setActiveObject(group);
		this.drillCanvas.requestRenderAll();
	}

	ungroup(group: Group): void {
		this.drillCanvas.setActiveObject(new ActiveSelection(group.removeAll()));
		this.drillCanvas.remove(group);
		this.drillCanvas.requestRenderAll();
	}

	updateObjColor(colorHex: string): void {
		const activeObj: FabricObject = this.drillCanvas.getActiveObject();
		if (activeObj) {
			if (activeObj.type === 'path') {
				activeObj.set('stroke', colorHex);
			} else {
				activeObj.set('fill', colorHex);
			}
		}

		this.drillCanvas.requestRenderAll();
	}

	async restoreCanvas(canvas: DrillEditorCanvas): Promise<void> {
		this.isRestoringCanvas = true;

		/** Load from JSON and set background */
		await this.drillCanvas.loadFromJSON(canvas);
		const bgImg: FabricImage = await FabricImage.fromURL((canvas.backgroundImage as any).src, {
			crossOrigin: 'anonymous'
		});
		this.setBackgroundImage(bgImg);

		/** Set scale to keep aspect ratio of 5:3 */
		const editCanvasBgImage: FabricImage = canvas.backgroundImage as FabricImage;
		const bgImageWidth: number = editCanvasBgImage.width * editCanvasBgImage.scaleX;
		const scaleValue = this.drillCanvas.width / bgImageWidth;

		/** Scale up/down all objects */
		this.drillCanvas._objects.forEach((obj: FabricObject) => {
			obj.set({
				scaleX: (obj?.scaleX || 1) * scaleValue,
				scaleY: (obj?.scaleY || 1) * scaleValue,
				left: (obj?.left || 1) * scaleValue,
				top: (obj?.top || 1) * scaleValue
			});
			obj.setCoords();
		});

		/** Check Preserve Aspect Ratio */
		this.checkPreserveAspectRatio();

		/** Re-Render Canvas */
		this.drillCanvas.renderAll();

		/** Reset Undo Stack */
		this.isRestoringCanvas = false;
		this.undoStack = [];
		const json = this.convertCanvasToJson(this.drillCanvas);
		this.undoStack.push(json);
	}

	async resetCanvas(): Promise<void> {
		this.#confirmationService.confirm({
			message: this.#translateService.instant('drillCanvas.editor.clearConfirm'),
			header: this.#translateService.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => this.clearCanvas()
		});
	}

	clearCanvas(): void {
		/** Clear Canvas */
		this.drillCanvas.clear();
		this.resetStack();

		/** Reset Background image to the selected one */
		this.setBackgroundImage(this.currentBackground);
	}

	bringFront(obj: FabricObject): void {
		this.drillCanvas.bringObjectToFront(obj);
		this.drillCanvas.renderAll();
	}

	sendBack(obj: FabricObject): void {
		this.drillCanvas.sendObjectToBack(obj);
		this.drillCanvas.renderAll();
	}

	deleteSelectedObject(objs: FabricObject[]): void {
		objs.forEach(o => {
			if (o.type === 'group') {
				(o as Group)._objects.forEach(child => this.drillCanvas.remove(child));
			}

			this.drillCanvas.remove(o);
		});

		this.activeSelection = null;
		this.drillCanvas.discardActiveObject();
		this.drillCanvas.renderAll();
	}

	activateCursor(): void {
		this.drillCanvas.isDrawingMode = false;
		this.drillCanvasMode = DrillCanvasMode.Default;
	}

	activateDrawing(dashed: boolean = false): void {
		this.drillCanvasMode = dashed ? DrillCanvasMode.DrawDashed : DrillCanvasMode.Draw;
		this.drillCanvas.isDrawingMode = true;
		this.drillCanvas.freeDrawingBrush = new PencilBrush(this.drillCanvas);
		this.drillCanvas.freeDrawingBrush.width = 5;
		this.drillCanvas.freeDrawingBrush.color = 'black';
		this.drillCanvas.freeDrawingBrush.strokeLineCap = 'round';
		this.drillCanvas.freeDrawingBrush.strokeLineJoin = 'round';
		this.drillCanvas.freeDrawingBrush.strokeDashArray = dashed ? [10, 10] : null;
	}

	/** UNDO & REDO Logic */
	pushToHistory(): void {
		/** Empty Redo Stack */
		if (!this.isRestoringCanvas && this.eventsTracked) {
			const json = this.convertCanvasToJson(this.drillCanvas);
			this.undoStack.push(json);
		}
	}

	private convertCanvasToJson(canvas: Canvas): any {
		return { ...canvas.toObject([...propertiesToKeep]) };
	}

	async redo(): Promise<void> {
		if (this.redoStack.length > 0) {
			/** Pop and Restore Canvas */
			this.isRestoringCanvas = true;
			const nextCanvas = this.redoStack.pop();
			this.undoStack.push(nextCanvas);

			/** Load from JSON & check if images or arrows */
			await this.drillCanvas.loadFromJSON(nextCanvas);
			this.checkPreserveAspectRatio();

			/** Re-Render and end of restoring */
			this.activeSelection = null;
			this.drillCanvas.requestRenderAll();
			this.isRestoringCanvas = false;
		}
	}

	async undo(): Promise<void> {
		if (this.undoStack.length > 0) {
			/** Put in Redo Stack */
			const currentCanvas = this.convertCanvasToJson(this.drillCanvas);
			this.redoStack.push(currentCanvas);

			/** Pop and Restore Canvas */
			this.isRestoringCanvas = true;
			this.undoStack.pop();
			const previousCanvas = this.undoStack[this.undoStack.length - 1];

			if (!!previousCanvas) {
				await this.drillCanvas.loadFromJSON(previousCanvas);
				this.checkPreserveAspectRatio();
			} else {
				this.clearCanvas();
			}

			this.activeSelection = null;
			this.drillCanvas.requestRenderAll();
			this.isRestoringCanvas = false;
		}
	}

	private resetStack(): void {
		this.undoStack = [];
		this.redoStack = [];
	}

	/**
	 * CRUD ACTIONS
	 */
	async saveDrillCanvas(): Promise<void> {
		this.isLoading = true;
		/** Get Canvas JSON format and preview image URL */
		const base64: string = this.convertToImage();
		const file = this.#imageDownloadService.dataURItoFilename(base64, uuid());
		const imageUrl: string = await this.#azureStorageService.uploadBrowserFileToAzureStore(file);

		/** Populate DrillCanvas */
		const tmpCanvas: DrillCanvas | null = this.cloningCanvas || this.editingCanvas;
		const drillCanvas: Partial<DrillCanvas> | null = { ...tmpCanvas };
		drillCanvas.name = this.drillCanvasForm.value.name;
		drillCanvas.previewUrl = imageUrl;
		drillCanvas.canvas = { ...this.drillCanvas.toObject([...propertiesToKeep]) };

		/** Save Canvas */
		if (this.editingCanvas) {
			/** Editing */
			drillCanvas.changelog.push({
				authorId: this.currentUser?.id,
				authorName: this.currentUser?.firstName + ' ' + this.currentUser?.lastName,
				timestamp: new Date().toISOString()
			});

			this.#drillCanvasService.updateDrillCanvas(this.currentTeamID, drillCanvas).subscribe({
				next: () => {
					this.isLoading = false;
					this.drillCanvasForm.markAsPristine();
					this.resetStack();
					this.#alertService.notify('success', 'drillCanvas.title', 'alert.recordUpdated', false);
				}
			});
		} else {
			/** Create from scratch (also cloning) */
			drillCanvas.animated = false;
			drillCanvas.sharedWith = [];
			drillCanvas.author = {
				authorId: this.currentUser?.id,
				authorName: this.currentUser?.firstName + ' ' + this.currentUser?.lastName
			};

			/** Delete keys if cloning */
			if (this.cloningCanvas) {
				delete drillCanvas.changelog;
				delete drillCanvas.id;
				delete drillCanvas.version;
			}

			/** API Call */
			this.#drillCanvasService.createDrillCanvas(this.currentTeamID, drillCanvas).subscribe({
				next: ({ id }) => {
					this.editingCanvas = {
						...(drillCanvas as DrillCanvas),
						id
					};
					this.drillCanvasForm.markAsPristine();
					this.isLoading = false;
					this.resetStack();
					this.#alertService.notify('success', 'drillCanvas.title', 'alert.recordUpdated', false);
				}
			});
		}
	}

	deleteDrillCanvas(): void {
		this.#confirmationService.confirm({
			message: this.#translateService.instant('drillCanvas.deleteConfirm'),
			header: this.drillCanvasForm.value.name,
			accept: () => {
				this.#drillCanvasService.deleteDrillCanvas(this.currentTeamID, this.editingCanvas.id).subscribe(() => {
					this.resetStack();
					this.#router.navigate(['manager', 'drills', 'canvas']);
				});
			}
		});
	}

	downloadPreview(): void {
		const base64: string = this.convertToImage();
		downloadFromBase64(base64, this.drillCanvasForm.value.name + '.png');
	}

	private checkPreserveAspectRatio(): void {
		this.drillCanvas._objects.forEach((obj: FabricObject) => {
			/** Check object type */
			const isArrow = obj.get('arrow');
			if (obj.type === 'image' || isArrow) {
				obj.setControlsVisibility({
					mb: false,
					ml: false,
					mr: false,
					mt: false
				});
			}

			if (isArrow) {
				obj.on('scaling', e => {
					const scaleX: number = obj.scaleX;
					const scaleY: number = obj.scaleY;
					const arrowHead: Triangle = (obj as Group)._objects[1] as Triangle;
					arrowHead.width = arrowHeadWidth / scaleX;
					arrowHead.height = arrowHeadHeight / scaleY;
					this.drillCanvas.renderAll();
				});
			}
		});

		this.drillCanvas.renderAll();
	}

	private convertToImage(): string {
		const base64Image: string = this.drillCanvas.toDataURL({
			width: this.drillCanvas.width,
			height: this.drillCanvas.height,
			format: 'png',
			quality: 0.8,
			multiplier: 1
		});

		return base64Image;
	}

	private handleResize(): void {
		/** Handle Resize Event */
		// fromEvent(window, 'resize')
		// 	.pipe(
		// 		takeUntilDestroyed(),
		// 		debounceTime(300),
		// 		tap(() => {
		// 			const containerDimensions: DOMRect = this.canvasContainer?.nativeElement.getBoundingClientRect();
		// 			/** Set canvas width and height to keep aspect ratio of 16:9 */
		// 			const width = containerDimensions.width;
		// 			const height = containerDimensions.width * (9 / 16);
		// 			this.drillCanvas.setDimensions({ width, height });
		// 		}),
		// 		switchMap(() => this.loadBackgroundImage(`/assets/img/${this.sportType}/${this.currentBackground}.jpg`))
		// 	)
		// 	.subscribe((image: FabricImage) => this.setBackgroundImage(image));
	}

	// region LinkTo Drill
	private loadDrills() {
		this.#blockUiInterceptorService
			.disableOnce(
				this.#teamApi.getDrills(this.currentTeamID, {
					where: {
						or: [{ authorId: this.currentUser.id }, { sharedWithIds: this.currentUser.id }]
					},
					order: 'name ASC',
					include: 'attachments'
				})
			)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (drills: Drill[]) => {
					this.drillsListBackup = drills;
					this.loadDrillMapping();
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private loadDrillMapping() {
		this.drillsMapping = this.#drillsMappingService.getDrillsMapping(this.currentTeam);
	}

	linkToDrill(): void {
		this.showDrillSearch = true;
	}

	handleDrillSelected(drills: Drill[]): void {
		// TODO: Alert message translations
		this.showDrillSearch = false;
		this.#confirmationService.confirm({
			header: this.#translateService.instant('confirm.title'),
			message: this.#translateService.instant(
				'You are about to link the current image to the selected drill. Are you sure?'
			),
			icon: 'fa fa-question-circle',
			accept: async () => await this.uploadCurrentImageToDrill(drills)
		});
	}

	private async uploadCurrentImageToDrill(drills: Drill[]) {
		/** Convert to base64 and upload to Azure */
		const base64: string = this.convertToImage();
		const obs$: Observable<void>[] = [];
		for (let drill of drills) {
			const file = this.#imageDownloadService.dataURItoFilename(base64, uuid());
			const imageUrl: string = await this.#azureStorageService.uploadBrowserFileToAzureStore(file);
			/** Create Attachment */
			const attachment: Attachment = new Attachment({
				id: uuid(),
				name: this.drillCanvasForm.value.name + '.png',
				url: imageUrl,
				downloadUrl: imageUrl,
				date: new Date(),
				authorId: this.currentUser?.id
			});
			/** Insert Attachment to selected Drill */
			obs$.push(this.#drillApi.createAttachments(drill.id, attachment));
		}
		/** Api Call */
		forkJoin(obs$)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: () => {
					this.#alertService.notify('success', 'drillCanvas.title', 'alert.recordUpdated', false);
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	//endregion
}
