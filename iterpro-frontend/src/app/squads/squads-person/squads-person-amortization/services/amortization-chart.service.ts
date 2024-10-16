import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { EmploymentContract, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { ShortNumberPipe } from '@iterpro/shared/ui/pipes';
import {
	PRIMARIES,
	formatLabel,
	getDefaultCartesianConfig,
	getTimeseriesXAxis
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { flatten, last } from 'lodash';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { AmortizationCommonService } from './amortization-common.service';
const moment = extendMoment(Moment);

@Injectable({
	providedIn: 'root'
})
export class AmortizationChartService {
	constructor(
		private numberPipe: DecimalPipe,
		private shortNumber: ShortNumberPipe,
		private translate: TranslateService,
		private currentTeamService: CurrentTeamService,
		private amortizationCommonService: AmortizationCommonService
	) {}

	getChartData(
		amortization: any[],
		residual: any[],
		renewChain: EmploymentContract[],
		seasons: TeamSeason[],
		unit: number,
		cols: any[],
		units: any[]
	): any {
		return unit === 1 || unit === 2
			? this.getSeriesData(amortization, residual, unit, cols, units)
			: this.getTimeSeriesData(amortization, residual, renewChain, seasons, unit, cols);
	}

	private getSeriesData(amortization: any[], residual: any[], unit: number, cols: any[], units: any[]): any {
		const data = [
			{
				data: flatten(residual),
				label: this.translate.instant('forecast.residual'),
				backgroundColor: 'rgba(249,93,106, 0.5)',
				borderColor: PRIMARIES[1],
				pointBorderColor: PRIMARIES[1],
				pointBackgroundColor: PRIMARIES[1],
				pointHoverBackgroundColor: PRIMARIES[1],
				borderWidth: 2,
				pointHoverBorderColor: '#fff',
				// cubicInterpolationMode: 'monotone',
				tension: 0,
				spanGaps: true,
				fill: 'start'
			},
			{
				data: flatten(amortization),
				label: this.translate.instant('forecast.amortization'),
				backgroundColor: 'rgba(255,166,0, 0.5)',
				borderColor: PRIMARIES[0],
				pointBorderColor: PRIMARIES[0],
				pointBackgroundColor: PRIMARIES[0],
				pointHoverBackgroundColor: PRIMARIES[0],
				borderWidth: 2,
				pointHoverBorderColor: '#fff',
				// cubicInterpolationMode: 'monotone',
				tension: 0,
				spanGaps: true,
				fill: 'start'
			}
		];

		return {
			datasets: data,
			labels: flatten(
				amortization.map((col, i) =>
					col.map(
						(value, j) =>
							`Season ${cols[i]}${
								unit !== 1 ? ` ${this.amortizationCommonService.getUnitLabel(units, unit)} ${j + 1}` : ``
							}`
					)
				)
			).map(x => formatLabel(x, 7))
		};
	}

	private getTimeSeriesData(
		amortization: any[],
		residual: any[],
		renewChain: EmploymentContract[],
		seasons: TeamSeason[],
		unit: number,
		cols: any[]
	): any {
		const firstSeason = this.amortizationCommonService.getSeasonForDate(renewChain[0].dateFrom, seasons);
		const range = moment.range(firstSeason.offseason, last(renewChain).dateTo);
		const momentArray = Array.from(range.by(unit === 4 ? 'quarter' : 'month'));

		const data = [
			{
				data: flatten(residual)
					.filter((x, i) => momentArray[i])
					.map((x, i) => ({ x: momentArray[i], y: x })),
				label: this.translate.instant('forecast.residual'),
				backgroundColor: 'rgba(249,93,106, 0.5)',
				borderColor: PRIMARIES[1],
				pointBorderColor: PRIMARIES[1],
				pointBackgroundColor: PRIMARIES[1],
				pointHoverBackgroundColor: PRIMARIES[1],
				borderWidth: 2,
				pointHoverBorderColor: '#fff',
				// cubicInterpolationMode: 'monotone',
				tension: 0,
				spanGaps: true,
				fill: 'start'
			},
			{
				data: flatten(amortization)
					.filter((x, i) => momentArray[i])
					.map((x, i) => ({ x: momentArray[i], y: x })),
				label: this.translate.instant('forecast.amortization'),
				backgroundColor: 'rgba(255,166,0, 0.5)',
				borderColor: PRIMARIES[0],
				pointBorderColor: PRIMARIES[0],
				pointBackgroundColor: PRIMARIES[0],
				pointHoverBackgroundColor: PRIMARIES[0],
				borderWidth: 2,
				pointHoverBorderColor: '#fff',
				// cubicInterpolationMode: 'monotone',
				tension: 0,
				spanGaps: true,
				fill: 'start'
			}
		];

		return {
			datasets: data
		};
	}

	getChartOptions(unit: number, language: string): any {
		const options = {
			...getDefaultCartesianConfig(),
			responsive: true,
			mainAspectRatio: true
		};
		options.scales.x.ticks.font = { size: 15 };
		if (unit === 4 || unit === 12) {
			options.scales.x = getTimeseriesXAxis(options.scales.x, null, 'month');
			options.scales.x.ticks.source = 'data';
		}
		options.scales.y.ticks.font = { size: 15 };
		options.scales.y.ticks.callback = (value: number, index, vals) => this.shortNumber.transform(value, true);

		options.plugins.tooltip = {
			mode: 'index',
			intersect: false,
			callbacks: {
				label: (tooltipItem: any) => {
					return `${this.currentTeamService.getCurrency()}${this.numberPipe.transform(
						tooltipItem.raw.y || tooltipItem.raw,
						'0.0-3',
						language
					)}`;
				},
				title: (item): string => item[0].label.split(',').join(' ')
			}
		};
		return options;
	}
}
