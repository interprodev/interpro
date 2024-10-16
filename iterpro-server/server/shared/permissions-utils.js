const notModulePermissions = [
	'overview',
	'fitness',
	'game-stats',
	'robustness',
	'thresholds',
	'profile-attributes',
	'scouting-games',
	'scouting-games-report'
];

const onlyModulePermissions = ['ewma', 'tests', 'surveys'];

const basicModules = ['standings', 'squads', 'import-data'];

const whiteListRoutes = ['', 'administration', 'settings', 'dashboards'];

module.exports = {
	checkPermissions: function (team, customer, teamSetting, module) {
		if (isWhiteListRoutes(module)) return true;
		else {
			if (isContainedInBasicModules(module)) {
				if (hasPermissionForModule(teamSetting, module)) {
					return true;
				} else {
					return false;
				}
			} else if (isOnlyPermission(module) || isModuleEnabled(team, module)) {
				if (isCustomerAdmin(customer)) {
					return true;
				} else {
					if (hasPermissionForModule(teamSetting, module) || isOnlyModule(module)) {
						return true;
					} else {
						return false;
					}
				}
			} else {
				return false;
			}
		}
	}
};

function isWhiteListRoutes(module) {
	return !module || whiteListRoutes.includes(module);
}

function isContainedInBasicModules(module) {
	return basicModules.includes(module);
}

function isOnlyPermission(module) {
	return notModulePermissions.includes(module);
}

function isOnlyModule(module) {
	return onlyModulePermissions.includes(module);
}

function isModuleEnabled(team, module) {
	return !!team && !!team.enabledModules && team.enabledModules.includes(module);
}

function isCustomerAdmin(customer) {
	return !!customer && customer.admin;
}

function hasPermissionForModule(teamSetting, module) {
	if (!teamSetting || teamSetting.length === 0) return null;
	return (teamSetting.permissions || []).includes(module);
}
