import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DrillFilters, DrillFiltersConfig } from '@iterpro/manager/drills/data-access';
import { Attachment, Drill } from '@iterpro/shared/data-access/sdk';
import { MultipleFileUploadComponent } from '@iterpro/shared/feature-components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuItem, SelectItem } from 'primeng/api';
import { DrillsColumnFilterComponent } from '../drills-column-filter/drills-column-filter.component';
import { DrillsFiltersComponent } from '../drills-filters/drills-filters.component';
import { TableColumnFilterComponent } from '@iterpro/shared/ui/components';
import { TableFilterComponent } from '../../../../../../../src/app/shared/table-filter/table-filter.component';
import { DrillsListMapping, DrillsMapping, DrillsMappingService } from '@iterpro/shared/utils/common-utils';

@Component({
	standalone: true,
	imports: [
		CommonModule,
		PrimeNgModule,
		FormsModule,
		TranslateModule,
		MultipleFileUploadComponent,
		DrillsFiltersComponent,
		DrillsColumnFilterComponent,
		TableColumnFilterComponent,
		TableFilterComponent
	],
	selector: 'iterpro-drills-search',
	templateUrl: './drills-search.component.html',
	styleUrls: ['./drills-search.component.scss']
})
export class DrillsSearchComponent implements OnInit {
	selectedDrills: Drill[] = [];
	@Input() drills!: Drill[];
	drillsBackup!: Drill[];
	@Input() drillFiltersConfig!: DrillFiltersConfig[];
	@Input({required: true}) drillsMapping!: DrillsMapping;
	drillFiltersListMapping!: DrillsListMapping;
	@Output() saveEmitter: EventEmitter<Drill[]> = new EventEmitter<Drill[]>();
	@Output() discardEmitter: EventEmitter<void> = new EventEmitter<void>();
	@Input() isDialog = true;
	@Input() showFilters = true;
	@Input() showColumnFilters = false;
	@Input() rowSelectable = true;
	@Input() maxSelectableRows!: number;
	@Output() rowClicked: EventEmitter<Drill> = new EventEmitter<Drill>();

	selectedAttachments: Attachment[] | undefined = undefined;
	filtersTabTypes: MenuItem[] = [
		{
			id: 'filters',
			label: 'Filters',
			command: () => this.activeFilterTabType = this.filtersTabTypes[0]
		}
	];
	activeFilterTabType: MenuItem = this.filtersTabTypes[0];

	constructor(private drillsMappingService: DrillsMappingService) {}

	ngOnInit(): void {
		if (this.showColumnFilters) {
			this.filtersTabTypes.push(
				{
					id: 'tableColumns',
					label: 'Table columns',
					command: () => this.activeFilterTabType = this.filtersTabTypes[1]
				}
			);
		}
		if (this.drills && this.drills.length) {
			this.drillsBackup = [...this.drills];
			this.drillFiltersListMapping = this.drillsMappingService.getDrillFiltersListMapping(this.drills, this.drillsMapping.themes);
		}
	}

	applyDrillFilters(event: DrillFilters) {
		this.drills = this.drillsMappingService.applyDrillFilters(event, this.drillsBackup);
	}

	getGoalsTooltip(goals: string[], list: SelectItem[]): string | undefined {
		return goals?.map(goal => list.find(({ value }) => value === goal)?.label).join(', ');
	}

	getUppercaseAllGoals(drill: Drill): string | undefined {
		const goals = this.getDrillAllGoals(drill);
		return this.getGoalsTooltip(goals || [], this.drillsMapping.goals || []);
	}

	getDrillAllGoals(drill: Drill): string[] {
		return [...(drill?.tacticalGoals || []), ...(drill?.technicalGoals || []), ...(drill?.physicalGoals || [])];
	}

	getThemeLabel(themeKey: string): string {
		const item = this.drillsMapping.themes.find(({ value }) => value === themeKey);
		return item && item?.label ? item.label : themeKey;
	}

	discard() {
		this.discardEmitter.emit();
	}

	save() {
		this.saveEmitter.emit(this.selectedDrills);
	}

	applyColumnsChanged(event: DrillFiltersConfig[]) {
		this.drillFiltersConfig = event;
	}
}
