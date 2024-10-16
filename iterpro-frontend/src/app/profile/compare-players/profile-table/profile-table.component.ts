import { Component, Input } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Player, Team } from '@iterpro/shared/data-access/sdk';
import { SportType, getLimb } from '@iterpro/shared/utils/common-utils';

interface ComparePlayer extends Player {
	marketValue: number;
	contractExpiry: Date;
	monthlyWage: number;
}

@Component({
	selector: 'iterpro-profile-table',
	templateUrl: './profile-table.component.html',
	styleUrls: ['./profile-table.component.css']
})
export class ProfileTableComponent {
	@Input() player: ComparePlayer;
	@Input() team: Team;
	@Input() left = true;
	@Input() sportType: SportType;
	currency: string;

	constructor(private currentTeamService: CurrentTeamService) {
		this.currency = this.currentTeamService.getCurrency();
	}

	getLimb() {
		return getLimb(this.sportType);
	}
}
