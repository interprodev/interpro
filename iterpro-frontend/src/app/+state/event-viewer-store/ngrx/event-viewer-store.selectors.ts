import { AuthSelectors } from '@iterpro/shared/data-access/auth';
import {
	MedicalFieldType,
	Team,
	TeamSeason,
	ThirdPartyClubGameInterface,
	ThirdPartyClubGameTeam,
	ThirdPartyLinkedPlayer
} from '@iterpro/shared/data-access/sdk';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { EventFormat, State, eventViewerStoreFeatureKey } from './event-viewer-store.state';

const getDate = (state: State): Date => state.date;
const getFormat = (state: State): EventFormat => state.format;
const getMedicalType = (state: State): MedicalFieldType => state.medicalType;
const getError = (state: State): any => state.error;
const getAvailableFormats = (state: State): SelectItem[] => state.availableFormats;
const getCompetitions = (state: State): any[] => state.competitions;
const getMatchWyscoutId = (state: State): number => state.matchWyscoutId;
const getMatchInstatId = (state: State): number => state.matchInstatId;
const getThirdPartyClubGameLinkedPlayerStats = (state: State): ThirdPartyLinkedPlayer[] =>
	state.thirdpartyClubGameLinkedPlayerStats;
const getWyscoutClubGameDetails = (state: State): any => state.thirdpartyClubGameDetails;
const getSeasonId = (state: State): string => state.seasonId;

export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(eventViewerStoreFeatureKey);

export const selectDate: MemoizedSelector<object, Date> = createSelector(selectState, getDate);
export const selectFormat: MemoizedSelector<object, EventFormat> = createSelector(selectState, getFormat);
export const selectMedicalType: MemoizedSelector<object, MedicalFieldType> = createSelector(
	selectState,
	getMedicalType
);
export const selectError: MemoizedSelector<object, any> = createSelector(selectState, getError);
export const selectAvailableFormats: MemoizedSelector<object, SelectItem[]> = createSelector(
	selectState,
	getAvailableFormats
);
export const selectCompetitions: MemoizedSelector<object, any[]> = createSelector(selectState, getCompetitions);
export const selectMatchWyscoutId: MemoizedSelector<object, number> = createSelector(selectState, getMatchWyscoutId);
export const selectMatchInstatId: MemoizedSelector<object, number> = createSelector(selectState, getMatchInstatId);
export const selectThirdpartyClubGameDetails: MemoizedSelector<object, any> = createSelector(
	selectState,
	getWyscoutClubGameDetails
);
export const selectThirdpartyClubGameLinkedPlayerStats: MemoizedSelector<object, ThirdPartyLinkedPlayer[]> =
	createSelector(selectState, getThirdPartyClubGameLinkedPlayerStats);
export const selectSeasonId: MemoizedSelector<object, string> = createSelector(selectState, getSeasonId);

export const selectIsReadOnlyFormat: MemoizedSelector<object, boolean> = createSelector(
	selectFormat,
	format => format === 'medical' || format === 'game' || format === 'clubGame' || format === 'training'
);
export const selectIsMedicalEventFormat: MemoizedSelector<object, boolean> = createSelector(
	selectFormat,
	format => format === 'medical'
);
export const selectIsGameEventFormat: MemoizedSelector<object, boolean> = createSelector(
	selectFormat,
	format => format === 'game'
);
export const selectIsClubGameEventFormat: MemoizedSelector<object, boolean> = createSelector(
	selectFormat,
	format => format === 'clubGame'
);
export const selectIsAnyGameEventFormat: MemoizedSelector<object, boolean> = createSelector(
	selectIsGameEventFormat,
	selectIsClubGameEventFormat,
	(isGame, isClubGame) => isGame || isClubGame
);
export const selectIsTrainingEventFormat: MemoizedSelector<object, boolean> = createSelector(
	selectFormat,
	format => format === 'training'
);
export const selectIsAssessmentEventFormat: MemoizedSelector<object, boolean> = createSelector(
	selectFormat,
	format => format === 'assessment'
);
export const selectIsTravelEventFormat: MemoizedSelector<object, boolean> = createSelector(
	selectFormat,
	format => format === 'travel'
);

export const selectEventSeason: MemoizedSelector<object, TeamSeason> = createSelector(
	AuthSelectors.selectTeam,
	selectDate,
	(team: Team, date: Date) =>
		!team
			? null
			: team.teamSeasons.find(season => moment(date).isBetween(moment(season.offseason), moment(season.inseasonEnd)))
);
export const selectIsSynced: MemoizedSelector<object, boolean> = createSelector(
	selectMatchWyscoutId,
	selectMatchInstatId,
	(wyscoutId, instatId) => !!wyscoutId || !!instatId
);
export const selectThirdpartySyncedPlayerDetails: MemoizedSelector<object, ThirdPartyClubGameInterface> = createSelector(
	selectThirdpartyClubGameDetails,
	selectThirdpartyClubGameLinkedPlayerStats,
	(details: any, allLinkedPlayers: ThirdPartyLinkedPlayer[]) => {
		const gameDetails: ThirdPartyClubGameInterface = { home: null, away: null };
		if (!!details) {
			const teamIds = Object.keys(details.teamsData);

			const labelArray = details.label.split(',');

			const teamNames = labelArray.length > 0 ? labelArray[0].split(' - ').map(teamName => teamName.trim()) : [];
			let team: ThirdPartyClubGameTeam;
			teamIds.forEach(id => {
				const { side, formation, imageDataURL } = details.teamsData[id];
				const lineup = [
					...(formation.lineup || []).map(({ playerId }) => playerId),
					...(formation.substitutions || []).map(({ playerIn }) => playerIn)
				];
				const players = allLinkedPlayers.filter(
					player => lineup.indexOf(player.wyscoutId) > -1 || lineup.indexOf(player.instatId) > -1
				);
				const name = side === 'home' ? teamNames[0] : teamNames[1];
				team = { name, imageDataURL, players };
				gameDetails[side] = team;
			});
		}
		return gameDetails;
	}
);
