const { ObjectID } = require('mongodb');

module.exports = {
	getTeamPipeline: (Team, currentTeamId) =>
		getCollection(Team, 'Team')
			.aggregate(defaultPipeline(currentTeamId, 'Team', '_presetTestAttachments', '_id'))
			.toArray(),

	getAttachmentsPipeline: (Team, currentTeamId, model, additionalOptons = null) =>
		getCollection(Team, model).aggregate(defaultPipeline(currentTeamId, model, additionalOptons)).toArray(),

	getTestInstancePipeline: (Team, currentTeamId, isMedical) =>
		getCollection(Team, 'TestInstance')
			.aggregate([
				{
					$match: { [currentTeamId]: ObjectID(currentTeamId), [`_attachments.0`]: { $exists: true } }
				},
				{
					$project: { _attachments: 1, testId: 1 }
				},
				{
					$unwind: `$_attachments`
				},
				{
					$addFields: {
						'_attachments.parentId': { $toString: '$_id' },
						'_attachments.parentType': 'TestInstance',
						'_attachments.testId': { $toString: '$testId' }
					}
				},
				{
					$replaceRoot: {
						newRoot: `$_attachments`
					}
				}
			])
			.toArray(),

	getPlayerScoutingPipeline: (Team, clubId) =>
		getCollection(Team, 'PlayerScouting')
			.aggregate([
				{
					$match: {
						clubId: ObjectID(String(clubId))
					}
				},
				{
					$addFields: {
						stringId: { $toString: '$_id' }
					}
				},
				{
					$lookup: {
						from: 'VideoAsset',
						localField: 'stringId',
						foreignField: 'linkedId',
						as: 'videos'
					}
				},
				{ $unwind: '$videos' },
				{
					$replaceRoot: {
						newRoot: '$videos'
					}
				},
				{
					$addFields: { '_videoFile.parentId': { $toString: '$linkedId' }, '_videoFile.parentType': 'PlayerScouting' }
				},
				{
					$replaceRoot: {
						newRoot: '$_videoFile'
					}
				}
			])
			.toArray(),

	getVideoAssetPipeline: (Team, currentTeamId) =>
		getCollection(Team, 'VideoAsset')
			.aggregate([
				{
					$match: {
						teamId: ObjectID(currentTeamId)
					}
				},
				{
					$facet: {
						videoFile: [
							{ $addFields: { '_videoFile.parentId': { $toString: '$_id' }, '_videoFile.parentType': 'VideoAsset' } },
							{
								$replaceRoot: {
									newRoot: '$_videoFile'
								}
							}
						],
						attachments: [
							{
								$unwind: '$_attachments'
							},
							{
								$addFields: {
									'_attachments.parentId': { $toString: '$_id' },
									'_attachments.parentType': 'VideoAsset'
								}
							},
							{
								$replaceRoot: {
									newRoot: '$_attachments'
								}
							}
						]
					}
				},
				{
					$project: { _attachments: { $concatArrays: ['$videoFile', '$attachments'] } }
				},
				{
					$unwind: '$_attachments'
				},
				{
					$replaceRoot: {
						newRoot: '$_attachments'
					}
				}
			])
			.toArray(),

	getEventPipeline: (Team, currentTeamId) =>
		getCollection(Team, 'Event')
			.aggregate([
				{
					$match: {
						teamId: ObjectID(currentTeamId)
					}
				},
				{
					$facet: {
						_video: [
							{ $addFields: { '_video.parentId': { $toString: '$_id' }, '_video.parentType': 'Event' } },
							{
								$replaceRoot: {
									newRoot: '$_video'
								}
							}
						],
						_attachments: [
							{
								$unwind: '$_attachments'
							},
							{
								$addFields: {
									'_attachments.parentId': { $toString: '$_id' },
									'_attachments.parentType': 'Event'
								}
							},
							{
								$replaceRoot: {
									newRoot: '$_attachments'
								}
							}
						]
					}
				},
				{
					$project: { _attachments: { $concatArrays: ['$_video', '$_attachments'] } }
				},
				filterByNullHelper('_attachments'),
				{
					$unwind: '$_attachments'
				},
				{
					$replaceRoot: {
						newRoot: '$_attachments'
					}
				}
			])
			.toArray(),

	getScoutingGameReportPipeline: (Team, currentTeamId) =>
		getCollection(Team, 'ScoutingGameReport')
			.aggregate([
				{
					$match: {
						teamId: ObjectID(currentTeamId),
						$or: [{ videoAttachment: { $ne: null } }, { docAttachment: { $ne: null } }]
					}
				},
				{
					$facet: {
						videoAttachment: [
							{
								$addFields: {
									'videoAttachment.parentId': { $toString: '$scoutingGameId' },
									'videoAttachment.parentType': 'ScoutingGame'
								}
							},
							{
								$replaceRoot: {
									newRoot: '$videoAttachment'
								}
							}
						],
						docAttachment: [
							{
								$addFields: {
									'docAttachment.parentId': { $toString: '$scoutingGameId' },
									'docAttachment.parentType': 'ScoutingGame'
								}
							},
							{
								$replaceRoot: {
									newRoot: '$docAttachment'
								}
							}
						]
					}
				},
				{
					$project: { _attachments: { $concatArrays: ['$videoAttachment', '$docAttachment'] } }
				},
				filterByNullHelper('_attachments'),
				{
					$unwind: '$_attachments'
				},
				{
					$replaceRoot: {
						newRoot: '$_attachments'
					}
				}
			])
			.toArray(),

	getInjuryPipeline: (Team, currentTeamId) =>
		getCollection(Team, 'Player')
			.aggregate([
				{
					$match: {
						teamId: ObjectID(currentTeamId)
					}
				},
				{
					$lookup: { from: 'Injury', localField: '_id', foreignField: 'playerId', as: 'injuries' }
				},
				{
					$project: {
						injuries: 1
					}
				},
				{
					$unwind: '$injuries'
				},
				{
					$replaceRoot: {
						newRoot: '$injuries'
					}
				},
				{
					$addFields: {
						elements: {
							$concatArrays: ['$_injuryExams']
						}
					}
				},
				{
					$project: {
						elements: 1
					}
				},
				{
					$unwind: '$elements'
				},
				{ $addFields: { [`elements.parentId`]: { $toString: '$_id' }, [`elements.parentType`]: 'Injury' } },
				{
					$replaceRoot: {
						newRoot: '$elements'
					}
				},
				{
					$match: { attachment: { $ne: null } }
				},
				{
					$addFields: { [`attachment.parentId`]: { $toString: '$parentId' }, [`attachment.parentType`]: '$parentType' }
				},
				{
					$project: {
						attachment: 1
					}
				},
				{
					$replaceRoot: {
						newRoot: '$attachment'
					}
				}
			])
			.toArray(),

	getPlayerPipeline: (Team, currentTeamId, permissions) =>
		getCollection(Team, 'Player')
			.aggregate([
				{
					$match: {
						teamId: ObjectID(currentTeamId)
					}
				},
				{
					$facet: {
						...(permissions.includes('medical-screenings') && {
							anamnesys: [
								{
									$addFields: {
										[`anamnesys.parentId`]: { $toString: '$_id' },
										[`anamnesys.parentType`]: 'ClinicalRecords'
									}
								},
								{ $project: { anamnesys: 1 } },
								{ $unwind: '$anamnesys' },
								{
									$replaceRoot: {
										newRoot: '$anamnesys'
									}
								},
								{
									$addFields: {
										[`_attachments.parentId`]: { $toString: '$parentId' },
										[`_attachments.parentType`]: '$parentType'
									}
								},
								{ $project: { _attachments: 1 } },
								{ $unwind: '$_attachments' },
								{
									$replaceRoot: {
										newRoot: '$_attachments'
									}
								},
								{
									$match: { url: { $ne: null } }
								}
							]
						}),
						...(permissions.includes('maintenance') && {
							_preventionExams: [
								{
									$addFields: {
										[`_preventionExams.parentId`]: { $toString: '$_id' },
										[`_preventionExams.parentType`]: 'PreventionExam'
									}
								},
								{ $project: { _preventionExams: 1 } },
								{ $unwind: '$_preventionExams' },
								{
									$replaceRoot: {
										newRoot: '$_preventionExams'
									}
								},
								{
									$addFields: {
										[`attachment.parentId`]: { $toString: '$parentId' },
										[`attachment.parentType`]: '$parentType'
									}
								},
								{ $project: { attachment: 1 } },
								{ $unwind: '$attachment' },
								{
									$replaceRoot: {
										newRoot: '$attachment'
									}
								},
								{
									$match: { url: { $ne: null } }
								}
							]
						}),
						// ...(permissions.includes('legal') && {
						// 	_playerContracts: [
						// 		{
						// 			$addFields: {
						// 				[`_playerContracts.parentId`]: { $toString: '$_id' },
						// 				[`_playerContracts.parentType`]: 'EmploymentContract'
						// 			}
						// 		},
						// 		{ $project: { _playerContracts: 1 } },
						// 		{ $unwind: '$_playerContracts' },
						// 		{
						// 			$replaceRoot: {
						// 				newRoot: '$_playerContracts'
						// 			}
						// 		},
						// 		{
						// 			$addFields: {
						// 				[`_attachments.parentId`]: { $toString: '$parentId' },
						// 				[`_attachments.parentType`]: '$parentType',
						// 				[`_attachments.peopleType`]: 'Player',
						// 				[`_attachments.contractId`]: { $toString: '$id' }
						// 			}
						// 		},
						// 		{ $project: { _attachments: 1 } },
						// 		{ $unwind: '$_attachments' },
						// 		{
						// 			$replaceRoot: {
						// 				newRoot: '$_attachments'
						// 			}
						// 		},
						// 		{
						// 			$match: { url: { $ne: null } }
						// 		}
						// 	],
						// 	_playerInwards: [
						// 		{
						// 			$addFields: {
						// 				[`_playerInwards.parentId`]: { $toString: '$_id' },
						// 				[`_playerInwards.parentType`]: 'InwardContract'
						// 			}
						// 		},
						// 		{ $project: { _playerInwards: 1 } },
						// 		{ $unwind: '$_playerInwards' },
						// 		{
						// 			$replaceRoot: {
						// 				newRoot: '$_playerInwards'
						// 			}
						// 		},
						// 		{
						// 			$addFields: {
						// 				[`_attachments.parentId`]: { $toString: '$parentId' },
						// 				[`_attachments.parentType`]: '$parentType',
						// 				[`_attachments.peopleType`]: 'Player',
						// 				[`_attachments.contractId`]: { $toString: '$id' }
						// 			}
						// 		},
						// 		{ $project: { _attachments: 1 } },
						// 		{ $unwind: '$_attachments' },
						// 		{
						// 			$replaceRoot: {
						// 				newRoot: '$_attachments'
						// 			}
						// 		},
						// 		{
						// 			$match: { url: { $ne: null } }
						// 		}
						// 	],
						// 	_playerOutwards: [
						// 		{
						// 			$addFields: {
						// 				[`_playerOutwards.parentId`]: { $toString: '$_id' },
						// 				[`_playerOutwards.parentType`]: 'OutwardContract'
						// 			}
						// 		},
						// 		{ $project: { _playerOutwards: 1 } },
						// 		{ $unwind: '$_playerOutwards' },
						// 		{
						// 			$replaceRoot: {
						// 				newRoot: '$_playerOutwards'
						// 			}
						// 		},
						// 		{
						// 			$addFields: {
						// 				[`_attachments.parentId`]: { $toString: '$parentId' },
						// 				[`_attachments.parentType`]: '$parentType',
						// 				[`_attachments.peopleType`]: 'Player',
						// 				[`_attachments.contractId`]: { $toString: '$id' }
						// 			}
						// 		},
						// 		{ $project: { _attachments: 1 } },
						// 		{ $unwind: '$_attachments' },
						// 		{
						// 			$replaceRoot: {
						// 				newRoot: '$_attachments'
						// 			}
						// 		},
						// 		{
						// 			$match: { url: { $ne: null } }
						// 		}
						// 	]
						// }),
						...(permissions.includes('my-team') && {
							_attributes: [
								{
									$addFields: {
										stringId: { $toString: '$_id' }
									}
								},
								{
									$lookup: {
										from: 'VideoAsset',
										localField: 'stringId',
										foreignField: 'linkedId',
										as: 'videos'
									}
								},
								{ $unwind: '$videos' },
								{
									$replaceRoot: {
										newRoot: '$videos'
									}
								},
								{
									$addFields: {
										'_videoFile.parentId': { $toString: '$linkedId' },
										'_videoFile.parentType': 'Attributes'
									}
								},
								{
									$replaceRoot: {
										newRoot: '$_videoFile'
									}
								}
							]
						})
					}
				},
				{
					$project: {
						elements: {
							$concatArrays: [
								...(permissions.includes('medical-screenings') ? ['$anamnesys'] : []),
								...(permissions.includes('maintenance') ? ['$_preventionExams'] : []),
								...(permissions.includes('legal') ? ['$_playerContracts', '$_playerInwards', '$_playerOutwards'] : []),
								...(permissions.includes('my-team') ? ['$_attributes'] : [])
							]
						}
					}
				},
				{
					$unwind: '$elements'
				},
				{
					$replaceRoot: {
						newRoot: '$elements'
					}
				}
			])
			.toArray(),

	// getStaffPipeline: (Team, currentTeamId) =>
	// 	getCollection(Team, 'Staff')
	// 		.aggregate([
	// 			{
	// 				$match: {
	// 					teamId: ObjectID(currentTeamId)
	// 				}
	// 			},
	// 			{
	// 				$facet: {
	// 					_playerContracts: [
	// 						{
	// 							$addFields: {
	// 								[`_playerContracts.parentId`]: { $toString: '$_id' },
	// 								[`_playerContracts.parentType`]: 'EmploymentContract'
	// 							}
	// 						},
	// 						{ $project: { _playerContracts: 1 } },
	// 						{ $unwind: '$_playerContracts' },
	// 						{
	// 							$replaceRoot: {
	// 								newRoot: '$_playerContracts'
	// 							}
	// 						},
	// 						{
	// 							$addFields: {
	// 								[`_attachments.parentId`]: { $toString: '$parentId' },
	// 								[`_attachments.parentType`]: '$parentType',
	// 								[`_attachments.peopleType`]: 'Staff',
	// 								[`_attachments.contractId`]: { $toString: '$id' }
	// 							}
	// 						},
	// 						{ $project: { _attachments: 1 } },
	// 						{ $unwind: '$_attachments' },
	// 						{
	// 							$replaceRoot: {
	// 								newRoot: '$_attachments'
	// 							}
	// 						},
	// 						{
	// 							$match: { url: { $ne: null } }
	// 						}
	// 					]
	// 				}
	// 			},
	// 			{
	// 				$unwind: '$_playerContracts'
	// 			},
	// 			{
	// 				$replaceRoot: {
	// 					newRoot: '$_playerContracts'
	// 				}
	// 			}
	// 		])
	// 		.toArray(),

	getMedicalTreatmentPipeline: (Team, currentTeamId) =>
		getCollection(Team, 'Player')
			.aggregate([
				{ $match: { teamId: ObjectID(currentTeamId) } },
				{
					$lookup: {
						from: 'MedicalTreatment',
						let: { plId: '$_id' },
						pipeline: [
							{
								$match: {
									$and: [
										{
											_attachment: {
												$exists: true
											}
										},
										{ $expr: { $ne: ['$_attachment', null] } },
										{ $expr: { $eq: ['$playerId', '$$plId'] } }
									]
								}
							}
						],
						as: 'treatment'
					}
				},
				{ $unwind: '$treatment' },
				{ $replaceRoot: { newRoot: '$treatment' } },
				{
					$addFields: {
						'_attachment.parentId': { $toString: '$_id' },
						'_attachment.injuryId': { $toString: '$injuryId' },
						'_attachment.playerId': { $toString: '$playerId' },
						'_attachment.parentType': 'MedicalTreatment'
					}
				},
				{ $replaceRoot: { newRoot: '$_attachment' } }
			])
			.toArray(),

	getEmploymentContractPipeline: (Team, personIds, personType = 'Player') =>
		getCollection(Team, 'EmploymentContract')
			.aggregate([
				{
					$match: {
						personId: { $in: personIds.map(ObjectID) },
						personType
					}
				},
				{
					$addFields: {
						[`_attachments.parentId`]: { $toString: '$personId' },
						[`_attachments.parentType`]: 'EmploymentContract',
						[`_attachments.peopleType`]: '$personType',
						[`_attachments.contractId`]: { $toString: '$_id' }
					}
				},
				{ $project: { _attachments: 1 } },
				{ $unwind: '$_attachments' },
				{
					$replaceRoot: {
						newRoot: '$_attachments'
					}
				},
				{
					$match: { url: { $ne: null } }
				}
			])
			.toArray(),

	getTransferContractPipeline: (Team, personIds) =>
		getCollection(Team, 'TransferContract')
			.aggregate([
				{
					$match: {
						personId: { $in: personIds.map(ObjectID) }
					}
				},
				{
					$addFields: {
						[`_attachments.parentId`]: { $toString: '$personId' },
						[`_attachments.parentType`]: 'TransferContract',
						[`_attachments.peopleType`]: '$personType',
						[`_attachments.contractId`]: { $toString: '$_id' }
					}
				},
				{ $project: { _attachments: 1 } },
				{ $unwind: '$_attachments' },
				{
					$replaceRoot: {
						newRoot: '$_attachments'
					}
				},
				{
					$match: { url: { $ne: null } }
				}
			])
			.toArray()
};

function getCollection(Team, collection) {
	return getConnector(Team, collection).collection(getModelName(Team, collection));
}

function getConnector(Team, collection) {
	const model = collection === 'Team' ? Team : Team.app.models[collection];
	return model.getDataSource().connector;
}

function getModelName(Team, collection) {
	const model = collection === 'Team' ? Team : Team.app.models[collection];
	return model.modelName;
}

function defaultPipeline(currentTeamId, model, property = '_attachments', paramId = 'teamId', additionalOptons = null) {
	return [
		{
			$match: { [paramId]: ObjectID(currentTeamId), [`${property}.0`]: { $exists: true }, ...additionalOptons }
		},
		{
			$project: { [property]: 1 }
		},
		{
			$unwind: `$${property}`
		},
		{ $addFields: { [`${property}.parentId`]: { $toString: '$_id' }, [`${property}.parentType`]: model } },
		{
			$replaceRoot: {
				newRoot: `$${property}`
			}
		}
	];
}

function filterByNullHelper(property) {
	return {
		$project: {
			[property]: {
				$filter: {
					input: `$${property}`,
					cond: { $ne: [{ $type: '$$item.url' }, 'missing'] },
					as: 'item'
				}
			}
		}
	};
}
