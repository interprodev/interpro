import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Customer, EntityChangelog, Team } from '@iterpro/shared/data-access/sdk';
import { CustomerNamePipe, TeamNamePipe } from '@iterpro/shared/ui/pipes';
import { FormatDateUserSettingPipe } from '@iterpro/shared/utils/common-utils';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { Observable } from 'rxjs';
import { SkeletonTableComponent } from '../skeleton-table/skeleton-table.component';

@Component({
	standalone: true,
	imports: [AsyncPipe, TranslateModule, CustomerNamePipe, FormatDateUserSettingPipe, TeamNamePipe, TableModule, SkeletonTableComponent],
	selector: 'iterpro-entity-changelog-table',
	templateUrl: './entity-changelog-table.component.html'
})
export class EntityChangelogTableComponent {
	changelog$!: Observable<EntityChangelog[]>;
	customers!: Customer[];
	teams!: Pick<Team, 'id' | 'name'>[];
	isLoading = true;
	constructor(private readonly config: DynamicDialogConfig) {
		if (this.config.data) {
			this.isLoading = true;
			this.changelog$ = this.config.data.changelog;
			this.customers = this.config.data.customers;
			this.teams = this.config.data.teams;
			setTimeout(() => this.isLoading = false, 400);
		}
	}
}
