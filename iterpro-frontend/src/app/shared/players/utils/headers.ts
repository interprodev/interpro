export const headers = {
	SELECTABLE: {
		field: 'SELECTABLE',
		key: '',
		filterKey: null,
		toggable: false,
		sortable: false,
		frozen: true,
		csvDisabled: true,
		class: 'tw-text-center',
		width: 50
	},
	ARCHIVE: {
		field: 'ARCHIVE',
		key: null,
		filterKey: null,
		sortable: false,
		toggable: false,
		csvDisabled: true,
		frozen: true,
		class: 'tw-text-center',
		width: 60
	},
	DELETE: {
		field: 'DELETE',
		key: null,
		filterKey: null,
		sortable: false,
		toggable: false,
		frozen: true,
		class: 'tw-text-center',
		width: 60
	},
	ROW_INDEX: {
		field: 'ROW_INDEX',
		key: '',
		filterKey: 'progressiveNumber',
		toggable: true,
		sortable: false,
		frozen: true,
		csvDisabled: true,
		class: 'tw-text-center',
		width: 50
	},
	IMAGE: {
		field: 'IMAGE',
		key: '',
		filterKey: 'settings.general.picture',
		toggable: true,
		sortable: false,
		frozen: true,
		csvDisabled: true,
		width: 80
	},
	TEAM: {
		field: 'TEAM',
		key: 'profile.team',
		filterKey: null,
		toggable: true,
		sortable: true,
		frozen: false,
		sortableField: 'team'
	},
	DISPLAY_NAME: {
		field: 'DISPLAY_NAME',
		key: 'profile.overview.displayName',
		filterKey: null,
		toggable: true,
		sortable: true,
		frozen: true,
		width: 200,
		sortableField: 'displayName'
	},
	FIRST_NAME: {
		field: 'FIRST_NAME',
		key: 'profile.overview.name',
		filterKey: null,
		toggable: true,
		sortable: true,
		width: null,
		sortableField: 'name'
	},
	LAST_NAME: {
		field: 'LAST_NAME',
		key: 'profile.overview.surname',
		filterKey: null,
		toggable: true,
		sortable: true,
		width: null,
		sortableField: 'lastName'
	},
	POSITION: {
		field: 'POSITION',
		key: 'profile.position',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'position'
	},
	BIRTH_DATE: {
		field: 'BIRTH_DATE',
		key: 'profile.overview.birth',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'birthDate'
	},
	BIRTH_PLACE: {
		field: 'BIRTH_PLACE',
		key: 'profile.overview.birthPlace',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: 220,
		sortableField: 'birtPlace'
	},
	YEAR: {
		field: 'YEAR',
		key: 'profile.overview.birthYear',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'birthYear'
	},
	AGE: {
		field: 'AGE',
		key: 'profile.overview.age',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'age'
	},
	NATIONALITY: {
		field: 'NATIONALITY',
		key: 'profile.overview.nationality',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'nationality'
	},
	FOOT: {
		field: 'FOOT',
		key: 'profile.position.foot',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'preferredFoot'
	},
	HAND: {
		field: 'HAND',
		key: 'profile.position.hand',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'preferredHand'
	},
	MEDICAL_SCREENING_EXPIRY_DATES: {
		field: 'MEDICAL_SCREENING_EXPIRY_DATES',
		key: 'medicalRecords',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		csvRaw: true,
		pdfRaw: true,
		sortableField: 'medicalRecords'
	},
	DOCUMENT_EXPIRY_DATES: {
		field: 'DOCUMENT_EXPIRY_DATES',
		key: 'profile.identification',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		csvRaw: true,
		pdfRaw: true,
		sortableField: 'documentStatus'
	},
	PASSPORT: {
		field: 'PASSPORT',
		key: 'profile.passport',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'passport'
	},
	FISCAL_ISSUE: {
		field: 'FISCAL_ISSUE',
		key: 'profile.overview.fiscalIssue',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'fiscalIssue'
	},
	ORIGIN: {
		field: 'ORIGIN',
		key: 'admin.contracts.origin',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'origin'
	},
	FEDERAL_ID: {
		field: 'FEDERAL_ID',
		key: 'admin.contracts.agent.federalId',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'federalId'
	},
	CARD_ID: {
		field: 'CARD_ID',
		key: 'profile.idCard',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'idCard'
	},
	PASSPORT_NUMBER: {
		field: 'PASSPORT_NUMBER',
		key: 'profile.passport.passportNumber',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'passport'
	},
	MOBILE_PHONE_NUMBER: {
		field: 'MOBILE_PHONE_NUMBER',
		key: 'profile.contact.mobilePhone',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'mobilePhone'
	},
	PHONE_NUMBER: {
		field: 'PHONE_NUMBER',
		key: 'profile.contact.phone',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'phone'
	},
	EMAIL: {
		field: 'EMAIL',
		key: 'profile.contact.email',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'email'
	},
	GENDER: {
		field: 'GENDER',
		key: 'profile.overview.gender',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'gender'
	},
	EDUCATION: {
		field: 'EDUCATION',
		key: 'profile.overview.education',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'education'
	},
	NATIONALITY_ORIGIN: {
		field: 'NATIONALITY_ORIGIN',
		key: 'profile.overview.nationalityOrigins',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'nationalityOrigin'
	},
	MARITAL_STATUS: {
		field: 'MARITAL_STATUS',
		key: 'profile.overview.maritalStatus',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'maritalStatus'
	},
	WEIGHT: {
		field: 'WEIGHT',
		key: 'profile.overview.weight',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'weight'
	},
	HEIGHT: {
		field: 'HEIGHT',
		key: 'profile.overview.height',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'height'
	},
	SHOE_SIZE: {
		field: 'SHOE_SIZE',
		key: 'profile.position.shoeSize',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'shoeSize'
	},
	JERSEY_NUMBER: {
		field: 'JERSEY_NUMBER',
		key: 'profile.positon.jerseyNumber',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'jerseyNumber'
	},
	CAPTAIN: {
		field: 'CAPTAIN',
		key: 'profile.position.captain',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'captain'
	},
	STREET: {
		field: 'STREET',
		key: 'profile.contact.street',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'street'
	},
	CITY: {
		field: 'CITY',
		key: 'profile.contact.city',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'city'
	},
	STATE: {
		field: 'STATE',
		key: 'profile.contact.state',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'state'
	},
	ZIP: {
		field: 'ZIP',
		key: 'profile.contact.zipCode',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'zipCode'
	},
	COUNTRY: {
		field: 'COUNTRY',
		key: 'profile.contact.nation',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'nation'
	},
	BANK: {
		field: 'BANK',
		key: 'profile.bank.name',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'bank'
	},
	ACCOUNT_NUMBER: {
		field: 'ACCOUNT_NUMBER',
		key: 'profile.bank.accountNumber',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'accountNumber'
	},
	ROUTING_NUMBER: {
		field: 'ROUTING_NUMBER',
		key: 'profile.bank.routingNumber',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'routingNumber'
	},
	IBAN: {
		field: 'IBAN',
		key: 'profile.bank.iban',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'iban'
	},
	SWIFT: {
		field: 'SWIFT',
		key: 'profile.bank.swift',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'swift'
	},
	MEMBERSHIP_TEAM: {
		field: 'MEMBERSHIP_TEAM',
		key: 'profile.federal.from',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: 220,
		sortableField: 'membershipTeam'
	},
	FIRST_MEMBERSHIP_PRO: {
		field: 'FIRST_MEMBERSHIP_PRO',
		key: 'firstMembershipPro',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: 220,
		sortableField: 'firstMembershipPro'
	},
	FIRST_MEMBERSHIP_TEAM: {
		field: 'FIRST_MEMBERSHIP_TEAM',
		key: { key: 'firstMembershipTeam', params: { value: '' } },
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: 220,
		sortableField: 'firstMembershipTeam'
	},
	CONTRACT: {
		field: 'CONTRACT',
		key: 'bonus.status',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'contract'
	},
	CONTRACT_FROM: {
		field: 'CONTRACT_FROM',
		key: 'profile.overview.contractForm',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'contractForm'
	},
	CONTRACT_TO: {
		field: 'CONTRACT_TO',
		key: 'profile.overview.contractExpiry',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'contractExpiry'
	},
	OUTWARD_CONTRACT_NOTARIZATION: {
		field: 'OUTWARD_CONTRACT_NOTARIZATION',
		key: 'admin.contracts.outward',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'outwardContractNotarized'
	},
	INWARD_CONTRACT_NOTARIZATION: {
		field: 'INWARD_CONTRACT_NOTARIZATION',
		key: 'admin.contracts.inward',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'inwardContractNotarized'
	},
	CURRENT_CONTRACT_NOTARIZATION: {
		field: 'CURRENT_CONTRACT_NOTARIZATION',
		key: 'admin.contracts',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'currentContractNotarized'
	},
	SALARY: {
		field: 'SALARY',
		key: 'admin.headers.salary',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		csvRaw: true,
		width: null,
		sortableField: 'netSalary'
	},
	VALUE: {
		field: 'VALUE',
		key: 'admin.squads.player.marketValue',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		csvRaw: true,
		width: null,
		sortableField: 'value'
	},
	ARCHIVED_DATE: {
		field: 'ARCHIVED_DATE',
		key: 'admin.squads.player.archivedDate',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'archivedDate'
	},
	ARCHIVED_MOTIVATION: {
		field: 'ARCHIVED_MOTIVATION',
		key: 'admin.squads.player.archivedMotivation',
		filterKey: null,
		toggable: true,
		sortable: false,
		width: null,
		sortableField: 'archivedMotivation'
	},
	READINESS: {
		field: 'READINESS',
		key: 'Readiness',
		filterKey: null,
		sortable: false,
		toggable: true,
		class: 'tw-text-center',
		width: null
	},
	INJURY: {
		field: 'INJURY',
		key: 'medical.infirmary.details.issue.injury',
		filterKey: null,
		sortable: false,
		toggable: true,
		class: 'tw-text-center',
		width: null
	},
	CLUB: {
		field: 'CLUB',
		key: 'admin.club',
		filterKey: null,
		sortable: false,
		toggable: true,
		class: 'tw-text-center',
		width: null
	},
	PENDING: {
		field: 'PENDING',
		key: 'Pending',
		filterKey: null,
		sortable: false,
		toggable: true,
		class: 'tw-text-center',
		width: null
	},
	CERTIFICATE: {
		field: 'CERTIFICATE',
		key: 'Certificate',
		filterKey: null,
		sortable: false,
		toggable: true,
		class: 'tw-text-center',
		width: null
	},
	TEAM_FROM: {
		// doesn't exists
		field: 'TEAM_FROM',
		key: 'admin.squads.player.from',
		filterKey: null,
		sortable: true,
		toggable: true,
		class: 'tw-text-center',
		width: null
	},
	FEE: {
		// doesn't exists
		field: 'FEE',
		key: 'profile.overview.transferfee',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null
	},
	WAGE: {
		// doesn't exists
		field: 'WAGE',
		key: 'profile.overview.transferwage',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null
	},
	FIXED_WAGE: {
		// ex net salary
		field: 'FIXED_WAGE',
		key: 'financial.dashboard.fixedWage',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'fixedWage'
	},
	CONTRIBUTIONS: {
		field: 'CONTRIBUTIONS',
		key: 'admin.contracts.contributions',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'contributions'
	},
	BONUS_TOT: {
		field: 'BONUS_TOT',
		key: 'admin.contracts.bonusTot',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'totalBonus'
	},
	APP_FEES: {
		field: 'APP_FEES',
		key: 'admin.contracts.appearanceFees',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'appearanceFee'
	},
	APP_BONUS: {
		field: 'APP_BONUS',
		key: 'admin.contracts.appearance',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'appearanceBonus'
	},
	PERF_FEES: {
		field: 'PERF_FEES',
		key: 'admin.contracts.performanceFee',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'performanceFee'
	},
	PERF_BONUS: {
		field: 'PERF_BONUS',
		key: 'admin.contracts.performance',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'performanceBonus'
	},
	TEAM_BONUS: {
		field: 'TEAM_BONUS',
		key: 'admin.contracts.standardTeam',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'teamBonus'
	},
	SIGNING_BONUS: {
		field: 'SIGNING_BONUS',
		key: 'admin.contracts.signing',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'signingBonus'
	},
	CUSTOM_BONUS: {
		field: 'CUSTOM_BONUS',
		key: 'admin.contracts.custom',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'customBonus'
	},
	ASSET_VALUE: {
		field: 'ASSET_VALUE',
		key: 'assetValue',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'assetValue'
	},
	TRANSFER_FEE: {
		field: 'TRANSFER_FEE',
		key: 'admin.transfers.trading.cost',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'transferFee'
	},
	AGENT_FEE: {
		field: 'AGENT_FEE',
		key: 'admin.contracts.agentFee',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'agentFee'
	},
	AGENT_FEE_PERC: {
		field: 'AGENT_FEE_PERC',
		key: 'admin.contracts.agentFeePerc',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'agentFeePerc'
	},
	AMORTIZATION: {
		field: 'AMORTIZATION',
		key: 'forecast.amortization',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'amortizationAsset'
	},
	NET_BOOK_VALUE: {
		field: 'NET_BOOK_VALUE',
		key: 'financial.dashboard.bookValue',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'netBookValue'
	},
	MARKET_VALUE: {
		field: 'MARKET_VALUE',
		key: 'marketValue',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'marketValue'
	},
	GAIN_LOSS: {
		field: 'GAIN_LOSS',
		key: 'asset.gainLoss',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'gainLoss'
	},
	GAIN_LOSS_PERC: {
		field: 'GAIN_LOSS_PERC',
		key: 'asset.gainLossPerc',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'gainLossPercent'
	},
	AMORTIZATION_SEASON: {
		field: 'AMORTIZATION_SEASON',
		key: 'amortization.seasonValue',
		filterKey: null,
		sortable: true,
		toggable: true,
		csvRaw: true,
		class: 'tw-text-center',
		width: null,
		sortableField: 'seasonAmortization'
	}
};

export const registry = [
	headers.ROW_INDEX,
	headers.IMAGE,
	headers.DISPLAY_NAME,
	headers.FIRST_NAME,
	headers.LAST_NAME,
	headers.TEAM,
	headers.POSITION,
	headers.BIRTH_DATE,
	headers.YEAR,
	headers.AGE,
	headers.NATIONALITY,
	headers.MEDICAL_SCREENING_EXPIRY_DATES,
	headers.DOCUMENT_EXPIRY_DATES,
	headers.PASSPORT,
	headers.FISCAL_ISSUE,
	headers.CONTRACT,
	headers.CONTRACT_FROM,
	headers.CONTRACT_TO,
	headers.OUTWARD_CONTRACT_NOTARIZATION,
	headers.INWARD_CONTRACT_NOTARIZATION,
	headers.CURRENT_CONTRACT_NOTARIZATION,
	headers.ARCHIVED_DATE,
	headers.ARCHIVED_MOTIVATION,
	headers.ORIGIN,
	headers.FEDERAL_ID,
	headers.CLUB,
	headers.CARD_ID,
	headers.PASSPORT_NUMBER,
	headers.MOBILE_PHONE_NUMBER,
	headers.EMAIL,
	headers.PHONE_NUMBER,
	// Use this to add extra columns in a dropdown registry
	// headers.GENDER,
	// headers.EDUCATION,
	// headers.NATIONALITY_ORIGIN,
	// headers.MARITAL_STATUS,
	// headers.WEIGHT,
	// headers.HEIGHT,
	// headers.FOOT,
	// headers.SHOE_SIZE,
	// headers.JERSEY_NUMBER,
	// headers.CAPTAIN,
	// headers.STREET,
	// headers.CITY,
	// headers.STATE,
	// headers.ZIP,
	// headers.COUNTRY,
	// headers.BANK,
	// headers.ACCOUNT_NUMBER,
	// headers.ROUTING_NUMBER,
	// headers.IBAN,
	// headers.SWIFT,
];
export const salary = [
	headers.FIXED_WAGE,
	headers.CONTRIBUTIONS,
	headers.BONUS_TOT,
	headers.APP_FEES,
	headers.APP_BONUS,
	headers.PERF_FEES,
	headers.PERF_BONUS,
	headers.TEAM_BONUS,
	headers.SIGNING_BONUS,
	headers.CUSTOM_BONUS
];
export const asset = [
	headers.ASSET_VALUE,
	headers.TRANSFER_FEE,
	headers.AGENT_FEE,
	headers.AGENT_FEE_PERC,
	headers.NET_BOOK_VALUE,
	headers.MARKET_VALUE,
	headers.GAIN_LOSS,
	headers.GAIN_LOSS_PERC
];
export const amortization = [headers.AMORTIZATION, headers.AMORTIZATION_SEASON];

export const adminColumns = [headers.SELECTABLE, ...registry, ...salary, ...asset, ...amortization];
export const alwaysVisible = [headers.ARCHIVE.field, headers.DELETE.field];

export interface TableColumnVisibilityConfig {
	registry: string[];
	salary: string[];
	asset: string[];
	amortization: string[];
}

export const initialVisibility = (): TableColumnVisibilityConfig => ({
	registry: [
		headers.SELECTABLE.field,
		headers.IMAGE.field,
		headers.DISPLAY_NAME.field,
		headers.TEAM.field,
		headers.POSITION.field,
		headers.BIRTH_DATE.field,
		headers.YEAR.field,
		headers.AGE.field,
		headers.NATIONALITY.field,
		headers.EMAIL.field,
		headers.PHONE_NUMBER.field,
	],
	salary: [],
	asset: [],
	amortization: []
});
