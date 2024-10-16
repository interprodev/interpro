import { Component, inject } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterModule } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SideMenu, SideMenuComponent } from '@iterpro/shared/ui/components';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, first, switchMap } from 'rxjs/operators';
import { BlockUiInterceptorService, ErrorService, sortByName } from '@iterpro/shared/utils/common-utils';
import { CustomerTeam, SettingsStore } from './+state/settings.store';
import { groupedSettingsMenuItems } from './settings-menu-items.const';
import { combineLatest, map, Observable } from 'rxjs';
import { Club, Customer, CustomerApi, Team } from '@iterpro/shared/data-access/sdk';
import { IterproOrgType, IterproUserPermission, PermissionsService } from '@iterpro/shared/data-access/permissions';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [RouterModule, SideMenuComponent],
	selector: 'iterpro-settings',
	templateUrl: './settings.component.html',
	providers: [SettingsStore]
})
export class SettingsComponent {
	// Services
	readonly #router = inject(Router);
	readonly #errorService = inject(ErrorService);
	readonly #authStore = inject(Store<AuthState>);
	readonly #customerApi = inject(CustomerApi);
	readonly #club$ = this.#authStore.select(AuthSelectors.selectClub).pipe(takeUntilDestroyed());
	readonly #currentTeam = this.#authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #customer$ = this.#authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed());
	readonly settingsStore = inject(SettingsStore);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly #permissionsService = inject(PermissionsService);
	// Variables
	menuItems: SideMenu[];

	constructor() {
		combineLatest(this.#club$, this.#currentTeam, this.#customer$)
			.pipe(
				distinctUntilChanged(),
				filter(([club, team, customer]: [Club, Team, Customer]) => !!club && !!team && !!customer),
				switchMap(([club, team, customer]: [Club, Team, Customer]) => {
					this.settingsStore.setCurrentCustomerId(customer.id);
					this.listenFirstRouteChanges(team, customer, club);
					this.settingsStore.setClubInfo(club.id, club.nationalClub, club.type as IterproOrgType);
					this.settingsStore.setScoutingSettings(club.scoutingSettings);
					return this.loadClubCustomers(club.id);
				})
			)
			.subscribe({
				next: (clubCustomers: CustomerTeam[]) => this.settingsStore.setClubCustomers(clubCustomers),
				error: error => this.#errorService.handleError(error)
			});
	}

	private loadClubCustomers(clubId: string): Observable<CustomerTeam[]> {
		return this.#blockUiInterceptorService
			.disableOnce(
				this.#customerApi.find({
					fields: ['id', 'firstName', 'lastName', 'teamSettings', 'downloadUrl', 'admin', '_customPresets'],
					where: {
						clubId: clubId
					},
					include: ['teamSettings']
				})
			)
			.pipe(
				map((customers: CustomerTeam[]) => {
					return sortByName(
						(customers || []).map(customer => ({ ...customer, removed: false })),
						'lastName'
					);
				})
			);
	}

	//region Menu Generation/Selection
	private listenFirstRouteChanges(currentTeam: Team, currentCustomer: Customer, club: Club) {
		this.#router.events.pipe(first(), untilDestroyed(this)).subscribe({
			next: () => this.generateMenuItems(currentTeam, currentCustomer, club)
		});
	}

	private generateMenuItems(currentTeam: Team, currentCustomer: Customer, club: Club): void {
		this.menuItems = groupedSettingsMenuItems
			.filter(parent => parent.onlyOrgType.length === 0 || parent.onlyOrgType.includes(<IterproOrgType>club.type))
			.filter(parent => parent.teamModules.length === 0 || parent.teamModules.every(module => currentTeam.enabledModules.includes(module)))
			.filter(parent => !parent.onlyAdmin || currentCustomer?.admin)
			.filter(
				parent =>
					parent.onlyWithPermissions.length === 0 ||
					parent.onlyWithPermissions.every(permission =>
						this.canAccessToModule(permission, currentTeam, currentCustomer)
					)
			)
			.map(parent => {
				const item: SideMenu = {
					label: parent.label,
					routerLink: parent.routerLink,
					items: parent.items
						.filter(item => item.onlyOrgType.length === 0 || item.onlyOrgType.includes(<IterproOrgType>club.type))
						.filter(item => item.teamModules.length === 0 || item.teamModules.every(module => currentTeam.enabledModules.includes(module)))
						.filter(item => !item.onlyAdmin || currentCustomer?.admin)
						.filter(
							item =>
								item.onlyWithPermissions.length === 0 ||
								parent.onlyWithPermissions.every(permission =>
									this.canAccessToModule(permission, currentTeam, currentCustomer)
								)
						)
						.map(item => {
							const childItem: SideMenu = {
								label: item.label,
								routerLink: item.routerLink
							};
							return childItem;
						})
				};
				return item;
			});
	}
	//endregion

	private canAccessToModule(module: IterproUserPermission, currentTeam: Team, currentCustomer: Customer): boolean {
		return this.#permissionsService.canUserAccessToModule(module, currentTeam, currentCustomer).response;
	}
}
