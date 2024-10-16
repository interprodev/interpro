import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges
} from '@angular/core';
import {
	Goal,
	LoopBackAuth,
	ParsedMatchStat,
	ProviderType,
	ScoutingGame,
	ThirdPartyGameStats,
	ThirdPartyTeamDataDetail
} from '@iterpro/shared/data-access/sdk';
import { CapitalizePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { getScorers, toDisplayScorers } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, CapitalizePipe],
	selector: 'iterpro-scouting-event-match-stats',
	templateUrl: './scouting-event-match-stats.component.html',
	styleUrls: ['./scouting-event-match-stats.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoutingEventMatchStatsComponent implements OnChanges {
	@Input() game!: ScoutingGame;
	@Input() competitionName!: string;
	@Input() goals: Goal[] = [];
	@Input() stats!: ThirdPartyGameStats;
	@Input() parsedStats: ParsedMatchStat[] = [];
	@Input() homeTeamData!: ThirdPartyTeamDataDetail;
	@Input() awayTeamData!: ThirdPartyTeamDataDetail;
	@Input() homeTeamCrest!: string;
	@Input() awayTeamCrest!: string;
	@Input() isLeftPanelMaximized!: boolean;
	@Input() matchProvider!: ProviderType;
	@Input() hasProviderStatsAvailable!: boolean;
	@Output() toggleLeftPanelMaximize: EventEmitter<void> = new EventEmitter<void>();
	homeScorersDisplay!: string;
	awayScorersDisplay!: string;
	locale: string;

	constructor(private auth: LoopBackAuth, private translate: TranslateService) {
		this.locale = this.auth.getCurrentUserData().currentLanguage;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['goals']) {
			if (this.game && this.stats) {
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
			}
		}
	}

	private getScorers(goals: { goals: Goal[] }, teamId: number, opponentId: number): string {
		const scorers = getScorers(goals, { wyId: teamId }, false).concat(getScorers(goals, { wyId: opponentId }, true));
		return toDisplayScorers(scorers, this.translate.instant.bind(this.translate));
	}
}
