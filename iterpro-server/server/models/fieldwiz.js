const fieldwizHelper = require('./thirdparty-connectors/fieldwiz-helpers');

module.exports = function (Fieldwiz) {
	Fieldwiz.fieldwizAccount = async function (teamId) {
		const team = await Fieldwiz.app.models.Team.findById(teamId);
		return fieldwizHelper.getFieldwizAccount(team);
	};

	Fieldwiz.createFieldwizManagedAthlete = async function (teamId, player) {
		const team = await Fieldwiz.app.models.Team.findById(teamId);
		return fieldwizHelper.createFieldwizManagedAthlete(team, player);
	};

	Fieldwiz.createFieldwizAthlete = async function (teamId, player) {
		const team = await Fieldwiz.app.models.Team.findById(teamId);
		return fieldwizHelper.createFieldwizAthlete(team, player);
	};
};
