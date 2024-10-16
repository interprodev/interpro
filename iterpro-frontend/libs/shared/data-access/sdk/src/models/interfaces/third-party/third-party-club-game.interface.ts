import { PlayerMatchStat, PlayerScouting, Player } from '../../../lib';
import { ExtendedPlanningGameReport } from '../player/player-report/player-report.interface';

export interface ThirdPartyLinkedPlayerBase {
	forceDisabled?: boolean;
	isPlayerInjuredHere?: boolean; // multiple sets sport param
	isDisabledForGame?: boolean; // multiple sets sport param
	playerStats: PlayerMatchStat & { position?: string; player?: PlayerScouting | Player };
	jerseyNumber?: number;
	downloadUrl: string;
	gameReport?: ExtendedPlanningGameReport;
}

export interface WyscoutLinkedPlayer extends ThirdPartyLinkedPlayerBase {
	wyscoutId: number;
	instatId?: number;
}
export interface InstatLinkedPlayer extends ThirdPartyLinkedPlayerBase {
	instatId?: number;
	wyscoutId?: number;
}
export type ThirdPartyLinkedPlayer = WyscoutLinkedPlayer | InstatLinkedPlayer;

export interface ThirdPartyClubGame {
	home: ThirdPartyClubGameTeam | undefined;
	away: ThirdPartyClubGameTeam | undefined;
}

export interface ThirdPartyClubGameTeam {
	imageDataURL: string;
	name: string;
	players: ThirdPartyLinkedPlayer[];
}
export interface ThirdPartyClubGameInterface {
	home: ThirdPartyClubGameTeam;
	away: ThirdPartyClubGameTeam;
	hideHome?: boolean;
	hideAway?: boolean;
}

export interface GenericSportBasicRoles {
	[position: string]: number;
}
