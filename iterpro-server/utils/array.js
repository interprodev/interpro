module.exports = {
	/** pushes elements, removing duplicates */
	addElements: (collection, ...items) => [...new Set(...collection, items)],
	/** removes nullish elements from an array */
	notEmptyPredicate: item => item !== null && item !== undefined,
	containsElements: arr => arr != null && arr.length != null && arr.length > 0
};
