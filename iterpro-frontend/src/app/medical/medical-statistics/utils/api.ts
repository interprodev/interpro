export const teamConditions = () => ({
	include: 'teamGroups'
});

const dateActive = (from, to) => ({
	date: { lte: to },
	or: [{ endDate: null }, { endDate: { gte: from } }]
});

export const injuryConditions = (from, to) => ({
	where: dateActive(from, to),
	order: 'date ASC'
});

export const playersConditions = (from, to) => ({
	include: {
		relation: 'injuries',
		scope: injuryConditions(from, to)
	}
});
