const { flatten } = require('lodash');

module.exports = function (Agent) {
	Agent.getBonuses = async function (id, filters) {
		try {
			console.log(`[AGENT] Get all bonuses for agent ${id}...`);
			const agent = await Agent.findById(id);
			const obs$ = [agent.employmentContracts.find(), agent.transferContracts.find()];
			if (filters?.type === 'employment') obs$.splice(1, 1);
			if (filters?.type === 'transfer') obs$.splice(0, 1);
			const contracts = flatten(await Promise.all(obs$));
			const bonuses = flatten(
				await Promise.all(
					contracts
						.filter(({ status }) => filters?.active === undefined || status === filters?.active)
						.map(contract => contract.bonuses.find())
				)
			);
			return bonuses;
		} catch (e) {
			console.error(e);
			throw AgentError(e);
		}
	};
};

function AgentError(e) {
	const error = new Error(e);
	error.statusCode = e.statusCode || '500';
	error.code = 'AGENT_ERROR';
	error.name = 'AgentError';
	error.message = e.message;
	return error;
}
