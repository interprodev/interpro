export const PRIMARIES: string[] = [
	'#ffa600',
	'#f95d6a',
	'#d45087',
	'#a05195',
	'#665191',
	'#2f4b7c',
	'#003f5c',
	'#456db5'
];
export const primariesExtra: string[] = ['#039e6f'];
export const annotations: string[] = ['#fbddbe', '#ffd6d5', '#ffd5e5', '#fcd8f5', '#ebdcff', '#d6e2ff', '#c2e7ff'];
export const ADVANCED_COLORS: string[] = ['#C33C54', '#0006EF', '#62C370'];
export const advancedAnnotations: string[] = ['#b77b86', '#8d91ad', '#93bc99'];
export const radarBackground = 'rgba(173, 216, 230, 0.2)';
export const WORKLOAD_COLORS: string[] = ['#ffffff', '#F61111', '#a05195', '#2f4b7c', '#14B85E', '#F7C31A', '#ADD8E6'];

export const stringToColour = (str: string): string => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	let colour = '#';
	for (let i = 0; i < 3; i++) {
		const value = (hash >> (i * 8)) & 0xff;
		colour += ('00' + value.toString(16)).substr(-2);
	}

	return colour;
};
