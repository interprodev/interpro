import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { round } from 'mathjs';
import moment from 'moment';
import { PaymentFrequency } from '../form-controls/bonus-panel/bonus-panel.component';
import {
	BasicWage,
	Benefit,
	Bonus,
	BuyOutClause,
	Club,
	ContractOptionCondition,
	Insurance,
	LoanOption,
	StringBonus,
	TeamBonus,
	TeamSeason,
	TransferClause,
	TransferContract
} from '@iterpro/shared/data-access/sdk';
import {
	CompetitionsConstantsService,
	getMomentFormatFromStorage,
	parseHtmlStringToText
} from '@iterpro/shared/utils/common-utils';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';

export const isNullOrUndefined = value => {
	return value === null || value === undefined || isNaN(value);
};

export const getVirtualGross = (
	bonus: Bonus | BasicWage,
	taxes?: boolean,
	club?: Partial<Club>,
	isTypeTransferContract?: boolean
): number => {
	if (!bonus.amount) return 0;
	else if (!taxes) return bonus.amount;
	else if (!isTypeTransferContract)
		return bonus.grossAmount || bonus.amount + bonus.amount * ((club?.taxes || 0) / 100) || 0;
	else return bonus.grossAmount || bonus.amount + bonus.amount * ((club.vat || 0) / 100) || 0;
};

@Injectable({
	providedIn: 'root'
})
export class BonusStringBuilderService {
	seasons: TeamSeason[] = [];
	competitions: any;
	currency: string;
	translation: any;

	constructor(
		private competitionsService: CompetitionsConstantsService,
		private numberPipe: DecimalPipe,
		private translate: TranslateService,
		private currentTeamService: CurrentTeamService
	) {
		this.seasons = this.currentTeamService.getCurrentTeam().teamSeasons;
		this.competitions = this.currentTeamService.extractSeason(this.seasons, moment().toDate()).competitionInfo;
		this.currency = this.currentTeamService.getCurrency();
		this.translate
			.getTranslation(this.translate.currentLang)
			.subscribe(translation => (this.translation = translation));
	}

	getBonusText(
		bonus: Bonus | BasicWage,
		isTypeTransferContract: boolean,
		teamInFavor?: string,
		extended?: boolean,
		taxes?: boolean,
		club?: Club,
		agent?: string,
		index?: number
	): string {
		const amount = this.getAmount(bonus, null, taxes, club, isTypeTransferContract || !!agent);
		const solidarity = this.getSolidarity(bonus, isTypeTransferContract);
		const conditions = this.getConditions(bonus);
		const expiration = this.getExpiration(bonus);
		const installments = extended ? this.getExtendedInstallments(bonus) : this.getInstallments(bonus);
		const precondition = this.getPrecondition(bonus, extended);
		const asset = this.getAsset(bonus);
		const bonusCap = this.getBonusCap(bonus);
		const inFavor = this.getInFavor(teamInFavor, agent);

		return `${index}) ${amount}${solidarity}${inFavor}${conditions}${this.translate.instant(
			'admin.forecast.toPay'
		)}${expiration}${installments}${precondition}${asset}${bonusCap}.`;
	}

	getSingleConditionSimplified(
		condition: ContractOptionCondition,
		bonus: Bonus | TeamBonus | BasicWage
	): { description: string; progress: string; type: string } {
		const condType = bonus.type === 'valorization' ? condition.type : bonus.type;
		const progress = this.getProgressCondition(condition, bonus, condType as StringBonus);
		const conditionText = this.getConditionAltern(condition, condType as StringBonus, bonus.amount);
		const phase = this.getPhase(condition);
		const where = this.getWhere(condition);
		const validity = this.getValidity(condition?.seasons);
		const result = `${bonus.type !== 'custom' ? progress : ''}${conditionText}${phase}${where}${validity}`;
		return {
			description: result,
			progress: progress,
			type: this.translate.instant(parseHtmlStringToText(condType))
		};
	}

	private getAmount(
		bonus,
		percentage?: boolean,
		taxes?: boolean,
		club?: Club,
		isTypeTransferContract?: boolean,
		handlePaymentFrequency?: boolean
	): string {
		const bonusAmount = handlePaymentFrequency
			? round(bonus.amount / Number(PaymentFrequency[club?.paymentFrequency || 'year']), 0)
			: bonus.amount;
		const bonusGrossAmount = handlePaymentFrequency
			? round(bonus.grossAmount / Number(PaymentFrequency[club?.paymentFrequency || 'year']), 0)
			: bonus.grossAmount;
		return bonus && !isNullOrUndefined(bonusAmount)
			? percentage
				? `${this.numberPipe.transform(bonusAmount, '1.0-2', this.translate.currentLang).toString().bold()}${'%'
						.toString()
						.bold()}`
				: `${this.currency.toString().bold()}${this.numberPipe
						.transform(
							getVirtualGross(
								{ ...bonus, amount: bonusAmount, grossAmount: bonusGrossAmount },
								taxes,
								club,
								isTypeTransferContract
							),
							'1.0-2',
							this.translate.currentLang
						)
						.toString()
						.bold()}`
			: bonus && !isNullOrUndefined(bonusGrossAmount)
			? `${this.currency.toString().bold()}${this.numberPipe
					.transform(bonusGrossAmount, '1.0-2', this.translate.currentLang)
					.toString()
					.bold()} (${this.translate.instant('admin.contracts.grossAmount')})`
			: ``;
	}

	private getSolidarity(bonus, isTypeTransferContract: boolean): string {
		return isTypeTransferContract && bonus && bonus.amount
			? ` (${
					bonus.mechanismSolidarityType === 'remove'
						? `${this.translate.instant('ofWhich')}`
						: `${this.translate.instant('inAddition')}`
			  } ${this.currency.toString().bold()}${this.numberPipe
					.transform(bonus.mechanismSolidarity || 0, '1.0-2', this.translate.currentLang)
					.toString()
					.bold()} ${this.translate.instant('profile.archive.mechanismSolidarity')})`
			: ``;
	}

	private getConditions(bonus): string {
		return `<ul class="contract-clause-ul">${(bonus?.conditions || [])
			.map(
				(condition, index) => `<li class="contract-clause-li">${this.getSingleCondition(condition, index, bonus)}</li>`
			)
			.join('')}</ul>`;
	}

	private getOptionConditions(option: TransferClause | LoanOption) {
		return `<ul class="contract-clause-ul">${(option?.conditions || [])
			.map(
				(condition, index) => `<li class="contract-clause-li">${this.getSingleCondition(condition, index, option)}</li>`
			)
			.join('')}</ul>`;
	}

	private getSingleCondition(
		condition: ContractOptionCondition,
		index: number,
		bonus: Bonus | TransferClause | LoanOption
	): string {
		const conditionText = this.getConditionText(condition, condition.type as StringBonus);
		const phase = this.getPhase(condition);
		const where = this.getWhere(condition);
		const validity = this.getValidity(condition.seasons);
		const starting = this.getStarting(condition);
		const ending = this.getEnding(condition);
		return `${conditionText}${phase}${where}${validity}${starting}${ending}${
			index < bonus.conditions.length - 1 ? ` ${bonus.conditionRelationFlag.toUpperCase()}` : ``
		}`;
	}

	private getConditionText(condition: ContractOptionCondition, type: StringBonus): string {
		let conditionTextResult = ``;
		if (condition) {
			switch (type) {
				case 'performance': {
					conditionTextResult = ` ${this.translate.instant('admin.contracts.signing.label')} ${(condition.action
						? this.translate.instant(condition.action)
						: ''
					)
						.toString()
						.bold()} ${
						condition.action === 'makes' || condition.action === 'isInTheTop'
							? (condition.count || 0).toString().bold()
							: ''
					} ${(condition.goal ? this.translate.instant(condition.goal) : '').toString().bold()}`;
					break;
				}
				case 'appearanceFee':
				case 'performanceFee': {
					conditionTextResult = ` per ${(condition.goal ? this.translate.instant(condition.goal) : '')
						.toString()
						.bold()} ${
						condition.goal === 'substituting' && condition.count2
							? ` ${this.translate.instant('admin.contracts.appFee.minCondition')} ${(condition.count2 || 0)
									.toString()
									.bold()} ${this.translate.instant('min')}`
							: ``
					}`;
					break;
				}
				case 'appearance': {
					conditionTextResult = ` ${this.translate.instant('admin.contracts.appearance.label.dialog')} ${(
						condition.count || 0
					)
						.toString()
						.bold()} ${(condition.goal ? this.translate.instant(condition.goal, { value: condition.count2 || 0 }) : '')
						.toString()
						.bold()}`;
					break;
				}
				// @ts-ignore
				case 'team':
				case 'standardTeam': {
					conditionTextResult = ` ${this.translate.instant('admin.contracts.teamBonus.label')} ${(condition.action
						? this.translate.instant(condition.action)
						: ''
					)
						.toString()
						.bold()}${
						condition.action === 'achieves'
							? `${
									condition.goal === 'wins' || condition.goal === 'points'
										? ` ${(condition.count || 0).toString().bold()}`
										: ''
							  } ${(condition.goal ? ` ${this.translate.instant(condition.goal)}` : ``).toString().bold()}`
							: ``
					}`;
					break;
				}
				case 'fee': {
					conditionTextResult = ` per ${(condition.action ? this.translate.instant(condition.action) : '')
						.toString()
						.bold()}`;
					break;
				}
				case 'signing': {
					conditionTextResult = ` ${this.translate.instant('admin.contracts.signing.label')} ${(condition.action
						? this.translate.instant(`signingOptions.${condition.action}`)
						: ''
					)
						.toString()
						.bold()}${
						condition.action === 'isSold'
							? ` ${this.translate.instant('admin.contracts.signing.sold.label')} ${
									this.currency
							  }${this.numberPipe.transform(
									condition.count || 0,
									'1.0-2',
									this.translate.currentLang
							  )} ${this.translate.instant('and')} ${this.currency}${this.numberPipe.transform(
									condition.count2 || 0,
									'1.0-2',
									this.translate.currentLang
							  )}`
							: ``
					}${
						condition.action === 'isFedMemberAtDate'
							? ` ${this.translate.instant('inDate')} ${moment(condition.membershipDate)
									.format(getMomentFormatFromStorage())
									.bold()}`
							: ``
					}`;
					break;
				}
				case 'custom': {
					conditionTextResult = condition.custom;
				}
			}
		}

		return conditionTextResult;
	}

	private getConditionAltern(condition: ContractOptionCondition, bonusType: StringBonus, bonusAmount: number): string {
		let conditionText = ``;
		if (condition) {
			switch (bonusType) {
				case 'performance': {
					conditionText = `${
						condition.action === 'makes' || condition.action === 'isInTheTop'
							? ''
							: this.translate.instant(condition.action)
					} ${condition.goal ? this.translate.instant(condition.goal) : ''}`;
					break;
				}
				case 'appearance': {
					conditionText = ` ${
						condition.goal ? this.translate.instant(condition.goal, { value: condition.count2 || 0 }) : ''
					}`;
					break;
				}
				// @ts-ignore
				case 'team':
				case 'standardTeam': {
					conditionText = ` ${(condition.action ? this.translate.instant(condition.action) : '').toString().bold()} ${
						condition.action === 'achieves'
							? `${
									condition.goal === 'wins' || condition.goal === 'points'
										? ` ${(condition.count || 0).toString()}`
										: ''
							  } ${(condition.goal ? ` ${this.translate.instant(condition.goal)}` : ``).toString()}`
							: ``
					}`;
					break;
				}
				case 'appearanceFee':
				case 'performanceFee': {
					conditionText = `<b>${this.currency}${this.numberPipe.transform(
						bonusAmount || 0,
						'1.0-2',
						this.translate.currentLang
					)}</b> per ${(condition.goal ? this.translate.instant(condition.goal) : '').toString().bold()}`;
					break;
				}
				case 'signing': {
					conditionText = `${condition.action ? this.translate.instant(`signingOptions.${condition.action}`) : ''} ${
						condition.action === 'isSold'
							? ` ${this.translate.instant('admin.contracts.signing.sold.label')} ${
									this.currency
							  }${this.numberPipe.transform(
									condition.count || 0,
									'1.0-2',
									this.translate.currentLang
							  )} ${this.translate.instant('and')} ${this.currency}${this.numberPipe.transform(
									condition.count2 || 0,
									'1.0-2',
									this.translate.currentLang
							  )}`
							: ``
					}${
						condition.action === 'isFedMemberAtDate'
							? ` ${this.translate.instant('inDate')} ${moment(condition.membershipDate)
									.format(getMomentFormatFromStorage())
									.bold()}`
							: ``
					}`;
					break;
				}
				case 'custom': {
					conditionText = condition.custom;
					break;
				}
			}
		}
		return conditionText;
	}

	private getProgressCondition(
		condition: ContractOptionCondition,
		bonus: Bonus | TeamBonus | BasicWage,
		type: StringBonus
	): string {
		if (!condition) return '';
		if (condition?.progress?.total === null) {
			// means that manual evaluation is needed
			return '';
		}

		const bonusFeeAmount = bonus.amount * condition?.progress.count || 0;

		switch (type) {
			case 'performance':
			case 'standardTeam':
			case 'appearance':
				return `<b>${condition?.progress.count || 0}</b>/<b>${
					condition?.progress.total || condition?.progress.count || 0
				}</b>`;
			case 'appearanceFee':
				return `<b>${condition.progress.count || 0} ${this.translate.instant(
					`admin.contracts.appearances.${condition.goal}`
				)}</b> (${this.currency}${this.numberPipe.transform(bonusFeeAmount, '1.0-2', this.translate.currentLang)}): `;
			case 'performanceFee':
				return `<b>${condition?.progress.count || 0} ${this.translate.instant(condition.goal)}</b> (${
					this.currency
				}${this.numberPipe.transform(bonusFeeAmount, '1.0-2', this.translate.currentLang)}): `;
			case 'signing':
				return ``;
		}
	}

	private getPhase(condition: ContractOptionCondition): string {
		if (!condition) return '';
		return condition && condition.phases && condition.phases.length
			? ` ${this.translate.instant('inThe')} ${condition.phases
					.map(x => this.translate.instant(x || ''))
					.join(', ')
					.toString()
					.bold()} ${this.translate.instant('of')}`
			: (!!condition.competitions && condition.competitions.length > 0) ||
			  (!!condition.competitions && condition.competitions.length > 0)
			? condition.action !== 'winsThe'
				? condition.action === 'isInCompList'
					? ` for`
					: ` in`
				: ``
			: ``;
	}

	private getWhere(condition: ContractOptionCondition): string {
		if (!condition) return '';
		return (condition && !!condition.competitions && condition.competitions.length > 0) ||
			(!!condition.competitions && condition.competitions.length > 0)
			? ` ${(condition.competitions || condition.competitions)
					.map((id: number | string) => {
						const competition = this.competitionsService.getCompetitionFromJson(id);
						if (competition && competition.name) {
							return competition.name;
						}
						if (this.translation[id]) return this.translation[id];
						if (this.translation[`admin.contracts.teams.${id}`]) return this.translation[`admin.contracts.teams.${id}`];
						if (this.competitions.find(({ competition }) => String(competition) === String(id))) {
							return this.competitions.find(({ competition }) => String(competition) === String(id)).name;
						}

						return ``;
					})
					.join(', ')
					.toString()
					.bold()}`
			: '';
	}

	private getValidity(seasons: string[]): string {
		return seasons
			? seasons.includes('allContract')
				? ` ${this.translate.instant('allContract').toLowerCase()}`
				: seasons && seasons.length
				? ` ${this.translate.instant('forSeasons')} ${seasons
						.map(season => this.getSeasonName(season).name)
						.join(', ')
						.toString()
						.bold()}`
				: ``
			: ``;
	}

	private getStarting(bonus): string {
		return bonus && bonus.startDate
			? `, ${this.translate.instant('admin.contracts.startFrom').toLowerCase()} ${moment(bonus.startDate)
					.format(getMomentFormatFromStorage())
					.toString()
					.bold()}`
			: ``;
	}

	private getEnding(bonus): string {
		return bonus && bonus.untilDate
			? `, ${this.translate.instant('admin.contracts.until').toLowerCase()} ${moment(bonus.untilDate)
					.format(getMomentFormatFromStorage())
					.toString()
					.bold()}`
			: ``;
	}

	private getExpiration(bonus, type?: string): string {
		return bonus && bonus.withinMode && (bonus.withinDays || bonus.within)
			? bonus.withinMode === 'date'
				? ` ${this.translate.instant('within')} ${moment(bonus.within)
						.format(getMomentFormatFromStorage())
						.toString()
						.bold()},`
				: ` ${this.translate.instant('within')} ${bonus.withinDays.toString().bold()} ${this.translate.instant(
						type !== 'options' && type !== 'fee'
							? this.translate.instant('daysAfterAchievement')
							: this.translate.instant(`daysAfterTransfer`)
				  )},`
			: '';
	}

	private getInstallments(bonus) {
		return bonus && bonus.installments && bonus.installments.length > 1
			? ` in ${bonus.installments.length.toString().bold()} ${this.translate
					.instant('notifications.installments')
					.toLowerCase()}`
			: ` in ${this.translate.instant('one').bold()} ${this.translate.instant('installment')}`;
	}

	private getExtendedInstallments(bonus) {
		return bonus && bonus.installments && bonus.installments.length > 1
			? ` ${this.getInstallments(bonus)}:
	<ul class="contract-clause-ul">${bonus.installments
		.map(
			x =>
				`<li class="contract-clause-li">${this.currency.toString().bold()}${this.numberPipe
					.transform(x.value, '1.0-2', this.translate.currentLang)
					.toString()
					.bold()} ${
					x.date
						? `${this.translate.instant('within')} ${moment(x.date).format(getMomentFormatFromStorage()).bold()}`
						: `${this.translate.instant('admin.contracts.teamBonus.inSeason')} ${this.getSeasonName(
								x.season
						  ).name.bold()}`
				}</li>`
		)
		.join('')}</ul>`
			: `${this.getInstallments(bonus)}`;
	}

	private getPrecondition(bonus, extended?: boolean) {
		const precondition = bonus?.precondition
			? bonus.precondition.date && bonus.precondition.competition?.length
				? `${this.translate.instant('onlySignedInDate')} ${moment(bonus.precondition.date)
						.format(getMomentFormatFromStorage())
						.toString()
						.bold()} ${this.translate.instant('and included in')} ${bonus.precondition.competition
						.map(
							x =>
								this.competitionsService.getCompetitionFromJson(x)?.name ||
								this.competitions.find(({ competition }) => competition === x)?.name ||
								this.translate.instant(x || '')
						)
						.toString()
						.bold()}`
				: bonus.precondition.date
				? `${this.translate.instant('onlySignedInDate')} ${moment(bonus.precondition.date)
						.format(getMomentFormatFromStorage())
						.toString()
						.bold()}`
				: bonus.precondition.competition?.length
				? `${this.translate.instant('onlyIncluded')} ${bonus.precondition.competition
						.map(x =>
							(this.competitionsService.getCompetitionFromJson(x) &&
								this.competitionsService.getCompetitionFromJson(x).name) ||
							this.competitions.find(c => c.competition === x)
								? this.competitions.find(c => c.competition === x).name
								: this.translate.instant(x || '')
						)
						.join(', ')
						.toString()
						.bold()}`
				: ``
			: ``;
		return precondition ? (extended && bonus.installments.length > 1 ? `${precondition}` : `, ${precondition}`) : ``;
	}

	private getAsset(bonus, notPeriod?: boolean): string {
		return bonus && (bonus.asset || bonus.amountAsset)
			? `${notPeriod ? `` : `. `}${this.translate.instant('costToBeConsidered')} ${this.translate
					.instant('asset')
					.bold()}`
			: `${notPeriod ? `` : `. `}${this.translate.instant('costToBeConsidered')} ${this.translate
					.instant('annual')
					.bold()}`;
	}

	private getBonusCap(bonus): string {
		return bonus && bonus.cap ? `, ${this.translate.instant('admin.contracts.bonusCap.subjected')}` : ``;
	}

	private getInFavor(team: string, agent: string): string {
		return agent
			? `, ${this.translate.instant('toFromClub', { value: agent || '' })}`
			: team
			? `, ${this.translate.instant('toFromClub', { value: team || '' })}`
			: ``;
	}

	private getSeasonName(season: string) {
		return this.seasons.find(x => x.id === season) || { name: '' };
	}

	getBuyoutText = (bonus: BuyOutClause, taxes?: boolean, club?: Club) => {
		const amount = this.getAmount(bonus, null, taxes, club, false);
		const validity = this.getBuyoutValidity(bonus);
		const window = this.getBuyoutWindow(bonus);
		const asset = this.getAsset(bonus, true);

		return `${amount}${validity}${window}.<br>${asset}.`;
	};

	private getBuyoutValidity = (bonus: BuyOutClause) => {
		return bonus.where ? ` ${this.translate.instant('admin.contracts.where').toLowerCase()} ${bonus.where.bold()}` : ``;
	};

	private getBuyoutWindow = (bonus: BuyOutClause) => {
		return bonus.from && bonus.to
			? `. ${this.translate.instant('admin.evaluation.from')} ${moment(bonus.from)
					.format(getMomentFormatFromStorage())
					.bold()} to ${moment(bonus.to).format(getMomentFormatFromStorage()).bold()}`
			: ``;
	};

	getInsuranceText = (bonus: Insurance, taxes?: boolean, club?: Club) => {
		const amount = this.getAmount(bonus, null, taxes, club, false);
		const frequency = this.getInsuranceFrequency(bonus);
		const prize = this.getPrize(bonus);
		const asset = this.getAsset(bonus, true);

		return `${amount}${frequency}${prize}<br>${asset}.`;
	};

	private getInsuranceFrequency = (bonus: Insurance) => {
		return bonus && bonus.frequency
			? ` ${this.translate.instant('admin.forecast.toPay').toLowerCase()} ${this.translate
					.instant(bonus.frequency)
					.bold()}`
			: ``;
	};

	private getPrize = bonus => {
		return bonus && bonus.prize
			? `, ${this.translate.instant('withPrize')} ${this.currency.toString().bold()}${this.numberPipe
					.transform(bonus.prize, '1.0-2', this.translate.currentLang)
					.toString()
					.bold()}.`
			: ``;
	};

	getBenefitText = (bonus: Benefit, index: number, extended?: boolean, taxes?: boolean, club?: Club) => {
		const type = this.getBenefitType(bonus, index);
		const amount = this.getAmount(bonus, null, taxes, club, false);
		const validity = this.getValidity(bonus.season);
		const notes = this.getNotes(bonus);
		const installments = extended ? this.getExtendedInstallments(bonus) : this.getInstallments(bonus);
		const asset = this.getAsset(bonus);
		let text = `• ${type}`;
		if (bonus.enabled) {
			text = `${text}${amount} ${
				bonus && bonus.season && bonus.season.length > 0
					? `${validity}`
					: `${this.translate.instant('admin.contracts.benefits.cost')}`
			}. ${notes}<br>${this.translate.instant('admin.forecast.toPay')}${installments}${asset}.`;
		}

		return text;
	};

	private getNotes = bonus => {
		return bonus.notes ? ` ${bonus.notes}.` : ``;
	};

	private getBenefitType = (bonus, index: number) => {
		return bonus.name
			? `${index < 6 ? this.translate.instant(`admin.contracts.benefits.${bonus.name}`).bold() : bonus.name.bold()}: `
			: ``;
	};

	getContributionText = (
		bonus: BasicWage,
		type: string,
		isTypeTransferContract: boolean,
		extended?: boolean,
		taxes?: boolean,
		club?: Club,
		index?: number
	) => {
		const basicWageType = this.getBasicWageType(bonus);
		const amount = this.getAmount(bonus, null, taxes, club, isTypeTransferContract || type === 'fee');
		const repeat = type !== 'fee' ? this.getRepeat(bonus) : '';
		const validity = type !== 'fee' ? this.getValidity(bonus.season) : '';
		const starting = this.getStarting(bonus);
		const ending = this.getEnding(bonus);
		const installments = extended ? this.getExtendedInstallments(bonus) : this.getInstallments(bonus);
		const asset = this.getAsset(bonus);
		return `${index}) ${basicWageType}${amount}${validity}${starting}${ending}${repeat}.<br>${this.translate.instant(
			'admin.forecast.toPay'
		)}${installments}${asset}.`;
	};

	private getBasicWageType = bonus => {
		return bonus && bonus.type ? `${this.translate.instant(`admin.contracts.${bonus.type}`).bold()}: ` : ``;
	};

	private getRepeat = bonus => {
		return bonus && bonus.season && bonus.season.length <= 1 && !bonus.season.includes('allContract')
			? ``
			: bonus && bonus.repeat
			? `, ${this.translate.instant('prepositionTo')} ${this.translate
					.instant('toRepeat')
					.bold()} ${this.translate.instant('forTheSeasons')}`
			: `, ${this.translate.instant('prepositionTo')} ${this.translate
					.instant('toDivide')
					.bold()} ${this.translate.instant('betweenSeasons')}`;
	};

	getBasicWageText = (
		bonus: BasicWage,
		type: StringBonus,
		isTypeTransferContract: boolean,
		extended?: boolean,
		taxes?: boolean,
		club?: Club,
		outward?: boolean,
		index?: number,
		transferClub?: string,
		agent?: boolean
	) => {
		const handlePaymentFrequency: boolean = !isTypeTransferContract && !!club?.paymentFrequency;
		// const basicWageType = this.getBasicWageType(bonus);
		const amount = this.getAmount(
			bonus,
			null,
			taxes,
			club,
			isTypeTransferContract || type === 'fee',
			handlePaymentFrequency
		);
		const frequency = handlePaymentFrequency ? ` per ${this.translate.instant(club?.paymentFrequency || 'year')}` : '';
		const repeat = this.getRepeat(bonus);
		const validity = this.getValidity(bonus.season);
		const installments = extended ? this.getExtendedInstallments(bonus) : this.getInstallments(bonus);
		const asset =
			type === 'valorization' && !outward ? this.getAsset(bonus, extended && bonus.installments.length > 1) : '';

		const conditions =
			bonus.conditioned && bonus.conditions
				? `, ${this.translate.instant('only')} ${this.getConditions(bonus)}`
				: `.<br>`;
		const toPay = (
			type !== 'valorization' || (type === 'valorization' && outward)
				? this.translate.instant('admin.forecast.toPay')
				: this.translate.instant('bonus.toReceive')
		).toLowerCase();
		const team = transferClub
			? ` ${this.translate.instant(outward ? 'admin.contracts.payableTo' : 'admin.squads.player.from')} ${transferClub}`
			: '';

		return `${index}) ${amount}${frequency}${validity}${repeat}${conditions}${toPay}${installments}${team}${asset}.`;
	};

	getTransferOptionText = (
		option: TransferClause,
		percentage: boolean,
		team: string,
		extended: boolean,
		taxes?: boolean,
		club?: Club,
		agent?: string,
		isTypeTransferContract?: boolean,
		index?: number
	) => {
		const amount = this.getAmount(option, percentage, taxes, club, isTypeTransferContract || !!agent);
		const solidarity = this.getSolidarity(option, true);
		const within = this.getExpiration(option, 'options');
		const installments = extended ? this.getExtendedInstallments(option) : this.getInstallments(option);
		const conditions =
			option.conditioned && option.conditions
				? `, ${this.translate.instant('only')} ${this.getOptionConditions(option)}`
				: `.<br>`;
		const inFavor = this.getInFavor(team, agent);
		const asset = this.getAsset(option);

		if (option.amount || option.grossAmount)
			return `${index}) ${amount}${solidarity}${inFavor}${conditions}${this.translate.instant(
				'admin.forecast.toPay'
			)}${within}${installments}${asset}.`;
	};

	getLoanOptionText = (
		option: LoanOption,
		team: string,
		extended: boolean,
		taxes?: boolean,
		club?: Club,
		agent?: string,
		isTypeTransferContract?: boolean,
		index?: number
	) => {
		const optionType = this.getLoanOptionType(option);
		const validity = this.getLoanOptionValidity(option);
		const amount = this.getAmount(option, null, taxes, club, isTypeTransferContract || !!agent);
		const solidarity = this.getSolidarity(option, true);
		const asset = this.getAsset(option);
		const installments = extended ? this.getExtendedInstallments(option) : this.getInstallments(option);
		const conditions =
			option.conditioned && option.conditions
				? `, ${this.translate.instant('only')} ${this.getConditions(option)}`
				: `.<br>`;
		const inFavor = this.getInFavor(team, agent);
		const counterOption = this.getCounterOption(option);

		if (option.option)
			return `${index}) ${optionType}${amount}${solidarity}${inFavor}${conditions}${counterOption}${
				validity !== ` ` ? validity : this.translate.instant('admin.forecast.toPay')
			}${installments}${asset}.`;
	};

	private getLoanOptionType = (bonus: LoanOption) => {
		return bonus.option && bonus.action
			? `${this.translate.instant(`admin.contract.option.${bonus.option}` || '').bold()} ${this.translate.instant(
					'of'
			  )} ${this.translate.instant(`admin.contract.option.${bonus.action}` || '').bold()} ${this.translate.instant(
					'setTo'
			  )} `
			: ``;
	};

	private getLoanOptionValidity = (bonus: LoanOption) => {
		return `${
			bonus.dateFrom
				? `${this.translate.instant('admin.contracts.payableFrom')} ${moment(bonus.dateFrom)
						.format(getMomentFormatFromStorage())
						.bold()}`
				: ``
		} ${
			bonus.dateTo
				? `${this.translate.instant('admin.contracts.payableTo')} ${moment(bonus.dateTo)
						.format(getMomentFormatFromStorage())
						.bold()}`
				: ``
		}`;
	};

	private getCounterOption = (option: LoanOption) => {
		return option && option.counterOption && option.counterOption.enabled && option.counterOption.amount
			? ` ${this.translate.instant('counterOption')} ${this.currency.toString().bold()}${this.numberPipe
					.transform(option.counterOption.amount, '1.0-2', this.translate.currentLang)
					.toString()
					.bold()} ${
					option.counterOption.dateFrom
						? `${this.translate.instant('admin.contracts.payableFrom').toLowerCase()} ${moment(
								option.counterOption.dateFrom
						  )
								.format(getMomentFormatFromStorage())
								.bold()}`
						: ``
			  } ${
					option.counterOption.dateTo
						? `${this.translate.instant('admin.contracts.payableTo')} ${moment(option.counterOption.dateTo)
								.format(getMomentFormatFromStorage())
								.bold()}.<br>`
						: `.<br>`
			  }`
			: ``;
	};

	getTransferFeeText = (
		contract: TransferContract,
		team: string,
		extended: boolean,
		taxes?: boolean,
		club?: Club,
		agent?: string,
		isTypeTransferContract?: boolean
	) => {
		const amount = this.getAmount(contract, null, taxes, club, isTypeTransferContract || !!agent);
		const solidarity = this.getSolidarity(contract, true);
		const within = this.getExpiration(contract, 'options');
		const installments = extended ? this.getExtendedInstallments(contract) : this.getInstallments(contract);
		const asset = this.getAsset(contract, extended && contract.installments && contract.installments.length > 1);
		const inFavor = this.getInFavor(team, agent);

		if (!isNullOrUndefined(contract.amount) || !isNullOrUndefined(contract.grossAmount))
			return `${amount}${solidarity}${inFavor}<br>${this.translate.instant(
				'admin.forecast.toPay'
			)}${within}${installments}${asset}.`;
	};
}
