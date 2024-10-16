import { SelectItem } from 'primeng/api';

type MedicalFieldType =
	| 'SeC'
	| 'physiotherapy'
	| 'bandaging'
	| 'injection'
	| 'instrumentalTherapy'
	| 'manualTherapy'
	| 'thermotherapy';

export const MEDICAL_FIELDS: Record<MedicalFieldType, SelectItem<string>[]> = {
	SeC: [
		{ label: 'medical.prevention.treatments.sec.corePillar', value: 'corePillar' },
		{ label: 'medical.prevention.treatments.sec.alterG', value: 'alterG' },
		{ label: 'medical.prevention.treatments.sec.esdSaq', value: 'esdSaq' },
		{ label: 'medical.prevention.treatments.sec.esdAerobicLowIntensity', value: 'esdAerobicLowIntensity' },
		{ label: 'medical.prevention.treatments.sec.esdAerobicMediumIntensity', value: 'esdAerobicMediumIntensity' },
		{ label: 'medical.prevention.treatments.sec.esdAerobicHighIntensity', value: 'esdAerobicHighIntensity' },
		{ label: 'medical.prevention.treatments.sec.esdSpeedEndurance', value: 'esdSpeedEndurance' },
		{ label: 'medical.prevention.treatments.sec.esdRepeatedSprintAbility', value: 'esdRepeatedSprintAbility' },
		{ label: 'medical.prevention.treatments.sec.balanceTraining', value: 'balanceTraining' },
		{
			label: 'medical.prevention.treatments.sec.gaitWalkingAssistiveDeviceTraining',
			value: 'gaitWalkingAssistiveDeviceTraining'
		},
		{ label: 'medical.prevention.treatments.sec.posturalTraining', value: 'posturalTraining' },
		{ label: 'medical.prevention.treatments.sec.stretching', value: 'stretching' },
		{ label: 'medical.prevention.treatments.sec.footballSpecificTraining', value: 'footballSpecificTraining' },
		{ label: 'medical.prevention.treatments.sec.hydroTraining', value: 'hydroTraining' },
		{ label: 'medical.prevention.treatments.sec.movementSkills', value: 'movementSkills' },
		{ label: 'medical.prevention.treatments.sec.correctiveExercise', value: 'correctiveExercise' },
		{
			label: 'medical.prevention.treatments.sec.resistanceTrainingMaxStrength',
			value: 'resistanceTrainingMaxStrength'
		},
		{
			label: 'medical.prevention.treatments.sec.resistanceTrainingStrengthSpeed',
			value: 'resistanceTrainingStrengthSpeed'
		},
		{
			label: 'medical.prevention.treatments.sec.resistanceTrainingSpeedStrength',
			value: 'resistanceTrainingSpeedStrength'
		},
		{
			label: 'medical.prevention.treatments.sec.resistanceTrainingStartingStrength',
			value: 'resistanceTrainingStartingStrength'
		},
		{ label: 'medical.prevention.treatments.sec.plyometrics', value: 'plyometrics' },
		{ label: 'medical.prevention.treatments.sec.resistanceTrainingIsometric', value: 'resistanceTrainingIsometric' },
		{
			label: 'medical.prevention.treatments.sec.resistanceTrainingIsoinertial',
			value: 'resistanceTrainingIsoinertial'
		},
		{ label: 'medical.prevention.treatments.sec.resistanceTrainingEccentric', value: 'resistanceTrainingEccentric' },
		{ label: 'medical.prevention.treatments.sec.foamRolling', value: 'foamRolling' },
		{ label: 'medical.prevention.treatments.sec.resistanceBand', value: 'resistanceBand' },
		{ label: 'medical.prevention.treatments.sec.proprioception', value: 'proprioception' },
		{ label: 'medical.prevention.treatments.sec.skipping', value: 'skipping' },
		{ label: 'medical.prevention.treatments.sec.resistanceTrainingConcentric', value: 'resistanceTrainingConcentric' },
		{
			label: 'medical.prevention.treatments.sec.resistanceTrainingIsotonicMachine',
			value: 'resistanceTrainingIsotonicMachine'
		},
		{ label: 'medical.prevention.treatments.sec.resistanceTrainingFunctional', value: 'resistanceTrainingFunctional' },
		{ label: 'medical.prevention.treatments.sec.sand', value: 'sand' },
		{ label: 'medical.prevention.treatments.sec.dynamicMobility', value: 'dynamicMobility' },
		{ label: 'medical.prevention.treatments.sec.bike', value: 'bike' },
		{ label: 'medical.prevention.treatments.sec.mobility', value: 'mobility' },
		{ label: 'medical.prevention.treatments.sec.reactionDrill', value: 'reactionDrill' },
		{ label: 'medical.prevention.treatments.sec.treadmill', value: 'treadmill' },
		{ label: 'medical.prevention.treatments.sec.jogging', value: 'jogging' },
		{ label: 'medical.prevention.treatments.sec.ESDHIITrun', value: 'ESDHIITrun' },
		{ label: 'medical.prevention.treatments.sec.codEqual', value: 'codEqual' },
		{ label: 'medical.prevention.treatments.sec.codLess', value: 'codLess' },
		{ label: 'medical.prevention.treatments.sec.cod', value: 'cod' },
		{ label: 'medical.prevention.treatments.sec.technicalDrillLowIntensity', value: 'technicalDrillLowIntensity' },
		{
			label: 'medical.prevention.treatments.sec.technicalDrillMediumIntensity',
			value: 'technicalDrillMediumIntensity'
		},
		{ label: 'medical.prevention.treatments.sec.technicalDrillHighIntensity', value: 'technicalDrillHighIntensity' }
	],
	physiotherapy: [
		{ label: 'medical.prevention.treatments.physiotherapy.bandaging', value: 'bandaging' },
		{ label: 'medical.prevention.treatments.physiotherapy.injection', value: 'injection' },
		{ label: 'medical.prevention.treatments.physiotherapy.instrumentalTherapy', value: 'instrumentalTherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.manualTherapy', value: 'manualTherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.thermotherapy', value: 'thermotherapy' }
	],
	bandaging: [
		{ label: 'medical.prevention.treatments.physiotherapy.options.immobilisation', value: 'immobilisation' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.jobstC', value: 'jobstC' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.kinesioTape', value: 'kinesioTape' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.mcConnellTape', value: 'mcConnellTape' }
	],
	injection: [
		{ label: 'medical.prevention.treatments.physiotherapy.options.acupuncture', value: 'acupuncture' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.prpInjectionTherapy', value: 'prpInjectionTherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.viscosupplementation', value: 'viscosupplementation' }
	],
	instrumentalTherapy: [
		{ label: 'medical.prevention.treatments.physiotherapy.options.compex', value: 'compex' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.cupping', value: 'cupping' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.diathermy', value: 'diathermy' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.dms', value: 'dms' },
		{
			label: 'medical.prevention.treatments.physiotherapy.options.electricalStimulation',
			value: 'electricalStimulation'
		},
		{ label: 'medical.prevention.treatments.physiotherapy.options.exogen', value: 'exogen' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.grastonTechnique', value: 'grastonTechnique' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.iontophoresis', value: 'iontophoresis' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.lasterTherapy', value: 'lasterTherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.lightTherapy', value: 'lightTherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.mens', value: 'mens' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.phonophoresis', value: 'phonophoresis' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.shockWaveTherapy', value: 'shockWaveTherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.tens', value: 'tens' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.ultrasound', value: 'ultrasound' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.whirpool', value: 'whirpool' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.pressotherapy', value: 'pressotherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.hydrotherapy', value: 'hydrotherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.magnetotherapy', value: 'magnetotherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.tecartherapy', value: 'tecartherapy' }
	],
	manualTherapy: [
		{ label: 'medical.prevention.treatments.physiotherapy.options.aarom', value: 'aarom' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.arom', value: 'arom' },
		{
			label: 'medical.prevention.treatments.physiotherapy.options.activeReleaseTechnique',
			value: 'activeReleaseTechnique'
		},
		{
			label: 'medical.prevention.treatments.physiotherapy.options.assistedMuscularStretching',
			value: 'assistedMuscularStretching'
		},
		{ label: 'medical.prevention.treatments.physiotherapy.options.capsularStretching', value: 'capsularStretching' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.chiropraticSession', value: 'chiropraticSession' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.compressionWrap', value: 'compressionWrap' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.deepTissueMassage', value: 'deepTissueMassage' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.dryNeedling', value: 'dryNeedling' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.jointMobilization', value: 'jointMobilization' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.generalMassage', value: 'generalMassage' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.mobilization', value: 'mobilization' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.paraffin', value: 'paraffin' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.prom', value: 'prom' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.pnf', value: 'pnf' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.pompage', value: 'pompage' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.reflexology', value: 'reflexology' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.traction', value: 'traction' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.transdermalRub', value: 'transdermalRub' },
		{
			label: 'medical.prevention.treatments.physiotherapy.options.triggerPointInjections',
			value: 'triggerPointInjections'
		},
		{ label: 'medical.prevention.treatments.physiotherapy.options.myofascialRelease', value: 'myofascialRelease' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.kneading', value: 'kneading' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.longitudinalGliding', value: 'longitudinalGliding' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.transverseFriction', value: 'transverseFriction' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.rhytmicCompression', value: 'rhytmicCompression' },
		{
			label: 'medical.prevention.treatments.physiotherapy.options.crossFibreFrictionTechniques',
			value: 'crossFibreFrictionTechniques'
		},
		{ label: 'medical.prevention.treatments.physiotherapy.options.swedishMassage', value: 'swedishMassage' }
	],
	thermotherapy: [
		{ label: 'medical.prevention.treatments.physiotherapy.options.coldWhirpool', value: 'coldWhirpool' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.cryotherapy', value: 'cryotherapy' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.gameReadyColdCompr', value: 'gameReadyColdCompr' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.hotPack', value: 'hotPack' },
		{
			label: 'medical.prevention.treatments.physiotherapy.options.hyperthermicTreatment',
			value: 'hyperthermicTreatment'
		},
		{ label: 'medical.prevention.treatments.physiotherapy.options.iceBag', value: 'iceBag' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.iceMassage', value: 'iceMassage' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.iceWhirpool', value: 'iceWhirpool' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.infraredHeat', value: 'infraredHeat' },
		{ label: 'medical.prevention.treatments.physiotherapy.options.contrastBathTherapy', value: 'contrastBathTherapy' }
	]
};
