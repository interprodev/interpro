import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';

const hasVal = val => val || val === 0;

@Component({
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModule],
	selector: 'iterpro-price-range',
	templateUrl: './price-range.component.html',
	styleUrls: ['./price-range.component.css']
})
export class PriceRangeComponent {
	@Input() model: any;
	@Input() from!: string;
	@Input() to!: string;
	@Input() range!: string;
	@Input() editMode!: boolean;
	@Input() suffix = 'M';

	shouldShowLabel(): boolean {
		return !this.editMode && (hasVal(this.model[this.from]) || hasVal(this.model[this.to]));
	}

	shouldShowTrait(): boolean {
		return hasVal(this.model[this.from]) && hasVal(this.model[this.to]);
	}

	updateRangeFrom() {
		const { from, to } = this.getRanges();
		if (hasVal(to) && to < from) this.model[this.to] = from;
		this.updateWageRange();
	}

	updateRangeTo() {
		const { from, to } = this.getRanges();
		if (hasVal(from) && from > to) this.model[this.from] = to;
		this.updateWageRange();
	}

	private updateWageRange() {
		if (this.range) {
			this.model[this.range] = this.model[this.from] + ' - ' + this.model[this.to] + ' ' + this.suffix;
		}
	}

	private getRanges(): { from: number; to: number } {
		const from = this.model[this.from] ? parseFloat(this.model[this.from]) : this.model[this.from];
		const to = this.model[this.to] ? parseFloat(this.model[this.to]) : this.model[this.to];
		return { from, to };
	}
}
