import { Pipe } from '@angular/core';
import { Attachment } from '@iterpro/shared/data-access/sdk';

@Pipe({
	name: 'playerReportDocuments'
})
export class PlayerReportDocumentsPipe {
	transform(attachments: Attachment[], playerId: string): Attachment[] {
		return (attachments || []).filter(({ sharedPlayerIds }) => (sharedPlayerIds || []).includes(playerId));
	}
}
