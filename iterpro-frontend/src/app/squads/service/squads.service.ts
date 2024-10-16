import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	Agent,
	Club,
	ClubApi,
	ContractPersonType,
	Customer,
	LoopBackAuth,
	Player,
	PlayerApi,
	Staff,
	TeamApi
} from '@iterpro/shared/data-access/sdk';
import * as moment from 'moment';
import { Observable, of } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { getActiveTeams } from '@iterpro/shared/utils/common-utils';

interface PlayerList {
	[key: string]: Player;
}

export interface SquadPlayersFilter {
	team?: string[];
	text?: string;
	status?: Array<'active' | 'archived'>;
	contractNotarizationStatus?: Array<
		| 'outwardContractNotarized'
		| 'outwardContractNOTNotarized'
		| 'inwardContractNotarized'
		| 'inwardContractNOTNotarized'
		| 'currentContractNotarized'
		| 'currentContractNOTNotarized'
	>;
	season?: string;
	nationality?: string[];
	role?: ContractPersonType;
	birthYear?: number[];
	origin?: Array<'abroad' | 'abroadExtra' | 'domestic' | 'homegrown' | 'not set'>;
	contractType?: Array<'freeTransfer' | 'purchased' | 'inTeamOnLoan' | 'homegrown' | 'sell' | 'onLoan'>;
	contractExpiryYear?: number[];
	netValueFlag?: boolean;
	feeFrom?: number;
	feeTo?: number;
	wageFrom?: number;
	wageTo?: number;
	position?: string[];
}

export interface SquadPlayersPageInfo {
	page?: number;
	sortBy?: string;
	order?: 'ASC' | 'DESC';
	filter?: SquadPlayersFilter;
}
export interface SquadPeopleResult {
	people: Player[] | Staff[];
	totalRows: number;
}
@Injectable({
	providedIn: 'root'
})
export class SquadsService {
	private singlePlayers: PlayerList = {};

	constructor(
		private auth: LoopBackAuth,
		private clubApi: ClubApi,
		private playerApi: PlayerApi,
		private currentTeamService: CurrentTeamService,
		private teamApi: TeamApi
	) {}

	requestClubPlayers(): Observable<Player[]> {
		return this.playerApi.find({
			where: { clubId: this.auth.getCurrentUserData().clubId },
			fields: ['id', 'wyscoutId', 'instatId', 'displayName', 'archived', 'teamId']
		});
	}

	getSquadPeople(
		club: Club,
		role: string,
		squadsPlayersPageInfo?: SquadPlayersPageInfo,
		idPlayer: string = ''
	): Observable<SquadPeopleResult> {
		const squadParams: SquadPlayersPageInfo = {
			...{ page: 0, sortBy: '', order: 'ASC', filter: undefined },
			...squadsPlayersPageInfo
		};
		if (!!idPlayer && idPlayer.length > 0) {
			squadParams.page = -1;
			squadParams.filter = {
				text: idPlayer,
				status: !!squadParams.filter && !!squadParams.filter.status ? squadParams.filter.status : ['archived', 'active']
			};
		}
		if (!squadParams.filter || !squadParams.filter.team || !squadParams.filter.season) {
			squadParams.filter = {
				...squadParams.filter,
				team: [this.currentTeamService.getCurrentTeam().id],
				season: club?.clubSeasons.find(({ start, end }) => moment().isBetween(moment(start), moment(end), 'day'))?.id
			};
		}
		const { clubId } = this.auth.getCurrentUserData();
		if (!squadParams.filter.season) throw 'Club Season not defined! Please check your settings';
		return this.clubApi.getPeopleForSquads(
			clubId,
			role,
			squadParams.page,
			squadParams.sortBy,
			squadParams.order,
			squadParams.filter.season || '',
			squadParams.filter.team || [],
			squadParams.filter.text || '',
			squadParams.filter.status || [],
			squadParams.filter.position || [],
			squadParams.filter.nationality || [],
			squadParams.filter.birthYear || [],
			squadParams.filter.origin || [],
			squadParams.filter.contractType || [],
			squadParams.filter.contractExpiryYear || [],
			squadParams.filter.contractNotarizationStatus || [],
			[squadParams.filter?.feeFrom, squadParams.filter?.feeTo],
			[squadParams.filter?.wageFrom, squadParams.filter?.wageTo],
			!!squadParams.filter.netValueFlag,
			moment().utcOffset()
		);
	}

	getClub(): Observable<Club> {
		const { teamSettings, clubId } = this.auth.getCurrentUserData();
		const activeTeams = getActiveTeams(teamSettings);
		const include = [
			{
				relation: 'teams',
				scope: {
					fields: [
						'id',
						'name',
						'teamSeasons',
						'playerAppLimit',
						'activePlayersLimit',
						'archivedPlayersLimit',
						'instatId',
						'wyscoutId'
					],
					where: { id: { inq: activeTeams } },
					include: ['teamSeasons']
				}
			},
			{
				relation: 'clubSeasons',
				scope: {
					order: 'name DESC'
				}
			}
		];
		return this.clubApi.findById(clubId, { include });
	}

	getStaff(): Observable<Club> {
		const { teamSettings, clubId } = this.auth.getCurrentUserData();
		const activeTeams = getActiveTeams(teamSettings);
		const include = [
			{
				relation: 'staff',
				scope: {
					fields: [
						'firstName',
						'lastName',
						'displayName',
						'profilePhotoName',
						'profilePhotoUrl',
						'downloadUrl',
						'gender',
						'nationality',
						'altNationality',
						'passport',
						'altPassport',
						'inTeamFrom',
						'inTeamTo',
						'facebook',
						'twitter',
						'instagram',
						'linkedin',
						'snapchat',
						'mobilePhone',
						'otherMobile',
						'education',
						'school',
						'birthDate',
						'birthPlace',
						'weight',
						'height',
						'wage',
						'contractStart',
						'contractEnd',
						'phone',
						'email',
						'address',
						'domicile',
						'archived',
						'archivedDate',
						'currentStatus',
						'statusDetails',
						'documents',
						'nationalityOrigin',
						'fiscalIssue',
						'ageGroup',
						'biography',
						'federalId',
						'federalMembership',
						'sportPassport',
						'maritalStatus',
						'_statusHistory',
						'deleted',
						'bankAccount',
						'firstFederalMembership',
						'transferNotesThreads',
						'id',
						'teamId',
						'clubId',
						'position',
						'coachingBadges',
						'customerId'
					],
					where: { teamId: { inq: activeTeams } },
					include: ['employmentContracts']
				}
			}
		];
		return this.clubApi.findById(clubId, { include });
	}

	getAgents(): Observable<Agent[]> {
		const { teamSettings, clubId } = this.auth.getCurrentUserData();
		const activeTeams = getActiveTeams(teamSettings);
		return this.clubApi.getAgents(clubId, { where: { teamId: { inq: activeTeams } } });
	}

	getCustomers(): Observable<Customer[]> {
		const { clubId } = this.auth.getCurrentUserData();
		return this.clubApi.getCustomers(clubId, { fields: ['id', 'firstName', 'lastName'] });
	}

	getSinglePlayer(id: string) {
		if (this.singlePlayers[id]) {
			return of(this.singlePlayers[id]);
		}

		return this.playerApi
			.findById(id, {
				fields: [
					'wyscoutId',
					'gpexeId',
					'sonraId',
					'statsportId',
					'catapultId',
					'wimuId',
					'name',
					'lastName',
					'displayName',
					'profilePhotoName',
					'profilePhotoUrl',
					'downloadUrl',
					'gender',
					'nationality',
					'altNationality',
					'passport',
					'altPassport',
					'shoeSize',
					'captain',
					'inTeamFrom',
					'inTeamTo',
					'facebook',
					'twitter',
					'instagram',
					'linkedin',
					'snapchat',
					'mobilePhone',
					'otherMobile',
					'education',
					'school',
					'birthDate',
					'birthPlace',
					'weight',
					'height',
					'position',
					'role1',
					'position2',
					'role2',
					'position3',
					'role3',
					'foot',
					'jersey',
					'valueField',
					'value',
					'transfermarktValue',
					'clubValue',
					'agentValue',
					'wage',
					'contractStart',
					'contractEnd',
					'phone',
					'email',
					'address',
					'domicile',
					'botId',
					'botMessageUrl',
					'anamnesys',
					'archived',
					'archivedDate',
					'currentStatus',
					'statusDetails',
					'documents',
					'nationalityOrigin',
					'fiscalIssue',
					'ageGroup',
					'biography',
					'federalId',
					'federalMembership',
					'sportPassport',
					'maritalStatus',
					'_statusHistory',
					'deleted',
					'bankAccount',
					'firstFederalMembership',
					'transferNotesThreads',
					'id',
					'teamId',
					'_thresholdsFinancial',
					'clubId',
					'_pastValues',
					'_pastTransfermarktValues',
					'_pastAgentValues',
					'_pastClubValues'
				]
			})
			.pipe(
				first(),
				map((player: Player) => {
					this.singlePlayers[id] = player;
					return player;
				})
			);
	}

	invalidCache(id: string) {
		delete this.singlePlayers[id];
	}

	getPlayersForAgentLegal(ids: string[]) {
		return this.playerApi
			.find({
				where: {
					clubId: this.auth.getCurrentUserData().clubId,
					id: { inq: ids }
				},
				fields: ['id', 'displayName'],
				include: ['employmentContracts', 'transferContracts']
			})
			.pipe(
				first(),
				map((players: Player[]) => {
					return players;
				})
			);
	}

	getPlayersLimits(teamId: string): Observable<any> {
		return this.teamApi.getPlayersLimits(teamId);
	}
}
