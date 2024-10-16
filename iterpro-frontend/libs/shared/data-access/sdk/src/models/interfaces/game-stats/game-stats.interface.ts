import { GameStatsConfig } from '@iterpro/shared/utils/common-utils';

export interface StatsResult {
	item: GameStatsConfig<string>;
	home: number | null;
	homePerc: number;
	away: number | null;
	awayPerc: number;
}

export interface MatchProviderStats {
	home: StatsSideTeam;
	away: StatsSideTeam;
	match: StatsMatch;
}

interface StatsMatch {
	wyId: number;
	label: string;
	date: string;
	dateutc: string;
	status: string;
	duration: string;
	winner: number;
	competitionId: number;
	seasonId: number;
	roundId: number;
	gameweek: number;
	teamsData: {
		home: StatsTeamsData;
		away: StatsTeamsData;
	};
	venue: string;
	referees: Referee[];
	hasDataAvailable: boolean;
	competition: Competition;
	goals: Goal[];
}

export interface Goal {
	period: string;
	minute: number;
	playerId: number;
	teamId: number;
	type: 'goal' | 'own' | 'penalty';
	player: StatsPlayer;
}

interface Referee {
	refereeId: number;
	role: string;
}

interface Area {
	id: number;
	alpha2code: string;
	alpha3code: string;
	name: string;
}

interface Competition {
	wyId: number;
	name: string;
	area: Area;
	format: string;
	type: string;
	category: string;
	gender: string;
	divisionLevel: number;
}

interface StatsSideTeam {
	wyId: number;
	name: string;
	officialName: string;
	city: string;
	area: {
		id: number;
		alpha2code: string;
		alpha3code: string;
		name: string;
	};
	type: string;
	category: string;
	gender: string;
	children?: StatsLineupPlayer[]; // optional array of child teams
	imageDataURL: string;
	teamData: StatsTeamsData;
	teamStats: TeamStats;
}

interface StatsTeamsData {
	teamId: number;
	side: string;
	score: number;
	scoreHT: number;
	scoreET: number;
	scoreP: number;
	coachId: number;
	hasFormation: number;
	formation?: {
		lineup: StatsLineupPlayer[];
		bench?: StatsLineupPlayer[];
	};
}

interface StatsLineupPlayer {
	playerId: number;
	goals: string;
	ownGoals: string;
	yellowCards: string;
	redCards: string;
	shirtNumber: number;
	player: StatsPlayer;
	assists: string;
}

interface StatsPlayer {
	wyId: number;
	shortName: string;
	firstName: string;
	middleName: string;
	lastName: string;
	height: number;
	weight: number;
	birthDate: string;
	birthArea: {
		id: number;
		alpha2code: string;
		alpha3code: string;
		name: string;
	};
	passportArea: {
		id: number;
		alpha2code: string;
		alpha3code: string;
		name: string;
	};
	role: {
		name: string;
		code2: string;
		code3: string;
	};
	foot: string;
	currentTeamId: number;
	currentNationalTeamId: number | null;
	gender: string;
	status: string;
	imageDataURL: string;
}

interface TeamStats {
	teamId: number;
	competitionId: number;
	seasonId: number;
	total: StatDetails;
	average: StatDetails;
	percent: StatPercentages;
	roundId: number;
	matchId: number;
}

interface StatDetails {
	matches: number;
	goals: number;
	assists: number;
	shots: number;
	headShots: number;
	yellowCards: number;
	redCards: number;
	directRedCards: number;
	penalties: number;
	linkupPlays: number;
	cleanSheets: number;
	duels: number;
	duelsWon: number;
	defensiveDuels: number;
	defensiveDuelsWon: number;
	offensiveDuels: number;
	offensiveDuelsWon: number;
	aerialDuels: number;
	aerialDuelsWon: number;
	fouls: number;
	offsides: number;
	passes: number;
	successfulPasses: number;
	smartPasses: number;
	successfulSmartPasses: number;
	passesToFinalThird: number;
	successfulPassesToFinalThird: number;
	crosses: number;
	successfulCrosses: number;
	forwardPasses: number;
	successfulForwardPasses: number;
	backPasses: number;
	successfulBackPasses: number;
	throughPasses: number;
	successfulThroughPasses: number;
	keyPasses: number;
	successfulKeyPasses: number;
	verticalPasses: number;
	successfulVerticalPasses: number;
	longPasses: number;
	successfulLongPasses: number;
	dribbles: number;
	successfulDribbles: number;
	interceptions: number;
	defensiveActions: number;
	successfulDefensiveActions: number;
	attackingActions: number;
	successfulAttackingActions: number;
	freeKicks: number;
	freeKicksOnTarget: number;
	directFreeKicks: number;
	directFreeKicksOnTarget: number;
	corners: number;
	successfulPenalties: number;
	successfulLinkupPlays: number;
	accelerations: number;
	pressingDuels: number;
	pressingDuelsWon: number;
	looseBallDuels: number;
	looseBallDuelsWon: number;
	missedBalls: number;
	shotAssists: number;
	shotOnTargetAssists: number;
	recoveries: number;
	opponentHalfRecoveries: number;
	dangerousOpponentHalfRecoveries: number;
	losses: number;
	ownHalfLosses: number;
	dangerousOwnHalfLosses: number;
	fieldAerialDuels: number;
	fieldAerialDuelsWon: number;
	gkExits: number;
	gkSuccessfulExits: number;
	gkAerialDuels: number;
	gkAerialDuelsWon: number;
	gkSaves: number;
	xgShot: number;
	xgShotAgainst: number;
	ppda: number;
	receivedPass: number;
	touchInBox: number;
	progressiveRun: number;
	concededGoals: number;
	opponentOffsides: number;
	shotsAgainst: number;
	gkGoalKicks: number;
	gkGoalKicksSuccess: number;
	shortGoalKicks: number;
	longGoalKicks: number;
	matchesTagged: number;
	newDuelsWon: number;
	newDefensiveDuelsWon: number;
	newOffensiveDuelsWon: number;
	newSuccessfulDribbles: number;
	lateralPasses: number;
	successfulLateralPasses: number;
}

interface StatPercentages {
	duelsWon: number;
	defensiveDuelsWon: number;
	offensiveDuelsWon: number;
	aerialDuelsWon: number;
	successfulPasses: number;
	successfulSmartPasses: number;
	successfulPassesToFinalThird: number;
	successfulCrosses: number;
	successfulDribbles: number;
	shotsOnTarget: number;
	headShotsOnTarget: number;
	goalConversion: number;
	yellowCardsPerFoul: number;
	directFreeKicksOnTarget: number;
	penaltiesConversion: number;
	win: number;
	successfulForwardPasses: number;
	successfulBackPasses: number;
	successfulThroughPasses: number;
	successfulKeyPasses: number;
	successfulVerticalPasses: number;
	successfulLongPasses: number;
	successfulShotAssists: number;
	successfulLinkupPlays: number;
	fieldAerialDuelsWon: number;
	gkSaves: number;
	gkSuccessfulExits: number;
	gkAerialDuelsWon: number;
	successfulTouchInBox: number;
	newDuelsWon: number;
	newDefensiveDuelsWon: number;
	newOffensiveDuelsWon: number;
	newSuccessfulDribbles: number;
	successfulLateralPasses: number;
}
