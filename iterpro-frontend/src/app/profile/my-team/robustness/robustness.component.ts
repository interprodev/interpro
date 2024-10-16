import { Component, Injector, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	ChronicInjury,
	Customer,
	Injury,
	Player,
	PlayerApi,
	RobustnessData,
	TeamSeason
} from '@iterpro/shared/data-access/sdk';
import { AlertService, ErrorService, RobustnessService } from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ChartData, ChartOptions } from 'chart.js';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { SeasonStoreSelectors } from 'src/app/+state';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { RobustnessChartService } from './robustness-chart.service';

const moment = extendMoment(Moment);

@UntilDestroy()
@Component({
	selector: 'iterpro-robustness',
	templateUrl: './robustness.component.html',
	styleUrls: ['./robustness.component.css']
})
export class RobustnessComponent extends EtlBaseInjectable implements OnInit, OnDestroy, OnChanges {
	@Input() player: Player;
	@Input() customer: Customer;
	@Input() seasons: TeamSeason[];

	dataTimeline: ChartData;
	optionsTimeline: ChartOptions;
	dataPie: ChartData;
	optionsPie: ChartOptions;
	robustnessData: RobustnessData;

	private selectedSeason: TeamSeason;

	constructor(
		private store$: Store<RootStoreState>,
		private error: ErrorService,
		private translate: TranslateService,
		private robustnessService: RobustnessService,
		private currentTeamService: CurrentTeamService,
		private chartService: RobustnessChartService,
		private router: Router,
		private playerApi: PlayerApi,
		private notificationService: AlertService,
		injector: Injector
	) {
		super(injector);
	}

	ngOnDestroy() {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player'] && this.player) {
			this.init();
		}
	}

	ngOnInit() {
		this.translate.getTranslation(this.translate.currentLang).subscribe();
	}

	getBackgroundColor(value) {
		if (value === 'fit') return { 'background-color': 'green' };
		else if (value === 'complaint') return { 'background-color': 'yellow' };
		else if (value === 'illness') return { 'background-color': 'purple' };
		else if (value === 'injury') return { 'background-color': 'red' };
		else return { 'background-color': 'green' };
	}

	goToDetails(injury: Injury) {
		return this.router.navigate(['/medical/infirmary', { id: injury.id }]);
	}

	goToDetailsChronic(injury: ChronicInjury) {
		return this.router.navigate(['/medical/maintenance', { id: this.player.id, chronicInjuryId: injury.id }]);
	}

	goToChronic() {
		return this.router.navigate(['/medical/maintenance', { id: this.player.id }]);
	}

	refreshRobustness() {
		this.playerApi
			.triggerRobustnessUpdate(this.player.id, this.selectedSeason.id, this.currentTeamService.getCurrentTeam().id)
			.subscribe({
				next: () => this.notificationService.notify('info', 'Robustness', 'robustness.refreshRequested', false),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private init() {
		this.store$
			.select(SeasonStoreSelectors.selectDefault)
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (value: TeamSeason) => this.handleSeasonSelect({ value }),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private handleSeasonSelect({ value }: { value: TeamSeason }) {
		this.selectedSeason = value ? value : this.currentTeamService.getCurrentSeason();
		this.getData()
			.pipe(first())
			.subscribe({
				next: (results: any) => {
					this.robustnessData = this.player.id in results ? results[this.player.id] : {};
					this.robustnessData.availability =
						this.robustnessData.availability !== null ||
						this.robustnessData.availability !== undefined ||
						!isNaN(this.robustnessData.availability)
							? +Number(this.robustnessData.availability).toFixed(1)
							: null;
					this.renderPie();
					this.renderTimeline();
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private getData(): Observable<RobustnessData> {
		return this.robustnessService.profileRobustness(
			this.selectedSeason.id,
			[this.player.id],
			this.selectedSeason.offseason,
			moment(this.selectedSeason.inseasonEnd).isBefore(moment())
				? this.selectedSeason.inseasonEnd
				: moment().endOf('day').toDate(),
			this.etlPlayerService.getDurationField().metricName,
			2
		);
	}

	private renderTimeline() {
		const { data, options } = this.chartService.getTimelineChart(this.selectedSeason, this.robustnessData);
		this.dataTimeline = data;
		this.optionsTimeline = options;
	}

	private renderPie() {
		this.dataPie = this.chartService.getChartPieData(this.robustnessData);
		this.optionsPie = this.chartService.getChartPieOptions();
	}
}
