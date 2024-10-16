import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFileExcel } from '@fortawesome/pro-solid-svg-icons';
import { ClickOutsideDirective } from '@iterpro/shared/ui/directives';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';

@Component({
	standalone: true,
	imports: [CommonModule, FontAwesomeModule, TranslateModule, ClickOutsideDirective, TooltipModule],
	selector: 'iterpro-csv-upload-download',
	templateUrl: './csv-upload-download.component.html',
	styleUrls: ['./csv-upload-download.component.css']
})
export class CsvUploadDownloadComponent implements OnInit, OnChanges {
	/** Services */
	readonly #translateService = inject(TranslateService);

	/** Inputs & Outputs */
	@Output() downloadEmptyCSV: EventEmitter<any> = new EventEmitter();
	@Output() uploadCSV: EventEmitter<any> = new EventEmitter();
	@Input() enableEmptyCSV = true;
	@Input() enableCSV = true;
	@Input() uploadLabel = 'surveys.csvUpload';
	@Input() downloadLabel = 'surveys.downloadEmptyCSV';

	/** Data */
	items: any[] = [];
	isOpen = false;

	/** Icons */
	readonly faCsv = faFileExcel;

	/** Methods */
	ngOnInit() {
		this.update();
	}

	ngOnChanges() {
		this.update();
	}

	update() {
		this.items = [];

		if (this.enableEmptyCSV && this.downloadEmptyCSV.observers.length > 0)
			this.items.push({
				label: this.#translateService.instant(this.downloadLabel || 'surveys.downloadEmptyCSV'),
				icon: 'fal fa-download',
				command: this.downloadEmptyCSV
			});
		if (this.enableCSV && this.uploadCSV.observers.length > 0)
			this.items.push({
				label: this.#translateService.instant(this.uploadLabel || 'surveys.csvUpload'),
				icon: 'fas fa-upload',
				command: this.uploadCSV
			});
	}

	itemClick(item) {
		this.isOpen = false;
		item.command.emit();
	}

	setOpen(isOpen: boolean) {
		this.isOpen = isOpen;
	}
}
