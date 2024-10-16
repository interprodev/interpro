import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoopBackAuth, Player, Team, TeamApi } from '@iterpro/shared/data-access/sdk';
import { ErrorService, sortByDate } from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
	templateUrl: './admin-dashboard.component.html',
	styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
	teams: Team[];
	players: Player[] = [];
	selectedTeam: Team;
	selectedPlayerId: string;

	@BlockUI('chart') chartBlockUI: NgBlockUI;

	constructor(
		private readonly teamApi: TeamApi,
		private readonly auth: LoopBackAuth,
		private readonly error: ErrorService
	) {}

	ngOnDestroy() {}

	ngOnInit() {
		// const { clubId } = this.auth.getCurrentUserData();
		// const teams$ = this.teamApi.find({
		// 	where: { clubId },
		// 	include: [
		// 		{
		// 			relation: 'teamSeasons',
		// 			scope: {
		// 				fields: ['offseason', 'inseasonEnd', 'id', 'name', 'playerIds']
		// 			}
		// 		}
		// 	]
		// });

		// teams$
		// 	.pipe(
		// 		map((teams: Team[]) => {
		// 			this.teams = teams.map((team: any) => {
		// 				team.teamSeasons = sortByDate(team.teamSeasons, 'offseason').reverse();
		// 				return team;
		// 			});
		// 			this.selectedTeam = this.teams.find(({ id }) => id === this.auth.getCurrentUserData().currentTeamId);
		// 		}),
		// 		untilDestroyed(this)
		// 	)
		// 	.subscribe({
		// 		error: (error: Error) => {
		// 			this.error.handleError(error);
		// 		}
		// 	});
	}
}
