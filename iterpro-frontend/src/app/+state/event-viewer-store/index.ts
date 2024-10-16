import * as EventViewerStoreActions from './ngrx/event-viewer-store.actions';
import * as EventViewerStoreSelectors from './ngrx/event-viewer-store.selectors';
import * as EventViewerStoreState from './ngrx/event-viewer-store.state';

export { EventViewerStoreModule } from './event-viewer-store.module';
// export in this manner to have namespaces
export { EventViewerStoreActions, EventViewerStoreSelectors, EventViewerStoreState };
