const axios = require('axios');
const axiosRetry = require('axios-retry');
const { retries, timeout } = require('../../../../config/axiosRetry.config.json');

const api = axios.create({
	baseURL: process.env.CUSTOM_TEMPLATE_URL,
	headers: { 'Content-type': 'application/json' }
});

axiosRetry(api, { timeout, retries, retryDelay: axiosRetry.exponentialDelay });

const makeRequest = async (servicePath, method, endpoint, data = null) => {
	try {
		let url = `${process.env.CUSTOM_TEMPLATE_URL}/${servicePath}`;
		if (endpoint) url += `${endpoint}`;
		console.log(`Making request to ${url}`);
		const response = await api({
			method,
			url,
			data: data ? JSON.stringify(data) : null
		});
		return response.data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

module.exports = {
	getAll: async (servicePath, entity, entityId) => {
		return await makeRequest(servicePath, 'get', `/${entity}/${entityId}`);
	},
	getSingle: async (servicePath, templateKey) => {
		return await makeRequest(servicePath, 'get', `/${templateKey}`);
	},
	getSingleVersion: async (servicePath, templateKey, version) => {
		return await makeRequest(servicePath, 'get', `/${templateKey}/versions/${version}`);
	},
	validate: async (servicePath, template) => {
		return await makeRequest(servicePath, 'post', '/validate', template);
	},
	create: async (servicePath, template) => {
		return await makeRequest(servicePath, 'post', null, template);
	},
	update: async (servicePath, template) => {
		return await makeRequest(servicePath, 'put', `/${template._key}`, template);
	}
};
