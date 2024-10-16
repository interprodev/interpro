export const getFlag = (value: string): string => {
	const flag = value ? value.toLowerCase() : '';
	if (flag === 'en') return 'gb-eng';
	return flag;
};
