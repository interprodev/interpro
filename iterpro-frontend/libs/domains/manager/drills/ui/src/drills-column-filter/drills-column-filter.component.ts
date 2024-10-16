import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DrillFiltersConfig } from '@iterpro/manager/drills/data-access';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, TranslateModule, PrimeNgModule],
	selector: 'iterpro-drills-column-filter',
	templateUrl: './drills-column-filter.component.html'
})
export class DrillsColumnFilterComponent implements OnInit {
	form!: FormGroup;
	detailOptions!: SelectItem<DrillFiltersConfig>[];
	targetOptions!: SelectItem<DrillFiltersConfig>[];
	detailConfig: DrillFiltersConfig[] = ['duration', 'numberOfPlayers', 'pitchSize', 'ageGroup'];
	targetConfig: DrillFiltersConfig[] = ['theme', 'technicalGoal', 'tacticalGoal', 'physicalGoal'];
	@Output() columnsChanged: EventEmitter<DrillFiltersConfig[]> = new EventEmitter<DrillFiltersConfig[]>();
	constructor(private formBuilder: FormBuilder, private translate: TranslateService) {}

	ngOnInit() {
		if (
			!this.detailConfig ||
			(this.detailConfig?.length === 0 && !this.targetConfig) ||
			this.targetConfig?.length === 0
		) {
			console.error('iterpro-drills-column-filter: you must pass a valid config to let the filters works');
			return;
		}
		this.loadOptions();
		this.loadForm();
	}

	private loadOptions() {
		this.detailOptions = this.detailConfig.map(config => ({
			label: this.getTranslation(config),
			value: config
		}));
		this.targetOptions = this.targetConfig.map(config => ({
			label: this.getTranslation(config),
			value: config
		}));
	}

	private loadForm() {
		this.form = this.formBuilder.group({});
		this.addNewControl('drillDetail', this.detailConfig);
		this.addNewControl('drillTarget', this.targetConfig);
		this.listenForChanges();
	}

	private addNewControl(controlName: string, initialValue: any) {
		this.form.addControl(controlName, new FormControl(initialValue, []));
	}

	private getTranslation(config: DrillFiltersConfig): string {
		switch (config) {
			case 'numberOfPlayers':
				return this.translate.instant('drills.' + 'nPlayers');
			case 'tacticalGoal':
				return this.translate.instant('drills.' + 'tacticalGoals');
			default:
				return this.translate.instant('drills.' + config);
		}
	}

	private listenForChanges() {
		this.form.valueChanges
			.pipe(untilDestroyed(this))
			.subscribe((data: { drillDetail: DrillFiltersConfig[]; drillTarget: DrillFiltersConfig[] }) => {
				this.columnsChanged.emit([...data.drillDetail, ...data.drillTarget]);
			});
	}
}
