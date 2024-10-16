import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { NgClass, NgIf } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';

type SemaphoreColor = 'GREEN' | 'YELLOW' | 'RED';

@Component({
	standalone: true,
	selector: 'iterpro-documents-expiry-date-flag',
	template: `
		<div *ngIf="!!expiryDate" [ngClass]="['point', color]" [pTooltip]="tooltipText"></div>
	`,
	imports: [
		NgClass,
		TooltipModule,
		NgIf
	],
	styles: [
		`
        .point {
            margin: auto;
        }

        .point.YELLOW {
            background-color: rgb(255, 255, 48);
        }
		`
	]
})
export class DocumentsExpiryDateFlagComponent implements OnInit {
	@Input() expiryDate!: string;
	@Input() documents: any[] = [];
	@Input() daysBeforeExpiry = 7;
	tooltipText = '';
	color: SemaphoreColor = 'GREEN';
	constructor(private translate: TranslateService) {}

	ngOnInit() {
		const today = moment();
		const expiryDate = moment(this.expiryDate, getMomentFormatFromStorage());
		this.color = today.isAfter(expiryDate)
			? 'RED'
			: expiryDate.isBefore(today.add(this.daysBeforeExpiry, 'days'))
			? 'YELLOW'
			: 'GREEN';

		this.tooltipText = this.documents
			.filter(doc => !!doc.expiryDate || !!doc.expirationDate)
			.sort((doc1, doc2) =>
				moment(doc1.expiryDate || doc1.expirationDate).isBefore(moment(doc2.expiryDate || doc2.expirationDate)) ? -1 : 1
			)
			.map(
				doc =>
					`${doc.type ? `${this.translate.instant(doc.type)}:` : ''} ${moment(
						doc.expiryDate || doc.expirationDate
					).format(getMomentFormatFromStorage())}`
			)
			.join('\n');
	}
}
