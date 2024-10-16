import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import {
	PdfSectionPlayer,
	ReadinessPlayerData,
	ReadinessSidebarViewType,
	ReadinessViewType
} from '@iterpro/shared/data-access/sdk';
import {
	ReadinessService,
	ReportService,
	getMomentFormatFromStorage,
	getPDFv2Path
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { forkJoin } from 'rxjs';
@UntilDestroy()
@Component({
	selector: 'iterpro-readiness-list',
	templateUrl: './readiness-list.component.html',
	styleUrls: ['./readiness-list.component.scss']
})
export class ReadinessListComponent implements OnChanges, OnDestroy {
	@Input() teamView: ReadinessViewType;
	@Input() currentViewState: ReadinessSidebarViewType;
	@Input() list: ReadinessPlayerData[];
	@Input() selectedDate: Date;

	@Output() onClickPlayerEmitter: EventEmitter<ReadinessPlayerData> = new EventEmitter<ReadinessPlayerData>();

	moderate: ReadinessPlayerData[];
	optimal: ReadinessPlayerData[];
	poor: ReadinessPlayerData[];
	notMeasured: ReadinessPlayerData[];

	constructor(
		private translate: TranslateService,
		private reportService: ReportService,
		private readinessService: ReadinessService
	) {}

	ngOnDestroy() {}

	ngOnChanges(changes: SimpleChanges) {
		if (
			(changes['teamView'] && this.teamView === ReadinessViewType.Default) ||
			(changes['currentViewState'] && this.currentViewState === ReadinessSidebarViewType.Session) ||
			(changes['list'] && this.list)
		) {
			this.scaffoldData();
		}
	}

	onClickPlayer(player: ReadinessPlayerData) {
		this.onClickPlayerEmitter.emit(player);
	}

	downloadPDF() {
		const t = this.translate.instant.bind(this.translate);
		const report = {
			header: {
				title: this.translate.instant(`READINESS TEAM`).toUpperCase(),
				subTitle: 'TEAM VIEW'
			},
			metadata: {
				createdLabel: `${this.translate.instant('general.createdOn')} ${moment(new Date()).format(
					`${getMomentFormatFromStorage()} hh:mm`
				)}`
			},
			summary: {
				date: {
					label: t('sidebar.date'),
					value: moment(this.selectedDate).format(getMomentFormatFromStorage())
				},
				type: {
					label: t('sidebar.type'),
					value: this.readinessService.getDateFormat(this.selectedDate)
				}
			},
			sections: this.getReportPlayerData()
		};

		const getImages = report.sections.map(({ players }) => this.reportService.getImages(players.map(({ pic }) => pic)));

		forkJoin(getImages)
			.pipe(untilDestroyed(this))
			.subscribe(results => {
				report.sections.forEach((section, i) => {
					const images = results[i];
					images.forEach((pic, j) => {
						section.players[j].pic = pic.toString();
					});
				});

				this.reportService.getReport(getPDFv2Path('readiness', 'readiness_team'), report);
			});
	}

	downloadCSV() {
		const csvRows = this.list.map((player: ReadinessPlayerData) => {
			const row = {
				'Display Name': player.displayName,
				Date: moment(this.selectedDate).format(getMomentFormatFromStorage()),
				Type: this.readinessService.getDateFormat(this.selectedDate),
				'GO Score': player.goscore.today.value,
				Sleep: player.wellness?.sleep?.value,
				'Sleep Hours': player.wellness?.sleep_duration,
				Mood: player.wellness?.mood?.value,
				Stress: player.wellness?.stress?.value,
				Soreness: player.wellness?.soreness?.value,
				'Soreness Locations': player.wellness?.locations
					.map(location => this.translate.instant('medical.infirmary.details.location.' + location))
					.join(', '),
				Fatigue: player.wellness?.fatigue?.value,
				...player.readiness.reduce((acc, curr) => ({ ...acc, [`${curr.test} - ${curr.label}`]: curr.value }), {})
			};
			return row;
		});
		const results = Papa.unparse(csvRows, {});
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, `Readiness - Team View ${moment(this.selectedDate).format(getMomentFormatFromStorage())}.csv`);
	}

	private getReportPlayerData() {
		const t = this.translate.instant.bind(this.translate);
		const toPlayer: (value: ReadinessPlayerData) => PdfSectionPlayer = player => ({
			position: t(`${player.position}.short`),
			displayName: player.displayName,
			goScore: player.goscore.today.value,
			incrementTeamView: player.goscore.last48h.increment,
			careful: player.healthStatus.available === 'careful',
			pic: player.downloadUrl
		});
		const notMeasuredPlayers = this.notMeasured.map(toPlayer);
		const poorPlayers = this.poor.map(toPlayer);
		const moderatePlayers = this.moderate.map(toPlayer);
		const optimalPlayers = this.optimal.map(toPlayer);
		const sections = [
			{
				color: 'green',
				label: `${t('readiness.teamView.optimal')} (${optimalPlayers.length}/${this.list.length})`,
				percentage: ((100 * optimalPlayers.length) / this.list.length).toFixed(2),
				players: optimalPlayers
			},
			{
				color: 'yellow',
				label: `${t('readiness.teamView.moderate')} (${moderatePlayers.length}/${this.list.length})`,
				percentage: ((100 * moderatePlayers.length) / this.list.length).toFixed(2),
				players: moderatePlayers
			},
			{
				color: 'crimson',
				label: `${t('readiness.teamView.poor')} (${poorPlayers.length}/${this.list.length})`,
				percentage: ((100 * poorPlayers.length) / this.list.length).toFixed(2),
				players: poorPlayers
			},
			{
				color: 'grey',
				label: `${t('readiness.teamView.notMeasured')} (${notMeasuredPlayers.length}/${this.list.length})`,
				percentage: ((100 * notMeasuredPlayers.length) / this.list.length).toFixed(2),
				players: notMeasuredPlayers
			}
		];
		return sections;
	}

	private scaffoldData() {
		this.notMeasured = [];
		this.poor = [];
		this.moderate = [];
		this.optimal = [];
		this.list.forEach(player => {
			this[player.status].push(player);
		});
	}
}
