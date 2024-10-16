import { Component, Input } from '@angular/core';

@Component({
	selector: 'iterpro-compare-table',
	templateUrl: './compare-table.component.html',
	styleUrls: ['./compare-table.component.css']
})
export class CompareTableComponent {
	@Input() table: any = {};
	@Input() analysis = false;
	legendDialogOpened: boolean;

	isValid(bool, val): boolean {
		if (val === 0) return false;

		return bool && val && !isNaN(val);
	}

	getShowLegendIcon(data: any[]): boolean {
		return data && data.some(d => d.legend);
	}
}
