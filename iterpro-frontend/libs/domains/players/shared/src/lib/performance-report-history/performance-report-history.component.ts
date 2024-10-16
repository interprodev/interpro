import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { SelectItemLabelPipe } from '@iterpro/shared/ui/pipes';
import { SelectItem } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	selector: 'iterpro-performance-report-history',
	standalone: true,
	imports: [CommonModule, FormatDateUserSettingPipe, SelectItemLabelPipe, TranslateModule],
	templateUrl: './performance-report-history.component.html'
})
export class PerformanceReportHistoryComponent {
	@Input({ required: true }) lastUpdateDate!: Date;
	@Input({ required: true }) lastUpdateAuthor!: string;
	@Input({ required: true }) authorOptions!: SelectItem[];
}
