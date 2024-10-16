import { RootStoreState } from '../../../+state/root-store.state';
import { CurrencyPipe } from '@angular/common';
import { Component, Injector, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Player } from '@iterpro/shared/data-access/sdk';
import { SportType, getLimb } from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { getChart, getHealthTooltip } from '../utils/utils';

@UntilDestroy()
@Component({
	selector: 'iterpro-admin-dashboard-player',
	templateUrl: './admin-dashboard-player.component.html',
	styleUrls: ['./admin-dashboard-player.component.css'],
	providers: [CurrencyPipe]
})
export class AdminDashboardPlayerComponent extends EtlBaseInjectable implements OnChanges, OnInit {
	@Input() player: Player;
	@Input() playerData: any;

	currency: string;

	plugins = [
		{
			afterDraw: chart => {
				if (chart.config.options.elements.center) {
					const ctx = chart.ctx;
					const centerConfig = chart.config.options.elements.center;
					const fontStyle = centerConfig.fontStyle || 'Gotham';
					const txt = centerConfig.text;
					const color = centerConfig.color || '#000';
					const sidePadding = centerConfig.sidePadding || 20;
					const sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2);
					ctx.font = '30px ' + fontStyle;
					const stringWidth = ctx.measureText(txt).width;
					const elementWidth = chart.innerRadius * 2 - sidePaddingCalculated;
					const widthRatio = elementWidth / stringWidth;
					const newFontSize = Math.floor(30 * widthRatio);
					const elementHeight = chart.innerRadius * 2;
					const fontSizeToUse = Math.min(newFontSize, elementHeight);
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
					const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
					ctx.font = fontSizeToUse + 'px ' + fontStyle;
					ctx.fillStyle = color;
					ctx.fillText(txt, centerX, centerY);
				}
			}
		}
	];
	data: any;
	options: any;
	availability: number;
	performanceReliability: number;
	sportType: SportType;
	age: number;

	constructor(
		private store$: Store<RootStoreState>,
		private translate: TranslateService,
		private currentTeamService: CurrentTeamService,
		injector: Injector
	) {
		super(injector);
		this.store$
			.select(AuthSelectors.selectSportType)
			.pipe(untilDestroyed(this))
			.subscribe({ next: (type: SportType) => (this.sportType = type) });
	}

	ngOnInit() {
		this.currency = this.currentTeamService.getCurrency();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['playerData'] && this.playerData) {
			this.extractResults();
			this.renderCharts();
		}
	}

	reset() {
		this.player = null;
		this.playerData = null;
		this.data = null;
		this.availability = null;
		this.performanceReliability = null;
	}

	renderCharts() {
		[this.data, this.options] = this.getChart();
	}

	getChart() {
		return getChart(this.playerData, this.translate);
	}

	extractResults() {
		this.age = moment().diff(moment(this.player.birthDate), 'year');
		this.availability = Number(this.playerData.availability);
		this.performanceReliability = Number(this.playerData.performanceReliability);
	}

	getPlayerPic() {
		return this.player.downloadUrl;
	}

	getBackgroundColor(value) {
		if (value < 60) return 'red';
		else if (value < 75) return 'yellow';
		else return 'green';
	}

	getIcon(status) {
		if (status === 'notAvailable') return 'fas fa-ambulance bordered-red';
		else if (status === 'careful') return 'fas fa-exclamation-triangle bordered-yellow';
		else if (status === 'injury') return 'fas fa-band-aid';
		else if (status === 'complaint') return 'fas fa-frown';
		else if (status === 'illness') return 'fas fa-thermometer-three-quarters';
		else return 'fas fa-check';
	}

	getHealthTooltip(status) {
		return this.translate.instant(getHealthTooltip(status));
	}

	getPlayerFoot(foot) {
		return this.translate.instant('foot.' + foot);
	}

	getLimb() {
		return getLimb(this.sportType);
	}
}
