module.exports = {
	getCustomerName: async function (Model, item) {
		const customers = await Model.app.models.Customer.findById(String(item), {
			fields: ['firstName', 'lastName']
		});
		return customers ? `${customers.firstName} ${customers.lastName}` : item;
	}
};
