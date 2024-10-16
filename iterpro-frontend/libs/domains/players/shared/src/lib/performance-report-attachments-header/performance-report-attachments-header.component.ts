import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconButtonComponent } from '@iterpro/shared/ui/components';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslateModule } from '@ngx-translate/core';
@Component({
	selector: 'iterpro-performance-report-attachments-header',
	standalone: true,
	imports: [IconButtonComponent, ProgressSpinnerModule, TranslateModule],
	templateUrl: './performance-report-attachments-header.component.html'
})
export class PerformanceReportAttachmentsHeaderComponent {
	@Input({ required: true }) title!: string;
	@Input({ required: true }) isLoading!: boolean;
	@Input({ required: true }) editable!: boolean;
	@Output() addClicked: EventEmitter<void> = new EventEmitter<void>();

	add(event: MouseEvent) {
		event.stopPropagation();
		this.addClicked.emit();
	}
}
