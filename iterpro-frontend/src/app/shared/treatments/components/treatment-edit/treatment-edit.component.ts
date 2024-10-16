import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AtcItem, Injury, Team, TreatmentMetric, TreatmentMetricType } from '@iterpro/shared/data-access/sdk';
import { AlertService, TINY_EDITOR_OPTIONS, convertToString, sortByName } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, uniq } from 'lodash';
import * as moment from 'moment/moment';
import { SelectItem } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { filter } from 'rxjs/operators';
import { TreatmentType } from '../../interfaces/treatment-table.interface';
import { getTime } from '../../utils/treatment-table-utils';
import * as TrtUtilsService from './../../utils/treatment-table-utils';

@UntilDestroy()
@Component({
	selector: 'iterpro-treatment-edit',
	templateUrl: './treatment-edit.component.html',
	styleUrls: ['./treatment-edit.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreatmentEditComponent {
	//#region Input
	treatment: TreatmentType;
	treatmentForm: FormGroup;
	userId: string;
	playerId: string;
	injury: Injury;

	secMetrics: TreatmentMetric[];
	physiotherapyMetrics: TreatmentMetric[];
	injuryOptions: SelectItem[] = [];
	locationOptions: SelectItem[] = [];
	injuryTypeOptions: SelectItem[] = [];
	physioCategoriesOptionsBackup: SelectItem[] = [];
	physioCategoriesOptions: SelectItem[] = [];
	physioTreatmentsOptions: TreatmentMetric[] = [];
	physioTreatmentsOptionsBackup: TreatmentMetric[] = [];
	secTreatmentsOptions: SelectItem[] = [];
	treatmentTypesOptions: SelectItem[] = [];
	pinnedTreatments: string[] = [];
	admMappings: Map<string, string> = new Map<string, string>();
	currentTeam: Team;
	customerOptions: SelectItem[];
	currentEventDate: Date;
	//endregion

	//region Dialogs
	medicalSuppDialog = {
		visible: false,
		model: undefined
	};
	customTreatmentDialog: { visible: boolean; treatments: TreatmentMetric[] } = {
		visible: false,
		treatments: null
	};
	//endregion
	isLoading: boolean;
	saveClicked: boolean;
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;
	constructor(
		private readonly fb: FormBuilder,
		private readonly config: DynamicDialogConfig,
		private readonly translate: TranslateService,
		private readonly dialogRef: DynamicDialogRef,
		private readonly notificationService: AlertService
	) {
		this.isLoading = true;
		this.loadInputData();
	}

	private loadInputData() {
		this.treatment = this.config.data.treatment as TreatmentType;
		this.playerId = this.config.data?.playerId;
		this.injury = this.config.data?.injury;
		this.userId = this.config.data?.userId;
		this.secMetrics = this.config.data?.secMetrics;
		this.physiotherapyMetrics = this.config.data?.physiotherapyMetrics;
		this.injuryOptions = this.config.data?.injuryOptions;
		this.locationOptions = this.config.data?.locationOptions;
		this.injuryTypeOptions = this.config.data?.injuryTypeOptions;
		this.physioCategoriesOptions = this.config.data?.physioCategoriesOptions;
		this.physioCategoriesOptionsBackup = cloneDeep(this.physioCategoriesOptions);
		this.physioTreatmentsOptions = this.config.data?.physioTreatmentsOptions;
		this.physioTreatmentsOptionsBackup = cloneDeep(this.physioTreatmentsOptions);
		this.secTreatmentsOptions = this.config.data?.secTreatmentsOptions;
		this.treatmentTypesOptions = this.config.data?.treatmentTypesOptions;
		this.pinnedTreatments = this.config.data?.pinnedTreatments;
		this.admMappings = this.config.data?.admMappings;
		this.customerOptions = this.config.data?.customerOptions;
		this.currentTeam = this.config.data?.currentTeam;
		this.currentEventDate = this.config.data?.currentEventDate;
		this.createForm();
	}

	//#region Form Methods
	private createForm(): void {
		const date = this.currentEventDate ? this.currentEventDate : this.treatment?.date || new Date();
		const formattedTime = getTime(date);
		this.treatmentForm = this.fb.group({
			date: [{ value: date, disabled: !!this.currentEventDate }, Validators.required],
			time: [{ value: formattedTime, disabled: !!this.currentEventDate }, Validators.required],
			treatmentType: [null, Validators.required],
			category: [null],
			treatment: [null],
			description: [null],
			drug: [null],
			drugDose: [null],
			complete: [{ value: false, disabled: this.isFuture(date) }],
			prescriptor: [this.userId],
			location: [],
			author: [null],
			injuryType: [null],
			notes: [null],
			injuryId: [{ value: this.injury?.id, disabled: !!this.injury?.id }],
			attachedFile: [null],
			_attachment: [null],
			lastUpdateDate: [new Date()],
			lastUpdateAuthorId: [this.userId]
		});
		if (this.treatment) this.initFormValues();
		this.listenToFormChanges();
		this.isLoading = false;
	}

	private listenToFormChanges(): void {
		this.onDateChange();
		this.onTimeChange();
		this.onTreatmentTypeChange();
		this.onPhysioCategoryChange();
		this.onPhysioTreatmentChange();
	}

	private initFormValues(): void {
		this.treatmentForm.patchValue(this.treatment);
	}
	reset(): void {
		this.treatmentForm.reset();
	}
	discard(): void {
		this.dialogRef.close();
	}

	save(): void {
		this.saveClicked = true;
		if (!this.isFormValid()) return this.notificationService.notify('warn', 'medical.prevention.treatment', 'alert.formNotValid', false);
		const treatment: TreatmentType = this.fromFormGroup();
		this.dialogRef.close({ treatment: treatment, pinnedTreatments: this.pinnedTreatments });
	}

	private isFormValid(): boolean {
		return this.treatmentForm && !this.treatmentForm.invalid;
	}

	private fromFormGroup(): TreatmentType {
		const jsonPayload = this.treatmentForm.getRawValue();
		delete jsonPayload?.time;
		return Object.assign(jsonPayload, {
			id: this.treatment?.id,
			eventId: this.treatment?.eventId,
			lastUpdateDate: new Date(),
			lastUpdateAuthorId: this.userId,
			author: this.treatmentForm.getRawValue()?.author,
			playerId: this.playerId
		});
	}

	//#endregion

	//#region Pinned Treatments
	savePinnedTreatments(event, treatmentCode: string) {
		event.stopPropagation();
		if (this.pinnedTreatments && treatmentCode) {
			if (this.pinnedTreatments.includes(treatmentCode)) {
				this.pinnedTreatments = this.pinnedTreatments.filter(code => code !== treatmentCode);
			} else {
				this.pinnedTreatments.push(treatmentCode);
			}
		}
		this.pinnedTreatments = uniq((this.pinnedTreatments || []).filter(code => code !== null && typeof code === 'string'));
	}

	//#endregion

	//#region FileUpload
	selectFile(file: File) {
		this.treatmentForm.get('attachedFile')?.setValue(file);
	}

	attachmentError(error: string) {
		this.notificationService.notify('error', 'medical.prevention.treatment', error, false);
	}

	attachmentDeletedDone() {
		this.treatmentForm.get('_attachment')?.setValue(null);
	}
	//endregion

	//#region ListenFormChanges
	private onPhysioCategoryChange(): void {
		this.treatmentForm
			.get('category')
			.valueChanges.pipe(
				untilDestroyed(this),
				filter(category => !!category)
			)
			.subscribe({
				next: (value: string[]) => {
					if (this.treatmentForm.get('treatmentType')?.value === 'physiotherapy') {
						this.physioTreatmentsOptions = this.getPhysioTreatmentsOptions(value);
					}
				}
			});
	}

	private onDateChange(): void {
		this.treatmentForm
			.get('date')
			.valueChanges.pipe(
				untilDestroyed(this),
				filter(date => !!date)
			)
			.subscribe({
				next: (date: Date) => {
					if (this.isFuture(date)) {
						this.treatmentForm.get('complete')?.setValue(false);
						this.treatmentForm.get('complete')?.disable();
					} else {
						this.treatmentForm.get('complete')?.enable();
					}
					const time = this.treatmentForm.get('time')?.value;
					const updatedDate = moment(date)
						.set({
							hour: Number(time.split(':')[0]),
							minute: Number(time.split(':')[1])
						})
						.toDate();
					this.treatmentForm.get('date')?.setValue(updatedDate, { emitEvent: false });
				}
			});
	}

	private onTimeChange(): void {
		this.treatmentForm
			.get('time')
			.valueChanges.pipe(
				untilDestroyed(this),
				filter(time => typeof time === 'string' && !!time) // Check if time is a string before splitting
			)
			.subscribe({
				next: (time: string) => {
					const dateControl = this.treatmentForm.get('date');
					const date = moment(dateControl.value)
						.set({
							hour: Number(time.split(':')[0]),
							minute: Number(time.split(':')[1])
						})
						.toDate();
					this.treatmentForm.get('date')?.setValue(date);
				}
			});
	}

	private onTreatmentTypeChange(): void {
		this.treatmentForm
			.get('treatmentType')
			.valueChanges.pipe(
				untilDestroyed(this),
				filter(treatmentType => !!treatmentType)
			)
			.subscribe({
				next: (value: 'physiotherapy' | 'medicationSupplements' | 'SeC') => {
					if (value === 'physiotherapy') {
						this.physioTreatmentsOptions = cloneDeep(this.physioTreatmentsOptionsBackup);
					}
					if (value === 'physiotherapy' || value === 'SeC') {
						this.treatmentForm.get('category')?.setValidators([Validators.required]);
						this.treatmentForm.get('treatment')?.setValidators([Validators.required]);
					} else {
						this.treatmentForm.get('category')?.clearValidators();
						this.treatmentForm.get('treatment')?.clearValidators();
						this.treatmentForm.get('category')?.updateValueAndValidity();
						this.treatmentForm.get('treatment')?.updateValueAndValidity();
					}
				}
			});
	}

	private onPhysioTreatmentChange(): void {
		this.treatmentForm
			.get('treatment')
			.valueChanges.pipe(
				untilDestroyed(this),
				filter(treatmentType => !!treatmentType)
			)
			.subscribe({
				next: (value: string[]) => {
					if (this.treatmentForm.get('treatmentType')?.value === 'physiotherapy') {
						const currentCategories: string[] = this.treatmentForm.get('category')?.value || [];
						const categories: string[] = uniq(
							this.physioTreatmentsOptions
								.filter(option => !currentCategories.includes(option.value) && (value as string[]).includes(option.value))
								.map(({ category }) => category)
						);
						if (!this.allElementsAlreadyPresent(categories, currentCategories)) {
							const treatments = this.physioCategoriesOptions.filter(({ value }) => categories.includes(value)).map(({ value }) => value);
							this.treatmentForm.get('category')?.setValue(treatments);
						}
					}
				}
			});
	}

	private allElementsAlreadyPresent(array1: string[], array2: string[]): boolean {
		return array1.every(element => array2.includes(element));
	}

	private getPhysioTreatmentsOptions(categories: string[] = []): TreatmentMetric[] {
		if (!categories || categories.length === 0) {
			return TrtUtilsService.sortByPinned(this.physioTreatmentsOptionsBackup, this.pinnedTreatments);
		}
		let descriptionArray: TreatmentMetric[] = [];
		(categories || []).forEach((eventCategory: string) => {
			descriptionArray = descriptionArray.concat(
				this.physiotherapyMetrics
					.filter(({ category }) => category === eventCategory)
					.map(treatmentMetric => ({
						...treatmentMetric,
						label: !treatmentMetric.custom ? this.translate.instant(treatmentMetric.label) : treatmentMetric.label
					}))
			);
		});
		descriptionArray = sortByName(descriptionArray, 'label');

		/**
		 * Treatments option are filtered by category
		 * So we need to filter current selected treatment according to that
		 * */
		const currentTreatmentsValues: string[] = this.treatmentForm.get('treatment')?.value || [];
		if (currentTreatmentsValues.length > 0) {
			const filteredTreatments: string[] = currentTreatmentsValues.filter(t => descriptionArray.map(({ value }) => value).includes(t));
			this.treatmentForm.patchValue({
				treatment: filteredTreatments
			});
		}

		return TrtUtilsService.sortByPinned(descriptionArray, this.pinnedTreatments);
	}

	//endregion

	//#region Utils
	private isFuture(treatmentDate: Date): boolean {
		return moment(treatmentDate).isAfter(moment());
	}

	private getPlayerTreatmentMetrics(type: TreatmentMetricType): TreatmentMetric[] {
		return (type === 'physiotherapy' ? this.physiotherapyMetrics : this.secMetrics) || [];
	}
	//endregion

	//#region MedicalSupplementDialog
	showMedSuppDialog() {
		this.medicalSuppDialog = {
			model: this.treatmentForm.getRawValue(),
			visible: true
		};
	}

	onSaveMedSuppDialog(event: AtcItem) {
		this.medicalSuppDialog.visible = false;
		this.treatmentForm.get('drug')?.setValue(event.name);
		const drugDose = convertToString(event.DDD) + convertToString(event.Unit) + ' ' + convertToString(this.admMappings.get(event.AdmR));
		this.treatmentForm.get('drugDose')?.setValue(drugDose);
	}

	onDiscardMedSuppDialog() {
		this.medicalSuppDialog.visible = false;
	}

	onSaveMedicationPin({ event, treatmentCode }): void {
		this.savePinnedTreatments(event, treatmentCode);
	}
	//endregion

	//#region Custom Treatment Dialog
	hasCustomTreatments(): boolean {
		const treatmentNames: string[] =
			this.treatmentForm.get('treatmentType')?.value === 'physiotherapy'
				? this.treatmentForm.get('description')?.value
				: this.treatmentForm.get('treatment')?.value;
		const metrics: TreatmentMetric[] = this.getPlayerTreatmentMetrics(this.treatmentForm.get('treatmentType')?.value);
		return treatmentNames?.length > 0 && metrics.some(({ custom, value }) => custom && treatmentNames.indexOf(value) > -1);
	}

	openCustomTreatmentDialog() {
		const treatmentNames: string[] = this.treatmentForm.get('treatment')?.value;
		const metrics: TreatmentMetric[] = this.getPlayerTreatmentMetrics(this.treatmentForm.get('treatmentType')?.value);
		this.customTreatmentDialog = {
			visible: true,
			treatments: metrics.filter(({ custom, value }) => custom && treatmentNames.indexOf(value) > -1)
		};
	}

	closeCustomTreatmentDialog() {
		this.customTreatmentDialog = {
			visible: false,
			treatments: []
		};
	}
	//endregion
}
