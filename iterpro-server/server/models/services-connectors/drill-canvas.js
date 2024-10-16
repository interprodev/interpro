const axios = require('axios');
const axiosRetry = require('axios-retry');
const { retries, timeout } = require('../../../config/axiosRetry.config.json');
const api = axios.create({ baseURL: process.env.DRILL_CANVAS_URL, headers: { 'Content-type': 'application/json' } });
axiosRetry(api, { timeout, retries, retryDelay: axiosRetry.exponentialDelay });

module.exports = {
	getAllDrillCanvases: async teamId => {
		try {
			const response = await api.get(`teams/${teamId}`);
			return response.data;
		} catch (e) {
			console.error(e);
			throw e;
		}
	},
	getSingleDrillCanvas: async (teamId, canvasId) => {
		try {
			const response = await api.get(`teams/${teamId}/canvases/${canvasId}`);
			return response.data;
		} catch (e) {
			console.error(e);
			throw e;
		}
	},
	// getSingleTemplateVersion: async (clubId, templateId, version) => {
	// 	try {
	// 		const response = await api.get(`${templateId}/versions/${version}`, {
	// 			headers: { 'Club-Id': clubId }
	// 		});
	// 		return response.data;
	// 	} catch (e) {
	// 		console.error(e);
	// 		throw e;
	// 	}
	// },
	createDrillCanvas: async (teamId, canvas) => {
		try {
			const response = await api.post(`teams/${teamId}`, JSON.stringify(canvas));
			return response.data;
		} catch (e) {
			console.error(e);
			throw e;
		}
	},
	updateDrillCanvas: async (teamId, canvas) => {
		try {
			const response = await api.put(`teams/${teamId}/canvases/${canvas.id}`, JSON.stringify(canvas));
			return response.data;
		} catch (e) {
			console.error(e);
			throw e;
		}
	},
	deleteDrillCanvas: async (teamId, canvasId) => {
		try {
			const response = await api.delete(`teams/${teamId}/canvases/${canvasId}`);
			return response.data;
		} catch (e) {
			console.error(e);
			throw e;
		}
	}
};
