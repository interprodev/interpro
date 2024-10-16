export interface ContractData {
	avgContractLength: {
		years: number;
		months: number;
	};
	bonusStaffWon: number;
	bonusStaffWonGross: number;
	bonusWon: number;
	bonusWonGross: number;
	fixedWagePlayersSum: number;
	fixedWagePlayersSumGross: number;
	fixedWageStaffSum: number;
	fixedWageStaffSumGross: number;
	playersPa: number;
	playersPaGross: number;
	residualBonus: number;
	residualBonusGross: number;
	residualStaffBonus: number;
	residualStaffBonusGross: number;
	staffsPa: number;
	staffsPaGross: number;
	totalContractValue: number;
	totalContractValueGross: number;
	totalBonusesGross: number;
}

export interface InvestmentPerformance {
	teamAvailability: number;
	losses: number;
	lossesGross: number;
	teamCapitalGain: number;
	teamCapitalGainGross: number;
	teamResidualRoi: number;
	teamResidualRoiGross: number;
	teamRoi: number;
	teamRoiGross: number;
}

export interface ContractExpiring {
	contractsExpireIn1Year: number;
	contractsEndPerYear: {
		[key: number]: {
			inTeam: number;
			inTeamOnLoan: number;
			trial: number;
		};
	};
}

export interface TotalSquadValue {
	roleValues: {
		goalkeeper: number;
		defender: number;
		midfielder: number;
		striker: number;
		notSet: number;
	};
	roleValuesGross: {
		goalkeeper: number;
		defender: number;
		midfielder: number;
		striker: number;
		notSet: number;
	};
	totalSquadValue: number;
	totalSquadValueGross: number;
}

export interface ContractTypes {
	inTeam: number;
	inTeamOnLoan: number;
	trial: number;
}

export interface OfflinePlayerData {
	amortizationAsset: number;
	amortizationAssetGross: number;
	analysisValues: {
		[key: string]: number;
	};
	assetValue: number;
	assetValueGross: number;
	availability: number;
	bonus: number;
	bonusGross: number;
	contractDuration: {
		start: Date;
		end: Date;
		years: number;
		months: number;
		days: number;
		fromToday: number;
		fromTodayGross: number;
		remainingTime: number;
		completionPercentage: number;
	};
	countGames: number;
	gainLoss: number;
	gainLossGross: number;
	gainLossPercent: number;
	gameAvailability: number;
	gameMinutesInvestment: number;
	gameMinutesLosses: number;
	gameMinutesRoi: number;
	gameMinutesUntapped: number;
	losses: number;
	lossesGross: number;
	losses_perc: number;
	marketValue: number;
	marketValueGross: number;
	minutesPlayed: number;
	monthsInTeam: number;
	monthsLastContract: number;
	netBookValue: number;
	netBookValueGross: number;
	pastValues: {
		id: string;
		date: string;
		value: number;
	}[];
	playingTime: number;
	productivity: number;
	purchaseCost: number;
	purchaseCostGross: number;
	residualBonus: number;
	residualBonusGross: number;
	residualRoi: number;
	residualRoiGross: number;
	residualRoi_perc: number;
	roi: number;
	roiGross: number;
	roi_perc: number;
	totalInvestmentCost: number;
	totalInvestmentCostGross: number;
	untapped: number;
	untappedGross: number;
	untapped_perc: number;
	wage: number;
	wageGross: number;
	yearsInTeam: number;
	yearsLastContract: number;
	currentValueGross: number;
	currentValue: number;
}
