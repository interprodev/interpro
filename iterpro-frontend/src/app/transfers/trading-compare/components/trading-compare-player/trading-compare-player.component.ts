import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ClubTransfer } from '@iterpro/shared/data-access/sdk';
import { SportType } from '@iterpro/shared/utils/common-utils';
import { sortBy } from 'lodash';
import { SelectItem } from 'primeng/api';
import { TradingCompareItem } from '../../models/trading-compare.types';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-trading-compare-player',
	templateUrl: './trading-compare-player.component.html'
})
export class TradingComparePlayerComponent {
	/** Input & Output */
	@Input({ required: true }) sportType: SportType;
	@Input({ required: true }) playerCompare: TradingCompareItem;
	@Input({ required: true }) set clubTransfers(value: ClubTransfer[]) {
		if (value) {
			this.playerOptions = sortBy(
				value.map(transfer => ({
					label: transfer.player.displayName,
					value: transfer
				})),
				'label'
			);
		}
	}
	@Input() isRightPlayer: boolean = false;

	@Output() changeTransfer = new EventEmitter<ClubTransfer>();

	/** Data */
	playerOptions: SelectItem<ClubTransfer>[] = [];

	onPlayerChange(e: { value: ClubTransfer }): void {
		this.changeTransfer.emit(e.value);
	}
}
