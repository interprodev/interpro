export const getCorrectTextColorUtil = (backgroundHex: string): string => {
	if (!backgroundHex) return '';
	const threshold = 100; /* about half of 256. Lower threshold equals more dark text on dark background  */

	const hRed = hexToR(backgroundHex);
	const hGreen = hexToG(backgroundHex);
	const hBlue = hexToB(backgroundHex);

	function hexToR(h: string) {
		return parseInt(cutHex(h).substring(0, 2), 16);
	}
	function hexToG(h: string) {
		return parseInt(cutHex(h).substring(2, 4), 16);
	}
	function hexToB(h: string) {
		return parseInt(cutHex(h).substring(4, 6), 16);
	}
	function cutHex(h: string) {
		return h.charAt(0) == '#' ? h.substring(1, 7) : h;
	}

	const cBrightness = (hRed * 299 + hGreen * 587 + hBlue * 114) / 1000;
	if (cBrightness > threshold) {
		return '#000000';
	} else {
		return '#ffffff';
	}
};

const hashCode = (str: string): number => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	return hash;
};

const intToRGB = (i: number): string => {
	const c = (i & 0x00ffffff).toString(16).toUpperCase();
	return '00000'.substring(0, 6 - c.length) + c;
};

export const getColor = (input: string): string => {
	const hash = hashCode(input);
	const rgb = intToRGB(hash);
	return '#' + rgb;
};
