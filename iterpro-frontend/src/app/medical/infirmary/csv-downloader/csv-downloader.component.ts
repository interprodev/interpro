import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CsvUploadDownloadComponent } from '@iterpro/shared/ui/components';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'iterpro-injuries-csv-downloader',
	templateUrl: './csv-downloader.component.html',
	styleUrls: ['./csv-downloader.component.css']
})
export class CsvDownloaderComponent extends CsvUploadDownloadComponent implements OnInit {
	@Output() downloadActiveInjuries: EventEmitter<any> = new EventEmitter();
	@Output() downloadAllInjuries: EventEmitter<any> = new EventEmitter();
	@Output() downloadAllInjuriesAllPlayers: EventEmitter<any> = new EventEmitter();

	@Input() downloadActiveLabel = 'infirmary.csv.downloadActive';
	@Input() downloadAllLabel = 'infirmary.csv.downloadAll';
	@Input() downloadAllInjuriesAllPlayersLabel = 'infirmary.csv.downloadAllPlayers';

	readonly #translateService = inject(TranslateService);

	update() {
		this.items = [];

		if (this.downloadActiveInjuries.observers.length > 0)
			this.items.push({
				label: this.#translateService.instant(this.downloadActiveLabel),
				icon: 'fal fa-download',
				command: this.downloadActiveInjuries
			});
		if (this.downloadAllInjuries.observers.length > 0)
			this.items.push({
				label: this.#translateService.instant(this.downloadAllLabel),
				icon: 'fal fa-download',
				command: this.downloadAllInjuries
			});
		if (this.downloadAllInjuriesAllPlayers.observers.length > 0)
			this.items.push({
				label: this.#translateService.instant(this.downloadAllInjuriesAllPlayersLabel),
				icon: 'fal fa-download',
				command: this.downloadAllInjuriesAllPlayers
			});
		if (this.enableCSV && this.uploadCSV.observers.length > 0)
			this.items.push({
				label: this.#translateService.instant(this.uploadLabel),
				icon: 'fas fa-upload',
				command: this.uploadCSV
			});
	}
}
