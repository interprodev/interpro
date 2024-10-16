const { ObjectID } = require('mongodb');
const { groupBy } = require('lodash');
module.exports = function (MedicalTreatment) {
	MedicalTreatment.canBeDetachedFromEvent = async function (treatmentId, eventId, treatmentDate) {
		if (!eventId || !treatmentId || !treatmentDate) {
			throw new Error('Missing treatmentId or eventId or treatmentDate');
		}
		const treatments = await MedicalTreatment.find({
			where: { eventId: ObjectID(eventId) }
		});
		const data = (treatments || []).map(item => {
			if (String(item.id) === treatmentId) {
				item.date = treatmentDate;
			}
			return item;
		});
		return instancesHasDifferentDates(data);
	};
};

function instancesHasDifferentDates(treatments = []) {
	const groupedByDateRows = groupBy(treatments, 'date');
	return Object.values(groupedByDateRows).length > 1;
}
