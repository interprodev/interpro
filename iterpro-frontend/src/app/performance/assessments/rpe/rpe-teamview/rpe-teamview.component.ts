import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { Event, SessionPlayerData } from '@iterpro/shared/data-access/sdk';
import { EditModeService } from '@iterpro/shared/utils/common-utils';
import * as Papa from 'papaparse';

@Component({
	selector: 'iterpro-rpe-teamview',
	templateUrl: './rpe-teamview.component.html',
	styleUrls: ['./rpe-teamview.component.css']
})
export class RpeTeamviewComponent {
	@Input() sessions: SessionPlayerData[] = [];
	@Input() selectedSession: Event;
	@Output() saveEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() deleteEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() csvUploadEmitter: EventEmitter<any> = new EventEmitter<any>();
	@Output() csvDownloadEmitter: EventEmitter<any> = new EventEmitter<any>();
	@ViewChild('inputjson', { static: true }) myInput: ElementRef;
	fileReader: FileReader;

	public readonly editService = inject(EditModeService);

	saveMultipleRpe() {
		if (this.sessions.length > 0) this.saveEmitter.emit(this.sessions);
	}

	deleteMultipleRpe() {
		this.deleteEmitter.emit(this.sessions);
	}

	fileChanged(event) {
		this.fileReader = new FileReader();
		this.fileReader.onload = e => {
			const csvData = this.fileReader.result;
			const resultsCsv: Papa.ParseResult<any> = Papa.parse(csvData.toString(), {
				header: true,
				skipEmptyLines: true
			});
			const csvMap = resultsCsv.data.reduce(
				(accumulator, target) => ({
					...accumulator,
					[target.displayName]: target
				}),
				{}
			);

			for (const pl of this.sessions) {
				if (csvMap[pl.playerName]) {
					if (csvMap[pl.playerName].rpe) pl.rpe = csvMap[pl.playerName].rpe;
				}
			}

			this.myInput.nativeElement.value = '';
			this.edit();
			this.csvUploadEmitter.emit();
		};

		// eslint-disable-next-line no-console
		this.fileReader.onerror = ev => console.error(ev);
		this.fileReader.readAsText(event.target.files[0]);
	}

	downloadCsvRpe() {
		this.csvDownloadEmitter.emit(this.selectedSession.start);
	}

	edit(event?) {
		this.editService.editMode = true;
	}

	goToPlanning(event: Event) {
		return {
			id: event?.id
		};
	}

	goToSessionAnalysis(event: Event) {
		return {
			id: event?.id,
			metric: !event?.gpsSessionLoaded ? 'rpe' : null
		};
	}
}
