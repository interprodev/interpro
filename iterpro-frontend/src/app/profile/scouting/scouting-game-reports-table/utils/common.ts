import { Customer, DenormalizedScoutingGameFields, GameReportRow, ScoutingGame } from '@iterpro/shared/data-access/sdk';
import { getId } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { CompletionStatus, GameReportWithAdditionalData } from '../interfaces/table.interfaces';

export const PAGINATION_SIZE = 50;

export function getCompletionStatus(completed: boolean, startDate: Date): CompletionStatus {
	if (completed) return CompletionStatus.Completed;
	if (moment(new Date()).isBefore(moment(startDate), 'second')) return CompletionStatus.Pending;
	return CompletionStatus.NotCompleted;
}

export function getDefaultLazyLoadOptions(): LazyLoadEvent {
	return {
		first: 0,
		rows: PAGINATION_SIZE,
		sortOrder: 1,
		sortField: 'start',
		filters: {}
	};
}

export function getGameTitleLabel(game: DenormalizedScoutingGameFields): string {
	return game.title
		? game.title
		: `${game.homeTeam || ''}${!!game.homeTeam && !!game.awayTeam ? ' - ' : ''}${game.awayTeam || ''}`;
}

export function getTableRow(
	gameReport: GameReportWithAdditionalData,
	customerPipe,
	customers: Customer[],
	competitions: SelectItem[] = []
): GameReportRow {
	const {
		completed,
		denormalizedScoutingGameFields,
		displayName,
		playerScoutingId,
		level,
		report,
		_documents,
		_videos,
		scoutId,
		reportData,
		scoutingGameId: gameId,
		nationality,
		birthYear,
		position,
		lastUpdate,
		lastUpdateAuthor,
		thirdPartyProviderId,
		thirdPartyProviderTeamId
	} = gameReport;
	const title = getGameTitleLabel(gameReport.denormalizedScoutingGameFields);
	const teams: [string, string] = [denormalizedScoutingGameFields.homeTeam, denormalizedScoutingGameFields.awayTeam];
	const result = {
		id: getId(gameReport),
		start: denormalizedScoutingGameFields.start,
		title,
		homeTeam: denormalizedScoutingGameFields.homeTeam,
		awayTeam: denormalizedScoutingGameFields.awayTeam,
		scoutId,
		scout: customerPipe.transform(scoutId, customers),
		displayName,
		playerScoutingId,
		level,
		report,
		_documents,
		_videos,
		teams,
		gameId,
		nationality,
		lastUpdate: lastUpdate,
		lastUpdateAuthor: customerPipe.transform(lastUpdateAuthor, customers),
		birthYear: birthYear,
		position,
		competition: getCompetitionName(
			denormalizedScoutingGameFields.thirdPartyProviderCompetitionId
				? denormalizedScoutingGameFields.thirdPartyProviderCompetitionId
				: -1,
			competitions
		),
		thirdPartyProviderId,
		thirdPartyProviderTeamId,
		thirdPartyProviderCompetitionId: denormalizedScoutingGameFields?.thirdPartyProviderCompetitionId,
		completion: getCompletionStatus(completed, denormalizedScoutingGameFields.start)
	};
	if (reportData) {
		Object.keys(reportData).forEach(key => {
			if (reportData[key]) {
				for (const property of reportData[key]) {
					result[key + property.key] = {
						value: property.value,
						color: property?.color,
						comment: property?.comment
					};
				}
			}
		});
	}
	return result;
}

function getCompetitionName(id: number, competitions: SelectItem[]): string {
	return competitions && competitions.find(({ value }) => value === id)?.label;
}
