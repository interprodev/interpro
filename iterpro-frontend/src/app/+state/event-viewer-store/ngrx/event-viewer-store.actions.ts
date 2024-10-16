import { MedicalFieldType, ThirdPartyLinkedPlayer } from '@iterpro/shared/data-access/sdk';
import { createAction, props } from '@ngrx/store';
import { SelectItem } from 'primeng/api';
import { EventFormat } from './event-viewer-store.state';

export const inputEventChanged = createAction(
	'[EventViewerStore] Input Event Changed',
	props<{ format: EventFormat; medicalType: MedicalFieldType; matchWyscoutId: number; matchInstatId: number }>()
);
export const eventFormatChanged = createAction(
	'[EventViewerStore] Event Format Changed',
	props<{ format: EventFormat; medicalType: MedicalFieldType }>()
);
export const availableFormatsInitialized = createAction(
	'[EventViewerStore] Available Formats Initialized',
	props<{ availableFormats: SelectItem[] }>()
);
export const competitionsInitialized = createAction(
	'[EventViewerStore] Competitions initialized',
	props<{ competitions: any[]; seasonId: string }>()
);
export const eventDateUpdated = createAction('[EventViewerStore] Event Date Updated', props<{ date: Date }>());

export const secondaryTeamEventSelected = createAction(
	'[EventViewerStore] Secondary Team Event Selected',
	props<{ thirdpartyClubGameDetails: any; thirdpartyClubGameLinkedPlayerStats: ThirdPartyLinkedPlayer[] }>()
);
export const componentDestroyed = createAction('[EventViewerStore] Component Destroyed');
