import { GameReportRow } from '@iterpro/shared/data-access/sdk';

const filter = (itemValue: any, validValues: any[] = []) =>
	validValues.filter(Boolean).length === 0 || validValues.includes(itemValue);

export const filterScout = ({ scoutId }: GameReportRow, validValues: string[]) => filter(scoutId, validValues);
export const filterTeam = ({ homeTeam, awayTeam }: GameReportRow, validValues: string[]) =>
	validValues.filter(Boolean).length === 0 || validValues.includes(homeTeam) || validValues.includes(awayTeam);
export const filterPlayer = (
	{ displayName, playerScoutingId }: GameReportRow,
	validValues: { displayName: string; playerScoutingId: string }[]
) =>
	validValues.filter(Boolean).length === 0 ||
	validValues.some(
		({ displayName: validDisplayName, playerScoutingId: validPlayerScoutingId }) =>
			playerScoutingId === validPlayerScoutingId || displayName === validDisplayName
	);

export const filterLevel = ({ level }: GameReportRow, validValues: string[]) => filter(level, validValues);
export const filterNationality = ({ nationality }: GameReportRow, validValues: string[]) =>
	filter(nationality, validValues);
export const filterPosition = ({ position }: GameReportRow, validValues: string[]) => filter(position, validValues);
export const filterBirthYear = ({ birthYear }: GameReportRow, validValues: number[]) => filter(birthYear, validValues);
export const filterCompetition = ({ competition }: GameReportRow, validValues: string[]) =>
	filter(competition, validValues);
export const filterLastUpdate = ({ lastUpdate }: GameReportRow, validValues: number[]) =>
	filter(lastUpdate, validValues);
export const filterLastAuthor = ({ lastUpdateAuthor }: GameReportRow, validValues: number[]) =>
	filter(lastUpdateAuthor, validValues);
