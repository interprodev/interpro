import { Injury } from '@iterpro/shared/data-access/sdk';

export const convertInjuryFields = (injury: Injury): Injury => {
	switch (injury.location) {
		case 'head/Face':
			injury.location = 'medical.infirmary.details.location.headFace';
			break;
		case 'Neck/Clavicle/Cervical Spine':
			injury.location = 'medical.infirmary.details.location.neckCervicalSpine';
			break;
		case 'Shoulder R':
			injury.location = 'medical.infirmary.details.location.shoulderR';
			break;
		case 'Shoulder L':
			injury.location = 'medical.infirmary.details.location.shoulderL';
			break;
		case 'Arm R':
			injury.location = 'medical.infirmary.details.location.armR';
			break;
		case 'Arm L':
			injury.location = 'medical.infirmary.details.location.armL';
			break;
		case 'Elbow R':
			injury.location = 'medical.infirmary.details.location.elbowR';
			break;
		case 'Elbow L':
			injury.location = 'medical.infirmary.details.location.elbowL';
			break;
		case 'Forearm R':
			injury.location = 'medical.infirmary.details.location.forearmR';
			break;
		case 'Forearm L':
			injury.location = 'medical.infirmary.details.location.forearmL';
			break;
		case 'Wrist R':
			injury.location = 'medical.infirmary.details.location.wristR';
			break;
		case 'Wrist L':
			injury.location = 'medical.infirmary.details.location.wristL';
			break;
		case 'Hand/Finger/Thumb R':
			injury.location = 'medical.infirmary.details.location.handFingerThumbR';
			break;
		case 'Hand/Finger/Thumb L':
			injury.location = 'medical.infirmary.details.location.handFingerThumbL';
			break;
		case 'Sternum/Ribs/Chest':
			injury.location = 'medical.infirmary.details.location.sternumRibs';
			break;
		case 'Upper back':
			injury.location = 'medical.infirmary.details.location.upperback';
			break;
		case 'Lower back':
			injury.location = 'medical.infirmary.details.location.lowerback';
			break;
		case 'Abdomen':
			injury.location = 'medical.infirmary.details.location.abdomen';
			break;
		case 'Hip/Groin/Pelvis/Sacrum':
			injury.location = 'medical.infirmary.details.location.lowerBackPelvisSacrum';
			break;
		case 'Thigh R':
			injury.location = 'medical.infirmary.details.location.thighR';
			break;
		case 'Thigh L':
			injury.location = 'medical.infirmary.details.location.thighL';
			break;
		case 'Hamstring R':
			injury.location = 'medical.infirmary.details.location.hamstringR';
			break;
		case 'Hamstring L':
			injury.location = 'medical.infirmary.details.location.hamstringL';
			break;
		case 'Knee R':
			injury.location = 'medical.infirmary.details.location.kneeR';
			break;
		case 'Knee L':
			injury.location = 'medical.infirmary.details.location.kneeL';
			break;
		case 'Shin R':
			injury.location = 'medical.infirmary.details.location.shinR';
			break;
		case 'Shin L':
			injury.location = 'medical.infirmary.details.location.shinL';
			break;
		case 'Calf/Achilles Tendon R':
			injury.location = 'medical.infirmary.details.location.lowerLegAchillesTendonR';
			break;
		case 'Calf/Achilles Tendon L':
			injury.location = 'medical.infirmary.details.location.lowerLegAchillesTendonL';
			break;
		case 'Ankle R':
			injury.location = 'medical.infirmary.details.location.ankleR';
			break;
		case 'Ankle L':
			injury.location = 'medical.infirmary.details.location.ankleL';
			break;
		case 'Foot/Toe R':
			injury.location = 'medical.infirmary.details.location.footToeR';
			break;
		case 'Foot/Toe L':
			injury.location = 'medical.infirmary.details.location.footToeL';
			break;
		default:
			break;
	}

	return injury;
};
