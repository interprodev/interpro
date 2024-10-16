import { Drill, SessionPlayerData } from '@iterpro/shared/data-access/sdk';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import {
	ConfigurationProblem,
	ImportProvider,
	Labelled,
	SessionMessage,
	SessionPlayerDetail,
	SplitAssociation
} from '../interfaces/import-store.interfaces';
import { ImportStore } from './import-store.model';
import { ImportState, adapter, importStoresFeatureKey } from './import-store.state';

export const { selectIds, selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const selectState: MemoizedSelector<object, ImportState> =
	createFeatureSelector<ImportState>(importStoresFeatureKey);

export const selectAllImportedSessionSets: MemoizedSelector<object, ImportStore[]> = createSelector(
	selectState,
	selectAll
);
const getConfigurationProblem = (state: ImportState): ConfigurationProblem => state.configurationProblem;

const getPhase = (state: ImportState): number => state.phase;

const getMaxNavigablePhase = (state: ImportState): number => state.maxNavigablePhase;

const getNextEnabled = (state: ImportState): boolean => state.nextEnabled;

const getAvailableDrills = (state: ImportState): Drill[] => state.availableDrills;

const getSplitAssociations = (state: ImportState): SplitAssociation[] => state.splitAssociations;

const getProvider = (state: ImportState): ImportProvider => state.provider;

const getCurrentTeamSplitSession = (state: ImportState): string => state.currentTeamSplitSession;

const getCurrentTeamGameSplitSession = (state: ImportState): string => state.currentTeamGameSplitSession;

const getMessages = (state: ImportState): SessionMessage[] => state.messages;

export const selectConfigurationProblem: MemoizedSelector<object, ConfigurationProblem> = createSelector(
	selectState,
	getConfigurationProblem
);

export const selectPhase: MemoizedSelector<object, number> = createSelector(selectState, getPhase);

export const selectMaxNavigablePhase: MemoizedSelector<object, number> = createSelector(
	selectState,
	getMaxNavigablePhase
);

export const selectNextEnabled: MemoizedSelector<object, boolean> = createSelector(selectState, getNextEnabled);

export const selectAvailableDrills: MemoizedSelector<object, Drill[]> = createSelector(selectState, getAvailableDrills);
export const selectSplitAssociations: MemoizedSelector<object, SplitAssociation[]> = createSelector(
	selectState,
	getSplitAssociations
);

export const selectProvider: MemoizedSelector<object, ImportProvider> = createSelector(selectState, getProvider);

export const selectCurrentTeamSplitSession: MemoizedSelector<object, string> = createSelector(
	selectState,
	getCurrentTeamSplitSession
);

export const selectCurrentTeamGameSplitSession: MemoizedSelector<object, string> = createSelector(
	selectState,
	getCurrentTeamGameSplitSession
);

export const selectMessages: MemoizedSelector<object, SessionMessage[]> = createSelector(selectState, getMessages);

export const selectLabelledDrills: MemoizedSelector<object, Array<Labelled<Drill>>> = createSelector(
	selectAvailableDrills,
	(drills: Drill[]) =>
		drills.map(drill => ({
			...drill,
			importLabel: !!drill.theme && drill.theme.length > 0 ? drill.name + ' - ' + drill.theme : drill.name
		}))
);

export const selectAllSessionPlayerDetails: MemoizedSelector<object, SessionPlayerDetail[]> = createSelector(
	selectAllImportedSessionSets,
	importedSessions =>
		importedSessions
			.filter(session => session.enabled)
			.reduce((accumulator: SessionPlayerDetail[], { sessionPlayers }) => accumulator.concat(sessionPlayers), [])
			.filter((playerDetail: SessionPlayerDetail) => playerDetail.enabled)
);

const selectSplits: MemoizedSelector<object, SplitAssociation[]> = createSelector(
	selectAllSessionPlayerDetails,
	selectLabelledDrills,
	(playerSessions, drills) => {
		const splitNames = playerSessions.map(playerSession => playerSession.sessionPlayerObj.splitName);
		let index = 0;
		return playerSessions
			.map(playerSession => playerSession.sessionPlayerObj)
			.filter(duplicates(splitNames))
			.sort(bySessionAndSplitName())
			.map(({ mainSession, splitName }) => ({
				index: index++,
				mainSession: !!mainSession, // sometimes is undefined, so I cast it
				splitName,
				newDrill: false,
				toConvert: true,
				...possibleDrill(mainSession, splitName, drills)
			}));
	}
);

export const selectAvailableSplitAssociations: MemoizedSelector<object, SplitAssociation[]> = createSelector(
	selectSplitAssociations,
	selectSplits,
	(storedSplits, projectedSplits) => (storedSplits.length > 0 ? storedSplits : projectedSplits)
);

export const selectHasConfigurationProblem: MemoizedSelector<object, boolean> = createSelector(
	selectConfigurationProblem,
	problem => problem !== ConfigurationProblem.NO
);
export const selectHasGpsConfigurationProblem: MemoizedSelector<object, boolean> = createSelector(
	selectConfigurationProblem,
	problem => [ConfigurationProblem.GPS, ConfigurationProblem.GPS_SEASON].indexOf(problem) > -1
);
export const selectHasSeasonConfigurationProblem: MemoizedSelector<object, boolean> = createSelector(
	selectConfigurationProblem,
	problem => [ConfigurationProblem.SEASON, ConfigurationProblem.GPS_SEASON].indexOf(problem) > -1
);

function possibleDrill(mainSession: boolean, splitName: string, drills: Array<Labelled<Drill>>) {
	let foundDrill: Labelled<Drill>;
	if (!mainSession) {
		foundDrill = drills.find(drill => drill.name === splitName);
		if (!foundDrill && drills.length > 0) {
			foundDrill = drills[0];
		}
	}
	return foundDrill
		? {
				drillName: foundDrill.importLabel,
				drillId: foundDrill.id
		  }
		: { drillName: undefined, drillId: undefined };
}

function duplicates(
	splitNames: string[]
): (value: SessionPlayerData, index: number, array: SessionPlayerData[]) => unknown {
	return (sessionPlayerObj, i) => splitNames.indexOf(sessionPlayerObj.splitName) === i;
}

function bySessionAndSplitName(): (a: SessionPlayerData, b: SessionPlayerData) => number {
	return (session1, session2) => orderBySession(session1, session2) || orderBySplitName(session1, session2);
}

function orderBySession(session1: SessionPlayerData, session2: SessionPlayerData) {
	return session1.mainSession ? -1 : session2.mainSession ? 1 : 0;
}

function orderBySplitName(session1: SessionPlayerData, session2: SessionPlayerData) {
	const splitName1 = session1.splitName;
	const splitName2 = session2.splitName;

	return splitName1 < splitName2 ? -1 : splitName1 > splitName2 ? 1 : 0;
}
