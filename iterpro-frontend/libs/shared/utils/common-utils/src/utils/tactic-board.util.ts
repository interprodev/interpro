import { SportType, getSportParameters } from '../constants/sport.constants';

interface TacticBoardCoordinate {
	p: string;
	x: number;
	y: number;
}

const w = 623;
const h = 450;
const radius = 20;

const colors = {
	// dot not substitute the hex with css variable because they need to render the colors in jsreportonline
	SELECTED: '#00cc6a',
	THIRD: '#bbbbbb',
	SECOND: '#808080',
	FIRST: '#ff6900',
	NONE: 'transparent'
};

export const getCircles = (
	selected: string,
	first: string,
	second: string,
	third: string,
	sportType: SportType = 'football'
) =>
	getPositions(sportType).map(({ p, x, y }) => ({
		p,
		x: w * x,
		y: h * y,
		r: radius,
		c: getColor(p, selected, first, second, third)
	}));

export const getMinCircles = (selected: string, first: string, second: string, third: string) =>
	getCircles(selected, first, second, third).filter(({ c }) => c !== colors.NONE);

const getColor = (position: string, selected: string, first: string, second: string, third: string) => {
	if (position === selected) return colors.SELECTED;
	else if (position === first) return colors.FIRST;
	else if (position === second) return colors.SECOND;
	else if (position === third) return colors.THIRD;
	return colors.NONE;
};

const getPositions = (sportType: SportType) => {
	return <TacticBoardCoordinate[]>getSportParameters(sportType).tacticBoardCoordinates;
};
