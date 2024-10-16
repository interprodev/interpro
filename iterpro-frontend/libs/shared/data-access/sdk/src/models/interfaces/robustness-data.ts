export interface RobustnessData {
	apps: number;
	appsBySubFormat: any;
	availability: number;
	breakdown: {
		injured: number;
		illness: number;
		complaint: number;
		fit: number;
	};
	breakdownStatus: {
		notAvailable: number;
		beCareful: number;
		available: number;
	};
	countGames: number;
	countTrainings: number;
	daysAbsence: number;
	daysPerGame: number;
	durationSeverityInjuries: number;
	gameAvailability: number;
	gameMinutesInvestment: number;
	gameMinutesLosses: number;
	gameMinutesRoi: number;
	gameMinutesUntapped: number;
	gameMissed: number;
	gamePercentCalled: number;
	gameRate: number;
	gamesMissedInjuries: number;
	gamesMissedInternational: number;
	gamesMissedOthers: number;
	healthStatus: null;
	healthStatusReadiness: string;
	heavyGoal: number;
	injuriesNumber: number;
	injuryMonthBreakDown: InjuryMonthBreakdown[];
	injurySeverity: number;
	minutesPlayed: number;
	minutesPlayedBySubFormat: any;
	performanceReliability: number;
	periodBreakDown: {
		off: number;
		training: number;
		medical: number;
		game: number;
		assessment: number;
		international: number;
		administration: number;
		travel: number;
	};
	periodBreakDownMinutes: {
		off: number;
		training: number;
		medical: number;
		game: number;
		assessment: number;
		international: number;
		administration: number;
		travel: number;
	};
	playingTime: number;
	reinjuryRate: number;
	robustness: number;
	sessionsCalled: number;
	sessionsMissed: number;
	startingApps: number;
	substitutingApps: number;
	teamSeasonId: string;
	trainingAvailability: number;
	trainingPercentCalled: number;
	trainingsMissedInjuries: number;
	trainingsMissedInternational: number;
	trainingsMissedOthers: number;
}

interface InjuryMonthBreakdown {
	date: Date;
	endDate: Date;
	issue: string;
	location: string;
	_injuryAssessments: InjuryAssessment[];
}

interface InjuryAssessment {
	date: Date;
	endDate: Date;
	available: string;
}
