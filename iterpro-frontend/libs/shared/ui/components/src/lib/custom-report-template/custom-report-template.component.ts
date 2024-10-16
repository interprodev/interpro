import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertySchema, Schema, StyleResult } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { getComputedValue, getOptionsByType, getStyle, getStyleForFunction } from '@iterpro/shared/utils/common-utils';
import { ArrayFromNumberPipe, SelectItemPipe } from '@iterpro/shared/ui/pipes';
import { CustomReportCommentChangeOutput, CustomReportDataChangeOutput } from './models/custom-report-template.model';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { EditorDialogComponent } from '../editor-dialog/editor-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';

@Component({
	selector: 'iterpro-custom-report-template',
	standalone: true,
	imports: [CommonModule, PrimeNgModule, TranslateModule, FormsModule, SelectItemPipe, ArrayFromNumberPipe],
	templateUrl: './custom-report-template.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomReportTemplateComponent {
	@Input({ required: true }) disabled!: boolean;
	@Input({ required: true }) schema!: Schema;
	@Input({ required: true }) reportData!: { [key: string]: any };
	@Input() isEditorPreview!: boolean;
	@Output() reportDataChange: EventEmitter<CustomReportDataChangeOutput> =
		new EventEmitter<CustomReportDataChangeOutput>();

	readonly #dialogService = inject(DialogService);
	readonly #translateService = inject(TranslateService);
	readonly booleanOptions: SelectItem[] = [
		{ label: 'Yes', value: true },
		{ label: 'No', value: false }
	];

	getComputedValue(sectionId: string, property: PropertySchema) {
		const data = this.isEditorPreview ? this.reportData : this.reportData[sectionId];
		return getComputedValue(data, property);
	}

	getStyle(property: PropertySchema, item: SelectItem): StyleResult {
		return getStyle(property, item);
	}

	getStyleForFunction(sectionProperties: PropertySchema[], property: PropertySchema, computedValue: any): StyleResult {
		return getStyleForFunction(sectionProperties, property, computedValue);
	}

	onReportDataChange(sectionId: string, propertyName: string, eventValue: any) {
		this.reportDataChange.emit({ sectionId, propertyName, eventValue });
	}

	getOptionsByType(property: PropertySchema): SelectItem[] {
		return getOptionsByType(property) as SelectItem[];
	}

	openPropertyCommentDialog(sectionId: string, propertyName: string) {
		const commentPropertyName = 'comment' + propertyName;
		const ref = this.createEditorDialog(this.reportData?.[sectionId]?.[commentPropertyName]);
		ref.onClose.subscribe((report: string) => {
			if (report) {
				this.onReportDataChange(sectionId, commentPropertyName, report);
			}
		});
	}

	private createEditorDialog(report: string): DynamicDialogRef {
		return this.#dialogService.open(EditorDialogComponent, {
			data: { editable: !this.disabled, content: report },
			width: '50%',
			header: this.#translateService.instant('scouting.game.reportText'),
			closable: this.disabled
		});
	}
}
