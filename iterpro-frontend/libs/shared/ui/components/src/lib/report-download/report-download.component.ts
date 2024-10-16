import { NgFor, NgIf, NgStyle } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { ClickOutsideDirective } from '@iterpro/shared/ui/directives';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	selector: 'iterpro-report-download',
	standalone: true,
	imports: [ProgressSpinnerModule, NgFor, NgIf, NgStyle, ClickOutsideDirective, IconButtonComponent, TooltipModule, TranslateModule],
	templateUrl: './report-download.component.html',
	styleUrls: ['./report-download.component.scss']
})
export class ReportDownloadComponent implements OnInit, OnChanges {
	items: ReportItem[] = [];
	isOpen = false;
	tooltip!: string;
	@Input() enablePDF = true;
	@Input() enableCSV = true;
	@Input() isLoading!: boolean;

	@Output() downloadPDF: EventEmitter<any> = new EventEmitter();
	@Output() downloadCSV: EventEmitter<any> = new EventEmitter();
	csvTooltip = 'download.csv';
	pdfTooltip = 'download.pdf';
	bothTooltip = 'download.pdfCsv';
	ngOnInit() {
		this.update();
	}

	ngOnChanges() {
		this.update();
	}

	update() {
		this.items = [];
		if (this.enablePDF && this.downloadPDF.observers.length > 0) {
			this.tooltip = this.pdfTooltip;
			this.items.push({
				label: 'PDF',
				icon: 'fa-file-pdf',
				tooltip: this.pdfTooltip,
				command: this.downloadPDF
			});
		}
		if (this.enableCSV && this.downloadCSV.observers.length > 0) {
			this.tooltip = this.csvTooltip;
			this.items.push({
				label: 'CSV',
				icon: 'fa-file-excel',
				tooltip: this.csvTooltip,
				command: this.downloadCSV
			});
		}
		if (this.enablePDF && this.enableCSV && this.downloadPDF.observers.length > 0 && this.downloadCSV.observers.length > 0) {
			this.tooltip = this.bothTooltip;
		}
	}

	itemClick(item: ReportItem) {
		this.isOpen = false;
		item.command.emit();
	}

	setOpen(isOpen: boolean) {
		this.isOpen = isOpen;
	}
}

interface ReportItem {
	label: string;
	icon: string;
	tooltip: string;
	command: any;
}
