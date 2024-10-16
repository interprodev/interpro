module.exports = {
	lowerCaseIncludes: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
	lowerCaseEquals: (a, b) => String(a).toLowerCase() === String(b).toLowerCase(),
	arrayLowercaseIncludes: (arr, val) => arr.map(item => String(item).toLowerCase()).includes(String(val).toLowerCase())
};
