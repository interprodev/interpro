import { Component, forwardRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
	BasicWage,
	Benefit,
	Bonus,
	ContractOptionCondition,
	Installment,
	LoanOption,
	TeamSeason,
	TransferClause
} from '@iterpro/shared/data-access/sdk';
import { formatAmount, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { v4 as uuid } from 'uuid';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { NgIf } from '@angular/common';
import { MaskDirective } from '@iterpro/shared/ui/directives';
@Component({
	standalone: true,
	selector: 'iterpro-installments-table',
	templateUrl: './installments-table.component.html',
	styleUrls: ['./installments-table.component.scss'],
	imports: [PrimeNgModule, FormsModule, TranslateModule, NgIf, MaskDirective],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => InstallmentsTableComponent),
			multi: true
		}
	]
})
export class InstallmentsTableComponent implements OnChanges {
	@Input() _option: BasicWage | Bonus | LoanOption | TransferClause | Benefit | ContractOptionCondition;
	@Input() currency: string;
	@Input() disabled: boolean;
	@Input() seasons: TeamSeason[];
	@Input() visible: boolean;
	_seasons: SelectItem[] = [];
	showInstallmentsTable = false;
	residualInstallmentValue = 0;
	constructor(private translate: TranslateService) {}
	ngOnChanges(changes: SimpleChanges): void {
		if (changes['seasons'] && this.seasons) {
			this._seasons = this.seasons.map(x => ({ label: x.name, value: x.id }));
		}
	}
	get option() {
		return this._option;
	}
	set option(val: any) {
		this._option = val;
	}
	writeValue(value: any) {
		if (value) {
			this.option = value;
		}
	}
	propagateChange = (_: any) => {};
	registerOnChange(fn) {
		this.propagateChange = fn;
	}
	registerOnTouched() {}
	addInstallment() {
		if (!this.option.installments) this.option.installments = [];
		this.option.installments.push(new Installment());
	}
	deleteInstallment(index: number) {
		this.option.installments.splice(index, 1);
	}
	duplicateInstallment(index: number) {
		const duplicated = cloneDeep(this.option.installments[index]);
		duplicated.id = uuid();
		this.option.installments = [...this.option.installments, duplicated];
		this.updateResidual();
	}
	getPrevious(index: number): Date {
		if (index > 0) return this.option.installments[index - 1].date;
	}
	getTooltip(): string {
		if (this.visible || !this.option.installments) return null;
		const text = `<ul>${this.option.installments
			.map(x => {
				const suffix = x.season
					? `${this.translate.instant('admin.contracts.for')} ${x.season}`
					: `${this.translate.instant('contracts.at')} ${moment(x.date).format(getMomentFormatFromStorage())}`;
				return `<li>${this.currency}${formatAmount(x.value)} ${suffix}</li>`;
			})
			.join('')}</ul>`;
		return text;
	}
	openInstallments() {
		this.showInstallmentsTable = !this.showInstallmentsTable;
	}
	resetDate(event: SelectItem, index: number) {
		this.option.installments[index].season = event.value;
		this.option.installments[index].date = null;
	}
	resetSeason(index: number, date: Date) {
		const season = this.seasons.find(({ offseason, inseasonEnd }) =>
			moment(date).isBetween(moment(offseason), moment(inseasonEnd), 'day', '[]')
		);
		if (season) {
			this.option.installments[index].season = season.id;
		}
	}
	updateResidual() {
		this.residualInstallmentValue =
			((this.option.percentage && 100) || this.option.amount || this.option.grossAmount) -
			this.option.installments.map(({ value }) => value).reduce((value, curr) => (value += Number(curr)), 0);
	}
}
