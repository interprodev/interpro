// TODO: REVIEW
const positionCategories = ['goalkeeper', 'defender', 'midfielder', 'striker'];
const positionRugbyCategories = ['frontRow', 'secondRow', 'thirdRow', 'half', 'centre', 'back'];
const positionRugbyLeagueCategories = ['frontRow', 'secondRow', 'thirdRow', 'half', 'centre', 'back'];
const positionVolleyballCategories = ['hitter', 'blocker', 'libero', 'setter'];
const positionBasketballCategories = ['forward', 'center', 'guard'];

const fieldPositions = new Map([
	['GK', 'goalkeeper'],
	['LB', 'defender'],
	['CBL', 'defender'],
	['CBC', 'defender'],
	['CBR', 'defender'],
	['RB', 'defender'],
	['LWB', 'midfielder'],
	['DLM', 'midfielder'],
	['DCM', 'midfielder'],
	['DRM', 'midfielder'],
	['RWB', 'midfielder'],
	['LM', 'midfielder'],
	['LCM', 'midfielder'],
	['CM', 'midfielder'],
	['RCM', 'midfielder'],
	['RM', 'midfielder'],
	['LW', 'midfielder'],
	['RAM', 'midfielder'],
	['CAM', 'midfielder'],
	['LAM', 'midfielder'],
	['RW', 'midfielder'],
	['LF', 'striker'],
	['S', 'striker'],
	['RF', 'striker'],
	['FW', 'striker'],
	['MD', 'midfielder'],
	['DF', 'defender']
]);
const fieldRugbyPositions = new Map([
	['LHP', 'frontRow'],
	['HK', 'frontRow'],
	['THP', 'frontRow'],
	['LO4', 'secondRow'],
	['LO5', 'secondRow'],
	['BSF', 'thirdRow'],
	['OSF', 'thirdRow'],
	['N8', 'thirdRow'],
	['SH', 'half'],
	['FH', 'half'],
	['IC', 'centre'],
	['OC', 'centre'],
	['LW', 'back'],
	['RW', 'back'],
	['FB', 'back']
]);
const fieldRugbyLeaguePositions = new Map([
	['LHP', 'frontRow'],
	['HK', 'frontRow'],
	['THP', 'frontRow'],
	['N11', 'secondRow'],
	['N12', 'secondRow'],
	['LO', 'thirdRow'],
	['SH', 'half'],
	['SO', 'half'],
	['IC', 'centre'],
	['OC', 'centre'],
	['LW', 'back'],
	['RW', 'back'],
	['FB', 'back']
]);
const fieldVolleyballPositions = new Map([
	['OPH', 'hitter'],
	['NMB', 'blocker'],
	['RH', 'hitter'],
	['SE', 'setter'],
	['MB', 'blocker'],
	['OUH', 'hitter'],
	['L', 'libero']
]);
const fieldBasketballPositions = new Map([
	['SF', 'forward'],
	['PF', 'forward'],
	['C', 'center'],
	['SG', 'guard'],
	['PG', 'guard']
]);

module.exports = {
	getPositionCategories: function (sport = 'football') {
		switch (sport) {
			case 'rugby':
				return positionRugbyCategories;
			case 'rugbyLeague':
				return positionRugbyLeagueCategories;
			case 'volleyball':
				return positionVolleyballCategories;
			case 'basketball':
				return positionBasketballCategories;
			case 'football':
			default:
				return positionCategories;
		}
	},

	getFieldPosition: function (key, sport = 'football') {
		switch (sport) {
			case 'rugby':
				return fieldRugbyPositions.get(key) || 'notSet';
			case 'rugbyLeague':
				return fieldRugbyLeaguePositions.get(key) || 'notSet';
			case 'volleyball':
				return fieldVolleyballPositions.get(key) || 'notSet';
			case 'basketball':
				return fieldBasketballPositions.get(key) || 'notSet';
			case 'football':
			default:
				return fieldPositions.get(key) || 'notSet';
		}
	},

	football: {
		limb: 'foot',
		lineup: 11,
		bench: 7,
		sets: 2,
		minutesPerSet: 45,
		extraTime: true,
		extraTimeMinutes: null,
		scoreType: 'score',
		conversion: false,
		roles: ['goalkeeper', 'defender', 'midfielder', 'striker'],
		positions: [
			'GK',
			'LB',
			'CBL',
			'CBC',
			'CBR',
			'RB',
			'LWB',
			'DLM',
			'DCM',
			'DRM',
			'RWB',
			'LM',
			'LCM',
			'CM',
			'RCM',
			'RM',
			'LW',
			'RAM',
			'CAM',
			'LAM',
			'RW',
			'LF',
			'S',
			'RF',
			'FW',
			'MD',
			'DF'
		],
		positionsByRole: {
			GK: 'goalkeeper',
			LB: 'defender',
			CBL: 'defender',
			CBC: 'defender',
			CBR: 'defender',
			RB: 'defender',
			LWB: 'midfielder',
			DLM: 'midfielder',
			DCM: 'midfielder',
			DRM: 'midfielder',
			RWB: 'midfielder',
			LM: 'midfielder',
			LCM: 'midfielder',
			CM: 'midfielder',
			RCM: 'midfielder',
			RM: 'midfielder',
			LW: 'midfielder',
			RAM: 'midfielder',
			CAM: 'midfielder',
			LAM: 'midfielder',
			RW: 'midfielder',
			LF: 'striker',
			S: 'striker',
			RF: 'striker',
			FW: 'striker',
			MD: 'midfielder',
			DF: 'defender'
		},
		fieldCoordinates: [
			{
				name: '3-3-1-3',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 3,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 7,
				p5x: 10,
				p5y: 8,
				p6x: 10,
				p6y: 5,
				p7x: 10,
				p7y: 2,
				p8x: 13,
				p8y: 5,
				p9x: 15,
				p9y: 2,
				p10x: 16,
				p10y: 5,
				p11x: 15,
				p11y: 8
			},
			{
				name: '3-4-1-2',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 3,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 7,
				p5x: 11,
				p5y: 2,
				p6x: 10,
				p6y: 4,
				p7x: 10,
				p7y: 6,
				p8x: 11,
				p8y: 8,
				p9x: 16,
				p9y: 3,
				p10x: 14,
				p10y: 5,
				p11x: 16,
				p11y: 7
			},
			{
				name: '3-4-2-1',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 3,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 7,
				p5x: 10,
				p5y: 2,
				p6x: 9,
				p6y: 4,
				p7x: 9,
				p7y: 6,
				p8x: 10,
				p8y: 8,
				p9x: 13,
				p9y: 4,
				p10x: 13,
				p10y: 6,
				p11x: 16,
				p11y: 5
			},
			{
				name: '3-4-3',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 3,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 7,
				p5x: 11,
				p5y: 2,
				p6x: 10,
				p6y: 4,
				p7x: 10,
				p7y: 6,
				p8x: 11,
				p8y: 8,
				p9x: 15,
				p9y: 3,
				p10x: 16,
				p10y: 5,
				p11x: 15,
				p11y: 7
			},
			{
				name: '3-5-2-(A)',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 2,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 8,
				p5x: 12,
				p5y: 8,
				p6x: 12,
				p6y: 2,
				p7x: 16,
				p7y: 4,
				p8x: 9,
				p8y: 3,
				p9x: 11,
				p9y: 5,
				p10x: 9,
				p10y: 7,
				p11x: 16,
				p11y: 6
			},
			{
				name: '3-5-2-(B)',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 2,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 8,
				p5x: 12,
				p5y: 8,
				p6x: 12,
				p6y: 2,
				p7x: 13,
				p7y: 5,
				p8x: 9,
				p8y: 3,
				p9x: 9,
				p9y: 7,
				p10x: 16,
				p10y: 6,
				p11x: 16,
				p11y: 4
			},
			{
				name: '3-5-2-(C)',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 2,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 8,
				p5x: 12,
				p5y: 9,
				p6x: 12,
				p6y: 1,
				p7x: 11,
				p7y: 3,
				p8x: 9,
				p8y: 5,
				p9x: 11,
				p9y: 7,
				p10x: 16,
				p10y: 4,
				p11x: 16,
				p11y: 6
			},
			{
				name: '4-1-2-1-2(A)',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 12,
				p6y: 2,
				p7x: 16,
				p7y: 3,
				p8x: 8,
				p8y: 5,
				p9x: 12,
				p9y: 8,
				p10x: 14,
				p10y: 5,
				p11x: 16,
				p11y: 7
			},
			{
				name: '4-1-2-1-2(B)',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 11,
				p6y: 3,
				p7x: 16,
				p7y: 3,
				p8x: 8,
				p8y: 5,
				p9x: 11,
				p9y: 7,
				p10x: 13,
				p10y: 5,
				p11x: 16,
				p11y: 7
			},
			{
				name: '4-1-4-1',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 13,
				p6y: 2,
				p7x: 12,
				p7y: 4,
				p8x: 8,
				p8y: 5,
				p9x: 13,
				p9y: 8,
				p10x: 12,
				p10y: 6,
				p11x: 16,
				p11y: 5
			},
			{
				name: '4-2-2-2',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 12,
				p6y: 2,
				p7x: 16,
				p7y: 4,
				p8x: 10,
				p8y: 4,
				p9x: 10,
				p9y: 6,
				p10x: 12,
				p10y: 8,
				p11x: 16,
				p11y: 6
			},
			{
				name: '4-2-3-1(A)',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 13,
				p6y: 2,
				p7x: 16,
				p7y: 5,
				p8x: 9,
				p8y: 3,
				p9x: 9,
				p9y: 7,
				p10x: 13,
				p10y: 8,
				p11x: 12,
				p11y: 5
			},
			{
				name: '4-2-3-1(B)',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 14,
				p6y: 3,
				p7x: 16,
				p7y: 5,
				p8x: 9,
				p8y: 3,
				p9x: 9,
				p9y: 7,
				p10x: 14,
				p10y: 7,
				p11x: 12,
				p11y: 5
			},
			{
				name: '4-2-4',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 14,
				p6y: 2,
				p7x: 16,
				p7y: 4,
				p8x: 10,
				p8y: 3,
				p9x: 10,
				p9y: 7,
				p10x: 14,
				p10y: 8,
				p11x: 16,
				p11y: 6
			},
			{
				name: '4-3-1-2',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 10,
				p6y: 3,
				p7x: 8,
				p7y: 5,
				p8x: 10,
				p8y: 7,
				p9x: 16,
				p9y: 7,
				p10x: 14,
				p10y: 5,
				p11x: 16,
				p11y: 3
			},
			{
				name: '4-3-2-1',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 2,
				p3x: 4,
				p3y: 4,
				p4x: 4,
				p4y: 6,
				p5x: 5,
				p5y: 8,
				p6x: 13,
				p6y: 4,
				p7x: 8,
				p7y: 5,
				p8x: 10,
				p8y: 3,
				p9x: 10,
				p9y: 7,
				p10x: 13,
				p10y: 6,
				p11x: 16,
				p11y: 5
			},
			{
				name: '4-3-3-(A)',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 2,
				p3x: 4,
				p3y: 4,
				p4x: 4,
				p4y: 6,
				p5x: 5,
				p5y: 8,
				p6x: 15,
				p6y: 3,
				p7x: 9,
				p7y: 5,
				p8x: 10,
				p8y: 3,
				p9x: 10,
				p9y: 7,
				p10x: 16,
				p10y: 5,
				p11x: 15,
				p11y: 7
			},
			{
				name: '4-3-3-(B)',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 2,
				p3x: 4,
				p3y: 4,
				p4x: 4,
				p4y: 6,
				p5x: 5,
				p5y: 8,
				p6x: 15,
				p6y: 3,
				p7x: 8,
				p7y: 5,
				p8x: 10,
				p8y: 3,
				p9x: 10,
				p9y: 7,
				p10x: 16,
				p10y: 5,
				p11x: 15,
				p11y: 7
			},
			{
				name: '4-3-3-(C)',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 2,
				p3x: 4,
				p3y: 4,
				p4x: 4,
				p4y: 6,
				p5x: 5,
				p5y: 8,
				p6x: 9,
				p6y: 3,
				p7x: 9,
				p7y: 7,
				p8x: 12,
				p8y: 5,
				p9x: 15,
				p9y: 7,
				p10x: 15,
				p10y: 3,
				p11x: 16,
				p11y: 5
			},
			{
				name: '4-4-1-1',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 11,
				p6y: 2,
				p7x: 13,
				p7y: 5,
				p8x: 9,
				p8y: 4,
				p9x: 9,
				p9y: 6,
				p10x: 16,
				p10y: 5,
				p11x: 11,
				p11y: 8
			},
			{
				name: '4-4-2',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 11,
				p6y: 2,
				p7x: 15,
				p7y: 3,
				p8x: 10,
				p8y: 4,
				p9x: 10,
				p9y: 6,
				p10x: 15,
				p10y: 7,
				p11x: 11,
				p11y: 8
			},
			{
				name: '4-5-1',
				p1x: 1,
				p1y: 5,
				p2x: 6,
				p2y: 2,
				p3x: 5,
				p3y: 4,
				p4x: 5,
				p4y: 6,
				p5x: 6,
				p5y: 8,
				p6x: 12,
				p6y: 1,
				p7x: 11,
				p7y: 3,
				p8x: 9,
				p8y: 5,
				p9x: 11,
				p9y: 7,
				p10x: 12,
				p10y: 9,
				p11x: 16,
				p11y: 5
			},
			{
				name: '5-2-1-2',
				p1x: 1,
				p1y: 5,
				p2x: 7,
				p2y: 2,
				p3x: 4,
				p3y: 5,
				p4x: 4,
				p4y: 7,
				p5x: 7,
				p5y: 8,
				p6x: 4,
				p6y: 3,
				p7x: 10,
				p7y: 4,
				p8x: 10,
				p8y: 6,
				p9x: 13,
				p9y: 5,
				p10x: 16,
				p10y: 6,
				p11x: 16,
				p11y: 4
			},
			{
				name: '5-2-2-1',
				p1x: 1,
				p1y: 5,
				p2x: 8,
				p2y: 2,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 7,
				p5x: 8,
				p5y: 8,
				p6x: 5,
				p6y: 3,
				p7x: 11,
				p7y: 4,
				p8x: 11,
				p8y: 6,
				p9x: 15,
				p9y: 7,
				p10x: 15,
				p10y: 3,
				p11x: 16,
				p11y: 5
			},
			{
				name: '5-2-3',
				p1x: 1,
				p1y: 5,
				p2x: 8,
				p2y: 2,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 7,
				p5x: 8,
				p5y: 8,
				p6x: 5,
				p6y: 3,
				p7x: 11,
				p7y: 4,
				p8x: 11,
				p8y: 6,
				p9x: 16,
				p9y: 7,
				p10x: 16,
				p10y: 3,
				p11x: 16,
				p11y: 5
			},
			{
				name: '5-3-2',
				p1x: 1,
				p1y: 5,
				p2x: 8,
				p2y: 2,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 7,
				p5x: 8,
				p5y: 8,
				p6x: 5,
				p6y: 3,
				p7x: 12,
				p7y: 5,
				p8x: 12,
				p8y: 3,
				p9x: 12,
				p9y: 7,
				p10x: 16,
				p10y: 6,
				p11x: 16,
				p11y: 4
			},
			{
				name: '5-4-1',
				p1x: 1,
				p1y: 5,
				p2x: 5,
				p2y: 3,
				p3x: 5,
				p3y: 5,
				p4x: 5,
				p4y: 7,
				p5x: 11,
				p5y: 2,
				p6x: 10,
				p6y: 4,
				p7x: 10,
				p7y: 6,
				p8x: 11,
				p8y: 8,
				p9x: 6,
				p9y: 1,
				p10x: 16,
				p10y: 5,
				p11x: 6,
				p11y: 9
			}
		],
		tacticBoardCoordinates: [
			{ p: 'GK', x: 0.05, y: 0.5 },

			{ p: 'LB', x: 0.2, y: 0.1 },
			{ p: 'CBL', x: 0.2, y: 0.3 },
			{ p: 'CBC', x: 0.2, y: 0.5 },
			{ p: 'DF', x: 0.2, y: 0.5 },
			{ p: 'CBR', x: 0.2, y: 0.7 },
			{ p: 'RB', x: 0.2, y: 0.9 },

			{ p: 'LWB', x: 0.35, y: 0.1 },
			{ p: 'DLM', x: 0.35, y: 0.3 },
			{ p: 'DCM', x: 0.35, y: 0.5 },
			{ p: 'DRM', x: 0.35, y: 0.7 },
			{ p: 'RWB', x: 0.35, y: 0.9 },

			{ p: 'LM', x: 0.5, y: 0.1 },
			{ p: 'LCM', x: 0.5, y: 0.3 },
			{ p: 'CM', x: 0.5, y: 0.5 },
			{ p: 'MD', x: 0.5, y: 0.5 },
			{ p: 'RCM', x: 0.5, y: 0.7 },
			{ p: 'RM', x: 0.5, y: 0.9 },

			{ p: 'LW', x: 0.65, y: 0.1 },
			{ p: 'LAM', x: 0.65, y: 0.3 },
			{ p: 'CAM', x: 0.65, y: 0.5 },
			{ p: 'RAM', x: 0.65, y: 0.7 },
			{ p: 'RW', x: 0.65, y: 0.9 },

			{ p: 'LF', x: 0.8, y: 0.3 },
			{ p: 'S', x: 0.8, y: 0.5 },
			{ p: 'FW', x: 0.8, y: 0.5 },
			{ p: 'RF', x: 0.8, y: 0.7 }
		]
	},
	volleyball: {
		limb: 'hand',
		lineup: 7,
		bench: 5,
		sets: 5,
		minutesPerSet: null,
		extraTime: false,
		extraTimeMinutes: null,
		scoreType: 'score',
		conversion: false,
		roles: ['hitter', 'blocker', 'libero', 'setter'],
		positions: ['OPH', 'NMB', 'RH', 'SE', 'MB', 'OUH', 'L'],
		positionsByRole: {
			OPH: 'hitter',
			NMB: 'blocker',
			RH: 'hitter',
			SE: 'setter',
			MB: 'blocker',
			OUH: 'hitter',
			L: 'libero'
		},
		fieldCoordinates: [
			{
				// SE
				p1x: 7,
				p1y: 8,

				// RH
				p2x: 13,
				p2y: 8,

				// NMB
				p3x: 16,
				p3y: 5,

				// OPH
				p4x: 13,
				p4y: 2,

				// OUH
				p5x: 7,
				p5y: 2,

				// MB
				p6x: 6,
				p6y: 5,

				// L
				p7x: 1,
				p7y: 5
			}
		],
		tacticBoardCoordinates: [
			{ p: 'OPH', x: 0.8, y: 0.2 },
			{ p: 'NMB', x: 0.8, y: 0.5 },
			{ p: 'RH', x: 0.8, y: 0.7 },
			{ p: 'OUH', x: 0.3, y: 0.2 },
			{ p: 'MB', x: 0.3, y: 0.5 },
			{ p: 'SE', x: 0.3, y: 0.7 },
			{ p: 'L', x: 0.1, y: 0.5 }
		]
	},
	rugby: {
		limb: 'foot',
		lineup: 15,
		bench: 8,
		sets: 2,
		minutesPerSet: 40,
		extraTime: false,
		extraTimeMinutes: null,
		scoreType: 'points',
		conversion: true,
		roles: ['frontRow', 'secondRow', 'thirdRow', 'half', 'centre', 'back'],
		positions: ['LHP', 'HK', 'THP', 'LO4', 'LO5', 'BSF', 'N8', 'OSF', 'SH', 'FH', 'LW', 'IC', 'OC', 'FB', 'RW'],
		positionsByRole: {
			LHP: 'frontRow',
			HK: 'frontRow',
			THP: 'frontRow',
			LO4: 'secondRow',
			LO5: 'secondRow',
			BSF: 'thirdRow',
			OSF: 'thirdRow',
			N8: 'thirdRow',
			SH: 'half',
			FH: 'half',
			IC: 'centre',
			OC: 'centre',
			LW: 'back',
			RW: 'back',
			FB: 'back'
		},
		fieldCoordinates: [
			{
				// THP
				p1x: 17,
				p1y: 3,

				// HK
				p2x: 17,
				p2y: 5,

				// LHP
				p3x: 17,
				p3y: 7,

				// LO4
				p4x: 14,
				p4y: 4,

				// LO5
				p5x: 14,
				p5y: 6,

				// BSF
				p6x: 12,
				p6y: 2,

				// N8
				p7x: 11,
				p7y: 5,

				// OSF
				p8x: 12,
				p8y: 8,

				// SH
				p9x: 8,
				p9y: 2,

				// FH
				p10x: 7,
				p10y: 4,

				// LW
				p11x: 2,
				p11y: 1,

				// IC
				p12x: 6,
				p12y: 6,

				// OC
				p13x: 5,
				p13y: 8,

				// RW
				p14x: 2,
				p14y: 9,

				// FB
				p15x: 1,
				p15y: 5
			}
		],
		tacticBoardCoordinates: [
			{ p: 'LHP', x: 0.9, y: 0.3 },
			{ p: 'HK', x: 0.9, y: 0.5 },
			{ p: 'THP', x: 0.9, y: 0.7 },

			{ p: 'LO4', x: 0.8, y: 0.4 },
			{ p: 'LO5', x: 0.8, y: 0.6 },

			{ p: 'BSF', x: 0.7, y: 0.3 },
			{ p: 'N8', x: 0.65, y: 0.5 },
			{ p: 'OSF', x: 0.7, y: 0.7 },

			{ p: 'SH', x: 0.5, y: 0.3 },
			{ p: 'FH', x: 0.45, y: 0.4 },

			{ p: 'IC', x: 0.4, y: 0.5 },
			{ p: 'OC', x: 0.35, y: 0.6 },

			{ p: 'LW', x: 0.2, y: 0.1 },
			{ p: 'FB', x: 0.1, y: 0.5 },
			{ p: 'RW', x: 0.2, y: 0.9 }
		]
	},
	rugbyLeague: {
		limb: 'foot',
		lineup: 13,
		bench: 4,
		sets: 2,
		minutesPerSet: 40,
		extraTime: false,
		extraTimeMinutes: null,
		scoreType: 'points',
		conversion: true,
		roles: ['frontRow', 'secondRow', 'thirdRow', 'half', 'centre', 'back'],
		positions: ['FB', 'RW', 'OC', 'IC', 'LW', 'SO', 'SH', 'THP', 'HK', 'LHP', 'N11', 'N12', 'LO'],
		positionsByRole: {
			LHP: 'frontRow',
			HK: 'frontRow',
			THP: 'frontRow',
			N11: 'secondRow',
			N12: 'secondRow',
			LO: 'thirdRow',
			SH: 'half',
			SO: 'half',
			IC: 'centre',
			OC: 'centre',
			LW: 'back',
			RW: 'back',
			FB: 'back'
		},
		fieldCoordinates: [
			{
				// FB
				p1x: 1,
				p1y: 5,

				// RW
				p2x: 2,
				p2y: 9,

				// OC
				p3x: 5,
				p3y: 8,

				// IC
				p4x: 6,
				p4y: 6,

				// LW
				p5x: 2,
				p5y: 1,

				// SO
				p6x: 7,
				p6y: 4,

				// SH
				p7x: 8,
				p7y: 2,

				// LHP
				p8x: 17,
				p8y: 7,

				// HK
				p9x: 17,
				p9y: 5,

				// THP
				p10x: 17,
				p10y: 3,

				// N11
				p11x: 14,
				p11y: 6,

				// N12
				p12x: 14,
				p12y: 4,

				// N8
				p13x: 11,
				p13y: 5
			}
		],
		tacticBoardCoordinates: [
			{ p: 'LHP', x: 0.9, y: 0.3 },
			{ p: 'HK', x: 0.9, y: 0.5 },
			{ p: 'THP', x: 0.9, y: 0.7 },

			{ p: 'N12', x: 0.8, y: 0.4 },
			{ p: 'N11', x: 0.8, y: 0.6 },

			{ p: 'LO', x: 0.65, y: 0.5 },

			{ p: 'SH', x: 0.5, y: 0.3 },
			{ p: 'SO', x: 0.45, y: 0.4 },

			{ p: 'IC', x: 0.4, y: 0.5 },
			{ p: 'OC', x: 0.35, y: 0.6 },

			{ p: 'LW', x: 0.2, y: 0.1 },
			{ p: 'FB', x: 0.1, y: 0.5 },
			{ p: 'RW', x: 0.2, y: 0.9 }
		]
	},
	basketball: {
		limb: 'hand',
		lineup: 5,
		bench: 15,
		sets: 4,
		minutesPerSet: 10,
		extraTime: false,
		extraTimeMinutes: null,
		scoreType: 'points',
		conversion: false,
		roles: ['forward', 'center', 'guard'],
		positions: ['SF', 'PF', 'C', 'SG', 'PG'],
		positionsByRole: {
			SF: 'forward',
			PF: 'forward',
			C: 'center',
			SG: 'guard',
			PG: 'guard'
		},
		fieldCoordinates: [
			{
				// PG
				p1x: 3,
				p1y: 5,

				// SG
				p2x: 6,
				p2y: 8,

				// C
				p3x: 11,
				p3y: 4,

				// PF
				p4x: 14,
				p4y: 7,

				// SF
				p5x: 15,
				p5y: 3
			}
		],
		tacticBoardCoordinates: [
			{ p: 'PG', x: 0.2, y: 0.5 },
			{ p: 'SG', x: 0.4, y: 0.8 },
			{ p: 'C', x: 0.6, y: 0.3 },
			{ p: 'PF', x: 0.8, y: 0.7 },
			{ p: 'SF', x: 0.9, y: 0.2 }
		]
	},
	iceHockey: {
		limb: 'hand',
		lineup: 6,
		bench: 14,
		sets: 3,
		minutesPerSet: 20,
		extraTime: false,
		extraTimeMinutes: null,
		scoreType: 'score',
		conversion: false,
		roles: ['goalie', 'hockeyForward', 'defenseman'],
		positions: ['G', 'LW', 'C', 'RW', 'RD', 'LD'],
		positionsByRole: {
			G: 'goalie',
			LW: 'hockeyForward',
			C: 'hockeyForward',
			RW: 'hockeyForward',
			RD: 'defenseman',
			LD: 'defenseman'
		},
		fieldCoordinates: [
			{
				// G
				p1x: 1,
				p1y: 5,

				// LD
				p2x: 8,
				p2y: 3,

				// RD
				p3x: 8,
				p3y: 7,

				// LW
				p4x: 13,
				p4y: 2,

				// FC
				p5x: 13,
				p5y: 5,

				// RW
				p6x: 13,
				p6y: 8
			}
		],
		tacticBoardCoordinates: [
			{ p: 'G', x: 0.1, y: 0.5 },
			{ p: 'LD', x: 0.4, y: 0.7 },
			{ p: 'RD', x: 0.4, y: 0.2 },
			{ p: 'LW', x: 0.8, y: 0.1 },
			{ p: 'C', x: 0.8, y: 0.5 },
			{ p: 'RW', x: 0.8, y: 0.8 }
		]
	},
	americanFootball: {
		limb: 'hand',
		lineup: 11,
		bench: 37,
		sets: 4,
		minutesPerSet: 15,
		extraTime: true,
		extraTimeMinutes: 10,
		scoreType: 'points',
		conversion: true,
		roles: ['offense', 'defense', 'specialTeam'],
		positions: [
			'QB',
			'FB',
			'HB',
			'C',
			'LOG',
			'ROG',
			'LOT',
			'ROT',
			'TE',
			'LWR',
			'RWR',
			'LDT',
			'RDT',
			'LDE',
			'RDE',
			'SLB',
			'MLB',
			'WLB',
			'LCB',
			'RCB',
			'SS',
			'FS',
			'K',
			'KOS',
			'P',
			'H',
			'LS',
			'PR',
			'KR',
			'SHI',
			'KORS',
			'PS',
			'PRS'
		],
		positionsByRole: {
			QB: 'offense',
			FB: 'offense',
			HB: 'offense',
			C: 'offense',
			LOG: 'offense',
			ROG: 'offense',
			LOT: 'offense',
			ROT: 'offense',
			TE: 'offense',
			LWR: 'offense',
			RWR: 'offense',

			LDT: 'defense',
			RDT: 'defense',
			LDE: 'defense',
			RDE: 'defense',
			SLB: 'defense',
			MLB: 'defense',
			WLB: 'defense',
			LCB: 'defense',
			RCB: 'defense',
			SS: 'defense',
			FS: 'defense',

			K: 'specialTeam',
			KOS: 'specialTeam',
			P: 'specialTeam',
			H: 'specialTeam',
			LS: 'specialTeam',
			PR: 'specialTeam',
			KR: 'specialTeam',
			SHI: 'specialTeam',
			KORS: 'specialTeam',
			PS: 'specialTeam',
			PRS: 'specialTeam'
		},
		fieldCoordinates: [
			{
				name: '_offensive',

				// halfback
				p1x: 3,
				p1y: 5,

				// fullback
				p2x: 7,
				p2y: 5,

				// quarterback
				p3x: 11,
				p3y: 5,

				// center
				p4x: 16,
				p4y: 5,

				// left guard
				p5x: 16,
				p5y: 3,

				// right guard
				p6x: 16,
				p6y: 7,

				// left tackle
				p7x: 13,
				p7y: 2,

				// right tackle
				p8x: 13,
				p8y: 8,

				// left wide receiver
				p9x: 10,
				p9y: 1,

				// tight end
				p10x: 10,
				p10y: 9,

				// right wide receiver
				p11x: 8,
				p11y: 8
			},
			{
				name: '_defensive',

				// left tackle
				p1x: 16,
				p1y: 4,

				// right tackle
				p2x: 16,
				p2y: 6,

				// left end
				p3x: 16,
				p3y: 2,

				// right end
				p4x: 16,
				p4y: 8,

				// left outside linebacker
				p5x: 12,
				p5y: 2,

				// middle linebacker
				p6x: 12,
				p6y: 5,

				// right outside linebacker
				p7x: 12,
				p7y: 8,

				// left cornerback
				p8x: 8,
				p8y: 1,

				// right cornerback
				p9x: 8,
				p9y: 9,

				// left safety
				p10x: 5,
				p10y: 4,

				// right safety
				p11x: 5,
				p11y: 6
			}
		],
		tacticBoardCoordinates: [
			{ p: 'QB', x: 0.3, y: 0.5 },
			{ p: 'FB', x: 0.2, y: 0.5 },
			{ p: 'HB', x: 0.1, y: 0.5 },

			{ p: 'C', x: 0.4, y: 0.5 },
			{ p: 'LOG', x: 0.4, y: 0.4 },
			{ p: 'ROG', x: 0.4, y: 0.6 },
			{ p: 'LOT', x: 0.4, y: 0.3 },
			{ p: 'ROT', x: 0.4, y: 0.7 },
			{ p: 'TE', x: 0.4, y: 0.8 },
			{ p: 'LWR', x: 0.4, y: 0.1 },
			{ p: 'RWR', x: 0.3, y: 0.9 },

			{ p: 'LDT', x: 0.5, y: 0.4 },
			{ p: 'RDT', x: 0.5, y: 0.6 },
			{ p: 'LDE', x: 0.5, y: 0.3 },
			{ p: 'RDE', x: 0.5, y: 0.7 },
			{ p: 'SLB', x: 0.6, y: 0.2 },
			{ p: 'MLB', x: 0.6, y: 0.5 },
			{ p: 'WLB', x: 0.6, y: 0.8 },
			{ p: 'LCB', x: 0.7, y: 0.1 },
			{ p: 'RCB', x: 0.7, y: 0.9 },
			{ p: 'SS', x: 0.8, y: 0.4 },
			{ p: 'FS', x: 0.8, y: 0.6 },

			{ p: 'K', x: 0, y: 0 },
			{ p: 'KOS', x: 0, y: 0 },
			{ p: 'P', x: 0, y: 0 },
			{ p: 'H', x: 0, y: 0 },
			{ p: 'LS', x: 0, y: 0 },
			{ p: 'PR', x: 0, y: 0 },
			{ p: 'KR', x: 0, y: 0 },
			{ p: 'SHI', x: 0, y: 0 },
			{ p: 'KORS', x: 0, y: 0 },
			{ p: 'PS', x: 0, y: 0 },
			{ p: 'PRS', x: 0, y: 0 }
		]
	},
	triathlon: {
		limb: undefined,
		lineup: 0,
		bench: 0,
		sets: 0,
		minutesPerSet: null,
		extraTime: false,
		extraTimeMinutes: null,
		scoreType: undefined,
		conversion: false,
		roles: [],
		positions: [],
		positionsByRole: {},
		fieldCoordinates: [],
		tacticBoardCoordinates: []
	}
};
