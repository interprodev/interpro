const axiosLib = require('axios');

module.exports = {
	pushToEWMALambdaFunction: async body => {
		console.info(`\t\tPushing action request for EWMA Lambda Function...`);
		// eslint-disable-next-line no-useless-catch
		try {
			await axiosLib.post(`${process.env.ADVANCED_GPS_DATA_URL}/batch`, body);
		} catch (error) {
			console.error(error);
		}
	}
};
