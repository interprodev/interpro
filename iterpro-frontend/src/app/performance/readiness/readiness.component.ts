import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Player,
	ReadinessApi,
	ReadinessPlayerData,
	ReadinessSessionViewType,
	ReadinessSidebarViewType,
	ReadinessViewType,
	Team,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import { ErrorService, ReadinessService, ToServerEquivalentService } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { isEmpty, sortBy } from 'lodash';
import * as momentLib from 'moment';
import { extendMoment } from 'moment-range';
import { SelectItem } from 'primeng/api';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ReadinessListComponent } from './readiness-list/readiness-list.component';
import { ReadinessTableComponent } from './readiness-table/readiness-table.component';
import { ReadinessSessionComponent } from './readiness-session/readiness-session.component';
import { ReadinessPeriodComponent } from './readiness-period/readiness-period.component';

const moment = extendMoment(momentLib);

const MAX_METRICS = 2;

@UntilDestroy()
@Component({
	templateUrl: './readiness.component.html',
	styleUrls: ['./readiness.component.scss']
})
export class ReadinessComponent implements OnInit, OnDestroy {
	@ViewChild(ReadinessListComponent, { static: false }) listComponent: ReadinessListComponent;
	@ViewChild(ReadinessTableComponent, { static: false }) tableComponent: ReadinessTableComponent;
	@ViewChild(ReadinessSessionComponent, { static: false }) sessionComponent: ReadinessSessionComponent;
	@ViewChild(ReadinessPeriodComponent, { static: false }) periodComponent: ReadinessPeriodComponent;


	viewState: ReadinessViewType = ReadinessViewType.Default;
	viewTypes = ReadinessViewType;
	sidebarState: ReadinessSidebarViewType = ReadinessSidebarViewType.Session;
	sidebarViews = ReadinessSidebarViewType;
	sessionState: ReadinessSessionViewType = ReadinessSessionViewType.List;
	sessionViews = ReadinessSessionViewType;
	currentTeam: Team;
	today: Date;
	readinessList: ReadinessPlayerData[];
	readinessPlayer$: Observable<ReadinessPlayerData>;
	readinessPeriod$: Observable<ReadinessPlayerData[]>;
	wellnessEnabled: boolean;
	selectedDate: Date = null;
	selectedPeriod: Date[] = [];
	playerList: Player[] = [];
	selectedPlayer: Player | ReadinessPlayerData;
	metricsList: SelectItem[] = [];
	selectedMetrics: string[] = [];

	private playerId: string;
	private route$: Subscription;

	constructor(
		private error: ErrorService,
		private teamSeasonApi: TeamSeasonApi,
		private route: ActivatedRoute,
		private readinessApi: ReadinessApi,
		private currentTeamService: CurrentTeamService,
		private toServer: ToServerEquivalentService,
		private readinessService: ReadinessService
	) {}

	ngOnDestroy() {
		if (this.route$) {
			this.playerId = null;
		}
	}

	ngOnInit() {
		this.selectedDate = null;
		this.today = moment().startOf('day').toDate();
		this.route$ = this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params: ParamMap) => {
			if (params['params'].date) {
				this.selectedDate = moment(params['params'].date).startOf('day').toDate();
			}
			this.playerId = params['params'].id;
			if (!this.playerId) {
				this.sessionState = ReadinessSessionViewType.List;
			}
			this.init();
		});
	}

	private init() {
		this.currentTeam = this.currentTeamService.getCurrentTeam();
		this.wellnessEnabled = this.isWellnessEnabled(this.currentTeam);
		this.metricsList = this.getMetricsList(this.currentTeam);
		const { offseason, inseasonEnd, id: seasonId } = this.currentTeamService.getCurrentSeason();
		let day = this.selectedDate;
		if (!this.selectedDate) {
			day = this.today;
			if (!moment().isBetween(offseason, inseasonEnd)) day = moment(inseasonEnd).toDate();
			this.onDateSelect(day);
		} else this.onDateSelect(this.selectedDate);
		this.getPlayers(seasonId, day);
	}

	private isWellnessEnabled(team: Team): boolean {
		return (team.goSettings || []).find(({ metricName }) => metricName === 'wellness')?.enabled;
	}

	private getMetricsList(team: Team): SelectItem[] {
		return [
			{ label: 'GO Score', value: 'go_score' },
			{ label: 'Sleep', value: 'wellness_sleep' },
			{ label: 'Sleep Hours', value: 'sleep_hours' },
			{ label: 'Stress', value: 'wellness_stress' },
			{ label: 'Fatigue', value: 'wellness_fatigue' },
			{ label: 'Soreness', value: 'wellness_soreness' },
			{ label: 'Mood', value: 'wellness_mood' },
			{ label: 'Workload', value: 'workload' },
			...team.goSettings.slice(1).map(({ testName, metricName }) => ({
				value: `${testName}_${metricName}`,
				label: `${testName} - ${metricName}`
			}))
		];
	}

	private getPlayers(seasonId: string, date: Date) {
		this.teamSeasonApi
			.getPlayers(seasonId, {
				where: {
					or: [
						{ archived: false },
						{ and: [{ archived: true }, { archivedDate: { gt: moment(date).endOf('day').toDate() } }] }
					]
				}
			})
			.pipe(
				map((players: Player[]) => (this.playerList = sortBy(players, 'displayName'))),
				untilDestroyed(this)
			)
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private getTeamReadiness() {
		this.readinessApi
			.getTeamReadiness(this.currentTeam.id, this.toServer.convert(this.selectedDate).toISOString())
			.pipe(
				map(values => sortBy(values, 'displayName')),
				untilDestroyed(this)
			)
			.subscribe({
				next: (values: ReadinessPlayerData[]) => (this.readinessList = values),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private getPlayerReadiness() {
		this.readinessPlayer$ = this.readinessApi
			.getPlayerReadiness(this.selectedPlayer?.id, this.toServer.convert(this.selectedDate).toISOString())
			.pipe(
				untilDestroyed(this),
				map((data: ReadinessPlayerData) => ({
					...data,
					readiness: data.readiness.filter(({ date }) => moment(date).isSame(moment(this.selectedDate), 'day'))
				}))
			);
	}

	private getPeriodReadiness() {
		if (!this.selectedPlayer) {
			this.selectedPlayer = this.playerList[0];
		}
		this.readinessPeriod$ = this.readinessApi
			.getPeriodReadiness(
				this.currentTeam.id,
				this.selectedPlayer?.id,
				this.toServer.convert(moment(this.selectedPeriod[0]).startOf('day').toDate()).toISOString(),
				this.toServer.convert(moment(this.selectedPeriod[1]).endOf('day').toDate()).toISOString()
			)
			.pipe(untilDestroyed(this));
	}

	getDateFormat(date: Date): string {
		return this.readinessService.getDateFormat(date);
	}

	setViewType(viewType: ReadinessViewType) {
		this.viewState = viewType;
	}

	onChangeTab({ index }) {
		if (index === 0) {
			this.sidebarState = ReadinessSidebarViewType.Session;
			this.onDateSelect(this.selectedDate);
		} else {
			this.sidebarState = ReadinessSidebarViewType.Period;
			if (isEmpty(this.selectedMetrics))
				this.selectedMetrics = [this.metricsList.find(({ value }) => value === 'go_score').value];
			this.getPeriodReadiness();
		}
	}

	onBackToTeamView() {
		this.sessionState = ReadinessSessionViewType.List;
		this.getTeamReadiness();
	}

	onDateSelect(date: Date) {
		this.selectedDate = moment(date).startOf('day').toDate();
		this.selectedPeriod = [
			moment(this.selectedDate).subtract(6, 'days').startOf('day').toDate(),
			moment(this.selectedDate).startOf('day').toDate()
		];
		if (this.sessionState === ReadinessSessionViewType.List) this.getTeamReadiness();
		else this.getPlayerReadiness();
	}

	onClickPlayerCard(player: Player) {
		this.sessionState = ReadinessSessionViewType.Detail;
		this.viewState = ReadinessViewType.Default;
		this.onPlayerSelect(player.id);
	}

	onPlayerSelect(id: string) {
		this.selectedPlayer = this.readinessList.find(({ id: playerId }) => playerId === id);
		this.getPlayerReadiness();
	}

	onPlayerPeriodSelect(id: string) {
		this.selectedPlayer = this.playerList.find(({ id: playerId }) => playerId === id);
		this.getPeriodReadiness();
	}

	onPeriodSelect() {
		if (this.selectedPeriod[1]) {
			this.selectedDate = this.selectedPeriod[1];
			this.getPeriodReadiness();
		}
	}

	onMetricSelect({ value }: SelectItem) {
		this.selectedMetrics = value;
		if (this.selectedMetrics.length > MAX_METRICS) {
			this.selectedMetrics = this.selectedMetrics.slice(0, MAX_METRICS);
		}
	}

	downloadPDF() {
		if (this.sidebarState === this.sidebarViews.Period) {
			this.periodComponent.downloadPDF();
		}
		else if (this.viewState === ReadinessViewType.Default && this.sessionState === ReadinessSessionViewType.List) {
			this.listComponent.downloadPDF();
		} else if (this.viewState === ReadinessViewType.Table) {
			this.tableComponent.downloadPDF();
		} 
	}

	downloadCSV() {
	    if(this.sidebarState === this.sidebarViews.Period) {
			this.periodComponent.downloadCSV();
		}
		else if (this.viewState === ReadinessViewType.Default) {
			this.listComponent.downloadCSV();
		} else {
			this.tableComponent.downloadCSV();
		}
	}
}
