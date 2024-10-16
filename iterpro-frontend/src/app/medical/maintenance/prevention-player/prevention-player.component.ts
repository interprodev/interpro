import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
	Anamnesys,
	ChronicInjury,
	Injury,
	MedicalPreventionPlayer,
	MedicalTreatment,
	MedicalTreatmentApi,
	ProfilePlayersApi,
	Test,
	TestApi,
	TestInstance
} from '@iterpro/shared/data-access/sdk';
import { ErrorService, copyValue, isNotEmpty, sortByDate } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dictionary } from '@ngrx/entity';
import { concatMap, first } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'iterpro-prevention-player',
	templateUrl: './prevention-player.component.html',
	styleUrls: ['./prevention-player.component.css']
})
export class PreventionPlayerComponent implements OnChanges {
	@Input() player: MedicalPreventionPlayer;
	@Input() injuries: Injury[];
	@Input() sorenessInjuries: Injury[];
	@Input() players: MedicalPreventionPlayer[];
	@Input() chronicInjuries: ChronicInjury[] = [];
	@Input() chronicInjuryId: string;
	@Output() onUpdatePlayer: EventEmitter<MedicalPreventionPlayer> = new EventEmitter<MedicalPreventionPlayer>();
	@Output() onApplyPlayersEmitter: EventEmitter<Dictionary<any>> = new EventEmitter<Dictionary<any>>();
	@Output() onAnamnesysSaveEmitter: EventEmitter<Anamnesys[]> = new EventEmitter<Anamnesys[]>();
	tests: TestInstance[] = [];
	sideBarOpen = false;
	tabIndex = 0;

	private models: Test[];
	medicalTreatments: MedicalTreatment[] = [];

	constructor(
		private testApi: TestApi,
		private error: ErrorService,
		private profilePlayersApi: ProfilePlayersApi,
		private medicalTreatmentApi: MedicalTreatmentApi
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player']) {
			if (this.player) {
				this.loadPlayer();
			}
		}
	}

	private loadPlayer() {
		if (this.player) {
			this.getPlayerTests(this.player);
			this.loadPlayerMedicalTreatments(this.player.id);
		}
	}

	getDownloadPic(player) {
		return player.downloadUrl;
	}

	private loadPlayerMedicalTreatments(playerId: string) {
		const medicalRequest$ = this.medicalTreatmentApi.find({
			where: {
				playerId: playerId
			},
			order: 'date DESC'
		});
		medicalRequest$.pipe(first(), untilDestroyed(this)).subscribe({
			next: (medicalTreatments: MedicalTreatment[]) => {
				this.medicalTreatments = medicalTreatments;
			},
			error: (error: Error) => this.error.handleError(error)
		});
	}

	private getPlayerTests(player) {
		this.testApi
			.find({
				where: {
					teamId: { inq: [player.teamId, 'GLOBAL'] }
				},
				fields: ['id', 'name', 'purpose', 'medical']
			})
			.pipe(
				untilDestroyed(this),
				concatMap((tests: Test[]) => {
					const ids = tests.map(({ id }) => id);
					this.models = tests;
					return this.profilePlayersApi.profileMaintenance(player.id, ids);
				})
			)
			.subscribe(
				(instances: TestInstance[]) => {
					instances.forEach(inst => {
						const model = this.models.find(({ id }) => id === inst.testId);
						inst['medical'] = model.medical;
						inst['name'] = model.name;
						inst['purpose'] = model.purpose;
					});
					this.tests = sortByDate(instances, 'date').reverse();
				},
				(error: Error) => this.error.handleError(error)
			);
	}

	handleChangeTab(event) {
		this.tabIndex = event.index;
	}

	onTreatmentsModified(event: MedicalTreatment[]) {
		this.medicalTreatments = event;
	}

	onExamsModified(event) {
		this.player._preventionExams = event;
		this.player = copyValue(this.player);
		this.onUpdatePlayer.emit(this.player);
	}
	expandView(visible: boolean) {
		this.sideBarOpen = visible;
	}

	getMedicalRecords(player: MedicalPreventionPlayer) {
		if (isNotEmpty(player.anamnesys)) return player.anamnesys[0].date;
	}

	getMedicalRecordsExpDate(player: MedicalPreventionPlayer) {
		if (isNotEmpty(player.anamnesys)) return player.anamnesys[0].expirationDate;
	}

	/**
	 * Medical > Maintenance > Select player > lower right section, click on link to redirect to medical screening UI.
	 * Redirect to medical screening record of selected player.
	 * @param player : selected player record
	 */
	goToClinicalRecords(player: MedicalPreventionPlayer) {
		this.tabIndex = 4;
	}

	onApplyPlayers(event: Dictionary<any>) {
		this.onApplyPlayersEmitter.emit(event);
	}
}
