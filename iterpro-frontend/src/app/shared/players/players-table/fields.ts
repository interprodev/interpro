const fieldObjects = [
	{ label: 'pic', field: 'pic' },
	{ label: 'name', field: 'displayName' },
	{ label: 'profile.position', field: 'position' },
	{ label: 'Year', field: 'birthDate' },
	{ label: 'profile.overview.nationality', field: 'nationality' },
	{ label: 'profile.position.foot', field: 'foot' },
	{ label: 'Readiness', field: 'readiness' },
	{ label: 'medical.infirmary.details.issue.injury', field: 'injury' },
	{ label: 'notifications.injury', field: 'status' },
	{ label: 'Pending', field: 'pending' },
	{ label: 'Certificate', field: 'certificate' },
	{ label: 'admin.squads.player.contract', field: 'contract' },
	{ label: 'admin.squads.player.from', field: 'from' },
	{ label: 'admin.squads.player.to', field: 'to' },
	{ label: 'admin.squads.player.salary', field: 'salary' },
	{ label: 'admin.squads.player.marketValue', field: 'value' },
	{ label: 'admin.squads.player.archivedDate', field: 'archivedDate' },
	{
		label: 'admin.squads.player.archivedMotivation',
		field: 'archivedMotivation'
	},
	{ label: 'profile.overview.transferfee', field: 'fee' },
	{ label: 'profile.overview.transferwage', field: 'wage' }
];

export const fields = fieldObjects.map(f => f.field);
