const { getAll, getSingle, getSingleVersion, validate, create, update } = require('./base-custom-report-template');

// Service path can be 'scouting-game' or 'player-game' or 'player-training'
// Entity can be 'clubs' or 'teams'
module.exports = {
	getAllTemplates: async (servicePath, entity, entityId) => getAll(servicePath, entity, entityId),
	getSingleTemplate: async (servicePath, templateKey) => getSingle(servicePath, templateKey),
	getSingleTemplateVersion: async (servicePath, templateKey, version) =>
		getSingleVersion(servicePath, templateKey, version),
	validateTemplate: async (servicePath, template) => validate(servicePath, template),
	createTemplate: async (servicePath, template) => create(servicePath, template),
	updateTemplate: async (servicePath, template) => update(servicePath, template)
};
