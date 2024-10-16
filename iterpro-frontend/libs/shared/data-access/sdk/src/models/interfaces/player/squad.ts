import { Agent, Player, Staff, Team } from '../../../lib';
import { ContractPersonType } from '../../classes/contracts.model';
import { ExtendedPlayerScouting } from '../scouting/game-report/scouting-game-report.interface';

export interface SearchPlayerDropdownElement {
	player: Player | ExtendedPlayerScouting;
	team?: Team;
	isTeam?: boolean;
}

export interface PlayerList {
	[key: string]: Player;
}

export interface PlayerRoleCategory {
	name: string;
	players: Player[];
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

export interface SquadPlayersResult {
	players: Player[];
	totalRows: number;
}

export interface People {
	id?: any;
	displayName?: string;
	firstName?: string;
	lastName?: string;
	currentStatus: string;
	archived: boolean;
	deleted: boolean;
	archivedDate: Date;
	archivedMotivation: string;
	_statusHistory: any[];
	teamId: string;
}

export type StaffWithDisplayName = Staff & { displayName?: string };
export type AgentWithDisplayName = Agent & { displayName: string };

export enum SquadPersonIndexEnum {
	Overview = 0, // this is only for PlayerTransfer
	Details = 1,
	Legal = 2,
	Amortization = 3,
	Notes = 4,
	CostNotesAndSubscriptions
}
