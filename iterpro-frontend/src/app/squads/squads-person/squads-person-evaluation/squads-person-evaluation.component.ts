import { DecimalPipe } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Player, PlayerValue } from '@iterpro/shared/data-access/sdk';
import { CustomCurrencyPipe, ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	AzureStoragePipe,
	ErrorService,
	ExchangeService,
	PRIMARIES,
	ProviderIntegrationService,
	ReportService,
	SportType,
	getDefaultCartesianConfig,
	sortByDate,
	WORKLOAD_COLORS
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, last } from 'lodash';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { of } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { getReport } from './report';
import { Store } from '@ngrx/store';
import { RootStoreState } from 'src/app/+state/root-store.state';

const moment = extendMoment(Moment);

const getPlayerPastValues = player => {
	if (!player.valueField || player.valueField === 'value') return player._pastValues || [];
	else if (player.valueField === 'clubValue') return player._pastClubValues || [];
	else if (player.valueField === 'agentValue') return player._pastAgentValues || [];
	else if (player.valueField === 'transfermarktValue') return player._pastTransfermarktValues || [];
};

@UntilDestroy()
@Component({
	selector: 'iterpro-squads-person-evaluation',
	templateUrl: './squads-person-evaluation.component.html',
	styleUrls: ['./squads-person-evaluation.component.css'],
	providers: [CustomCurrencyPipe]
})
export class SquadsPersonEvaluationComponent implements OnChanges {
	@Input() player: Player;
	@Input() editMode: any;

	transFlag = false;
	club: any;
	compType = false;
	nationals: any;
	transfers: any[] = [];
	career: any[] = [];
	competitions: any[] = [];
	evaluation: any;
	pastValues: any[] = [];
	insertDialog: boolean;
	showMarketTrend = false;
	options: any;
	data: any;
	valueToAdd: PlayerValue;
	tempValues: any;
	today: any;
	yearRange: string;
	editDialog: boolean;
	valuesToEdit: PlayerValue[];
	whichValues: any;
	currency: string;
	currencyCode: string;
	rate: any;
	sportType: string = 'football';

	constructor(
		private store$: Store<RootStoreState>,
		private translate: TranslateService,
		private reportService: ReportService,
		private shortNumber: ShortNumberPipe,
		private azureUrlPipe: AzureStoragePipe,
		private decimal: DecimalPipe,
		private currentTeamService: CurrentTeamService,
		private error: ErrorService,
		private exchangeService: ExchangeService,
		private providerIntegrationService: ProviderIntegrationService
	) {
		this.store$
			.select(AuthSelectors.selectSportType)
			.pipe(untilDestroyed(this))
			.subscribe({ next: (type: SportType) => (this.sportType = type) });
		this.translate
			.getTranslation(this.translate.currentLang)
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				this.transFlag = true;
				this.today = moment().toDate();
				this.yearRange = `${1990}:${moment().format('YYYY')}`;
			});
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['player'] && this.player) {
			this.init();
		}
	}

	private init() {
		const obs = this.providerIntegrationService.getPlayerCareerTransfers(this.player); // TODO wrap into a general thirdParty service
		obs
			.pipe(
				first(),
				untilDestroyed(this),
				map(evaluation => (this.evaluation = evaluation))
			)
			.subscribe({
				next: () => this.onDataArrived(),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private onDataArrived() {
		this.club = this.evaluation.career.filter(x => x.competition && x.competition.type.toString() === 'club').reverse();
		this.nationals = this.evaluation.career
			.filter(x => x.competition && x.competition.type.toString() === 'international')
			.reverse();
		this.career = this.club;
		this.competitions = this.getCompetitionList(this.career);
		this.getExchangeRates();
		this.extractPastValues(this.player);
	}

	getExchangeRates() {
		this.currency = this.currentTeamService.getCurrency();
		this.currencyCode = this.currentTeamService.getCurrencyCode();
		const obs =
			this.currencyCode !== 'EUR'
				? this.exchangeService.exchange(this.currencyCode)
				: of({
						rates: { EUR: 1 }
				  });
		obs
			.pipe(
				first(),
				untilDestroyed(this),
				map((res: any) => {
					this.rate = res.rates[this.currencyCode];
					return res;
				})
			)
			.subscribe({
				next: () => this.sortTransfers(),
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private sortTransfers() {
		this.transfers = sortByDate(this.evaluation.transfers, 'startDate').reverse();
		this.transfers.forEach(x => {
			x.currency = this.currencyCode;
			x.value = `${this.currency} ${this.decimal.transform(x.value * this.rate, '', 'it-IT')}`;
		});
	}

	getReportData() {
		return getReport(this, this.azureUrlPipe);
	}

	getReport() {
		const data = this.getReportData();
		this.reportService
			.getImage(data.image)
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: image => {
					this.reportService.getReport('admin_valuation', { ...data, image });
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	filter(event) {
		this.career = this.evaluation.career.filter(
			x => x.competition.type.toString() === 'club' && event.value.includes(x.competition.name)
		);
	}

	getCompetitionList(career) {
		let comp = career.map(x => x.competition.name);
		comp = comp.filter((x, index, self) => self.indexOf(x) === index);
		return comp.map(x => ({ label: x, value: x }));
	}

	switchCompType(event, dt) {
		if (this.compType === false) {
			dt.reset();
			this.career = this.club;
			this.competitions = this.getCompetitionList(this.career);
		} else {
			dt.reset();
			this.career = this.nationals;
			this.competitions = this.getCompetitionList(this.career);
		}
	}

	extractPastValues(player: Player) {
		this.pastValues = sortByDate(getPlayerPastValues(player), 'date').reverse();
		this.renderChart(this.shortNumber);
	}

	openInsertDialog(values) {
		this.tempValues = cloneDeep(this.pastValues);
		this.insertDialog = true;
		this.valueToAdd = new PlayerValue();
		this.whichValues = values;
	}

	save(value) {
		this.player[this.whichValues] = this.player[this.whichValues]
			? sortByDate([...this.player[this.whichValues], value], 'date')
			: [value];
		switch (this.whichValues) {
			case '_pastValues': {
				this.player.value = last(this.player._pastValues) ? last(this.player._pastValues).value : null;
				break;
			}
			case '_pastTransfermarktValues': {
				this.player.transfermarktValue = last(this.player._pastTransfermarktValues)
					? last(this.player._pastTransfermarktValues).value
					: null;
				break;
			}
			case '_pastClubValues': {
				this.player.clubValue = last(this.player._pastClubValues) ? last(this.player._pastClubValues).value : null;
				break;
			}
			case '_pastAgentValues': {
				this.player.agentValue = last(this.player._pastAgentValues) ? last(this.player._pastAgentValues).value : null;
				break;
			}
		}
		this.insertDialog = false;
		this.extractPastValues(this.player);
	}

	discard() {
		this.insertDialog = false;
		this.pastValues = cloneDeep(this.tempValues);
		this.valueToAdd = null;
	}

	openEditDialog(values) {
		this.valuesToEdit = cloneDeep(this.player[values]);
		this.editDialog = true;
		this.whichValues = values;
	}

	saveValues(values) {
		this.player[this.whichValues] = sortByDate(values, 'date');
		switch (this.whichValues) {
			case '_pastValues': {
				this.player.value = last(this.player._pastValues) ? last(this.player._pastValues).value : null;
				break;
			}
			case '_pastTransfermarktValues': {
				this.player.transfermarktValue = last(this.player._pastTransfermarktValues)
					? last(this.player._pastTransfermarktValues).value
					: null;
				break;
			}
			case '_pastClubValues': {
				this.player.clubValue = last(this.player._pastClubValues) ? last(this.player._pastClubValues).value : null;
				break;
			}
			case '_pastAgentValues': {
				this.player.agentValue = last(this.player._pastAgentValues) ? last(this.player._pastAgentValues).value : null;
				break;
			}
		}
		this.editDialog = false;
		this.extractPastValues(this.player);
		// this.renderChart(this.shortNumber);
	}

	discardValues() {
		this.insertDialog = false;
		this.valuesToEdit = null;
	}

	delete(index: number) {
		this.valuesToEdit.splice(index, 1);
	}

	toggleMarketTrend() {
		this.showMarketTrend = !this.showMarketTrend;
	}

	private renderChart(shortNumber) {
		this.data = null;
		if (this.pastValues) {
			const values = this.pastValues.reverse();
			this.data = {
				labels: values.map(x => moment(x.date).toDate()),
				datasets: [
					{
						// data: values.map(x => this.decimal.transform(x.value, '0.0-0', this.translate.currentLang)),
						data: values.map(x => x.value),
						label: this.translate.instant(`admin.evaluation.${this.player.valueField}`),
						pointHoverBorderColor: '#fff',
						borderColor: PRIMARIES[0],
						pointBorderColor: PRIMARIES[0],
						pointBackgroundColor: PRIMARIES[0],
						pointHoverBackgroundColor: PRIMARIES[0],
						cubicInterpolationMode: 'monotone',
						spanGaps: true
					}
				]
			};
		}
		this.options = getDefaultCartesianConfig();
		this.options.responsive = true;
		this.options.maintainAspectRatio = false;
		this.options.animation = false;
		this.options.plugins.legend.display = false;
		this.options.scales.y.ticks.callback = (value, index, vals) =>
			`${this.currentTeamService.getCurrency()}${shortNumber.transform(value, true)}`;

		this.options.scales.x.type = 'time';
		this.options.scales.x.offset = true;
		this.options.scales.x.distribution = 'linear';
		this.options.scales.x.bounds = 'ticks';
		this.options.scales.x.time = {
			minUnit: 'month',
			maxUnit: 'quarter',
			displayFormats: {
				month: 'MMM YY',
				quarter: 'MMM YY'
			}
		};
		this.options.plugins.tooltip = {
			enabled: true,
			callbacks: {
				label: (tooltipItem) => {
					const value = tooltipItem.raw;
					const formattedValue = this.decimal.transform(value, '0.0-0', this.translate.currentLang);
					return `${tooltipItem.dataset.label}: ${formattedValue}`;
				}
			},
			backgroundColor: 'rgba(0, 0, 0, 0.7)',
			titleColor: WORKLOAD_COLORS[0],
			bodyColor: WORKLOAD_COLORS[0],
			borderColor: WORKLOAD_COLORS[0],
			borderWidth: 1,
		};
	}

	isSelected(value) {
		return this.player.valueField === value ? 'bold' : 'unset';
	}
}
