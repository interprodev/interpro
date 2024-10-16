import { Component, inject } from '@angular/core';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonDropdownComponent } from '@iterpro/shared/ui/components';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SettingsStore } from '../../../+state/settings.store';

@Component({
	selector: 'iterpro-settings-teams-dropdown',
	standalone: true,
	imports: [
		DropdownModule,
		SkeletonDropdownComponent,
		FormsModule,
		TranslateModule
	],
	template: `
		<div class="tw-flex tw-items-end tw-gap-2">
			<div class="tw-text-lg">{{'dropdown.teamPlaceholder' | translate}}</div>
			@if (settingsStore.selectedTeam()) {
				<div class="iterpro-item-container tw-p-0">
					<p-dropdown
						[options]="settingsStore.getTeamOptions()"
						[ngModel]="settingsStore.selectedTeamId()"
						(onChange)="settingsStore.setSelectedTeamId($event.value)"
						[dropdownIcon]="'fas fa-chevron-down'"
						[placeholder]="'dropdown.teamPlaceholder' | translate"
					>
						<ng-template pTemplate="selectedItem">
							<div class="tw-text-xl">{{ settingsStore.selectedTeam().name }}</div>
						</ng-template>
						<ng-template let-item pTemplate="item">
							<div class="tw-text-md">{{ item.label }}</div>
						</ng-template>
					</p-dropdown>
				</div>
			} @else {
				<iterpro-skeleton-dropdown></iterpro-skeleton-dropdown>
			}
		</div>
		`
})
export class SettingsTeamsDropdownComponent {
	// Services
	readonly settingsStore = inject(SettingsStore);
}
