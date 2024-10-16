import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { SelectItem } from 'primeng/api';
import { v4 as uuid } from 'uuid';
import {
	appearances,
	awards,
	booleanRelationOptions,
	conditionsType,
	goals,
	nationalsApp,
	phases,
	playerActions,
	signingOptions,
	teamActions,
	teamActionsGoal
} from '../../utils/contract-options';
import {
	BasicWage,
	Bonus,
	ContractOptionCondition,
	LoanOption,
	StringBonus,
	TransferClause
} from '@iterpro/shared/data-access/sdk';
import { insertAtIndex } from '@iterpro/shared/utils/common-utils';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { NgClass, NgIf } from '@angular/common';
import { SelectItemLabelPipe } from '@iterpro/shared/ui/pipes';
import { MaskDirective } from '@iterpro/shared/ui/directives';
@Component({
	standalone: true,
	selector: 'iterpro-conditions-table',
	templateUrl: './conditions-table.component.html',
	styleUrls: ['./conditions-table.component.scss'],
	imports: [PrimeNgModule, TranslateModule, FormsModule, NgClass, NgIf, SelectItemLabelPipe, MaskDirective],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => ConditionsTableComponent),
			multi: true
		}
	]
})
export class ConditionsTableComponent implements OnInit {
	@Input() _option: BasicWage | Bonus | LoanOption | TransferClause;
	@Input() currency: string;
	@Input() disabled: boolean;
	@Input() seasonsItems: SelectItem[];
	@Input() teams: SelectItem[];
	@Input() type: StringBonus;
	@Input() competitions: SelectItem[];

	booleanRelationOptions: SelectItem[] = booleanRelationOptions;
	nationalsApp: SelectItem[] = nationalsApp;
	goals: SelectItem[] = goals;
	playerActions: SelectItem[] = playerActions;
	awards: SelectItem[] = awards;
	teamActions: SelectItem[] = teamActions;
	teamActionsGoal: SelectItem[] = teamActionsGoal;
	signingOptions: SelectItem[] = signingOptions;
	appearances: SelectItem[] = appearances;
	phases: SelectItem[] = phases;
	conditionsType: SelectItem[] = conditionsType;

	constructor(private translate: TranslateService) {}

	ngOnInit() {
		this.mapDropdownItems();
	}

	get option() {
		return this._option;
	}

	set option(val: any) {
		this._option = val;
	}

	writeValue(value: any) {
		if (value) {
			this.option = value;
		}
	}

	propagateChange = (_: any) => {};

	registerOnChange(fn) {
		this.propagateChange = fn;
	}

	registerOnTouched() {}

	private mapDropdownItems() {
		this.nationalsApp = this.nationalsApp.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.phases = this.phases.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.goals = this.goals.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.playerActions = this.playerActions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.awards = this.awards.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.teamActions = this.teamActions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.teamActionsGoal = this.teamActionsGoal.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.appearances = this.appearances.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.signingOptions = this.signingOptions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.conditionsType = this.conditionsType.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
	}

	addCondition() {
		const condition: ContractOptionCondition = new ContractOptionCondition({
			type: this.type,
			phases: [],
			competitions: [],
			seasons: [],
			action: null,
			count: null,
			count2: null,
			goal: null,
			team: null,
			custom: null,
			startDate: undefined,
			untilDate: undefined,
			membershipDate: undefined,
			soldDate: undefined,
			soldAmount: null,
			condition: null,
			matchId: null,
			seasonsRelationFlag: booleanRelationOptions[0].value,
			competitionsRelationFlag: booleanRelationOptions[0].value,
			bonusCap: null,
			progress: undefined
		});
		if (this.type === 'appearanceFee' || this.type === 'performanceFee') condition.action = 'per';
		if (this.type === 'appearance' || this.type === 'performance') condition.action = 'makes';
		this.option.conditions.push(condition);
	}

	isPrecondition(type: string): boolean {
		return (
			type === 'basicWage' ||
			type === 'valorization' ||
			type === 'fee' ||
			type === 'privateWriting' ||
			type === 'loanOption' ||
			type === 'sellOnFee' ||
			type === 'buyBack'
		);
	}

	onChangeCompetitions(index: number) {
		if (this.option.conditions[index].competitions.includes('allActiveCompetitions'))
			this.option.conditions[index].competitions = ['allActiveCompetitions'];
	}

	onChangeSeason(index: number) {
		if (this.option.conditions[index].seasons.includes('allContract'))
			this.option.conditions[index].seasons = ['allContract'];
	}

	removeCondition(index: number) {
		this.option.conditions.splice(index, 1);
	}

	cloneCondition(index: number) {
		const clone = cloneDeep(this.option.conditions[index]);
		clone.id = uuid();
		this.option.conditions = insertAtIndex(this.option.conditions, clone, index);
	}
}
