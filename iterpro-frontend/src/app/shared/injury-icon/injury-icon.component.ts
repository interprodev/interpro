import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ExtendedPlayerScouting, Injury, MedicalPreventionPlayer, Player } from '@iterpro/shared/data-access/sdk';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { InjuryIconService } from './injury-icon.service';

@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule],
	selector: 'iterpro-injury-icon',
	template: `
		<i
			*ngIf="injuryIcon?.length > 0"
			[style.float]="'unset'"
			[tooltipDisabled]="tooltipDisabled"
			[class]="injuryIcon + ' tw-rounded-sm'"
			[pTooltip]="tooltip"
			[escape]="false"
		></i>
	`,
	styleUrls: ['./injury-icon.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InjuryIconComponent implements OnChanges {
	@Input() injuries: Injury[];
	@Input() injury: Injury;
	@Input() tooltipDisabled = false;
	@Input() period: Date;
	@Input() style: any = 'right';

	injuryIcon = '';
	tooltip = '';

	readonly #injuryIconService = inject(InjuryIconService);

	ngOnChanges(changes: SimpleChanges) {
		const injuries = changes['injuries'] ? changes['injuries'].currentValue : this.injuries;
		const injury = changes['injury'] ? changes['injury'].currentValue : this.injury;
		if (injuries) {
			const { icon, tooltip } = this.#injuryIconService.parsePlayer(this.injuries, this.period);
			this.injuryIcon = icon;
			this.tooltip = tooltip;
		} else if (injury) {
			const { icon, tooltip } = this.#injuryIconService.parseInjury(injury, this.period);
			this.injuryIcon = icon;
			this.tooltip = tooltip;
		}
	}
}
