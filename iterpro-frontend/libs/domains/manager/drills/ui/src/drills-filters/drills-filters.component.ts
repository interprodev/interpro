import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DrillFilters, DrillFiltersConfig } from '@iterpro/manager/drills/data-access';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { DrillsListMapping, DrillsMapping } from '@iterpro/shared/utils/common-utils';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [CommonModule, PrimeNgModule, ReactiveFormsModule, TranslateModule],
	selector: 'iterpro-drills-filters',
	templateUrl: './drills-filters.component.html'
})
export class DrillsFiltersComponent implements OnInit {
	form!: FormGroup;
	@Input() cols: number = 12;
	@Input() config!: DrillFiltersConfig[];
	@Input({required: true}) drillsMapping!: DrillsMapping;
	@Input({required: true}) drillFiltersListMapping!: DrillsListMapping;
	@Output() filtersChanged: EventEmitter<DrillFilters> = new EventEmitter<DrillFilters>();

	readonly #formBuilder = inject(FormBuilder);

	ngOnInit() {
		if (!this.config || this.config.length === 0) {
			console.error('iterpro-drills-filters: you must pass a valid config to let the filters works');
			return;
		}
		this.loadForm();
	}

	private loadForm() {
		this.form = this.#formBuilder.group({});
		for (const config of this.config) {
			this.addNewControl(config);
		}
		this.listenForChanges();
	}

	private addNewControl(controlName: string) {
		this.form.addControl(controlName, new FormControl([]));
	}

	private listenForChanges() {
		this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((data: DrillFilters) => {
			this.filtersChanged.emit(data);
		});
	}
}
