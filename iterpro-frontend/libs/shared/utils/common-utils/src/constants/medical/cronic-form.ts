export const CHRONIC_STATUS_HEALED = 'medical.prevention.chronic.healed';
export const CHRONIC_STATUS_FLARED = 'medical.prevention.chronic.flared-up';
export const CHRONIC_STATUS_STABLE = 'medical.prevention.chronic.stable';

export const status = [
	{ label: CHRONIC_STATUS_STABLE, color: 'gray' },
	{ label: CHRONIC_STATUS_HEALED, color: 'rgb(59, 241, 0)' }
];

export const fullStatus = [...status, { label: CHRONIC_STATUS_FLARED, color: 'red' }];

export const INJURY_LOCATIONS = [
	'none',
	'general',
	'medical.infirmary.details.location.headFace',
	'medical.infirmary.details.location.neckCervicalSpine',
	'medical.infirmary.details.location.shoulderR',
	'medical.infirmary.details.location.shoulderL',
	'medical.infirmary.details.location.armR',
	'medical.infirmary.details.location.armL',
	'medical.infirmary.details.location.elbowR',
	'medical.infirmary.details.location.elbowL',
	'medical.infirmary.details.location.forearmR',
	'medical.infirmary.details.location.forearmL',
	'medical.infirmary.details.location.wristR',
	'medical.infirmary.details.location.wristL',
	'medical.infirmary.details.location.handFingerThumbR',
	'medical.infirmary.details.location.handFingerThumbL',
	'medical.infirmary.details.location.sternumRibs',
	'medical.infirmary.details.location.upperback',
	'medical.infirmary.details.location.lowerback',
	'medical.infirmary.details.location.abdomen',
	'medical.infirmary.details.location.lowerBackPelvisSacrum',
	'medical.infirmary.details.location.thighR',
	'medical.infirmary.details.location.thighL',
	'medical.infirmary.details.location.hamstringR',
	'medical.infirmary.details.location.hamstringL',
	'medical.infirmary.details.location.kneeR',
	'medical.infirmary.details.location.kneeL',
	'medical.infirmary.details.location.shinR',
	'medical.infirmary.details.location.shinL',
	'medical.infirmary.details.location.lowerLegAchillesTendonR',
	'medical.infirmary.details.location.lowerLegAchillesTendonL',
	'medical.infirmary.details.location.ankleR',
	'medical.infirmary.details.location.ankleL',
	'medical.infirmary.details.location.footToeR',
	'medical.infirmary.details.location.footToeL'
];

export const system = [
	'medical.infirmary.details.system.eyes',
	'medical.infirmary.details.system.earsNoseMouthThroat',
	'medical.infirmary.details.system.cardiovascular',
	'medical.infirmary.details.system.allergicImmunologic',
	'medical.infirmary.details.system.gastrointestinal',
	'medical.infirmary.details.system.genitourinary',
	'medical.infirmary.details.system.muscoloskeletal',
	'medical.infirmary.details.system.integumentary',
	'medical.infirmary.details.system.neurological',
	'medical.infirmary.details.system.psychiatric',
	'medical.infirmary.details.system.endocrine',
	'medical.infirmary.details.system.hematologicLymphatic'
];
