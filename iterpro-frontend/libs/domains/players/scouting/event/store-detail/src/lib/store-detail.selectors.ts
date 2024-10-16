import {
	Attachment,
	CompetitionGame,
	Goal,
	InstatTeamJson,
	ProviderType,
	ScoutingGame,
	ScoutingGameEssentialCustomer, TeamGender
} from '@iterpro/shared/data-access/sdk';
import { getGameDurationString, isValidDate } from '@iterpro/shared/utils/common-utils';
import { MemoizedSelector, createFeatureSelector, createSelector } from '@ngrx/store';
import { last, sortBy } from 'lodash';
import * as moment from 'moment';
import * as fromStoreDetail from './store-detail.reducer';

export const selectStoreDetailState = createFeatureSelector<fromStoreDetail.State>(
	fromStoreDetail.storeDetailFeatureKey
);
const getError = (state: fromStoreDetail.State): any => state.error;
const getSuccess = (state: fromStoreDetail.State): string | undefined => state.success;
const getGame = (state: fromStoreDetail.State): ScoutingGame => state.game;
const getGameBackup = (state: fromStoreDetail.State): ScoutingGame => state.gameBackup;
const getGameStartDate = (state: fromStoreDetail.State): Date => state.game?.start;
const getCustomers = (state: fromStoreDetail.State): ScoutingGameEssentialCustomer[] => state.customers;
const getCurrentScout = (state: fromStoreDetail.State): ScoutingGameEssentialCustomer => state.customer;
const getCanUserEditDetailPanel = (state: fromStoreDetail.State): boolean => state.isAdminOrUniqueScout;
const getIsLeftPanelMaximized = (state: fromStoreDetail.State): boolean => state.isLeftPanelMaximized;
const getIsOnEdit = (state: fromStoreDetail.State): boolean => state.isOnEdit;
const getHasScoutingGamePermission = (state: fromStoreDetail.State): boolean => state.hasScoutingGamePermission;
const getIsLoading = (state: fromStoreDetail.State): boolean => state.isLoading;
const getIsScoutingAdmin = (state: fromStoreDetail.State): boolean => state.isScoutingAdmin;
const getCurrentTeamGender = (state: fromStoreDetail.State): TeamGender => state.teamGender;
const getHomeTeamCrest = (state: fromStoreDetail.State): string | undefined => state.homeTeamCrest;
const getAwayTeamCrest = (state: fromStoreDetail.State): string | undefined => state.awayTeamCrest;
const getCompetitionGames = (state: fromStoreDetail.State): CompetitionGame[] => state.thirdPartyCompetitionGames;
const getTeamsWithoutCompetitions = (state: fromStoreDetail.State): InstatTeamJson[] => state.teamsWithoutCompetitions;

const getThirdPartyProviderMatchId = (state: fromStoreDetail.State): number => state.game?.thirdPartyProviderMatchId;
const getThirdPartyProviderHomeTeamId = (state: fromStoreDetail.State): number =>
	state.game?.thirdPartyProviderHomeTeamId;
const getThirdPartyProviderAwayTeamId = (state: fromStoreDetail.State): number =>
	state.game?.thirdPartyProviderAwayTeamId;
const getAttachmentDialogVisibility = (state: fromStoreDetail.State): boolean => state.attachmentDialogVisibility;

export const selectError = createSelector(selectStoreDetailState, getError);
export const selectSuccess = createSelector(selectStoreDetailState, getSuccess);
export const selectGame = createSelector(selectStoreDetailState, getGame);
export const selectGameBackup = createSelector(selectStoreDetailState, getGameBackup);
export const selectGameStartDate = createSelector(selectStoreDetailState, getGameStartDate);
export const selectIsLeftPanelMaximized = createSelector(selectStoreDetailState, getIsLeftPanelMaximized);
export const selectHomeTeamCrest = createSelector(selectStoreDetailState, getHomeTeamCrest);
export const selectAwayTeamCrest = createSelector(selectStoreDetailState, getAwayTeamCrest);

export const selectCustomers: MemoizedSelector<object, ScoutingGameEssentialCustomer[]> = createSelector(
	selectStoreDetailState,
	getCustomers
);

export const selectCurrentTeamGender = createSelector(selectStoreDetailState, getCurrentTeamGender);
export const selectCurrentScout: MemoizedSelector<object, ScoutingGameEssentialCustomer> = createSelector(
	selectStoreDetailState,
	getCurrentScout
);

export const selectAssignedToReports: MemoizedSelector<object, ScoutingGameEssentialCustomer[]> = createSelector(
	selectGame,
	game => (game ? game.assignedTo : null)
);
export const selectIsOnEdit: MemoizedSelector<object, boolean> = createSelector(selectStoreDetailState, getIsOnEdit);
export const selectHasScoutingGamePermission: MemoizedSelector<object, boolean> = createSelector(
	selectStoreDetailState,
	getHasScoutingGamePermission
);

export const selectCanUserEditDetailPanel = createSelector(selectStoreDetailState, getCanUserEditDetailPanel);
export const selectIsLoading: MemoizedSelector<object, boolean> = createSelector(selectStoreDetailState, getIsLoading);
export const selectIsScoutingAdmin: MemoizedSelector<object, boolean> = createSelector(
	selectStoreDetailState,
	getIsScoutingAdmin
);
export const selectStartDate: MemoizedSelector<object, { startDate: Date }> = createSelector(
	selectGameStartDate,
	startDate => ({
		startDate
	})
);

const selectThirdPartyProviderMatchId: MemoizedSelector<object, number> = createSelector(
	selectStoreDetailState,
	getThirdPartyProviderMatchId
);
const selectThirdPartyProviderHomeTeamId = createSelector(selectStoreDetailState, getThirdPartyProviderHomeTeamId);
const selectThirdPartyProviderAwayTeamId = createSelector(selectStoreDetailState, getThirdPartyProviderAwayTeamId);

export const selectHomeTeamName = createSelector(selectGame, game => (game ? game.homeTeam : null));

export const selectAwayTeamName = createSelector(selectGame, game => (game ? game.awayTeam : null));

export const selectProvider = createSelector(selectGame, game =>
	game ? (game.thirdPartyProvider as ProviderType) : 'Dynamic'
);

export const selectMatchAndHomeAndAwayId = createSelector(
	selectThirdPartyProviderMatchId,
	selectThirdPartyProviderHomeTeamId,
	selectThirdPartyProviderAwayTeamId,
	selectHomeTeamName,
	selectAwayTeamName,
	selectProvider,
	(
		thirdPartyProviderMatchId,
		thirdPartyProviderHomeTeamId,
		thirdPartyProviderAwayTeamId,
		homeTeamName,
		awayTeamName,
		thirdPartyProvider
	) => ({
		thirdPartyProviderMatchId,
		thirdPartyProviderHomeTeamId,
		thirdPartyProviderAwayTeamId,
		homeTeamName,
		awayTeamName,
		thirdPartyProvider
	})
);

export const selectThirdPartyMatchId: MemoizedSelector<object, number> = createSelector(selectGame, game =>
	!!game && game.thirdPartyProviderMatchId ? game.thirdPartyProviderMatchId : -1
);

export const selectCompetitionId: MemoizedSelector<object, any[]> = createSelector(selectGame, game =>
	!!game && game.thirdPartyProviderCompetitionId ? [game.thirdPartyProviderCompetitionId] : []
);

export const selectProviderInfo: MemoizedSelector<object, { provider: ProviderType; thirdPartyId: number }> =
	createSelector(selectProvider, selectThirdPartyMatchId, (provider, thirdPartyId) => ({ provider, thirdPartyId }));

export const selectStartDateAndThirdPartyProviderCompetitionId: MemoizedSelector<
	object,
	{ start: Date; thirdPartyProviderCompetitionId: number }
> = createSelector(selectGame, game => ({
	start: game.start,
	thirdPartyProviderCompetitionId: game.thirdPartyProviderCompetitionId
}));

export const selectCompetitionGames: MemoizedSelector<object, CompetitionGame[]> = createSelector(
	selectStoreDetailState,
	getCompetitionGames
);

export const selectTeamsWithoutCompetitions: MemoizedSelector<object, InstatTeamJson[]> = createSelector(
	selectStoreDetailState,
	getTeamsWithoutCompetitions
);

export const selectGoals: MemoizedSelector<object, Goal[]> = createSelector(
	selectCompetitionGames,
	selectGame,
	(games, game) => {
		const found = games.find(({ matchId }) => matchId === game.thirdPartyProviderMatchId);
		return found ? found.goals : [];
	}
);

export const selectGameDuration = createSelector(selectGame, game => {
	return getGameDurationString(game.startTime, game.endTime);
});

export const selectGameName: MemoizedSelector<object, string> = createSelector(selectGame, game =>
	!game || !game.homeTeam || !game.awayTeam ? '' : game.homeTeam + ' - ' + game.awayTeam
);

export const selectIsNewGame: MemoizedSelector<object, boolean> = createSelector(selectGame, game => !game || !game.id);

export const selectIsDeletableByAdmin: MemoizedSelector<object, boolean> = createSelector(
	selectIsScoutingAdmin,
	selectIsNewGame,
	(isAdmin, isNewGame) => isAdmin && !isNewGame
);

export const selectLastAuthor = createSelector(selectCustomers, selectGame, (customers, game) => {
	const authorId = game && game.history.length > 0 ? last(sortBy(game.history, 'updatedAt')).author : -1;
	const found = customers.find(({ id }) => id === authorId);
	return found ? `${found.firstName} ${found.lastName}` : '';
});

export const selectHasMissingFields = createSelector(
	selectGame,
	selectIsOnEdit,
	(game, edit) => edit && (!isValidDate(game?.start) || !game.homeTeam || !game.awayTeam)
);

export const selectIsCustomTeamEditable = createSelector(
	selectIsOnEdit,
	selectGame,
	(edit, game) => edit && (game.thirdPartyProviderMatchId === -1 || game.thirdPartyProviderCompetitionId === -1)
);

export const selectGamesInCompetition = createSelector(selectCompetitionGames, games => [
	{
		label: 'Custom Game',
		value: -1
	},
	...games.map(game => ({ label: game.match.label.split(',')[0].trim(), value: game.matchId }))
]);

export const selectTeamsWithoutCompetitionSelectItems = createSelector(selectTeamsWithoutCompetitions, teams =>
	teams ? teams.map(team => ({ value: team, label: team.name })) : []
);

export const selectCustomersOptions = createSelector(selectCustomers, customers =>
	customers.map(customer => ({ value: customer.id, label: `${customer.firstName} ${customer.lastName}` }))
);

export const selectAttachmentDialogVisibility: MemoizedSelector<object, boolean> = createSelector(
	selectStoreDetailState,
	getAttachmentDialogVisibility
);

export const selectRemovedAttachmentURLs: MemoizedSelector<object, string[]> = createSelector(
	selectGame,
	selectGameBackup,
	(game, gameBackup) => (gameBackup ? getRemovedURLs(game, gameBackup) : [])
);

export const selectIsFutureEvent: MemoizedSelector<object, boolean> = createSelector(selectGame, game =>
	moment(game.start).isAfter(moment())
);

function getRemovedURLs(game: ScoutingGame, gameBackUp: ScoutingGame): string[] {
	const gameBackUpURL = (gameBackUp._attachments || ([] as Attachment[])).map(({ url }) => url).filter(Boolean);
	const gameURL = (game._attachments || ([] as Attachment[])).map(({ url }) => url).filter(Boolean);
	return gameBackUpURL.filter(url => !gameURL.includes(url));
}
