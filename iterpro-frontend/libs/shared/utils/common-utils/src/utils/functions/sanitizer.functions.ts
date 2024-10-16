export const sanitizeExpression = (resolver: string): string => {
	const curlyBraces: RegExp = /{(.+?)}/g;
	const resolved = resolver.replace(curlyBraces, (match: string) => {
		const emptyCurlyBraces: RegExp = /[{}]+/g;
		const specialCharacter: RegExp = /[s{()}/:%-.<>]+/g;
		const unrecognizedCharacter: RegExp = /�/g;
		const powerCharacter: RegExp = /²/g;
		return match
			.replace(emptyCurlyBraces, '')
			.replace(specialCharacter, '_')
			.replace(unrecognizedCharacter, '_')
			.replace(powerCharacter, '^2');
	});

	return resolved;
};
