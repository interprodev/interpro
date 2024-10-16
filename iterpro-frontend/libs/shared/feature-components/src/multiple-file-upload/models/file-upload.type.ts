import { SelectItem } from 'primeng/api';
import { AttachmentFileRepository } from '@iterpro/shared/data-access/sdk';

export interface Filters {
	authorsOptions: SelectItem[];
	selectedAuthorIds: string[];
	sectionOptions: SelectItem[];
	selectedSections: string[];
	datePeriod: Date[];
	fileTypesOptions: SelectItem[];
	selectedFileTypes: string[];
}

export interface ExtendedAttachment extends AttachmentFileRepository {
	sharedWith: string[]; // this contains ids of staff and players
	sections?: string[]; // this is used to group the attachments in the table, it's visible for Team File Repository
}
