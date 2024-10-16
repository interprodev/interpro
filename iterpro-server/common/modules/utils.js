module.exports = {
	capitalize: function (str) {
		return str.slice(0, 1).toUpperCase() + str.slice(1);
	},
	getMobileHost: function () {
		return process.env.MOBILE_CLIENT_URL;
	},
	getHost: function () {
		return process.env.BACKEND_URL;
	},
	getClientHost: function (club) {
		return club.grassroots ? process.env.GRASSROOTS_CLIENT_URL : process.env.WEB_CLIENT_URL;
	},
	isOnlineEnv: function () {
		return process.env.APP_ENV !== 'development';
	}
};
