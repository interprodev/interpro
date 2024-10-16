import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ContractPersonType, LoopBackAuth, People, Team } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

@Component({
	selector: 'iterpro-archiviation-dialog',
	templateUrl: './archiviation-dialog.component.html',
	styleUrls: ['./archiviation-dialog.component.css']
})
export class ArchiviationDialogComponent implements OnInit {
	@Input() personType: ContractPersonType;
	@Input() element: People;
	@Input() team: Team;
	@Output() onSave: EventEmitter<any> = new EventEmitter<any>();
	@Output() onDiscard: EventEmitter<any> = new EventEmitter<any>();

	today: Date;

	readonly #translateService = inject(TranslateService);
	readonly #auth = inject(LoopBackAuth);

	ngOnInit() {
		this.#translateService.getTranslation(this.#translateService.currentLang).subscribe(x => {
			this.element.archivedDate = moment().toDate();
		});
		this.today = moment().toDate();
	}

	save(element: People) {
		element.archived = true;
		// FIX IT: motivation ha no value
		element._statusHistory = [
			...(element._statusHistory || []),
			{
				date: element.archivedDate,
				archived: true,
				status: element.currentStatus,
				motivation: element.archivedMotivation,
				author: this.#auth.getCurrentUserId()
			}
		];
		this.onSave.emit(element);
	}

	discard() {
		this.onDiscard.emit();
	}
}
