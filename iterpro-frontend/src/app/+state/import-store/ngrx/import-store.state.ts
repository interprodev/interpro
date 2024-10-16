import { Drill } from '@iterpro/shared/data-access/sdk';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import {
	ConfigurationProblem,
	ImportProvider,
	SessionMessage,
	SplitAssociation,
	WizardPhase
} from '../interfaces/import-store.interfaces';
import { ImportStore } from './import-store.model';

export const importStoresFeatureKey = 'importStore';

// imported sessions
export const adapter: EntityAdapter<ImportStore> = createEntityAdapter<ImportStore>();

export interface ImportState extends EntityState<ImportStore> {
	provider: ImportProvider;
	configurationProblem: ConfigurationProblem;
	currentTeamSplitSession: string;
	currentTeamGameSplitSession: string;
	availableDrills: Drill[];
	splitAssociations: SplitAssociation[];
	phase: WizardPhase;
	maxNavigablePhase: WizardPhase;
	nextEnabled: boolean;
	upload: boolean;
	messages: SessionMessage[];
	importTableErrors: string[];
	importTableErrorsDialogVisible: boolean;
}

export const initialState: ImportState = adapter.getInitialState({
	provider: 'gps',
	configurationProblem: ConfigurationProblem.NO,
	currentTeamSplitSession: '',
	currentTeamGameSplitSession: '',
	availableDrills: [],
	splitAssociations: [],
	phase: 0,
	maxNavigablePhase: 0,
	nextEnabled: false,
	upload: false,
	messages: [],
	importTableErrors: [],
	importTableErrorsDialogVisible: false
});
