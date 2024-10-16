require('https');
require('qs');

const wyscoutTDC = require('./thirdparty-connectors/wyscout');

module.exports = function (Wyscout) {
	Wyscout.getStandingsLeaderboard = wyscoutTDC.getStandingsLeaderboard;

	Wyscout.getStandingsMatchList = wyscoutTDC.getStandingsMatchList;

	Wyscout.getStandingsMatchStats = wyscoutTDC.getStandingsMatchStats;

	Wyscout.dashboard = wyscoutTDC.dashboard;

	Wyscout.dashboardSingleTeamStat = wyscoutTDC.dashboardSingleTeamStat;

	Wyscout.singleTeamStat = wyscoutTDC.singleTeamStat;

	Wyscout.singleTeamStatWithPlayers = wyscoutTDC.singleTeamStatWithPlayers;

	Wyscout.gamePlayerStats = wyscoutTDC.gamePlayerStats;

	Wyscout.matchesForSeason = wyscoutTDC.matchesForSeason;

	Wyscout.squadSeasonPlayers = wyscoutTDC.squadSeasonPlayers;

	Wyscout.wyscoutCompetitionTeams = wyscoutTDC.wyscoutCompetitionTeams;

	Wyscout.careerTransfers = wyscoutTDC.careerTransfers;

	Wyscout.teamSearch = wyscoutTDC.teamSearch;

	Wyscout.getSingleMatch = wyscoutTDC.getSingleMatch;

	Wyscout.getTeamData = wyscoutTDC.getTeamData;

	Wyscout.searchPlayers = wyscoutTDC.searchPlayers;

	Wyscout.playerImage = wyscoutTDC.playerImage;

	Wyscout.playerSearchFilters = wyscoutTDC.playerSearchFilters;

	Wyscout.playerSearchAdditionalInfo = wyscoutTDC.playerSearchAdditionalInfo;

	Wyscout.seasonsForCompetitions = wyscoutTDC.seasonsForCompetitions;

	Wyscout.getCurrentSeasonMatches = wyscoutTDC.getCurrentSeasonMatches;
	Wyscout.getPlayerNextGames = wyscoutTDC.getPlayerNextGames;

	Wyscout.filterAndMap = wyscoutTDC.filterAndMap;

	Wyscout.searchTeam = wyscoutTDC.searchTeam;

	Wyscout.getTeamWithImage = wyscoutTDC.getTeamWithImage;

	Wyscout.getSecondaryTeamInfo = wyscoutTDC.getSecondaryTeamInfo;
};
