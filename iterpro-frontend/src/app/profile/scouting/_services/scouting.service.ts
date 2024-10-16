import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	ClubApi,
	ClubSeason,
	ClubSeasonApi,
	Customer,
	LoopBackAuth,
	Player,
	PlayerApi,
	PlayerScouting,
	PlayerScoutingApi,
	ScoutingLineup,
	ScoutingLineupApi,
	ScoutingSettings,
	TeamApi,
	TeamSeason,
	TeamSeasonApi
} from '@iterpro/shared/data-access/sdk';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getTeamSettings } from '@iterpro/shared/utils/common-utils';

@Injectable({
	providedIn: 'root'
})
export class ScoutingService {
	constructor(
		private auth: LoopBackAuth,
		private currentTeamService: CurrentTeamService,
		private clubApi: ClubApi,
		private clubSeasonsApi: ClubSeasonApi,
		private playerApi: PlayerApi,
		private teamSeasonApi: TeamSeasonApi,
		private teamApi: TeamApi,
		private scoutingLineupApi: ScoutingLineupApi,
		private playerScoutingApi: PlayerScoutingApi
	) {}

	requestTeamSeasons(): Observable<TeamSeason[]> {
		return this.teamSeasonApi.find<TeamSeason>({
			where: { teamId: this.auth.getCurrentUserData().currentTeamId },
			fields: ['id', 'name', 'offseason', 'inseasonEnd'],
			order: 'offseason ASC'
		});
	}

	requestClubScoutingFlag() {
		const { currentTeamId } = this.auth.getCurrentUserData();
		return this.clubApi
			.findById(this.currentTeamService.getCurrentTeam().clubId, {
				include: {
					relation: 'customers',
					scope: {
						fields: ['id', 'firstName', 'lastName', 'email'],
						include: {
							relation: 'teamSettings'
						}
					}
				},
				fields: ['id', 'scoutingSettings', 'customers']
			})
			.pipe(
				map(({ scoutingSettings, customers }: { scoutingSettings: ScoutingSettings; customers: Customer[] }) => ({
					scoutingSettings,
					scoutCustomers: (customers || []).filter(({ teamSettings }) => {
						const currentTeamSettings = getTeamSettings(teamSettings, currentTeamId);
						return (currentTeamSettings?.permissions || []).includes('scouting-games');
					})
				}))
			);
	}

	requestClubSeasons(): Observable<ClubSeason[]> {
		return this.clubSeasonsApi.find<ClubSeason>({
			where: {
				clubId: this.auth.getCurrentUserData().clubId
			},
			fields: ['id', 'name', '_transferWindows']
		});
	}

	requestClubPlayers(): Observable<Player[]> {
		return this.playerApi.find({
			where: { clubId: this.auth.getCurrentUserData().clubId },
			fields: [
				'id',
				'wyscoutId',
				'instatId',
				'displayName',
				'downloadUrl',
				'archived',
				'attributes',
				'position',
				'nationality',
				'birthDate',
				'foot'
			]
		});
	}

	requestScoutingPlayers(): Observable<PlayerScouting[]> {
		return this.teamApi.getObservedScouting(this.auth.getCurrentUserData().currentTeamId);
	}

	requestScoutingScenarios(): Observable<ScoutingLineup[]> {
		return this.scoutingLineupApi.find({ where: { teamId: this.auth.getCurrentUserData().currentTeamId } });
	}

	requestClubScoutingPlayers(): Observable<PlayerScouting[]> {
		return this.playerScoutingApi.find({
			where: { clubId: this.auth.getCurrentUserData().clubId },
			fields: ['id', 'wyscoutId', 'instatId', 'displayName', 'archived', 'teamId']
		});
	}
}
