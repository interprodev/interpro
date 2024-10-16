import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ClubSeason, ClubTransfer, TransferWindowItem } from '@iterpro/shared/data-access/sdk';
import { SportType } from '@iterpro/shared/utils/common-utils';
import { ChartData, ChartOptions } from 'chart.js';
import { sortBy } from 'lodash';
import { Observable } from 'rxjs';
import { TradingCompareItem } from './models/trading-compare.types';
import { TradingLegalService } from './services/trading-legal.service';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-trading-compare',
	templateUrl: './trading-compare.component.html'
})
export class TradingCompareComponent {
	/** Services */
	readonly #tradingLegalService = inject(TradingLegalService);

	/** Inputs & Outputs */
	@Input({ required: true }) clubSeasons: ClubSeason[];
	@Input({ required: true }) transferWindow: TransferWindowItem;
	@Input({ required: true }) sportType: SportType;
	@Input({ required: true }) set clubTransfers(value: ClubTransfer[]) {
		if (value) {
			this.allTransfers = sortBy(value, 'player.displayName');
			this.initComponentData();
		}
	}

	@Output() windowUpdate: EventEmitter<TransferWindowItem> = new EventEmitter<TransferWindowItem>();

	chartData: ChartData;
	chartOptions: ChartOptions;

	/** Data */
	allTransfers: ClubTransfer[] = [];
	leftComparePlayer$: Observable<TradingCompareItem> | null = null;
	rightComparePlayer$: Observable<TradingCompareItem> | null = null;

	private initComponentData() {
		/** Init Players to compare */
		if (this.allTransfers.length > 1) {
			this.leftComparePlayer$ = this.#tradingLegalService.transferToPlayerData(this.allTransfers[0]);
			this.rightComparePlayer$ = this.#tradingLegalService.transferToPlayerData(this.allTransfers[1]);
		}
	}

	changeLeftTransfer(event: ClubTransfer) {
		this.leftComparePlayer$ = this.#tradingLegalService.transferToPlayerData(event);
	}

	changeRightTransfer(event: ClubTransfer) {
		this.rightComparePlayer$ = this.#tradingLegalService.transferToPlayerData(event);
	}

	chooseTransferWindowByClubSeason(event: TransferWindowItem) {
		this.windowUpdate.emit(event);
	}
}
