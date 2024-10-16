import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { EventApi } from '@iterpro/shared/data-access/sdk';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { flatten, isEmpty, sortBy, uniq } from 'lodash';
import * as momentLib from 'moment';
import { extendMoment } from 'moment-range';
import { Observable, forkJoin, of } from 'rxjs';
import {
	MatchEvent,
	RawSessionImportData,
	TrainingEvent
} from 'src/app/+state/import-store/interfaces/import-store.interfaces';
import { ImportStore } from 'src/app/+state/import-store/ngrx/import-store.model';

const moment = extendMoment(momentLib);

@Injectable({
	providedIn: 'root'
})
export class ImportGpsService {
	constructor(
		private translate: TranslateService,
		private eventApi: EventApi,
		private currentTeamService: CurrentTeamService
	) {}

	buildSessionForTable(
		sessions: RawSessionImportData[],
		events: TrainingEvent[],
		matches: MatchEvent[]
	): ImportStore[] {
		events = sortBy(events, 'start').reverse();
		matches = sortBy(matches, 'start').reverse();
		const datatableModel: ImportStore[] = sessions.map((session: RawSessionImportData) => {
			const eventsSession: TrainingEvent[] = [
				{
					id: null,
					title: this.translate.instant('import.createNew'),
					description: null,
					start: null,
					lastUpdateDate: null
				},
				...(events || []).filter(({ start }) =>
					moment(start).startOf('day').isSame(moment(session.date).startOf('day'))
				)
			];
			const matchesSession = matches.filter(({ start }) => moment(start).isSame(moment(session.date), 'day'));
			const mainSession = session.sessionPlayerData.find(({ mainSession }) => mainSession);
			const startTime = mainSession?.splitStartTime || session.date;

			const dtSessImport: ImportStore = {
				sessionName:
					session.nameSession ||
					`${moment(startTime, `${getMomentFormatFromStorage()} hh:mm`).format('DD/MM/YYYY HH:mm')} SESSION`,
				sessionObj: session,
				eventId: eventsSession[0].id,
				events: eventsSession.map(event => ({
					...event,
					importLabel: event.start
						? `${event.title} - ${moment(event.start).format(`${getMomentFormatFromStorage()} hh:mm`)}`
						: event.title
				})),
				matches: matchesSession.map((match: MatchEvent) => ({
					...match,
					title: `${match.opponent} ${moment(match.start).format(getMomentFormatFromStorage())}`,
					importLabel: `${match.opponent !== '?' ? match.opponent : 'Match'} - ${moment(match.start).format(
						`${getMomentFormatFromStorage()} hh:mm`
					)}`
				})),
				matchId: !isEmpty(matches) ? matches[0].id : null,
				enabled: true,
				gameImport: false,
				csvFile: session.csvFile,
				sessionPlayers: session.sessionPlayerData.map(sessionData => ({
					id: null,
					enabled: true,
					playerName: sessionData.playerName,
					playerId: sessionData.playerId,
					sessionPlayerObj: { ...sessionData, drillToConvert: true }
				})),
				splits: uniq(session.sessionPlayerData.map(({ splitName }) => splitName)),
				errors: !isEmpty(session.notMappedPlayers || [])
					? `The following players have problems matching with the csv sessions: ${session.notMappedPlayers.join(', ')}`
					: null
			};
			return dtSessImport;
		});
		return datatableModel;
	}

	getObservable(sessions: RawSessionImportData[]): Observable<any> {
		sessions = flatten(sessions);
		const teamSeasonIds = this.currentTeamService.getCurrentTeam().teamSeasons.map(({ id }) => id);
		const dates = sessions.map(({ date }) => moment(date));
		const min = moment.min(dates).subtract(1, 'days').startOf('day').toDate();
		const max = moment.max(dates).add(1, 'days').endOf('day').toDate();
		const sessions$ = of(sessions);
		const events$ = this.eventApi.find({
			where: {
				teamSeasonId: { inq: teamSeasonIds },
				format: 'training',
				start: { gte: min },
				end: { lte: max }
			},
			fields: ['id', 'title', 'description', 'start', 'lastUpdateDate']
		});

		const matches$ = this.eventApi.find({
			where: {
				teamSeasonId: { inq: teamSeasonIds },
				format: 'game',
				start: { gte: min },
				end: { lte: max }
			},
			fields: ['id', 'title', 'description', 'start', 'lastUpdateDate', 'opponent']
		});

		// const season = this.currentTeamService.getCurrentSeason();
		// const players$ = this.teamSeasonApi.getPlayers(season.id, { fields: ['id', 'displayName'] });
		return forkJoin([sessions$, events$, matches$]);
	}
}
