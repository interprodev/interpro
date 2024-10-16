import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Bonus, Club, ContractOptionCondition, TeamSeason } from '@iterpro/shared/data-access/sdk';
import { AmortizationCommonService } from '../squads-person-amortization/services/amortization-common.service';
import { BonusStringBuilderService } from '../squads-person-legal/services/bonus-string-builder.service';

@Component({
	selector: 'iterpro-squads-person-bonuses',
	templateUrl: './squads-person-bonuses.component.html',
	styleUrls: ['./squads-person-bonuses.component.css']
})
export class SquadsPersonBonusesComponent implements OnChanges {
	@Input() bonuses: Bonus[];
	@Input() seasons: TeamSeason[];
	@Input() currency: string;
	@Input() translation: any;
	@Input() club: Club;

	appBonusesList: Bonus[] = [];
	perfBonusesList: Bonus[] = [];
	signingBonusesList: Bonus[] = [];
	customBonusesList: Bonus[] = [];
	teamBonusesList: Bonus[] = [];

	constructor(
		private amortizationService: AmortizationCommonService,
		private bonusStringBuilder: BonusStringBuilderService
	) {}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['bonuses']) {
			this.scaffoldBonuses(this.bonuses);
		}
	}

	scaffoldBonuses(bonuses: any[]) {
		const assetBonuses = this.amortizationService.getPurchaseBonuses(bonuses);
		this.appBonusesList = assetBonuses.filter(({ type }) => type === 'appearance');
		this.perfBonusesList = assetBonuses.filter(({ type }) => type === 'performance');
		this.teamBonusesList = assetBonuses.filter(({ type }) => type === 'standardTeam');
		this.signingBonusesList = assetBonuses.filter(({ type }) => type === 'signing');
		this.customBonusesList = assetBonuses.filter(({ type }) => type === 'custom');
	}

	isReachedProgressBar(rowData: Bonus): number {
		return rowData?.progress?.percentage < 100 && !rowData.reached ? Math.round(rowData.progress?.percentage) : 100;
	}

	isReachedConditionProgressBarTeam(condition: ContractOptionCondition): number {
		return condition?.progress.percentage
			? condition.progress.percentage < 100
				? Math.round(condition.progress.percentage)
				: 100
			: 0;
	}

	getCondition(condition: ContractOptionCondition, bonus: Bonus): string {
		return this.bonusStringBuilder.getSingleConditionSimplified(condition, bonus)?.description;
	}

	getBonusText(bonus: Bonus, index: number): string {
		return this.bonusStringBuilder.getBonusText(bonus, false, this.club?.name, false, false, this.club, null, index);
	}
}
