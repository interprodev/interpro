import { Injectable } from '@angular/core';
import { CustomMetric, DeviceMetricDescriptor, PlayerAttribute } from '@iterpro/shared/data-access/sdk';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { SelectItem } from 'primeng/api';
import { IterproRoute, IterproTeamModule, IterproUserPermission } from '@iterpro/shared/data-access/permissions';
const moment = extendMoment(Moment);

// TODO: find a better and more intelligent way to structure the information contained in this service

const toMillion = (value: number) => value * 1000000;
export const feeOptions = [0, 0.5, 1, 2, 5, 7, 10, 12, 15, 20, 30, 50, 80, 100, 150, 200].map(value =>
	toMillion(value)
);

export const wageOptions = [0, 0.2, 0.5, 1, 2, 5, 7, 10, 12, 15, 20, 30, 50, 80, 100, 150, 200].map(value =>
	toMillion(value)
);

export const positionLegendItems = [
	{
		label: 'profile.roles.attackingMidfielder',
		tooltip: 'profile.roles.attackingMidfielder.description'
	},
	{
		label: 'profile.roles.shadowStriker',
		tooltip: 'profile.roles.shadowStriker.description'
	},
	{
		label: 'profile.roles.enganche',
		tooltip: 'profile.roles.enganche.description'
	},
	{
		label: 'profile.roles.widePlaymaker',
		tooltip: 'profile.roles.widePlaymaker.description'
	},
	{
		label: 'profile.roles.ramdeuter',
		tooltip: 'profile.roles.ramdeuter.description'
	},
	{
		label: 'profile.roles.wideTargetMan',
		tooltip: 'profile.roles.wideTargetMan.description'
	},
	{
		label: 'profile.roles.insideForward',
		tooltip: 'profile.roles.insideForward.description'
	},
	{
		label: 'profile.roles.centralDefender',
		tooltip: 'profile.roles.centralDefender.description'
	},
	{
		label: 'profile.roles.ballPlayingDefender',
		tooltip: 'profile.roles.ballPlayingDefender.description'
	},
	{
		label: 'profile.roles.limitedDefender',
		tooltip: 'profile.roles.limitedDefender.description'
	},
	{
		label: 'profile.roles.roamingPlaymaker',
		tooltip: 'profile.roles.roamingPlaymaker.description'
	},
	// {label: "profile.roles.segundoVolante", tooltip: "profile.roles.segundoVolante.description"},
	{
		label: 'profile.roles.regista',
		tooltip: 'profile.roles.regista.description'
	},
	{
		label: 'profile.roles.defensiveMidfielder',
		tooltip: 'profile.roles.defensiveMidfielder.description'
	},
	{
		label: 'profile.roles.halfBack',
		tooltip: 'profile.roles.halfBack.description'
	},
	{
		label: 'profile.roles.ballWinningMidfielder',
		tooltip: 'profile.roles.ballWinningMidfielder.description'
	},
	{
		label: 'profile.roles.anchorMan',
		tooltip: 'profile.roles.anchorMan.description'
	},
	{
		label: 'profile.roles.goalkeeper',
		tooltip: 'profile.roles.goalkeeper.description'
	},
	{
		label: 'profile.roles.sweeperKeeper',
		tooltip: 'profile.roles.sweeperKeeper.description'
	},
	{
		label: 'profile.roles.wingBack',
		tooltip: 'profile.roles.wingBack.description'
	},
	{
		label: 'profile.roles.fullBack',
		tooltip: 'profile.roles.fullBack.description'
	},
	{
		label: 'profile.roles.completeWingBack',
		tooltip: 'profile.roles.completeWingBack.description'
	},
	// {label: "profile.roles.defensiveFullBack", tooltip: "profile.roles.defensiveFullBack.description"},
	{
		label: 'profile.roles.invertedWingBack',
		tooltip: 'profile.roles.invertedWingBack.description'
	},
	{
		label: 'profile.roles.limitedFullBack',
		tooltip: 'profile.roles.limitedFullBack.description'
	},
	{
		label: 'profile.roles.deepLyingPlamaker',
		tooltip: 'profile.roles.deepLyingPlamaker.description'
	},
	{
		label: 'profile.roles.advancedPlaymaker',
		tooltip: 'profile.roles.advancedPlaymaker.description'
	},
	// {label: "profile.roles.carrilero", tooltip: "profile.roles.carrilero.description"},
	{
		label: 'profile.roles.centralMidfielder',
		tooltip: 'profile.roles.centralMidfielder.description'
	},
	{
		label: 'profile.roles.boxToBoxMidfielder',
		tooltip: 'profile.roles.boxToBoxMidfielder.description'
	},
	// {label: "profile.roles.mezzala", tooltip: "profile.roles.mezzala.description"},
	{
		label: 'profile.roles.completeForward',
		tooltip: 'profile.roles.completeForward.description'
	},
	{
		label: 'profile.roles.advancedForward',
		tooltip: 'profile.roles.advancedForward.description'
	},
	{
		label: 'profile.roles.falseNine',
		tooltip: 'profile.roles.falseNine.description'
	},
	{
		label: 'profile.roles.poacher',
		tooltip: 'profile.roles.poacher.description'
	},
	{
		label: 'profile.roles.deepLyingForward',
		tooltip: 'profile.roles.deepLyingForward.description'
	},
	{
		label: 'profile.roles.defensiveForward',
		tooltip: 'profile.roles.defensiveForward.description'
	},
	{
		label: 'profile.roles.targetMan',
		tooltip: 'profile.roles.targetMan.description'
	},
	{
		label: 'profile.roles.wideMidfielder',
		tooltip: 'profile.roles.wideMidfielder.description'
	},
	{
		label: 'profile.roles.defensiveWinger',
		tooltip: 'profile.roles.defensiveWinger.description'
	},
	{
		label: 'profile.roles.winger',
		tooltip: 'profile.roles.winger.description'
	},
	// {label: "profile.roles.invertedWinger", tooltip: "profile.roles.invertedWinger.description"},
	{
		label: 'profile.roles.trequartista',
		tooltip: 'profile.roles.trequartista.description'
	}
];

export const preferredLegendItems = [
	{
		label: 'profile.preferredMoves.cutsInside',
		tooltip: 'profile.preferredMoves.cutsInside.description'
	},
	{
		label: 'profile.preferredMoves.knocksBallPastOpponent',
		tooltip: 'profile.preferredMoves.knocksBallPastOpponent.description'
	},
	{
		label: 'profile.preferredMoves.runsWithBallRarely',
		tooltip: 'profile.preferredMoves.runsWithBallRarely.description'
	},
	{
		label: 'profile.preferredMoves.runsWithBallOften',
		tooltip: 'profile.preferredMoves.runsWithBallOften.description'
	},
	{
		label: 'profile.preferredMoves.runsWithBallDownLeft',
		tooltip: 'profile.preferredMoves.runsWithBallDownLeft.description'
	},
	{
		label: 'profile.preferredMoves.runsWithBallDownRight',
		tooltip: 'profile.preferredMoves.runsWithBallDownRight.description'
	},
	{
		label: 'profile.preferredMoves.runsWithBallThroughCentre',
		tooltip: 'profile.preferredMoves.runsWithBallThroughCentre.description'
	},
	{
		label: 'profile.preferredMoves.stopsPlay',
		tooltip: 'profile.preferredMoves.stopsPlay.description'
	},
	{
		label: 'profile.preferredMoves.arrivesLateInOpponentsArea',
		tooltip: 'profile.preferredMoves.arrivesLateInOpponentsArea.description'
	},
	{
		label: 'profile.preferredMoves.comesDeepToGetBall',
		tooltip: 'profile.preferredMoves.comesDeepToGetBall.description'
	},
	{
		label: 'profile.preferredMoves.getsForwardWheneverPossible',
		tooltip: 'profile.preferredMoves.getsForwardWheneverPossible.description'
	},
	{
		label: 'profile.preferredMoves.getsIntoOppositionArea',
		tooltip: 'profile.preferredMoves.getsIntoOppositionArea.description'
	},
	{
		label: 'profile.preferredMoves.hugsLine',
		tooltip: 'profile.preferredMoves.hugsLine.description'
	},
	{
		label: 'profile.preferredMoves.LikesToTryToBeatOffsideTrap',
		tooltip: 'profile.preferredMoves.LikesToTryToBeatOffsideTrap.description'
	},
	{
		label: 'profile.preferredMoves.movesIntoChannels',
		tooltip: 'profile.preferredMoves.movesIntoChannels.description'
	},
	{
		label: 'profile.preferredMoves.penalityBoxPlayer',
		tooltip: 'profile.preferredMoves.penalityBoxPlayer.description'
	},
	{
		label: 'profile.preferredMoves.playsOneTwos',
		tooltip: 'profile.preferredMoves.playsOneTwos.description'
	},
	{
		label: 'profile.preferredMoves.playsWithBackToGoal',
		tooltip: 'profile.preferredMoves.playsWithBackToGoal.description'
	},
	{
		label: 'profile.preferredMoves.staysBackAtAllTimes',
		tooltip: 'profile.preferredMoves.staysBackAtAllTimes.description'
	},
	{
		label: 'profile.preferredMoves.dictatesTempo',
		tooltip: 'profile.preferredMoves.dictatesTempo.description'
	},
	{
		label: 'profile.preferredMoves.likesToSwitchBallToOtherFlank',
		tooltip: 'profile.preferredMoves.likesToSwitchBallToOtherFlank.description'
	},
	{
		label: 'profile.preferredMoves.looksForPassRatherThanAttemptingToScore',
		tooltip: 'profile.preferredMoves.looksForPassRatherThanAttemptingToScore.description'
	},
	{
		label: 'profile.preferredMoves.playsNoThroughBalls',
		tooltip: 'profile.preferredMoves.playsNoThroughBalls.description'
	},
	{
		label: 'profile.preferredMoves.playsShortSimplePasses',
		tooltip: 'profile.preferredMoves.playsShortSimplePasses.description'
	},
	{
		label: 'profile.preferredMoves.triesKillerBallsOften',
		tooltip: 'profile.preferredMoves.triesKillerBallsOften.description'
	},
	{
		label: 'profile.preferredMoves.triesLongRangePasses',
		tooltip: 'profile.preferredMoves.triesLongRangePasses.description'
	},
	{
		label: 'profile.preferredMoves.useLongThrowToStartCounterAttacks',
		tooltip: 'profile.preferredMoves.useLongThrowToStartCounterAttacks.description'
	},
	{
		label: 'profile.preferredMoves.attemptsOverheadKicks',
		tooltip: 'profile.preferredMoves.attemptsOverheadKicks.description'
	},
	{
		label: 'profile.preferredMoves.hitsFreeKicksWithPower',
		tooltip: 'profile.preferredMoves.hitsFreeKicksWithPower.description'
	},
	{
		label: 'profile.preferredMoves.likesToLobKeeper',
		tooltip: 'profile.preferredMoves.likesToLobKeeper.description'
	},
	{
		label: 'profile.preferredMoves.likesToRoundKeeper',
		tooltip: 'profile.preferredMoves.likesToRoundKeeper.description'
	},
	{
		label: 'profile.preferredMoves.placesShots',
		tooltip: 'profile.preferredMoves.placesShots.description'
	},
	{
		label: 'profile.preferredMoves.refrainsFromTakingLongShots',
		tooltip: 'profile.preferredMoves.refrainsFromTakingLongShots.description'
	},
	{
		label: 'profile.preferredMoves.shootsFromDistance',
		tooltip: 'profile.preferredMoves.shootsFromDistance.description'
	},
	{
		label: 'profile.preferredMoves.shootsWithPower',
		tooltip: 'profile.preferredMoves.shootsWithPower.description'
	},
	{
		label: 'profile.preferredMoves.triesFirstTimeShots',
		tooltip: 'profile.preferredMoves.triesFirstTimeShots.description'
	},
	{
		label: 'profile.preferredMoves.triesLongRangeFreeKicks',
		tooltip: 'profile.preferredMoves.triesLongRangeFreeKicks.description'
	},
	{
		label: 'profile.preferredMoves.divesIntoTackles',
		tooltip: 'profile.preferredMoves.divesIntoTackles.description'
	},
	{
		label: 'profile.preferredMoves.doesNotDiveIntoTackles',
		tooltip: 'profile.preferredMoves.doesNotDiveIntoTackles.description'
	},
	{
		label: 'profile.preferredMoves.marksOpponentTightly',
		tooltip: 'profile.preferredMoves.marksOpponentTightly.description'
	},
	{
		label: 'profile.preferredMoves.attemptsToDevelopWeakerFoot',
		tooltip: 'profile.preferredMoves.attemptsToDevelopWeakerFoot.description'
	},
	{
		label: 'profile.preferredMoves.avoidsUsingWeakerFoot',
		tooltip: 'profile.preferredMoves.avoidsUsingWeakerFoot.description'
	},
	{
		label: 'profile.preferredMoves.curlsBall',
		tooltip: 'profile.preferredMoves.curlsBall.description'
	},
	{
		label: 'profile.preferredMoves.dwellsOnBall',
		tooltip: 'profile.preferredMoves.dwellsOnBall.description'
	},
	{
		label: 'profile.preferredMoves.possessesLongFlatThrow',
		tooltip: 'profile.preferredMoves.possessesLongFlatThrow.description'
	},
	{
		label: 'profile.preferredMoves.triesToPlayWayOutOfTrouble',
		tooltip: 'profile.preferredMoves.triesToPlayWayOutOfTrouble.description'
	}
];

export const LANDING_PAGES: { label: string; value: IterproRoute; userPermission?: IterproUserPermission, teamModules?: IterproTeamModule[] }[] = [
	{ label: 'Medical Maintenance', value: '/medical/maintenance', userPermission: 'medical', teamModules: ['medical', 'maintenance'] },
	{ label: 'My Team', value: '/players/my-team', userPermission: 'players', teamModules: ['players', 'my-team'] },
	{ label: 'Scouting', value: '/players/scouting', userPermission: 'scouting', teamModules: ['players', 'scouting'] },
	{ label: 'Standings', value: '/dashboards/standings', teamModules: ['dashboards', 'standings'] },
	{ label: 'User Profile', value: '/settings', userPermission: 'settings' }
];

export const competitionsList: SelectItem[] = [
	{ label: 'competitions.FIFAWorldCup', value: 'FIFAWorldCup' },
	{ label: 'competitions.FIFAWomenWorldCup', value: 'FIFAWomenWorldCup' },
	{
		label: 'competitions.FIFAConfederationsCup',
		value: 'FIFAConfederationsCup'
	},
	{
		label: 'competitions.UEFAEuropeanFootballChampionship',
		value: 'UEFAEuropeanFootballChampionship'
	},
	{
		label: 'competitions.UEFAWomenChampionship',
		value: 'UEFAWomenChampionship'
	},
	{ label: 'competitions.UEFANationsLeague', value: 'UEFANationsLeague' },
	{ label: 'competitions.CAFAfricaCupNations', value: 'CAFAfricaCupNations' },
	{
		label: 'competitions.CAFAfricanNationsChampionship',
		value: 'CAFAfricanNationsChampionship'
	},
	{ label: 'competitions.CONMEBOLCopaAmerica', value: 'CONMEBOLCopaAmerica' },
	{
		label: 'competitions.CONMEBOLSuperclásicoAmericas',
		value: 'CONMEBOLSuperclásicoAmericas'
	},
	{
		label: 'competitions.CONMEBOLCopaAmericaFemenina',
		value: 'CONMEBOLCopaAmericaFemenina'
	},
	{ label: 'competitions.CONCACAFGoldCup', value: 'CONCACAFGoldCup' },
	{ label: 'competitions.CONCACAFCup', value: 'CONCACAFCup' },
	{
		label: 'competitions.CONCACAFNationsLeague',
		value: 'CONCACAFNationsLeague'
	},
	{ label: 'competitions.CONCACAFWomenGoldCup', value: 'CONCACAFWomenGoldCup' },
	{ label: 'competitions.AFCAsianCup', value: 'AFCAsianCup' },
	{ label: 'competitions.AFCWomenAsianCup', value: 'AFCWomenAsianCup' },
	{ label: 'competitions.OFCNationsCup', value: 'OFCNationsCup' },
	{ label: 'competitions.OFCWomenNationsCup', value: 'OFCWomenNationsCup' },
	{ label: 'competitions.FIFAClubWorldCup', value: 'FIFAClubWorldCup' },
	{ label: 'competitions.UEFAChampionsLeague', value: 'UEFAChampionsLeague' },
	{
		label: 'competitions.UEFAWomenChampionsLeague',
		value: 'UEFAWomenChampionsLeague'
	},
	{ label: 'competitions.UEFAEuropaLeague', value: 'UEFAEuropaLeague' },
	{ label: 'competitions.UEFASuperCup', value: 'UEFASuperCup' },
	{ label: 'competitions.CAFChampionsLeague', value: 'CAFChampionsLeague' },
	{ label: 'competitions.CAFConfederationCup', value: 'CAFConfederationCup' },
	{ label: 'competitions.CAFSuperCup', value: 'CAFSuperCup' },
	{
		label: 'competitions.CONMEBOLCopaLibertadores',
		value: 'CONMEBOLCopaLibertadores'
	},
	{
		label: 'competitions.CONMEBOLCopaSudamericana',
		value: 'CONMEBOLCopaSudamericana'
	},
	{
		label: 'competitions.CONMEBOLRecopaSudamericana',
		value: 'CONMEBOLRecopaSudamericana'
	},
	{
		label: 'competitions.CONMEBOLCopaLibertadoresFemenino',
		value: 'CONMEBOLCopaLibertadoresFemenino'
	},
	{
		label: 'competitions.CONCACAFChampionsLeague',
		value: 'CONCACAFChampionsLeague'
	},
	{ label: 'competitions.CONCACAFLeague', value: 'CONCACAFLeague' },
	{ label: 'competitions.AFCChampionsLeague', value: 'AFCChampionsLeague' },
	{ label: 'competitions.AFCCup', value: 'AFCCup' },
	{ label: 'competitions.OFCChampionsLeague', value: 'OFCChampionsLeague' }
];

export const currencies: SelectItem<CurrencyType>[] = [
	{ label: 'EUR', value: 'EUR' },
	{ label: 'BGN', value: 'BGN' },
	{ label: 'NZD', value: 'NZD' },
	{ label: 'ILS', value: 'ILS' },
	{ label: 'RUB', value: 'RUB' },
	{ label: 'CAD', value: 'CAD' },
	{ label: 'USD', value: 'USD' },
	{ label: 'PHP', value: 'PHP' },
	{ label: 'CHF', value: 'CHF' },
	{ label: 'ZAR', value: 'ZAR' },
	{ label: 'AUD', value: 'AUD' },
	{ label: 'JPY', value: 'JPY' },
	{ label: 'TRY', value: 'TRY' },
	{ label: 'HKD', value: 'HKD' },
	{ label: 'MYR', value: 'MYR' },
	{ label: 'THB', value: 'THB' },
	{ label: 'HRK', value: 'HRK' },
	{ label: 'NOK', value: 'NOK' },
	{ label: 'IDR', value: 'IDR' },
	{ label: 'DKK', value: 'DKK' },
	{ label: 'CZK', value: 'CZK' },
	{ label: 'HUF', value: 'HUF' },
	{ label: 'GBP', value: 'GBP' },
	{ label: 'MXN', value: 'MXN' },
	{ label: 'KRW', value: 'KRW' },
	{ label: 'ISK', value: 'ISK' },
	{ label: 'SGD', value: 'SGD' },
	{ label: 'BRL', value: 'BRL' },
	{ label: 'PLN', value: 'PLN' },
	{ label: 'INR', value: 'INR' },
	{ label: 'RON', value: 'RON' },
	{ label: 'CNY', value: 'CNY' },
	{ label: 'SEK', value: 'SEK' },
	{ label: 'UAH', value: 'UAH' }
];

export type CurrencyType =
	| 'EUR'
	| 'BGN'
	| 'NZD'
	| 'ILS'
	| 'RUB'
	| 'CAD'
	| 'USD'
	| 'PHP'
	| 'CHF'
	| 'ZAR'
	| 'AUD'
	| 'JPY'
	| 'TRY'
	| 'HKD'
	| 'MYR'
	| 'THB'
	| 'HRK'
	| 'NOK'
	| 'IDR'
	| 'DKK'
	| 'CZK'
	| 'HUF'
	| 'GBP'
	| 'MXN'
	| 'KRW'
	| 'ISK'
	| 'SGD'
	| 'BRL'
	| 'PLN'
	| 'INR'
	| 'RON'
	| 'CNY'
	| 'SEK'
	| 'UAH';
export const currenciesSymbol: Record<CurrencyType, string> = {
	EUR: '€',
	BGN: 'лв',
	NZD: 'NZ$',
	ILS: '₪',
	RUB: '₽',
	CAD: 'CA$',
	USD: '$',
	PHP: '₱',
	CHF: 'CHF',
	ZAR: 'R',
	AUD: 'AU$',
	JPY: '¥',
	TRY: '₺',
	HKD: 'HK$',
	MYR: 'RM',
	THB: '฿',
	HRK: 'kn',
	NOK: 'kr',
	IDR: 'Rp',
	DKK: 'kr.',
	CZK: 'Kč',
	HUF: 'Ft',
	GBP: '£',
	MXN: '$',
	KRW: '₩',
	ISK: 'kr',
	SGD: 'S$',
	BRL: 'R$',
	PLN: 'zł',
	INR: '₹',
	RON: 'lei',
	CNY: '¥',
	SEK: 'kr',
	UAH: '₴'
} as const;

export const NATIONALITIES: SelectItem<string>[] = [
	{ label: 'nationalities.AF', value: 'AF' },
	{ label: 'nationalities.AX', value: 'AX' },
	{ label: 'nationalities.AL', value: 'AL' },
	{ label: 'nationalities.DZ', value: 'DZ' },
	{ label: 'nationalities.AS', value: 'AS' },
	{ label: 'nationalities.AD', value: 'AD' },
	{ label: 'nationalities.AO', value: 'AO' },
	{ label: 'nationalities.AI', value: 'AI' },
	{ label: 'nationalities.AG', value: 'AG' },
	{ label: 'nationalities.AR', value: 'AR' },
	{ label: 'nationalities.AM', value: 'AM' },
	{ label: 'nationalities.AW', value: 'AW' },
	{ label: 'nationalities.AU', value: 'AU' },
	{ label: 'nationalities.AT', value: 'AT' },
	{ label: 'nationalities.AZ', value: 'AZ' },
	{ label: 'nationalities.BS', value: 'BS' },
	{ label: 'nationalities.BH', value: 'BH' },
	{ label: 'nationalities.BD', value: 'BD' },
	{ label: 'nationalities.BB', value: 'BB' },
	{ label: 'nationalities.BY', value: 'BY' },
	{ label: 'nationalities.BE', value: 'BE' },
	{ label: 'nationalities.BZ', value: 'BZ' },
	{ label: 'nationalities.BJ', value: 'BJ' },
	{ label: 'nationalities.BM', value: 'BM' },
	{ label: 'nationalities.BT', value: 'BT' },
	{ label: 'nationalities.BO', value: 'BO' },
	{ label: 'nationalities.BQ', value: 'BQ' },
	{ label: 'nationalities.BA', value: 'BA' },
	{ label: 'nationalities.BW', value: 'BW' },
	{ label: 'nationalities.BR', value: 'BR' },
	{ label: 'nationalities.IO', value: 'IO' },
	{ label: 'nationalities.BN', value: 'BN' },
	{ label: 'nationalities.BG', value: 'BG' },
	{ label: 'nationalities.BF', value: 'BF' },
	{ label: 'nationalities.BI', value: 'BI' },
	{ label: 'nationalities.CV', value: 'CV' },
	{ label: 'nationalities.KH', value: 'KH' },
	{ label: 'nationalities.CM', value: 'CM' },
	{ label: 'nationalities.CA', value: 'CA' },
	{ label: 'nationalities.KY', value: 'KY' },
	{ label: 'nationalities.CF', value: 'CF' },
	{ label: 'nationalities.TD', value: 'TD' },
	{ label: 'nationalities.CL', value: 'CL' },
	{ label: 'nationalities.CN', value: 'CN' },
	{ label: 'nationalities.CX', value: 'CX' },
	{ label: 'nationalities.CC', value: 'CC' },
	{ label: 'nationalities.CO', value: 'CO' },
	{ label: 'nationalities.KM', value: 'KM' },
	{ label: 'nationalities.CK', value: 'CK' },
	{ label: 'nationalities.CR', value: 'CR' },
	{ label: 'nationalities.HR', value: 'HR' },
	{ label: 'nationalities.CU', value: 'CU' },
	{ label: 'nationalities.CW', value: 'CW' },
	{ label: 'nationalities.CY', value: 'CY' },
	{ label: 'nationalities.CZ', value: 'CZ' },
	{ label: 'nationalities.CI', value: 'CI' },
	{ label: 'nationalities.CD', value: 'CD' },
	{ label: 'nationalities.DK', value: 'DK' },
	{ label: 'nationalities.DJ', value: 'DJ' },
	{ label: 'nationalities.DM', value: 'DM' },
	{ label: 'nationalities.DO', value: 'DO' },
	{ label: 'nationalities.EC', value: 'EC' },
	{ label: 'nationalities.EG', value: 'EG' },
	{ label: 'nationalities.SV', value: 'SV' },
	{ label: 'nationalities.GB-ENG', value: 'GB-ENG' },
	{ label: 'nationalities.GQ', value: 'GQ' },
	{ label: 'nationalities.ER', value: 'ER' },
	{ label: 'nationalities.EE', value: 'EE' },
	{ label: 'nationalities.ET', value: 'ET' },
	{ label: 'nationalities.FK', value: 'FK' },
	{ label: 'nationalities.FO', value: 'FO' },
	{ label: 'nationalities.FM', value: 'FM' },
	{ label: 'nationalities.FJ', value: 'FJ' },
	{ label: 'nationalities.FI', value: 'FI' },
	{ label: 'nationalities.FR', value: 'FR' },
	{ label: 'nationalities.GF', value: 'GF' },
	{ label: 'nationalities.PF', value: 'PF' },
	{ label: 'nationalities.TF', value: 'TF' },
	{ label: 'nationalities.GA', value: 'GA' },
	{ label: 'nationalities.GM', value: 'GM' },
	{ label: 'nationalities.GE', value: 'GE' },
	{ label: 'nationalities.DE', value: 'DE' },
	{ label: 'nationalities.GH', value: 'GH' },
	{ label: 'nationalities.GI', value: 'GI' },
	{ label: 'nationalities.GR', value: 'GR' },
	{ label: 'nationalities.GL', value: 'GL' },
	{ label: 'nationalities.GD', value: 'GD' },
	{ label: 'nationalities.GP', value: 'GP' },
	{ label: 'nationalities.GU', value: 'GU' },
	{ label: 'nationalities.GT', value: 'GT' },
	{ label: 'nationalities.GG', value: 'GG' },
	{ label: 'nationalities.GN', value: 'GN' },
	{ label: 'nationalities.GW', value: 'GW' },
	{ label: 'nationalities.GY', value: 'GY' },
	{ label: 'nationalities.HT', value: 'HT' },
	{ label: 'nationalities.VA', value: 'VA' },
	{ label: 'nationalities.HN', value: 'HN' },
	{ label: 'nationalities.HK', value: 'HK' },
	{ label: 'nationalities.HU', value: 'HU' },
	{ label: 'nationalities.IS', value: 'IS' },
	{ label: 'nationalities.IN', value: 'IN' },
	{ label: 'nationalities.ID', value: 'ID' },
	{ label: 'nationalities.IR', value: 'IR' },
	{ label: 'nationalities.IQ', value: 'IQ' },
	{ label: 'nationalities.IE', value: 'IE' },
	{ label: 'nationalities.IM', value: 'IM' },
	{ label: 'nationalities.IL', value: 'IL' },
	{ label: 'nationalities.IT', value: 'IT' },
	{ label: 'nationalities.JM', value: 'JM' },
	{ label: 'nationalities.JP', value: 'JP' },
	{ label: 'nationalities.JE', value: 'JE' },
	{ label: 'nationalities.JO', value: 'JO' },
	{ label: 'nationalities.KZ', value: 'KZ' },
	{ label: 'nationalities.KE', value: 'KE' },
	{ label: 'nationalities.KI', value: 'KI' },
	{ label: 'nationalities.XK', value: 'XK' },
	{ label: 'nationalities.KW', value: 'KW' },
	{ label: 'nationalities.KG', value: 'KG' },
	{ label: 'nationalities.LA', value: 'LA' },
	{ label: 'nationalities.LV', value: 'LV' },
	{ label: 'nationalities.LB', value: 'LB' },
	{ label: 'nationalities.LS', value: 'LS' },
	{ label: 'nationalities.LR', value: 'LR' },
	{ label: 'nationalities.LY', value: 'LY' },
	{ label: 'nationalities.LI', value: 'LI' },
	{ label: 'nationalities.LT', value: 'LT' },
	{ label: 'nationalities.LU', value: 'LU' },
	{ label: 'nationalities.MO', value: 'MO' },
	{ label: 'nationalities.MG', value: 'MG' },
	{ label: 'nationalities.MW', value: 'MW' },
	{ label: 'nationalities.MY', value: 'MY' },
	{ label: 'nationalities.MV', value: 'MV' },
	{ label: 'nationalities.ML', value: 'ML' },
	{ label: 'nationalities.MT', value: 'MT' },
	{ label: 'nationalities.MH', value: 'MH' },
	{ label: 'nationalities.MQ', value: 'MQ' },
	{ label: 'nationalities.MR', value: 'MR' },
	{ label: 'nationalities.MU', value: 'MU' },
	{ label: 'nationalities.YT', value: 'YT' },
	{ label: 'nationalities.MX', value: 'MX' },
	{ label: 'nationalities.MD', value: 'MD' },
	{ label: 'nationalities.MC', value: 'MC' },
	{ label: 'nationalities.MN', value: 'MN' },
	{ label: 'nationalities.ME', value: 'ME' },
	{ label: 'nationalities.MS', value: 'MS' },
	{ label: 'nationalities.MA', value: 'MA' },
	{ label: 'nationalities.MZ', value: 'MZ' },
	{ label: 'nationalities.MM', value: 'MM' },
	{ label: 'nationalities.NA', value: 'NA' },
	{ label: 'nationalities.NR', value: 'NR' },
	{ label: 'nationalities.NP', value: 'NP' },
	{ label: 'nationalities.NL', value: 'NL' },
	{ label: 'nationalities.NC', value: 'NC' },
	{ label: 'nationalities.NZ', value: 'NZ' },
	{ label: 'nationalities.NI', value: 'NI' },
	{ label: 'nationalities.NE', value: 'NE' },
	{ label: 'nationalities.NG', value: 'NG' },
	{ label: 'nationalities.NU', value: 'NU' },
	{ label: 'nationalities.NF', value: 'NF' },
	{ label: 'nationalities.KP', value: 'KP' },
	{ label: 'nationalities.MK', value: 'MK' },
	{ label: 'nationalities.GB-NIR', value: 'GB-NIR' },
	{ label: 'nationalities.MP', value: 'MP' },
	{ label: 'nationalities.NO', value: 'NO' },
	{ label: 'nationalities.OM', value: 'OM' },
	{ label: 'nationalities.PK', value: 'PK' },
	{ label: 'nationalities.PW', value: 'PW' },
	{ label: 'nationalities.PA', value: 'PA' },
	{ label: 'nationalities.PG', value: 'PG' },
	{ label: 'nationalities.PY', value: 'PY' },
	{ label: 'nationalities.PE', value: 'PE' },
	{ label: 'nationalities.PH', value: 'PH' },
	{ label: 'nationalities.PN', value: 'PN' },
	{ label: 'nationalities.PL', value: 'PL' },
	{ label: 'nationalities.PT', value: 'PT' },
	{ label: 'nationalities.PR', value: 'PR' },
	{ label: 'nationalities.QA', value: 'QA' },
	{ label: 'nationalities.CG', value: 'CG' },
	{ label: 'nationalities.RO', value: 'RO' },
	{ label: 'nationalities.RU', value: 'RU' },
	{ label: 'nationalities.RW', value: 'RW' },
	{ label: 'nationalities.RE', value: 'RE' },
	{ label: 'nationalities.BL', value: 'BL' },
	{ label: 'nationalities.SH', value: 'SH' },
	{ label: 'nationalities.KN', value: 'KN' },
	{ label: 'nationalities.LC', value: 'LC' },
	{ label: 'nationalities.MF', value: 'MF' },
	{ label: 'nationalities.PM', value: 'PM' },
	{ label: 'nationalities.VC', value: 'VC' },
	{ label: 'nationalities.WS', value: 'WS' },
	{ label: 'nationalities.SM', value: 'SM' },
	{ label: 'nationalities.ST', value: 'ST' },
	{ label: 'nationalities.SA', value: 'SA' },
	{ label: 'nationalities.GB-SCT', value: 'GB-SCT' },
	{ label: 'nationalities.SN', value: 'SN' },
	{ label: 'nationalities.RS', value: 'RS' },
	{ label: 'nationalities.SC', value: 'SC' },
	{ label: 'nationalities.SL', value: 'SL' },
	{ label: 'nationalities.SG', value: 'SG' },
	{ label: 'nationalities.SX', value: 'SX' },
	{ label: 'nationalities.SK', value: 'SK' },
	{ label: 'nationalities.SI', value: 'SI' },
	{ label: 'nationalities.SB', value: 'SB' },
	{ label: 'nationalities.SO', value: 'SO' },
	{ label: 'nationalities.ZA', value: 'ZA' },
	{ label: 'nationalities.GS', value: 'GS' },
	{ label: 'nationalities.KR', value: 'KR' },
	{ label: 'nationalities.SS', value: 'SS' },
	{ label: 'nationalities.ES', value: 'ES' },
	{ label: 'nationalities.LK', value: 'LK' },
	{ label: 'nationalities.PS', value: 'PS' },
	{ label: 'nationalities.SD', value: 'SD' },
	{ label: 'nationalities.SR', value: 'SR' },
	{ label: 'nationalities.SJ', value: 'SJ' },
	{ label: 'nationalities.SZ', value: 'SZ' },
	{ label: 'nationalities.SE', value: 'SE' },
	{ label: 'nationalities.CH', value: 'CH' },
	{ label: 'nationalities.SY', value: 'SY' },
	{ label: 'nationalities.TW', value: 'TW' },
	{ label: 'nationalities.TJ', value: 'TJ' },
	{ label: 'nationalities.TZ', value: 'TZ' },
	{ label: 'nationalities.TH', value: 'TH' },
	{ label: 'nationalities.TL', value: 'TL' },
	{ label: 'nationalities.TG', value: 'TG' },
	{ label: 'nationalities.TK', value: 'TK' },
	{ label: 'nationalities.TO', value: 'TO' },
	{ label: 'nationalities.TT', value: 'TT' },
	{ label: 'nationalities.TN', value: 'TN' },
	{ label: 'nationalities.TR', value: 'TR' },
	{ label: 'nationalities.TM', value: 'TM' },
	{ label: 'nationalities.TC', value: 'TC' },
	{ label: 'nationalities.TV', value: 'TV' },
	{ label: 'nationalities.UG', value: 'UG' },
	{ label: 'nationalities.UA', value: 'UA' },
	{ label: 'nationalities.AE', value: 'AE' },
	{ label: 'nationalities.GB', value: 'GB' },
	{ label: 'nationalities.UM', value: 'UM' },
	{ label: 'nationalities.US', value: 'US' },
	{ label: 'nationalities.UY', value: 'UY' },
	{ label: 'nationalities.UZ', value: 'UZ' },
	{ label: 'nationalities.VU', value: 'VU' },
	{ label: 'nationalities.VE', value: 'VE' },
	{ label: 'nationalities.VN', value: 'VN' },
	{ label: 'nationalities.VG', value: 'VG' },
	{ label: 'nationalities.VI', value: 'VI' },
	{ label: 'nationalities.GB-WLS', value: 'GB-WLS' },
	{ label: 'nationalities.WF', value: 'WF' },
	{ label: 'nationalities.EH', value: 'EH' },
	{ label: 'nationalities.YE', value: 'YE' },
	{ label: 'nationalities.ZM', value: 'ZM' },
	{ label: 'nationalities.ZW', value: 'ZW' }
];

export const THEME_CONSTANTS: SelectItem[] = [
	{ label: 'drills.theme.teamTactic', value: 'teamTactic' },
	{ label: 'drills.theme.passingDrills', value: 'passingDrills' },
	{ label: 'drills.theme.gameScenario', value: 'gameScenario' },
	{ label: 'drills.theme.positionalPlay', value: 'positionalPlay' },
	{ label: 'drills.theme.skillsConditioning', value: 'skillsConditioning' },
	{ label: 'drills.theme.smallSidedGame', value: 'smallSidedGame' },
	{ label: 'prevention.treatments.sec', value: 'sec' }
];

export const tipss = [
	{
		value: 'technique',
		label: 'tipss.technique',
		custom: false,
		active: true
	},
	{
		value: 'insight',
		label: 'tipss.insight',
		custom: false,
		active: true
	},
	{
		value: 'personality',
		label: 'tipss.personality',
		custom: false,
		active: true
	},
	{
		value: 'tipss_speed',
		label: 'tipss.speed',
		custom: false,
		active: true
	},
	{
		value: 'structure',
		label: 'tipss.structure',
		custom: false,
		active: true
	}
];

export const attributes = {
	offensive: [
		{
			title: 'profile.attributes.one_to_one',
			name: 'one_to_one_att',
			tooltip: 'profile.attributes.one_to_oneAttacking.tooltip',
			category: 'offensive'
		},
		{
			title: 'profile.attributes.finishing',
			name: 'finishing',
			tooltip: 'profile.attributes.finishing.tooltip',
			category: 'offensive'
		},
		{
			title: 'profile.attributes.first_touch',
			name: 'first_touch',
			tooltip: 'profile.attributes.first_touch.tooltip',
			category: 'offensive'
		},
		{
			title: 'profile.attributes.heading',
			name: 'heading',
			tooltip: 'profile.attributes.heading.tooltip',
			category: 'offensive'
		},
		{
			title: 'profile.attributes.passing',
			name: 'passing',
			tooltip: 'profile.attributes.passing.tooltip',
			category: 'offensive'
		},
		{
			title: 'profile.attributes.long_throws',
			name: 'long_throws',
			tooltip: 'profile.attributes.long_throws.tooltip',
			category: 'offensive'
		}
	],
	defensive: [
		{
			title: 'profile.attributes.one_to_one',
			name: 'one_to_one_def',
			tooltip: 'profile.attributes.one_to_oneDefending.tooltip',
			category: 'defensive'
		},
		{
			title: 'profile.attributes.marking',
			name: 'marking',
			tooltip: 'profile.attributes.marking.tooltip',
			category: 'defensive'
		},
		{
			title: 'profile.attributes.tackling',
			name: 'tackling',
			tooltip: 'profile.attributes.tackling.tooltip',
			category: 'defensive'
		},
		{
			title: 'profile.attributes.heading',
			name: 'headings',
			tooltip: 'profile.attributes.heading.tooltip',
			category: 'defensive'
		},
		{
			title: 'profile.attributes.anticipation',
			name: 'anticipation',
			tooltip: 'profile.attributes.anticipation.tooltip',
			category: 'defensive'
		},
		{
			title: 'profile.attributes.positioning',
			name: 'positioning',
			tooltip: 'profile.attributes.positioning.tooltip',
			category: 'defensive'
		}
	],
	attitude: [
		{
			title: 'profile.attributes.determination',
			name: 'determination',
			tooltip: 'profile.attributes.determination.tooltip',
			category: 'attitude'
		},
		{
			title: 'profile.attributes.bravery',
			name: 'bravery',
			tooltip: 'profile.attributes.bravery.tooltip',
			category: 'attitude'
		},
		{
			title: 'profile.attributes.leadership',
			name: 'leadership',
			tooltip: 'profile.attributes.leadership.tooltip',
			category: 'attitude'
		},
		{
			title: 'profile.attributes.teamwork',
			name: 'teamwork',
			tooltip: 'profile.attributes.teamwork.tooltip',
			category: 'attitude'
		},
		{
			title: 'profile.attributes.concentration',
			name: 'concentration',
			tooltip: 'profile.attributes.concentration.tooltip',
			category: 'attitude'
		},
		{
			title: 'profile.attributes.flair',
			name: 'flair',
			tooltip: 'profile.attributes.flair.tooltip',
			category: 'attitude'
		}
	]
};

export const playerAttributes: PlayerAttribute[] = [
	{
		value: 'one_to_one_att',
		label: 'profile.attributes.one_to_one',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.one_to_oneAttacking.tooltip'
	},
	{
		value: 'one_to_one_def',
		label: 'profile.attributes.one_to_one',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.one_to_oneDefending.tooltip'
	},
	{
		value: 'determination',
		label: 'profile.attributes.determination',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.determination.tooltip'
	},
	{
		value: 'finishing',
		label: 'profile.attributes.finishing',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.finishing.tooltip'
	},
	{
		value: 'first_touch',
		label: 'profile.attributes.first_touch',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.first_touch.tooltip'
	},
	{
		value: 'heading',
		label: 'profile.attributes.heading',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.heading.tooltip'
	},
	{
		value: 'passing',
		label: 'profile.attributes.passing',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.passing.tooltip'
	},
	{
		value: 'long_throws',
		label: 'profile.attributes.long_throws',
		custom: false,
		active: true,
		category: 'offensive',
		description: 'profile.attributes.long_throws.tooltip'
	},
	{
		value: 'marking',
		label: 'profile.attributes.marking',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.marking.tooltip'
	},
	{
		value: 'tackling',
		label: 'profile.attributes.tackling',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.tackling.tooltip'
	},
	{
		value: 'headings',
		label: 'profile.attributes.heading',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.heading.tooltip'
	},
	{
		value: 'anticipation',
		label: 'profile.attributes.anticipation',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.anticipation.tooltip'
	},
	{
		value: 'positioning',
		label: 'profile.attributes.positioning',
		custom: false,
		active: true,
		category: 'defensive',
		description: 'profile.attributes.positioning.tooltip'
	},
	{
		value: 'bravery',
		label: 'profile.attributes.bravery',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.bravery.tooltip'
	},
	{
		value: 'leadership',
		label: 'profile.attributes.leadership',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.leadership.tooltip'
	},
	{
		value: 'teamwork',
		label: 'profile.attributes.teamwork',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.teamwork.tooltip'
	},
	{
		value: 'concentration',
		label: 'profile.attributes.concentration',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.concentration.tooltip'
	},
	{
		value: 'flair',
		label: 'profile.attributes.flair',
		custom: false,
		active: true,
		category: 'attitude',
		description: 'profile.attributes.flair.tooltip'
	},
	{
		value: 'technique',
		label: 'tipss.technique',
		custom: false,
		active: true,
		category: 'tipss'
		// description: 'profile.attributes.one_to_oneAttacking.tooltip'
	},
	{
		value: 'insight',
		label: 'tipss.insight',
		custom: false,
		active: true,
		category: 'tipss'
		// description: 'profile.attributes.one_to_oneAttacking.tooltip'
	},
	{
		value: 'personality',
		label: 'tipss.personality',
		custom: false,
		active: true,
		category: 'tipss'
		// description: 'profile.attributes.one_to_oneAttacking.tooltip'
	},
	{
		value: 'tipss_speed',
		label: 'tipss.speed',
		custom: false,
		active: true,
		category: 'tipss'
		// description: 'profile.attributes.one_to_oneAttacking.tooltip'
	},
	{
		value: 'structure',
		label: 'tipss.structure',
		custom: false,
		active: true,
		category: 'tipss'
		// des
	},
	{
		label: 'profile.attributes.quality',
		value: 'quality',
		description: 'profile.attributes.quality.tooltip',
		category: 'potential'
	},
	{
		label: 'profile.attributes.competitivity',
		value: 'competitivity',
		description: 'profile.attributes.competitivity.tooltip',
		category: 'potential'
	},
	{
		label: 'profile.attributes.character',
		value: 'character',
		description: 'profile.attributes.character.tooltip',
		category: 'potential'
	},
	{
		label: 'profile.attributes.speed',
		value: 'speed',
		description: 'profile.attributes.speed.tooltip',
		category: 'potential'
	},
	{
		label: 'profile.attributes.willpower',
		value: 'willpower',
		description: 'profile.attributes.willpower.tooltip',
		category: 'potential'
	},
	{
		label: 'profile.attributes.psychobalance',
		value: 'psychobalance',
		description: 'profile.attributes.psychobalance.tooltip',
		category: 'potential'
	},
	{
		label: 'bonus.team.result',
		value: 'prognosisScore',
		description: 'bonus.team.result',
		category: 'prognosis'
	},
	{
		label: 'description',
		value: 'prognosisDescription',
		description: 'description',
		category: 'prognosis'
	}
];

export const TACTICAL_GOALS: SelectItem[] = [
	{ label: 'drills.goal.tactical.communication', value: 'communication' },
	{ label: 'drills.goal.tactical.cornerKick', value: 'cornerKick' },
	{ label: 'drills.goal.tactical.counterAttack', value: 'counterAttack' },
	{ label: 'drills.goal.tactical.freeKick', value: 'freeKick' },
	{ label: 'drills.goal.tactical.improvisation', value: 'improvisation' },
	{ label: 'drills.goal.tactical.overlapping', value: 'overlapping' },
	{ label: 'drills.goal.tactical.penalty', value: 'penalty' },
	{
		label: 'drills.goal.tactical.spaceTimeOrientation',
		value: 'spaceTimeOrientation'
	},
	{ label: 'drills.goal.tactical.throwin', value: 'throwIn' },
	{ label: 'drills.goal.tactical.timeOfPlay', value: 'timeOfPlay' },
	{ label: 'drills.goal.tactical.transitionalPlay', value: 'transitionalPlay' },
	{ label: 'drills.goal.tactical.buildingBack', value: 'buildingBack' },
	{ label: 'drills.goal.tactical.depthSupport', value: 'depthSupport' },
	{ label: 'drills.goal.tactical.mobility', value: 'mobility' },
	{ label: 'drills.goal.tactical.finishing', value: 'finishing' },
	{ label: 'drills.goal.tactical.penetration', value: 'penetration' },
	{ label: 'drills.goal.tactical.possession', value: 'possession' },
	{ label: 'drills.goal.tactical.sideBySide', value: 'sideBySide' },
	{ label: 'drills.goal.tactical.switchingGame', value: 'switchingGame' },
	{ label: 'drills.goal.tactical.width', value: 'width' },
	{ label: 'drills.goal.tactical.balance', value: 'balance' },
	{ label: 'drills.goal.tactical.compactness', value: 'compactness' },
	{ label: 'drills.goal.tactical.controlRestraint', value: 'controlRestraint' },
	{ label: 'drills.goal.tactical.counterPressing', value: 'counterPressing' },
	{ label: 'drills.goal.tactical.delay', value: 'delay' },
	{ label: 'drills.goal.tactical.depthCover', value: 'depthCover' },
	{ label: 'drills.goal.tactical.manToManMarking', value: 'manToManMarking' },
	{ label: 'drills.goal.tactical.offside', value: 'offside' },
	{ label: 'drills.goal.tactical.pressure', value: 'pressure' },
	{ label: 'drills.goal.tactical.recovery', value: 'recovery' },
	{ label: 'drills.goal.tactical.zoneDefense', value: 'zoneDefense' },
	{
		label: 'drills.goal.tactical.attackingOrganization',
		value: 'attackingOrganization'
	},
	{
		label: 'drills.goal.tactical.attackingTransition',
		value: 'attackingTransition'
	},
	{
		label: 'drills.goal.tactical.attackingSetPieces',
		value: 'attackingSetPieces'
	},
	{
		label: 'drills.goal.tactical.defensiveOrganization',
		value: 'defensiveOrganization'
	},
	{
		label: 'drills.goal.tactical.defensiveTransition',
		value: 'defensiveTransition'
	},
	{
		label: 'drills.goal.tactical.defensiveSetPieces',
		value: 'defensiveSetPieces'
	}
];

export const PHYSICAL_GOALS: SelectItem[] = [
	{ label: 'drills.goal.physical.endurance', value: 'endurance' },
	{ label: 'drills.goal.physical.powerSpeed', value: 'powerSpeed' },
	{ label: 'drills.goal.physical.recovery', value: 'recovery' },
	{ label: 'drills.goal.physical.strength', value: 'strength' },
	{ label: 'drills.goal.physical.warmup', value: 'warm-up' }
];

export const drillsThemeMetrics: CustomMetric[] = [
	{ label: 'drills.theme.teamTactic', value: 'teamTactic', custom: false, active: false },
	{ label: 'drills.theme.passingDrills', value: 'passingDrills', custom: false, active: false },
	{ label: 'drills.theme.gameScenario', value: 'gameScenario', custom: false, active: false },
	{ label: 'drills.theme.positionalPlay', value: 'positionalPlay', custom: false, active: false },
	{ label: 'drills.theme.skillsConditioning', value: 'skillsConditioning', custom: false, active: false },
	{ label: 'drills.theme.smallSidedGame', value: 'smallSidedGame', custom: false, active: false },
	{ label: 'prevention.treatments.sec', value: 'sec', custom: false, active: false }
];

export const physicalGoalsMetrics: CustomMetric[] = [
	{ label: 'drills.goal.physical.endurance', value: 'endurance', custom: false, active: false },
	{ label: 'drills.goal.physical.powerSpeed', value: 'powerSpeed', custom: false, active: false },
	{ label: 'drills.goal.physical.recovery', value: 'recovery', custom: false, active: false },
	{ label: 'drills.goal.physical.strength', value: 'strength', custom: false, active: false },
	{ label: 'drills.goal.physical.warmup', value: 'warm-up', custom: false, active: false }
];

export const tacticalGoalsMetrics: CustomMetric[] = [
	{
		label: 'drills.goal.tactical.communication',
		value: 'communication',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.cornerKick',
		value: 'cornerKick',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.counterAttack',
		value: 'counterAttack',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.freeKick',
		value: 'freeKick',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.improvisation',
		value: 'improvisation',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.overlapping',
		value: 'overlapping',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.penalty',
		value: 'penalty',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.spaceTimeOrientation',
		value: 'spaceTimeOrientation',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.throwin',
		value: 'throwIn',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.timeOfPlay',
		value: 'timeOfPlay',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.transitionalPlay',
		value: 'transitionalPlay',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.buildingBack',
		value: 'buildingBack',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.depthSupport',
		value: 'depthSupport',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.mobility',
		value: 'mobility',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.finishing',
		value: 'finishing',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.penetration',
		value: 'penetration',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.possession',
		value: 'possession',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.sideBySide',
		value: 'sideBySide',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.switchingGame',
		value: 'switchingGame',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.width',
		value: 'width',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.balance',
		value: 'balance',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.compactness',
		value: 'compactness',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.controlRestraint',
		value: 'controlRestraint',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.counterPressing',
		value: 'counterPressing',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.delay',
		value: 'delay',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.depthCover',
		value: 'depthCover',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.manToManMarking',
		value: 'manToManMarking',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.offside',
		value: 'offside',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.pressure',
		value: 'pressure',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.recovery',
		value: 'recovery',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.zoneDefense',
		value: 'zoneDefense',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.attackingOrganization',
		value: 'attackingOrganization',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.attackingTransition',
		value: 'attackingTransition',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.attackingSetPieces',
		value: 'attackingSetPieces',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.defensiveOrganization',
		value: 'defensiveOrganization',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.defensiveTransition',
		value: 'defensiveTransition',
		custom: false,
		active: false
	},
	{
		label: 'drills.goal.tactical.defensiveSetPieces',
		value: 'defensiveSetPieces',
		custom: false,
		active: false
	}
];

export const EVENT_THEME_LIST: SelectItem[] = [
	{ label: 'event.theme.field', value: 'field' },
	{ label: 'event.theme.gym', value: 'gym' },
	{ label: 'event.theme.reconditioning', value: 'reconditioning' },
	{ label: 'event.theme.recovery', value: 'recovery' }
];

export const locations: SelectItem[] = [
	{
		label: 'none',
		value: 'none'
	},
	{
		label: 'general',
		value: 'general'
	},
	{
		label: 'medical.infirmary.details.location.headFace',
		value: 'medical.infirmary.details.location.headFace'
	},
	{
		label: 'medical.infirmary.details.location.neckCervicalSpine',
		value: 'medical.infirmary.details.location.neckCervicalSpine'
	},
	{
		label: 'medical.infirmary.details.location.shoulderR',
		value: 'medical.infirmary.details.location.shoulderR'
	},
	{
		label: 'medical.infirmary.details.location.shoulderL',
		value: 'medical.infirmary.details.location.shoulderL'
	},
	{
		label: 'medical.infirmary.details.location.armR',
		value: 'medical.infirmary.details.location.armR'
	},
	{
		label: 'medical.infirmary.details.location.armL',
		value: 'medical.infirmary.details.location.armL'
	},
	{
		label: 'medical.infirmary.details.location.elbowR',
		value: 'medical.infirmary.details.location.elbowR'
	},
	{
		label: 'medical.infirmary.details.location.elbowL',
		value: 'medical.infirmary.details.location.elbowL'
	},
	{
		label: 'medical.infirmary.details.location.forearmR',
		value: 'medical.infirmary.details.location.forearmR'
	},
	{
		label: 'medical.infirmary.details.location.forearmL',
		value: 'medical.infirmary.details.location.forearmL'
	},
	{
		label: 'medical.infirmary.details.location.wristR',
		value: 'medical.infirmary.details.location.wristR'
	},
	{
		label: 'medical.infirmary.details.location.wristL',
		value: 'medical.infirmary.details.location.wristL'
	},
	{
		label: 'medical.infirmary.details.location.handFingerThumbR',
		value: 'medical.infirmary.details.location.handFingerThumbR'
	},
	{
		label: 'medical.infirmary.details.location.handFingerThumbL',
		value: 'medical.infirmary.details.location.handFingerThumbL'
	},
	{
		label: 'medical.infirmary.details.location.sternumRibs',
		value: 'medical.infirmary.details.location.sternumRibs'
	},
	{
		label: 'medical.infirmary.details.location.upperback',
		value: 'medical.infirmary.details.location.upperback'
	},
	{
		label: 'medical.infirmary.details.location.lowerback',
		value: 'medical.infirmary.details.location.lowerback'
	},
	{
		label: 'medical.infirmary.details.location.abdomen',
		value: 'medical.infirmary.details.location.abdomen'
	},
	{
		label: 'medical.infirmary.details.location.lowerBackPelvisSacrum',
		value: 'medical.infirmary.details.location.lowerBackPelvisSacrum'
	},
	{
		label: 'medical.infirmary.details.location.thighR',
		value: 'medical.infirmary.details.location.thighR'
	},
	{
		label: 'medical.infirmary.details.location.thighL',
		value: 'medical.infirmary.details.location.thighL'
	},
	{
		label: 'medical.infirmary.details.location.hamstringR',
		value: 'medical.infirmary.details.location.hamstringR'
	},
	{
		label: 'medical.infirmary.details.location.hamstringL',
		value: 'medical.infirmary.details.location.hamstringL'
	},
	{
		label: 'medical.infirmary.details.location.kneeR',
		value: 'medical.infirmary.details.location.kneeR'
	},
	{
		label: 'medical.infirmary.details.location.kneeL',
		value: 'medical.infirmary.details.location.kneeL'
	},
	{
		label: 'medical.infirmary.details.location.shinR',
		value: 'medical.infirmary.details.location.shinR'
	},
	{
		label: 'medical.infirmary.details.location.shinL',
		value: 'medical.infirmary.details.location.shinL'
	},
	{
		label: 'medical.infirmary.details.location.lowerLegAchillesTendonR',
		value: 'medical.infirmary.details.location.lowerLegAchillesTendonR'
	},
	{
		label: 'medical.infirmary.details.location.lowerLegAchillesTendonL',
		value: 'medical.infirmary.details.location.lowerLegAchillesTendonL'
	},
	{
		label: 'medical.infirmary.details.location.ankleR',
		value: 'medical.infirmary.details.location.ankleR'
	},
	{
		label: 'medical.infirmary.details.location.ankleL',
		value: 'medical.infirmary.details.location.ankleL'
	},
	{
		label: 'medical.infirmary.details.location.footToeR',
		value: 'medical.infirmary.details.location.footToeR'
	},
	{
		label: 'medical.infirmary.details.location.footToeL',
		value: 'medical.infirmary.details.location.footToeL'
	}
];

export const types: SelectItem[] = [
	{
		label: 'medical.infirmary.details.type.fracture',
		value: 'medical.infirmary.details.type.fracture'
	},
	{
		label: 'medical.infirmary.details.type.otherBoneInjury',
		value: 'medical.infirmary.details.type.otherBoneInjury'
	},
	{
		label: 'medical.infirmary.details.type.dislocationSubluxation',
		value: 'medical.infirmary.details.type.dislocationSubluxation'
	},
	{
		label: 'medical.infirmary.details.type.sprainLigamentInjury',
		value: 'medical.infirmary.details.type.sprainLigamentInjury'
	},
	{
		label: 'medical.infirmary.details.type.meniscusCartilage',
		value: 'medical.infirmary.details.type.meniscusCartilage'
	},
	{
		label: 'medical.infirmary.details.type.muscleRuptureStrainCramps',
		value: 'medical.infirmary.details.type.muscleRuptureStrainCramps'
	},
	{
		label: 'medical.infirmary.details.type.tendonInjuryRuptureTendinosis',
		value: 'medical.infirmary.details.type.tendonInjuryRuptureTendinosis'
	},
	{
		label: 'medical.infirmary.details.type.haematomaContusionBruise',
		value: 'medical.infirmary.details.type.haematomaContusionBruise'
	},
	{
		label: 'medical.infirmary.details.type.abrasion',
		value: 'medical.infirmary.details.type.abrasion'
	},
	{
		label: 'medical.infirmary.details.type.laceration',
		value: 'medical.infirmary.details.type.laceration'
	},
	{
		label: 'medical.infirmary.details.type.concussion',
		value: 'medical.infirmary.details.type.concussion'
	},
	{
		label: 'medical.infirmary.details.type.nerveInjury',
		value: 'medical.infirmary.details.type.nerveInjury'
	},
	{
		label: 'medical.infirmary.details.type.overuseUnspecified',
		value: 'medical.infirmary.details.type.overuseUnspecified'
	},
	{
		label: 'medical.infirmary.details.type.synovitisEffusion',
		value: 'medical.infirmary.details.type.synovitisEffusion'
	},
	{
		label: 'medical.infirmary.details.type.other',
		value: 'medical.infirmary.details.type.other'
	}
];

export const injuryCategories = [
	{
		label: 'medical.infirmary.details.category.trauma',
		value: 'medical.infirmary.details.category.trauma'
	},
	{
		label: 'medical.infirmary.details.category.overuse',
		value: 'medical.infirmary.details.category.overuse'
	}
];

export const injuryIssues = [
	{
		label: 'medical.infirmary.details.issue.injury',
		value: 'medical.infirmary.details.issue.injury'
	},
	{
		label: 'medical.infirmary.details.issue.complaint',
		value: 'medical.infirmary.details.issue.complaint'
	},
	{
		label: 'medical.infirmary.details.issue.illness',
		value: 'medical.infirmary.details.issue.illness'
	}
];

export const injuryMechanism = [
	{
		label: 'medical.infirmary.details.mechanism.runningSprinting',
		value: 'medical.infirmary.details.mechanism.runningSprinting'
	},
	{
		label: 'medical.infirmary.details.mechanism.twistingTurning',
		value: 'medical.infirmary.details.mechanism.twistingTurning'
	},
	{
		label: 'medical.infirmary.details.mechanism.shooting',
		value: 'medical.infirmary.details.mechanism.shooting'
	},
	{
		label: 'medical.infirmary.details.mechanism.passingCrossing',
		value: 'medical.infirmary.details.mechanism.passingCrossing'
	},
	{
		label: 'medical.infirmary.details.mechanism.dribbling',
		value: 'medical.infirmary.details.mechanism.dribbling'
	},
	{
		label: 'medical.infirmary.details.mechanism.jumpingLanding',
		value: 'medical.infirmary.details.mechanism.jumpingLanding'
	},
	{
		label: 'medical.infirmary.details.mechanism.fallingDiving',
		value: 'medical.infirmary.details.mechanism.fallingDiving'
	},
	{
		label: 'medical.infirmary.details.mechanism.stretching',
		value: 'medical.infirmary.details.mechanism.stretching'
	},
	{
		label: 'medical.infirmary.details.mechanism.sliding',
		value: 'medical.infirmary.details.mechanism.sliding'
	},
	{
		label: 'medical.infirmary.details.mechanism.overuse',
		value: 'medical.infirmary.details.mechanism.overuse'
	},
	{
		label: 'medical.infirmary.details.mechanism.HitByBall',
		value: 'medical.infirmary.details.mechanism.HitByBall'
	},
	{
		label: 'medical.infirmary.details.mechanism.collision',
		value: 'medical.infirmary.details.mechanism.collision'
	},
	{
		label: 'medical.infirmary.details.mechanism.heading',
		value: 'medical.infirmary.details.mechanism.heading'
	},
	{
		label: 'medical.infirmary.details.mechanism.tackled',
		value: 'medical.infirmary.details.mechanism.tackled'
	},
	{
		label: 'medical.infirmary.details.mechanism.tackling',
		value: 'medical.infirmary.details.mechanism.tackling'
	},
	{
		label: 'medical.infirmary.details.mechanism.kicked',
		value: 'medical.infirmary.details.mechanism.kicked'
	},
	{
		label: 'medical.infirmary.details.mechanism.blocked',
		value: 'medical.infirmary.details.mechanism.blocked'
	},
	{
		label: 'medical.infirmary.details.mechanism.useArmElbow',
		value: 'medical.infirmary.details.mechanism.useArmElbow'
	},
	{
		label: 'medical.infirmary.details.mechanism.decelerate',
		value: 'medical.infirmary.details.mechanism.decelerate'
	},
	{
		label: 'medical.infirmary.details.mechanism.accelerate',
		value: 'medical.infirmary.details.mechanism.accelerate'
	},
	{
		label: 'medical.infirmary.details.mechanism.other',
		value: 'medical.infirmary.details.mechanism.other'
	}
];

export const injuryOccurrence = [
	{
		label: 'medical.infirmary.details.occurrence.game1stQuarter',
		value: 'medical.infirmary.details.occurrence.game1stQuarter'
	},
	{
		label: 'medical.infirmary.details.occurrence.game2ndQuarter',
		value: 'medical.infirmary.details.occurrence.game2ndQuarter'
	},
	{
		label: 'medical.infirmary.details.occurrence.game3rdQuarter',
		value: 'medical.infirmary.details.occurrence.game3rdQuarter'
	},
	{
		label: 'medical.infirmary.details.occurrence.game4thQuarter',
		value: 'medical.infirmary.details.occurrence.game4thQuarter'
	},
	{
		label: 'medical.infirmary.details.occurrence.fieldTraining',
		value: 'medical.infirmary.details.occurrence.fieldTraining'
	},
	{
		label: 'medical.infirmary.details.occurrence.fieldTrainingNonfootball',
		value: 'medical.infirmary.details.occurrence.fieldTrainingNonfootball'
	},
	{
		label: 'medical.infirmary.details.occurrence.gymSession',
		value: 'medical.infirmary.details.occurrence.gymSession'
	},
	{
		label: 'medical.infirmary.details.occurrence.nationalTeamCamp',
		value: 'medical.infirmary.details.occurrence.nationalTeamCamp'
	},
	{
		label: 'medical.infirmary.details.occurrence.other',
		value: 'medical.infirmary.details.occurrence.other'
	}
];

export const injurySystems = [
	{
		label: 'medical.infirmary.details.system.eyes',
		value: 'medical.infirmary.details.system.eyes'
	},
	{
		label: 'medical.infirmary.details.system.earsNoseMouthThroat',
		value: 'medical.infirmary.details.system.earsNoseMouthThroat'
	},
	{
		label: 'medical.infirmary.details.system.cardiovascular',
		value: 'medical.infirmary.details.system.cardiovascular'
	},
	{
		label: 'medical.infirmary.details.system.allergicImmunologic',
		value: 'medical.infirmary.details.system.allergicImmunologic'
	},
	{
		label: 'medical.infirmary.details.system.gastrointestinal',
		value: 'medical.infirmary.details.system.gastrointestinal'
	},
	{
		label: 'medical.infirmary.details.system.genitourinary',
		value: 'medical.infirmary.details.system.genitourinary'
	},
	{
		label: 'medical.infirmary.details.system.muscoloskeletal',
		value: 'medical.infirmary.details.system.muscoloskeletal'
	},
	{
		label: 'medical.infirmary.details.system.integumentary',
		value: 'medical.infirmary.details.system.integumentary'
	},
	{
		label: 'medical.infirmary.details.system.neurological',
		value: 'medical.infirmary.details.system.neurological'
	},
	{
		label: 'medical.infirmary.details.system.psychiatric',
		value: 'medical.infirmary.details.system.psychiatric'
	},
	{
		label: 'medical.infirmary.details.system.endocrine',
		value: 'medical.infirmary.details.system.endocrine'
	},
	{
		label: 'medical.infirmary.details.system.hematologicLymphatic',
		value: 'medical.infirmary.details.system.hematologicLymphatic'
	}
];

export const injurySeverity = [
	{
		label: 'medical.infirmary.details.severity.slight',
		value: 'medical.infirmary.details.severity.slight'
	},
	{
		label: 'medical.infirmary.details.severity.minimal',
		value: 'medical.infirmary.details.severity.minimal'
	},
	{
		label: 'medical.infirmary.details.severity.mild',
		value: 'medical.infirmary.details.severity.mild'
	},
	{
		label: 'medical.infirmary.details.severity.moderate',
		value: 'medical.infirmary.details.severity.moderate'
	},
	{
		label: 'medical.infirmary.details.severity.severe',
		value: 'medical.infirmary.details.severity.severe'
	}
];

/* #region INJURIES & STATUSES */
type InjuryStatusType =
	| 'Assessment'
	| 'Therapy'
	| 'Rehab'
	| 'Reconditioning'
	| 'ReturnToPlay'
	| 'ReturnToGame'
	| 'Healed';
const INJURY_COLORS: Record<InjuryStatusType, string> = {
	Assessment: '#ffb6c1',
	Therapy: '#fafafa',
	Rehab: '#c1272d',
	Reconditioning: '#fcee21',
	ReturnToPlay: '#3fa9f5',
	ReturnToGame: '#3bf100',
	Healed: '#90EE90'
} as const;
export type InjuryStatusColor = (typeof INJURY_COLORS)[keyof typeof INJURY_COLORS];

export const INJURY_STATUSES_LABELS: Record<InjuryStatusType, string> = {
	Assessment: 'medical.infirmary.details.statusList.assessment',
	Therapy: 'medical.infirmary.details.statusList.therapy',
	Rehab: 'medical.infirmary.details.statusList.rehab',
	Reconditioning: 'medical.infirmary.details.statusList.reconditioning',
	ReturnToPlay: 'medical.infirmary.details.statusList.returnToPlay',
	ReturnToGame: 'medical.infirmary.details.statusList.returnToGame',
	Healed: 'medical.infirmary.details.statusList.healed'
} as const;
export type InjuryStatusLabel = (typeof INJURY_STATUSES_LABELS)[keyof typeof INJURY_STATUSES_LABELS];

export type InjuryStatus = {
	label: InjuryStatusLabel;
	color: InjuryStatusColor;
	visible: boolean;
};

export const INJURY_STATUSES: InjuryStatus[] = Object.values(INJURY_STATUSES_LABELS).map(
	(label: InjuryStatusLabel, index: number) => ({
		label,
		color: INJURY_COLORS[Object.keys(INJURY_STATUSES_LABELS)[index] as InjuryStatusType],
		visible: label !== INJURY_STATUSES_LABELS.Healed
	})
);

/* #endregion */

// -------
export const feets = [
	{ label: 'foot.right', value: 'right' },
	{ label: 'foot.left', value: 'left' },
	{ label: 'foot.both', value: 'both' }
];

export const getYears = (): SelectItem[] => {
	const initialYear = moment().subtract(50, 'year').startOf('year');
	const yearsInterval = Array.from(moment.range(initialYear, moment().startOf('year')).by('years')).reverse();
	return yearsInterval.map(x => ({
		label: moment(x).format('YYYY'),
		value: moment(x).format('YYYY')
	}));
};

export const algoMetrics: DeviceMetricDescriptor[] = [
	{
		metricLabel: 'Duration',
		algo: false,
		metricName: 'duration',
		defaultValue: 0
	},
	{
		metricLabel: 'RPE *',
		algo: true,
		metricName: 'rpe',
		defaultValue: 0
	},
	{
		metricLabel: 'RPE TL *',
		algo: true,
		metricName: 'rpeTl',
		defaultValue: 0
	},
	{
		metricLabel: 'HR 85-90 (min) *',
		algo: true,
		metricName: 'heartRate85to90',
		defaultValue: 0
	},
	{
		metricLabel: 'HR >90 (min) *',
		algo: true,
		metricName: 'heartRateGr90',
		defaultValue: 0
	},
	{
		metricLabel: 'Total Distance (Km) *',
		algo: true,
		metricName: 'totalDistance',
		defaultValue: 0
	},
	{
		metricLabel: 'Sprint Distance (m) *',
		algo: true,
		metricName: 'sprintDistance',
		defaultValue: 0
	},
	{
		metricLabel: 'High Speed Running Distance (m) *',
		algo: true,
		metricName: 'highspeedRunningDistance',
		defaultValue: 0
	},
	{
		metricLabel: 'Power Distance (m) *',
		algo: true,
		metricName: 'powerDistance',
		defaultValue: 0
	},
	{
		metricLabel: 'High Power Distance (m) *',
		algo: true,
		metricName: 'highPowerDistance',
		defaultValue: 0
	},
	{
		metricLabel: 'Power Plays (No) *',
		algo: true,
		metricName: 'powerPlays',
		defaultValue: 0
	},
	{
		metricLabel: 'High Intensity Decel (No) *',
		algo: true,
		metricName: 'highIntensityDeceleration',
		defaultValue: 0
	},
	{
		metricLabel: 'High Intensity Accel (No) *',
		algo: true,
		metricName: 'highIntensityAcceleration',
		defaultValue: 0
	},
	{
		metricLabel: 'Explosive Distance (m) *',
		algo: true,
		metricName: 'explosiveDistance',
		defaultValue: 0
	},
	{
		metricLabel: 'AVG Metabolic Power (W/Kg) *',
		algo: true,
		metricName: 'averageMetabolicPower',
		defaultValue: 0
	},
	{
		metricLabel: 'Distance per minute (m) *',
		algo: true,
		metricName: 'distancePerMinute',
		defaultValue: 0
	},
	{
		metricLabel: 'Workload Score *',
		algo: true,
		metricName: 'workload',
		defaultValue: 0
	},
	{
		metricLabel: 'Perceived Workload',
		algo: true,
		metricName: 'perceivedWorkload',
		defaultValue: 0
	},
	{
		metricLabel: 'Kinematic Workload',
		algo: true,
		metricName: 'kinematicWorkload',
		defaultValue: 0
	},
	{
		metricLabel: 'Metabolic Workload',
		algo: true,
		metricName: 'metabolicWorkload',
		defaultValue: 0
	},
	{
		metricLabel: 'Mechanical Workload',
		algo: true,
		metricName: 'mechanicalWorkload',
		defaultValue: 0
	},
	{
		metricLabel: 'Cardio Workload',
		algo: true,
		metricName: 'cardioWorkload',
		defaultValue: 0
	},
	{
		metricLabel: 'Intensity',
		algo: true,
		metricName: 'intensity',
		defaultValue: 0
	}
];

export interface PeopleDocumentType extends SelectItem {
	isCustom: boolean;
}

@Injectable({
	providedIn: 'root'
})
export class ConstantService {
	educations: SelectItem[] = [];
	genders: SelectItem[] = [];
	hours: SelectItem[] = [];
	medicalThemeList: SelectItem[] = [];
	themeList: SelectItem[] = [];
	fieldSessionThemeList: SelectItem[] = [];
	intensityList: SelectItem[] = [];
	effortList: SelectItem[] = [];

	subformatList: SelectItem[] = [];
	ageGroups: SelectItem[] = [];
	contractTypes: SelectItem[] = [];
	nutritional: SelectItem[] = [];
	recovery: SelectItem[] = [];
	nationalityOrigins: SelectItem[] = [];
	videoTags: SelectItem[] = [];
	competitionsList: SelectItem[] = competitionsList;
	documentType: PeopleDocumentType[] = [];
	currencies: SelectItem[] = currencies;
	locations: SelectItem[] = locations;
	types: SelectItem[] = types;
	feets: SelectItem[] = feets;
	nationalities: SelectItem[] = NATIONALITIES;
	positionLegendItems: { label: string; tooltip: string }[] = positionLegendItems;
	preferredLegendItems: { label: string; tooltip: string }[] = preferredLegendItems;

	public getLocations(): SelectItem[] {
		return this.locations;
	}

	public getTypes(): SelectItem[] {
		return this.types;
	}
	public getCompetitions(): SelectItem[] {
		return this.competitionsList;
	}

	public getEducations(): SelectItem[] {
		return this.educations;
	}

	public getVideoTags(): SelectItem[] {
		return this.videoTags;
	}

	public getNationalityOrigins(): SelectItem[] {
		return this.nationalityOrigins;
	}

	public getFieldThemeList(): SelectItem[] {
		return this.fieldSessionThemeList;
	}

	public getAgeGroups(): SelectItem[] {
		return this.ageGroups;
	}

	public getContractTypes(): SelectItem[] {
		return this.contractTypes;
	}

	public getPositionLegendItems(): { label: string; tooltip: string }[] {
		return this.positionLegendItems;
	}

	public getPreferredLegendItems(): { label: string; tooltip: string }[] {
		return this.preferredLegendItems;
	}

	public getFeets(): SelectItem[] {
		return this.feets;
	}

	public getNationalities(): SelectItem[] {
		return this.nationalities;
	}

	public getEventSubformat(): SelectItem[] {
		return this.subformatList;
	}

	public getEventEffort(): SelectItem[] {
		return this.effortList;
	}

	public getEventIntensity(): SelectItem[] {
		return this.intensityList;
	}

	public getEventTheme(): SelectItem[] {
		return this.themeList;
	}

	public getEventMedicalTheme(): SelectItem[] {
		return this.medicalThemeList;
	}

	public getHoursList(): SelectItem[] {
		return this.hours;
	}

	public getNutritional(): SelectItem[] {
		return this.nutritional;
	}

	public getRecovery(): SelectItem[] {
		return this.recovery;
	}

	public getGenders(): SelectItem[] {
		return this.genders;
	}

	public getDocumentType(): PeopleDocumentType[] {
		return this.documentType;
	}

	public getCurrencies(): SelectItem[] {
		return this.currencies;
	}

	public getCurrencySymbol(currency: CurrencyType): string {
		return currenciesSymbol[currency];
	}

	constructor() {
		this.ageGroups.push({ label: 'drills.age.first', value: '1st team' });
		this.ageGroups.push({ label: 'drills.age.second', value: 'Second team' });
		this.ageGroups.push({ label: 'drills.age.u19', value: 'u19' });
		this.ageGroups.push({ label: 'drills.age.u18', value: 'u18' });
		this.ageGroups.push({ label: 'drills.age.u17', value: 'u17' });
		this.ageGroups.push({ label: 'drills.age.u16', value: 'u16' });
		this.ageGroups.push({ label: 'drills.age.u15', value: 'u15' });
		this.ageGroups.push({ label: 'drills.age.u14', value: 'u14' });
		this.ageGroups.push({ label: 'drills.age.u13', value: 'u13' });
		this.ageGroups.push({ label: 'drills.age.u12', value: 'u12' });
		this.ageGroups.push({ label: 'drills.age.u11', value: 'u11' });
		this.ageGroups.push({ label: 'drills.age.u10', value: 'u10' });
		this.ageGroups.push({ label: 'drills.age.u9', value: 'u9' });
		this.ageGroups.push({ label: 'drills.age.u8', value: 'u8' });
		this.ageGroups.push({ label: 'drills.age.u7', value: 'u7' });

		this.contractTypes.push({
			label: 'drills.contract.inTeam',
			value: 'inTeam'
		});
		this.contractTypes.push({
			label: 'drills.contract.onLoanInTeam',
			value: 'onLoanInTeam'
		});
		this.contractTypes.push({ label: 'drills.contract.trial', value: 'trial' });

		this.subformatList.push({
			label: 'event.format.nationalCup',
			value: 'nationalCup'
		});
		this.subformatList.push({
			label: 'event.format.internationalCup',
			value: 'internationalCup'
		});
		this.subformatList.push({
			label: 'event.format.nationalLeague',
			value: 'nationalLeague'
		});
		this.subformatList.push({
			label: 'event.format.friendly',
			value: 'friendly'
		});

		this.effortList.push({ label: 'event.effort.1', value: 1 });
		this.effortList.push({ label: 'event.effort.2', value: 2 });
		this.effortList.push({ label: 'event.effort.3', value: 3 });
		this.effortList.push({ label: 'event.effort.4', value: 4 });
		this.effortList.push({ label: 'event.effort.5', value: 5 });

		this.intensityList.push({ label: '10%', value: 10 });
		this.intensityList.push({ label: '20%', value: 20 });
		this.intensityList.push({ label: '30%', value: 30 });
		this.intensityList.push({ label: '40%', value: 40 });
		this.intensityList.push({ label: '50%', value: 50 });
		this.intensityList.push({ label: '60%', value: 60 });
		this.intensityList.push({ label: '70%', value: 70 });
		this.intensityList.push({ label: '80%', value: 80 });
		this.intensityList.push({ label: '90%', value: 90 });
		this.intensityList.push({ label: '100%', value: 100 });

		this.themeList.push({ label: 'event.theme.field', value: 'field' });
		this.themeList.push({ label: 'event.theme.gym', value: 'gym' });
		this.themeList.push({
			label: 'event.theme.reconditioning',
			value: 'reconditioning'
		});
		this.themeList.push({ label: 'event.theme.recovery', value: 'recovery' });

		this.fieldSessionThemeList.push({
			label: 'event.theme.endurance',
			value: 'endurance'
		});
		this.fieldSessionThemeList.push({
			label: 'event.theme.powerSpeed',
			value: 'power_speed'
		});
		this.fieldSessionThemeList.push({
			label: 'event.theme.tactics',
			value: 'tactics'
		});
		this.fieldSessionThemeList.push({
			label: 'event.theme.technical',
			value: 'technical'
		});

		this.medicalThemeList.push({
			label: 'event.theme.therapy',
			value: 'therapy'
		});
		this.medicalThemeList.push({ label: 'event.theme.rehab', value: 'rehab' });
		this.medicalThemeList.push({
			label: 'event.theme.reconditioning',
			value: 'reconditioning'
		});

		this.hours.push({ label: '00:00', value: '00:00' });
		this.hours.push({ label: '00:30', value: '00:30' });
		this.hours.push({ label: '01:00', value: '01:00' });
		this.hours.push({ label: '01:30', value: '01:30' });
		this.hours.push({ label: '02:00', value: '02:00' });
		this.hours.push({ label: '02:30', value: '02:30' });
		this.hours.push({ label: '03:00', value: '03:00' });
		this.hours.push({ label: '03:30', value: '03:30' });
		this.hours.push({ label: '04:00', value: '04:00' });
		this.hours.push({ label: '04:30', value: '04:30' });
		this.hours.push({ label: '05:00', value: '05:00' });
		this.hours.push({ label: '05:30', value: '05:30' });
		this.hours.push({ label: '06:00', value: '06:00' });
		this.hours.push({ label: '06:30', value: '06:30' });
		this.hours.push({ label: '07:00', value: '07:00' });
		this.hours.push({ label: '07:30', value: '07:30' });
		this.hours.push({ label: '08:00', value: '08:00' });
		this.hours.push({ label: '08:30', value: '08:30' });
		this.hours.push({ label: '09:00', value: '09:00' });
		this.hours.push({ label: '09:30', value: '09:30' });
		this.hours.push({ label: '10:00', value: '10:00' });
		this.hours.push({ label: '10:30', value: '10:30' });
		this.hours.push({ label: '11:00', value: '11:00' });
		this.hours.push({ label: '11:30', value: '11:30' });
		this.hours.push({ label: '12:00', value: '12:00' });
		this.hours.push({ label: '12:30', value: '12:30' });
		this.hours.push({ label: '13:00', value: '13:00' });
		this.hours.push({ label: '13:30', value: '13:30' });
		this.hours.push({ label: '14:00', value: '14:00' });
		this.hours.push({ label: '14:30', value: '14:30' });
		this.hours.push({ label: '15:00', value: '15:00' });
		this.hours.push({ label: '15:30', value: '15:30' });
		this.hours.push({ label: '16:00', value: '16:00' });
		this.hours.push({ label: '16:30', value: '16:30' });
		this.hours.push({ label: '17:00', value: '17:00' });
		this.hours.push({ label: '17:30', value: '17:30' });
		this.hours.push({ label: '18:00', value: '18:00' });
		this.hours.push({ label: '18:30', value: '18:30' });
		this.hours.push({ label: '19:00', value: '19:00' });
		this.hours.push({ label: '19:30', value: '19:30' });
		this.hours.push({ label: '20:00', value: '20:00' });
		this.hours.push({ label: '20:30', value: '20:30' });
		this.hours.push({ label: '21:00', value: '21:00' });
		this.hours.push({ label: '21:30', value: '21:30' });
		this.hours.push({ label: '22:00', value: '22:00' });
		this.hours.push({ label: '22:30', value: '22:30' });
		this.hours.push({ label: '23:00', value: '23:00' });
		this.hours.push({ label: '23:30', value: '23:30' });

		this.nutritional.push({
			label: 'event.nutritionalStrategies.carboloader',
			value: 'carboloader'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.fastCarbs',
			value: 'fastCarbs'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.caffeine',
			value: 'caffeine'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.creatine',
			value: 'creatine'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.lCarnosine',
			value: 'lCarnosine'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.lAcetylCarnitine',
			value: 'lAcetylCarnitine'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.isotonicDrink',
			value: 'isotonicDrink'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.betaAlanine',
			value: 'betaAlanine'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.lArginine',
			value: 'lArginine'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.taurine',
			value: 'taurine'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.bcaa',
			value: 'bcaa'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.hmb',
			value: 'hmb'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.glutamine',
			value: 'glutamine'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.recoveryDrinkGel',
			value: 'recoveryDrinkGel'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.proteinShake',
			value: 'proteinShake'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.proteinBar',
			value: 'proteinBar'
		});
		this.nutritional.push({
			label: 'event.nutritionalStrategies.energyBar',
			value: 'energyBar'
		});

		this.recovery.push({
			label: 'event.recoveryStrategies.cryotherapy',
			value: 'cryotherapy'
		});
		this.recovery.push({
			label: 'event.recoveryStrategies.coldWaterImmersion',
			value: 'coldWaterImmersion'
		});
		this.recovery.push({
			label: 'event.recoveryStrategies.contrastTherapy',
			value: 'contrastTherapy'
		});
		this.recovery.push({
			label: 'event.recoveryStrategies.hydrotherapy',
			value: 'hydrotherapy'
		});
		this.recovery.push({
			label: 'event.recoveryStrategies.compression',
			value: 'compression'
		});
		this.recovery.push({
			label: 'event.recoveryStrategies.sauna',
			value: 'sauna'
		});
		this.recovery.push({
			label: 'event.recoveryStrategies.myofascialRelease',
			value: 'myofascialRelease'
		});

		this.genders.push({ label: 'male', value: 'male' });
		this.genders.push({ label: 'female', value: 'female' });

		this.educations.push({ label: 'educations.primary', value: 'primary' });
		this.educations.push({
			label: 'educations.lowerSecondary',
			value: 'lowerSecondary'
		});
		this.educations.push({
			label: 'educations.upperSecondary',
			value: 'upperSecondary'
		});
		this.educations.push({ label: 'educations.college', value: 'college' });
		this.educations.push({
			label: 'educations.bachelorDegree',
			value: 'bachelorDegree'
		});
		this.educations.push({
			label: 'educations.masterDegree',
			value: 'masterDegree'
		});
		this.educations.push({ label: 'educations.phd', value: 'phd' });
		this.educations.push({ label: 'educations.other', value: 'other' });

		this.nationalityOrigins.push({
			label: 'nationalityOrigins.domestic',
			value: 'domestic'
		});
		this.nationalityOrigins.push({
			label: 'nationalityOrigins.abroadCommunitary',
			value: 'abroad'
		});
		this.nationalityOrigins.push({
			label: 'nationalityOrigins.homegrown',
			value: 'homegrown'
		});
		this.nationalityOrigins.push({
			label: 'nationalityOrigins.abroadExtraCommunitary',
			value: 'abroadExtraCommunitary'
		});

		this.videoTags.push({ label: 'Best actions', value: 'Best actions' });
		this.videoTags.push({ label: 'Assists', value: 'Assists' });
		this.videoTags.push({ label: 'Goals', value: 'Goals' });
		this.videoTags.push({ label: 'Passes', value: 'Passes' });
		this.videoTags.push({ label: 'Smart passes', value: 'Smart passes' });
		this.videoTags.push({ label: 'Crosses', value: 'Crosses' });
		this.videoTags.push({ label: 'Key passes', value: 'Key passes' });
		this.videoTags.push({ label: 'Through passes', value: 'Through passes' });
		this.videoTags.push({ label: 'Shots', value: 'Shots' });
		this.videoTags.push({ label: 'Dribbling', value: 'Dribbling' });
		this.videoTags.push({ label: 'Accelerations', value: 'Accelerations' });
		this.videoTags.push({ label: 'Attacking duels', value: 'Attacking duels' });
		this.videoTags.push({ label: 'Winning Fouls', value: 'Winning Fouls' });
		this.videoTags.push({
			label: 'Off the ball movements',
			value: 'Off the ball movements'
		});
		this.videoTags.push({ label: 'Aerial duels', value: 'Aerial duels' });
		this.videoTags.push({ label: 'Fouls', value: 'Fouls' });
		this.videoTags.push({ label: 'Other fouls', value: 'Other fouls' });
		this.videoTags.push({ label: 'Throw ins', value: 'Throw ins' });
		this.videoTags.push({ label: 'Under pressure', value: 'Under pressure' });
		this.videoTags.push({
			label: 'Long-range range passes',
			value: 'Long-range range passes'
		});
		this.videoTags.push({
			label: 'Dialog with the midfield',
			value: 'Dialog with the midfield'
		});
		this.videoTags.push({ label: 'Opportunities', value: 'Opportunities' });
		this.videoTags.push({ label: 'Head Shots', value: 'Head Shots' });
		this.videoTags.push({ label: 'Accelerations', value: 'Accelerations' });
		this.videoTags.push({ label: 'Defending duels', value: 'Defending duels' });
		this.videoTags.push({ label: 'Shots out', value: 'Shots out' });
		this.videoTags.push({ label: 'Recovery', value: 'Recovery' });
		this.videoTags.push({ label: 'Tackles', value: 'Tackles' });
		this.videoTags.push({ label: '1 vs. 1 defense', value: '1 vs. 1 defense' });
		this.videoTags.push({ label: 'Interceptions', value: 'Interceptions' });
		this.videoTags.push({ label: 'Clearances', value: 'Clearances' });
		this.videoTags.push({
			label: 'Defensive positioning',
			value: 'Defensive positioning'
		});
		this.videoTags.push({ label: 'Goal involved', value: 'Goal involved' });
		this.videoTags.push({ label: 'Offsides', value: 'Offsides' });
		this.videoTags.push({ label: 'Balls lost', value: 'Balls lost' });
		this.videoTags.push({ label: 'Counterattack', value: 'Counterattack' });
		this.videoTags.push({ label: 'Covering depth', value: 'Covering depth' });
		this.videoTags.push({
			label: 'loose ball duels',
			value: 'loose ball duels'
		});
		this.videoTags.push({ label: 'Aggressiveness', value: 'Aggressiveness' });
		this.videoTags.push({ label: 'Penalty', value: 'Penalty' });
		this.videoTags.push({ label: 'Free kick shot', value: 'Free kick shot' });
		this.videoTags.push({
			label: 'Indirect free kick',
			value: 'Indirect free kick'
		});
		this.videoTags.push({ label: 'Corner kick', value: 'Corner kick' });
		this.videoTags.push({
			label: 'Goalkeeper events',
			value: 'Goalkeeper events'
		});
		this.videoTags.push({ label: 'Goals conceded', value: 'Goals conceded' });
		this.videoTags.push({ label: 'Distributions', value: 'Distributions' });
		this.videoTags.push({ label: 'Saves', value: 'Saves' });
		this.videoTags.push({ label: 'Reflexes', value: 'Reflexes' });
		this.videoTags.push({ label: 'Exits', value: 'Exits' });
		this.videoTags.push({ label: 'Shots out', value: 'Shots out' });
		this.videoTags.push({ label: 'Aerial duels', value: 'Aerial duels' });
		this.videoTags.push({ label: 'Fouls', value: 'Fouls' });
		this.videoTags.push({
			label: 'Penalties conceded',
			value: 'Penalties conceded'
		});

		this.documentType = [
			{ label: 'idCard', value: 'idCard', isCustom: false },
			{ label: 'passport', value: 'passport', isCustom: false },
			{ label: 'visa', value: 'visa', isCustom: false },
			{ label: 'residencyPermit', value: 'residencyPermit', isCustom: false },
			{ label: 'healthCard', value: 'healthCard', isCustom: false },
			{ label: 'customDocument', value: 'customDocument', isCustom: true }
		];
	}
}
