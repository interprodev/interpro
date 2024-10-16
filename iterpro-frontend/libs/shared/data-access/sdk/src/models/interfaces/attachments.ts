import { Attachment } from '../../lib';
import { ContractType } from '../classes/contracts.model';

export type AttachmentCollections =
	| 'Event'
	| 'Drill'
	| 'Injury'
	| 'Attributes'
	| 'PlayerScouting'
	| 'ScoutingGame'
	| 'ScoutingLineup'
	| 'Test'
	| 'Team'
	| 'VideoAsset'
	| 'TestInstance'
	| 'PreventionExam'
	| 'MedicalTreatment'
	| 'ClinicalRecords'
	| 'EmploymentContract'
	| 'TransferContract';

export type AttachmentFileRepositoryResult = Attachment & {
	parentType: string;
	parentId: string;
	externalUrl: string;
	collection: string;
	peopleType?: string; // specific for contracts
	contractId?: string; // specific for contracts
	testId?: string; // specific for tests
	injuryId?: string; // specific for injuries
	playerId?: string; // specific for medical treatments
};

export type AttachmentFileRepository = Attachment & { redirects?: CollectionToSection[] };

export interface CollectionToSection {
	label: string;
	redirectUrl?: string;
	redirectLabel?: string;
}

export function attachmentCollectionToSection(attachment: AttachmentFileRepositoryResult): CollectionToSection[] {
	const parentId = attachment.parentType === 'Team' ? attachment?.externalUrl : attachment.parentId;
	switch (<AttachmentCollections>attachment.parentType) {
		case 'Event': // work, tested
			return [
				{
					label: 'dialog.file.sectionParent.event',
					redirectUrl: `/manager/planning;id=${parentId}`,
					redirectLabel: 'navigator.planning'
				}
			];
		case 'Drill': // work, tested
			return [
				{
					label: 'dialog.file.sectionsParents.drills',
					redirectUrl: `/manager/drills;id=${parentId}`,
					redirectLabel: 'drills'
				}
			];
		case 'MedicalTreatment':
			// eslint-disable-next-line no-case-declarations
			const base: CollectionToSection[] = [
				{
					label: 'dialog.file.sectionParent.preventionTreatment',
					redirectUrl: `/medical/maintenance;id=${attachment.playerId};tabIndex=3`,
					redirectLabel: 'medicalRecords'
				}
			];
			if (attachment.injuryId) {
				base.push({
					label: 'dialog.file.sectionParent.injuries', // this contains ex PreventionTreatment, InjuryTreatment
					redirectUrl: `/medical/infirmary;id=${attachment.injuryId}`,
					redirectLabel: 'infirmary'
				});
			}
			return base;
		case 'Injury': // work, tested
			return [
				{
					label: 'dialog.file.sectionParent.injuries', // this contains InjuryExam
					redirectUrl: `/medical/infirmary;id=${parentId}`,
					redirectLabel: 'infirmary'
				}
			];
		case 'Attributes': // work, tested
			return [
				{
					label: 'dialog.file.sectionParent.playerAttributes',
					redirectUrl: `/players/my-team;id=${parentId};tabIndex=5`,
					redirectLabel: 'profile.tabs.attributes'
				}
			];
		case 'PlayerScouting': // work, tested
			return [
				{
					label: 'dialog.file.sectionParent.playerScouting',
					redirectUrl: `/players/scouting;playerId=${parentId};tabIndex=1`,
					redirectLabel: 'Scouting Player'
				}
			];
		case 'ScoutingGame': // work, tested
			return [
				{
					label: 'dialog.file.sectionsParent.scoutingGames', // this contains also ScoutingGameReport
					redirectUrl: `/players/scouting;gameId=${parentId}`,
					redirectLabel: 'navigator.scouting'
				}
			];
		case 'ScoutingLineup': // work, tested
			return [
				{
					label: 'dialog.file.sectionParent.scoutingLineup',
					redirectUrl: `/players/scouting;scenarioId=${parentId}`,
					redirectLabel: 'navigator.scouting'
				}
			];
		case 'Test': // work, tested
			return [
				{
					label: 'dialog.file.sectionsParent.test',
					redirectUrl: `/performance/assessments;testId=${parentId}`,
					redirectLabel: 'assessment'
				}
			];
		case 'Team': // work, tested
			return [
				{
					// in this case the parentId is passed as externalUrl
					label: 'Team Preset Attachments',
					redirectUrl: `/performance/assessments;testId=${parentId}`,
					redirectLabel: 'assessment'
				}
			];
		case 'VideoAsset': // work, tested
			return [
				{
					label: 'dialog.file.sectionParent.videoGallery',
					redirectUrl: `/manager/video-gallery;id=${parentId}`,
					redirectLabel: 'navigator.videogallery'
				}
			];
		case 'PreventionExam': // work, tested
			return [
				{
					label: 'dialog.file.sectionParent.preventionExamination',
					redirectUrl: `/medical/maintenance;id=${parentId};tabIndex=1`,
					redirectLabel: 'medicalRecords'
				}
			];
		case 'ClinicalRecords': // work, tested
			return [
				{
					label: 'dialog.file.sectionParent.clinicalRecords',
					redirectUrl: `/medical/maintenance;id=${parentId};tabIndex=4`,
					redirectLabel: 'medicalRecords'
				}
			];
		case 'EmploymentContract': // work, tested
		case 'TransferContract': {
			// work, tested
			const peopleParam: 'player' | 'staff' = attachment.peopleType.toLowerCase() as 'player' | 'staff';
			return [
				{
					label: getContractTypeLabel(attachment.parentType as ContractType),
					redirectUrl: `/administration/squads;${peopleParam}Id=${parentId};tabIndex=1;contractId=${attachment.contractId}`
				}
			];
		}
		case 'TestInstance': // TODO whe don't find where is used
			return [
				{
					label: 'Test Instance',
					redirectUrl: `/performance/assessments;testId=${attachment.testId}id=${parentId}`,
					redirectLabel: 'navigator.examination'
				}
			];
		default:
			console.warn('Unknown collection: ' + attachment.collection);
			return [{ label: 'Unknown' }];
	}
}

function getContractTypeLabel(parentType: ContractType): string {
	switch (parentType) {
		case 'EmploymentContract':
			return 'dialog.file.sectionParent.employmentContract';
		case 'TransferContract':
			return 'dialog.file.sectionParent.transferContract';
	}
}
