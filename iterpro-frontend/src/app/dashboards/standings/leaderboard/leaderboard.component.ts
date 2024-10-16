import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Team } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-leaderboard',
	templateUrl: './leaderboard.component.html',
	styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnChanges {
	@Input({ required: true }) data: any;
	@Input({ required: true }) team: Team;
	@Input({ required: true }) isLoading: boolean;

	teams: any[] = [];
	competition: any;
	providerField: string;

	ngOnChanges(changes: SimpleChanges) {
		if (changes['data'] && this.data) {
			this.teams = this.data.teams || [];
			this.competition = this.data.competition;
		}
		if (changes['team'] && this.team) {
			this.providerField = this.team.providerTeam === 'Wyscout' ? 'wyscoutId' : 'instatId';
		}
	}

	isCurrentTeam(teamId: number): boolean {
		return teamId === this.team[this.providerField];
	}
}
