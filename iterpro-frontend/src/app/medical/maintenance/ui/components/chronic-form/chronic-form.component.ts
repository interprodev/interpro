import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { LoopBackAuth, PlayerApi } from '@iterpro/shared/data-access/sdk';
import { ANATOMICAL_DETAILS, ANATOMICAL_DETAILS_LATIN, ErrorService, sortByName } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { CHRONIC_STATUS_HEALED, fullStatus, locations, status, system } from './labels';

@UntilDestroy()
@Component({
	selector: 'iterpro-chronic-form',
	templateUrl: './chronic-form.component.html',
	styleUrls: ['./chronic-form.component.css']
})
export class ChronicFormComponent implements OnInit, OnChanges, OnDestroy {
	@Input() player: any;
	@Input() injury: any;
	@Input() injuries: any = [];
	@Output() close: EventEmitter<any> = new EventEmitter<any>();
	@Output() onSubmit: EventEmitter<any> = new EventEmitter<any>();
	@Output() deleteChronic: EventEmitter<any> = new EventEmitter<any>();

	locationsOptions: any = [];
	statusOptions: any = [];
	fullStatusOptions: any = [];
	systemOptions: any = [];

	editMode: any = false;
	backup: any;
	flaredUp: any;
	anatomicalDetails: SelectItem<string>[] = [];

	constructor(
		private translate: TranslateService,
		private error: ErrorService,
		private playerApi: PlayerApi,
		private confirmationService: ConfirmationService,
		private auth: LoopBackAuth
	) {}

	ngOnChanges(changes) {
		if (changes['injury']) {
			if (!this.injury.id) this.editMode = true;
		}
	}

	ngOnDestroy() {}

	ngOnInit() {
		this.locationsOptions = locations.map(location => ({
			label: this.translate.instant(location),
			value: location
		}));
		this.systemOptions = system.map(s => ({
			label: this.translate.instant(s),
			value: s
		}));
		this.statusOptions = status.map(({ label, color }) => ({
			label: this.translate.instant(label),
			value: label,
			color
		}));
		this.fullStatusOptions = fullStatus.map(({ label, color }) => ({
			label: this.translate.instant(label),
			value: label,
			color
		}));

		this.injury.date = new Date(this.injury.date);

		// For english and german language, use english version of anatomical details and for others use latin file.
		this.anatomicalDetails =
			this.translate.currentLang === 'en-US' || this.translate.currentLang === 'de-DE' ? ANATOMICAL_DETAILS : ANATOMICAL_DETAILS_LATIN;
		this.anatomicalDetails = sortByName(this.anatomicalDetails, 'label');
		this.anatomicalDetails = Array.from(this.anatomicalDetails.reduce((m, t) => m.set(t.value, t), new Map()).values());
	}

	edit() {
		this.backup = Object.assign({}, this.injury, {
			toDo: this.injury.toDo ? [...this.injury.toDo] : [],
			notToDo: this.injury.notToDo ? [...this.injury.notToDo] : [],
			system: this.injury.system ? [...this.injury.system] : []
		});
		this.editMode = true;
	}

	save() {
		this.editMode = false;
		this.onSubmit.emit();
	}

	discard() {
		this.injury = Object.assign({}, this.injury, this.backup);
		this.editMode = false;
	}

	addToDo() {
		if (!this.injury.toDo) this.injury.toDo = [''];
		else this.injury.toDo.push('');
	}

	removeToDo(i) {
		this.injury.toDo.splice(i, 1);
	}

	addNotToDo() {
		if (!this.injury.notToDo) this.injury.notToDo = [''];
		else this.injury.notToDo.push('');
	}

	removeNotToDo(i) {
		this.injury.notToDo.splice(i, 1);
	}

	isDisabled() {
		return !this.editMode || this.isDisabledStatus();
	}

	isDisabledStatus() {
		return this.isFlaredUp() || (this.backup && this.backup.currentStatus === CHRONIC_STATUS_HEALED);
	}

	isNotEdit() {
		return this.editMode === false;
	}

	isEdit() {
		return this.editMode === true;
	}

	isFlaredUp() {
		return this.injuries.find(
			x => x.currentStatus !== 'medical.infirmary.details.statusList.healed' && x.chronicInjuryId && x.chronicInjuryId === this.injury.id
		);
	}

	isHealed() {
		return this.injury.currentStatus === 'medical.prevention.chronic.healed';
	}

	onValueUpdateToDo(e, index) {
		this.injury.toDo[index] = e.target.value;
	}

	onValueUpdateNotToDo(e, index) {
		this.injury.notToDo[index] = e.target.value;
	}

	flareUp() {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.flareUp'),
			header: 'Flared-Up',
			accept: () => {
				this.flareUpInjury();
			},
			reject: () => {
				this.flaredUp = false;
			}
		});
	}

	askDelete() {
		this.confirmationService.confirm({
			message: this.translate.instant('confirm.delete'),
			header: 'Delete',
			accept: () => {
				this.deleteChronic.emit();
			},
			reject: () => {}
		});
	}

	flareUpInjury() {
		const injury = Object.assign({}, this.injury, {
			date: moment().startOf('day').toDate(),
			issue: 'medical.infirmary.details.issue.injury',
			chronicInjuryId: this.injury.id,
			playerId: this.player.id,
			currentStatus: 'medical.infirmary.details.statusList.therapy',
			_injuryAssessments: [],
			_injuryExams: [],
			statusHistory: [
				{
					phase: 'medical.infirmary.details.statusList.therapy',
					date: moment().startOf('day').toDate(),
					author: this.auth.getCurrentUserData().lastName + ' ' + this.auth.getCurrentUserData().firstName
				}
			]
		});
		delete injury.id;

		this.playerApi
			.createInjuries(this.player.id, injury)
			.pipe(untilDestroyed(this))
			.subscribe(
				inj => {
					this.onSubmit.emit(inj);
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	getLinkInfirmary(injury) {
		return [
			'/medical/infirmary',
			{
				id: this.injuries.find(x => x.chronicInjuryId === injury.id).id
			}
		];
	}
}
