import { SelectItem } from 'primeng/api';

type PlayerRoleType =
	| 'GK'
	| 'DF'
	| 'LB'
	| 'CBL'
	| 'CBC'
	| 'CBR'
	| 'RB'
	| 'LWB'
	| 'MD'
	| 'DLM'
	| 'DCM'
	| 'DRM'
	| 'RWB'
	| 'LM'
	| 'LCM'
	| 'CM'
	| 'RCM'
	| 'RM'
	| 'LW'
	| 'LAM'
	| 'CAM'
	| 'RAM'
	| 'RW'
	| 'FW'
	| 'LF'
	| 'S'
	| 'RF'
	| 'movOnBall'
	| 'movOffBall'
	| 'passing'
	| 'finishing'
	| 'defending'
	| 'technique';

interface PlayerRole<T> extends SelectItem<T> {
	tooltip: string;
}
export const playerRolesByPosition: Record<PlayerRoleType, PlayerRole<string>[]> = {
	GK: [
		{ label: 'profile.roles.goalkeeper', value: 'goalkeeper', tooltip: 'profile.roles.goalkeeper.description' },
		{ label: 'profile.roles.sweeperKeeper', value: 'sweeperKeeper', tooltip: 'profile.roles.sweeperKeeper.description' }
	],
	DF: [
		{
			label: 'profile.roles.centralDefender',
			value: 'centralDefender',
			tooltip: 'profile.roles.centralDefender.description'
		},
		{
			label: 'profile.roles.ballPlayingDefender',
			value: 'ballPlayingDefender',
			tooltip: 'profile.roles.ballPlayingDefender.description'
		},
		{
			label: 'profile.roles.limitedDefender',
			value: 'limitedDefender',
			tooltip: 'profile.roles.limitedDefender.description'
		},
		{
			label: 'profile.roles.sweeperKeeper',
			value: 'sweeperKeeper',
			tooltip: 'profile.roles.sweeperKeeper.description'
		},
		{ label: 'profile.roles.wingBack', value: 'wingBack', tooltip: 'profile.roles.wingBack.description' },
		{ label: 'profile.roles.fullBack', value: 'fullBack', tooltip: 'profile.roles.fullBack.description' },
		{
			label: 'profile.roles.completeWingBack',
			value: 'completeWingBack',
			tooltip: 'profile.roles.completeWingBack.description'
		},
		// {label: "profile.roles.defensiveFullBack", value: "defensiveFullBack", tooltip: "profile.roles.defensiveFullBack.description"},
		{
			label: 'profile.roles.invertedWingBack',
			value: 'invertedWingBack',
			tooltip: 'profile.roles.invertedWingBack.description'
		},
		{
			label: 'profile.roles.limitedFullBack',
			value: 'limitedFullBack',
			tooltip: 'profile.roles.limitedFullBack.description'
		}
	],
	LB: [
		{ label: 'profile.roles.wingBack', value: 'wingBack', tooltip: 'profile.roles.wingBack.description' },
		{ label: 'profile.roles.fullBack', value: 'fullBack', tooltip: 'profile.roles.fullBack.description' },
		{
			label: 'profile.roles.completeWingBack',
			value: 'completeWingBack',
			tooltip: 'profile.roles.completeWingBack.description'
		},
		// {label: "profile.roles.defensiveFullBack", value: "defensiveFullBack", tooltip: "profile.roles.defensiveFullBack.description"},
		{
			label: 'profile.roles.invertedWingBack',
			value: 'invertedWingBack',
			tooltip: 'profile.roles.invertedWingBack.description'
		},
		{
			label: 'profile.roles.limitedFullBack',
			value: 'limitedFullBack',
			tooltip: 'profile.roles.limitedFullBack.description'
		}
	],
	CBL: [
		{
			label: 'profile.roles.centralDefender',
			value: 'centralDefender',
			tooltip: 'profile.roles.centralDefender.description'
		},
		{
			label: 'profile.roles.ballPlayingDefender',
			value: 'ballPlayingDefender',
			tooltip: 'profile.roles.ballPlayingDefender.description'
		},
		{
			label: 'profile.roles.limitedDefender',
			value: 'limitedDefender',
			tooltip: 'profile.roles.limitedDefender.description'
		},
		{ label: 'profile.roles.sweeperKeeper', value: 'sweeperKeeper', tooltip: 'profile.roles.sweeperKeeper.description' }
	],
	CBC: [
		{
			label: 'profile.roles.centralDefender',
			value: 'centralDefender',
			tooltip: 'profile.roles.centralDefender.description'
		},
		{
			label: 'profile.roles.ballPlayingDefender',
			value: 'ballPlayingDefender',
			tooltip: 'profile.roles.ballPlayingDefender.description'
		},
		{
			label: 'profile.roles.limitedDefender',
			value: 'limitedDefender',
			tooltip: 'profile.roles.limitedDefender.description'
		},
		{ label: 'profile.roles.sweeperKeeper', value: 'sweeperKeeper', tooltip: 'profile.roles.sweeperKeeper.description' }
	],
	CBR: [
		{
			label: 'profile.roles.centralDefender',
			value: 'centralDefender',
			tooltip: 'profile.roles.centralDefender.description'
		},
		{
			label: 'profile.roles.ballPlayingDefender',
			value: 'ballPlayingDefender',
			tooltip: 'profile.roles.ballPlayingDefender.description'
		},
		{
			label: 'profile.roles.limitedDefender',
			value: 'limitedDefender',
			tooltip: 'profile.roles.limitedDefender.description'
		},
		{ label: 'profile.roles.sweeperKeeper', value: 'sweeperKeeper', tooltip: 'profile.roles.sweeperKeeper.description' }
	],
	RB: [
		{ label: 'profile.roles.wingBack', value: 'wingBack', tooltip: 'profile.roles.wingBack.description' },
		{ label: 'profile.roles.fullBack', value: 'fullBack', tooltip: 'profile.roles.fullBack.description' },
		{
			label: 'profile.roles.completeWingBack',
			value: 'completeWingBack',
			tooltip: 'profile.roles.completeWingBack.description'
		},
		// {label: "profile.roles.defensiveFullBack", value: "defensiveFullBack", tooltip: "profile.roles.defensiveFullBack.description"},
		{
			label: 'profile.roles.invertedWingBack',
			value: 'invertedWingBack',
			tooltip: 'profile.roles.invertedWingBack.description'
		},
		{
			label: 'profile.roles.limitedFullBack',
			value: 'limitedFullBack',
			tooltip: 'profile.roles.limitedFullBack.description'
		}
	],
	LWB: [
		{ label: 'profile.roles.wingBack', value: 'wingBack', tooltip: 'profile.roles.wingBack.description' },
		{ label: 'profile.roles.fullBack', value: 'fullBack', tooltip: 'profile.roles.fullBack.description' },
		{
			label: 'profile.roles.completeWingBack',
			value: 'completeWingBack',
			tooltip: 'profile.roles.completeWingBack.description'
		},
		// {label: "profile.roles.defensiveFullBack", value: "defensiveFullBack", tooltip: "profile.roles.defensiveFullBack.description"},
		{
			label: 'profile.roles.invertedWingBack',
			value: 'invertedWingBack',
			tooltip: 'profile.roles.invertedWingBack.description'
		},
		{
			label: 'profile.roles.limitedFullBack',
			value: 'limitedFullBack',
			tooltip: 'profile.roles.limitedFullBack.description'
		}
	],
	MD: [
		{
			label: 'profile.roles.deepLyingPlamaker',
			value: 'deepLyingPlamaker',
			tooltip: 'profile.roles.deepLyingPlamaker.description'
		},
		{
			label: 'profile.roles.roamingPlaymaker',
			value: 'roamingPlaymaker',
			tooltip: 'profile.roles.roamingPlaymaker.description'
		},
		{ label: 'profile.roles.regista', value: 'regista', tooltip: 'profile.roles.regista.description' },
		{
			label: 'profile.roles.defensiveMidfielder',
			value: 'defensiveMidfielder',
			tooltip: 'profile.roles.defensiveMidfielder.description'
		},
		{ label: 'profile.roles.halfBack', value: 'halfBack', tooltip: 'profile.roles.halfBack.description' },
		{ label: 'profile.roles.anchorMan', value: 'anchorMan', tooltip: 'profile.roles.anchorMan.description' },
		// {label: "profile.roles.carrilero", value: "carrilero", tooltip: "profile.roles.carrilero.description"},
		{
			label: 'profile.roles.centralMidfielder',
			value: 'centralMidfielder',
			tooltip: 'profile.roles.centralMidfielder.description'
		},
		{
			label: 'profile.roles.boxToBoxMidfielder',
			value: 'boxToBoxMidfielder',
			tooltip: 'profile.roles.boxToBoxMidfielder.description'
		},
		// {label: "profile.roles.mezzala", value: "mezzala", tooltip: "profile.roles.mezzala.description"},
		{
			label: 'profile.roles.ballWinningMidfielder',
			value: 'ballWinningMidfielder',
			tooltip: 'profile.roles.ballWinningMidfielder.description'
		},
		{ label: 'profile.roles.wingBack', value: 'wingBack', tooltip: 'profile.roles.wingBack.description' },
		{ label: 'profile.roles.fullBack', value: 'fullBack', tooltip: 'profile.roles.fullBack.description' },
		{
			label: 'profile.roles.completeWingBack',
			value: 'completeWingBack',
			tooltip: 'profile.roles.completeWingBack.description'
		},
		// {label: "profile.roles.defensiveFullBack", value: "defensiveFullBack", tooltip: "profile.roles.defensiveFullBack.description"},
		{
			label: 'profile.roles.invertedWingBack',
			value: 'invertedWingBack',
			tooltip: 'profile.roles.invertedWingBack.description'
		},
		{
			label: 'profile.roles.limitedFullBack',
			value: 'limitedFullBack',
			tooltip: 'profile.roles.limitedFullBack.description'
		},
		{
			label: 'profile.roles.widePlaymaker',
			value: 'widePlaymaker',
			tooltip: 'profile.roles.widePlaymaker.description'
		},
		{
			label: 'profile.roles.wideMidfielder',
			value: 'wideMidfielder',
			tooltip: 'profile.roles.wideMidfielder.description'
		},
		{
			label: 'profile.roles.defensiveWinger',
			value: 'defensiveWinger',
			tooltip: 'profile.roles.defensiveWinger.description'
		},
		{ label: 'profile.roles.winger', value: 'winger', tooltip: 'profile.roles.winger.description' },
		// {label: "profile.roles.invertedWinger", value: "invertedWinger", tooltip: "profile.roles.invertedWinger.description"},
		{
			label: 'profile.roles.attackingMidfielder',
			value: 'attackingMidfielder',
			tooltip: 'profile.roles.attackingMidfielder.description'
		},
		{
			label: 'profile.roles.shadowStriker',
			value: 'shadowStriker',
			tooltip: 'profile.roles.shadowStriker.description'
		},
		{ label: 'profile.roles.enganche', value: 'enganche', tooltip: 'profile.roles.enganche.description' },
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' },
		{
			label: 'profile.roles.advancedPlaymaker',
			value: 'advancedPlaymaker',
			tooltip: 'profile.roles.advancedPlaymaker.description'
		},
		{ label: 'profile.roles.ramdeuter', value: 'ramdeuter', tooltip: 'profile.roles.ramdeuter.description' },
		{
			label: 'profile.roles.wideTargetMan',
			value: 'wideTargetMan',
			tooltip: 'profile.roles.wideTargetMan.description'
		},
		{ label: 'profile.roles.insideForward', value: 'insideForward', tooltip: 'profile.roles.insideForward.description' }
	],
	DLM: [
		{
			label: 'profile.roles.deepLyingPlamaker',
			value: 'deepLyingPlamaker',
			tooltip: 'profile.roles.deepLyingPlamaker.description'
		},
		{
			label: 'profile.roles.roamingPlaymaker',
			value: 'roamingPlaymaker',
			tooltip: 'profile.roles.roamingPlaymaker.description'
		},
		// {label: "profile.roles.segundoVolante", value: "segundoVolante", tooltip: "profile.roles.segundoVolante.description"},
		{ label: 'profile.roles.regista', value: 'regista', tooltip: 'profile.roles.regista.description' },
		{
			label: 'profile.roles.defensiveMidfielder',
			value: 'defensiveMidfielder',
			tooltip: 'profile.roles.defensiveMidfielder.description'
		},
		{ label: 'profile.roles.halfBack', value: 'halfBack', tooltip: 'profile.roles.halfBack.description' },
		{
			label: 'profile.roles.ballWinningMidfielder',
			value: 'ballWinningMidfielder',
			tooltip: 'profile.roles.ballWinningMidfielder.description'
		},
		{ label: 'profile.roles.anchorMan', value: 'anchorMan', tooltip: 'profile.roles.anchorMan.description' }
	],
	DCM: [
		{
			label: 'profile.roles.deepLyingPlamaker',
			value: 'deepLyingPlamaker',
			tooltip: 'profile.roles.deepLyingPlamaker.description'
		},
		{
			label: 'profile.roles.roamingPlaymaker',
			value: 'roamingPlaymaker',
			tooltip: 'profile.roles.roamingPlaymaker.description'
		},
		// {label: "profile.roles.segundoVolante", value: "segundoVolante", tooltip: "profile.roles.segundoVolante.description"},
		{ label: 'profile.roles.regista', value: 'regista', tooltip: 'profile.roles.regista.description' },
		{
			label: 'profile.roles.defensiveMidfielder',
			value: 'defensiveMidfielder',
			tooltip: 'profile.roles.defensiveMidfielder.description'
		},
		{ label: 'profile.roles.halfBack', value: 'halfBack', tooltip: 'profile.roles.halfBack.description' },
		{
			label: 'profile.roles.ballWinningMidfielder',
			value: 'ballWinningMidfielder',
			tooltip: 'profile.roles.ballWinningMidfielder.description'
		},
		{ label: 'profile.roles.anchorMan', value: 'anchorMan', tooltip: 'profile.roles.anchorMan.description' }
	],
	DRM: [
		{
			label: 'profile.roles.deepLyingPlamaker',
			value: 'deepLyingPlamaker',
			tooltip: 'profile.roles.deepLyingPlamaker.description'
		},
		{
			label: 'profile.roles.roamingPlaymaker',
			value: 'roamingPlaymaker',
			tooltip: 'profile.roles.roamingPlaymaker.description'
		},
		// {label: "profile.roles.segundoVolante", value: "segundoVolante", tooltip: "profile.roles.segundoVolante.description"},
		{ label: 'profile.roles.regista', value: 'regista', tooltip: 'profile.roles.regista.description' },
		{
			label: 'profile.roles.defensiveMidfielder',
			value: 'defensiveMidfielder',
			tooltip: 'profile.roles.defensiveMidfielder.description'
		},
		{ label: 'profile.roles.halfBack', value: 'halfBack', tooltip: 'profile.roles.halfBack.description' },
		{
			label: 'profile.roles.ballWinningMidfielder',
			value: 'ballWinningMidfielder',
			tooltip: 'profile.roles.ballWinningMidfielder.description'
		},
		{ label: 'profile.roles.anchorMan', value: 'anchorMan', tooltip: 'profile.roles.anchorMan.description' }
	],
	RWB: [
		{ label: 'profile.roles.wingBack', value: 'wingBack', tooltip: 'profile.roles.wingBack.description' },
		{ label: 'profile.roles.fullBack', value: 'fullBack', tooltip: 'profile.roles.fullBack.description' },
		{
			label: 'profile.roles.completeWingBack',
			value: 'completeWingBack',
			tooltip: 'profile.roles.completeWingBack.description'
		},
		// {label: "profile.roles.defensiveFullBack", value: "defensiveFullBack", tooltip: "profile.roles.defensiveFullBack.description"},
		{
			label: 'profile.roles.invertedWingBack',
			value: 'invertedWingBack',
			tooltip: 'profile.roles.invertedWingBack.description'
		},
		{
			label: 'profile.roles.limitedFullBack',
			value: 'limitedFullBack',
			tooltip: 'profile.roles.limitedFullBack.description'
		}
	],
	LM: [
		{
			label: 'profile.roles.widePlaymaker',
			value: 'widePlaymaker',
			tooltip: 'profile.roles.widePlaymaker.description'
		},
		{
			label: 'profile.roles.wideMidfielder',
			value: 'wideMidfielder',
			tooltip: 'profile.roles.wideMidfielder.description'
		},
		{
			label: 'profile.roles.defensiveWinger',
			value: 'defensiveWinger',
			tooltip: 'profile.roles.defensiveWinger.description'
		},
		{ label: 'profile.roles.winger', value: 'winger', tooltip: 'profile.roles.winger.description' }
		// {label: "profile.roles.invertedWinger", value: "invertedWinger", tooltip: "profile.roles.invertedWinger.description"},
	],
	LCM: [
		{
			label: 'profile.roles.deepLyingPlamaker',
			value: 'deepLyingPlamaker',
			tooltip: 'profile.roles.deepLyingPlamaker.description'
		},
		{
			label: 'profile.roles.advancedPlaymaker',
			value: 'advancedPlaymaker',
			tooltip: 'profile.roles.advancedPlaymaker.description'
		},
		// {label: "profile.roles.carrilero", value: "carrilero", tooltip: "profile.roles.carrilero.description"},
		{
			label: 'profile.roles.centralMidfielder',
			value: 'centralMidfielder',
			tooltip: 'profile.roles.centralMidfielder.description'
		},
		{
			label: 'profile.roles.boxToBoxMidfielder',
			value: 'boxToBoxMidfielder',
			tooltip: 'profile.roles.boxToBoxMidfielder.description'
		},
		// {label: "profile.roles.mezzala", value: "mezzala", tooltip: "profile.roles.mezzala.description"},
		{
			label: 'profile.roles.ballWinningMidfielder',
			value: 'ballWinningMidfielder',
			tooltip: 'profile.roles.ballWinningMidfielder.description'
		},
		{
			label: 'profile.roles.roamingPlaymaker',
			value: 'roamingPlaymaker',
			tooltip: 'profile.roles.roamingPlaymaker.description'
		}
	],
	CM: [
		{
			label: 'profile.roles.deepLyingPlamaker',
			value: 'deepLyingPlamaker',
			tooltip: 'profile.roles.deepLyingPlamaker.description'
		},
		{
			label: 'profile.roles.advancedPlaymaker',
			value: 'advancedPlaymaker',
			tooltip: 'profile.roles.advancedPlaymaker.description'
		},
		// {label: "profile.roles.carrilero", value: "carrilero", tooltip: "profile.roles.carrilero.description"},
		{
			label: 'profile.roles.centralMidfielder',
			value: 'centralMidfielder',
			tooltip: 'profile.roles.centralMidfielder.description'
		},
		{
			label: 'profile.roles.boxToBoxMidfielder',
			value: 'boxToBoxMidfielder',
			tooltip: 'profile.roles.boxToBoxMidfielder.description'
		},
		// {label: "profile.roles.mezzala", value: "mezzala", tooltip: "profile.roles.mezzala.description"},
		{
			label: 'profile.roles.ballWinningMidfielder',
			value: 'ballWinningMidfielder',
			tooltip: 'profile.roles.ballWinningMidfielder.description'
		}
	],
	RCM: [
		{
			label: 'profile.roles.deepLyingPlamaker',
			value: 'deepLyingPlamaker',
			tooltip: 'profile.roles.deepLyingPlamaker.description'
		},
		{
			label: 'profile.roles.advancedPlaymaker',
			value: 'advancedPlaymaker',
			tooltip: 'profile.roles.advancedPlaymaker.description'
		},
		// {label: "profile.roles.carrilero", value: "carrilero", tooltip: "profile.roles.carrilero.description"},
		{
			label: 'profile.roles.centralMidfielder',
			value: 'centralMidfielder',
			tooltip: 'profile.roles.centralMidfielder.description'
		},
		{
			label: 'profile.roles.boxToBoxMidfielder',
			value: 'boxToBoxMidfielder',
			tooltip: 'profile.roles.boxToBoxMidfielder.description'
		},
		// {label: "profile.roles.mezzala", value: "mezzala", tooltip: "profile.roles.mezzala.description"},
		{
			label: 'profile.roles.ballWinningMidfielder',
			value: 'ballWinningMidfielder',
			tooltip: 'profile.roles.ballWinningMidfielder.description'
		},
		{
			label: 'profile.roles.roamingPlaymaker',
			value: 'roamingPlaymaker',
			tooltip: 'profile.roles.roamingPlaymaker.description'
		}
	],
	RM: [
		{
			label: 'profile.roles.wideMidfielder',
			value: 'wideMidfielder',
			tooltip: 'profile.roles.wideMidfielder.description'
		},
		{
			label: 'profile.roles.defensiveWinger',
			value: 'defensiveWinger',
			tooltip: 'profile.roles.defensiveWinger.description'
		},
		{ label: 'profile.roles.winger', value: 'winger', tooltip: 'profile.roles.winger.description' },
		// {label: "profile.roles.invertedWinger", value: "invertedWinger", tooltip: "profile.roles.invertedWinger.description"},
		{ label: 'profile.roles.widePlaymaker', value: 'widePlaymaker', tooltip: 'profile.roles.widePlaymaker.description' }
	],
	LW: [
		{ label: 'profile.roles.winger', value: 'winger', tooltip: 'profile.roles.winger.description' },
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' },
		{
			label: 'profile.roles.advancedPlaymaker',
			value: 'advancedPlaymaker',
			tooltip: 'profile.roles.advancedPlaymaker.description'
		},
		{ label: 'profile.roles.ramdeuter', value: 'ramdeuter', tooltip: 'profile.roles.ramdeuter.description' },
		{
			label: 'profile.roles.wideTargetMan',
			value: 'wideTargetMan',
			tooltip: 'profile.roles.wideTargetMan.description'
		},
		{ label: 'profile.roles.insideForward', value: 'insideForward', tooltip: 'profile.roles.insideForward.description' }
	],
	LAM: [
		{
			label: 'profile.roles.widePlaymaker',
			value: 'widePlaymaker',
			tooltip: 'profile.roles.widePlaymaker.description'
		},
		{ label: 'profile.roles.ramdeuter', value: 'ramdeuter', tooltip: 'profile.roles.ramdeuter.description' },
		{
			label: 'profile.roles.wideTargetMan',
			value: 'wideTargetMan',
			tooltip: 'profile.roles.wideTargetMan.description'
		},
		{
			label: 'profile.roles.insideForward',
			value: 'insideForward',
			tooltip: 'profile.roles.insideForward.description'
		},
		{
			label: 'profile.roles.advancedPlaymaker',
			value: 'advancedPlaymaker',
			tooltip: 'profile.roles.advancedPlaymaker.description'
		},
		{
			label: 'profile.roles.wideMidfielder',
			value: 'wideMidfielder',
			tooltip: 'profile.roles.wideMidfielder.description'
		},
		{
			label: 'profile.roles.defensiveWinger',
			value: 'defensiveWinger',
			tooltip: 'profile.roles.defensiveWinger.description'
		},
		{ label: 'profile.roles.winger', value: 'winger', tooltip: 'profile.roles.winger.description' },
		// {label: "profile.roles.invertedWinger", value: "invertedWinger", tooltip: "profile.roles.invertedWinger.description"},
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' }
	],
	CAM: [
		{
			label: 'profile.roles.attackingMidfielder',
			value: 'attackingMidfielder',
			tooltip: 'profile.roles.attackingMidfielder.description'
		},
		{
			label: 'profile.roles.shadowStriker',
			value: 'shadowStriker',
			tooltip: 'profile.roles.shadowStriker.description'
		},
		{ label: 'profile.roles.enganche', value: 'enganche', tooltip: 'profile.roles.enganche.description' },
		{
			label: 'profile.roles.advancedPlaymaker',
			value: 'advancedPlaymaker',
			tooltip: 'profile.roles.advancedPlaymaker.description'
		},
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' }
	],
	RAM: [
		{
			label: 'profile.roles.widePlaymaker',
			value: 'widePlaymaker',
			tooltip: 'profile.roles.widePlaymaker.description'
		},
		{ label: 'profile.roles.ramdeuter', value: 'ramdeuter', tooltip: 'profile.roles.ramdeuter.description' },
		{
			label: 'profile.roles.wideTargetMan',
			value: 'wideTargetMan',
			tooltip: 'profile.roles.wideTargetMan.description'
		},
		{
			label: 'profile.roles.insideForward',
			value: 'insideForward',
			tooltip: 'profile.roles.insideForward.description'
		},
		{
			label: 'profile.roles.advancedPlaymaker',
			value: 'advancedPlaymaker',
			tooltip: 'profile.roles.advancedPlaymaker.description'
		},
		{
			label: 'profile.roles.wideMidfielder',
			value: 'wideMidfielder',
			tooltip: 'profile.roles.wideMidfielder.description'
		},
		{
			label: 'profile.roles.defensiveWinger',
			value: 'defensiveWinger',
			tooltip: 'profile.roles.defensiveWinger.description'
		},
		{ label: 'profile.roles.winger', value: 'winger', tooltip: 'profile.roles.winger.description' },
		// {label: "profile.roles.invertedWinger", value: "invertedWinger", tooltip: "profile.roles.invertedWinger.description"},
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' }
	],
	RW: [
		{ label: 'profile.roles.winger', value: 'winger', tooltip: 'profile.roles.winger.description' },
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' },
		{
			label: 'profile.roles.advancedPlaymaker',
			value: 'advancedPlaymaker',
			tooltip: 'profile.roles.advancedPlaymaker.description'
		},
		{ label: 'profile.roles.ramdeuter', value: 'ramdeuter', tooltip: 'profile.roles.ramdeuter.description' },
		{
			label: 'profile.roles.wideTargetMan',
			value: 'wideTargetMan',
			tooltip: 'profile.roles.wideTargetMan.description'
		},
		{ label: 'profile.roles.insideForward', value: 'insideForward', tooltip: 'profile.roles.insideForward.description' }
	],
	FW: [
		{
			label: 'profile.roles.completeForward',
			value: 'completeForward',
			tooltip: 'profile.roles.completeForward.description'
		},
		{
			label: 'profile.roles.advancedForward',
			value: 'advancedForward',
			tooltip: 'profile.roles.advancedForward.description'
		},
		{ label: 'profile.roles.falseNine', value: 'falseNine', tooltip: 'profile.roles.falseNine.description' },
		{ label: 'profile.roles.poacher', value: 'poacher', tooltip: 'profile.roles.poacher.description' },
		{
			label: 'profile.roles.deepLyingForward',
			value: 'deepLyingForward',
			tooltip: 'profile.roles.deepLyingForward.description'
		},
		{
			label: 'profile.roles.defensiveForward',
			value: 'defensiveForward',
			tooltip: 'profile.roles.defensiveForward.description'
		},
		{ label: 'profile.roles.targetMan', value: 'targetMan', tooltip: 'profile.roles.targetMan.description' },
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' }
	],
	LF: [
		{
			label: 'profile.roles.completeForward',
			value: 'completeForward',
			tooltip: 'profile.roles.completeForward.description'
		},
		{
			label: 'profile.roles.advancedForward',
			value: 'advancedForward',
			tooltip: 'profile.roles.advancedForward.description'
		},
		{ label: 'profile.roles.falseNine', value: 'falseNine', tooltip: 'profile.roles.falseNine.description' },
		{ label: 'profile.roles.poacher', value: 'poacher', tooltip: 'profile.roles.poacher.description' },
		{
			label: 'profile.roles.deepLyingForward',
			value: 'deepLyingForward',
			tooltip: 'profile.roles.deepLyingForward.description'
		},
		{
			label: 'profile.roles.defensiveForward',
			value: 'defensiveForward',
			tooltip: 'profile.roles.defensiveForward.description'
		},
		{ label: 'profile.roles.targetMan', value: 'targetMan', tooltip: 'profile.roles.targetMan.description' },
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' }
	],
	S: [
		{
			label: 'profile.roles.completeForward',
			value: 'completeForward',
			tooltip: 'profile.roles.completeForward.description'
		},
		{
			label: 'profile.roles.advancedForward',
			value: 'advancedForward',
			tooltip: 'profile.roles.advancedForward.description'
		},
		{ label: 'profile.roles.falseNine', value: 'falseNine', tooltip: 'profile.roles.falseNine.description' },
		{ label: 'profile.roles.poacher', value: 'poacher', tooltip: 'profile.roles.poacher.description' },
		{
			label: 'profile.roles.deepLyingForward',
			value: 'deepLyingForward',
			tooltip: 'profile.roles.deepLyingForward.description'
		},
		{
			label: 'profile.roles.defensiveForward',
			value: 'defensiveForward',
			tooltip: 'profile.roles.defensiveForward.description'
		},
		{ label: 'profile.roles.targetMan', value: 'targetMan', tooltip: 'profile.roles.targetMan.description' },
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' }
	],
	RF: [
		{
			label: 'profile.roles.completeForward',
			value: 'completeForward',
			tooltip: 'profile.roles.completeForward.description'
		},
		{
			label: 'profile.roles.advancedForward',
			value: 'advancedForward',
			tooltip: 'profile.roles.advancedForward.description'
		},
		{ label: 'profile.roles.falseNine', value: 'falseNine', tooltip: 'profile.roles.falseNine.description' },
		{ label: 'profile.roles.poacher', value: 'poacher', tooltip: 'profile.roles.poacher.description' },
		{
			label: 'profile.roles.deepLyingForward',
			value: 'deepLyingForward',
			tooltip: 'profile.roles.deepLyingForward.description'
		},
		{
			label: 'profile.roles.defensiveForward',
			value: 'defensiveForward',
			tooltip: 'profile.roles.defensiveForward.description'
		},
		{ label: 'profile.roles.targetMan', value: 'targetMan', tooltip: 'profile.roles.targetMan.description' },
		{ label: 'profile.roles.trequartista', value: 'trequartista', tooltip: 'profile.roles.trequartista.description' }
	],
	movOnBall: [
		{
			label: 'profile.preferredMoves.cutsInside',
			value: 'cutsInside',
			tooltip: 'profile.preferredMoves.cutsInside.description'
		},
		{
			label: 'profile.preferredMoves.knocksBallPastOpponent',
			value: 'knocksBallPastOpponent',
			tooltip: 'profile.preferredMoves.knocksBallPastOpponent.description'
		},
		{
			label: 'profile.preferredMoves.runsWithBallRarely',
			value: 'runsWithBallRarely',
			tooltip: 'profile.preferredMoves.runsWithBallRarely.description'
		},
		{
			label: 'profile.preferredMoves.runsWithBallOften',
			value: 'runsWithBallOften',
			tooltip: 'profile.preferredMoves.runsWithBallOften.description'
		},
		{
			label: 'profile.preferredMoves.runsWithBallDownLeft',
			value: 'runsWithBallDownLeft',
			tooltip: 'profile.preferredMoves.runsWithBallDownLeft.description'
		},
		{
			label: 'profile.preferredMoves.runsWithBallDownRight',
			value: 'runsWithBallDownRight',
			tooltip: 'profile.preferredMoves.runsWithBallDownRight.description'
		},
		{
			label: 'profile.preferredMoves.runsWithBallThroughCentre',
			value: 'runsWithBallThroughCentre',
			tooltip: 'profile.preferredMoves.runsWithBallThroughCentre.description'
		},
		{
			label: 'profile.preferredMoves.stopsPlay',
			value: 'stopsPlay',
			tooltip: 'profile.preferredMoves.stopsPlay.description'
		}
	],
	movOffBall: [
		{
			label: 'profile.preferredMoves.arrivesLateInOpponentsArea',
			value: 'arrivesLateInOpponentsArea',
			tooltip: 'profile.preferredMoves.arrivesLateInOpponentsArea.description'
		},
		{
			label: 'profile.preferredMoves.comesDeepToGetBall',
			value: 'comesDeepToGetBall',
			tooltip: 'profile.preferredMoves.comesDeepToGetBall.description'
		},
		{
			label: 'profile.preferredMoves.getsForwardWheneverPossible',
			value: 'getsForwardWheneverPossible',
			tooltip: 'profile.preferredMoves.getsForwardWheneverPossible.description'
		},
		{
			label: 'profile.preferredMoves.getsIntoOppositionArea',
			value: 'getsIntoOppositionArea',
			tooltip: 'profile.preferredMoves.getsIntoOppositionArea.description'
		},
		{
			label: 'profile.preferredMoves.hugsLine',
			value: 'hugsLine',
			tooltip: 'profile.preferredMoves.hugsLine.description'
		},
		{
			label: 'profile.preferredMoves.LikesToTryToBeatOffsideTrap',
			value: 'LikesToTryToBeatOffsideTrap',
			tooltip: 'profile.preferredMoves.LikesToTryToBeatOffsideTrap.description'
		},
		{
			label: 'profile.preferredMoves.movesIntoChannels',
			value: 'movesIntoChannels',
			tooltip: 'profile.preferredMoves.movesIntoChannels.description'
		},
		{
			label: 'profile.preferredMoves.penalityBoxPlayer',
			value: 'penalityBoxPlayer',
			tooltip: 'profile.preferredMoves.penalityBoxPlayer.description'
		},
		{
			label: 'profile.preferredMoves.playsOneTwos',
			value: 'playsOneTwos',
			tooltip: 'profile.preferredMoves.playsOneTwos.description'
		},
		{
			label: 'profile.preferredMoves.playsWithBackToGoal',
			value: 'playsWithBackToGoal',
			tooltip: 'profile.preferredMoves.playsWithBackToGoal.description'
		},
		{
			label: 'profile.preferredMoves.staysBackAtAllTimes',
			value: 'staysBackAtAllTimes',
			tooltip: 'profile.preferredMoves.staysBackAtAllTimes.description'
		}
	],
	passing: [
		{
			label: 'profile.preferredMoves.dictatesTempo',
			value: 'dictatesTempo',
			tooltip: 'profile.preferredMoves.dictatesTempo.description'
		},
		{
			label: 'profile.preferredMoves.likesToSwitchBallToOtherFlank',
			value: 'likesToSwitchBallToOtherFlank',
			tooltip: 'profile.preferredMoves.likesToSwitchBallToOtherFlank.description'
		},
		{
			label: 'profile.preferredMoves.looksForPassRatherThanAttemptingToScore',
			value: 'looksForPassRatherThanAttemptingToScore',
			tooltip: 'profile.preferredMoves.looksForPassRatherThanAttemptingToScore.description'
		},
		{
			label: 'profile.preferredMoves.playsNoThroughBalls',
			value: 'playsNoThroughBalls',
			tooltip: 'profile.preferredMoves.playsNoThroughBalls.description'
		},
		{
			label: 'profile.preferredMoves.playsShortSimplePasses',
			value: 'playsShortSimplePasses',
			tooltip: 'profile.preferredMoves.playsShortSimplePasses.description'
		},
		{
			label: 'profile.preferredMoves.triesKillerBallsOften',
			value: 'triesKillerBallsOften',
			tooltip: 'profile.preferredMoves.triesKillerBallsOften.description'
		},
		{
			label: 'profile.preferredMoves.triesLongRangePasses',
			value: 'triesLongRangePasses',
			tooltip: 'profile.preferredMoves.triesLongRangePasses.description'
		},
		{
			label: 'profile.preferredMoves.useLongThrowToStartCounterAttacks',
			value: 'useLongThrowToStartCounterAttacks',
			tooltip: 'profile.preferredMoves.useLongThrowToStartCounterAttacks.description'
		}
	],
	finishing: [
		{
			label: 'profile.preferredMoves.attemptsOverheadKicks',
			value: 'attemptsOverheadKicks',
			tooltip: 'profile.preferredMoves.attemptsOverheadKicks.description'
		},
		{
			label: 'profile.preferredMoves.hitsFreeKicksWithPower',
			value: 'hitsFreeKicksWithPower',
			tooltip: 'profile.preferredMoves.hitsFreeKicksWithPower.description'
		},
		{
			label: 'profile.preferredMoves.likesToLobKeeper',
			value: 'likesToLobKeeper',
			tooltip: 'profile.preferredMoves.likesToLobKeeper.description'
		},
		{
			label: 'profile.preferredMoves.likesToRoundKeeper',
			value: 'likesToRoundKeeper',
			tooltip: 'profile.preferredMoves.likesToRoundKeeper.description'
		},
		{
			label: 'profile.preferredMoves.placesShots',
			value: 'placesShots',
			tooltip: 'profile.preferredMoves.placesShots.description'
		},
		{
			label: 'profile.preferredMoves.refrainsFromTakingLongShots',
			value: 'refrainsFromTakingLongShots',
			tooltip: 'profile.preferredMoves.refrainsFromTakingLongShots.description'
		},
		{
			label: 'profile.preferredMoves.shootsFromDistance',
			value: 'shootsFromDistance',
			tooltip: 'profile.preferredMoves.shootsFromDistance.description'
		},
		{
			label: 'profile.preferredMoves.shootsWithPower',
			value: 'shootsWithPower',
			tooltip: 'profile.preferredMoves.shootsWithPower.description'
		},
		{
			label: 'profile.preferredMoves.triesFirstTimeShots',
			value: 'triesFirstTimeShots',
			tooltip: 'profile.preferredMoves.triesFirstTimeShots.description'
		},
		{
			label: 'profile.preferredMoves.triesLongRangeFreeKicks',
			value: 'triesLongRangeFreeKicks',
			tooltip: 'profile.preferredMoves.triesLongRangeFreeKicks.description'
		}
	],
	defending: [
		{
			label: 'profile.preferredMoves.divesIntoTackles',
			value: 'divesIntoTackles',
			tooltip: 'profile.preferredMoves.divesIntoTackles.description'
		},
		{
			label: 'profile.preferredMoves.doesNotDiveIntoTackles',
			value: 'doesNotDiveIntoTackles',
			tooltip: 'profile.preferredMoves.doesNotDiveIntoTackles.description'
		},
		{
			label: 'profile.preferredMoves.marksOpponentTightly',
			value: 'marksOpponentTightly',
			tooltip: 'profile.preferredMoves.marksOpponentTightly.description'
		}
	],
	technique: [
		{
			label: 'profile.preferredMoves.attemptsToDevelopWeakerFoot',
			value: 'attemptsToDevelopWeakerFoot',
			tooltip: 'profile.preferredMoves.attemptsToDevelopWeakerFoot.description'
		},
		{
			label: 'profile.preferredMoves.avoidsUsingWeakerFoot',
			value: 'avoidsUsingWeakerFoot',
			tooltip: 'profile.preferredMoves.avoidsUsingWeakerFoot.description'
		},
		{
			label: 'profile.preferredMoves.curlsBall',
			value: 'curlsBall',
			tooltip: 'profile.preferredMoves.curlsBall.description'
		},
		{
			label: 'profile.preferredMoves.dwellsOnBall',
			value: 'dwellsOnBall',
			tooltip: 'profile.preferredMoves.dwellsOnBall.description'
		},
		{
			label: 'profile.preferredMoves.possessesLongFlatThrow',
			value: 'possessesLongFlatThrow',
			tooltip: 'profile.preferredMoves.possessesLongFlatThrow.description'
		},
		{
			label: 'profile.preferredMoves.triesToPlayWayOutOfTrouble',
			value: 'triesToPlayWayOutOfTrouble',
			tooltip: 'profile.preferredMoves.triesToPlayWayOutOfTrouble.description'
		}
	]
};
