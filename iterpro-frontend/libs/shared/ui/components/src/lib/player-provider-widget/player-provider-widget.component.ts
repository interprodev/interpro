import { NgIf } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule } from '@ngx-translate/core';

@Component({
	standalone: true,
	imports: [NgIf, TranslateModule, PrimeNgModule],
	selector: 'iterpro-player-provider-widget',
	templateUrl: './player-provider-widget.component.html',
	styleUrls: ['./player-provider-widget.component.scss']
})
export class PlayerProviderWidgetComponent implements OnChanges {
	@Input() wyscoutId!: number;
	@Input() instatId!: number;
	@Input() size: 'small' | 'regular' = 'regular';
	label!: string;
	isMappedForAllProviders!: boolean;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['wyscoutId'] || changes['instatId']) {
			this.loadLabel();
		}
	}

	private loadLabel() {
		if (this.wyscoutId && this.instatId) {
			this.isMappedForAllProviders = true;
			this.label = 'Mapped to Wyscout and InStat';
		} else {
			if (this.wyscoutId || this.instatId) {
				this.label = this.instatId ? 'playerFromInStat' : 'playerFromWyscout';
			}
		}
	}
}
