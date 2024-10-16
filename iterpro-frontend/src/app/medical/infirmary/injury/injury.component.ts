import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
	Customer,
	Injury,
	InjuryApi,
	LoopBackAuth,
	MedicalTreatment,
	MedicalTreatmentApi,
	NotificationApi,
	Player,
	PlayerApi
} from '@iterpro/shared/data-access/sdk';
import {
	EditModeService,
	ErrorService,
	INJURY_STATUSES_LABELS,
	isNotEmpty,
	sortByDate
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash';
import * as moment from 'moment';
import { ConfirmationService, MenuItem, SelectItem } from 'primeng/api';
import { first, map, mergeMap } from 'rxjs/operators';
import { getInjuryList } from 'src/app/shared/treatments/utils/treatment-table-utils';

export enum InfirmaryViewState {
	Details = 0,
	Assessment = 1,
	Treatment = 2
}

@UntilDestroy()
@Component({
	selector: 'iterpro-injury',
	templateUrl: './injury.component.html',
	styleUrls: ['./injury.component.css']
})
export class InjuryComponent implements OnChanges {
	@Input({required: true}) customers: Customer[];
	@Input({required: true}) players: Player[];
	@Input({required: true}) selectedPlayer: Player;
	@Input({required: true}) selectedInjuryId: string;
	@Input({required: true}) newInj = false;

	@Output() addInjuryEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() deleteEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() saveEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() editExamClicked: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() downloadCsvEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() newInjuryDiscarded: EventEmitter<void> = new EventEmitter<void>();
	editExFlag = false;
	view: InfirmaryViewState;
	injuryList: SelectItem<Injury>[];
	updateDate = false;
	sideBarExpanded = true;
	selectedInjury: Injury;
	injuries: Injury[];
	injuryMedicalTreatments: MedicalTreatment[];
	menuItems: MenuItem[];
	activeMenu: MenuItem;
	constructor(
		public editService: EditModeService,
		private auth: LoopBackAuth,
		private error: ErrorService,
		private injuryApi: InjuryApi,
		private playerApi: PlayerApi,
		private translate: TranslateService,
		private notificationsApi: NotificationApi,
		private medicalTreatmentApi: MedicalTreatmentApi,
		private confirmationService: ConfirmationService
	) {
		this.saveInjury = this.saveInjury.bind(this);
		this.loadTabMenus();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['selectedPlayer'] && changes['selectedPlayer'].currentValue) {
			this.getPlayerInjuries(this.selectedPlayer);
		}
		if (changes['newInj']) {
			this.checkTabMenuDisabled();
		}
	}

	private loadTabMenus() {
		this.menuItems = [
			{
				id: String(InfirmaryViewState.Details),
				label: this.translate.instant('medicall.infirmary.individual.tabs.details'),
				command: () => this.onTabMenuChange(this.menuItems[0])
			},
			{
				id: String(InfirmaryViewState.Assessment),
				label: this.translate.instant('medicall.infirmary.individual.tabs.assessment'),
				command: () => this.onTabMenuChange(this.menuItems[1]),
			},
			{
				id: String(InfirmaryViewState.Treatment),
				label: this.translate.instant('medicall.infirmary.individual.tabs.treatment'),
				command: () => this.onTabMenuChange(this.menuItems[2])
			}
		];
		this.checkTabMenuDisabled();
		this.activeMenu = this.menuItems[0];
	}

	private checkTabMenuDisabled() {
		this.menuItems = this.menuItems.map((menu) => {
			if (menu.id === String(InfirmaryViewState.Assessment) || menu.id === String(InfirmaryViewState.Treatment)) {
				return {
					...menu,
					disabled: this.newInj
				};
			}
			return menu;
		})
	}

	onTabMenuChange(menuItem: MenuItem) {
		if (this.editService.editMode || this.editExFlag) {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.editGuard'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => this.confirmTabMenuChange(menuItem),
				reject: () => (this.activeMenu = this.menuItems[0])
			});
		} else {
			this.confirmTabMenuChange(menuItem);
		}
	}

	private confirmTabMenuChange(menuItem: MenuItem) {
		this.activeMenu = menuItem;
	}


	private getPlayerInjuries(player: Player) {
		this.playerApi
			.getInjuries(player.id)
			.pipe(
				map((injuries: Injury[]) => sortByDate(injuries, 'date').reverse()),
				untilDestroyed(this)
			)
			.subscribe({
				next: (injuries: Injury[]) => {
					this.injuries = injuries;
					this.injuryList = getInjuryList(this.injuries, this.translate, false);
					if (this.newInj) this.onAddNewInjury();
					else if (isEmpty(this.injuries)) this.selectInjury(null);
					else if (this.selectedInjuryId) this.selectInjury(injuries.find(({ id }) => id === this.selectedInjuryId));
					else if (!this.selectedInjuryId && isNotEmpty(this.injuries)) this.selectInjury(injuries[0]);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onSelectInjury(item: SelectItem) {
		this.selectInjury(item.value);
	}

	private selectInjury(injury: Injury) {
		if (!this.editService.editMode && !this.editExFlag) {
			this.selectedInjury = injury;
			this.loadPlayerInjuryMedicalTreatments(this.selectedPlayer.id, injury.id);
		}
		if (!this.selectedPlayer) {
			this.selectedPlayer = injury.player;
		}
	}

	private loadPlayerInjuryMedicalTreatments(playerId: string, injuryId: string) {
		const medicalRequest$ = this.medicalTreatmentApi.find({
			where: {
				playerId: playerId,
				injuryId: injuryId
			},
			order: 'date DESC'
		});
		medicalRequest$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (medicalTreatments: MedicalTreatment[]) => {
				this.injuryMedicalTreatments = medicalTreatments;
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	onAddNewInjury() {
		this.selectedInjury = new Injury({
			createdBy: this.auth.getCurrentUserData().lastName + ' ' + this.auth.getCurrentUserData().firstName,
			date: moment().toDate(),
			currentStatus: INJURY_STATUSES_LABELS.Assessment,
			location: '',
			_injuryAssessments: [],
			_injuryExams: []
		});
		this.activeMenu = this.menuItems[0];
		this.editService.editMode = true;
	}

	expandView(visible: boolean) {
		this.sideBarExpanded = visible;
	}

	downloadCsv(e: Injury) {
		this.downloadCsvEmitter.emit(e);
	}

	onSaveInjury(val: [Injury, boolean, boolean]) {
		this.newInj = false;
		if (val[1] === true) {
			val[0] = this.resetInjuryHistory(val[0]);
		}
		this.saveInjury(val[0]);
	}

	private saveInjury(injury: Injury) {
		injury = this.prepareInjuryForSaving(injury);
		if (injury.id) this.updateInjury(injury);
		else this.createInjury(injury);
	}

	private updateInjury(injury: Injury) {
		delete injury.player;
		const index = this.injuries.findIndex(({ id }) => id === injury.id);
		this.injuryApi
			.updateAttributes(injury.id, injury)
			.pipe(
				mergeMap((inj: Injury) => {
					this.selectedInjury = inj;
					return this.notificationsApi.checkForInjuryStatusChanges(
						inj.id,
						this.auth.getCurrentUserData().currentTeamId
					);
				}),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => {
					this.updateDate = false;
					this.editService.editMode = false;
					this.updateInjuryList(index);
					this.saveEmitter.emit(this.selectedInjury);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private createInjury(injury: Injury) {
		injury.reinjury = this.checkForReinjury(injury);
		this.playerApi
			.createInjuries(this.selectedPlayer.id, injury)
			.pipe(
				mergeMap((inj: Injury) => {
					this.selectedInjury = inj;
					return this.notificationsApi.checkForInjuryCreation(inj.id, this.auth.getCurrentUserData().currentTeamId);
				}),
				untilDestroyed(this)
			)
			.subscribe({
				next: () => {
					this.updateDate = false;
					this.editService.editMode = false;
					this.updateInjuryList();
					this.addInjuryEmitter.emit(this.selectedInjury);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private updateInjuryList(index?: number, toDelete?: boolean) {
		if (index !== null && index >= 0) {
			if (toDelete) this.injuries.splice(index, 1);
			else this.injuries[index] = { ...this.selectedInjury };
		} else this.injuries.push(this.selectedInjury);
		this.injuryList = getInjuryList(this.injuries, this.translate, false);
	}

	private checkForReinjury(injury: Injury): boolean {
		const injuriesWithSameLocation = (this.injuryList || []).filter(({ value }) => value.location === injury.location);
		const firstInjury = isNotEmpty(injuriesWithSameLocation) ? injuriesWithSameLocation[0].value : null;
		return firstInjury && firstInjury.endDate && moment(injury.date).diff(moment(firstInjury.endDate), 'days') <= 56;
	}

	private prepareInjuryForSaving(injury: Injury): Injury {
		if (injury.currentStatus === INJURY_STATUSES_LABELS.Healed) {
			if (!injury.endDate) {
				injury.endDate = moment().toDate();
				injury.expectedReturn = null;
			}
			injury.severity = this.getInjurySeverity(injury);
		}
		if (!isNotEmpty(injury.statusHistory)) {
			injury.statusHistory = [
				{
					phase: INJURY_STATUSES_LABELS.Therapy,
					date: injury.date,
					author: this.auth.getCurrentUserData().lastName + ' ' + this.auth.getCurrentUserData().firstName
				}
			];
		}
		if (this.updateDate === true) {
			injury.statusHistory = [
				...injury.statusHistory,
				{
					phase: injury.currentStatus,
					date: moment().toDate(),
					author: this.auth.getCurrentUserData().lastName + ' ' + this.auth.getCurrentUserData().firstName
				}
			];
		}
		return injury;
	}

	private getInjurySeverity(injury: Injury): string {
		const diffDays = Math.ceil(moment(injury.date).diff(moment(injury.endDate), 'days'));
		if (diffDays === 1) return 'medical.infirmary.details.severity.slight';
		else if (diffDays > 1 && diffDays <= 3) return 'medical.infirmary.details.severity.minimal';
		else if (diffDays > 3 && diffDays <= 7) return 'medical.infirmary.details.severity.mild';
		else if (diffDays > 7 && diffDays <= 28) return 'medical.infirmary.details.severity.moderate';
		else if (diffDays > 28) return 'medical.infirmary.details.severity.severe';
	}

	discardInjury(injury: Injury) {
		const index = this.injuries.findIndex(({ id }) => id === injury?.id);
		if (index === -1) {
			this.selectedPlayer = null;
			this.selectedInjury = null;
			this.newInjuryDiscarded.emit();
		}
	}

	deleteInjury(injury: Injury) {
		if (!injury.id) return;
		const index = this.injuries.findIndex(({ id }) => id === injury.id);
		this.playerApi
			.destroyByIdInjuries(this.selectedPlayer.id, injury.id)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => {
					this.updateInjuryList(index, true);
					this.editService.editMode = false;
					this.deleteEmitter.emit();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	editExamFlag(e: boolean) {
		this.editExFlag = e;
		this.editExamClicked.emit(e);
	}

	private resetInjuryHistory(injury: Injury): Injury {
		injury.currentStatus = INJURY_STATUSES_LABELS.Assessment;
		injury.statusHistory = [];
		injury.statusHistory = [
			...injury.statusHistory,
			{
				phase: injury.currentStatus,
				date: moment(injury.date).toDate(),
				author: this.auth.getCurrentUserData().lastName + ' ' + this.auth.getCurrentUserData().firstName
			}
		];

		const newAssessments = [];
		const newExams = [];
		const newTreatments = [];
		for (const ass of injury._injuryAssessments) {
			if (moment(injury.date).diff(moment(ass.date), 'days') <= 0) {
				newAssessments.push(ass);
			}
		}
		for (const treat of this.injuryMedicalTreatments) {
			// TODO MATTEO
			if (moment(injury.date).diff(moment(treat.date), 'days') <= 0) {
				newTreatments.push(treat);
			}
		}
		for (const exa of injury._injuryExams) {
			if (moment(injury.date).diff(moment(exa.date), 'days') <= 0) {
				newExams.push(exa);
			}
		}
		injury._injuryAssessments = newAssessments;
		injury._injuryExams = newExams;
		return injury;
	}
}
