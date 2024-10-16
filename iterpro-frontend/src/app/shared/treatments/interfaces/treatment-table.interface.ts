import { MedicalTreatment, TreatmentMetric } from '@iterpro/shared/data-access/sdk';

export type TreatmentType = MedicalTreatment & {
	attachedFile?: File;
	filteredPhysioTreatmentOptions?: TreatmentMetric[];
};
export type TreatmentSection = 'prevention' | 'injury';

export interface TreatmentColumn {
	header: string;
	width: string;
	frozen?: boolean;
	tooltip?: string;
	align?: 'left' | 'center' | 'right';
	required?: boolean;
	field?: string;
}
export interface SaveTreatmentEvent {
	instance: MedicalTreatment;
	index?: number;
	attachedFile: File;
}

export interface DeleteTreatmentEvent {
	instance: MedicalTreatment;
	index?: number;
	alsoEvent?: boolean;
	localRowIndex?: number;
}

export interface ApplyToPlayersEvent {
	instance: MedicalTreatment;
	playerIds: string[];
}
