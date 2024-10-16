import { Component, EventEmitter, Injector, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';

import { LoopBackAuth, Team, TeamApi, ThirdpartyApi } from '@iterpro/shared/data-access/sdk';
import { CalendarService, ErrorService, ToServerEquivalentService } from '@iterpro/shared/utils/common-utils';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { first, map, switchMap } from 'rxjs/operators';
import { ImportStoreActions } from 'src/app/+state/import-store';
import {
	ImportedSessionSetInfo,
	MatchEvent,
	RawSessionImportData,
	SessionEvent,
	SessionMessage,
	TrainingEvent
} from 'src/app/+state/import-store/interfaces/import-store.interfaces';
import { ImportStore } from 'src/app/+state/import-store/ngrx/import-store.model';
import { RootStoreState } from 'src/app/+state/root-store.state';
import { ImportGpsService } from '../../services/import-gps.service';

@UntilDestroy()
@Component({
	selector: 'iterpro-gps-api-importer',
	templateUrl: './gps-api-importer.component.html',
	styleUrls: ['./../../import.common.css']
})
export class GpsAPIImporterComponent extends EtlBaseInjectable implements OnInit, OnDestroy {
	@Input() team: Team;
	@Input() provider: string;
	@Output() sessions: EventEmitter<ImportedSessionSetInfo> = new EventEmitter<ImportedSessionSetInfo>();
	@Output() cancelImport: EventEmitter<void> = new EventEmitter<void>();
	@Output() messages: EventEmitter<SessionMessage[]> = new EventEmitter<SessionMessage[]>();

	date: Date = new Date();
	today: Date = new Date();
	sessionsForTable: ImportStore[] = null;
	sessionMessages: SessionMessage[] = [];
	importedSessionEvents: SessionEvent[] = [];

	private currentTeamId: string;
	private currentTeamSplitSession: string;
	private currentTeamGameSplitSession: string;

	constructor(
		private error: ErrorService,
		private thirdPartyApi: ThirdpartyApi,
		private auth: LoopBackAuth,
		private calendarService: CalendarService,
		private teamApi: TeamApi,
		private currentTeamService: CurrentTeamService,
		private toServer: ToServerEquivalentService,
		private store$: Store<RootStoreState>,
		private importGpsService: ImportGpsService,
		injector: Injector
	) {
		super(injector);
	}

	ngOnDestroy() {}

	ngOnInit() {
		this.currentTeamId = this.auth.getCurrentUserData().currentTeamId;
		this.teamApi
			.findById(this.currentTeamId, { fields: ['mainSplitName', 'mainGameName'] })
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: ({ mainSplitName, mainGameName }: Partial<Team>) => {
					this.currentTeamSplitSession = mainSplitName;
					this.currentTeamGameSplitSession = mainGameName;
				},
				error: (error: Error) => {
					this.error.handleError(error);
				}
			});
	}

	clear() {
		this.sessionsForTable = null;
		this.cancelImport.emit();
	}

	onSelect() {
		this.sessionMessages = [];

		const gdType = this.calendarService.getGD(this.date);
		const seasonId = this.currentTeamService.getCurrentSeason().id;
		const dateServer = this.toServer.convert(this.date);

		this.thirdPartyApi
			.getThirdpartyGPSSessions(this.team.id, seasonId, moment(dateServer).format(), gdType)
			.pipe(
				switchMap((sessionsToImport: RawSessionImportData[]) => this.importGpsService.getObservable(sessionsToImport)),
				map(([sessionsToImport, events, matches]: [RawSessionImportData[], TrainingEvent[], MatchEvent[]]) =>
					this.convertIntoTableData(sessionsToImport, events, matches)
				),
				untilDestroyed(this)
			)
			.subscribe({
				next: (converted: ImportStore[]) => {
					const info: ImportedSessionSetInfo = {
						importStores: converted,
						currentTeamSplitSession: this.currentTeamSplitSession,
						currentTeamGameSplitSession: this.currentTeamGameSplitSession
					};
					this.sessions.emit(info);
					this.store$.dispatch(ImportStoreActions.nextPhase());
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	private convertIntoTableData(
		rawSessions: RawSessionImportData[],
		events: TrainingEvent[],
		matches: MatchEvent[]
	): ImportStore[] {
		const converted = this.importGpsService.buildSessionForTable(rawSessions, events, matches);
		const fields = this.etlGpsService
			.getMetricsMapping()
			.filter(({ algo }) => !algo)
			.map(({ metricName }) => metricName);
		converted.forEach(x => (x.sessionObj.headers = fields));
		return converted;
	}
}
