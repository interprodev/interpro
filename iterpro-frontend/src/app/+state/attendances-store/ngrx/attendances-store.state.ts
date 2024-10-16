import { Event, Injury } from '@iterpro/shared/data-access/sdk';
import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import * as moment from 'moment';
import { PlayerRole, SessionType, TeamType, ViewType } from '../interfaces/attendances-store.interfaces';
import { AttendancesStore } from './attendances-store.model';

export const attendancesStoresFeatureKey = 'attendancesStores';
export const adapter: EntityAdapter<AttendancesStore> = createEntityAdapter<AttendancesStore>();

export interface State extends EntityState<AttendancesStore> {
	view: ViewType;
	today: Date;
	year: number;
	month: number;
	selectablePlayerRoles: PlayerRole[];
	selectedPlayerRoles: PlayerRole[];
	sessionType: SessionType;
	events: Event[];
	injuries: Injury[];
	tooltip: string;
	selectedMetric: string;
	datePeriod: [Date, Date];
	teamTypes: TeamType[];
	error: any;
	primaryTeamStats: any;
	ordered: boolean;
	labelled: boolean;
	loading: boolean;
}

export const initialState: State = adapter.getInitialState({
	view: ViewType.ACTIVITY_LOG,
	today: new Date(),
	year: moment().get('year'),
	month: moment().get('month') + 1,
	selectablePlayerRoles: [],
	selectedPlayerRoles: [],
	sessionType: SessionType.ALL,
	events: [],
	injuries: [],
	tooltip: '',
	selectedMetric: null,
	datePeriod: null,
	teamTypes: [TeamType.PRIMARY],
	error: null,
	primaryTeamStats: null,
	ordered: false,
	labelled: false,
	loading: false
});
