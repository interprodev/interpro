import { Component, EventEmitter, Injector, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DeviceMetricDescriptor, Match } from '@iterpro/shared/data-access/sdk';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';
import { uniq } from 'lodash';
import {
	ImportProvider,
	Labelled,
	MatchEvent,
	PlayerStatsDetail,
	SessionPlayerDetail,
	TrainingEvent
} from 'src/app/+state/import-store/interfaces/import-store.interfaces';
import { ImportStore } from 'src/app/+state/import-store/ngrx/import-store.model';

@Component({
	selector: 'iterpro-import-table',
	templateUrl: './import-table.component.html',
	styleUrls: ['./../import.common.css']
})
export class ImportTableComponent extends EtlBaseInjectable implements OnChanges {
	@Input() table: ImportStore[] = null;
	@Input() provider: ImportProvider = 'gps';
	@Input() expandable = true;
	@Output() update: EventEmitter<Array<Partial<ImportStore>>> = new EventEmitter<Array<Partial<ImportStore>>>();

	toUpload: any[] = [];
	selectedMatch: Array<Labelled<MatchEvent>> = [];
	selectedMatchStats: Array<Match> = [];
	selectedEvent: Array<Labelled<TrainingEvent>> = [];
	enabledSplitsPerSession: string[][] = [];

	errors: string;

	private readonly metricDescriptors: DeviceMetricDescriptor[] = this.etlGpsService.getMetricsMapping();

	constructor(injector: Injector) {
		super(injector);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['table'] && this.table?.length) {
			this.enabledSplitsPerSession = this.table.map(({ sessionPlayers }) =>
				uniq((sessionPlayers || []).filter(({ enabled }) => enabled).map(({ sessionPlayerObj }) => sessionPlayerObj?.splitName))
			);
		}
	}

	setEventId({ value }: { value: Labelled<TrainingEvent> }, { id }: ImportStore, index: number) {
		this.selectedEvent[index] = value;
		const sessionToUpdate: Partial<ImportStore> = { id, eventId: value.id };
		this.update.emit([sessionToUpdate]);
	}

	setMatchId({ value }: { value: Labelled<MatchEvent> }, { id }: ImportStore, index: number) {
		this.selectedMatch[index] = value;
		const sessionToUpdate: Partial<ImportStore> = { id, matchId: value.id };
		this.update.emit([sessionToUpdate]);
	}

	setMatchIdTacticalId({ value }: { value: Match }, { id }: ImportStore, index: number) {
		this.selectedMatchStats[index] = value;
		const sessionToUpdate: Partial<ImportStore> = { id, matchId: value.id };
		this.update.emit([sessionToUpdate]);
	}

	changeGameImport(gameImport: boolean, { id }: ImportStore) {
		const sessionToUpdate: Partial<ImportStore> = { id, gameImport };
		this.update.emit([sessionToUpdate]);
	}

	toggleAllEnabled(session: ImportStore) {
		const sessionPlayers: SessionPlayerDetail[] = [];
		for (const playerData of session.sessionPlayers) {
			sessionPlayers.push({ ...playerData, enabled: !playerData.enabled });
		}
		const sessionToUpdate: Partial<ImportStore> = { id: session.id, sessionPlayers };
		this.update.emit([sessionToUpdate]);
	}

	toggleSessionImport(session: ImportStore) {
		const enabled = !session.enabled;
		const sessionToUpdate: Partial<ImportStore> = { id: session.id, enabled };
		this.update.emit([sessionToUpdate]);
	}

	checkEnabledPlayer(event: any, session: ImportStore, sessionPlayerIndex: number) {
		if (!session.sessionPlayers[sessionPlayerIndex].enabled) {
			const sessionPlayers = [...session.sessionPlayers];
			sessionPlayers[sessionPlayerIndex] = { ...sessionPlayers[sessionPlayerIndex], enabled: false };
			const sessionToUpdate: Partial<ImportStore> = { id: session.id, sessionPlayers };
			this.update.emit([sessionToUpdate]);
		}
	}

	toggleAllEnabledTactical(session: ImportStore) {
		const enabled = !session.enabled;
		const playerStats: PlayerStatsDetail[] = [];
		for (const playerData of session.playersStats) {
			playerStats.push({ ...playerData, enabled });
		}
		const sessionToUpdate: Partial<ImportStore> = {
			id: session.id,
			enabled,
			playersStats: playerStats
		};
		this.update.emit([sessionToUpdate]);
	}

	checkEnabledPlayerTactical(event: any, session: ImportStore, statIndex: number) {
		if (!session.playersStats[statIndex].enabled) {
			const playerStats = [...session.playersStats];
			playerStats[statIndex] = { ...playerStats[statIndex], enabled: false };
			const statToUpdate: Partial<ImportStore> = { id: session.id, playersStats: playerStats };
			this.update.emit([statToUpdate]);
		}
	}

	makeMainSession(session: ImportStore, sessionPlayerIndex: number) {
		const sessionPlayers = [...session.sessionPlayers];
		const sessionPlayerObjToUpdate = sessionPlayers[sessionPlayerIndex].sessionPlayerObj;
		const sessionPlayerObj = {
			...sessionPlayerObjToUpdate,
			mainSession: !sessionPlayerObjToUpdate.mainSession
		};
		sessionPlayers[sessionPlayerIndex] = {
			...sessionPlayers[sessionPlayerIndex],
			sessionPlayerObj
		};
		const sessionToUpdate: Partial<ImportStore> = { id: session.id, sessionPlayers };
		this.update.emit([sessionToUpdate]);
	}

	openErrorsDialog({ errors }: ImportStore) {
		this.errors = errors;
	}

	closeErrorsDialog() {
		this.errors = null;
	}

	getHeaderFromName(header: string) {
		const metric: DeviceMetricDescriptor = this.metricDescriptors.find(({ metricName }) => metricName === header);
		return metric?.metricLabel || header;
	}

	isMain(sessionPlayer: any): boolean {
		return !!sessionPlayer.sessionPlayerObj.mainSession;
	}

	onSplitsSelect({ value }, session: ImportStore) {
		const sessionPlayers = [...session.sessionPlayers].map(detail => ({
			...detail,
			enabled: value.includes(detail.sessionPlayerObj.splitName)
		}));
		const sessionToUpdate: Partial<ImportStore> = { id: session.id, sessionPlayers };
		this.update.emit([sessionToUpdate]);
	}
}
