import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ClubTransfer } from '@iterpro/shared/data-access/sdk';
import { TransferType } from '../../../shared/interfaces/transfers.interface';

@Component({
	selector: 'iterpro-transfers-deals-kanban-item',
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: 'transfers-deals-kanban-item.component.html',
	styleUrls: ['./../../transfers-deals.component.css'],
	styles: [
		`
			:host {
				display: flex;
				width: 100%;
			}
			.info-container {
				align-items: flex-start;
				gap: 8px;
			}
		`
	]
})
export class TransfersDealsKanbanItemComponent {
	transfer = input.required<ClubTransfer>();
	transferType = input.required<TransferType>();
}
