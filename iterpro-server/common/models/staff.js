const { flatten } = require('lodash');
const { ObjectID } = require('mongodb');

module.exports = function (Staff) {
	Staff.afterRemote('prototype.__get__employmentContracts', async ctx => {
		ctx.result = await Promise.all(
			ctx.result.map(contract => Staff.app.models.Contract.prepareContract(contract, 'EmploymentContract'))
		);
	});

	Staff.observe('after delete', async ctx => {
		try {
			console.log(`[STAFF] Deleted Staff with id ${ctx.where.id}. Deleting associated contracts...`);

			const employments = await Staff.app.models.EmploymentContract.find({
				where: { personId: ObjectID(ctx.where.id) }
			});
			const transfers = await Staff.app.models.TransferContract.find({ where: { personId: ObjectID(ctx.where.id) } });

			const obs$ = [
				...employments.map(contract => contract.destroy()),
				...transfers.map(contract => contract.destroy())
			];
			process.nextTick(async () => await Promise.all(obs$));
		} catch (e) {
			console.error(e);
			throw e;
		}
	});

	Staff.getBonuses = async function (id, filters) {
		try {
			console.log(`[STAFF] Get all bonuses for staff ${id}...`);
			const staff = await Staff.findById(id);
			const obs$ = [staff.employmentContracts.find()];
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
			throw StaffError(e);
		}
	};
};

function StaffError(e) {
	const error = new Error(e);
	error.statusCode = e.statusCode || '500';
	error.code = 'STAFF_ERROR';
	error.name = 'StaffError';
	error.message = e.message;
	return error;
}
