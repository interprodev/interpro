const { ObjectID } = require('mongodb');
const Route = require('route-parser');
const { isString, isEmpty } = require('lodash');
const { ForbiddenError, AuthorizationError, InternalError, NotFoundError } = require('../../common/modules/error');
const paths = require('./paths.json');
const moment = require('moment');

module.exports = function (app) {
	return async function (req, res, next) {
		const requestPath = req.path.replace('/api', '');
		if (requestPath.match('/explorer') || requestPath.match('/visualize')) next();
		else if (
			(requestPath.match('/customers/reset') || requestPath.match('/customerPlayers/reset')) &&
			!req.headers.authorization &&
			!req.query.access_token
		)
			next(new NotFoundError('No endpoint found'));
		else {
			let matched = null;
			let pathMatched = null;

			for (const path of paths) {
				const route = new Route(path.url);
				matched = route.match(requestPath);
				if (matched) {
					pathMatched = path;
					break;
				}
			}
			if (requestPath.includes('/static')) {
				next();
			} else if (!pathMatched) {
				next(new NotFoundError('No endpoint found'));
			} else {
				const param = pathMatched.paramToCheck;
				if (param.length > 0) {
					// TODO: this should be before the check on params, since all the endpoints should be authenticated
					// NOTE (in fact, the endpoint with no params to check does check manually if the token is missing)
					const tokenId = req.headers['authorization'];
					if (!tokenId) {
						next(new AuthorizationError('No auth token provided'));
					} else {
						try {
							const userCollection = req.app.models.User.getDataSource().connector.collection(
								req.app.models.User.modelName
							);
							const teamSettingsCollection = req.app.models.CustomerTeamSettings.getDataSource().connector.collection(
								req.app.models.CustomerTeamSettings.modelName
							);
							const customerCollection = req.app.models.Customer.getDataSource().connector.collection(
								req.app.models.Customer.modelName
							);
							const customerPlayerCollection = req.app.models.CustomerPlayer.getDataSource().connector.collection(
								req.app.models.CustomerPlayer.modelName
							);
							const accessTokenCollection = req.app.models.AccessToken.getDataSource().connector.collection(
								req.app.models.AccessToken.modelName
							);
							const clubCollection = req.app.models.Club.getDataSource().connector.collection(
								req.app.models.Club.modelName
							);
							const token = await accessTokenCollection.findOne({ _id: tokenId });
							if (!token) {
								next(new AuthorizationError('Auth token not found'));
							}
							if (hasExpired(token)) {
								next(new AuthorizationError('Auth token has expired'));
							}
							const userId = token.userId || '';
							const [customer, user, customerPlayer, teamSettings] = await Promise.all([
								customerCollection.findOne({ _id: ObjectID(userId) }, { username: 1, email: 1, clubId: 1 }),
								userCollection.findOne({ _id: ObjectID(userId) }),
								customerPlayerCollection.findOne({ _id: ObjectID(userId) }, { clubId: 1 }),
								teamSettingsCollection.find({ customerId: ObjectID(userId) }, { teamId: 1 }).toArray()
							]);
							if (!customer && !user && !customerPlayer) {
								next(new InternalError(`User not found`));
							}
							// NB: if the requester is the service account for the batches, then do not perform the active club check
							if (user || (customer && customer.email === process.env.X_EMAIL)) {
								next();
							} else {
								let validTeamIds = [];
								let validClubId = null;
								if (customer) {
									validTeamIds = teamSettings.map(({ teamId }) => teamId.toString());
									validClubId = customer.clubId.toString();
								}
								if (customerPlayer) {
									validClubId = customerPlayer.clubId.toString();
								}
								const { active } = await clubCollection.findOne(
									{ _id: ObjectID(validClubId) },
									{ fields: { active: 1, type: 1 } }
								);
								if (!active) {
									next(new ForbiddenError(`Your club has been deactivated! Please contact support`));
								}
								// if (req.headers['appmode'] && type !== req.headers['appmode']) {
								// 	throw new ForbiddenError('Your organization is not allowed to access this version of Iterpro');
								// }
								if (customer && (!validTeamIds || isEmpty(validTeamIds))) {
									next(new ForbiddenError(`No teams associated to this account! Please contact your account admin`));
								}
								// check for matched
								if (req.headers['filter']) {
									const filter = JSON.parse(req.headers['filter']);
									if (filter)
										matched = {
											...filter,
											...matched
										};
								}
								if (req.query) {
									matched = {
										...req.query,
										...matched
									};

									if (req.query.where) {
										const parsed = JSON.parse(req.query.where);
										matched = {
											...parsed,
											...matched
										};
									}
								}
								if (req.body) {
									const body = req.body;
									if (body)
										matched = {
											...body,
											...matched
										};
								}
								let result = false;
								for (const p of param) {
									for (const keyP in p) {
										const arg = searchProperty(matched, true, keyP);
										const res = await validateByType(req, arg, p[keyP], validTeamIds, validClubId);
										if (res) {
											result = true;
											break;
										}
									}
								}
								if (result) next();
								else {
									next(new ForbiddenError(`Access to the requested resources is forbidden: ${requestPath}`));
								}
							}
						} catch (error) {
							console.error(error);
							if (error.name === 'WyscoutException') {
								next(error);
							} else {
								next(new InternalError(`Error while validating request ${requestPath}: ${error}`));
							}
						}
					}
				} else {
					next();
				}
			}
		}
	};

	async function validateByType(req, arg, type, validTeamIds, validClubId) {
		const validateFunction = (() => {
			switch (type) {
				case 'customer':
					return validateByCustomerId;
				case 'team':
					return validateByTeamId;
				case 'club':
					return validateByClubId;
				case 'customerTeamSettings':
					return validateByCustomerTeamSettings;
				case 'player':
					return validateByPlayerId;
				case 'playerGameReport':
					return validateByPlayerGameReport;
				case 'playerTrainingReport':
					return validateByPlayerTrainingReport;
				case 'playerScouting':
					return validateByPlayerScoutingId;
				case 'playerObjArray':
					return validateByPlayerObjArray;
				case 'drill':
					return validateByDrillId;
				case 'basicWage':
					return validateByBasicWageId;
				case 'bonus':
					return validateByBonusId;
				case 'teamBonus':
					return validateByTeamBonusId;
				case 'test':
					return validateByTestId;
				case 'wellness':
					return validateByWellnessId;
				case 'match':
					return validateByMatchId;
				case 'event':
					return validateByEventId;
				case 'eventArray':
					return validateByEventArray;
				case 'playerArray':
					return validateByPlayerArray;
				case 'injury':
					return validateByInjuryId;
				case 'testArray':
					return validateByTestArray;
				case 'testInstance':
					return validateByTestInstanceId;
				case 'teamGroup':
					return validateByTeamGroupId;
				case 'staff':
					return validateByStaffId;
				case 'clubTransfer':
					return validateByClubTransferId;
				case 'notification':
					return validateByNotificationId;
				case 'clubSeason':
					return validateByClubSeasonId;
				case 'agent':
					return validateByAgentId;
				case 'teamArray':
					return validateByTeamArray;
				case 'teamSeason':
					return validateByTeamSeasonId;
				case 'scoutingLineup':
					return validateByScoutingLineupId;
				case 'customerPlayer':
					return validateByCustomerPlayerId;
				case 'teamSeasonArray':
					return validateByTeamSeasonArray;
				case 'customerPlayerUsername':
					return validateByCustomerPlayerUsername;
				case 'scoutingGame':
					return validateByScoutingGame;
				case 'scoutingGameReport':
					return validateByScoutingGameReport;
				case 'videoAsset':
					return validateByVideoAssetId;
				case 'employmentContract':
					return validateByEmploymentContract;
				case 'transferContract':
					return validateByTransferContract;
				case 'agentContract':
					return validateByAgentContract;
				case 'agentContractArray':
					return validateByAgentContractArray;
				case 'person':
					return validateByPersonId;
				case 'playerTransfer':
					return validateByPlayerTransferId;
				case 'medicalTreatment':
					return validateByMedicalTreatmentId;
				default:
					return () => Promise.resolve(false);
			}
		})();
		return await validateFunction(req, arg, validTeamIds, validClubId);
	}

	async function validateByCustomerId(req, customerId, validTeamIds, validClubId) {
		if (!customerId) return false;
		const customerCollection = req.app.models.Customer.getDataSource().connector.collection(
			req.app.models.Customer.modelName
		);
		const customer = await customerCollection.findOne({ _id: ObjectID(customerId) });
		return customer && String(customer.clubId) === String(validClubId);
	}

	async function validateByTeamId(req, teamId, validTeamIds, validClubId) {
		if (!teamId || isEmpty(teamId) || typeof teamId !== 'string') return false;
		const teamCollection = req.app.models.Team.getDataSource().connector.collection(req.app.models.Team.modelName);
		const team = await teamCollection.findOne({ _id: ObjectID(teamId) }, { _id: 1, name: 1 });
		return team && validTeamIds.includes(String(team._id));
	}

	async function validateByClubId(req, clubId, validTeamIds, validClubId) {
		if (!clubId || isEmpty(clubId)) return false;
		const clubCollection = req.app.models.Club.getDataSource().connector.collection(req.app.models.Club.modelName);
		const club = await clubCollection.findOne({ _id: ObjectID(clubId) }, { _id: 1, name: 1 });
		return club && String(club._id) === String(clubId);
	}

	async function validateByCustomerTeamSettings(req, teamSettingId, validTeamIds, validClubId) {
		if (!teamSettingId || isEmpty(teamSettingId)) return false;
		const teamSettingsCollection = req.app.models.CustomerTeamSettings.getDataSource().connector.collection(
			req.app.models.CustomerTeamSettings.modelName
		);
		const teamSettings = await teamSettingsCollection.findOne({ _id: ObjectID(teamSettingId) }, { _id: 1, name: 1 });
		return teamSettings && String(teamSettings._id) === String(teamSettingId);
	}

	async function validateByCustomerPlayerId(req, playerId, validTeamIds, validClubId) {
		if (!playerId || isEmpty(playerId)) return false;
		const customerPlayerCollection = req.app.models.CustomerPlayer.getDataSource().connector.collection(
			req.app.models.CustomerPlayer.modelName
		);
		const player = await customerPlayerCollection.findOne({ _id: ObjectID(playerId) }, { _id: 1, clubId: 1 });
		return player && player.clubId && String(validClubId) === String(player.clubId);
	}

	async function validateByPlayerId(req, playerId, validTeamIds, validClubId) {
		if (!playerId || isEmpty(playerId) || typeof playerId !== 'string') return false;
		const playerCollection = req.app.models.Player.getDataSource().connector.collection(
			req.app.models.Player.modelName
		);
		const player = await playerCollection.findOne({ _id: ObjectID(playerId) }, { _id: 1, teamId: 1, clubId: 1 });
		return player && player.clubId && String(player.clubId) === String(validClubId);
	}

	async function validateByPlayerScoutingId(req, playerScoutingId, validTeamIds, validClubId) {
		if (!playerScoutingId || isEmpty(playerScoutingId)) return false;
		const playerCollection = req.app.models.PlayerScouting.getDataSource().connector.collection(
			req.app.models.PlayerScouting.modelName
		);
		const player = await playerCollection.findOne(
			{ _id: ObjectID(playerScoutingId) },
			{ _id: 1, teamId: 1, clubId: 1 }
		);
		return (
			player != null &&
			// (player.teamId && validTeamIds.includes(player.teamId.toString())) ||
			player.clubId &&
			String(player.clubId) === String(validClubId)
		);
	}

	async function validateByPlayerObjArray(req, playerArray, validTeamIds, validClubId) {
		if (!playerArray || isEmpty(playerArray)) return false;
		const playerCollection = req.app.models.Player.getDataSource().connector.collection(
			req.app.models.Player.modelName
		);
		let result = true;
		for (const pl of playerArray) {
			const player = await playerCollection.findOne({ _id: ObjectID(pl.playerId) }, { _id: 1, clubId: 1, teamId: 1 });
			if (player && player.clubId && String(player.clubId) === String(validClubId)) result = result && true;
			else result = false;
		}
		return playerArray.length > 0 && result;
	}

	async function validateByDrillId(req, drillId, validTeamIds, validClubId) {
		if (!drillId || isEmpty(drillId)) return false;
		const drillCollection = req.app.models.Drill.getDataSource().connector.collection(req.app.models.Drill.modelName);
		const drill = await drillCollection.findOne({ _id: ObjectID(drillId) }, { _id: 1, teamId: 1 });
		return drill && validTeamIds.includes(String(drill.teamId));
	}

	async function validateByBasicWageId(req, basicWageId, validTeamIds, validClubId) {
		if (!basicWageId || isEmpty(basicWageId)) return false;
		const basicWageCollection = req.app.models.BasicWage.getDataSource().connector.collection(
			req.app.models.BasicWage.modelName
		);
		return await basicWageCollection.findOne({ _id: ObjectID(basicWageId) }, { _id: 1 });
	}
	async function validateByBonusId(req, bonusId, validTeamIds) {
		if (!bonusId || isEmpty(bonusId)) return false;
		const bonusCollection = req.app.models.Bonus.getDataSource().connector.collection(req.app.models.Bonus.modelName);
		return await bonusCollection.findOne({ _id: ObjectID(bonusId) }, { _id: 1 });
	}

	async function validateByTeamBonusId(req, bonusId, validTeamIds) {
		if (!bonusId || isEmpty(bonusId)) return false;
		const bonusCollection = req.app.models.TeamBonus.getDataSource().connector.collection(
			req.app.models.TeamBonus.modelName
		);
		const bonus = await bonusCollection.findOne({ _id: ObjectID(bonusId) }, { _id: 1 });
		return bonus && validTeamIds.includes(String(bonus.teamId));
	}

	async function validateByTestId(req, testId, validTeamIds, validClubId) {
		if (!testId || isEmpty(testId)) return false;
		const testCollection = req.app.models.Test.getDataSource().connector.collection(req.app.models.Test.modelName);
		const test = await testCollection.findOne({ _id: ObjectID(testId) }, { _id: 1, teamId: 1 });
		return (test && validTeamIds.includes(String(test.teamId))) || String(test.teamId) === 'GLOBAL';
	}

	async function validateByWellnessId(req, wellnessId, validTeamIds, validClubId) {
		if (!wellnessId || isEmpty(wellnessId)) return false;
		const wellnessCollection = req.app.models.Wellness.getDataSource().connector.collection(
			req.app.models.Wellness.modelName
		);
		const playerCollection = req.app.models.Player.getDataSource().connector.collection(
			req.app.models.Player.modelName
		);
		const wellness = await wellnessCollection.findOne({ _id: ObjectID(wellnessId) }, { _id: 1, playerId: 1 });
		const plId = wellness ? ObjectID(wellness.playerId.toString()) : null;
		const pl = await playerCollection.findOne({ _id: plId }, { _id: 1, teamId: 1 });
		return pl && pl.teamId && validTeamIds.includes(String(pl.teamId));
	}

	async function validateByMatchId(req, matchId, validTeamIds, validClubId) {
		if (!matchId || isEmpty(matchId)) return false;
		const matchCollection = req.app.models.Match.getDataSource().connector.collection(req.app.models.Match.modelName);
		const match = await matchCollection.findOne({ _id: ObjectID(matchId) }, { _id: 1, teamId: 1, teamSeasonId: 1 });
		return match && validTeamIds.includes(String(match.teamId));
	}

	async function validateByVideoAssetId(req, videoAssetId, validTeamIds, validClubId) {
		if (!videoAssetId || isEmpty(videoAssetId)) return false;
		const videoAssetCollection = req.app.models.VideoAsset.getDataSource().connector.collection(
			req.app.models.VideoAsset.modelName
		);
		const video = await videoAssetCollection.findOne({ _id: ObjectID(videoAssetId) }, { _id: 1, teamId: 1 });
		return video != null && !!validTeamIds.includes(String(video.teamId));
	}

	async function validateByEventId(req, eventId, validTeamIds, validClubId) {
		if (!eventId || isEmpty(eventId)) return false;
		const eventCollection = req.app.models.Event.getDataSource().connector.collection(req.app.models.Event.modelName);
		const event = await eventCollection.findOne({ _id: ObjectID(eventId) }, { _id: 1, teamId: 1 });
		return event && validTeamIds.includes(String(event.teamId));
	}
	async function validateByEventArray(req, eventIds, validTeamIds, validClubId) {
		if (!eventIds || isEmpty(eventIds)) return false;
		const eventCollection = req.app.models.Event.getDataSource().connector.collection(req.app.models.Event.modelName);
		let result = true;
		for (const idEvent of eventIds) {
			const ev = await eventCollection.findOne({ _id: ObjectID(idEvent) }, { _id: 1, teamId: 1 });
			if (ev && validTeamIds.includes(String(ev.teamId))) result = result && true;
			else result = false;
		}
		return eventIds.length > 0 && result;
	}

	async function validateByPlayerArray(req, playerArray, validTeamIds, validClubId) {
		if (!playerArray || isEmpty(playerArray)) return false;
		const playerCollection = req.app.models.Player.getDataSource().connector.collection(
			req.app.models.Player.modelName
		);

		let result = true;
		for (const plId of playerArray) {
			if (plId.players && plId.players.length > 0) {
				if (plId && plId.clubId && String(plId.clubId) === String(validClubId)) result = result && true;
			} else {
				const player = await playerCollection.findOne({ _id: ObjectID(plId) }, { _id: 1, teamId: 1, clubId: 1 });
				if ((player && player.clubId && String(player.clubId) === validClubId.toString()) || !player)
					result = result && true;
				else result = false;
			}
		}
		return playerArray.length > 0 && result;
	}

	async function validateByInjuryId(req, injuryId, validTeamIds, validClubId) {
		if (!injuryId || isEmpty(injuryId)) return false;
		const injuryCollection = req.app.models.Injury.getDataSource().connector.collection(
			req.app.models.Injury.modelName
		);
		const playerCollection = req.app.models.Player.getDataSource().connector.collection(
			req.app.models.Player.modelName
		);
		const inj = await injuryCollection.findOne({ _id: ObjectID(injuryId) }, { _id: 1, playerId: 1 });
		const plId = inj ? ObjectID(inj.playerId.toString()) : null;
		const pl = await playerCollection.findOne({ _id: plId }, { _id: 1, teamId: 1 });
		if (pl && pl.teamId && validTeamIds.includes(String(pl.teamId))) return true;
		return false;
	}

	async function validateByTestArray(req, testArray, validTeamIds, validClubId) {
		if (!testArray || isEmpty(testArray)) return false;
		const testCollection = req.app.models.Test.getDataSource().connector.collection(req.app.models.Test.modelName);
		let result = true;
		for (const testId of testArray) {
			const test = await testCollection.findOne({ _id: ObjectID(testId) }, { _id: 1, teamId: 1 });
			if ((test && validTeamIds.includes(String(test.teamId))) || String(test.teamId) === 'GLOBAL')
				result = result && true;
			else result = false;
		}
		return testArray.length > 0 && result;
	}

	async function validateByTestInstanceId(req, testInstanceId, validTeamIds, validClubId) {
		if (!testInstanceId || isEmpty(testInstanceId)) return false;
		const testInstanceCollection = req.app.models.TestInstance.getDataSource().connector.collection(
			req.app.models.TestInstance.modelName
		);
		const inst = await testInstanceCollection.findOne({ _id: ObjectID(testInstanceId) }, { _id: 1, teamId: 1 });
		return inst && validTeamIds.includes(String(inst.teamId));
	}

	async function validateByTeamGroupId(req, teamGroupId, validTeamIds, validClubId) {
		if (!teamGroupId || isEmpty(teamGroupId)) return false;
		const teamSeasonCollection = req.app.models.TeamSeason.getDataSource().connector.collection(
			req.app.models.TeamSeason.modelName
		);
		const teamIdsMap = validTeamIds.map(x => ObjectID(x));
		const teamSeasons = await teamSeasonCollection
			.find({ teamId: { $in: teamIdsMap } }, { _id: 1, teamId: 1, teamGroupIds: 1 })
			.toArray();
		const isValid = teamSeasons.find(({ teamGroupIds }) =>
			(teamGroupIds || []).find(id => String(id) === String(teamGroupId))
		);
		return isValid;
	}

	async function validateByStaffId(req, staffId, validTeamIds, validClubId) {
		if (!staffId || isEmpty(staffId)) return false;
		const staffCollection = req.app.models.Staff.getDataSource().connector.collection(req.app.models.Staff.modelName);
		const staff = await staffCollection.findOne({ _id: ObjectID(staffId) }, { _id: 1, clubId: 1 });
		return (
			staff != null &&
			((staff.clubId && validClubId === String(staff.clubId)) ||
				(staff.teamId && validTeamIds.includes(String(staff.teamId))))
		);
	}

	async function validateByMedicalTreatmentId(req, treatmentId, validTeamIds, validClubId) {
		if (!treatmentId || isEmpty(treatmentId)) return false;
		const treatmentCollection = req.app.models.MedicalTreatment.getDataSource().connector.collection(
			req.app.models.MedicalTreatment.modelName
		);
		const treatment = await treatmentCollection.findOne({ _id: ObjectID(treatmentId) }, { _id: 1, playerId: 1 });
		if (!treatment) return false;
		const playerCollection = req.app.models.Player.getDataSource().connector.collection(
			req.app.models.Player.modelName
		);
		const player = await playerCollection.findOne({ _id: ObjectID(treatment.playerId) }, { _id: 1, teamId: 1 });
		return player && player.teamId && validTeamIds.includes(String(player.teamId));
	}

	async function validateByPlayerTransferId(req, playerTransferId, validTeamIds, validClubId) {
		if (!playerTransferId || isEmpty(playerTransferId)) return false;
		const playerTransferCollection = req.app.models.PlayerTransfer.getDataSource().connector.collection(
			req.app.models.PlayerTransfer.modelName
		);
		const playerTransfer = await playerTransferCollection.findOne(
			{ _id: ObjectID(playerTransferId) },
			{ _id: 1, teamId: 1, clubId: 1, playerId: 1 }
		);
		if (!playerTransfer) return false;
		return await validateByClubTransferId(req, playerTransfer.clubTransferId, validTeamIds, validClubId);
	}

	async function validateByClubTransferId(req, clubTransferId, validTeamIds, validClubId) {
		if (!clubTransferId || isEmpty(clubTransferId)) return false;
		const clubTransferCollection = req.app.models.ClubTransfer.getDataSource().connector.collection(
			req.app.models.ClubTransfer.modelName
		);
		const clubTransfer = await clubTransferCollection.findOne({ _id: ObjectID(clubTransferId) }, { _id: 1, clubId: 1 });
		return clubTransfer && clubTransfer.clubId && String(validClubId) === String(clubTransfer.clubId);
	}

	async function validateByNotificationId(req, notificationId, validTeamIds, validClubId) {
		if (!notificationId || isEmpty(notificationId)) return false;
		const notificationCollection = req.app.models.Notification.getDataSource().connector.collection(
			req.app.models.Notification.modelName
		);
		const inst = await notificationCollection.findOne(
			{ _id: ObjectID(notificationId) },
			{ _id: 1, teamId: 1, clubId: 1 }
		);
		return inst && (validTeamIds.includes(String(inst.teamId)) || String(inst.clubId) === String(validClubId));
	}

	async function validateByClubSeasonId(req, clubSeasonId, validTeamIds, validClubId) {
		if (!clubSeasonId || isEmpty(clubSeasonId)) return false;
		const clubSeasonCollection = req.app.models.ClubSeason.getDataSource().connector.collection(
			req.app.models.ClubSeason.modelName
		);
		const clubSeason = await clubSeasonCollection.findOne({ _id: ObjectID(clubSeasonId) }, { _id: 1, clubId: 1 });
		return clubSeason && clubSeason.clubId && String(validClubId) === String(clubSeason.clubId);
	}

	function isEmpty(obj) {
		for (const key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
		}
		return true;
	}

	async function validateByAgentId(req, agentId, validTeamIds, validClubId) {
		if (!agentId || isEmpty(agentId)) return false;
		const agentCollection = req.app.models.Agent.getDataSource().connector.collection(req.app.models.Agent.modelName);
		const agent = await agentCollection.findOne({ _id: ObjectID(agentId) }, { _id: 1, teamId: 1, clubId: 1 });
		return agent && validTeamIds.includes(String(agent.teamId));
	}

	async function validateByTeamArray(req, teamArray, validTeamIds, validClubId) {
		if (!teamArray || isEmpty(teamArray)) return false;
		let result = true;
		for (const teamId of teamArray) {
			if (validTeamIds.includes(teamId.toString())) result = result && true;
			else result = false;
		}
		return teamArray.length > 0 && result;
	}

	async function validateByTeamSeasonId(req, teamSeasonId, validTeamIds, validClubId) {
		if (!teamSeasonId || isEmpty(teamSeasonId) || !isString(teamSeasonId)) return false;
		const teamSeasonCollection = req.app.models.TeamSeason.getDataSource().connector.collection(
			req.app.models.TeamSeason.modelName
		);
		const teamSeason = await teamSeasonCollection.findOne({ _id: ObjectID(teamSeasonId) }, { _id: 1, teamId: 1 });
		return teamSeason && validTeamIds.includes(String(teamSeason.teamId));
	}

	async function validateByScoutingLineupId(req, scoutingLineupId, validTeamIds, validClubId) {
		if (!scoutingLineupId || isEmpty(scoutingLineupId)) return false;
		const scoutingLineupCollection = req.app.models.ScoutingLineup.getDataSource().connector.collection(
			req.app.models.ScoutingLineup.modelName
		);
		const scoutingLineup = await scoutingLineupCollection.findOne(
			{ _id: ObjectID(scoutingLineupId) },
			{ _id: 1, teamId: 1, clubId: 1 }
		);
		return scoutingLineup && validTeamIds.includes(String(scoutingLineup.teamId));
	}

	async function validateByTeamSeasonArray(req, teamSeasonIds, validTeamIds, validClubId) {
		if (!teamSeasonIds || isEmpty(teamSeasonIds)) return false;
		const teamSeasonCollection = req.app.models.TeamSeason.getDataSource().connector.collection(
			req.app.models.TeamSeason.modelName
		);
		let result = true;
		for (const idTeamSeason of teamSeasonIds) {
			const teamSeason = await teamSeasonCollection.findOne({ _id: ObjectID(idTeamSeason) }, { _id: 1, teamId: 1 });
			if (teamSeason && validTeamIds.includes(String(teamSeason.teamId))) result = result && true;
			else result = false;
		}
		return teamSeasonIds.length > 0 && result;
	}

	async function validateByCustomerPlayerUsername(req, playerUsername, validTeamIds, validClubId) {
		if (!playerUsername || isEmpty(playerUsername)) return false;
		const customerPlayerCollection = req.app.models.CustomerPlayer.getDataSource().connector.collection(
			req.app.models.CustomerPlayer.modelName
		);
		const playerCollection = req.app.models.Player.getDataSource().connector.collection(
			req.app.models.Player.modelName
		);
		const customerPlayer = await customerPlayerCollection.findOne(
			{ username: playerUsername },
			{ _id: 1, playerId: 1 }
		);
		if (!customerPlayer) return false;
		const player = await playerCollection.findOne({ _id: ObjectID(customerPlayer.playerId) }, { _id: 1, clubId: 1 });
		return player && player.clubId && String(validClubId) === String(player.clubId);
	}

	async function validateByScoutingGame(req, scoutingGameId, validTeamIds, validClubId) {
		if (!scoutingGameId || isEmpty(scoutingGameId)) return false;
		const scoutingGameCollection = req.app.models.ScoutingGame.getDataSource().connector.collection(
			req.app.models.ScoutingGame.modelName
		);
		const scoutingGame = await scoutingGameCollection.findOne(
			{ _id: ObjectID(scoutingGameId) },
			{ _id: 1, teamId: 1, clubId: 1, playerId: 1 }
		);
		return (
			scoutingGame &&
			((scoutingGame.teamId && validTeamIds.includes(String(scoutingGame.teamId))) ||
				(scoutingGame.clubId && String(scoutingGame.clubId) === String(validClubId)))
		);
	}

	async function validateByEmploymentContract(req, contractId, validTeamIds, validClubId) {
		if (!contractId || isEmpty(contractId)) return false;
		const employmentCollection = req.app.models.EmploymentContract.getDataSource().connector.collection(
			req.app.models.EmploymentContract.modelName
		);
		const employmentContract = await employmentCollection.findOne(
			{ _id: ObjectID(contractId) },
			{ _id: 1, personId: 1, personType: 1 }
		);
		if (!employmentContract) return false;
		const owner = await req.app.models[employmentContract.personType]
			.getDataSource()
			.connector.collection(req.app.models[employmentContract.personType].modelName)
			.findOne({ _id: ObjectID(employmentContract.personId) }, { teamId: 1, clubId: 1 });
		if (
			owner &&
			((owner.teamId && validTeamIds.includes(owner.teamId.toString())) ||
				(owner.clubId && owner.clubId.toString() === validClubId))
		)
			return true;
		else return false;
	}

	async function validateByTransferContract(req, contractId, validTeamIds, validClubId) {
		if (!contractId || isEmpty(contractId)) return false;
		const collection = req.app.models.TransferContract.getDataSource().connector.collection(
			req.app.models.TransferContract.modelName
		);
		const transferContract = await collection.findOne(
			{ _id: ObjectID(contractId) },
			{ _id: 1, personId: 1, personType: 1 }
		);
		if (!transferContract) return false;
		const owner = await req.app.models[transferContract.personType]
			.getDataSource()
			.connector.collection(req.app.models[transferContract.personType].modelName)
			.findOne({ _id: ObjectID(transferContract.personId) }, { teamId: 1, clubId: 1 });
		if (
			owner &&
			((owner.teamId && validTeamIds.includes(owner.teamId.toString())) ||
				(owner.clubId && owner.clubId.toString() === validClubId))
		)
			return true;
		else return false;
	}

	async function validateByAgentContract(req, contractId, validTeamIds, validClubId) {
		if (!contractId || isEmpty(contractId)) return false;
		const collection = req.app.models.AgentContract.getDataSource().connector.collection(
			req.app.models.AgentContract.modelName
		);
		const agentContract = await collection.findOne(
			{ _id: ObjectID(contractId) },
			{ _id: 1, contractId: 1, contractType: 1 }
		);
		if (!agentContract) return false;
		const parent = await req.app.models[agentContract.contractType]
			.getDataSource()
			.connector.collection(req.app.models[agentContract.contractType].modelName)
			.findOne({ _id: ObjectID(agentContract.contractId) }, { _id: 1, personId: 1, personType: 1 });
		const owner = await req.app.models[parent.personType]
			.getDataSource()
			.connector.collection(req.app.models[parent.personType].modelName)
			.findOne({ _id: ObjectID(parent.personId) }, { teamId: 1, clubId: 1 });
		if (
			owner &&
			((owner.teamId && validTeamIds.includes(owner.teamId.toString())) ||
				(owner.clubId && owner.clubId.toString() === validClubId))
		)
			return true;
		else return false;
	}

	async function validateByAgentContractArray(req, contractIds, validTeamIds, validClubId) {
		if (!contractIds || isEmpty(contractIds)) return false;
		let result = true;
		for (const contractId of contractIds) {
			result = await validateByAgentContract(req, contractId, validTeamIds, validClubId);
		}
		return result;
	}

	async function validateByPersonId(req, personId, validTeamIds, validClubId) {
		if (!personId || isEmpty(personId) || typeof personId !== 'string') return false;
		const [res1, res2, res3, res4, res5] = await Promise.all([
			validateByPlayerId(req, personId, validTeamIds, validClubId),
			validateByPlayerScoutingId(req, personId, validTeamIds, validClubId),
			validateByStaffId(req, personId, validTeamIds, validClubId),
			validateByAgentId(req, personId, validTeamIds, validClubId),
			validateByPlayerTransferId(req, personId, validTeamIds, validClubId)
		]);
		return res1 || res2 || res3 || res4 || res5;
	}
};
async function validateByScoutingGameReport(req, scoutingGameReportId, validTeamIds, validClubId) {
	if (!scoutingGameReportId || isEmpty(scoutingGameReportId)) return false;
	const scoutingGameReportCollection = req.app.models.ScoutingGameReport.getDataSource().connector.collection(
		req.app.models.ScoutingGameReport.modelName
	);
	const scoutingGameReport = await scoutingGameReportCollection.findOne(
		{ _id: ObjectID(scoutingGameReportId) },
		{ _id: 1, teamId: 1, clubId: 1, playerId: 1 }
	);
	return scoutingGameReport && scoutingGameReport.teamId && validTeamIds.includes(String(scoutingGameReport.teamId));
}

async function validateByPlayerGameReport(req, playerGameReportId, validTeamIds, validClubId) {
	if (!playerGameReportId || isEmpty(playerGameReportId)) return false;
	const playerGameReportCollection = req.app.models.PlayerGameReport.getDataSource().connector.collection(
		req.app.models.PlayerGameReport.modelName
	);
	const playerGameReport = await playerGameReportCollection.findOne(
		{ _id: ObjectID(playerGameReportId) },
		{ _id: 1, teamId: 1, clubId: 1, playerId: 1 }
	);
	return playerGameReport && playerGameReport.teamId && validTeamIds.includes(String(playerGameReport.teamId));
}

async function validateByPlayerTrainingReport(req, playerTrainingReportId, validTeamIds, validClubId) {
	if (!playerTrainingReportId || isEmpty(playerTrainingReportId)) return false;
	const playerTrainingReportCollection = req.app.models.PlayerTrainingReport.getDataSource().connector.collection(
		req.app.models.PlayerTrainingReport.modelName
	);
	const playerTrainingReport = await playerTrainingReportCollection.findOne(
		{ _id: ObjectID(playerTrainingReportId) },
		{ _id: 1, teamId: 1, clubId: 1, playerId: 1 }
	);
	return (
		playerTrainingReport && playerTrainingReport.teamId && validTeamIds.includes(String(playerTrainingReport.teamId))
	);
}

/* TODO =>
		{ 'url': '/tests', 'paramToCheck': [] }, // TODO FIND e CREATE MANY
		{ 'url': '/players', 'paramToCheck': [{'where.teamId' : 'team'},{'where.clubId' : 'club'}] }, // CREATE MANY?
				{ 'url': '/Wellnesses', 'paramToCheck': [{'playerId' : 'player'}] }, // CREATE MANY?
*/

function searchProperty(object, isRoot, param) {
	let result = false;
	if (isRoot && Array.isArray(object)) {
		for (let i = 0; i < object.length; i++) {
			result = result ? result : searchProperty(object[i], false, param);
		}
	} else {
		for (const p in object) {
			if (p === param) {
				result = object[p];
				break;
			} else if (Array.isArray(object[p])) {
				for (let i = 0; i < object[p].length; i++) {
					result = result ? result : searchProperty(object[p][i], false, param);
				}
			} else if (object[p] instanceof Object) {
				result = result ? result : searchProperty(object[p], false, param);
			}
		}
	}
	return result;
}

function hasExpired({ created, ttl }) {
	return moment(created).add(ttl, 'second').isSameOrBefore(moment());
}
