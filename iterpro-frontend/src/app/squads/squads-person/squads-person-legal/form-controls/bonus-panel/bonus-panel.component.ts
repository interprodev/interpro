import { DecimalPipe, LowerCasePipe, NgIf, NgStyle } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import {
	BasicWage,
	Bonus,
	Club,
	LoanOption,
	StringBonus,
	Team,
	TeamSeason,
	TransferClause,
	TransferContract
} from '@iterpro/shared/data-access/sdk';
import { CompetitionsConstantsService } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { round } from 'lodash';
import { SelectItem } from 'primeng/api';
import { BonusService } from '../../services/bonus.service';
import {
	appearances,
	awards,
	competitions,
	conditionsType,
	frequencyOptions,
	goals,
	nationalsApp,
	optionActions,
	optionItems,
	optionOptionsItems,
	phases,
	playerActions,
	seasonActions,
	signingOptions,
	solidarityOptions,
	teamActions,
	teamActionsGoal,
	teams,
	terminationItems
} from '../../utils/contract-options';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { InstallmentsTableComponent } from '../installments-table/installments-table.component';
import { ConditionsTableComponent } from '../conditions-table/conditions-table.component';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MaskDirective } from '@iterpro/shared/ui/directives';

export enum PaymentFrequency {
	'year' = 1,
	'month' = 12,
	'week' = 52
}

@Component({
	standalone: true,
	selector: 'iterpro-bonus-panel',
	templateUrl: './bonus-panel.component.html',
	styleUrls: ['./bonus-panel.component.scss'],
	imports: [
		PrimeNgModule,
		NgIf,
		TranslateModule,
		FormsModule,
		InstallmentsTableComponent,
		ConditionsTableComponent,
		LowerCasePipe,
		NgStyle,
		InputTextareaModule,
		MaskDirective
	],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => BonusPanelComponent),
			multi: true
		}
	]
})
export class BonusPanelComponent implements OnInit {
	@Input() visible: boolean;
	@Input() disabled: boolean;
	@Input() type: StringBonus;
	@Input() newBonus: boolean;
	@Input() currency: string;
	@Input() seasons: TeamSeason[];
	@Input() index: number;
	@Input() _bonus: any;
	@Input() financial = false;
	@Input() isTypeTransferContract: boolean;
	@Input() team: Team;
	@Input() agent = false;
	@Input() outward: boolean;
	@Input() club: Club;

	@Output() saveEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() discardEmitter: EventEmitter<any> = new EventEmitter<any>();

	advancedView: boolean;
	nationalsApp: SelectItem[] = nationalsApp;
	teams: SelectItem[] = teams;
	competitions: SelectItem[] = competitions;
	phases = phases;
	seasonActions = seasonActions;
	residualInstallmentValue = 0;
	localSeason: any[];
	signed = false;
	signedCompetition = false;
	goals: SelectItem[];
	playerActions: SelectItem[];
	awards: SelectItem[];
	teamActions: SelectItem[];
	teamActionsGoal: SelectItem[];
	appearances: SelectItem[];
	terminationItems: SelectItem[];
	frequencyOptions: SelectItem[];
	signingOptions: SelectItem[];
	optionOptionsItems: SelectItem[];
	optionActions: SelectItem[];
	optionItems: SelectItem[];
	solidarityOptions: SelectItem[];
	conditionsType: SelectItem[] = conditionsType;
	seasonsItems: SelectItem[];
	bonusAmount: number;
	bonusGrossAmount: number;
	handlePaymentFrequency: boolean;
	constructor(
		public translate: TranslateService,
		private competitionsService: CompetitionsConstantsService,
		private currentTeamService: CurrentTeamService,
		private bonusService: BonusService,
		private numberPipe: DecimalPipe
	) {}

	ngOnInit() {
		this.handlePaymentFrequency = !this.isTypeTransferContract && (this.type === 'basicWage' || this.type === 'fee');
		this.mapDropdownElements();
	}

	private mapDropdownElements() {
		this.seasonsItems = [
			{ label: this.translate.instant('allContract'), value: 'allContract' },
			...this.seasons.map(x => ({ label: x.name, value: x.id }))
		];
		this.seasonActions = seasonActions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.nationalsApp = this.nationalsApp.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.phases = this.phases.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.teams = this.teams.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.solidarityOptions = solidarityOptions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));

		this.competitions = this.outward ? this.competitionsService.getCompetitions() : this.getInwardCompetitions();
		this.goals = goals.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.playerActions = playerActions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.awards = awards.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.teamActions = teamActions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.teamActionsGoal = teamActionsGoal.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.appearances = appearances.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.terminationItems = terminationItems.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.frequencyOptions = frequencyOptions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.signingOptions = signingOptions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.optionOptionsItems = optionOptionsItems;
		this.optionActions = optionActions.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.optionItems = optionItems.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
		this.conditionsType = conditionsType.map(x => ({
			label: this.translate.instant(x.label),
			value: x.value
		}));
	}

	get bonus() {
		return this._bonus;
	}

	set bonus(val: any) {
		this._bonus = this.bonusService.completeBonus(val as BasicWage | Bonus | TransferClause | LoanOption, this.type);
		if (this._bonus.precondition) {
			if (this._bonus.precondition.date) this.signed = true;
			if (this._bonus.precondition.competition && (this._bonus as Bonus).precondition.competition.length > 0)
				this.signedCompetition = true;
		}
		this.advancedView = !!(
			(this._bonus as Bonus).cap ||
			(this._bonus as BasicWage | Bonus | TransferClause | LoanOption).asset ||
			(this._bonus as TransferContract | BasicWage | Bonus | TransferClause | LoanOption).mechanismSolidarity
		);

		this.bonusAmount = this.handlePaymentFrequency
			? round(this._bonus.amount / PaymentFrequency[this.club.paymentFrequency || 'year'], 0.05)
			: this._bonus.amount;
		this.bonusGrossAmount = this.handlePaymentFrequency
			? round(this._bonus.grossAmount / PaymentFrequency[this.club.paymentFrequency || 'year'], 0.05)
			: this._bonus.grossAmount;
		if (!this._bonus.repeat) this._bonus.repeat = false;
		if (!this._bonus.withinMode) this._bonus.withinMode = 'days';
		this.advancedView = this._bonus.cap || this._bonus.asset || this._bonus.mechanismSolidarity ? true : false;
		if (this.seasonsItems) this.localSeason = this.seasonsItems.slice(1, this.seasonsItems.length);
		this.propagateChange(this._bonus);
	}

	private getInwardCompetitions(): SelectItem[] {
		let competitionsItems: SelectItem[] = [];

		const currentSeason = this.currentTeamService.getCurrentSeason();
		const { competitionInfo = [], wyscoutAreas = [], instatAreas = [] } = currentSeason;
		if (competitionInfo.length > 0) {
			competitionsItems = competitionInfo.map(info => {
				const data = this.competitionsService.getCompetitionFromJson(info.competition) || info;
				return { label: this.translate.instant(data.name), value: data.wyId || data.competition };
			});
		} else if (wyscoutAreas.length > 0 || instatAreas.length > 0) {
			competitionsItems = this.competitionsService.getCompetitionsByAreas(currentSeason?.wyscoutAreas || []).map(c => ({
				label: this.translate.instant(c.label),
				value: c.value
			}));
		} else {
			competitionsItems = competitions.map(x => ({
				label: this.translate.instant(x.label),
				value: x.value
			}));
		}

		return [
			{
				label: this.translate.instant('allActiveCompetitions'),
				value: 'allActiveCompetitions'
			},
			...competitionsItems,
			...this.teams
		];
	}

	writeValue(value: any) {
		if (value) {
			this.bonus = value;
		}
	}

	propagateChange = (value: any) => {};

	registerOnChange(fn) {
		this.propagateChange = fn;
	}

	registerOnTouched() {}

	onChange(element, event, index?) {
		switch (element) {
			case 'bonus.condition.season':
				if (this.bonus.precondition.season.includes('allContract')) this.bonus.precondition.season = ['allContract'];
				break;
			case 'bonus.season':
				if (index)
					if (this.bonus.conditions[index].seasons.includes('allContract'))
						this.bonus.conditions[index].seasons = ['allContract'];
					else if (this.bonus.season.includes('allContract')) this.bonus.season = ['allContract'];
				break;
		}
	}

	onChangeCompetitions(element, event, index?) {
		switch (element) {
			case 'bonus.competition':
				if (index)
					if (
						(this.bonus as BasicWage | Bonus | TransferClause | LoanOption).conditions[index].competitions.includes(
							'allActiveCompetitions'
						)
					)
						(this.bonus as BasicWage | Bonus | TransferClause | LoanOption).conditions[index].competitions = [
							'allActiveCompetitions'
						];
				// else if (this.bonus.competition.includes('allActiveCompetitions'))
				// 	(this.bonus as BasicWage).competition = ['allActiveCompetitions'];
				break;
			case 'bonus.condition.competition':
				if ((this.bonus as Bonus).precondition.competition.includes('allActiveCompetitions'))
					(this.bonus as Bonus).precondition.competition = ['allActiveCompetitions'];
				break;
		}
	}

	getBonusAmount(bonus: Bonus): string {
		return this.numberPipe.transform(bonus.amount, '1.0-2', this.translate.currentLang);
	}

	onClickChip() {
		this.bonusAmount = this.getVirtualNet(this.bonusGrossAmount);
		this.updateBonusAmount();
	}

	onClickChipGross() {
		this.bonusGrossAmount = this.getVirtualGross(this.bonusAmount);
		this.updateBonusGrossAmount();
	}

	updateBonusAmount() {
		// CONVERT USER-DEFINED FREQUENCY AMOUNT INTO YEARLY AMOUNT
		this.bonus.amount = this.handlePaymentFrequency
			? this.bonusAmount * PaymentFrequency[this.club.paymentFrequency || 'year']
			: this.bonusAmount;
	}

	updateBonusGrossAmount() {
		this.bonus.grossAmount = this.handlePaymentFrequency
			? this.bonusGrossAmount * PaymentFrequency[this.club.paymentFrequency || 'year']
			: this.bonusGrossAmount;
	}

	onSave() {
		this.saveEmitter.emit(this.bonus);
	}

	onDiscard() {
		this.discardEmitter.emit();
	}

	isValid(): boolean {
		return this.bonusService.isValid(this.disabled, this.bonus);
	}

	onEnableBenefit({ checked }) {
		this.bonus.enabled = checked;
	}

	getVirtualGross(amount: number): number {
		if (this.club) {
			if (this.isTypeTransferContract || this.agent || this.type === 'valorization') {
				return this.toFixedAmount(amount + amount * ((this.club.vat || 0) / 100));
			} else {
				return this.toFixedAmount(amount + amount * ((this.club.taxes || 0) / 100));
			}
		}
	}

	getVirtualNet(amount: number): number {
		if (this.club) {
			if (this.isTypeTransferContract || this.agent || this.type === 'valorization') {
				return this.toFixedAmount((100 * amount) / (100 + (this.club.vat || 0)));
			} else {
				return this.toFixedAmount((100 * amount) / (100 + (this.club.taxes || 0)));
			}
		}
	}

	toFixedAmount(amount: number): number {
		return amount ? Number(amount.toFixed(2)) : 0;
	}

	toStringTooltip(amount: number): string {
		if (amount) {
			return this.numberPipe.transform(amount, '0.0-0', this.translate.currentLang);
		}
	}

	onChangeSeason(event: SelectItem) {
		if ((this.bonus as BasicWage).season.includes('allContract')) (this.bonus as BasicWage).season = ['allContract'];
	}
	setWithinMode(mode: string) {
		(this._bonus as TransferContract | BasicWage | Bonus | TransferClause | LoanOption).withinMode = mode;
	}

	resetCondition(value: boolean, type: string) {
		if (type === 'basic') {
			(this._bonus as Bonus).preconditioned = true;
		} else {
			if (value === false) {
				(this._bonus as Bonus).precondition[type] = type === 'competition' ? [] : null;
			}
		}
	}
}
