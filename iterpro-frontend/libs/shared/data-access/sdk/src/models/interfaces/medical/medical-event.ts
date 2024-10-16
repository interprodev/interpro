import { Event, InjuryExam, MedicalTreatment, PreventionExam } from '../../../lib';

export type MedicalFieldType = 'treatment' | 'exam';
export type MedicalEvent = Event & {
	preventionExams?: PreventionExam[];
	injuryExams?: InjuryExam[];
	medicalTreatments?: MedicalTreatment[];
};
