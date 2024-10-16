import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
	Goal,
	LoopBackAuth,
	ParsedMatchStat,
	ScoutingGameWithDetails,
	ThirdPartyGameStats,
	ThirdPartyTeamDataDetail
} from '@iterpro/shared/data-access/sdk';
import { gameStatsConfig, getScorers, toDisplayScorers } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'iterpro-scouting-event-match-stats',
	templateUrl: './scouting-event-match-stats.component.html',
	styleUrls: ['./scouting-event-match-stats.component.css']
})
export class ScoutingEventMatchStatsComponent implements OnChanges {
	@Input() game: ScoutingGameWithDetails;
	@Input() stats: ThirdPartyGameStats;
	@Input() goals: Goal[] = [];

	home: ThirdPartyTeamDataDetail;
	away: ThirdPartyTeamDataDetail;
	parsedStats: ParsedMatchStat[] = [];

	homeScorersDisplay: string = '';
	awayScorersDisplay: string = '';
	locale: string;

	constructor(private auth: LoopBackAuth, private translate: TranslateService) {
		this.locale = this.auth.getCurrentUserData().currentLanguage;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['game'] || changes['stats'] || changes['goals']) {
			if (this.game && this.game.teamsData && this.stats) {
				this.updateComponent();
			}
		}
	}

	private updateComponent() {
		this.home = this.game.teamsData[this.game.thirdPartyProviderHomeTeamId];
		this.away = this.game.teamsData[this.game.thirdPartyProviderAwayTeamId];

		const goals = { goals: this.goals };
		this.homeScorersDisplay = this.getScorers(
			goals,
			this.game.thirdPartyProviderHomeTeamId,
			this.game.thirdPartyProviderAwayTeamId
		);
		this.awayScorersDisplay = this.getScorers(
			goals,
			this.game.thirdPartyProviderAwayTeamId,
			this.game.thirdPartyProviderHomeTeamId
		);

		this.parsedStats = this.parseStats();
	}

	private parseStats(): ParsedMatchStat[] {
		const homeStats: any = this.stats.find(({ teamId }) => teamId === this.game.thirdPartyProviderHomeTeamId);
		const awayStats: any = this.stats.find(({ teamId }) => teamId === this.game.thirdPartyProviderAwayTeamId);
		return gameStatsConfig.map(item => {
			const home = !!homeStats ? +Number(homeStats[item.type][item.value]).toFixed(1) : undefined;
			const away = !!awayStats ? +Number(awayStats[item.type][item.value]).toFixed(1) : undefined;
			let homePercentage = home ? 100 : 0;
			let awayPercentage = away ? 100 : 0;
			if (home && away) {
				if (home > away) {
					awayPercentage = +Number(((100 * away) / home).toFixed(1));
				} else if (away > home) {
					homePercentage = +Number(((100 * home) / away).toFixed(1));
				}
			}
			const parsedStat: ParsedMatchStat = {
				away,
				awayPercentage,
				home,
				homePercentage,
				label: item.label
			};
			return parsedStat;
		});
	}

	private getScorers(goals: { goals: Goal[] }, teamId: number, opponentId: number): string {
		const scorers = getScorers(goals, { wyId: teamId }, false).concat(getScorers(goals, { wyId: opponentId }, true));
		return toDisplayScorers(scorers, this.translate.instant.bind(this.translate));
	}
}
