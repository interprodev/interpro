import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ClubTransfer, ClubTransferApi, NotificationApi } from '@iterpro/shared/data-access/sdk';
import { ErrorService, findBySelector } from '@iterpro/shared/utils/common-utils';
import { switchMap } from 'rxjs';
import {
	PurchaseBreakdown,
	SaleBreakdown,
	TransferType,
	purchaseStatus,
	saleStatus
} from '../../../shared/interfaces/transfers.interface';
import {
	PurchaseStatusLabel,
	SaleStatusLabel,
	TransferKanbanStatus,
	purchasesTransferStatuses,
	salesTransferStatuses
} from '../../models/transfers-deals.types';

@Component({
	selector: 'iterpro-transfers-deals-kanban',
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './transfers-deals-kanban.component.html',
	styleUrls: ['./../../transfers-deals.component.css']
})
export class TransfersDealsKanbanComponent {
	/*** Services ***/
	#clubTransferApi: ClubTransferApi = inject(ClubTransferApi);
	#notificationApi: NotificationApi = inject(NotificationApi);
	#errorService: ErrorService = inject(ErrorService);

	/*** Input & Outputs ***/
	@Input({ required: true }) kanbanType: TransferType;
	@Input() salesBreakdown: SaleBreakdown;
	@Input() purchasesBreakdown: PurchaseBreakdown;

	@Input() set sales(value: ClubTransfer[]) {
		this.kanbanMap.clear();
		this.createSalesKanbanMap(value);
	}

	@Input() set purchases(value: ClubTransfer[]) {
		this.kanbanMap.clear();
		this.createPurchaseKanbanMap(value);
	}

	@Output() transferClick = new EventEmitter<ClubTransfer>();
	@Output() transferDropped = new EventEmitter<ClubTransfer>();

	/*** Data ***/
	draggingTransfer: ClubTransfer | null = null;
	kanbanMap = new Map<SaleStatusLabel | PurchaseStatusLabel, TransferKanbanStatus>();

	dragStart(transfer: ClubTransfer): void {
		this.draggingTransfer = transfer;
	}

	dragEnd(): void {
		this.draggingTransfer = null;
	}

	onTransferClick(transfer: ClubTransfer): void {
		this.transferClick.emit(transfer);
	}

	drop(e: Event): void {
		const prevStatus = this.draggingTransfer.currentStatus as SaleStatusLabel | PurchaseStatusLabel;
		const newStatus = findBySelector(e.target as HTMLElement, '[data-status]')?.getAttribute('data-status') as
			| SaleStatusLabel
			| PurchaseStatusLabel;

		// If dropped in new transfer status column
		if (this.draggingTransfer && newStatus && prevStatus !== newStatus) {
			// Update UI transfers Map
			this.updateTransfersKanban(prevStatus, newStatus);

			const newTransfer = {
				...this.draggingTransfer,
				currentStatus: newStatus
			};

			this.#clubTransferApi
				.patchAttributes(this.draggingTransfer.id, { currentStatus: newTransfer.currentStatus })
				.pipe(
					switchMap(() => {
						this.transferDropped.emit(newTransfer);
						return this.#notificationApi.checkNotificationForPlayerTransfer(newTransfer.id, true, prevStatus);
					})
				)
				.subscribe({
					error: (error: Error) => this.#errorService.handleError(error)
				});
		}
	}

	private updateTransfersKanban(
		prevStatus: SaleStatusLabel | PurchaseStatusLabel,
		newStatus: SaleStatusLabel | PurchaseStatusLabel
	): void {
		this.draggingTransfer.currentStatus = newStatus;

		this.kanbanMap.set(prevStatus, {
			color: this.kanbanMap.get(prevStatus).color,
			transfers: this.kanbanMap.get(prevStatus).transfers.filter(({ id }) => id !== this.draggingTransfer.id)
		});

		this.kanbanMap.set(newStatus, {
			color: this.kanbanMap.get(newStatus).color,
			transfers: [...this.kanbanMap.get(newStatus).transfers, this.draggingTransfer]
		});
	}

	private createSalesKanbanMap(value: ClubTransfer[]): void {
		Object.values(saleStatus).map((statusLabel: SaleStatusLabel) => {
			this.kanbanMap.set(statusLabel, {
				color: salesTransferStatuses.find(({ status }) => status === statusLabel)?.color,
				transfers: [
					...(this.kanbanMap.get(statusLabel)?.transfers || []),
					...value.filter(({ currentStatus }) => currentStatus === statusLabel)
				]
			});
		});
	}

	private createPurchaseKanbanMap(value: ClubTransfer[]): void {
		Object.values(purchaseStatus).map((statusLabel: PurchaseStatusLabel) => {
			this.kanbanMap.set(statusLabel, {
				color: purchasesTransferStatuses.find(({ status }) => status === statusLabel)?.color,
				transfers: [
					...(this.kanbanMap.get(statusLabel)?.transfers || []),
					...value.filter(({ currentStatus }) => currentStatus === statusLabel)
				]
			});
		});
	}

	// Preserve map original order
	// https://stackoverflow.com/questions/52793944/angular-keyvalue-pipe-sort-properties-iterate-in-order
	originalOrder = (): number => 0;
}
