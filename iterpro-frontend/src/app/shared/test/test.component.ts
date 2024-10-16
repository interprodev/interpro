import { CommonModule } from '@angular/common';
import {
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Output,
	SimpleChanges,
	ViewChild
} from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Attachment,
	AzureStorageApi,
	Customer,
	EventApi,
	LoopBackAuth,
	Player,
	PlayerApi,
	ResultWithQueueMessage,
	Team,
	TeamApi,
	Test,
	TestApi,
	TestInstance,
	TestInstanceApi,
	TestResult
} from '@iterpro/shared/data-access/sdk';
import { CloudUploadComponent, FileUploaderComponent } from '@iterpro/shared/feature-components';
import { MarkedPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	AzureStorageService,
	CalendarService,
	EditModeService,
	ErrorService,
	TINY_EDITOR_OPTIONS,
	getEntireTestThreshold,
	getInvalidationThresholds,
	getMomentFormatFromStorage,
	getThresholdActiveValue,
	getThresholdTooltip,
	getThresholdsInterval,
	handleQueuePlayerRecalculationAlerts,
	isNotArchived,
	isNotEmpty,
	sanitizeExpression,
	sortByDate,
	sortByName,
	AzureStoragePipe
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { difference, sortBy } from 'lodash';
import { evaluate } from 'mathjs';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable, Observer, forkJoin, of } from 'rxjs';
import { exhaustMap, first, map, switchMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { IconModalPreviewComponent, TimepickerComponent } from '@iterpro/shared/ui/components';
import { CardModule } from 'primeng/card';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { InputTextareaModule } from 'primeng/inputtextarea';

interface CustomField {
	value: string;
	type: 'number' | 'text';
}

@UntilDestroy()
@Component({
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		PrimeNgModule,
		TranslateModule,
		CloudUploadComponent,
		FileUploaderComponent,
		MarkedPipe,
		IconModalPreviewComponent,
		AzureStoragePipe,
		CardModule,
		EditorComponent,
		InputTextareaModule,
		TimepickerComponent
	],
	selector: 'iterpro-test',
	templateUrl: './test.component.html',
	styleUrls: ['test.component.css']
})
export class TestComponent implements OnInit, OnChanges, OnDestroy {
	@Input() test: Test;
	@Input() newGeneric: boolean;
	@Output() updateEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() destroyEvent: EventEmitter<any> = new EventEmitter<any>();
	@Output() discardAdd: EventEmitter<any> = new EventEmitter<any>();
	@Output() csvUploadEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() tabIndexEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Input() medical: boolean;
	@Input() instanceId: string;

	notValid: boolean;
	newPlayers: Player[];
	temp: any;
	isNewInstance: boolean;
	today: Date;
	date: Date;
	selectedAttachment: any;
	tempAttachment: any;

	@ViewChild('inputjson', { static: false }) myInput: ElementRef;
	fileReader: FileReader;

	genericForm: FormGroup;
	purposeList: SelectItem[];
	selectedPurposes: string[];
	downloadUrl: string;
	indexTab = 0;
	editInstance = false;
	addInstanceTrigger = false;
	instancesOptions: SelectItem[] = [];
	testResultMap: any;
	instance: TestInstance;
	dateInstance: Date;
	yearRange: string;
	currentTeamId: string;
	currentUser: Customer;
	confirmDeleteFlag = false;
	currentClubId = null;

	addCustomFieldDialogVisibility = false;
	editPlayerNameField = false;
	oldCustomValues: { fields: CustomField[]; name: string } = { fields: [], name: '' };
	testAttachments: Attachment[];
	tooltipTextForThresholdTest: any;
	activePlayers: Player[] = [];
	allPlayers: Player[] = [];
	types: SelectItem[] = [
		{ label: 'number', value: 'number' },
		{ label: 'text', value: 'text' }
	];
	protected readonly tinyEditorInit = TINY_EDITOR_OPTIONS;

	language = 'en-GB';

	constructor(
		private auth: LoopBackAuth,
		public editService: EditModeService,
		private error: ErrorService,
		private teamApi: TeamApi,
		private authService: LoopBackAuth,
		private testApi: TestApi,
		private instanceApi: TestInstanceApi,
		private notificationService: AlertService,
		private confirmationService: ConfirmationService,
		private translate: TranslateService,
		private azureStorageApi: AzureStorageApi,
		private currentTeamService: CurrentTeamService,
		private eventApi: EventApi,
		private calendar: CalendarService,
		private playerApi: PlayerApi,
		private azureStorageService: AzureStorageService
	) {
		this.getType = this.getType.bind(this);
		this.recalculateFields = this.recalculateFields.bind(this);
		this.isFormulaField = this.isFormulaField.bind(this);
		this.isGoScoreInherent = this.isGoScoreInherent.bind(this);
		this.getTooltipForTestColumn = this.getTooltipForTestColumn.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.sizeError = this.sizeError.bind(this);
		this.currentUser = this.authService.getCurrentUserData();
		this.currentTeamId = this.currentUser.currentTeamId;
		this.currentClubId = this.currentUser.clubId;
		this.getPurpose();
		this.createForm();
	}

	@HostListener('window:beforeunload')
	canDeactivate() {
		if (this.editService.editMode === false || this.editInstance === false) {
			return true;
		}

		return new Observable((observer: Observer<boolean>) => {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.editGuard'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.editService.editMode = false;
					this.editInstance = false;
					observer.next(true);
					observer.complete();
				},
				reject: () => {
					observer.next(false);
					observer.complete();
				}
			});
		});
	}

	triggerAddInstance() {
		this.addInstanceTrigger = !this.addInstanceTrigger;
		this.editService.editMode = this.addInstanceTrigger;
	}

	ngOnInit() {
		this.today = new Date();
		this.dateInstance = this.today;
		this.types = this.types.map(({ label, value }) => ({ value, label: this.translate.instant(label) }));
		this.language = this.translate.currentLang === 'it-IT' ? 'it-IT' : this.translate.currentLang.split('-')[0];
		if (this.test) {
			this.checkTestFields();
			if (this.test && this.test.userFields) {
				const linesFormArray = this.genericForm.get('userFields') as FormArray;
				this.test.userFields.forEach(() => {
					linesFormArray.push(this.userFieldFormGroup());
				});
			}
			this.genericForm.patchValue({
				playerNameField: this.test.playerNameField,
				userFields: this.test.customFields
			});
		}
	}

	ngOnDestroy() {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['newGeneric'] && changes['newGeneric'].currentValue === true) {
			this.testAttachments = [];
			this.genericForm.reset(this.test);
			this.onEdit();
			this.indexTab = 0;
		}
		if (changes['test'] && this.newGeneric === false) {
			this.checkTestFields();
			this.getTestAttachments()
				.pipe(first())
				.subscribe({
					next: (attachments: Attachment[]) => (this.testAttachments = attachments),
					error: (error: Error) => this.error.handleError(error)
				});
			this.instance = null;
			if (!this.test.instances) {
				this.test.instances = [];
			} else {
				this.test.instances = sortByDate(this.test.instances, 'date').reverse();
				this.instancesOptions = this.test.instances.map(instance => ({
					label: moment(instance.date).format(getMomentFormatFromStorage()),
					value: instance
				}));
				if (this.instancesOptions.length > 0) this.instance = this.instancesOptions[0].value;
				if (this.instanceId) {
					this.instance = this.instancesOptions.find(x => x.value.id === this.instanceId).value;
					this.indexTab = 1;
				}
				this.handleInstanceSelect({ value: this.instance });
			}
			this.editService.editMode = false;
			this.genericForm.disable();
			this.genericForm.reset(this.test);
		}
	}

	editTestInstance() {
		this.editService.editMode = true;
		this.editInstance = true;
		this.temp = !this.testResultMap ? {} : JSON.parse(JSON.stringify(this.testResultMap));
	}

	getCustomFieldsValues() {
		return this.test.customFields ? this.getFieldsValues(this.test.customFields) : [];
	}

	uploadError(message: string) {
		this.notificationService.notify('error', 'sidebar.tests', message, false);
	}

	updateAttachmentList(attachments: Attachment[]) {
		this.testAttachments = attachments;
	}

	deleteAttachmentAt(index: number) {
		const attachments = [...this.testAttachments];
		attachments.splice(index, 1);
		this.updateAttachmentList(attachments);
	}

	reorderAttachmentList(attachments: Attachment[]) {
		this.testAttachments = attachments;
		if (!this.newGeneric) {
			this.testApi.patchAttributes(this.test.id, { _attachments: attachments }).pipe(first()).subscribe();
		}
	}

	hasNoCustomFields() {
		return !this.test.customFields || this.test.customFields.length === 0;
	}

	updateLastEditedDate() {
		this.instance.lastUpdateAuthor = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
		this.instance.lastUpdateDate = moment().toDate();
	}

	setTabIndex(e) {
		this.indexTab = e.index ? e.index : 0;
		this.tabIndexEmitter.emit(this.indexTab);
	}

	private createForm() {
		this.genericForm = new FormGroup({
			name: new FormControl('', [Validators.required]),
			medical: new FormControl(this.medical, [Validators.required]),
			purpose: new FormControl('', [Validators.required]),
			equipment: new FormControl(''),
			protocol: new FormControl(''),
			userFields: new FormArray([]),
			playerNameField: new FormControl('', [Validators.required])
		});
		this.genericForm.disable();
	}

	onEdit() {
		this.editService.editMode = true;
		if (!this.isPresetTest()) {
			this.genericForm.enable();
		}
	}

	onDiscard() {
		this.editService.editMode = false;
		this.newGeneric = false;
		this.genericForm.disable();
		this.genericForm.reset(this.test);
		this.test.userFields = [...this.oldCustomValues.fields];
		this.test.playerNameField = this.oldCustomValues.name;
		this.discardAdd.emit();
	}

	onSubmit() {
		if (this.genericForm.invalid) {
			this.notificationService.notify('error', 'sidebar.tests', 'alert.missingFields', false);
		} else {
			this.confirmEdit();
		}
	}

	addCustomField() {
		const userFields = this.genericForm.get('userFields') as FormArray;
		userFields.push(this.userFieldFormGroup());
	}

	deleteCustomFieldAt(index: number) {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.deleteColumn'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				const fields = this.genericForm.get('userFields') as FormArray;
				fields.removeAt(index);
			}
		});
	}

	private userFieldFormGroup() {
		return new FormGroup({
			value: new FormControl('', [Validators.required]),
			type: new FormControl('number', [Validators.required])
		});
	}

	private saveTest() {
		// this.checkGoScoreUpdate();
		if (this.isPresetTest()) {
			this.savePresetTest();
		} else {
			this.saveCustomTest();
		}
	}

	private savePresetTest() {
		if (this.testAttachments.length > 0) {
			this.testAttachments.forEach(attachment => {
				attachment.externalUrl = this.test.id;
			});

			this.teamApi
				.patchAttributes(this.currentTeamId, {
					_presetTestAttachments: this.testAttachments
				})
				.pipe(first())
				.subscribe(() => {
					this.exitEditMode(this.test);
				});
		} else {
			this.exitEditMode(this.test);
		}
	}

	private exitEditMode(test: Test = null) {
		this.newGeneric = false;
		this.editService.editMode = false;
		this.editInstance = false;
		this.updateEmitter.emit(test);
	}

	private saveCustomTest() {
		const testToSave = this.prepareSaveTest();

		const obs: Observable<any> = this.newGeneric
			? this.teamApi.createTests(this.currentTeamId, testToSave)
			: this.testApi.updateAttributes(this.test.id, testToSave);

		obs.pipe(first()).subscribe(
			(result: Test) => {
				if (!this.newGeneric) {
					const oldTestName = this.test.name;
					const oldValues = this.oldCustomValues.fields.map(oldField => (typeof oldField === 'string' ? oldField : oldField.value));
					// here update thresholds
					this.updateThresholds(testToSave, oldTestName, oldValues)
						.pipe(first())
						.subscribe(
							([instances, team, players]: any) => {
								if (team) {
									let teamToUpdate = this.currentTeamService.getCurrentTeam();
									const teamSeasons = teamToUpdate && teamToUpdate.teamSeasons ? teamToUpdate.teamSeasons : null;
									teamToUpdate = { ...teamToUpdate, ...team };
									this.currentTeamService.setCurrentTeam({ ...teamToUpdate, teamSeasons });
								}
								if (players) {
									const noun = players.length !== 1 ? 'players' : 'general.player';
									this.notificationService.notify(
										'success',
										'sidebar.tests',
										'alert.thresholdsUpdatedGroup',
										false,
										players.length + ' ' + this.translate.instant(noun)
									);
								}
								this.test = { ...testToSave, instances };
								this.exitEditMode(this.test);
							},
							(error: Error) => this.error.handleError(error)
						);
				} else {
					this.test = testToSave;
					this.exitEditMode(result);
				}
			},
			(error: Error) => this.error.handleError(error)
		);
	}

	private prepareSaveTest() {
		const model = this.genericForm.value;

		const testToSave: Test = new Test({
			...this.test,
			name: model.name as string,
			purpose: model.purpose as string[],
			category: model.category as string,
			equipment: model.equipment as string,
			protocol: model.protocol as string,
			medical: model.medical as boolean,
			playerNameField: model.playerNameField,
			customFields: model.userFields,
			userFields: model.userFields,
			_attachments: this.testAttachments
		});

		return testToSave;
	}

	updateTestMetrics(test: Test): Observable<Team> {
		const teamToUpdate = this.currentTeamService.getCurrentTeam();
		const metricsTests = teamToUpdate.metricsTests.filter(({ testId }) => testId !== test.id);
		return this.teamApi.patchAttributes(teamToUpdate.id, { metricsTests });
	}

	deleteTest() {
		if (this.test.id) {
			this.testApi
				.deleteInstances(this.test.id)
				.pipe(
					switchMap(() => this.updateTestMetrics(this.test)), // remove from testMetrics the eventual metrics that are going to be deleted
					map((team: Team) => {
						// update local team with the most updated one
						let teamToUpdate = this.currentTeamService.getCurrentTeam();
						teamToUpdate = { ...teamToUpdate, ...team };
						this.currentTeamService.setCurrentTeam(teamToUpdate);
					}),
					exhaustMap(() => this.testApi.deleteById(this.test.id)),
					untilDestroyed(this)
				)
				.subscribe({
					next: (result: Test) => {
						this.destroyEvent.emit(result);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		} else this.destroyEvent.emit(this.test);
	}

	confirmDelete() {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.deleteTest'),
			header: this.translate.instant('confirm.title'),
			icon: 'fa fa-question-circle',
			accept: () => {
				this.deleteTest();
			}
		});
	}

	private confirmEdit() {
		if (this.test.id) {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.edit'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.saveTest();
				}
			});
		} else {
			this.saveTest();
		}
	}

	private getPurpose() {
		this.purposeList = sortByName(
			[
				{ label: this.translate.instant('test.categories.agility'), value: 'Agility' },
				{ label: this.translate.instant('test.categories.strength'), value: 'Strength' },
				{ label: this.translate.instant('test.categories.speed'), value: 'Speed' },
				{ label: this.translate.instant('test.categories.power'), value: 'Power' },
				{ label: this.translate.instant('test.categories.aerobic'), value: 'Aerobic' },
				{ label: this.translate.instant('test.categories.anaerobic'), value: 'Anaerobic' },
				{ label: this.translate.instant('test.categories.coordination'), value: 'Coordination' },
				{ label: this.translate.instant('test.categories.reaction'), value: 'Reaction' },
				{ label: this.translate.instant('test.categories.sportSpecific'), value: 'Sport Specific' },
				{ label: this.translate.instant('test.categories.balance'), value: 'Balance' },
				{ label: this.translate.instant('test.categories.movement Screening'), value: 'Movement Screening' },
				{ label: this.translate.instant('test.categories.psychology'), value: 'Psychology' },
				{ label: this.translate.instant('test.categories.anthropometry'), value: 'Anthropometry' },
				{ label: this.translate.instant('test.categories.cns'), value: 'CNS' },
				{ label: this.translate.instant('test.categories.ans'), value: 'ANS' },
				{ label: this.translate.instant('test.categories.hydration'), value: 'Hydration' },
				{ label: this.translate.instant('test.categories.haematology'), value: 'Haematology' },
				{ label: this.translate.instant('test.categories.sleep'), value: 'Sleep' },
				{ label: this.translate.instant('test.categories.adrenal'), value: 'Adrenal' },
				{ label: this.translate.instant('test.categories.cardiovascular'), value: 'Cardiovascular' },
				{ label: this.translate.instant('test.categories.metabolic'), value: 'Metabolic' },
				{ label: this.translate.instant('test.categories.mobility'), value: 'Mobility' }
			],
			'value'
		);
	}

	private newTestIstance(dateCreation: Date) {
		this.isNewInstance = true;
		const sameDateInstance: TestInstance = this.test.instances.find(
			({ date }) => moment(date).format(getMomentFormatFromStorage()) === moment(dateCreation).format(getMomentFormatFromStorage())
		);
		if (sameDateInstance) {
			this.notificationService.notify('error', 'sidebar.tests', 'alert.recordAlreadyExists', false);
		} else {
			const date = moment(dateCreation).toDate(); // 'DD/MM/YYYY HH:mm' full date required to update lastUpdateDate
			this.testApi
				.createInstances(this.test.id, { date, teamId: this.currentTeamId })
				.pipe(untilDestroyed(this))
				.subscribe({
					next: (instance: TestInstance) => {
						this.addInstanceTrigger = false;
						this.createEvent(instance);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	private createEvent(instance: TestInstance) {
		this.eventApi
			.saveEvent(
				{
					testInstance: instance,
					teamSeasonId: this.currentTeamService.getCurrentSeason().id,
					testModel: instance.testId,
					teamId: instance.teamId,
					start: this.dateInstance,
					end: moment(this.dateInstance).add(60, 'minutes').toDate(),
					duration: 60,
					allDay: false,
					author: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
					playerIds: instance._testResults
						.filter(({ results }) => results.some(({ rawValue }) => rawValue))
						.map(({ playerId }) => playerId),
					title: `Assessment: ${this.test.name}`,
					type: this.calendar.getGD(instance.date),
					format: 'assessment'
				},
				false
			)
			.pipe(
				exhaustMap((result: ResultWithQueueMessage) => {
					const event = result.result;
					handleQueuePlayerRecalculationAlerts(this.allPlayers, result, this.notificationService);
					return this.instanceApi.patchAttributes(instance.id, { eventId: event.id });
				}),
				untilDestroyed(this)
			)
			.subscribe(
				(updateInstance: TestInstance) => {
					this.notificationService.notify('success', 'sidebar.tests', 'alert.recordCreated', false);
					this.test.instances.push(updateInstance);
					this.fillSelectReports(updateInstance);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	private updateEvent(inst: TestInstance) {
		this.eventApi
			.saveEventAssessment({
				id: inst.eventId,
				playerIds: inst._testResults.filter(({ results }) => results.some(({ rawValue }) => rawValue)).map(({ playerId }) => playerId)
			})
			.pipe(untilDestroyed(this))
			.subscribe(
				(result: ResultWithQueueMessage) => {
					this.notificationService.notify('success', 'sidebar.tests', 'alert.recordUpdated', false);
					this.handleInstanceSelect({ value: inst });
					this.fillSelectReports(inst); // fixed issue #2385 part 2
					handleQueuePlayerRecalculationAlerts(this.allPlayers, result, this.notificationService);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	private fillSelectReports(instance: TestInstance) {
		this.instancesOptions = [];
		this.instance = null;
		this.test.instances = sortByDate(this.test.instances, 'date').reverse();
		this.instancesOptions = this.test.instances.map(inst => ({
			label: moment(inst.date).format(getMomentFormatFromStorage()),
			value: inst
		}));
		if (instance) {
			this.instance = this.test.instances.find(({ id }) => id === instance.id);
		}
		if (!this.instance && this.instancesOptions.length > 0) this.instance = this.instancesOptions[0].value;
		this.handleInstanceSelect({ value: this.instance });
	}

	private prepareCustomFieldInstanceToSave() {
		for (const result of this.instance._testResults) {
			const testResultForPlayer = [];
			const customFields = this.getFieldsValues(
				this.test.userFields && this.test.userFields.length > 0 ? this.test.userFields : this.test.customFields
			);
			const customFieldsType = this.getFieldsType(
				this.test.userFields && this.test.userFields.length > 0 ? this.test.userFields : this.test.customFields
			);
			customFields.forEach((field, index) => {
				if (result && result.player) {
					const value = this.testResultMap[result.player.displayName][field];
					testResultForPlayer.push({
						rawField: field,
						rawValue: customFieldsType[index] === 'number' ? Number(value) : value
					});
				}
			});
			result.results = testResultForPlayer;
		}
	}

	saveTestInstance() {
		if (this.notValid) {
			this.notificationService.notify('error', 'sidebar.tests', 'alert.missingFields', false);
		}
		if (this.instance.lastUpdateDate) {
			this.updateLastEditedDate();
		} else if (!this.instance.lastUpdateDate && moment(this.instance.date).isAfter(moment().toDate())) {
			this.instance.lastUpdateDate = moment().toDate();
		} else {
			this.instance.lastUpdateDate = this.instance.date;
		}

		// TODO Controllare conversione date utc su istanze.
		if ((this.test.customFields && this.test.customFields.length > 0) || (this.test.userFields && this.test.userFields.length > 0)) {
			this.prepareCustomFieldInstanceToSave();
		}

		this.testApi
			.updateByIdInstances(this.test.id, this.instance.id, this.instance)
			.pipe(untilDestroyed(this))
			.subscribe(
				(instance: TestInstance) => {
					this.instance.date = instance.date;
					this.instance.lastUpdateDate = instance.lastUpdateDate;
					this.isNewInstance = false;
					this.editInstance = false;
					this.editService.editMode = false;
					if (instance.eventId) this.updateEvent(instance);
					else this.createEvent(instance);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	onAbortClick() {
		if (this.isNewInstance === true) {
			this.deleteTestInstance();
		} else {
			this.discardTestIstance();
		}
	}

	private discardTestIstance() {
		this.notValid = false;
		this.editService.editMode = false;
		this.editInstance = false;
		this.testResultMap = JSON.parse(JSON.stringify(this.temp));
	}

	deleteTestInstance(alsoEvent?: boolean) {
		this.confirmDeleteFlag = false;
		this.instanceApi
			.deleteTestInstance(this.instance.id)
			.pipe(
				untilDestroyed(this),
				exhaustMap(() => {
					let obs = [of(true)];
					if (alsoEvent && this.instance.eventId) obs = [...obs, this.eventApi.deleteEvent(this.instance.eventId)];
					if (this.instance._attachments && this.instance._attachments.length > 0) {
						for (const att of this.instance._attachments) {
							obs = [...obs, this.azureStorageApi.removeFile(this.currentClubId, att.url)];
						}
					}
					return forkJoin(obs);
				})
			)
			.subscribe(
				() => {
					this.test.instances = this.test.instances.filter(inst => inst.id !== this.instance.id);
					this.notificationService.notify('success', 'sidebar.tests', 'alert.recordDeleted', false);
					const index = this.test.instances.indexOf(this.instance);
					if (index > -1) {
						if (this.test.instances.length === 1) this.test.instances = [];
						else this.test.instances.splice(index, 1);
						this.test.instances = this.test.instances.slice();
					}
					this.fillSelectReports(null);
				},
				(error: Error) => this.error.handleError(error),
				() => {
					this.editService.editMode = false;
					this.editInstance = false;
				}
			);
	}

	// TODO: Important : This function is not used. This functionality is under discussion.
	/*
	 * Purpose: Blocking/disable edit mode after midnight of the day of the record.
	 * --> The edit button will be visible till the midnight of creation date of test records after that it got hidden.
	 */
	// private isEditVisible(e?) {
	// 	/**
	// 	 * If current date/time is before expired time limit(i.e midnight : when the midnight occur then date of test record incremented to 1 day),
	// 	 * then isBefore = true and edit button will be visible otherwise hidden.
	// 	 */
	// 	const isBefore = moment(this.todayCurrentDate).isBefore(
	// 		moment(this.instance.date)
	// 			.add(1, 'day')
	// 			.startOf('day')
	// 	);

	// 	if (isBefore) {
	// 		// Before midnight or before expired time limit, edit button remains visible.
	// 		return true;
	// 	} else {
	// 		// after midnight when time expired for test record editing edit button got hidden.
	// 		return false;
	// 	}
	// }

	handleDateSelect(e?) {
		const dateDay = moment(this.dateInstance).toDate(); // 'DD/MM/YYYY HH:mm' full date required to update lastUpdateDate
		this.newTestIstance(dateDay);
	}

	getColor(rowData, col): string {
		// const objIndex = rowData.results.findIndex(obj => obj.rawField === col);
		const item = (rowData.results || []).find(({ rawField }) => rawField === col);
		return item?.interval || null;
	}

	handleInstanceSelect({ value }: SelectItem) {
		this.tabIndexEmitter.emit(this.indexTab);
		if (value) {
			const date = value.date || moment().toDate();
			this.getDetailedTestInstance(value)
				.pipe(
					untilDestroyed(this),
					switchMap((instance: TestInstance) => {
						this.instanceId = null;
						value = this.updateLocalInstance(value, instance);
						const [playerIds, notPresentIds] = this.getPlayersIds(value, date);
						return forkJoin([this.getPlayers(notPresentIds), of(playerIds)]);
					})
				)
				.subscribe({
					next: ([players, playerIds]) => {
						this.allPlayers.push(...players);
						this.activePlayers = this.allPlayers
							.filter(({ id }) => playerIds.includes(id))
							.filter(player => isNotArchived(player, { date }));

						// define testResultMap
						const fields = this.getTestFields(this.test);
						if (isNotEmpty(fields)) {
							this.temp = {};
							this.testResultMap = {};
							for (const player of this.activePlayers) {
								this.testResultMap[player.displayName] = {};
								let playerResult = value._testResults.find(({ playerId }) => playerId === player.id);
								if (!playerResult) {
									playerResult = new TestResult({
										playerId: player.id,
										player,
										results: fields.map(value => ({
											rawField: value,
											rawValue: null,
											interval: null,
											percentage: null,
											tooltip: null
										}))
									});
									value._testResults.push(playerResult);
								} else {
									playerResult.results = playerResult.results.map(result => ({
										...result,
										interval: null,
										percentage: null,
										tooltip: null
									}));
									playerResult.player = player;
								}

								for (const result of playerResult.results) {
									if (result.rawValue !== undefined && result.rawValue !== null) {
										this.testResultMap[player.displayName][result.rawField] = result.rawValue;
										const threshold = getEntireTestThreshold(player, result.rawField, this.test.name);
										const thresholdActiveValue = getThresholdActiveValue(threshold);
										if (threshold) {
											this.testResultMap[player.displayName][result.interval] = getThresholdsInterval(result.rawValue, threshold);
											result.interval = getThresholdsInterval(result.rawValue, threshold);
											result.percentage = ((result.rawValue - thresholdActiveValue) / thresholdActiveValue) * 100;
											result.tooltip = getThresholdTooltip(
												thresholdActiveValue,
												result.rawValue,
												this.translate.instant('noThresholdSet'),
												this.translate.instant('threshold')
											);
										}
									}
								}
							}
						}

						// if _testResults contains players which have been archived in a date *before* the instance date,
						// but *after* this instance has been created, remove them
						const activePlayerIds = this.activePlayers.map(x => x.id);
						value._testResults = sortBy(
							value._testResults.filter(({ playerId }) => activePlayerIds.includes(playerId)),
							'player.displayName'
						);

						this.instance = value;
						this.updateInstanceArray(this.instance);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	updateLocalInstance(value: TestInstance, instance: TestInstance): TestInstance {
		value = {
			...value,
			...instance
		};
		if (value && !value.lastUpdateAuthor) {
			value.lastUpdateAuthor = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
		}
		if (!value._testResults) value._testResults = [];
		return value;
	}

	getPlayersIds(value: TestInstance, date: Date): any[] {
		// if _testResults not fully defined yet (aka, length === 0), I take ONLY the players of the seasonal lineup
		// otherwise I take the players already in _testResults
		const playerIds =
			value._testResults && value._testResults.length > 0
				? value._testResults.map(x => x.playerId)
				: this.currentTeamService.getSeasonAtDate(date).playerIds;
		const notPresentIds = difference(
			playerIds,
			this.allPlayers.map(x => x.id)
		);
		return [playerIds, notPresentIds];
	}

	getDetailedTestInstance(instance: TestInstance): Observable<TestInstance> {
		return !instance._testResults ? this.instanceApi.findById(instance.id) : of(instance);
	}

	getPlayers(notPresentIds: string[]): Observable<any[]> {
		return notPresentIds.length > 0
			? this.playerApi.find({
					where: { clubId: this.currentClubId, id: { inq: notPresentIds } },
					fields: ['id', 'displayName', 'archived', 'archivedDate', '_thresholdsTests']
				})
			: of([]);
	}

	getTestFields(test: Test): any[] {
		return test.customFields && test.customFields.length > 0
			? test.customFields
			: test.userFields && test.userFields.length > 0
				? test.userFields
				: [];
	}

	updateInstanceArray(instance: TestInstance) {
		const index = this.instancesOptions.findIndex(option => option.value.id === instance.id);
		if (this.instancesOptions[index]) {
			this.instancesOptions[index].value = {
				...this.instancesOptions[index].value,
				...instance
			};
		}
	}

	isFormulaField(fieldToCheck: string) {
		if (this.test && this.test.customFormulas && this.test.customFormulas.length > 0) {
			const formula = this.test.customFormulas.find(val => val.field === fieldToCheck);
			return formula;
		}
		return false;
	}

	recalculateFields(rowData) {
		const plResults = this.testResultMap[rowData.player.displayName];

		if (this.test.customFormulas) {
			for (const formula of this.test.customFormulas) {
				const fieldName = formula.field;
				const formulaValue = formula.formula;
				const depends = formula.depends;
				const scope: any = {};
				const age = moment().diff(rowData.player.birthDate, 'years');
				scope['age_years'] = age;
				this.notValid = false;
				for (const keyField in plResults) {
					if (depends.indexOf(keyField) !== -1 && !plResults[keyField]) {
						this.notValid = true;
						break;
					} else {
						const sanitizedFieldName = keyField.replace(/[\s{()}\/:%\-<>]+/g, '_');
						scope[sanitizedFieldName] = plResults[keyField];
					}
				}
				if (!this.notValid) {
					try {
						const sanitizedFormula = sanitizeExpression(formulaValue);
						const valueCalculated = evaluate(sanitizedFormula, scope);
						plResults[fieldName] = Number(valueCalculated).toFixed(1);
					} catch (e) {
						plResults[fieldName] = null;
					}
				} else {
					plResults[fieldName] = null;
				}
			}
		}
	}

	private recalculateAll() {
		if (this.test.customFormulas) {
			for (const plName of Object.keys(this.testResultMap)) {
				const plResults = this.testResultMap[plName];
				const plRow = this.activePlayers.find(p => p.displayName === plName);
				if (plRow) {
					for (const formula of this.test.customFormulas) {
						const fieldName = formula.field;
						const formulaValue = formula.formula;
						const depends = formula.depends;
						const scope: any = {};
						const age = moment().diff(plRow.birthDate, 'years');
						scope['age_years'] = age;
						this.notValid = false;
						for (const keyField in plResults) {
							if (depends.indexOf(keyField) !== -1 && !plResults[keyField]) {
								this.notValid = true;
								break;
							} else {
								const sanitizedFieldName = keyField.replace(/[\s{()}\/:%\-<>]+/g, '_');
								scope[sanitizedFieldName] = plResults[keyField];
							}
						}
						if (!this.notValid) {
							try {
								const sanitizedFormula = sanitizeExpression(formulaValue);
								const valueCalculated = evaluate(sanitizedFormula, scope);
								plResults[fieldName] = Number(valueCalculated).toFixed(1);
							} catch (e) {
								plResults[fieldName] = null;
							}
						} else {
							plResults[fieldName] = null;
						}
					}
				}
			}
		}
	}

	isGoScoreInherent(field) {
		const thresholds = getInvalidationThresholds();
		const threshold = thresholds.find(x => x.tMetric === field);
		return threshold;
	}

	getTooltipForTestColumn(field) {
		const thresholds = getInvalidationThresholds();
		const threshold = thresholds.find(x => x.tMetric === field);
		return threshold ? this.translate.instant('test.goscorecolumn') : field;
	}

	getType(type: string, i?: number): 'number' | 'text' {
		if (type === 'Location') return 'text';
		const fields = this.test.userFields.length > 0 ? this.test.userFields : this.test.customFields;
		return fields && i < fields.length ? fields[i].type : 'number';
	}

	fileChanged(event) {
		const playerNameField = this.test.playerNameField;

		this.fileReader = new FileReader();
		this.fileReader.onload = e => {
			const csvData = this.fileReader.result;
			const resultsCsv: Papa.ParseResult<any> = Papa.parse(csvData.toString(), {
				header: true,
				skipEmptyLines: true
			});
			const csvMap = resultsCsv.data.reduce(
				(accumulator, target) => ({
					...accumulator,
					[target[playerNameField]]: target
				}),
				{}
			);
			for (const trKey in this.testResultMap) {
				if (csvMap[trKey]) {
					const trKeys = Object.keys(csvMap[trKey]);
					trKeys.map(function (key, index) {
						if (key !== playerNameField) {
							this.testResultMap[trKey][key] = csvMap[trKey][key];
						}
					}, this);
				}
			}
			this.myInput.nativeElement.value = '';
			this.recalculateAll();
			this.csvUploadEmitter.emit();
		};

		this.fileReader.onerror = ev => {
			this.notificationService.notify('error', 'sidebar.tests', 'import.feedbacks.errorCSV', false);
		};

		this.fileReader.readAsText(event.target.files[0]);
	}

	downloadCsv() {
		let playerNameField = this.test.playerNameField;
		// if there is no valid playerNameField fallback to default 'displayName' as csv column name
		if (!playerNameField || playerNameField.length <= 0) {
			playerNameField = 'displayName';
		}
		const headers = this.getCustomFieldsValues();
		const defaultvalues: any = {};
		headers
			.filter(header => [playerNameField, 'date'].indexOf(header) < 0)
			.forEach(header => {
				defaultvalues[header] = null;
			});
		const trKeys = Object.keys(this.testResultMap);
		const arrPls = trKeys.map(key => ({
			[playerNameField]: key,
			date: moment(this.instance.date).format(getMomentFormatFromStorage()),
			...defaultvalues,
			...this.testResultMap[key]
		}));

		const results = Papa.unparse(arrPls, {});
		const fileName = this.test.name + ' ' + moment(this.instance.date).format(getMomentFormatFromStorage()) + '.csv';

		// const contentDispositionHeader = 'Content-Disposition: attachment; filename=' + fileName;
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	getTestComparisonLink(testModel, testInstance) {
		const params = {
			id: testModel.id,
			date: testInstance.date
		};
		return [`/${testModel.medical === false ? `performance/test-analysis` : `medical/medical-test-analysis`}`, params];
	}

	onDateInstanceTimeChanged(time: string) {
		this.dateInstance = moment(this.dateInstance)
			.set('hour', parseInt(time.split(':')[0], 10))
			.set('minute', parseInt(time.split(':')[1], 10))
			.toDate();
	}

	getTime(event: moment.MomentInput) {
		return moment(event).format('HH:mm');
	}

	confirmDeleteInstance() {
		this.confirmDeleteFlag = true;
	}

	discard() {
		this.confirmDeleteFlag = false;
	}

	addAttachment() {
		if (this.instance) {
			const author = this.auth.getCurrentUserData();
			this.instance._attachments = !this.instance._attachments ? [] : this.instance._attachments;
			this.selectedAttachment = new Attachment();
			this.selectedAttachment.id = uuid();
			this.selectedAttachment.name = ' ';
			this.selectedAttachment.date = moment().toDate();
			this.selectedAttachment.authorId = author.id;
			this.instance._attachments.push(this.selectedAttachment);
		}
	}

	editAttachment(attachment) {
		this.tempAttachment = { ...attachment };
		this.selectedAttachment = attachment;
		this.editService.editMode = true;
	}

	deleteAttachment(attachment) {
		const index = this.instance._attachments.indexOf(attachment);
		if (index > -1) {
			if (this.instance._attachments.length === 1) this.instance._attachments = [];
			else this.instance._attachments.splice(index, 1);
			this.instance._attachments = this.instance._attachments.slice();
		}
	}

	discardAttachment(row?, index?) {
		if (index) {
			this.instance._attachments[index] = { ...this.tempAttachment };
			this.instance._attachments = [...this.instance._attachments];
		}
		this.selectedAttachment = null;
		this.editService.editMode = false;
	}

	saveAttachment(row?, index?) {
		this.selectedAttachment = null;
		this.editService.editMode = false;
	}

	// private putAtBeginning() {
	// 	const input = document.getElementById('$notes');
	// 	// input.setSelectionRange(0, 0);
	// 	input.scrollTop = 0;
	// 	return input;
	// }

	onUpload(url: string, publicId: string | number, originalFilename: string) {
		this.selectedAttachment.name = originalFilename;
		this.selectedAttachment.url = publicId;
		this.selectedAttachment.downloadUrl = url;
	}

	sizeError() {
		this.notificationService.notify('error', 'navigator.profile', 'attributes.videoTooBig', false);
	}

	isPresetTest() {
		return this.test ? this.test.teamId === 'GLOBAL' : false;
	}
	private getFieldsValues(fields: any[]) {
		return fields.map(field => (typeof field === 'string' ? field : field.value));
	}

	private getFieldsType(fields: any[]) {
		return fields.map(field => (typeof field === 'string' ? field : field.type));
	}

	private checkTestFields() {
		if (!this.test.playerNameField || this.test.playerNameField.length <= 0) {
			this.test.playerNameField = 'displayName';
		}
		this.test.customFields = this.normalizeCustomFields(this.test.customFields);
		this.oldCustomValues.fields = this.cloneFields(this.test.customFields);
		this.oldCustomValues.name = this.test.playerNameField;
	}

	private normalizeCustomFields(customFields: any[] = []): CustomField[] {
		return customFields.map(value => (typeof value === 'string' ? { value, type: 'text' } : value));
	}

	private getTestAttachments() {
		return this.isPresetTest()
			? this.teamApi
					.findById(this.currentTeamId, {
						fields: ['_presetTestAttachments']
					})
					.pipe(
						map((team: Team) => {
							const testAttachments = team._presetTestAttachments.filter(attachment => attachment.externalUrl === this.test.id);
							return testAttachments;
						})
					)
			: of(this.test._attachments);
	}

	// TODO: extract to service and refactor
	private updateThresholds(testToSave: Test, oldTestName: string, oldValues: string[]) {
		const forkQueries$ = [];
		const instanceQueries$ = [];

		// update testInstances
		(testToSave.instances || []).forEach(instance => {
			(instance._testResults || []).forEach(testResult => {
				(testResult.results || []).forEach((x: any, i: number) => {
					x.rawField = testToSave.customFields[i].value;
				});
			});
			instanceQueries$.push(this.testApi.updateByIdInstances(testToSave.id, instance.id, instance));
		});
		forkQueries$.push(instanceQueries$.length > 0 ? forkJoin(instanceQueries$).pipe(first()) : of([]));

		// update team
		const teamToUpdate = this.currentTeamService.getCurrentTeam();
		let teamHasChanged = oldTestName !== testToSave.name;
		const metricsTests = (teamToUpdate.metricsTests || []).map(item => {
			if (item.testName === oldTestName) {
				const index = oldValues.indexOf(item.metricName);
				const metricName = index > -1 ? testToSave.customFields[index].value : item.metricName;
				if (!teamHasChanged) {
					teamHasChanged = index > -1;
				}
				item = {
					...item,
					testName: testToSave.name,
					metricName,
					metricLabel: testToSave.name + ' - ' + metricName
				};
			}
			return item;
		});
		if (teamHasChanged) {
			forkQueries$.push(this.teamApi.patchAttributes(teamToUpdate.id, { metricsTests }).pipe(first()));
			// update player's thresholds
			let _thresholdsTests: any[];
			const thresholdUpdate$: any[] = [];

			this.activePlayers.forEach(player => {
				let changed = false;
				_thresholdsTests = (player._thresholdsTests || []).map(threshold => {
					const { name, metric } = threshold;
					const index = oldValues.indexOf(metric);
					// has old values
					if (name === oldTestName && index > -1) {
						// new values are different
						if (threshold.name !== testToSave.name || threshold.metric !== testToSave.customFields[index].value) {
							threshold.name = testToSave.name;
							threshold.metric = testToSave.customFields[index].value;
							changed = true;
						}
					}
					return threshold;
				});
				if (changed) {
					thresholdUpdate$.push(
						this.playerApi.patchAttributes(player.id, {
							_thresholdsTests
						})
					);
				}
			});
			if (thresholdUpdate$.length > 0) {
				forkQueries$.push(forkJoin(thresholdUpdate$).pipe(first()));
			}
		}

		while (forkQueries$.length < 3) {
			forkQueries$.push(of(undefined));
		}

		return forkJoin(forkQueries$);
	}

	private cloneFields(fields: any[]) {
		return fields ? [...fields] : [];
	}

	downloadFile(attachment: Attachment) {
		this.azureStorageService.downloadFile(attachment);
	}
}
