import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { ExtendedPlayerScouting, Player, PlayerAttributesEntry, Team } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	completeWithAdditionalFields,
	getBasicDevelopmentChartData, getTeamsPlayerAttributes,
	sortByDate
} from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { ChartOptions } from 'chart.js';
import { Moment } from 'moment';

@Component({
	standalone: true,
	imports: [PrimeNgModule],
	selector: 'iterpro-player-development',
	template: `<p-chart type="line" [options]="options" [data]="chartData" [height]="'500px'"></p-chart> `
})
export class PlayerDevelopmentComponent implements OnInit, OnChanges {
	@Input() player!: Player | ExtendedPlayerScouting;
	@Input() playerDescriptionSetting!: 'tipss' | 'attributes';
	@Input() team!: Team;
	@Input() type!: 'Player' | 'PlayerScouting';
	options!: ChartOptions;
	chartData!: { labels: Moment[]; datasets: any[] };
	playerAttributesEntries!: PlayerAttributesEntry[];

	readonly #translateService = inject(TranslateService);

	ngOnInit(): void {
		this.loadPlayerAttributesEntries();
		this.loadChartData();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['player'] && changes['player'].currentValue) {
			this.player.attributes = sortByDate(this.player?.attributes || [], 'date');
			this.loadPlayerAttributesEntries();
			this.loadChartData();
		}
	}

	private loadPlayerAttributesEntries() {
		if (this.player?.attributes?.length > 0) {
			this.playerAttributesEntries = this.player?.attributes.map(item =>
				completeWithAdditionalFields(item,
					getTeamsPlayerAttributes([this.team]),
					this.type,
					this.team?.club?.scoutingSettings)
			);
		}
	}

	private loadChartData() {
		const chartResult = getBasicDevelopmentChartData(
			this.playerAttributesEntries || [],
			this.playerDescriptionSetting === 'attributes',
			this.team.club.scoutingSettings,
			this.#translateService
		);
		this.chartData = chartResult.data;
		this.options = chartResult.options;
	}
}
