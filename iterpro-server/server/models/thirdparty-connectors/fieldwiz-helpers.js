const fieldwiz = require('./fieldwiz');
module.exports = {
	getFieldwizAccount: async function (team) {
		const token = await fieldwiz.getToken(team);
		return getAccount(token);
	},
	// https://api.asi.swiss/#tag/Account/api/athletes/create-managed/
	createFieldwizManagedAthlete: async function (team, player) {
		try {
			const token = await fieldwiz.getToken(team);
			const account = await getAccount(token);
			const body = { managed_by: account.manager_profile.id, athlete_profile: player };
			const response = await fieldwiz.postRequest('/api/athletes/create-managed/', body, { token });
			return response.data ? response.data : undefined;
		} catch (error) {
			console.error(error);
		}
		return undefined;
	},
	// https://api.asi.swiss/#tag/Account/api/athletes/
	createFieldwizAthlete: async function (team, player) {
		try {
			const token = await fieldwiz.getToken(team);
			const account = await getAccount(token);
			console.log('FIELDWIZ ACCOUNT EMAIL');
			console.log(account.email);
			const body = {
				external_id: player.external_id,
				username: account.email,
				email: account.email,
				athlete_profile: player
			};
			console.log('CREATE ATHLETE');
			const response = await fieldwiz.postRequest('/api/athletes/', body, { token });
			console.log('CREATE RESPONSE');
			console.log(response.status, response.statusText, response.data);
			// response code is 200 (OK) but the created player is not present
			console.log('ASK CREATED ATHLETE');
			// retrieving player with externalId (only info we know to get the player)
			// https://api.asi.swiss/#tag/Account/api/athletes/by-external-id/
			const url = '/api/athletes/by-external-id/?external-id=' + player.external_id;
			const response2 = await fieldwiz.getRequest(url, {
				token
			});
			// player not found (error 404)
			console.log('RESPONSE PLAYER');
			console.log(response2.status, response2.statusText, response2.data);

			return response.data ? response.data : undefined;
		} catch ({ response }) {
			console.error('FIELDWIZ ERROR');
			console.error(response.status, response.statusText, response.data);
		}
		return undefined;
	}
};
async function getAccount(token) {
	try {
		const response = await fieldwiz.getRequest('/api/account/', { token });
		return response.data ? response.data : [];
	} catch (error) {
		console.error(error);
	}
	return [];
}
