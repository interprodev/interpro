import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeamTableFilterTemplate } from '@iterpro/shared/data-access/sdk';
import { TranslateModule } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

@Component({
	standalone: true,
	imports: [NgIf, DropdownModule, FormsModule, TranslateModule, TooltipModule, InputTextModule],
	selector: 'iterpro-table-filter-template-selection',
	templateUrl: './table-filter-template-selection.component.html',
	styleUrls: ['./table-filter-template-selection.component.scss']
})
export class TableFilterTemplateSelectionComponent {
	@Input() templates!: TeamTableFilterTemplate[];
	@Input() selectedTemplate!: TeamTableFilterTemplate;
	@Input() favoriteTemplate!: TeamTableFilterTemplate;
	@Input() editMode = false;

	@Output() deletedEmitter: EventEmitter<TeamTableFilterTemplate> = new EventEmitter<TeamTableFilterTemplate>();
	@Output() savedEmitter: EventEmitter<SaveEventEmitter> = new EventEmitter<SaveEventEmitter>();
	@Output() selectedEmitter: EventEmitter<TeamTableFilterTemplate> = new EventEmitter<TeamTableFilterTemplate>();
	@Output() markAsFavoriteEmitter: EventEmitter<TeamTableFilterTemplate> = new EventEmitter<TeamTableFilterTemplate>();

	backupTemplate!: TeamTableFilterTemplate;
	hasChanged = true;

	onSelectTemplate(event: any) {
		this.selectedEmitter.emit(event.value);
	}

	onEditTemplate() {
		this.backupTemplate = cloneDeep(this.selectedTemplate);
		this.editMode = true;
	}

	onDeleteTemplate() {
		this.deletedEmitter.emit(this.selectedTemplate);
	}

	onSaveTemplate() {
		this.savedEmitter.emit({ template: this.selectedTemplate, directlyUpdateCurrent: this.editMode });
		this.editMode = false;
	}

	onDiscard() {
		this.selectedTemplate = cloneDeep(this.backupTemplate);
		this.editMode = false;
	}

	onUpdateName(event: string) {
		this.selectedTemplate = {
			...this.selectedTemplate,
			templateName: event
		};
	}

	onMarkAsFavorite() {
		if (this.selectedTemplate.id === this.favoriteTemplate.id) return;
		this.markAsFavoriteEmitter.emit(this.selectedTemplate);
	}
}

export interface SaveEventEmitter {
	template: TeamTableFilterTemplate;
	directlyUpdateCurrent: boolean; // directly update without opening the confirmation dialog
}
