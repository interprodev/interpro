import { Event, Injury } from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';
// import { Update } from '@ngrx/entity';
import { PlayerRole, SessionType, TeamType, ViewType } from '../interfaces/attendances-store.interfaces';
import { AttendancesDay, AttendancesStore } from './attendances-store.model';

export const componentInitialized = createAction('[AttendancesStore/API] Component Initialized');
export const componentDestroyed = createAction('[AttendancesStore/API] Component Destroyed');

export const timeRangeDefined = createAction(
	'[AttendancesStore/API] Time Range Defined',
	props<{ year: number; month: number }>()
);

export const groupStatsInitializedSuccess = createAction(
	'[AttendancesStore/API] Group Stats Initialized Success',
	props<{ selectablePlayerRoles: PlayerRole[]; selectedPlayerRoles: PlayerRole[] }>()
);

export const groupStatsInitializedFailed = createAction(
	'[AttendancesStore/API] Group Stats Initialized Failed',
	props<{ error: any }>()
);

export const eventsAndInjuriesLoadedSuccess = createAction(
	'[AttendancesStore/API] Event And Injuries Loaded Success',
	props<{ events: Event[]; injuries: Injury[] }>()
);

export const eventsAndInjuriesLoadedFailed = createAction(
	'[AttendancesStore/API] Event And Injuries Loaded Failed',
	props<{ error: any }>()
);

export const cellEntered = createAction(
	'[AttendancesStore/API] Cell Entered',
	props<{ day: AttendancesDay; playerName: string; dayNum: number }>()
);

export const tooltipRendered = createAction('[AttendancesStore/API] Tooltip Rendered', props<{ tooltip: string }>());

export const monthChanged = createAction('[AttendancesStore/API] Month Changed', props<{ month: number }>());

export const yearChanged = createAction('[AttendancesStore/API] Year Changed', props<{ year: number }>());

export const metricChanged = createAction('[AttendancesStore/API] Metric Changed', props<{ metric: string }>());

export const viewChanged = createAction('[AttendancesStore/API] View Changed', props<{ view: ViewType }>());

export const activityLogViewTypeShowed = createAction('[AttendancesStore/API] Activity Log View Showed');
export const statisticsViewTypeShowed = createAction('[AttendancesStore/API] Statistics View Showed');

export const teamTypesChanged = createAction(
	'[AttendancesStore/API] Team Type Changed',
	props<{ teamTypes: TeamType[] }>()
);

export const playerGroupChanged = createAction(
	'[AttendancesStore/API] Player Group Changed',
	props<{ selectedGroup: PlayerRole[] }>()
);

export const datePeriodChanged = createAction(
	'[AttendancesStore/API] Date Period Changed',
	props<{ datePeriod: [Date, Date] }>()
);

export const sessionTypeChanged = createAction(
	'[AttendancesStore/API] SessionType Changed',
	props<{ sessionType: SessionType }>()
);

export const activityLogPdfReportRequested = createAction('[AttendancesStore/API] Activity Log PDF Report Requested');

export const activityLogCsvReportRequested = createAction('[AttendancesStore/API] Activity Log CSV Report Requested');

export const loadAttendancesStores = createAction(
	'[AttendancesStore/API] Load AttendancesStores',
	props<{ attendancesStores: AttendancesStore[] }>()
);

export const primaryTeamStatsLoadedSuccess = createAction(
	'[AttendancesStore/API] Primary Team Stats Loaded Success',
	props<{ primaryTeamStats: any }>()
);

export const primaryTeamStatsLoadedFailed = createAction(
	'[AttendancesStore/API] Primary Team Stats Loaded Failed',
	props<{ error: any }>()
);

export const statisticsPdfReportRequested = createAction('[AttendancesStore/API] Statistics PDF Report Requested');

export const statisticsCsvReportRequested = createAction('[AttendancesStore/API] Statistics CSV Report Requested');

export const statisticsOrderToggled = createAction('[AttendancesStore/API] Statistics Order Toggled');

export const statisticsLabelToggled = createAction('[AttendancesStore/API] Statistics Label Toggled');

export const dayHeaderClicked = createAction('[AttendancesStore/API] Day Header Clicked', props<{ day: number }>());

/*
export const addAttendancesStore = createAction(
	'[AttendancesStore/API] Add AttendancesStore',
	props<{ attendancesStore: AttendancesStore }>()
);

export const upsertAttendancesStore = createAction(
	'[AttendancesStore/API] Upsert AttendancesStore',
	props<{ attendancesStore: AttendancesStore }>()
);

export const addAttendancesStores = createAction(
	'[AttendancesStore/API] Add AttendancesStores',
	props<{ attendancesStores: AttendancesStore[] }>()
);

export const upsertAttendancesStores = createAction(
	'[AttendancesStore/API] Upsert AttendancesStores',
	props<{ attendancesStores: AttendancesStore[] }>()
);

export const updateAttendancesStore = createAction(
	'[AttendancesStore/API] Update AttendancesStore',
	props<{ attendancesStore: Update<AttendancesStore> }>()
);

export const updateAttendancesStores = createAction(
	'[AttendancesStore/API] Update AttendancesStores',
	props<{ attendancesStores: Update<AttendancesStore>[] }>()
);

export const deleteAttendancesStore = createAction(
	'[AttendancesStore/API] Delete AttendancesStore',
	props<{ id: string }>()
);

export const deleteAttendancesStores = createAction(
	'[AttendancesStore/API] Delete AttendancesStores',
	props<{ ids: string[] }>()
);

export const clearAttendancesStores = createAction('[AttendancesStore/API] Clear AttendancesStores');
*/
