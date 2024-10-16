import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Drill, Team } from '@iterpro/shared/data-access/sdk';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { ImportStoreActions, ImportStoreSelectors } from './../../+state/import-store';
import {
	ImportProvider,
	ImportedSessionSetInfo,
	Labelled,
	SessionMessage,
	SplitAssociation,
	WizardPhase
} from './../../+state/import-store/interfaces/import-store.interfaces';
import { ImportStore } from './../../+state/import-store/ngrx/import-store.model';
import { RootStoreState } from './../../+state/root-store.state';

@Component({
	selector: 'iterpro-import-wizard',
	templateUrl: './import-wizard.component.html',
	styleUrls: ['./../import.common.css', './import-wizard.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportWizardComponent implements OnInit, OnChanges {
	@Input() team: Team;
	@Input() provider: ImportProvider = 'gps';

	provider$: Observable<ImportProvider>;
	hasConfigurationProblem$: Observable<boolean>;
	hasGpsConfigurationProblem$: Observable<boolean>;
	hasSeasonConfigurationProblem$: Observable<boolean>;
	phase$: Observable<number>;
	maxNavigablePhase$: Observable<number>;
	nextEnabled$: Observable<boolean>;

	source$: Observable<ImportStore[]>;
	splits$: Observable<SplitAssociation[]>;
	drills$: Observable<Array<Labelled<Drill>>>;

	messages$: Observable<SessionMessage[]>;

	wizardConfiguration: Array<{ label: string; description?: string }> = [];

	constructor(private store$: Store<RootStoreState>) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['provider'] && this.provider) {
			// provider type
			this.store$.dispatch(ImportStoreActions.initProvider({ provider: this.provider }));
		}
	}

	ngOnInit() {
		this.wizardConfiguration = [
			{
				label: 'import.wizard.label.select',
				description:
					this.provider === 'gps' || this.provider === 'teamStats' || this.provider === 'playersStats'
						? 'import.wizard.description.import.gps'
						: 'import.wizard.description.import.provider'
			},
			{
				label: 'import.wizard.label.review',
				description: 'import.wizard.description.review'
			},
			{
				label: 'import.wizard.label.map',
				description: 'import.wizard.description.map'
			},
			{ label: 'import.wizard.label.completed' }
		];

		this.provider$ = this.store$.select(ImportStoreSelectors.selectProvider);
		this.hasConfigurationProblem$ = this.store$.select(ImportStoreSelectors.selectHasConfigurationProblem);
		this.hasGpsConfigurationProblem$ = this.store$.select(ImportStoreSelectors.selectHasGpsConfigurationProblem);
		this.hasSeasonConfigurationProblem$ = this.store$.select(ImportStoreSelectors.selectHasSeasonConfigurationProblem);

		// wizard navigation
		this.phase$ = this.store$.select(ImportStoreSelectors.selectPhase);
		this.maxNavigablePhase$ = this.store$.select(ImportStoreSelectors.selectMaxNavigablePhase);
		this.nextEnabled$ = this.store$.select(ImportStoreSelectors.selectNextEnabled);
		// loaded source
		this.source$ = this.store$.select(ImportStoreSelectors.selectAllImportedSessionSets);
		// mapping
		if (this.provider !== 'teamStats' && this.provider !== 'playersStats') {
			this.splits$ = this.store$.select(ImportStoreSelectors.selectAvailableSplitAssociations);
			this.drills$ = this.store$.select(ImportStoreSelectors.selectLabelledDrills);
		}
		// messages and links to events
		this.messages$ = this.store$.select(ImportStoreSelectors.selectMessages);
	}

	// TODO: Wizard behaviours to abstract and set in a new ngrx feature
	// wizard navigation
	clickPhaseNavigationButtonAction(phase: WizardPhase) {
		this.store$.dispatch(ImportStoreActions.changePhase({ phase }));
	}
	clickNextButtonAction() {
		this.store$.dispatch(ImportStoreActions.nextPhase());
	}
	clickPreviousButtonAction() {
		this.store$.dispatch(ImportStoreActions.previousPhase());
	}

	clickCancelButtonAction() {
		this.store$.dispatch(ImportStoreActions.clearImportStores());
	}

	clickUploadAction() {
		this.store$.dispatch(
			this.provider === 'teamStats' || this.provider === 'playersStats'
				? ImportStoreActions.startStatsImport({ provider: this.provider })
				: ImportStoreActions.startSessionImport()
		);
	}
	// end wizard navigation

	updateMessagesAction(messages: SessionMessage[]) {
		this.store$.dispatch(ImportStoreActions.updateMessages({ messages }));
	}

	importSessionInfoSourcesAction(info: ImportedSessionSetInfo) {
		if (!!info.importStores && info.importStores.length > 0) {
			info.importStores.forEach(drillMap => (drillMap.id = uuid()));
			this.store$.dispatch(ImportStoreActions.initializeTable({ info }));
		} else {
			this.store$.dispatch(ImportStoreActions.noImportedSessionFound());
		}
	}

	updateSessionAssociatedEventAction(importStores: Array<Partial<ImportStore>>) {
		this.store$.dispatch(
			ImportStoreActions.updateImportStores({
				importStores: importStores.map(({ id, ...changes }) => ({ id, changes }))
			})
		);
	}

	updateSplitToDrillAssociationsAction(splitAssociations: SplitAssociation[]) {
		this.store$.dispatch(ImportStoreActions.updateSplitToDrillAssociations({ splitAssociations }));
	}
}
