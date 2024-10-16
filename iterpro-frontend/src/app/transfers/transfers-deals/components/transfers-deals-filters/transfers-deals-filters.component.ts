import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ClubTransfer } from '@iterpro/shared/data-access/sdk';
import { ConstantService } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import { max, uniq } from 'lodash';
import { SelectItem } from 'primeng/api';
import { PurchaseBreakdown, SaleBreakdown } from 'src/app/transfers/shared/interfaces/transfers.interface';
import { AGE_RANGE, COST_RANGE } from '../../models/transfers-deals.form';
import { Range, TransfersDealsFilters, TransfersDealsFiltersForm } from '../../models/transfers-deals.types';

@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'iterpro-transfers-deals-filter',
	templateUrl: './transfers-deals-filters.component.html'
})
export class TransfersDealsFiltersComponent {
	/** Services */
	readonly #fb: FormBuilder = inject(FormBuilder);
	readonly #translateService: TranslateService = inject(TranslateService);
	readonly #constantService: ConstantService = inject(ConstantService);

	/** Inputs */
	@Input({ required: true }) set clubTransfers(transfers: ClubTransfer[]) {
		this.positions = this.getPositionsByTranfers(transfers);
	}
	@Input({ required: true }) set breakdown(value) {
		this.costRange.max = this.getMaximumPurchaseCost(value);
		this.filtersForm.patchValue({ costRange: [this.costRange.min, this.costRange.max] });
	}
	@Input({ required: true }) set currencyCode(currencyCode) {
		this.currency = this.#constantService.getCurrencySymbol(currencyCode);
	}

	/** Outputs */
	@Output() readonly updateFilters = new EventEmitter<TransfersDealsFilters>();

	/** Form */
	readonly filtersForm: FormGroup<TransfersDealsFiltersForm> = this.#fb.group({
		contractTypes: new FormControl<string[] | null>(null),
		positions: new FormControl<string[] | null>(null),
		ageRange: new FormControl<number[]>([AGE_RANGE.min, AGE_RANGE.max]),
		costRange: new FormControl<number[]>([COST_RANGE.min, this.getMaximumPurchaseCost(this.breakdown) || COST_RANGE.max])
	});

	/** Filters Data */
	readonly ageRange: Range = AGE_RANGE;
	readonly contractTypes: SelectItem<string>[] = this.#constantService.getContractTypes();
	positions: SelectItem<string>[] = [];
	costRange: Range = COST_RANGE;
	currency: string | null = null;

	applyFilters(): void {
		this.updateFilters.emit(this.filtersForm.value as TransfersDealsFilters);
	}

	resetFilters(): void {
		this.filtersForm.reset({
			contractTypes: null,
			positions: null,
			ageRange: [AGE_RANGE.min, AGE_RANGE.max],
			costRange: [COST_RANGE.min, this.getMaximumPurchaseCost(this.breakdown) || COST_RANGE.max]
		});
	}

	/**
	 * Retrieves a list of unique positions from an array of ClubTransfer objects.
	 *
	 * @param {ClubTransfer[]} transfers - The array of ClubTransfer objects.
	 * @return {SelectItem<string>[]} An array of SelectItem objects representing the unique positions.
	 */
	private getPositionsByTranfers(transfers: ClubTransfer[]): SelectItem<string>[] {
		return transfers
			? uniq(
					transfers
						.filter(({ player }) => player.position)
						.map(({ player }) => player.position)
						.sort()
			  ).map((position: string) => ({
					value: position,
					label: this.#translateService.instant(position)
			  }))
			: [];
	}

	/**
	 * Calculates the maximum purchase cost based on the given breakdown.
	 *
	 * @param {SaleBreakdown | PurchaseBreakdown} breakdown - The breakdown object containing the transfer fee and wage values.
	 * @return {number} The maximum purchase cost calculated from the transfer fee and wage values in the breakdown object.
	 */
	private getMaximumPurchaseCost(breakdown: SaleBreakdown & PurchaseBreakdown): number {
		if (!breakdown) {
			return COST_RANGE.max;
		}

		return max((Object.values(breakdown || {}) || []).map(({ transferFee, wage }) => transferFee + wage));
	}
}
