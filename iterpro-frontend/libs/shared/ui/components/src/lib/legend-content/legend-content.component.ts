import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LegendRowType, PlayerStatusLegendRow } from '@iterpro/shared/data-access/sdk';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule],
	selector: 'iterpro-legend-content',
	templateUrl: './legend-content.component.html',
	styleUrls: ['./legend-content.component.scss']
})
export class LegendContentComponent {
	@Input() legendConfig!: PlayerStatusLegendRow[];
	legendRowTypes = LegendRowType;
}
