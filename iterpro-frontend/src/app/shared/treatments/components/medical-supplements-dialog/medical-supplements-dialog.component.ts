import {
	Component,
	EventEmitter,
	Input,
	OnChanges,
	OnInit,
	Output,
	SimpleChanges,
	ViewEncapsulation
} from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { ATC_LIST, AtcItem, Club, ClubApi, Team } from '@iterpro/shared/data-access/sdk';
import { ErrorService, sortByName } from '@iterpro/shared/utils/common-utils';

export interface AtcCommercialNamesMapping {
	code: string;
	commercialName: string;
}

@Component({
	selector: 'iterpro-medical-supplements-dialog',
	templateUrl: './medical-supplements-dialog.component.html',
	styleUrls: ['./medical-supplements-dialog.component.css'],
	encapsulation: ViewEncapsulation.None
})
export class MedicalSupplementsDialogComponent implements OnChanges, OnInit {
	@Input() visible: boolean;
	@Input() model: any;
	@Input() team: Team;
	@Input() pinnedTreatments: string[] = [];
	@Output() onSave: EventEmitter<any> = new EventEmitter<any>();
	@Output() onDiscard: EventEmitter<any> = new EventEmitter<any>();
	@Output() savePinEmitter: EventEmitter<{ event: any; treatmentCode: string }> = new EventEmitter<{
		event: any;
		treatmentCode: string;
	}>();

	level1Options: AtcItem[] = [];
	level2Options: AtcItem[] = [];
	level3Options: AtcItem[] = [];
	level4Options: AtcItem[] = [];
	level5Options: AtcItem[] = [];

	level1: AtcItem = null;
	level2: AtcItem = null;
	level3: AtcItem = null;
	level4: AtcItem = null;
	selected: AtcItem = null;
	selectedLevel: any = null;
	warningMessage = false;
	club: Club;
	atcCommercialNamesMapping: AtcCommercialNamesMapping[] = [];

	constructor(
		private readonly clubApi: ClubApi,
		private readonly error: ErrorService,
		private readonly currentTeamService: CurrentTeamService
	) {}

	ngOnInit() {
		this.club = this.currentTeamService.getCurrentTeam().club;
		this.atcCommercialNamesMapping = !!this.club.atcCommercialNamesMapping
			? [...this.club.atcCommercialNamesMapping]
			: [];
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['visible'] && this.visible === true) {
			this.level1Options = ATC_LIST.filter(({ code }) => code.match(new RegExp('^[A-Z]$', 'gi')));
			this.level1Options = sortByName(this.level1Options, 'name');
			this.level5Options = ATC_LIST.filter(({ code }) =>
				code.match(new RegExp('^[A-Z][0-9][0-9][A-Z][A-Z][0-9][0-9]$', 'gi'))
			).map(drug => this.getMappedDrug(drug));
			this.level5Options = sortByName(this.level5Options, 'name');
			this.level5Options = this.sortByPinned(this.level5Options);
			if (this.model && this.model.treatment && this.model.treatment.length > 0) {
				const select = ATC_LIST.find(({ name }) => name === this.model.treatment[0]);
				if (select) {
					this.level1 = ATC_LIST.find(({ code }) => code === select.code.substring(0, 1));
					this.loadLevel2({ value: this.level1 });
					this.level2 = ATC_LIST.find(({ code }) => code === select.code.substring(0, 3));
					this.loadLevel3({ value: this.level2 });
					this.level3 = ATC_LIST.find(({ code }) => code === select.code.substring(0, 4));
					this.loadLevel4({ value: this.level3 });
					this.level4 = ATC_LIST.find(({ code }) => code === select.code.substring(0, 5));
					this.loadLevel5({ value: this.level4 });
					this.select({ value: this.getMappedDrug(select as AtcItem) });
				}
			} else {
				this.level2Options = [];
				this.level3Options = [];
				this.level4Options = [];
			}
		} else {
			this.level1 = null;
			this.level2 = null;
			this.level3 = null;
			this.level4 = null;
			this.selected = null;
		}
	}

	/**
	 * Medical > Maintenance > treatment > medication accordion > select drug column for selecting medical supplement.
	 * Allow the user to save medical supplement value when a category is selected with no final options.
	 * if final options are present then user is forced to select the available options.
	 */
	save() {
		if (this.level1Options.length > 0 && this.level2Options.length > 0 && this.selectedLevel >= 2) {
			if (
				this.level3Options.length > 0 &&
				this.level4Options.length > 0 &&
				this.selectedLevel === 4 &&
				this.level5Options.length === 0
			) {
				this.emitSave();
			} else if (this.level3Options.length > 0 && this.selectedLevel === 3 && this.level4Options.length === 0) {
				this.emitSave();
			} else if (this.selectedLevel === 2 && this.level3Options.length === 0) {
				this.emitSave();
			} else if (this.selectedLevel === 5) {
				this.emitSave();
			} else if (!!this.selected) {
				this.emitSave();
			} else {
				this.warningMessage = true;
			}
		} else if (!!this.selected) {
			this.emitSave();
		} else {
			this.warningMessage = true;
		}
	}

	emitSave() {
		this.saveMapping();
		this.onSave.emit(this.selected);
	}

	discard() {
		this.onDiscard.emit(false);
	}

	loadLevel2(event) {
		if (!event.value) event.value = { code: null };
		this.level2Options = ATC_LIST.filter(({ code }) =>
			code.match(new RegExp('^' + event.value.code + '[0-9][0-9]$', 'gi'))
		);
		this.level3Options = [];
		this.level4Options = [];
		this.level5Options = ATC_LIST.filter(({ code }) =>
			code.match(new RegExp('^' + (event.value.code || '[A-Z]') + '[0-9][0-9][A-Z][A-Z][0-9][0-9]$', 'gi'))
		).map(drug => this.getMappedDrug(drug));
		this.level2Options = sortByName(this.level2Options, 'name');
		this.level5Options = sortByName(this.level5Options, 'name');

		this.selected = null;
		this.selectedLevel = 1;
		this.warningMessage = false;
	}

	loadLevel3(event) {
		if (!event.value) event.value = { code: null };
		this.level3Options = ATC_LIST.filter(({ code }) => code.match(new RegExp('^' + event.value.code + '[A-Z]$', 'gi')));
		this.level4Options = [];
		this.level5Options = ATC_LIST.filter(({ code }) =>
			code.match(
				new RegExp('^' + (event.value.code || this.level1.code + '[0-9][0-9]') + '[A-Z][A-Z][0-9][0-9]$', 'gi')
			)
		).map(drug => this.getMappedDrug(drug));
		this.level3Options = sortByName(this.level3Options, 'name');
		this.level5Options = sortByName(this.level5Options, 'name');
		this.selected = null;
		this.selectedLevel = 2;
		this.warningMessage = false;
	}

	loadLevel4(event) {
		if (!event.value) event.value = { code: null };
		this.level4Options = ATC_LIST.filter(({ code }) => code.match(new RegExp('^' + event.value.code + '[A-Z]$', 'gi')));
		this.level5Options = ATC_LIST.filter(({ code }) =>
			code.match(new RegExp('^' + (event.value.code || this.level2.code + '[A-Z]') + '[A-Z][0-9][0-9]$', 'gi'))
		).map(drug => this.getMappedDrug(drug));
		this.level4Options = sortByName(this.level4Options, 'name');
		this.level5Options = sortByName(this.level5Options, 'name');
		this.selected = null;
		this.selectedLevel = 3;
		this.warningMessage = false;
	}

	loadLevel5(event) {
		if (!event.value) event.value = { code: null };
		this.level5Options = ATC_LIST.filter(({ code }) =>
			code.match(new RegExp('^' + (event.value.code || this.level3.code + '[A-Z]') + '[0-9][0-9]$', 'gi'))
		).map(drug => this.getMappedDrug(drug));
		this.level5Options = sortByName(this.level5Options, 'name');
		this.selected = null;
		this.selectedLevel = 4;
		this.warningMessage = false;
	}

	select(event) {
		this.selected = event.value;
		const mapping = this.atcCommercialNamesMapping.find(({ code }) => code === this.selected.code);
		this.selected.commercialName = mapping ? mapping.commercialName : null;
		this.selectedLevel = 5;
		this.warningMessage = false;
	}

	private saveMapping() {
		let toSave = false;
		if (this.selected.commercialName) {
			const mappingIndex = this.atcCommercialNamesMapping.findIndex(({ code }) => code === this.selected.code);
			if (mappingIndex === -1) {
				this.atcCommercialNamesMapping = [
					...this.atcCommercialNamesMapping,
					{ code: this.selected.code, commercialName: this.selected.commercialName }
				];
				toSave = true;
			} else if (this.atcCommercialNamesMapping[mappingIndex].commercialName !== this.selected.commercialName) {
				this.atcCommercialNamesMapping[mappingIndex] = {
					...this.atcCommercialNamesMapping[mappingIndex],
					commercialName: this.selected.commercialName
				};
				toSave = true;
			}

			if (toSave) {
				this.clubApi
					.patchAttributes(this.club.id, {
						atcCommercialNamesMapping: this.atcCommercialNamesMapping
					})
					.subscribe({
						next: (club: Club) =>
							this.currentTeamService.setCurrentTeam({ ...this.currentTeamService.getCurrentTeam(), club }),
						error: (error: Error) => this.error.handleError(error)
					});
			}
		}
	}

	private getMappedDrug(drug: AtcItem) {
		const mapping = this.atcCommercialNamesMapping.find(mappedDrug => mappedDrug.code === drug.code);
		return {
			...drug,
			commercialName: mapping ? mapping.commercialName : null,
			label: `${
				mapping
					? `${mapping.commercialName.toUpperCase()} (${drug.name} ${drug.DDD}${drug.Unit} ${drug.AdmR})`
					: `${drug.name} ${drug.DDD}${drug.Unit} ${drug.AdmR}`
			}`
		};
	}

	savePin(event, treatment) {
		event.stopPropagation();
		this.level5Options = this.sortByPinned(this.level5Options);
		this.savePinEmitter.emit({ event, treatmentCode: treatment.code });
	}


	sortByPinned(atcItems: AtcItem[]): AtcItem[] {
		return (atcItems || []).sort((a, b) => {
			if (this.pinnedTreatments && this.pinnedTreatments.includes(a.code) && this.pinnedTreatments.includes(b.code)) {
				return 0;
			}
			if (this.pinnedTreatments && this.pinnedTreatments.includes(a.code)) {
				return -1;
			}
			if (this.pinnedTreatments && this.pinnedTreatments.includes(b.code)) {
				return 1;
			}
			return 0;
		});
	}
}
