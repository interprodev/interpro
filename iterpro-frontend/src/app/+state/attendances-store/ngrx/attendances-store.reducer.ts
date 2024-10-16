import { Action, createReducer, on } from '@ngrx/store';
import * as moment from 'moment';
import { TeamType } from '../interfaces/attendances-store.interfaces';
import fields from '../utils/items';
import * as AttendancesStoreActions from './attendances-store.actions';
import { State, adapter, initialState } from './attendances-store.state';
const attendancesStoreReducer = createReducer(
	initialState,
	on(AttendancesStoreActions.componentInitialized, (): State => ({ ...initialState, today: new Date() })),
	on(AttendancesStoreActions.componentDestroyed, (state): State => ({ ...adapter.removeAll(state), ...initialState })),
	on(
		AttendancesStoreActions.timeRangeDefined,
		(state, { year, month }): State => ({
			...state,
			loading: true,
			year,
			month
		})
	),
	on(
		AttendancesStoreActions.groupStatsInitializedSuccess,
		(state, { selectablePlayerRoles, selectedPlayerRoles }): State => ({
			...state,
			selectablePlayerRoles,
			selectedPlayerRoles
		})
	),
	on(
		AttendancesStoreActions.groupStatsInitializedFailed,
		AttendancesStoreActions.eventsAndInjuriesLoadedFailed,
		AttendancesStoreActions.primaryTeamStatsLoadedFailed,
		(state, { error }): State => ({
			...state,
			loading: false,
			error
		})
	),
	on(
		AttendancesStoreActions.eventsAndInjuriesLoadedSuccess,
		(state, { events, injuries }): State => ({
			...state,
			events,
			injuries
		})
	),
	on(
		AttendancesStoreActions.loadAttendancesStores,
		(state, { attendancesStores }): State => adapter.setAll(attendancesStores, state)
	),
	on(AttendancesStoreActions.tooltipRendered, (state, { tooltip }): State => ({ ...state, tooltip })),
	on(
		AttendancesStoreActions.viewChanged,
		(state, { view }): State => ({
			...state,
			view,
			ordered: false,
			labelled: false,
			datePeriod: null
		})
	),
	on(
		AttendancesStoreActions.monthChanged,
		(state, { month }): State => ({ ...state, loading: true, datePeriod: null, month })
	),
	on(AttendancesStoreActions.yearChanged, (state, { year }): State => ({ ...state, datePeriod: null, year })),
	on(AttendancesStoreActions.metricChanged, (state, { metric }): State => ({ ...state, selectedMetric: metric })),
	on(
		AttendancesStoreActions.sessionTypeChanged,
		(state, { sessionType }): State => ({ ...state, loading: true, sessionType })
	),
	on(
		AttendancesStoreActions.datePeriodChanged,
		(state, { datePeriod }): State => ({
			...state,
			loading: true,
			datePeriod,
			year: moment(datePeriod[1]).get('year'),
			month: moment(datePeriod[1]).get('month') + 1
		})
	),
	on(
		AttendancesStoreActions.playerGroupChanged,
		(state, { selectedGroup }): State => ({ ...state, selectedPlayerRoles: selectedGroup })
	),
	on(
		AttendancesStoreActions.teamTypesChanged,
		(state, { teamTypes }): State => ({
			...state,
			teamTypes,
			selectedMetric: teamTypes.includes(TeamType.SECONDARY)
				? getAvailableMetric(state.selectedMetric)
				: state.selectedMetric
		})
	),
	on(
		AttendancesStoreActions.primaryTeamStatsLoadedSuccess,
		(state, { primaryTeamStats }): State => ({ ...state, loading: false, primaryTeamStats })
	),
	on(AttendancesStoreActions.statisticsOrderToggled, (state): State => ({ ...state, ordered: !state.ordered })),
	on(AttendancesStoreActions.statisticsLabelToggled, (state): State => ({ ...state, labelled: !state.labelled }))

	/*
	on(AttendancesStoreActions.addAttendancesStore, (state, action) => adapter.addOne(action.attendancesStore, state)),
	on(AttendancesStoreActions.upsertAttendancesStore, (state, action) =>
		adapter.upsertOne(action.attendancesStore, state)
	),
	on(AttendancesStoreActions.addAttendancesStores, (state, action) => adapter.addMany(action.attendancesStores, state)),
	on(AttendancesStoreActions.upsertAttendancesStores, (state, action) =>
		adapter.upsertMany(action.attendancesStores, state)
	),
	on(AttendancesStoreActions.updateAttendancesStore, (state, action) =>
		adapter.updateOne(action.attendancesStore, state)
	),
	on(AttendancesStoreActions.updateAttendancesStores, (state, action) =>
		adapter.updateMany(action.attendancesStores, state)
	),
	on(AttendancesStoreActions.deleteAttendancesStore, (state, action) => adapter.removeOne(action.id, state)),
	on(AttendancesStoreActions.deleteAttendancesStores, (state, action) => adapter.removeMany(action.ids, state)),

  on(AttendancesStoreActions.clearAttendancesStores, state => adapter.removeAll(state))
  */
);

export function reducer(state: State | undefined, action: Action) {
	return attendancesStoreReducer(state, action);
}

function getAvailableMetric(metric: string) {
	const metrics = fields['metrics'].filter(({ clubGame }) => !!clubGame).map(({ value }) => value);
	return metrics.includes(metric) ? metric : fields['metrics'][0].value;
}
