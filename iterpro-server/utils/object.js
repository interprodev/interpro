module.exports = {
	/** returns a subset of the input object with all numeric properties cast to Number */
	toNumberProps: obj =>
		Object.fromEntries(
			Object.entries(obj)
				.filter(([_key, value]) => !isNaN(Number(value)))
				.map(([key, value]) => [key, Number(value)])
		),
	toStringProps: obj => Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, String(value)])),
	hasProps: obj => !!obj && Object.keys(obj).length > 0
};
