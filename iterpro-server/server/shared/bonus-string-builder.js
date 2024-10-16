const moment = require('moment');
const { translate } = require('./translate-utils');
const { CURRENCY_SYMBOLS } = require('../../common/constants/commonConstants');
const { getAllCompetitions } = require('../models/thirdparty-connectors/wyscout');

const PaymentFrequency = {
	year: 1,
	month: 12,
	week: 52
};

module.exports = {
	getBonusText: (bonus, isTransfer, teamInFavor, extended, taxes, club, agent, index, allSeasons, language) => {
		const indexText = index !== null && index !== undefined ? `${index}) ` : '';
		const amount = getAmount(bonus, null, taxes, club, isTransfer || !!agent, false, language);
		const solidarity = getSolidarity(bonus, isTransfer, club, language);
		const conditions = getConditions(bonus, club, allSeasons, language);
		const expiration = getExpiration(bonus, bonus.type, language);
		const installments = extended
			? getExtendedInstallments(bonus, club, allSeasons, language)
			: getInstallments(bonus, language);
		const precondition = getPrecondition(bonus, extended, language);
		const asset = getAsset(bonus, false, language);
		const bonusCap = getBonusCap(bonus, language);
		const inFavor = getInFavor(teamInFavor, agent, language);
		const toPay = translate('admin.forecast.toPay', language);

		return `${indexText}${amount}${solidarity}${inFavor}${conditions}${toPay}${expiration}${installments}${precondition}${asset}${bonusCap}.`;
	},

	getBonusTextForMobile: (bonus, isTransfer, teamInFavor, extended, taxes, club, agent, allSeasons, language) => {
		const amount = getAmount(bonus, null, taxes, club, isTransfer || !!agent, false, language);
		const solidarity = getSolidarity(bonus, isTransfer, club, language);
		const inFavor = getInFavor(teamInFavor, agent, language);
		const conditions = getConditionsString(bonus, club, allSeasons, language);
		const toPay = translate('admin.forecast.toPay', language);
		const expiration = getExpiration(bonus, bonus.type, language);
		const installments = getInstallments(bonus, language);
		const precondition = getPrecondition(bonus, extended, language);
		const asset = getAsset(bonus, false, language);
		const bonusCap = getBonusCap(bonus, language);

		const message = `${amount}${solidarity}${inFavor}, ${conditions}. ${toPay}${expiration}${installments}${precondition}${asset}${bonusCap}.`;
		return message;
	},

	getSingleConditionSimplified: (condition, bonus, club, allSeasons, language) => {
		const condType = bonus.type === 'valorization' ? condition.type : bonus.type;
		const progress = getProgressCondition(condition, bonus, condType, club, language);
		const conditionText = getConditionAltern(condition, condType, bonus.amount, club, language);
		const phase = getPhase(condition, language);
		const where = getWhere(condition, language);
		const validity = getValidity(condition.seasons, allSeasons, language);
		const result = `${bonus.type !== 'custom' ? progress : ''}${conditionText}${phase}${where}${validity}`;
		return {
			description: result,
			progress: progress,
			type: translate(condType, language)
		};
	}
};

function getAmount(bonus, percentage, taxes, club, transfer, handlePaymentFrequency, language) {
	const bonusAmount = handlePaymentFrequency
		? Math.round(bonus.amount / Number(PaymentFrequency[club?.paymentFrequency || 'year']), 0)
		: bonus.amount;
	const bonusGrossAmount = handlePaymentFrequency
		? Math.round(bonus.grossAmount / Number(PaymentFrequency[club?.paymentFrequency || 'year']), 0)
		: bonus.grossAmount;
	return bonus && !isNullOrUndefined(bonusAmount)
		? percentage
			? `${getBold(toLocaleString(bonusAmount, language).toString())}${getBold('%'.toString())}`
			: `${getBold(getCurrency(club))}${getBold(
					toLocaleString(
						getVirtualGross({ ...bonus, amount: bonusAmount, grossAmount: bonusGrossAmount }, taxes, club, transfer),
						language
					).toString()
			  )}`
		: bonus && !isNullOrUndefined(bonusGrossAmount)
		? `${getBold(getCurrency(club))}${getBold(toLocaleString(bonusGrossAmount, language).toString())} (${translate(
				'admin.contracts.grossAmount',
				language
		  )})`
		: ``;
}

function getSolidarity(bonus, transfer, club, language) {
	return transfer && bonus && bonus.amount
		? ` (${
				bonus.mechanismSolidarityType === 'remove'
					? `${translate('ofWhich', language)}`
					: `${translate('inAddition', language)}`
		  } ${getBold(getCurrency(club))}${getBold(
				toLocaleString(bonus.mechanismSolidarity || 0, language).toString()
		  )} ${translate('profile.archive.mechanismSolidarity', language)})`
		: ``;
}

function getConditions(bonus, club, allSeasons, language) {
	return `<ul class="contract-clause-ul">${(bonus?.conditions || [])
		.map(
			(condition, index) =>
				`<li class="contract-clause-li">${getSingleCondition(condition, index, bonus, club, allSeasons, language)}</li>`
		)
		.join('')}</ul>`;
}

function getConditionsString(bonus, club, allSeasons, language) {
	return `${(bonus?.conditions || [])
		.map((condition, index) => `${getSingleCondition(condition, index, bonus, club, allSeasons, language)}`)
		.join('')}`;
}

function getSingleCondition(condition, index, bonus, club, allSeasons, language) {
	const conditionText = getCondition(condition, bonus.type, club, language);
	const phase = getPhase(condition, language);
	const where = getWhere(condition);
	const validity = getValidity(condition.seasons, allSeasons, language);
	const starting = getStarting(condition, language);
	const ending = getEnding(condition, language);
	return `${conditionText}${phase}${where}${validity}${starting}${ending}${
		index < bonus.conditions.length - 1 ? ` ${bonus.conditionRelationFlag.toUpperCase()}` : ``
	}`;
}

function getCondition(condition, type, club, language) {
	let conditionTextResult = ``;
	if (condition) {
		switch (type) {
			case 'performance': {
				conditionTextResult = ` ${translate('admin.contracts.signing.label', language)} ${getBold(
					(condition.action ? translate(condition.action, language) : '').toString()
				)} ${
					condition.action === 'makes' || condition.action === 'isInTheTop'
						? getBold((condition.count || 0).toString())
						: ''
				} ${getBold((condition.goal ? translate(condition.goal, language) : '').toString())}`;
				break;
			}
			case 'appearanceFee':
			case 'performanceFee': {
				conditionTextResult = ` per ${getBold(
					(condition.goal ? translate(condition.goal, language) : '').toString()
				)} ${
					condition.goal === 'substituting' && condition.count2
						? ` ${translate('admin.contracts.appFee.minCondition', language)} ${getBold(
								(condition.count2 || 0).toString()
						  )} ${translate('min', language)}`
						: ``
				}`;
				break;
			}
			case 'appearance': {
				conditionTextResult = ` ${translate('admin.contracts.appearance.label.dialog', language)} ${getBold(
					(condition.count || 0).toString()
				)} ${getBold(
					(condition.goal ? translate(condition.goal, language, { value: condition.count2 || 0 }) : '').toString()
				)}`;
				break;
			}
			// @ts-ignore
			case 'team':
			case 'standardTeam': {
				conditionTextResult = ` ${translate('admin.contracts.teamBonus.label', language)} ${getBold(
					(condition.action ? translate(condition.action, language) : '').toString()
				)}${
					condition.action === 'achieves'
						? `${
								condition.goal === 'wins' || condition.goal === 'points' ? ` ${getBold(condition.count || 0)}` : ''
						  } ${getBold(condition.goal ? ` ${translate(condition.goal, language)}` : ``)}`
						: ``
				}`;
				break;
			}
			case 'fee': {
				conditionTextResult = ` per ${getBold(
					(condition.action ? translate(condition.action, language) : '').toString()
				)}`;
				break;
			}
			case 'signing': {
				conditionTextResult = ` ${translate('admin.contracts.signing.label', language)} ${getBold(
					(condition.action ? translate(`signingOptions.${condition.action}`, language) : '').toString()
				)}${
					condition.action === 'isSold'
						? ` ${translate('admin.contracts.signing.sold.label', language)} ${getCurrency(club)}${toLocaleString(
								condition.count || 0,
								language
						  )} ${translate('and', language)} ${getCurrency(club)}${toLocaleString(condition.count2 || 0, language)}`
						: ``
				}${
					condition.action === 'isFedMemberAtDate'
						? ` ${translate('inDate', language)} ${getBold(
								moment(condition.membershipDate).format(getMomentFormatFromStorage())
						  )}`
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

function getPhase(condition, language) {
	return condition && condition.phases && condition.phases.length
		? ` ${translate('inThe', language)} ${getBold(
				condition.phases
					.map(x => translate(x || '', language))
					.join(', ')
					.toString()
		  )} ${translate('of', language)}`
		: (!!condition.competitions && condition.competitions.length > 0) ||
		  (!!condition.competitions && condition.competitions.length > 0)
		? condition.action !== 'winsThe'
			? condition.action === 'isInCompList'
				? ` for`
				: ` in`
			: ``
		: ``;
}

function getWhere(condition, language) {
	return condition && !!condition.competitions && condition.competitions.length > 0
		? ` ${getBold(
				(condition.competitions || [])
					.map(id => {
						if (getCompetition(id, [], language)) return getCompetition(id, [], language);
						else if (translate(`admin.contracts.teams.${id}`, language))
							return translate(`admin.contracts.teams.${id}`, language);
						else return ``;
					})
					.join(', ')
					.toString()
		  )}`
		: '';
}

function getValidity(seasons, allSeasons, language) {
	return seasons?.length > 0
		? seasons.includes('allContract')
			? ` ${translate('allContract', language).toLowerCase()}`
			: allSeasons?.length > 0
			? ` ${translate('forSeasons', language)} ${getBold(
					seasons
						.map(season => getSeasonName(allSeasons, season)?.name)
						.join(', ')
						.toString()
			  )}`
			: ``
		: ``;
}

function getStarting(bonus, language) {
	return bonus && bonus.startDate
		? `, ${translate('admin.contracts.startFrom', language).toLowerCase()} ${getBold(
				moment(bonus.startDate).format(getMomentFormatFromStorage()).toString()
		  )}`
		: ``;
}

function getEnding(bonus, language) {
	return bonus && bonus.untilDate
		? `, ${translate('admin.contracts.until', language).toLowerCase()} ${getBold(
				moment(bonus.untilDate).format(getMomentFormatFromStorage()).toString()
		  )}`
		: ``;
}

function getExpiration(bonus, type, language) {
	return bonus && bonus.withinMode && (bonus.withinDays || bonus.within)
		? bonus.withinMode === 'date'
			? ` ${translate('within', language)} ${getBold(
					moment(bonus.within).format(getMomentFormatFromStorage()).toString()
			  )},`
			: ` ${translate('within', language)} ${getBold(bonus.withinDays.toString())} ${translate(
					type !== 'options' && type !== 'fee' && type !== 'appearanceFee' && type !== 'performanceFee'
						? translate('daysAfterAchievement', language)
						: translate(`daysAfterTransfer`, language),
					language
			  )},`
		: '';
}

function getInstallments(bonus, language) {
	return bonus && bonus.installments && bonus.installments.length > 1
		? ` in ${getBold(bonus.installments.length.toString())} ${translate(
				'notifications.installments',
				language
		  ).toLowerCase()}`
		: ` in ${getBold(translate('one', language))} ${translate('installment', language)}`;
}

function getExtendedInstallments(bonus, club, allSeasons, language) {
	return bonus && bonus.installments && bonus.installments.length > 1
		? ` ${getInstallments(bonus, language)}:
	<ul class="contract-clause-ul">${bonus.installments
		.map(
			installment =>
				`<li class="contract-clause-li">${getBold(getCurrency(club))}${getBold(
					toLocaleString(installment.value, language).toString()
				)} ${
					installment.date
						? `${translate('within', language)} ${getBold(
								moment(installment.date).format(getMomentFormatFromStorage())
						  )}`
						: `${translate('admin.contracts.teamBonus.inSeason', language)} ${getBold(
								getSeasonName(allSeasons, installment.season).name
						  )}`
				}</li>`
		)
		.join('')}</ul>`
		: `${getInstallments(bonus, language)}`;
}

function getPrecondition(bonus, extended, language) {
	const precondition = bonus?.precondition
		? bonus.precondition.date && bonus.precondition.competition?.length
			? `${translate('onlySignedInDate', language)} ${getBold(
					moment(bonus.precondition.date).format(getMomentFormatFromStorage()).toString()
			  )} ${translate('and included in', language)} ${getBold(
					bonus.precondition.competition.map(id => getCompetition(id, [], language)).toString()
			  )}`
			: bonus.precondition.date
			? `${translate('onlySignedInDate', language)} ${getBold(
					moment(bonus.precondition.date).format(getMomentFormatFromStorage()).toString()
			  )}`
			: bonus.precondition.competition?.length
			? `${translate('onlyIncluded', language)} ${getBold(
					bonus.precondition.competition
						.map(id => getCompetition(id, [], language))
						.join(', ')
						.toString()
			  )}`
			: ``
		: ``;
	return precondition ? (extended && bonus.installments.length > 1 ? `${precondition}` : `, ${precondition}`) : ``;
}

function getAsset(bonus, notPeriod, language) {
	return bonus && (bonus.asset || bonus.amountAsset)
		? `${notPeriod ? `` : `. `}${translate('costToBeConsidered', language)} ${getBold(translate('asset', language))}`
		: `${notPeriod ? `` : `. `}${translate('costToBeConsidered', language)} ${getBold(translate('annual', language))}`;
}

function getBonusCap(bonus, language) {
	return bonus && bonus.cap ? `, ${translate('admin.contracts.bonusCap.subjected', language)}` : ``;
}

function getInFavor(team, agent, language) {
	return agent
		? `, ${translate('toFromClub', language, { value: agent || '' })}`
		: team
		? `, ${translate('toFromClub', language, { value: team || '' })}`
		: ``;
}

function isNullOrUndefined(value) {
	return value === null || value === undefined || isNaN(value);
}

function getVirtualGross(bonus, taxes, club, transfer) {
	if (!bonus.amount) return 0;
	else if (!taxes) return bonus.amount;
	else if (!transfer) return bonus.grossAmount || bonus.amount + bonus.amount * ((club.taxes || 0) / 100) || 0;
	else return bonus.grossAmount || bonus.amount + bonus.amount * ((club.vat || 0) / 100) || 0;
}

function getMomentFormatFromStorage() {
	return 'DD MMM YYYY';
}

function toLocaleString(amount, language) {
	return amount.toLocaleString(language);
}

function getBold(string) {
	return `<b>${string}</b>`;
}

function getCurrency(club) {
	const symbol = club.currency || 'EUR';
	return symbol in CURRENCY_SYMBOLS ? CURRENCY_SYMBOLS[symbol] : '€';
}

function getCompetition(competitionId, seasonCompetitions, language) {
	return (
		getThirdpartyCompetition(competitionId) ||
		getSeasonCompetition(seasonCompetitions, competitionId) ||
		translate(competitionId || '', language)
	);
}

function getThirdpartyCompetition(competitionId) {
	if (!competitionId) return null;
	const allCompetitions = getAllCompetitions() || [];
	const found = allCompetitions.find(({ wyId }) => String(wyId) === String(competitionId));
	return found?.name;
}

function getSeasonCompetition(seasonCompetitions, competitionId) {
	const found = seasonCompetitions.find(({ competition }) => String(competition) === String(competitionId));
	return found?.name;
}

function getSeasonName(allSeasons, seasonId) {
	return allSeasons.find(({ id }) => String(id) === String(seasonId)) || { name: '' };
}

function getProgressCondition(condition, bonus, type, club, language) {
	if (condition.progress.total === null) {
		// means that manual evaluation is needed
		return '';
	}

	const bonusAmount = bonus.amount * condition.count || 0;

	switch (type) {
		case 'performance':
		case 'standardTeam':
		case 'appearance':
			return `<b>${condition.progress.count || 0}</b>/<b>${
				condition.progress.total || condition.progress.count || 0
			}</b>`;
		case 'appearanceFee':
			return `<b>${condition.progress.count || 0} ${translate(
				`admin.contracts.appearances.${condition.goal}`,
				language
			)}</b> (${getCurrency(club)}${toLocaleString(bonusAmount, language)}): `;
		case 'performanceFee':
			return `<b>${condition.progress.count || 0} ${translate(condition.goal, language)}</b> (${getCurrency(
				club
			)}${toLocaleString(bonusAmount, language)}): `;
		case 'signing':
			return ``;
	}
}

function getConditionAltern(condition, bonusType, bonusAmount, club, language) {
	let conditionText = ``;
	if (condition) {
		switch (bonusType) {
			case 'performance': {
				conditionText = `${
					condition.action === 'makes' || condition.action === 'isInTheTop' ? '' : translate(condition.action, language)
				} ${condition.goal ? translate(condition.goal, language) : ''}`;
				break;
			}
			case 'appearance': {
				conditionText = ` ${
					condition.goal ? translate(condition.goal, language, { value: condition.count2 || 0 }) : ''
				}`;
				break;
			}
			// @ts-ignore
			case 'team':
			case 'standardTeam': {
				conditionText = ` ${getBold((condition.action ? translate(condition.action, language) : '').toString())} ${
					condition.action === 'achieves'
						? `${
								condition.goal === 'wins' || condition.goal === 'points' ? ` ${condition.count || 0}` : ''
						  } ${(condition.goal ? translate(condition.goal, language) : '').toString()}`
						: ``
				}`;
				break;
			}
			case 'appearanceFee':
			case 'performanceFee': {
				conditionText = `<b>${getCurrency(club)}${toLocaleString(bonusAmount || 0, language)}</b> per ${(condition.goal
					? translate(condition.goal, language)
					: ''
				)
					.toString()
					.bold()}`;
				break;
			}
			case 'signing': {
				conditionText = `${condition.action ? translate(`signingOptions.${condition.action}`, language) : ''} ${
					condition.action === 'isSold'
						? ` ${translate('admin.contracts.signing.sold.label', language)} ${getCurrency(club)}${toLocaleString(
								condition.count || 0,
								language
						  )} ${translate('and', language)} ${getCurrency(club)}${toLocaleString(condition.count2 || 0, language)}`
						: ``
				}${
					condition.action === 'isFedMemberAtDate'
						? ` ${translate('inDate', language)} ${getBold(
								moment(condition.membershipDate).format(getMomentFormatFromStorage())
						  )}`
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

// function parseHtmlStringToText(html) {
// 	if (!html) return '';
// 	const doc = new DOMParser().parseFromString(html, 'text/html');
// 	return doc.body.textContent || '';
// }
