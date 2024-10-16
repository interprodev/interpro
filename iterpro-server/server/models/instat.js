require('https');
require('qs');

const wyscout = require('./thirdparty-connectors/wyscout');
const instatTDC = require('./thirdparty-connectors/instat');

module.exports = function (Instat) {
	Instat.getStandingsLeaderboard = instatTDC.getStandingsLeaderboard;

	Instat.getStandingsMatchList = instatTDC.getStandingsMatchList;

	Instat.getStandingsMatchStats = instatTDC.getStandingsMatchStats;

	// dashboard
	Instat.dashboard = instatTDC.dashboardAPI;
	Instat.remoteMethod('dashboard', {
		accepts: [
			{
				arg: 'teamId',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'instatTeamId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'instatCompetitionId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'instatSeasonId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'dateStart',
				type: 'any',
				required: false,
				http: { source: 'form' }
			},
			{
				arg: 'dateEnd',
				type: 'any',
				required: false,
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/dashboard',
			verb: 'post'
		}
	});

	// dashboardSingleTeamStat
	Instat.dashboardSingleTeamStat = instatTDC.dashboardSingleTeamStatAPI;
	Instat.remoteMethod('dashboardSingleTeamStat', {
		accepts: [
			{
				arg: 'instatMatchId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'instatTeamId1',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'instatTeamId2',
				type: 'number',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/dashboardSingleTeamStat',
			verb: 'post'
		}
	});

	// singleTeamStat
	Instat.singleTeamStat = instatTDC.singleTeamStatAPI;
	Instat.remoteMethod('singleTeamStat', {
		accepts: [
			{
				arg: 'instatMatchId',
				type: 'number',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/singleTeamStat',
			verb: 'post'
		}
	});

	// singleTeamStatWithPlayers
	Instat.singleTeamStatWithPlayers = instatTDC.singleTeamStatWithPlayersAPI;
	Instat.remoteMethod('singleTeamStatWithPlayers', {
		accepts: [
			{
				arg: 'instatMatchId',
				type: 'number',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/singleTeamStatWithPlayers',
			verb: 'post'
		}
	});

	// gamePlayerStats
	Instat.gamePlayerStats = instatTDC.gamePlayerStatsAPI;
	Instat.remoteMethod('gamePlayerStats', {
		accepts: [
			{
				arg: 'instatMatchId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'playersInstIds',
				type: 'array',
				http: { source: 'form' }
			},
			{
				arg: 'substitutions',
				type: 'object',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'array',
			root: true
		},
		http: {
			path: '/gamePlayerStats',
			verb: 'post'
		}
	});

	// matchesForSeason
	Instat.matchesForSeason = instatTDC.matchesForSeasonAPI;
	Instat.remoteMethod('matchesForSeason', {
		accepts: [
			{
				arg: 'seasonId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'competitionId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'date',
				type: 'date',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'array',
			root: true
		},
		http: {
			path: '/matchesForSeason',
			verb: 'post'
		}
	});

	// squadSeasonPlayers
	Instat.squadSeasonPlayers = instatTDC.squadSeasonPlayersAPI;
	Instat.remoteMethod('squadSeasonPlayers', {
		accepts: [
			{
				arg: 'squadIds',
				type: 'array',
				http: { source: 'form' }
			},
			{
				arg: 'seasonId',
				type: 'number',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'array',
			root: true
		},
		http: {
			path: '/squadSeasonPlayers',
			verb: 'post'
		}
	});

	// instatCompetitionTeams
	Instat.instatCompetitionTeams = instatTDC.instatCompetitionTeamsAPI;
	Instat.remoteMethod('instatCompetitionTeams', {
		accepts: [
			{
				arg: 'instatCompetitionId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'seasonId',
				type: 'any',
				required: false,
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/instatCompetitionTeams',
			verb: 'post'
		}
	});

	// careerTransfers
	Instat.careerTransfers = instatTDC.careerTransfers;
	Instat.remoteMethod('careerTransfers', {
		accepts: [
			{
				arg: 'instatId',
				type: 'number',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/careerTransfers',
			verb: 'post'
		}
	});

	// teamSearch
	Instat.teamSearch = instatTDC.teamSearchAPI;
	Instat.remoteMethod('teamSearch', {
		accepts: [
			{
				arg: 'query',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'competitionIds',
				type: 'array',
				http: { source: 'form' }
			},
			{
				arg: 'req',
				type: 'object',
				http: {
					source: 'req'
				}
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/teamSearch',
			verb: 'post'
		}
	});

	// getSingleMatch
	Instat.getSingleMatch = instatTDC.getSingleMatch;

	// getTeamData
	Instat.getTeamData = instatTDC.getTeamData;

	// playerSearch
	Instat.searchPlayers = instatTDC.searchPlayersAPI;
	Instat.remoteMethod('searchPlayers', {
		accepts: [
			{
				arg: 'query',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'nationalities',
				type: 'array',
				http: { source: 'form' }
			},
			{
				arg: 'competitionIds',
				type: 'array',
				http: { source: 'form' }
			},
			{
				arg: 'ageMin',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'ageMax',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'positions',
				type: 'array',
				http: { source: 'form' }
			},
			{
				arg: 'gender',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'req',
				type: 'object',
				http: {
					source: 'req'
				}
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/playerSearch',
			verb: 'post'
		}
	});

	// playerImage
	Instat.playerImage = instatTDC.playerImage;
	Instat.remoteMethod('playerImage', {
		accepts: [
			{
				arg: 'playerInstatIds',
				type: 'array',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'array',
			root: true
		},
		http: {
			path: '/playerImage',
			verb: 'post'
		}
	});

	// playerSearchFilters
	Instat.playerSearchFilters = instatTDC.playerSearchFiltersAPI;
	Instat.remoteMethod('playerSearchFilters', {
		accepts: [],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/playerSearchFilters',
			verb: 'post'
		}
	});

	// playerSearchAdditionalInfo
	Instat.playerSearchAdditionalInfo = instatTDC.playerSearchAdditionalInfoAPI;
	Instat.remoteMethod('playerSearchAdditionalInfo', {
		accepts: [
			{
				arg: 'playerInstattIds',
				type: 'array',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/playerSearchAdditionalInfo',
			verb: 'post'
		}
	});

	// seasonsForCompetitions
	Instat.seasonsForCompetitions = instatTDC.seasonsForCompetitions;
	Instat.remoteMethod('seasonsForCompetitions', {
		accepts: [
			{
				arg: 'teamId',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'competitionsIds',
				type: 'array',
				http: { source: 'form' }
			},
			{
				arg: 'date',
				type: 'any',
				required: false,
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/seasonsForCompetitions',
			verb: 'post'
		}
	});

	// getCurrentSeasonMatches
	Instat.getCurrentSeasonMatches = instatTDC.getCurrentSeasonMatchesAPI;
	Instat.remoteMethod('getCurrentSeasonMatches', {
		accepts: [
			{
				arg: 'playerId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'competitionId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'seasonId',
				type: 'number',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'array',
			root: true
		},
		http: {
			path: '/getCurrentSeasonMatches',
			verb: 'post'
		}
	});

	// filterAndMap
	Instat.filterAndMap = wyscout.filterAndMap;

	// searchTeam (needs two more parameters than wyscout's version)
	Instat.searchTeam = instatTDC.searchTeamAPI;
	Instat.remoteMethod('searchTeam', {
		accepts: [
			{
				arg: 'team',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'byId',
				type: 'boolean',
				http: { source: 'form' }
			},
			{
				arg: 'competitionId',
				type: 'number',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'array',
			root: true
		},
		http: {
			path: '/searchTeam',
			verb: 'post'
		}
	});

	Instat.getTeamWithImage = instatTDC.getTeamWithImage;
	Instat.remoteMethod('getTeamWithImage', {
		accepts: [
			{
				arg: 'teamId',
				type: 'string',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'array',
			root: true
		},
		http: {
			path: '/getTeamWithImage',
			verb: 'post'
		}
	});

	Instat.getMatchPlayerStats = instatTDC.getMatchPlayerStats;

	Instat.getTeamStatsForMatch = instatTDC.getTeamStatsForMatch;

	Instat.getSecondaryTeamInfo = instatTDC.getSecondaryTeamInfo;
	Instat.remoteMethod('getSecondaryTeamInfo', {
		accepts: [
			{
				arg: 'teamId',
				type: 'string',
				http: { source: 'form' }
			},
			{
				arg: 'playerIds',
				type: 'array',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'object',
			root: true
		},
		http: {
			path: '/getSecondaryTeamInfo',
			verb: 'post'
		}
	});

	Instat.getMatchesForTeam = instatTDC.matchesForTeamAPI;
	Instat.remoteMethod('getMatchesForTeam', {
		accepts: [
			{
				arg: 'teamId',
				type: 'number',
				http: { source: 'form' }
			},
			{
				arg: 'date',
				type: 'date',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'array',
			root: true
		},
		http: {
			path: '/getMatchesForTeam',
			verb: 'post'
		}
	});
	Instat.getTeamsCompetitions = instatTDC.getTeamsCompetitions;
	Instat.remoteMethod('getTeamsCompetitions', {
		accepts: [
			{
				arg: 'teamId',
				type: 'number',
				http: { source: 'form' }
			}
		],
		returns: {
			arg: 'response',
			type: 'array',
			root: true
		},
		http: {
			path: '/getTeamsCompetitions',
			verb: 'post'
		}
	});
};
