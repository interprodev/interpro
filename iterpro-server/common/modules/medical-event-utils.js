const { getCustomerName } = require('../../server/shared/common-utils');
module.exports = {
	getMedicalExamsForEvent: async function (Model, event, field) {
		let result = [];
		if (field === '_preventionExams') {
			console.log(event.playerIds[0]);
			result = await Model.app.models.Player.findById(event.playerIds[0], {
				fields: [field]
			});
		} else {
			result = await Model.app.models.Injury.findById(event.injuryId, {
				fields: [field]
			});
		}
		return result[field].filter(({ eventId }) => String(eventId) === event.eventId);
	},
	getEventMedicalTreatmentsMapped: async function (Model, medicalTreatments) {
		let eventMedicalLocations = [];
		if (medicalTreatments && medicalTreatments.length > 0) {
			for (const treatment of medicalTreatments) {
				treatment.author = await getCustomerName(Model, treatment.author);
				treatment.prescriptor = await getCustomerName(Model, treatment.prescriptor);
				if (treatment?.injuryId) {
					const injury = await Model.app.models.Injury.findById(treatment.injuryId, {
						fields: ['id', 'issue', 'osics', 'chronicInjuryId', 'location']
					});
					const injuryLocation = injury?.location;
					if (injuryLocation) {
						if (!eventMedicalLocations || !eventMedicalLocations.includes(injuryLocation))
							eventMedicalLocations = [...(eventMedicalLocations || []), injuryLocation];
					}
					treatment.injuryDetail = injury;
				}
				treatment.category = getTreatmentCategory(treatment);
				treatment.treatment = getTreatmentLabel(treatment);
				treatment.filteredPhysioTreatmentOptions = null;
			}
		}
		return { medicalTreatments, eventMedicalLocations };
	}
};

function getTreatmentCategory(medicalTreatment) {
	if (medicalTreatment.treatmentType === 'SeC' || medicalTreatment.treatmentType === 'medicationSupplements') {
		return null;
	} else {
		if (Array.isArray(medicalTreatment.category)) {
			return medicalTreatment.category.map(item => (item ? `medical.prevention.treatments.physiotherapy.${item}` : ''));
		}
		return [`medical.prevention.treatments.physiotherapy.${medicalTreatment.category}`];
	}
}

function getTreatmentLabel(medicalTreatment) {
	if (!medicalTreatment.treatmentType) return null;
	if (medicalTreatment.treatmentType === 'medicationSupplements') {
		return null;
	} else {
		let baseLabel = `medical.prevention.treatments.${medicalTreatment.treatmentType.toLowerCase()}`;
		baseLabel = medicalTreatment.treatmentType === 'physiotherapy' ? `${baseLabel}.options` : baseLabel;
		return (medicalTreatment.treatment || []).map(treatment => {
			if (!treatment) return '';
			return `${baseLabel}.${treatment}`;
		});
	}
}
