import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
	Attachment,
	AzureStorageApi,
	Injury,
	LoopBackAuth,
	MedicalTreatment,
	MedicalTreatmentApi,
	Player,
	Team
} from '@iterpro/shared/data-access/sdk';
import {
	AlertService,
	AzureStorageService,
	ErrorService,
	InjuryService,
	parseHtmlStringToText,
	sortByDateDesc
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dictionary } from '@ngrx/entity';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, flatten, groupBy } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService } from 'primeng/api';
import { Observable, forkJoin, of } from 'rxjs';
import { exhaustMap, first, switchMap, take } from 'rxjs/operators';
import {
	ApplyToPlayersEvent,
	DeleteTreatmentEvent,
	SaveTreatmentEvent,
	TreatmentSection,
	TreatmentType
} from '../../interfaces/treatment-table.interface';
import {
	completeWithMissingFields,
	getAttachmentToUpload,
	hasMissingRequiredFields
} from '../../utils/treatment-table-utils';
import { TreatmentTableComponent } from '../treatment-table/treatment-table.component';

@UntilDestroy()
@Component({
	selector: 'iterpro-medical-treatments',
	templateUrl: './medical-treatments.component.html',
	styleUrls: ['./medical-treatments.component.css']
})
export class MedicalTreatmentsComponent implements OnInit {
	@Input() readonly section: TreatmentSection = 'injury';
	@Input() readonly player: Player;
	@Input() readonly players: Player[];
	@Input() readonly allInjuries: Injury[];
	@Input() readonly injury: Injury;
	@Input() medicalTreatments: MedicalTreatment[];
	@Input() showFilters = false;
	@Input() tableScrollHeight = '500px';
	@Input() readonlyMode = false;
	@Input() currentEventDate: Date;
	@Output() expand: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() applyToPlayersEmitter: EventEmitter<Dictionary<any>> = new EventEmitter<Dictionary<any>>();
	@Output() treatmentAddedEmitter: EventEmitter<MedicalTreatment[]> = new EventEmitter<MedicalTreatment[]>();
	@Output() treatmentDeletedEmitter: EventEmitter<MedicalTreatment[]> = new EventEmitter<MedicalTreatment[]>();
	sidebarOpened = true;
	multipleTreatmentsDialog: { visible: boolean; rows: MedicalTreatment[]; isLoading: boolean } = {
		visible: false,
		rows: [],
		isLoading: false
	};
	private playersApplyTo: Player[] = [];
	private tempTreatment: MedicalTreatment;
	@ViewChild('treatmentTable', { static: false }) treatmentTableEl: TreatmentTableComponent;
	@ViewChild('multipleTreatmentTable', { static: false }) multipleTreatmentTableEl: TreatmentTableComponent;
	constructor(
		private auth: LoopBackAuth,
		private error: ErrorService,
		private translate: TranslateService,
		private injuryService: InjuryService,
		private azureStorageApi: AzureStorageApi,
		private confirmation: ConfirmationService,
		private notificationService: AlertService,
		private azureUploadService: AzureStorageService,
		private medicalTreatmentApi: MedicalTreatmentApi
	) {}
	ngOnInit(): void {
		this.expand.emit(this.sidebarOpened);
	}

	onToggleSidebar() {
		this.sidebarOpened = !this.sidebarOpened;
		this.expand.emit(this.sidebarOpened);
	}

	private hasChanges(instance: MedicalTreatment, attachment: File): boolean {
		return (
			!!attachment ||
			JSON.stringify(this.treatmentTypeToMedicalTreatment(instance)) !==
				JSON.stringify(this.treatmentTypeToMedicalTreatment(this.tempTreatment))
		);
	}

	private createEventAndUpdateInstance(instance: MedicalTreatment) {
		this.injuryService
			.createEventAndUpdateInstance(instance, null, 'treatment', this.hasChanges(instance, undefined), this.player)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: MedicalTreatment) => {
					this.onSavedInstance(result);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private updateEvent(instance: MedicalTreatment) {
		this.injuryService
			.updateEvent(instance, 'treatment', null, this.hasChanges(instance, undefined), this.player)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: MedicalTreatment) => {
					if (result) {
						this.onSavedInstance(instance);
					}
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private onSavedInstance(inst: MedicalTreatment) {
		this.medicalTreatments = (this.medicalTreatments || [])
			.filter(({ id }) => id)
			.map(treatment => {
				if (treatment.id === inst.id) {
					return inst;
				}
				return treatment;
			});
		this.treatmentAddedEmitter.emit(this.medicalTreatments);
	}

	isEditMode(): boolean {
		return !this.readonlyMode;
	}

	//#region Treatment Table Events
	deleteRow({ alsoEvent, instance, localRowIndex }: DeleteTreatmentEvent) {
		if ((this.currentEventDate || !instance?.id) && localRowIndex) {
			this.medicalTreatments = this.medicalTreatments.filter((_, i) => i !== localRowIndex);
			return;
		}
		const row: MedicalTreatment = instance;
		let $obs: Array<Observable<any>> = [of(true)];
		let selectedTrToDelete: MedicalTreatment = row;
		if (alsoEvent && selectedTrToDelete.eventId) {
			$obs = [...$obs, this.injuryService.deleteEvent(selectedTrToDelete.eventId)];
		}
		if (selectedTrToDelete._attachment) {
			$obs = [
				...$obs,
				this.azureStorageApi.removeFile(this.auth.getCurrentUserData().clubId, selectedTrToDelete._attachment.url)
			];
		}
		forkJoin($obs)
			.pipe(
				exhaustMap(() => this.medicalTreatmentApi.deleteById(selectedTrToDelete.id)),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => {
					this.medicalTreatments = this.medicalTreatments.filter(({ id }) => id !== selectedTrToDelete.id);
					selectedTrToDelete = null;
					this.treatmentDeletedEmitter.emit(this.medicalTreatments);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	discardRow({ instance, index }: SaveTreatmentEvent) {
		if (!instance?.id) {
			this.deleteRow({ alsoEvent: false, instance, localRowIndex: index });
		} else {
			this.medicalTreatments = this.medicalTreatments.map(treatment => {
				if (treatment.id === instance.id) {
					return this.tempTreatment;
				}
				return treatment;
			});
		}
	}

	async confirmSaveRow({ instance, attachedFile }: SaveTreatmentEvent) {
		const hasChanged = this.hasChanges(instance, attachedFile);
		if (!hasChanged) {
			this.discardRow({ instance, attachedFile });
			return;
		}
		instance = completeWithMissingFields(instance);
		if (hasMissingRequiredFields(instance, this.notificationService)) return;
		if (!instance.id || !instance.eventId) {
			await this.doSave(instance, false, attachedFile);
		} else {
			this.medicalTreatmentApi
				.canBeDetachedFromEvent(instance.id, instance.eventId, moment(instance.date).format())
				.pipe(first(), untilDestroyed(this))
				.subscribe({
					next: async (hasRequisites: boolean) => {
						// set eventId as undefined, so it will be created a new event
						const toSave = hasRequisites ? { ...instance, eventId: null } : instance;
						await this.doSave(toSave, hasRequisites, attachedFile);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	private async doSave(toSave: MedicalTreatment, detachFromEvent: boolean, attachedFile: File) {
		const confirmationMessage = detachFromEvent
			? 'confirm.changeDateOfTreatmentOfSameEvent'
			: this.tempTreatment && toSave.complete !== this.tempTreatment.complete
				? 'confirm.edit'
				: undefined;
		if (confirmationMessage) {
			this.confirmation.confirm({
				message: this.translate.instant(confirmationMessage),
				header: 'Iterpro',
				accept: async () => {
					await this.save(toSave, attachedFile);
				}
			});
		} else {
			await this.save(toSave, attachedFile);
		}
	}

	private async getAttachment(instance: MedicalTreatment, attachedFile: File): Promise<Attachment> {
		try {
			const uploadResult = await this.azureUploadService.uploadBrowserFileToAzureStore(attachedFile);
			return getAttachmentToUpload(
				uploadResult,
				uploadResult,
				attachedFile.name,
				this.auth.getCurrentUserData().id,
				instance.date
			);
		} catch (error) {
			this.error.handleError(error);
			return null;
		}
	}

	private async save(instance: MedicalTreatment, attachedFile?: File) {
		if (attachedFile) {
			instance._attachment = await this.getAttachment(instance, attachedFile);
		}
		instance.date = moment(instance.date).toDate();
		this.medicalTreatmentApi
			.patchOrCreate(instance)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: MedicalTreatment) => {
					if (result) {
						if (!instance.id) {
							this.medicalTreatments = sortByDateDesc([result, ...this.medicalTreatments], 'date');
						}
						if (result?.eventId) this.updateEvent(result);
						else this.createEventAndUpdateInstance(result);
						this.notificationService.notify('success', 'medical.prevention.treatment', 'alert.allRecordsSaved');
					}
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	applyToPlayers({ instance: treatment, playerIds }: ApplyToPlayersEvent) {
		const copy: MedicalTreatment = cloneDeep(treatment);
		delete copy.id;
		const obs$ = playerIds.map(playerId =>
			this.medicalTreatmentApi.create({ ...copy, playerId: playerId, injuryId: null }).pipe(
				switchMap((treatment: MedicalTreatment) => {
					const player = this.players.find(({ id }) => id === playerId);
					return this.injuryService.createEventAndUpdateInstance(treatment, null, 'treatment', false, player);
				})
			)
		);
		forkJoin(obs$)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (treatments: MedicalTreatment[]) => {
					const result = {};
					playerIds.forEach((id, i) => (result[id] = treatments[i]));
					this.applyToPlayersEmitter.emit(result);
				},
				error: error => this.error.handleError(error),
				complete: () => (this.playersApplyTo = [])
			});
	}

	//endregion

	//#region Multiple Treatments Dialog

	openMultiTreatmentsDialog() {
		this.multipleTreatmentsDialog.visible = true;
	}

	discardMultipleTreatments() {
		this.multipleTreatmentsDialog = {
			visible: false,
			rows: [],
			isLoading: false
		};
	}

	private treatmentTypeToMedicalTreatment(treatment: TreatmentType): MedicalTreatment {
		// @ts-ignore
		return {
			_attachment: treatment?._attachment || null,
			author: treatment?.author || null,
			category: treatment?.category || null,
			complete: treatment?.complete || null,
			date: treatment?.date || null,
			description: treatment?.description || null,
			drug: treatment?.drug || null,
			drugDose: treatment?.drugDose || null,
			eventId: treatment?.eventId || null,
			id: treatment?.id || null,
			injuryId: treatment?.injuryId || null,
			injuryType: treatment?.injuryType || null,
			location: treatment?.location || null,
			notes: treatment?.notes || null,
			playerId: treatment?.playerId || null,
			prescriptor: treatment?.prescriptor || null,
			treatment: treatment?.treatment || null,
			treatmentType: treatment?.treatmentType || null
		};
	}
	hasSomeRowsChanged(): boolean {
		const rows = JSON.stringify(
			this.treatmentTableEl.filteredRows.map(item => this.treatmentTypeToMedicalTreatment(item))
		);
		const backupRows = JSON.stringify(
			this.treatmentTableEl.backupRows.map(item => this.treatmentTypeToMedicalTreatment(item))
		);
		return rows !== backupRows;
	}

	getTreatmentIdsToDelete(): string[] {
		const tempTreatmentsIds: string[] = (this.treatmentTableEl.backupRows || []).map(({ id }) => id);
		const currentEventTreatmentsIds: string[] = this.treatmentTableEl.filteredRows
			.filter(({ id }) => id)
			.map(({ id }) => id);
		return tempTreatmentsIds.filter(id => !currentEventTreatmentsIds.includes(id));
	}

	async getMultiplePreparedData(single = false): Promise<MedicalTreatment[]> {
		return new Promise(async (resolve, reject) => {
			try {
				const data: MedicalTreatment[] = [];
				const rows: TreatmentType[] = single
					? this.treatmentTableEl.filteredRows
					: this.multipleTreatmentTableEl.filteredRows;
				for (let row of rows) {
					row = {
						...completeWithMissingFields(row),
						_attachment: row?.attachedFile ? await this.getAttachment(row, row.attachedFile) : null
					};
					delete row?.attachedFile;
					data.push(row);
				}
				const someHasMissingFields = data.some((row: MedicalTreatment) =>
					hasMissingRequiredFields(row, this.notificationService)
				);
				if (someHasMissingFields) return resolve(undefined);
				return resolve(data);
			} catch (error) {
				reject(error);
			}
		});
	}

	async saveMultipleTreatments() {
		const result = await this.getMultiplePreparedData();
		if (result) {
			this.createManyMedicalTreatments(result);
		}
	}

	private createManyMedicalTreatments(rows: Partial<MedicalTreatment>[]) {
		this.discardMultipleTreatments();
		const groupedByDateRows = groupBy(rows, 'date');
		const treatmentsToCreate$: Observable<Partial<MedicalTreatment>[]>[] = [];
		for (const treatmentGroup of Object.values(groupedByDateRows)) {
			const isMultipleTreatments = treatmentGroup.length > 1;
			const treatments$: Observable<Partial<MedicalTreatment>[]> = this.injuryService
				.createMultipleMedicalTreatmentEvent(
					treatmentGroup[0] as MedicalTreatment,
					isMultipleTreatments,
					this.player,
					undefined
				)
				.pipe(
					first(),
					switchMap(({ result }) => {
						const data: Partial<MedicalTreatment>[] = treatmentGroup.map(treatment => ({
							...treatment,
							eventId: result.id,
							id: undefined
						}));
						return of(data);
					})
				);
			treatmentsToCreate$.push(treatments$);
		}
		forkJoin(...treatmentsToCreate$)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: (treatments: MedicalTreatment[][]) => {
					this.medicalTreatmentApi
						.createMany(flatten(treatments))
						.pipe(take(1))
						.subscribe({
							next: (result: MedicalTreatment[]) => {
								this.medicalTreatments = sortByDateDesc([...this.medicalTreatments, ...result], 'date');
								this.notificationService.notify('success', 'medical.prevention.treatment', 'alert.allRecordsSaved');
							}
						});
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	//endregion

	//#region Redirects
	redirectToPlayerMedicalRecords(playerId: string) {
		const url = '/medical/maintenance';
		const params = {
			id: playerId,
			tabIndex: 3
		};
		return [url, params];
	}
	//#endregion

	parseTooltip(string: string): string {
		return parseHtmlStringToText(string);
	}
}
