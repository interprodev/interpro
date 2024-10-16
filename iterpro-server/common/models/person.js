const { flatten } = require('lodash');

module.exports = function (Person) {
	Person.getBonuses = async function (id, personType, filters) {
		try {
			console.log(`[PERSON] Get all bonuses for ${personType} ${id}...`);
			const person = await Person.app.models[personType || 'Player'].findById(id);
			const obs$ = [person.employmentContracts.find()];
			if (personType === 'Player') obs$.push(person.transferContracts.find());
			if (filters.type === 'employment') obs$.splice(1, 1);
			if (filters.type === 'transfer') obs$.splice(0, 1);
			const contracts = flatten(await Promise.all(obs$));
			const bonuses = flatten(
				await Promise.all(
					contracts
						.filter(({ status }) => filters.active === undefined || status === filters.active)
						.map(contract => contract.bonuses.find())
				)
			);
			return bonuses;
		} catch (e) {
			console.error(e);
			throw PersonError(e);
		}
	};
};

function PersonError(e) {
	const error = new Error(e);
	error.statusCode = e.statusCode || '500';
	error.code = 'PERSON_ERROR';
	error.name = 'PersonError';
	error.message = e.message;
	return error;
}
