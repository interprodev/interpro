import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { OSICS } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, FormsModule],
	selector: 'iterpro-osiics-dialog',
	templateUrl: './osiics-dialog.component.html',
	styleUrls: ['./osiics-dialog.component.css']
})
export class OsiicsDialogComponent implements OnChanges {
	@Input() visible: boolean = false;
	@Input() osics: OSICS[] = [];
	@Input() preselected: string = null;
	@Output() save: EventEmitter<OSICS> = new EventEmitter<OSICS>();
	@Output() discard: EventEmitter<void> = new EventEmitter<void>();

	selected: OSICS = null;

	constructor() {}

	ngOnChanges() {
		this.selected = this.preselected ? this.osics.find(({ code }) => code === this.preselected) : null;
	}

	emitSave() {
		this.save.emit(this.selected);
	}

	emitDiscard() {
		this.discard.emit();
	}
}
