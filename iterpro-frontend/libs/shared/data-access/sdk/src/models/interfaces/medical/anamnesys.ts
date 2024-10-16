export interface Anamnesys {
	id: string;
	date: Date;
	expirationDate: Date;
	cloudUrl: string;
	author: string;
	authorId: string;
	_attachments?: any[];
	notes?: string;
	form: {
		fluLikeSymptoms: {
			value: string;
			description: string;
		};
		infections: {
			value: string;
			description: string;
		};
		rheumaticFever: {
			value: string;
			description: string;
		};
		heatIllness: {
			value: string;
			description: string;
		};
		concussion: {
			value: string;
			description: string;
		};
		diarrhoeaIllness: {
			value: string;
			description: string;
		};
		dysmenorrhoea: {
			value: string;
			description: string;
		};
		amenorrhoea: {
			value: string;
			description: string;
		};
		allergiesFood: {
			value: string;
			description: string;
		};
		allergiesDrugs: {
			value: string;
			description: string;
		};
		gastrointestinalUpset: {
			value: string;
			description: string;
		};
		chestPain: {
			value: string;
			description: string;
		};
		shortnessBreath: {
			value: string;
			description: string;
		};
		asthma: {
			value: string;
			description: string;
		};
		cough: {
			value: string;
			description: string;
		};
		bronchitis: {
			value: string;
			description: string;
		};
		palpitations: {
			value: string;
			description: string;
		};
		otherHeartProb: {
			value: string;
			description: string;
		};
		dizziness: {
			value: string;
			description: string;
		};
		syncope: {
			value: string;
			description: string;
		};
		hypertension: {
			value: string;
			description: string;
		};
		heartMurmur: {
			value: string;
			description: string;
		};
		abnormalLipidProfile: {
			value: string;
			description: string;
		};
		seizures: {
			value: string;
			description: string;
		};
		giveUp: {
			value: string;
			description: string;
		};
		quicklyTired: {
			value: string;
			description: string;
		};
		sleeplessness: {
			value: string;
			description: string;
		};
		pregnant: {
			value: string;
			description: string;
		};
		cardiacDeath: {
			value: string;
		};
		infantDeath: {
			value: string;
		};
		coronaryHeartDisease: {
			value: string;
		};
		cardiomyopathy: {
			value: string;
		};
		familyHypertension: {
			value: string;
		};
		recurrentSyncope: {
			value: string;
		};
		arrhytmias: {
			value: string;
		};
		heartTransplantation: {
			value: string;
		};
		heartSurgery: {
			value: string;
		};
		pacemaker: {
			value: string;
		};
		marfanSyndrome: {
			value: string;
		};
		drowning: {
			value: string;
		};
		carAccident: {
			value: string;
		};
		stroke: {
			value: string;
		};
		diabetes: {
			value: string;
		};
		cancer: {
			value: string;
		};
		familyOther: {
			value: string;
		};
		nonSteroidalDrugs: {
			value: string;
		};
		asthmaMedication: {
			value: string;
		};
		antihypertensiveDrugs: {
			value: string;
		};
		lipidLoweringDrugs: {
			value: string;
		};
		antidiabeticDrugs: {
			value: string;
		};
		hormonalContraceptive: {
			value: string;
		};
		psychotropicDrugs: {
			value: string;
		};
		medicationOther: {
			value: string;
			description: string;
		};
		hormonalMethods: {
			value: string;
			description: string;
		};
		nutritionalSupplement: {
			value: string;
			description: string;
		};
		vaccination: {
			value: string;
		};
		height: {
			value: number;
		};
		weight: {
			value: number;
		};
		thyroidGland: {
			value: string;
		};
		lymphNodes: {
			value: string;
		};
		percussion: {
			value: string;
		};
		breathSounds: {
			value: string;
		};
		palpation: {
			value: string;
		};
		marfanCriteria: {
			value: string;
			description: string[];
			other: string;
		};
		bloodGroup: {
			value: string;
			rh: string;
		};
		haemoglobin: {
			value: string;
		};
		haematocrit: {
			value: string;
		};
		erythrocytes: {
			value: string;
		};
		thrombocytes: {
			value: string;
		};
		leukocytes: {
			value: string;
		};
		mcv: {
			value: string;
		};
		mchc: {
			value: string;
		};
		sodium: {
			value: string;
		};
		potassium: {
			value: string;
		};
		calcium: {
			value: string;
		};
		phosphorus: {
			value: string;
		};
		magnesium: {
			value: string;
		};
		iron: {
			value: string;
		};
		uricAcid: {
			value: string;
		};
		creatinine: {
			value: string;
		};
		cholesterolTotal: {
			value: string;
		};
		ldlCholesterol: {
			value: string;
		};
		hdlCholesterol: {
			value: string;
		};
		triglycerides: {
			value: string;
		};
		glucose: {
			value: string;
		};
		creactiveProtein: {
			value: string;
		};
		ferritin: {
			value: string;
		};
		creatinKinasi: {
			value: string;
		};
		aspartateAminoTransferasi: {
			value: string;
		};
		alanineAminoTransferasi: {
			value: string;
		};
		gammaGlutamylTransferasi: {
			value: string;
		};
		medicalHistory: {
			value: string;
			descriptionNotRecomm: string;
			descriptionFollowUp: string;
		};
		clinicalExamination: {
			value: string;
			descriptionNotRecomm: string;
			descriptionFollowUp: string;
		};
		LeadECG: {
			value: string;
			descriptionNotRecomm: string;
			descriptionFollowUp: string;
		};
		echocardiography: {
			value: string;
			descriptionNotRecomm: string;
			descriptionFollowUp: string;
		};
		otherFindings: {
			value: string;
			descriptionNotRecomm: string;
			descriptionFollowUp: string;
		};
		eligibility: {
			value: string;
		};
		spinalPelvic: {
			value: string;
			description: string;
		};
		pelvicLevel: {
			value: string;
			orientation: {
				val: string;
				description: number;
			};
		};
		sacroiliacJoint: {
			value: string;
		};
		cervicalRotationLeft: {
			value: number;
			pain: string;
		};
		cervicalRotationRight: {
			value: number;
			pain: string;
		};
		spinalFlexion: {
			value: number;
		};
		hipFlexionLeft: {
			value: string;
			description: number;
			pain: string;
		};
		hipFlexionRight: {
			value: string;
			description: number;
			pain: string;
		};
		hipExtensionLeft: {
			value: string;
			description: number;
			pain: string;
		};
		hipExtensionRight: {
			value: string;
			description: number;
			pain: string;
		};
		inwardRotationLeft: {
			value: number;
			pain: string;
		};
		inwardRotationRight: {
			value: number;
			pain: string;
		};
		outwardRotationLeft: {
			value: number;
			pain: string;
		};
		outwardRotationRight: {
			value: number;
			pain: string;
		};
		abductionLeft: {
			value: number;
			pain: string;
		};
		abductionRight: {
			value: number;
			pain: string;
		};
		tendernessLeft: {
			value: string;
		};
		tendernessRight: {
			value: string;
		};
		herniaLeft: {
			value: string;
			description: string;
		};
		herniaRight: {
			value: string;
			description: string;
		};
		adductorsLeft: {
			value: string;
			pain: string;
		};
		adductorsRight: {
			value: string;
			pain: string;
		};
		hamstringsLeft: {
			value: string;
			pain: string;
		};
		hamstringsRight: {
			value: string;
			pain: string;
		};
		iliopsoasLeft: {
			value: string;
			pain: string;
		};
		iliopsoasRight: {
			value: string;
			pain: string;
		};
		rectusFemorisLeft: {
			value: string;
			pain: string;
		};
		rectusFemorisRight: {
			value: string;
			pain: string;
		};
		tensorFasciaLeft: {
			value: string;
			pain: string;
		};
		tensorFasciaRight: {
			value: string;
			pain: string;
		};
		kneeJoinAxisLeft: {
			value: string;
		};
		kneeJoinAxisRight: {
			value: string;
		};
		kneeFlexionLeft: {
			value: string;
			limitedValue: number;
			pain: string;
		};
		kneeFlexionRight: {
			value: string;
			limitedValue: number;
			pain: string;
		};
		kneeExtensionLeft: {
			value: string;
			limitedValue: number;
			hyperExtValue: number;
			pain: string;
		};
		kneeExtensionRight: {
			value: string;
			limitedValue: number;
			hyperExtValue: number;
			pain: string;
		};
		lachmanTestLeft: {
			value: string;
		};
		lachmanTestRight: {
			value: string;
		};
		anteriorDrawerSignLeft: {
			value: string;
		};
		anteriorDrawerSignRight: {
			value: string;
		};
		posteriorDrawerSignLeft: {
			value: string;
		};
		posteriorDrawerSignRight: {
			value: string;
		};
		valgusStressExtensionLeft: {
			value: string;
		};
		valgusStressExtensionRight: {
			value: string;
		};
		valgusStressFlexionLeft: {
			value: string;
		};
		valgusStressFlexionRight: {
			value: string;
		};
		varusStressExtensionLeft: {
			value: string;
		};
		varusStressExtensionRight: {
			value: string;
		};
		varusStressFlexionLeft: {
			value: string;
		};
		varusStressFlexionRight: {
			value: string;
		};
		tendernessAchillesLeft: {
			value: string;
		};
		tendernessAchillesRight: {
			value: string;
		};
		legAnteriorDrawerLeft: {
			value: string;
		};
		legAnteriorDrawerRight: {
			value: string;
		};
		dorsiFlexionLeft: {
			value: number;
			pain: string;
		};
		dorsiFlexionRight: {
			value: number;
			pain: string;
		};
		plantarFlexionLeft: {
			value: number;
			pain: string;
		};
		plantarFlexionRight: {
			value: number;
			pain: string;
		};
		totalSupinationLeft: {
			value: string;
		};
		totalSupinationRight: {
			value: string;
		};
		totalPronationLeft: {
			value: string;
		};
		totalPronationRight: {
			value: string;
		};
		metatarsoLeft: {
			value: string;
		};
		metatarsoRight: {
			value: string;
		};
		heartRate12Lead: {
			value: number;
		};
		rhythmConduction: {
			value: string;
			description: string;
			description2: string;
		};
		timeIndices: {
			pq: number;
			qrs: number;
			qtc: number;
		};
		atrialEnlargement: {
			value: string;
		};
		axis: {
			value: string;
		};
		voltage: {
			value: string;
		};
		lvHypertrophy: {
			value: string;
		};
		qWaves: {
			value: string;
		};
		bundleBranchBlock: {
			value: string;
			description: string;
		};
		rWave: {
			value: string;
		};
		repolarisation: {
			value: string;
			stDepression: {
				value: string;
			};
			stElevation: {
				value: string;
			};
			tWaveFlattening: {
				value: string;
			};
			tWaveInversion: {
				value: string;
			};
		};
		bsa: {
			value: string;
		};
		summaryECG: {
			value: string;
		};
		endDiastolicDiameter: {
			value: number;
		};
		endSystolicDiameter: {
			value: number;
		};
		endDiastolicIntraVentricular: {
			value: number;
		};
		endDiastolicPosterior: {
			value: number;
		};
		lvDiastolicVol: {
			value: number;
		};
		lvSystolicVol: {
			value: number;
		};
		lvmmi: {
			value: number;
		};
		leftAtriumDiameter: {
			value: number;
		};
		leftAtriumArea: {
			value: number;
		};
		rightAtriumArea: {
			value: number;
		};
		ivcDiameter: {
			value: number;
		};
		respiratoryVarIVC: {
			value: string;
		};
		midRVDiameter: {
			value: number;
		};
		baseToApexLen: {
			value: number;
		};
		fac: {
			value: number;
		};
		tam: {
			value: number;
		};
		systolicRVRAGradient: {
			value: number;
		};
		rightVenRegionalWallMotion: {
			value: string;
		};
		localAneurysm: {
			value: string;
		};
		hypertrophy: {
			value: string;
		};
		freeWallThickness: {
			value: number;
		};
		aorticValves: {
			value: string;
		};
		mitralValves: {
			value: string;
		};
		tricuspidValve: {
			value: string;
		};
		pulmonalValve: {
			value: string;
		};
		valveAbnormalities: {
			value: string;
		};
		aorticRoot: {
			value: number;
		};
		aorticAscendens: {
			value: number;
		};
		summaryEchoCariodGraphy: {
			value: string;
		};
		commentsCardio: {
			value: string;
		};
		mitralAnteriorMov: {
			value: number;
		};
		ejectionFraction: {
			value: number;
		};
		regionalWallMotion: {
			value: string;
		};
		eWave: {
			value: number;
		};
		aWave: {
			value: number;
		};
		eaRatio: {
			value: number;
		};
		decelerationTime: {
			value: number;
		};
		eTissueDoppler: {
			septal: number;
			lateral: number;
			eeRatio: number;
		};
		rhythm: {
			value: string;
		};
		heartSounds: {
			value: string;
			description: string[];
		};
		heartMurmurs: {
			value: string;
			description: string[];
		};
		peripheralOedema: {
			value: string;
		};
		jugularVeins: {
			value: string;
		};
		hepatoJugularReflux: {
			value: string;
		};
		peripheralPulses: {
			value: string;
		};
		delayFemoralPulses: {
			value: string;
		};
		vascularBruits: {
			value: string;
		};
		varicoseVeins: {
			value: string;
		};
		heartRateAfter5MinRest: {
			value: number;
		};
		bloodPressureRightArm: {
			min: number;
			max: number;
		};
		bloodPressureLeftArm: {
			min: number;
			max: number;
		};
		bloodPressureAnkle: {
			min: number;
			max: number;
		};

		hasInjury: {
			value: string;
		};

		severeInjuries: Injury[];

		injuryOther: {
			value: string;
		};

		hasOperations: {
			value: string;
		};

		operations: Operation[];

		operationOther: {
			value: string;
		};

		hasComplaints: {
			value: string;
		};

		complaints: Complaint[];

		complaintOther: {
			value: string;
		};

		hasDiagnosis: {
			value: string;
		};

		diagnosis: Diagnosis[];

		diagnosisOther: {
			value: string;
		};
	}; // DEPRECATED; NOT CONSIDER ID ANYMORE
}

class Injury {
	value: string;
	type: string;
	occurrence: number;
}

export class Operation {
	value: string;
	type: string;
	occurrence: number;
}

export class Complaint {
	value: string;
	type: string;
}

export class Diagnosis {
	value: string;
	type: string;
	treatment: string;
}
