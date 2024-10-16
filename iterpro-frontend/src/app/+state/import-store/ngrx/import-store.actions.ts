import { Drill } from '@iterpro/shared/data-access/sdk';
import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import {
	ConfigurationProblem,
	ImportProvider,
	ImportedSessionSetInfo,
	SessionMessage,
	SplitAssociation,
	WizardPhase
} from '../interfaces/import-store.interfaces';
import { ImportStore } from './import-store.model';

export const initProvider = createAction(
	'[ImportStore/API] Initialize Provider ',
	props<{ provider: ImportProvider }>()
);

export const teamConfigurationChecked = createAction(
	'[ImportStore/API] Team Configuration Checked',
	props<{ messages: SessionMessage[]; configurationProblem: ConfigurationProblem }>()
);

export const initializeTable = createAction(
	'[ImportStore/API] Initialize Table',
	props<{ info: ImportedSessionSetInfo }>()
);

export const noImportedSessionFound = createAction('[ImportStore/API] No Imported Session Found');

export const updateImportStores = createAction(
	'[ImportStore/API] Update ImportStores',
	props<{ importStores: Array<Update<ImportStore>> }>()
);

export const clearImportStores = createAction('[ImportStore/API] Clear ImportStores');

// WIZARD PHASES MANAGAMENT
export const changePhase = createAction('[ImportStore/API] Change WizardPhase', props<{ phase: WizardPhase }>());
export const nextPhase = createAction('[ImportStore/API] Next WizardPhase ');
export const previousPhase = createAction('[ImportStore/API] Previous WizardPhase ');

// MESSAGES
export const updateMessages = createAction(
	'[ImportStore/API] Update Messages',
	props<{ messages: SessionMessage[] }>()
);

export const importTableError = createAction('[ImportStore/API] Import Table Error', props<{ errors: string[] }>());
export const clickCloseImportTableErrorDialogButton = createAction(
	'[ImportStore/API] Click Close Import Table Error Dialog Button'
);
// DRILL MAPPER
export const loadAvailableDrills = createAction(
	'[ImportStore/API] Load Available Drills',
	props<{ drills: Drill[] }>()
);
export const loadAvailableDrillsError = createAction(
	'[ImportStore/API] Load Available Drills error',
	props<{ error: any }>()
);
export const updateSplitToDrillAssociations = createAction(
	'[ImportStore/API] Update Split Association with drills',
	props<{ splitAssociations: SplitAssociation[] }>()
);
export const updateSplitAssociation = createAction(
	'[ImportStore/API] Update Split Association with drills',
	props<{ splitAssociation: SplitAssociation }>()
);
// IMPORT
export const startSessionImport = createAction('[ImportStore/API] Start Import Session');
export const startStatsImport = createAction('[ImportStore/API] Start Import Stats', props<{ provider: string }>());
export const importGpsSession = createAction(
	'[ImportStore/API] Start Import GPS',
	props<{ importStores: Array<Update<ImportStore>> }>()
);
export const importProviderSession = createAction(
	'[ImportStore/API] Start Import Provider',
	props<{ importStores: Array<Update<ImportStore>> }>()
);
export const importPlayersStats = createAction(
	'[ImportStore/API] Start Import Players Stats',
	props<{ importStores: Array<Update<ImportStore>> }>()
);
export const importTeamStats = createAction(
	'[ImportStore/API] Start Import Team Stats',
	props<{ importStores: Array<Update<ImportStore>> }>()
);
export const endSessionImport = createAction(
	'[ImportStore/API] End Import Provider',
	props<{ messages: SessionMessage[] }>()
);
export const importSessionError = createAction('[ImportStore/API] Import Session error', props<{ error: any }>());
