import { AuthState } from '@iterpro/shared/data-access/auth';
import { PermissionsState } from '@iterpro/shared/data-access/permissions';
import { AttendancesStoreState } from './attendances-store';
import { DrillsProfileStoreState } from './drills-profile-store';
import { EventViewerStoreState } from './event-viewer-store';
import { ImportState } from './import-store/ngrx/import-store.state';
import { RouteState } from './route-store/ngrx/route-store.state';
import { SeasonStoreState } from './season-store';
import { TopbarState } from './topbar-store/ngrx/topbar-store.state';
import { CashFlowStoreState } from './cash-flow-store';

export interface RootStoreState {
	route: RouteState;
	auth: AuthState;
	permissions: PermissionsState;
	topbar: TopbarState;
	import: ImportState;
	season: SeasonStoreState.State;
	attendences: AttendancesStoreState.State;
	eventViewer: EventViewerStoreState.State;
	drills: DrillsProfileStoreState.State;
	cashflow: CashFlowStoreState.State;
}
