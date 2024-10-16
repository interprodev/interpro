const axiosLib = require('axios');

module.exports = {
	getPasswordValidityAndStrength: async passwordValidationInput => {
		const url = `${process.env.PASSWORD_UTILS_URL}/validate`;
		const body = JSON.stringify(passwordValidationInput);
		const response = await axiosLib.post(url, body, {
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': process.env.PASSWORD_UTILS_KEY
			}
		});
		const { data } = response;
		return data;
	},
	generateStrongPassword: async () => {
		try {
			const url = `${process.env.PASSWORD_UTILS_URL}/generate`;
			const response = await axiosLib.get(url, {
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': process.env.PASSWORD_UTILS_KEY
				}
			});
			const { data } = response;
			return data;
		} catch (error) {
			console.error(`Error while generating strong password!`);
			throw error;
		}
	},
	getPasswordRequirements: async () => {
		try {
			const url = `${process.env.PASSWORD_UTILS_URL}/requirements`;
			const response = await axiosLib.get(url, {
				headers: {
					'Content-Type': 'application/json',
					'X-API-Key': process.env.PASSWORD_UTILS_KEY
				}
			});
			const { data } = response;
			return data;
		} catch (error) {
			console.error(`Error while getting the password requirements!`);
			throw error;
		}
	}
};
