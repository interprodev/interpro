import { TeamSeason } from '@iterpro/shared/data-access/sdk';

export const getCompetitionId = (
	competitionIdentifier: string,
	standardCompetitions: string[],
	seasons: TeamSeason[]
): string => {
	return standardCompetitions.includes(competitionIdentifier)
		? competitionIdentifier
		: findCompetitionInSeasons(competitionIdentifier, seasons);
};

function findCompetitionInSeasons(competitionIdentifier: string, seasons: TeamSeason[]) {
	let competition: string;
	seasons.some(season => {
		competition = findCompetitionInfoId(competitionIdentifier, season);
		return !!competition;
	});
	return competition ? competition : competitionIdentifier;
}

// TODO: when adding new provider, add competition ids to indexOf array
function findCompetitionInfoId(competitionIdentifier: string, season: TeamSeason) {
	const foundedCompetition = season.competitionInfo.find(
		({ competition }) => competition.toString() === competitionIdentifier
	);
	if (foundedCompetition) {
		return foundedCompetition.manual ? foundedCompetition.name : foundedCompetition.competition.toString();
	}
	const wyscoutIndex = [
		season.wyscoutNationalLeague,
		season.wyscoutNationalCup,
		season.wyscoutTournamentQualifiers,
		season.wyscoutTournamentFinalStages
	].indexOf(competitionIdentifier);
	const inStatIndex = [
		season.instatNationalLeague,
		season.instatNationalCup,
		season.instatTournamentQualifiers,
		season.instatTournamentFinalStages
	].indexOf(competitionIdentifier);
	const index = inStatIndex > -1 ? inStatIndex : wyscoutIndex;
	return index > -1 ? ['nationalLeague', 'nationalCup', 'tournamentQualifiers', 'tournamentFinalStages'][index] : null;
}
