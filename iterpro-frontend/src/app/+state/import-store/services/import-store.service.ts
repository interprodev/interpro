import { Injectable } from '@angular/core';
import { SessionPlayerData } from '@iterpro/shared/data-access/sdk';
import { RawSessionImportData, UploadableSession } from '../interfaces/import-store.interfaces';
import { ImportStore } from '../ngrx/import-store.model';

@Injectable({
	providedIn: 'root'
})
export class ImportStoreService {
	constructor() {}

	buildSessionImportFromCsv(importStores: ImportStore[]): UploadableSession[] {
		return importStores
			.filter(dtRow => this.hasSessionPlayersEnabled(dtRow))
			.map(dtRow => this.importStore2UploadableSession(dtRow));
	}

	buildSessionImportFromProvider(
		importStores: ImportStore[],
		mainSplit: string,
		mainSplitGame: string
	): UploadableSession[] {
		let importableSession: UploadableSession;
		const sessionImportsToReturn: UploadableSession[] = [];
		importStores
			.filter(dtRow => this.hasSessionPlayersEnabled(dtRow))
			.forEach(dtRow => {
				importableSession = this.importStore2UploadableSession(dtRow, ['all']);
				if (this.hasValidSessionPlayerData(importableSession)) {
					sessionImportsToReturn.push(this.fixSplitName(importableSession, mainSplit, mainSplitGame));
				}
			});
		return sessionImportsToReturn;
	}

	private hasValidSessionPlayerData({ sessionPlayerData }: UploadableSession) {
		return !!sessionPlayerData && sessionPlayerData.length > 0;
	}

	private hasSessionPlayersEnabled(dtRow: ImportStore): boolean {
		return dtRow.enabled && dtRow.sessionPlayers.some(dts => dts.enabled);
	}

	private importStore2UploadableSession(dtRow: ImportStore, sessionsToFilter: string[] = []): UploadableSession {
		let sessionPlayerData: SessionPlayerData[];
		let sessionImport: Omit<RawSessionImportData, 'sessionPlayerData'>;
		let updatedData: SessionPlayerData[] = dtRow.sessionPlayers
			.filter(({ enabled }) => enabled)
			.map(session => session.sessionPlayerObj);
		({ sessionPlayerData, ...sessionImport } = <RawSessionImportData>dtRow.sessionObj);
		const enabledPlayers = dtRow.enabled
			? dtRow.sessionPlayers.filter(dts => dts.enabled).map(dts => dts.playerName.toLowerCase())
			: [];

		updatedData = this.filterSessionPlayerData(updatedData, enabledPlayers, sessionsToFilter);
		return {
			sessionImport,
			sessionPlayerData: updatedData,
			...this.getSessionEventId(dtRow)
		};
	}

	private getSessionEventId(dtRow: ImportStore) {
		return dtRow.gameImport ? { eventId: null, matchId: dtRow.matchId } : { eventId: dtRow.eventId, matchId: null };
	}

	private filterSessionPlayerData(
		updatedData: SessionPlayerData[],
		enabledPlayers: string[],
		sessionsToFilter: string[]
	) {
		return updatedData.filter(sp => {
			const lowerCaseName = sp.playerName.toLowerCase();
			return !sessionsToFilter.includes(lowerCaseName) && enabledPlayers.includes(lowerCaseName);
		});
	}
	private fixSplitName(
		importableSession: UploadableSession,
		mainSplit: string,
		mainSplitGame: string
	): UploadableSession {
		importableSession.sessionPlayerData.forEach(playerSession => {
			if (playerSession.mainSession) {
				playerSession = { ...playerSession, splitName: !importableSession.matchId ? mainSplit : mainSplitGame };
			}
		});
		return importableSession;
	}
}
