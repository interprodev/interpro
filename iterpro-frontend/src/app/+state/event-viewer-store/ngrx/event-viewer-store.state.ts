import { MedicalFieldType, ThirdPartyLinkedPlayer } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';

export const eventViewerStoreFeatureKey = 'eventViewerStore';

export interface State {
	date: Date;
	format: EventFormat;
	medicalType: MedicalFieldType;
	matchWyscoutId: number;
	matchInstatId: number;
	availableFormats: SelectItem[];
	competitions: any[];
	seasonId: string;
	error: any;
	thirdpartyClubGameLinkedPlayerStats: ThirdPartyLinkedPlayer[];
	thirdpartyClubGameDetails: any;
}

export const initialState: State = {
	date: new Date(),
	format: null,
	medicalType: null,
	matchWyscoutId: null,
	matchInstatId: null,
	availableFormats: [],
	competitions: [],
	seasonId: null,
	error: null,
	thirdpartyClubGameLinkedPlayerStats: null,
	thirdpartyClubGameDetails: null
};

// custom types & interfaces

export type EventFormat =
	| 'general'
	| 'travel'
	| 'training'
	| 'game'
	| 'friendly'
	| 'medical'
	| 'assessment'
	| 'clubGame'
	| 'international'
	| 'administration'
	| 'off';
