import {
	GOScore,
	Injury,
	InjuryExam,
	MedicalTreatment,
	Player,
	Test,
	TestInstance
} from '@iterpro/shared/data-access/sdk';

export type TreatmentStatus = 'done' | 'undone' | 'todo';
export type Treatment = MedicalTreatment | InjuryExam;
export type TreatmentsByStatus = Record<TreatmentStatus, Treatment[]>;
export type FunctionalTestInstance = Pick<TestInstance, 'id' | 'testId' | '_testResults' | 'date'> &
	Pick<Test, 'name' | 'purpose'>;

export interface MedicalPreventionPlayer extends Player {
	preventionPast: Treatment[];
	preventionPastDescription: string;
	preventionNext: Treatment[];
	preventionNextDescription: string;
	expiration: boolean;
	expirationDescription: string;
	flaredUp: Injury;
	goScoresMap: Map<string, GOScore>;
	oldGoScoresMap: Map<string, GOScore>;
	injuryStatus: string;
	readiness: string;
	readiness48h: string;
	readiness7d: string;
	readinessValue: number;
	dayTreatments: TreatmentsByStatus;
	dayMedicalExams: TreatmentsByStatus;
	dayFunctionalTests: FunctionalTestInstance[];
	birthDateText: string;
}
