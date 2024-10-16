import { NgFor, NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, Input, TemplateRef, ViewEncapsulation } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TranslateModule } from '@ngx-translate/core';

export type TableField = {
	value: string;
	tooltip: string;
	frozen: boolean;
};

@Component({
	standalone: true,
	imports: [TableModule, NgFor, NgTemplateOutlet, TranslateModule],
	selector: 'iterpro-table-stats',
	templateUrl: './table-stats.component.html',
	styleUrls: ['./table-stats.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class TableStatsComponent {
	@Input() headers!: TableField[] | string[];
	@Input() rows!: TableField[][];

	@ContentChild('headersTemplate') headersTemplate: TemplateRef<TableField> | undefined;
	@ContentChild('rowsTemplate') rowsTemplate: TemplateRef<TableField> | undefined;
}
