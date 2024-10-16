import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthSelectors, AuthState, SelectableTeam } from '@iterpro/shared/data-access/auth';
import { IterproOrgType, notificationModuleMapping } from '@iterpro/shared/data-access/permissions';
import {
	Club,
	Customer,
	CustomerApi,
	CustomerTeamSettings,
	CustomerTeamSettingsApi,
	Team,
	TeamApi
} from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	FormFeedbackComponent,
	FormTimepickerComponent,
	IconButtonComponent,
	ItemsGroup,
	SelectionDialogComponent,
	SkeletonAccordionComponent
} from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService,
	getTeamSettings
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { combineLatest, first, forkJoin } from 'rxjs';
import { distinctUntilChanged, filter, switchMap, tap } from 'rxjs/operators';
import { CustomerTeam, SettingsStore } from '../../../+state/settings.store';
import { EventFormatService } from '../../../../manager/planning/services/event-format.service';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import {
	getCustomerNotification,
	getTeamNotification,
	getTeamSettingsNotifications
} from './functions/notification.functions';
import {
	CustomerPreferenceNotification,
	CustomerPreferenceNotifications,
	CustomerTeamSettingPreferenceNotifications,
	SectionToggle,
	TeamPreferenceNotifications,
	UserPreferencesNotifications,
	administrationToggles,
	advancedToggles,
	generalToggles,
	scoutingToggles
} from './models/notification.type';
import { userPreferencesNotificationsForm } from './models/notifications.form';
import { NotificationsAreAllCheckedPipe } from './pipes/notifications-are-all-checked.pipe';
import { NotificationPermissionCheckPipe } from './pipes/notifications-permission-check.pipe';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-user-preferences-notifications',
	templateUrl: './settings-user-preferences-notifications.component.html',
	imports: [
		ActionButtonsComponent,
		ReactiveFormsModule,
		TranslateModule,
		FormFeedbackComponent,
		NgTemplateOutlet,
		NgClass,
		NotificationPermissionCheckPipe,
		SkeletonAccordionComponent,
		PrimeNgModule,
		FormTimepickerComponent,
		SettingsHeaderComponent,
		IconButtonComponent,
		NgStyle,
		FormsModule,
		NotificationsAreAllCheckedPipe
	],
	providers: [NotificationPermissionCheckPipe]
})
export class SettingsUserPreferencesNotificationsComponent implements CanComponentDeactivate, OnInit {
	// Services
	readonly #translateService = inject(TranslateService);
	readonly #eventFormatService = inject(EventFormatService);
	readonly #alertService = inject(AlertService);
	readonly #dialogService = inject(DialogService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #errorService = inject(ErrorService);
	readonly #customerApi = inject(CustomerApi);
	readonly #customerTeamSettingsApi = inject(CustomerTeamSettingsApi);
	readonly #teamApi = inject(TeamApi);
	readonly #notificationPermissionCheckPipe = inject(NotificationPermissionCheckPipe);
	readonly #authStore = inject(Store<AuthState>);
	readonly #fb = inject(FormBuilder);
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	// Variables
	readonly notificationsForm = this.#fb.nonNullable.group<UserPreferencesNotifications>(
		userPreferencesNotificationsForm
	);
	readonly customer$ = this.#authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed());
	readonly club$ = this.#authStore.select(AuthSelectors.selectClub).pipe(takeUntilDestroyed());
	readonly currentTeam$ = this.#authStore.select(AuthSelectors.selectTeam).pipe(takeUntilDestroyed());
	readonly teamList$ = this.#authStore.select(AuthSelectors.selectTeamList).pipe(takeUntilDestroyed());
	readonly settingsStore = inject(SettingsStore);
	saveClicked = false;
	readonly notificationBonusPercentages: SelectItem[] = [
		{ label: '10%', value: 10 },
		{ label: '20%', value: 20 },
		{ label: '30%', value: 30 },
		{ label: '40%', value: 40 },
		{ label: '50%', value: 50 },
		{ label: '60%', value: 60 },
		{ label: '70%', value: 70 },
		{ label: '80%', value: 80 },
		{ label: '90%', value: 90 },
		{ label: '100%', value: 100 }
	];
	scoutingNotificationPlayersChoices: SelectItem[];
	gmtOptions: SelectItem[];
	eventFormats: SelectItem[];
	workloadTargetOptions: SelectItem[];
	currentTeam: Team;
	customer: Customer;
	club: Club;
	isLoading = false;
	editMode = false;
	#teamList: SelectableTeam[];
	generalToggles: SectionToggle;
	advancedToggles: SectionToggle;
	administrationToggles: SectionToggle;
	scoutingToggles: SectionToggle;
	ngOnInit(): void {
		this.isLoading = true;
		this.#blockUiInterceptorService
			.disableOnce(this.#customerApi.getCurrent({ include: 'teamSettings' }))
			.pipe(
				tap((current: Customer) => this.#authStore.dispatch(AuthActions.performPatchCustomer({ customer: current }))),
				switchMap(() => combineLatest([this.customer$, this.currentTeam$, this.club$, this.teamList$])),
				distinctUntilChanged(),
				filter(
					([customer, currentTeam, club, teamList]: [Customer, Team, Club, SelectableTeam[]]) =>
						!!customer && !!currentTeam && !!club && !!teamList
				)
			)
			.subscribe({
				next: ([customer, currentTeam, club, teamList]: [Customer, Team, Club, SelectableTeam[]]) => {
					this.setGmtOptions();
					this.setScoutingNotificationPlayerChoices();
					this.setEventFormats(currentTeam.club?.nationalClub);
					this.loadSectionToggles(currentTeam.club.type as IterproOrgType);
					this.setWorkloatTargetOptions();
					this.currentTeam = currentTeam;
					this.club = club;
					this.customer = customer;
					this.#teamList = teamList;
					this.loadForm();
					setTimeout(() => (this.isLoading = false), 300);
				}
			});
	}

	private loadSectionToggles(orgType: IterproOrgType) {
		this.generalToggles = this.filterToggle(generalToggles, orgType);
		this.advancedToggles = this.filterToggle(advancedToggles, orgType);
		this.administrationToggles = this.filterToggle(administrationToggles, orgType);
		this.scoutingToggles = this.filterToggle(scoutingToggles, orgType);
	}

	private filterToggle(toggles: SectionToggle, orgType: IterproOrgType): SectionToggle {
		return toggles.filter(({ controlName, groupName }) => {
			const permissionMapping = notificationModuleMapping[controlName] || notificationModuleMapping[groupName];
			return (
				(permissionMapping && permissionMapping.onlyOrgType.length === 0) ||
				permissionMapping.onlyOrgType.includes(orgType)
			);
		});
	}

	canDeactivate(): boolean {
		return !this.notificationsForm.dirty;
	}

	private setGmtOptions() {
		const tempOptions: SelectItem[] = [];
		for (let i = 0; i <= 12; i++) {
			if (i === 0) tempOptions.push({ label: 'GMT 0', value: i });
			else {
				tempOptions.push({ label: 'GMT + ' + i, value: i });
				tempOptions.push({ label: 'GMT ' + -i, value: -i });
			}
		}
		this.gmtOptions = tempOptions;
	}

	private setEventFormats(nationalClub: boolean) {
		this.eventFormats = (
			nationalClub
				? this.#eventFormatService.getNationalClubSelectableFormats()
				: this.#eventFormatService.getClubSelectableFormats()
		).map(({ label, value }) => ({
			label: this.#translateService.instant(label),
			value
		}));
	}

	private setWorkloatTargetOptions() {
		this.workloadTargetOptions = [
			{ value: 'above', label: this.#translateService.instant('above') },
			{ value: 'target', label: this.#translateService.instant('target') },
			{ value: 'below', label: this.#translateService.instant('below') }
		];
	}

	private setScoutingNotificationPlayerChoices() {
		this.scoutingNotificationPlayersChoices = [
			{ label: this.#translateService.instant('sessionAnalysis.options.all'), value: 'ALL' },
			{ label: this.#translateService.instant('scouting.recommended'), value: 'RECOMMENDED' }
		];
	}

	private loadForm(): void {
		const teamSettings = getTeamSettings(this.customer.teamSettings, this.customer.currentTeamId);
		const data = {
			...getTeamSettingsNotifications(teamSettings),
			...getTeamNotification(this.currentTeam),
			...getCustomerNotification(this.customer)
		};
		this.notificationsForm.patchValue({
			administration: data,
			advanced: data,
			general: data,
			scouting: data
		});
		this.notificationsForm.disable();
	}

	edit(): void {
		this.editMode = true;
		this.enableForm();
	}

	discard(): void {
		this.saveClicked = false;
		this.editMode = false;
		this.notificationsForm.markAsPristine();
		this.loadForm();
	}

	save(): void {
		this.saveClicked = true;
		if (!this.notificationsForm.valid)
			return this.#alertService.notify('warn', 'Settings', 'alert.formNotValid', false);
		this.notificationsForm.disable();
		this.notificationsForm.markAsPristine();
		this.editMode = false;
		this.updateEntities();
	}

	private updateEntities() {
		this.isLoading = true;
		const data: CustomerPreferenceNotification = this.getFormData();
		const teamSettings = getTeamSettings(this.customer.teamSettings, this.customer.currentTeamId);
		const teamSettingsPayload = getTeamSettingsNotifications(data);
		const teamSettingObs$ = this.#customerTeamSettingsApi.patchAttributes(teamSettings.id, teamSettingsPayload);
		const teamPayload = getTeamNotification(data);
		const customerPayload = getCustomerNotification(data);
		const teamObs$ = this.#teamApi.patchAttributes(this.currentTeam.id, teamPayload);
		const customerObs$ = this.#customerApi.patchAttributes(this.customer.id, customerPayload);
		this.#blockUiInterceptorService.disableOnce(forkJoin([teamSettingObs$, teamObs$, customerObs$])).subscribe({
			next: () => {
				this.isLoading = false;
				this.syncAuthStore(customerPayload, teamSettingsPayload, teamSettings.id, this.currentTeam.id, teamPayload);
				this.#alertService.notify('success', 'home.settings', 'settings.notificationUpdated', false);
			},
			error: (error: Error) => this.#errorService.handleError(error)
		});
	}

	private syncAuthStore(
		customerPayload: CustomerPreferenceNotifications,
		teamSettingsPayload: CustomerTeamSettingPreferenceNotifications,
		teamSettingsId: string,
		targetTeamId: string,
		teamPayload: TeamPreferenceNotifications
	) {
		this.#authStore.dispatch(
			AuthActions.performPatchCustomer({
				customer: {
					...customerPayload,
					teamSettings: this.customer.teamSettings.map(teamSetting =>
						teamSetting.id === teamSettingsId
							? {
									...teamSetting,
									...teamSettingsPayload
								}
							: teamSetting
					)
				}
			})
		);
		this.#authStore.dispatch(AuthActions.performPatchTeam({ teamId: targetTeamId, team: { ...teamPayload } }));
	}

	private getFormData(): CustomerPreferenceNotification {
		const rawValue = this.notificationsForm.getRawValue();
		return {
			...rawValue.general,
			...rawValue.advanced,
			...rawValue.administration,
			...rawValue.scouting
		};
	}

	private enableForm() {
		// set enable controls based on permissions
		const groupNames = Object.keys(this.notificationsForm.controls);
		groupNames.forEach(groupName => {
			Object.keys(this.notificationsForm.controls[groupName].controls).forEach(controlName => {
				if (
					this.#notificationPermissionCheckPipe.transform(controlName, this.currentTeam, this.club, this.customer)
						?.enabled?.response
				) {
					this.notificationsForm.controls[groupName].get(controlName)?.enable();
				}
			});
		});
	}

	toggleSection(form: FormGroup, sectionKeys: SectionToggle, checked: boolean) {
		sectionKeys.forEach(({ groupName, controlName }) => {
			if (groupName) {
				const control = form.get(groupName)?.get(controlName);
				if (control.enabled) {
					control.setValue(checked);
				}
			} else {
				const control = form.get(controlName);
				if (control.enabled) {
					control.setValue(checked);
				}
			}
		});
		this.notificationsForm.markAsDirty();
	}

	//#region Apply To Menu

	openApplyToTeamMenu() {
		this.openApplyToTeamDialog();
	}

	private openApplyToTeamDialog() {
		const dialogRef = this.createTeamSelectionDialog(true);
		const closeRef$ = dialogRef.onClose.pipe(
			untilDestroyed(this),
			filter(selectedTeam => !!selectedTeam)
		);
		closeRef$.subscribe((teams: Team[]) => this.applyToTeamConfirmed(teams));
	}

	private createTeamSelectionDialog(includeCurrentTeamOnSelection: boolean): DynamicDialogRef {
		const itemsGroups: ItemsGroup[] = [
			{
				groupName: this.#translateService.instant('Teams'),
				groupItems:
					(this.#teamList || [])
						.filter(({ id }) => includeCurrentTeamOnSelection || id !== this.currentTeam.id)
						.map(team => ({
							label:
								`${team.name}` +
								(team.id === this.currentTeam.id
									? ` (${this.#translateService.instant('settings.preferences.currentTeam')})`
									: ''),
							value: {
								...team
							}
						})) || []
			}
		];
		return this.#dialogService.open(SelectionDialogComponent, {
			header: this.#translateService.instant('confirm.selectTeamsToApplyNotificationsTo'),
			data: {
				isMultipleSelection: true,
				itemsGroups,
				subtitle: this.#translateService.instant('confirm.selectTeamsToApplyNotificationsTo.subtitle')
			},
			contentStyle: { overflow: 'auto' }
		});
	}

	private applyToTeamConfirmed(teamsApplyTo: SelectableTeam[]) {
		if (teamsApplyTo?.length === 0) return;
		this.#confirmationService.confirm({
			message: this.#translateService.instant('teamNotifications.applyTo', {
				sourceValue: `${this.currentTeam.name}`,
				targetValue: teamsApplyTo.map(({ name }) => `${name}`).join(', ')
			}),
			header: 'IterPRO',
			accept: async () => {
				this.applyToTeams(teamsApplyTo);
			}
		});
	}

	private applyToTeams(teamsApplyTo: SelectableTeam[]) {
		if (teamsApplyTo?.length === 0) return;
		this.isLoading = true;
		const teamObs$ = [];
		const data: CustomerPreferenceNotification = this.getFormData();
		teamsApplyTo.map(targetTeam => {
			const teamData = this.getApplyToTeamPayload(data, targetTeam);
			if (targetTeam.id !== this.currentTeam.id) {
				teamObs$.push(this.#teamApi.patchAttributes(targetTeam.id, teamData));
			}
			const teamCustomers: CustomerTeam[] = this.settingsStore
				.clubCustomers()
				.filter(({ teamSettings }) => teamSettings.find(({ teamId }) => teamId === targetTeam.id));
			for (const targetCustomer of teamCustomers) {
				const customerData = this.getApplyToCustomerData(data, targetTeam as Team, targetCustomer);
				const targetTeamSettings: CustomerTeamSettings = getTeamSettings(targetCustomer.teamSettings, targetTeam.id);
				const teamSettingsData = this.getApplyToCustomerTeamSettingsData(data, targetTeam as Team, targetCustomer);
				teamObs$.push(this.#customerTeamSettingsApi.patchAttributes(targetTeamSettings.id, teamSettingsData));
				this.settingsStore.updateClubCustomerSettingById(
					targetCustomer.id,
					targetTeamSettings.teamId,
					teamSettingsData
				);
				teamObs$.push(this.#customerApi.patchAttributes(targetCustomer.id, customerData));
				if (targetCustomer.id === this.customer.id) {
					this.syncAuthStore(customerData, teamSettingsData, targetTeamSettings.id, targetTeam.id, teamData);
				}
			}
		});
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(teamObs$))
			.pipe(first(), untilDestroyed(this))
			.subscribe({
				next: result => {
					this.isLoading = false;
					this.#alertService.notify('success', 'home.settings', 'settings.notificationUpdated');
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	private getApplyToTeamPayload(
		data: CustomerPreferenceNotification,
		targetTeam: SelectableTeam
	): TeamPreferenceNotifications {
		const teamData = getTeamNotification(data);
		Object.keys(teamData).forEach(key => {
			if (!this.#notificationPermissionCheckPipe.transform(key, targetTeam as Team, this.club)?.enabled?.response) {
				teamData[key] = false;
			}
		});
		return teamData;
	}

	private getApplyToCustomerData(
		data: CustomerPreferenceNotification,
		targetTeam: Team,
		customer: CustomerTeam
	): CustomerPreferenceNotifications {
		const customerData = getCustomerNotification(data);
		Object.keys(customerData).forEach(key => {
			if (
				!this.#notificationPermissionCheckPipe.transform(key, targetTeam, this.club, customer as Customer)?.enabled
					?.response
			) {
				customerData[key] = false;
			}
		});
		return customerData;
	}

	private getApplyToCustomerTeamSettingsData(
		data: CustomerPreferenceNotification,
		targetTeam: Team,
		customer: CustomerTeam
	): CustomerTeamSettingPreferenceNotifications {
		const customerData = getTeamSettingsNotifications(data);
		Object.keys(customerData).forEach(key => {
			if (
				!this.#notificationPermissionCheckPipe.transform(key, targetTeam, this.club, customer as Customer)?.enabled
					?.response
			) {
				customerData[key] = false;
			}
		});
		return customerData;
	}
	//endregion
}
