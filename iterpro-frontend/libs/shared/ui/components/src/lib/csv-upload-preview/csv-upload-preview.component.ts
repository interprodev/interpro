import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { compareValues } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { ReplaySubject, of } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, first as firstRxJs, takeUntil } from 'rxjs/operators';
import { PlayerFlagComponent } from '../player-flag/player-flag.component';

export interface CsvTable {
	height: string;
	headers: CsvTableHeader[];
	rows: CsvRow[];
}

export interface CsvTableHeader {
	value: string;
	header: CsvHeader;
}
export interface CsvRow {
	cells: CsvTableCell[];
	fields: CsvTableCell[];
	index?: number;
}

export interface CsvHeader {
	field: string;
	key: string | { key: string; params: any };
	filterKey?: string;
	sortable: boolean;
	class?: string;
	csvRaw?: boolean;
	pdfRaw?: boolean;
	csvDisabled?: boolean;
	frozen?: boolean;
	width?: number;
	validator?: ValidatorFn[];
}
export interface CsvTableCell {
	field: string;
	type: string;
	value: any;
	raw?: any;
	class?: string;
}
export interface RowStatus {
	index: number;
	status: string;
	hasErrors: boolean;
}
export interface FormStatus {
	valid: boolean;
	value: any;
}

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, PrimeNgModule, PlayerFlagComponent],
	selector: 'iterpro-csv-upload-preview',
	templateUrl: './csv-upload-preview.component.html',
	styleUrls: ['./csv-upload-preview.component.css']
})
export class CsvUploadPreviewComponent implements OnDestroy, OnChanges {
	@Input() table!: CsvTable;
	@Input() paginator = false;
	@Input() rows = 0;
	@Output() status: EventEmitter<FormStatus> = new EventEmitter<FormStatus>();
	@Output() errorsPerPage: EventEmitter<number[]> = new EventEmitter<number[]>();
	@Output() currentPage: EventEmitter<number> = new EventEmitter<number>();

	csvForm: FormGroup;
	columns!: CsvHeader[];

	private valid = true;
	private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

	constructor() {
		this.csvForm = new FormGroup({
			rows: new FormArray([])
		});
	}

	ngOnDestroy() {
		this.destroyed$.next(true);
		this.destroyed$.complete();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['table'] && !!this.table) {
			this.destroyed$.next(true);
			this.destroyed$.complete();
			this.destroyed$ = new ReplaySubject(1);
			this.columns = this.table.headers.map(({ header }) => header);
			this.patchForm(this.table);
		}
	}

	getCellValue(index: number, field: string) {
		const formGroup = this.formGroupAtRow(index);
		return formGroup.controls[field].value;
	}

	isEnabled(index: number, field: string) {
		const formGroup = this.formGroupAtRow(index);
		const formControl = formGroup.controls[field];
		return formControl.enabled;
	}

	isRequired(index: number, field: string) {
		const formGroup = this.formGroupAtRow(index);
		const errors = formGroup.controls[field].errors;
		return !!errors && !!errors['required'];
	}

	rowHasErrors(index: number) {
		const formGroup = this.formGroupAtRow(index);
		return formGroup.errors === null;
	}

	hasErrors(index: number, field: string) {
		const formGroup = this.formGroupAtRow(index);
		return !!formGroup.controls[field].errors;
	}

	// TODO: refactor with more context + find duplicates (search: customSort)
	customSort(event) {
		event.data.sort((a, b) => {
			const aCell = a.cells.find(c => c.field === event.field);
			const bCell = b.cells.find(c => c.field === event.field);
			const value1 = aCell.raw !== undefined ? aCell.raw : aCell.value;
			const value2 = bCell.raw !== undefined ? bCell.raw : bCell.value;
			return event.order * compareValues(value1, value2);
		});
	}

	changePage({ first }) {
		this.currentPage.emit(Math.floor(first / this.rows));
	}

	private patchForm(csvTable: CsvTable) {
		const rowsFormArray = this.csvForm.get('rows') as FormArray;
		const formStatus: RowStatus[] = [];
		let formGroup: FormGroup;
		let hasErrors: boolean;
		csvTable.rows.forEach((row, index) => {
			row.index = index;
			({ formGroup, hasErrors } = this.rowFormGroup(row));
			rowsFormArray.push(formGroup);

			formStatus.push({ index, status: formGroup.status, hasErrors });
			if (formGroup.enabled) {
				formGroup.statusChanges
					.pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroyed$))
					.subscribe(status => {
						this.checkFormStatus(index, status, formStatus);
					});
			}
		});
		this.csvForm.patchValue({
			rows: csvTable.rows
		});

		of(true)
			.pipe(delay(200), firstRxJs())
			.subscribe(() => {
				this.emitPageErrors(formStatus);
				if (formStatus.every(rowStatus => !rowStatus.hasErrors)) {
					this.valid = true;
					this.status.emit({ valid: true, value: this.csvForm.getRawValue() });
				}
			});
	}
	private checkFormStatus(i: number, status: string, formStatus: RowStatus[]) {
		const rowStatus: RowStatus = formStatus.find(({ index }) => index === i) as RowStatus;
		rowStatus.status = status;

		const isValid = status !== 'INVALID';

		if (!this.formGroupAtRow(i).pristine) {
			rowStatus.hasErrors = !isValid;
			this.emitPageErrors(formStatus);
		}

		const valid = isValid && formStatus.every(item => item.status !== 'INVALID');
		if (this.valid !== valid) {
			this.valid = valid;
			this.status.emit({ valid, value: this.csvForm.getRawValue() });
		}
	}

	private emitPageErrors(formStatus: RowStatus[]) {
		const pages = this.pageFromRows(formStatus.length);
		const errorsPerPage: number[] = Array(pages).fill(0);
		if (this.paginator) {
			let pageIndex = 0;
			formStatus.forEach(({ index, hasErrors }) => {
				if (hasErrors) {
					pageIndex = Math.floor(index / this.rows);
					errorsPerPage[pageIndex]++;
				}
			});
		} else {
			errorsPerPage[0] = formStatus.reduce((accumulator, { hasErrors }) => accumulator + (hasErrors ? 1 : 0), 0);
		}

		this.errorsPerPage.emit(errorsPerPage);
	}

	private rowFormGroup(row: CsvRow) {
		const obj = {};
		let headerRef: CsvTableHeader;
		let validators: ValidatorFn[];
		let formControl: FormControl;
		let hasErrors = false;
		row.cells.forEach(cell => {
			if (['text', 'flag'].indexOf(cell.type) > -1) {
				headerRef = this.table.headers.find(header => header.header.field === cell.field) as CsvTableHeader;
				validators = !!headerRef && !!headerRef.header.validator ? headerRef.header.validator : [];
				formControl = new FormControl(cell.value, validators);
				if (formControl.errors) {
					hasErrors = true;
				} else {
					formControl.disable();
				}
				obj[cell.field] = formControl;
			}
		});

		return { formGroup: new FormGroup(obj), hasErrors };
	}

	private formGroupAtRow(index: number) {
		const formArray = this.csvForm.controls['rows'] as FormArray;
		const formGroup = formArray.controls[index] as FormGroup;
		return formGroup;
	}

	private pageFromRows(row: number) {
		return Math.floor(row / this.rows) + (row % this.rows > 0 ? 1 : 0);
	}
}
