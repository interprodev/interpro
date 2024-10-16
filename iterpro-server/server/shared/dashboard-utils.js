const { uniq, meanBy, sumBy, groupBy, sum, uniqBy } = require('lodash');
const moment = require('moment');
const { ObjectID } = require('mongodb');
const { NotFoundError } = require('../../common/modules/error');

const { getFieldPosition, getPositionCategories } = require('../../common/constants/sports-constants');
const { getPlayerValue } = require('./financial-utils');

module.exports = {
	getTeamFinancialProfile: async (teamSeasonId, minutesField, numberOfMatches, Team) => {
		const season = await Team.app.models.TeamSeason.findById(teamSeasonId, {
			fields: ['playerIds', 'staffIds', 'id', 'offseason', 'inseasonEnd']
		});

		if (!season) throw NotFoundError('No team season found!');

		const playerIds = uniq((season.playerIds || []).filter(id => !Array.isArray(id)).map(ObjectID));
		const staffIds = uniq((season.staffIds || []).map(ObjectID));

		const players = await Team.app.models.Player.find({
			where: { id: { inq: playerIds }, archived: false }
		});

		const playerFinancialData = await Promise.all(
			playerIds.map(playerId =>
				Team.app.models.ProfilePlayers.getPlayerFinancialProfile(
					playerId,
					teamSeasonId,
					'currentSeason',
					minutesField,
					numberOfMatches
				)
			)
		);

		const staffFinancialData = await Promise.all(
			staffIds.map(staffId => Team.app.models.ProfilePlayers.getStaffFinancialProfile(staffId, teamSeasonId))
		);

		const activeEmploymentContracts = await Team.app.models.EmploymentContract.find({
			where: {
				personId: { inq: [...playerIds, ...staffIds] },
				status: true,
				validated: true
			}
		});

		const club = await Team.app.models.Club.findById(players[0].clubId);

		// TOT SQUAD VALUE
		const totalSquadValue = getTotalSquadValue(players, club);

		// EMPLOYMENT CONTRACTS
		const contractsData = getContractsData(activeEmploymentContracts, playerFinancialData, staffFinancialData);

		// CONTRACT EXPIRY & SALARIES
		const contractExpiry = getContractExpiry(activeEmploymentContracts);

		// INVESTMENT PERFORMANCE
		const investmentPerformance = getTeamInvestmentPerformance(playerFinancialData);

		// CONTRACT TYPES
		const contractTypes = getContractTypes(activeEmploymentContracts);

		const offlinePlayersData = playerFinancialData.reduce(
			(acc, { playerId, ...rest }) => ({ ...acc, [playerId]: rest }),
			{}
		);

		return {
			totalSquadValue,
			contractTypes,
			contractExpiry,
			contractsData,
			investmentPerformance,
			offlinePlayersData
		};
	},

	getTeamFinancialAnalysis: async (playerIds, teamSeasonId, minutesField, numberOfMatches, Team) => {
		const playerFinancialData = await Promise.all(
			playerIds.map(playerId =>
				Team.app.models.ProfilePlayers.getPlayerFinancialProfile(
					playerId,
					teamSeasonId,
					'currentSeason',
					minutesField,
					numberOfMatches
				)
			)
		);

		const results = playerFinancialData
			.map(playerData => ({
				playerId: playerData.playerId,
				availability: playerData.availability,
				countGames: playerData.countGames,
				gameAvailability: playerData.gameAvailability,
				investmentPerformance: {
					loss: playerData.loss,
					losses_perc: playerData.losses_perc,
					residualRoi: playerData.residualRoi,
					residualRoi_perc: playerData.residualRoi_perc,
					roi: playerData.roi,
					roi_perc: playerData.roi_perc,
					untapped: playerData.untapped,
					untapped_perc: playerData.untapped_perc
				},
				losses: playerData.losses,
				marketValue: playerData.marketValue,
				minutesPlayed: playerData.minutesPlayed,
				playingTime: playerData.playingTime,
				productivity: playerData.productivity,
				roi: {
					roi: playerData.roi,
					residualRoi: playerData.residualRoi
				},
				totalInvestmentValue: playerData.totalInvestmentCost,
				...playerData.analysisValues
			}))
			.reduce((acc, { playerId, ...values }) => ({ ...acc, [playerId]: values }), {});

		return results;
	}
};

function getTotalSquadValue(players, { sportType, vat }) {
	const emptyRoleValue = getEmptyRoleValue(sportType);
	const roleValues = players.reduce(
		(acc, player) => getTeamRoleValue(acc, player, sportType, false, vat),
		emptyRoleValue
	);
	const roleValuesGross = players.reduce(
		(acc, player) => getTeamRoleValue(acc, player, sportType, true, vat),
		emptyRoleValue
	);
	const totalSquadValue = sum(players.map(player => getPlayerValue(player)));
	const totalSquadValueGross = sum(players.map(player => getPlayerValue(player, true, vat)));

	return {
		totalSquadValue,
		totalSquadValueGross,
		roleValues,
		roleValuesGross
	};
}

function getTeamRoleValue(acc, player, sportType = 'football', gross, vat) {
	const category = getFieldPosition(player.position, sportType);
	const value = getPlayerValue(player, gross, vat);
	return { ...acc, [category]: acc[category] + value / 1000000 };
}

function getEmptyRoleValue(sportType) {
	return {
		...getPositionCategories(sportType).reduce((acc, val) => ({ ...acc, [val]: 0 }), {}),
		notSet: 0
	};
}

function getContractTypes(employmentContracts) {
	const grouped = groupBy(employmentContracts, 'personStatus');
	return Object.entries(grouped).reduce(
		(acc, [status, contracts]) => ({
			...acc,
			[status]: contracts.length
		}),
		{ inTeam: 0, inTeamOnLoan: 0, trial: 0 }
	);
}

function getContractExpiry(employmentContracts) {
	const contractWithEndingYear = employmentContracts.map(contract => ({
		...JSON.parse(JSON.stringify(contract)),
		endingYear: moment(contract.dateTo).year()
	}));
	const groupedByEndingYear = groupBy(contractWithEndingYear, 'endingYear');
	const contractsEndPerYear = Object.entries(groupedByEndingYear).reduce(
		(acc, [status, contracts]) => ({
			...acc,
			[status]: getContractTypes(contracts)
		}),
		{}
	);
	const contractsExpireIn1Year = employmentContracts.filter(({ dateTo }) =>
		moment(dateTo).diff(moment(), 'days') < 365 ? 1 : 0
	).length;
	return {
		contractsExpireIn1Year,
		contractsEndPerYear
	};
}

function getContractsData(employmentContracts, playerFinancialData, staffFinancialData) {
	const uniquePlayerContracts = uniqBy(
		employmentContracts.filter(({ personType }) => personType === 'Player'),
		'personId'
	);
	const uniqueStaffContracts = uniqBy(
		employmentContracts.filter(({ personType }) => personType === 'Staff'),
		'personId'
	);
	const avgContractLength = getAverageContractLength(uniquePlayerContracts);

	// PLAYERS
	const fixedWagePlayersSum = sumBy(
		playerFinancialData.filter(({ wage }) => wage),
		'wage'
	);
	const fixedWagePlayersSumGross = sumBy(
		playerFinancialData.filter(({ wageGross }) => wageGross),
		'wageGross'
	);
	const bonusWon = sumBy(
		playerFinancialData.filter(({ bonus }) => bonus),
		'bonus'
	);
	const bonusWonGross = sumBy(
		playerFinancialData.filter(({ bonusGross }) => bonusGross),
		'bonusGross'
	);
	const residualBonus = sumBy(
		playerFinancialData.filter(({ residualBonus }) => residualBonus),
		'residualBonus'
	);
	const residualBonusGross = sumBy(
		playerFinancialData.filter(({ residualBonusGross }) => residualBonusGross),
		'residualBonusGross'
	);
	const playersPa = (fixedWagePlayersSum + bonusWon) / uniquePlayerContracts.length;
	const playersPaGross = (fixedWagePlayersSumGross + bonusWonGross) / uniquePlayerContracts.length;

	// STAFF
	const fixedWageStaffSum = sumBy(
		staffFinancialData.filter(({ wage }) => wage),
		'wage'
	);
	const fixedWageStaffSumGross = sumBy(
		staffFinancialData.filter(({ wageGross }) => wageGross),
		'wageGross'
	);
	const bonusStaffWon = sumBy(
		staffFinancialData.filter(({ bonus }) => bonus),
		'bonus'
	);
	const bonusStaffWonGross = sumBy(
		staffFinancialData.filter(({ bonusGross }) => bonusGross),
		'bonusGross'
	);
	const residualStaffBonus = sumBy(
		staffFinancialData.filter(({ residualBonus }) => residualBonus),
		'residualBonus'
	);
	const residualStaffBonusGross = sumBy(
		staffFinancialData.filter(({ residualBonusGross }) => residualBonusGross),
		'residualBonusGross'
	);
	const staffsPa = (fixedWageStaffSum + bonusStaffWon) / uniqueStaffContracts.length;
	const staffsPaGross = (fixedWageStaffSumGross + bonusStaffWonGross) / uniqueStaffContracts.length;

	const totalContractValue = fixedWagePlayersSum + bonusWon + fixedWageStaffSum + bonusStaffWon;
	const totalContractValueGross =
		fixedWagePlayersSumGross + bonusWonGross + fixedWageStaffSumGross + bonusStaffWonGross;

	const avgContractValue = totalContractValue / (uniquePlayerContracts.length + uniqueStaffContracts.length || 1);
	const avgContractValueGross =
		totalContractValueGross / (uniquePlayerContracts.length + uniqueStaffContracts.length || 1);

	return {
		totalContractValue,
		totalContractValueGross,
		playersPa,
		playersPaGross,
		fixedWagePlayersSum,
		fixedWagePlayersSumGross,
		bonusWon,
		bonusWonGross,
		residualBonus,
		residualBonusGross,
		avgContractLength,
		avgContractValue,
		avgContractValueGross,
		fixedWageStaffSum,
		fixedWageStaffSumGross,
		bonusStaffWon,
		bonusStaffWonGross,
		residualStaffBonus,
		residualStaffBonusGross,
		staffsPa,
		staffsPaGross
	};
}

function getAverageContractLength(employmentContracts) {
	const totalContractsLength = employmentContracts.reduce(
		(acc, { dateFrom, dateTo }) => acc + moment(dateTo).diff(moment(dateFrom), 'days') || 0,
		0
	);
	const averageContractDuration = moment.duration(totalContractsLength / employmentContracts.length, 'days');
	return { years: averageContractDuration.years(), months: averageContractDuration.months() };
}

function getTeamInvestmentPerformance(dashboardData) {
	return {
		teamAvailability: meanBy(
			dashboardData.filter(({ availability }) => availability),
			'availability'
		),
		losses: sumBy(
			dashboardData.filter(({ losses }) => losses),
			'losses'
		),
		lossesGross: sumBy(
			dashboardData.filter(({ lossesGross }) => lossesGross),
			'lossesGross'
		),
		teamRoi: sumBy(
			dashboardData.filter(({ roi }) => roi),
			'roi'
		),
		teamRoiGross: sumBy(
			dashboardData.filter(({ roiGross }) => roiGross),
			'roiGross'
		),
		teamResidualRoi: sumBy(
			dashboardData.filter(({ residualRoi }) => residualRoi),
			'residualRoi'
		),
		teamResidualRoiGross: sumBy(
			dashboardData.filter(({ residualRoiGross }) => residualRoiGross),
			'residualRoiGross'
		),
		teamCapitalGain: sumBy(
			dashboardData.filter(({ gainLoss }) => gainLoss),
			'gainLoss'
		),
		teamCapitalGainGross: sumBy(
			dashboardData.filter(({ gainLoss }) => gainLoss),
			'gainLossGross'
		)
	};
}
