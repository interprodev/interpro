const { flatten } = require('lodash');
const { ObjectID } = require('mongodb');

module.exports = function (PlayerTransfer) {
	PlayerTransfer.observe('after delete', async ctx => {
		try {
			console.log(`[PLAYERTRANSFER] Deleted PlayerTransfer with id ${ctx.where.id}. Deleting associated contracts...`);

			const employments = await PlayerTransfer.app.models.EmploymentContract.find({
				where: { personId: ObjectID(ctx.where.id) }
			});
			const transfers = await PlayerTransfer.app.models.TransferContract.find({
				where: { personId: ObjectID(ctx.where.id) }
			});

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

	PlayerTransfer.getBonuses = async function (id, filters) {
		try {
			console.log(`[PLAYERTRANSFER] Get all bonuses for player transfer ${id}...`);
			const playerTransfer = await PlayerTransfer.findById(id);
			const obs$ = [playerTransfer.employmentContracts.find(), playerTransfer.transferContracts.find()];
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
			throw PlayerTransferError(e);
		}
	};

	PlayerTransfer.getAmortizationData = async function (id) {
		try {
			console.log(`[PLAYERTRANSFER] Getting amortization values for player transfer ${id}...`);
			const transferPlayer = await PlayerTransfer.findById(id, {
				fields: { id: true }
			});
			return await PlayerTransfer.app.models.Player.getAmortizationData(transferPlayer.id);
		} catch (e) {
			console.error(e);
			throw e;
		}
	};
};

function PlayerTransferError(e) {
	const error = new Error(e);
	error.statusCode = e.statusCode || '500';
	error.code = 'PLAYERTRANSFER_ERROR';
	error.name = 'PlayerTransferError';
	error.message = e.message;
	return error;
}
