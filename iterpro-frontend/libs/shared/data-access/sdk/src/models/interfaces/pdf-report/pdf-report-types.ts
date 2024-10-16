import { EventSourceInput, LocaleInput, LocaleSingularArg } from '@fullcalendar/core';
import { ResourceSourceInput } from '@fullcalendar/resource';
import { PdfBase } from './pdf-report';

export interface TimelineDailyViewPDF extends PdfBase {
	calendar: {
		events: EventSourceInput;
		resources: ResourceSourceInput;
		locale: LocaleSingularArg;
		locales: LocaleInput[];
		initialDate: Date;
	};
	list: { resourceName: string; resourceDownloadUrl?: string; events: InputEvent[] }[];
}
