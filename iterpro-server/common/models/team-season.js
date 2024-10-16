const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;
const { mean, round, sortBy, flatten } = require('lodash');
const { NotFoundError, UnprocessableEntityError } = require('../modules/error');
const {
	getPlayerValue,
	getTotalElementsAmountForSeasonNew,
	getAchievedBonusesAmount
} = require('../../server/shared/financial-utils');

module.exports = Teamseason => {
	Teamseason.getAdministrationDashboardData = async id => {
		try {
			// Fetch the team season with team season id and extracting its lineup
			const teamSeason = await Teamseason.findById(id, {
				fields: { playerIds: true, staffIds: true, teamId: true, id: true, offseason: true, inseasonEnd: true }
			});
			if (!teamSeason) throw NotFoundError('Team Season not found!');

			const [economic, season, medical] = await Promise.all([
				Teamseason.getEconomicData(teamSeason),
				Teamseason.getSeasonMatchData(teamSeason),
				Teamseason.getMedicalData(teamSeason)
			]);

			// prepare response
			return {
				...economic,
				...season,
				...medical
			};
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	Teamseason.getEconomicData = async teamSeason => {
		const playerIds = teamSeason?.playerIds || [];
		const staffIds = teamSeason?.staffIds || [];
		if (playerIds.length === 0) throw UnprocessableEntityError('No players provided');

		const [players, staffs] = await Promise.all([
			Teamseason.app.models.Player.find({
				where: {
					id: { inq: playerIds },
					archived: false
				},
				fields: {
					id: true,
					teamId: true,
					archived: true,
					birthDate: true,
					nationalityOrigin: true,
					valueField: true,
					value: true,
					transfermarktValue: true,
					clubValue: true,
					agentValue: true
				},
				include: {
					relation: 'employmentContracts',
					scope: {
						where: {
							status: true
						}
					}
				}
			}),
			Teamseason.app.models.Staff.find({
				where: {
					id: { inq: staffIds },
					archived: false
				},
				fields: {
					id: true,
					teamId: true,
					archived: true,
					birthDate: true,
					nationalityOrigin: true
				},
				include: {
					relation: 'employmentContracts',
					scope: {
						where: {
							status: true
						}
					}
				}
			})
		]);

		const playerContracts = flatten(players.map(({ employmentContracts }) => employmentContracts() || []));
		const staffContracts = flatten(staffs.map(({ employmentContracts }) => employmentContracts() || []));

		const [playerWages, staffWages, playerBonuses, staffBonuses] = await Promise.all([
			Teamseason.app.models.BasicWage.find({
				where: {
					personId: { inq: playerIds },
					contractId: {
						inq: playerContracts.map(({ id }) => id)
					},
					type: 'basicWage'
				}
			}),
			Teamseason.app.models.BasicWage.find({
				where: {
					personId: { inq: staffIds },
					contractId: { inq: staffContracts.map(({ id }) => id) },
					type: 'basicWage'
				}
			}),
			Teamseason.app.models.Bonus.find({
				where: {
					personId: { inq: playerIds },
					contractId: { inq: playerContracts.map(({ id }) => id) }
				}
			}),
			Teamseason.app.models.Bonus.find({
				where: {
					personId: { inq: staffIds },
					contractId: { inq: staffContracts.map(({ id }) => id) }
				}
			})
		]);

		const ages = players.map(player => moment().diff(moment(player.birthDate), 'years')).filter(x => x <= 60);

		const notSpecified = players.filter(({ nationalityOrigin }) => !nationalityOrigin).length;
		const domestic = players.filter(({ nationalityOrigin }) => nationalityOrigin === 'domestic').length;
		const abroad = players.filter(({ nationalityOrigin }) => nationalityOrigin === 'abroad').length;
		const abroadExtra = players.filter(
			({ nationalityOrigin }) => nationalityOrigin === 'abroadExtraCommunitary'
		).length;
		const homegrown = players.filter(({ nationalityOrigin }) => nationalityOrigin === 'homegrown').length;
		const total = notSpecified + domestic + abroad + abroadExtra + homegrown;

		const totalSalariesPlayer = players
			.map(player => getTotalSalary(player, player.employmentContracts()[0], playerWages, playerBonuses, teamSeason))
			.reduce((a, b) => a + b, 0);
		const totalSalariesStaff = staffs
			.map(staff => getTotalSalary(staff, staff.employmentContracts()[0], staffWages, staffBonuses, teamSeason))
			.reduce((a, b) => a + b, 0);

		const totalSquadValue = players.map(player => getPlayerValue(player)).reduce((a, b) => a + b, 0);

		return {
			playersNumber: players.length,
			averageSquadAge: round(mean(ages), 1),
			playersInSquad: {
				notSpecified: (notSpecified / total) * 100,
				domestic: (domestic / total) * 100,
				abroad: (abroad / total) * 100,
				abroadExtra: (abroadExtra / total) * 100,
				homegrown: (homegrown / total) * 100
			},
			totalSalaries: totalSalariesPlayer + totalSalariesStaff,
			totalSquadValue
		};
	};

	Teamseason.getSeasonMatchData = async teamSeason => {
		const events = await Teamseason.app.models.Event.find({
			where: {
				teamSeasonId: ObjectID(teamSeason.id),
				format: 'game',
				start: { gte: teamSeason.offseason, lte: teamSeason.inseasonEnd },
				subformat: { neq: 'friendly' }
			},
			fields: {
				title: true,
				opponent: true,
				result: true,
				start: true,
				home: true,
				format: true,
				subformat: true,
				wyscoutId: true,
				instatId: true,
				opponentId: true,
				opponentWyscoutId: true,
				opponentInstatId: true
			}
		});

		// count official remaining and played game in this season
		const remainingGames = sortBy(
			events.filter(({ start }) => moment(start).isAfter(moment())),
			'start'
		);
		const playedGames = sortBy(
			events.filter(({ start }) => moment(start).isBefore(moment())),
			'start'
		).reverse();

		// counting win/draw/losses
		let win = 0;
		let draw = 0;
		let losses = 0;
		let notSet = 0;
		playedGames.forEach(val => {
			let resultSplit = val.result ? val.result.split('-') : null;
			if (resultSplit?.length > 1) {
				resultSplit = resultSplit.map(Number);
				if (resultSplit[0] === resultSplit[1]) draw += 1;
				else if (resultSplit[0] > resultSplit[1]) {
					win += val.home ? 1 : 0;
					losses += val.home ? 0 : 1;
				} else if (resultSplit[0] < resultSplit[1]) {
					win += val.home ? 0 : 1;
					losses += val.home ? 1 : 0;
				}
			} else notSet += 1;
		});
		const totalPercGames = win + losses + draw;

		// get fixtures of the last 3 games and for the next 2 incoming games
		const previous3Games = playedGames.slice(0, 3);
		const next2Games = remainingGames.slice(0, 2).reverse();

		const opponents = await Promise.all(
			[...previous3Games, ...next2Games]
				.filter(({ opponentWyscoutId }) => opponentWyscoutId)
				.map(({ opponentWyscoutId }) => Teamseason.app.models.Wyscout.getTeamData(opponentWyscoutId))
		);

		[...previous3Games, ...next2Games].forEach(game => {
			const opponentInfo = opponents.find(({ wyId }) => wyId === game.opponentWyscoutId);
			game.opponentImage = opponentInfo ? opponentInfo.imageDataURL : null;
		});

		return {
			gamesRemaining: remainingGames.length,
			gamesPlayed: playedGames.length,
			wins: win,
			losses: losses,
			draw: draw,
			notSet: notSet,
			winPercentage: (win / totalPercGames) * 100,
			lossesPercentage: (losses / totalPercGames) * 100,
			drawPercentage: (draw / totalPercGames) * 100,
			fixtures: previous3Games,
			nextFixtures: next2Games
		};
	};

	Teamseason.getMedicalData = async teamSeason => {
		// extract active (unclosed) injuries with category Trauma and Overuse
		const playerIds = teamSeason?.playerIds || [];
		if (playerIds.length === 0) throw UnprocessableEntityError('No players provided');

		const injuries = await Teamseason.app.models.Injury.find({
			where: {
				playerId: { inq: playerIds },
				date: { gte: teamSeason.offseason },
				or: [{ endDate: null }, { endDate: { lte: teamSeason.inseasonEnd } }]
			},
			fields: {
				endDate: true,
				category: true
			}
		});
		const activeInjuries = injuries.filter(({ endDate }) => !endDate).length;
		const traumaInjuries = injuries.filter(
			({ category }) => category === 'medical.infirmary.details.category.trauma'
		).length;
		const overuseInjuries = injuries.filter(
			({ category }) => category === 'medical.infirmary.details.category.overuse'
		).length;
		const sumTraumaOveruses = traumaInjuries + overuseInjuries;

		return {
			currentInjuries: activeInjuries,
			totalInjuries: injuries.length,
			injuryBreakDownTrauma: (traumaInjuries / sumTraumaOveruses) * 100,
			injuryBreakDownOveruse: (overuseInjuries / sumTraumaOveruses) * 100,
			trauma: traumaInjuries,
			overuse: overuseInjuries
		};
	};

	Teamseason.getAdministrationDashboardDataForPlayer = async (id, playerId, minutesField) => {
		try {
			const teamSeason = await Teamseason.findById(id, {
				fields: { playerIds: true, staffIds: true, teamId: true, id: true, offseason: true, inseasonEnd: true }
			});
			if (!teamSeason) throw NotFoundError('Team Season not found!');

			const [player, { robustness }, contract] = await Promise.all([
				Teamseason.app.models.Player.findById(playerId),
				Teamseason.app.models.ProfilePlayers.profileRobustness(
					id,
					[playerId],
					teamSeason.offseason,
					moment().toDate(),
					minutesField,
					2
				),
				Teamseason.app.models.EmploymentContract.findOne({
					where: {
						personId: ObjectID(playerId),
						status: true
					}
				})
			]);

			const wages = contract
				? await Teamseason.app.models.BasicWage.find({
						where: { contractId: contract.id, type: 'basicWage' }
				  })
				: [];

			// const contractYears = getContractLength(contract);
			const salary = getTotalElementsAmountForSeasonNew(contract, wages, id);
			// const salaryPA = Math.round(salary / (contractYears || 1));
			return {
				...robustness[String(playerId)],
				marketValue: getPlayerValue(player),
				salary,
				dateFrom: contract?.dateFrom,
				dateTo: contract?.dateTo
			};
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

function getTotalSalary(person, contract, wages, bonuses, season) {
	// const contractYears = getContractLength(contract);
	const personBonuses = bonuses.filter(({ personId, agentId }) => String(personId) === String(person.id) && !agentId);
	const personWages = wages.filter(({ personId, agentId }) => String(personId) === String(person.id) && !agentId);
	const wage = getTotalElementsAmountForSeasonNew(contract, personWages, season.id);
	// const wagePA = Math.round(wage / (contractYears || 1));
	const bonusWon = getAchievedBonusesAmount(personBonuses, [season]);
	return wage + bonusWon;
}
