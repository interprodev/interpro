import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import {
	ChronicInjury,
	Injury,
	MedicalPreventionPlayer,
	PlayerApi,
	ReadinessApi,
	ReadinessPlayerData
} from '@iterpro/shared/data-access/sdk';
import {
	BlockUiInterceptorService,
	ErrorService,
	ToServerEquivalentService,
	sortByDate,
	sortByDateDesc
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { flatten } from 'lodash';
import * as moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'iterpro-prevention-anamnesys',
	templateUrl: './prevention-anamnesys.component.html',
	styleUrls: ['./prevention-anamnesys.component.css']
})
export class PreventionAnamnesysComponent implements OnDestroy, OnChanges {
	@Input() player: MedicalPreventionPlayer;
	@Input() injuries: Injury[] = [];
	@Input() chronicInjuries: ChronicInjury[] = [];
	@Input() sorenessInjuries: Injury[] = [];
	@Input() chronicInjuryId: string;
	@BlockUI('chronicForm') blockUI: NgBlockUI;
	chronicInjuryShown = false;
	selectedChronicInjury: Partial<ChronicInjury>;
	injuriesAndSoreness: Injury[] = [];
	lastReadiness: any;
	wellbeingKeys: Array<{ label: string; key: string }> = [
		{ label: 'wellness.sleep', key: 'sleep' },
		{ label: 'wellness.sleepDuration', key: 'sleep_duration' },
		{ label: 'wellness.sleepTimeWithoutHours', key: 'sleep_start' },
		{ label: 'wellness.wakeUpTime', key: 'sleep_end' },
		{ label: 'wellness.stress', key: 'stress' },
		{ label: 'wellness.fatigue', key: 'fatigue' },
		{ label: 'wellness.soreness', key: 'soreness' },
		{ label: 'wellness.sorenessLocation', key: 'locations' },
		{ label: 'wellness.mood', key: 'mood' }
	];
	readinessData: ReadinessPlayerData;

	table: any = null;

	constructor(
		private error: ErrorService,
		private playerApi: PlayerApi,
		private router: Router,
		private translate: TranslateService,
		private blockUiInterceptorService: BlockUiInterceptorService,
		private readinessApi: ReadinessApi,
		private toServer: ToServerEquivalentService
	) {}

	ngOnDestroy() {
		console.debug('ngOnDestroy Prevention Anamnesys');
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player']) {
			if (this.player) {
				this.loadPlayer();
			}
		}
		if (changes['injuries'] && changes['sorenessInjuries']) {
			this.injuriesAndSoreness = [...this.injuries, ...this.sorenessInjuries];
		}
	}

	addChronic() {
		this.selectedChronicInjury = {
			date: new Date(),
			location: 'medical.infirmary.details.location.headFace',
			currentStatus: 'medical.prevention.chronic.stable',
			system: [],
			anatomicalDetails: []
		};
		this.chronicInjuryShown = true;
	}

	editChronic(injury: ChronicInjury) {
		this.selectedChronicInjury = Object.assign({}, injury);
		this.chronicInjuryShown = true;
	}

	closeChronic() {
		this.selectedChronicInjury = {};
		this.chronicInjuryShown = false;
	}

	saveChronic(injury?: ChronicInjury) {
		this.blockUiInterceptorService
			.disableOnce(this.playerApi.createChronicInjuries(this.player.id, this.selectedChronicInjury))
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: ChronicInjury) => {
					const chronicInjuries = [...this.chronicInjuries, result];
					this.chronicInjuries = sortByDateDesc(chronicInjuries, 'date');
					if (injury) this.injuries = sortByDate([...this.injuries, injury], 'date');
					this.selectedChronicInjury = result;
					this.blockUI.stop();
					if (injury) this.router.navigate(['/medical/infirmary', { id: injury.id }]);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	modifyChronic(injury?: ChronicInjury) {
		this.blockUiInterceptorService
			.disableOnce(
				this.playerApi.updateByIdChronicInjuries(
					this.player.id,
					this.selectedChronicInjury.id,
					this.selectedChronicInjury
				)
			)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (result: ChronicInjury) => {
					const index = this.chronicInjuries.findIndex(({ id }) => id === result.id);
					if (index > -1) this.chronicInjuries[index] = result;
					this.chronicInjuries = sortByDateDesc(this.chronicInjuries, 'date');
					if (injury) this.injuries = sortByDate([...this.injuries, injury], 'date');
					this.selectedChronicInjury = result;
					this.blockUI.stop();
					if (injury) this.router.navigate(['/medical/infirmary', { id: injury.id }]);
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	deleteChronic() {
		this.blockUiInterceptorService
			.disableOnce(this.playerApi.destroyByIdChronicInjuries(this.player.id, this.selectedChronicInjury.id))
			.pipe(untilDestroyed(this))
			.subscribe({
				next: () => {
					const index = this.chronicInjuries.findIndex(({ id }) => id === this.selectedChronicInjury.id);
					if (index > -1) this.chronicInjuries.splice(index, 1);
					this.chronicInjuries = this.chronicInjuries.slice();
					this.closeChronic();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onSubmit(injury?: ChronicInjury) {
		this.blockUI.start();
		if (this.selectedChronicInjury.id) {
			this.modifyChronic(injury);
		} else {
			this.saveChronic(injury);
		}
	}

	private loadPlayer() {
		forkJoin([this.getWellness$(), this.getReadiness$(), this.getLastTestResults$()]).subscribe({
			next: () => {
				if (this.chronicInjuryId) {
					const preselected = this.chronicInjuries.find(({ id }) => id === this.chronicInjuryId);
					if (preselected) this.editChronic(preselected);
				}
			},
			error: error => this.error.handleError(error)
		});
	}

	private getWellness$() {
		return this.readinessApi.getPlayerLatestReadiness(this.player.id).pipe(
			map(data => (this.lastReadiness = data)),
			untilDestroyed(this)
		);
	}

	private getReadiness$() {
		return this.readinessApi
			.getPlayerReadiness(this.player.id, this.toServer.convert(moment().startOf('day').toDate()).toISOString())
			.pipe(
				map((data: ReadinessPlayerData) => (this.readinessData = data)),
				untilDestroyed(this)
			);
	}

	private getLastTestResults$() {
		return this.playerApi.getFitnessProfile(this.player.id, [], []).pipe(
			map(({ table }) => (this.table = flatten(Object.values(table)))),
			untilDestroyed(this)
		);
	}

	goToDetails(injury: Injury) {
		return this.router.navigate(['/medical/infirmary', { id: injury.id }]);
	}

	isStandardField(key: string): boolean {
		return key !== 'sleep_start' && key !== 'sleep_end' && key !== 'sleep_duration' && key !== 'locations';
	}

	isLocationField(key: string): boolean {
		return key === 'locations';
	}

	isSleepField(key: string): boolean {
		return key === 'sleep_start' || key === 'sleep_end' || key === 'sleep_duration';
	}

	getSorenessLocations(locations: string[]): string {
		return (locations || [])
			.map(location =>
				this.translate.instant(
					location === 'general' || location === 'none' ? location : `medical.infirmary.details.location.${location}`
				)
			)
			.join(', ');
	}

	getLocationsNumberString(n: number): string {
		return `(${n} ${this.translate.instant(
			n !== 1 ? 'medical.infirmary.details.locations' : 'medical.infirmary.details.location'
		)})`;
	}
}
