import { AsyncPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthActions, AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import {
	Club,
	ClubApi,
	Customer,
	CustomerApi,
	CustomerTeamSettings,
	CustomerTeamSettingsApi,
	DialogOutput,
	DialogOutputAction,
	Team
} from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	CsvUploadDownloadComponent,
	IconButtonComponent,
	PictureComponent,
	SkeletonTableComponent
} from '@iterpro/shared/ui/components';
import { CustomerTeamSettingPipe, FilterByFieldPipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AlertService,
	AzureStoragePipe,
	BlockUiInterceptorService,
	CanComponentDeactivate,
	ErrorService,
	getMomentFormatFromStorage,
	getTeamSettings,
	PermissionConstantService,
	sortByName,
	userHasPermission
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { cloneDeep, uniq } from 'lodash';
import moment from 'moment';
import Papa from 'papaparse';
import { ConfirmationService, SelectItem, SelectItemGroup, SharedModule } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { combineLatest, forkJoin, map, Observable, switchMap } from 'rxjs';
import { distinctUntilChanged, filter, first, tap } from 'rxjs/operators';
import { CustomerEditComponent } from 'src/app/settings/settings-account-management/components/customer-edit/customer-edit.component';
import { CustomerTeamSettingsEditComponent } from 'src/app/settings/settings-account-management/components/customer-team-settings-edit/customer-team-settings-edit.component';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { CustomerEdit, CustomerEditInput } from '../customer-edit/models/customer-edit.type';
import {
	CustomerTeamSettingEdit,
	CustomerTeamSettingEditFormInput
} from '../customer-team-settings-edit/models/customer-team-setting-edit.type';
import fields from './models/metrics';
import {
	AccountManagementTeam,
	AccountManagementUserPermission,
	TeamSettingsPermission
} from './models/settings-user-permissions.type';
import { TeamCounterCustomerPipe } from './pipes/team-counter-customer.pipe';
import { TeamPermissionsTooltipPipe } from './pipes/team-permissions-tooltip.pipe';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'iterpro-account-management-users-permissions',
	templateUrl: './settings-account-management-users-permissions.component.html',
	imports: [
		ActionButtonsComponent,
		AzureStoragePipe,
		CustomerTeamSettingPipe,
		ReactiveFormsModule,
		SharedModule,
		TranslateModule,
		AsyncPipe,
		PrimeNgModule,
		NgClass,
		FormsModule,
		PictureComponent,
		IconButtonComponent,
		TeamPermissionsTooltipPipe,
		NgTemplateOutlet,
		FilterByFieldPipe,
		TeamCounterCustomerPipe,
		CsvUploadDownloadComponent,
		SkeletonTableComponent,
		BadgeModule,
		SettingsHeaderComponent
	],
	providers: [TeamCounterCustomerPipe]
})
export class SettingsAccountManagementUsersPermissionsComponent implements CanComponentDeactivate, OnInit {
	// Services
	readonly #translate = inject(TranslateService);
	readonly #alertService = inject(AlertService);
	readonly #confirmationService = inject(ConfirmationService);
	readonly #translateService = inject(TranslateService);
	readonly #permissionService: PermissionConstantService = inject(PermissionConstantService);
	readonly #zone = inject(NgZone);
	readonly #errorService = inject(ErrorService);
	readonly #dialogService: DialogService = inject(DialogService);
	readonly #customerApi = inject(CustomerApi);
	readonly #clubApi = inject(ClubApi);
	readonly #customerTeamSettingsApi = inject(CustomerTeamSettingsApi);
	readonly #authStore = inject(Store<AuthState>);
	readonly club$ = this.#authStore.select(AuthSelectors.selectClub).pipe(takeUntilDestroyed());
	readonly customer$ = this.#authStore.select(AuthSelectors.selectCustomer).pipe(takeUntilDestroyed());
	readonly currentTeam$ = this.#authStore.select(AuthSelectors.selectCurrentTeam).pipe(takeUntilDestroyed());
	readonly #blockUiInterceptorService = inject(BlockUiInterceptorService);
	readonly #teamCounterCustomerPipe = inject(TeamCounterCustomerPipe);
	// Variables
	#club: Club;
	currentCustomer: Customer;
	customers: AccountManagementUserPermission[];
	customersBackup: AccountManagementUserPermission[];
	selectedRows: AccountManagementUserPermission[] = [];
	#currentTeam: Team;
	teams: AccountManagementTeam[];
	nameFilter: string;
	permissionsOptions: SelectItemGroup[];
	mobilePermissionsOptions: SelectItem[] = [];
	#positionsOptions: SelectItem[];
	private readonly MAX_USERS = 999;
	#uploadedCustomers: AccountManagementUserPermission[];
	#countOfUploadedRows = 0;
	totalRowsInCsv = 0;
	#fileReader: FileReader;
	isLoading = true;
	@ViewChild('csvInput', { static: false }) csvInput: ElementRef;
	ngOnInit() {
		combineLatest(this.club$, this.customer$, this.currentTeam$)
			.pipe(
				distinctUntilChanged(),
				filter(([club, customer, currentTeam]: [Club, Customer, Team]) => !!club && !!customer && !!currentTeam),
				switchMap(([club, customer, currentTeam]: [Club, Customer, Team]) => {
					this.#club = club;
					this.currentCustomer = customer;
					this.#currentTeam = currentTeam;
					return this.#blockUiInterceptorService.disableOnce(
						forkJoin([this.loadClubCustomers(club.id), this.loadClubTeams(club.id)])
					);
				})
			)
			.subscribe({
				next: result => {
					this.loadOptions();
					this.isLoading = false;
				},
				error: (error: Error) => this.#errorService.handleError(error)
			});
	}

	canDeactivate(): boolean {
		return this.selectedRows.length === 0;
	}

	private loadClubCustomers(clubId: string): Observable<AccountManagementUserPermission[]> {
		return this.#customerApi
			.find({
				fields: [
					'id',
					'firstName',
					'lastName',
					'email',
					'teamSettings',
					'currentTeamId',
					'username',
					'clubId',
					'downloadUrl',
					'admin'
				],
				where: {
					clubId: clubId
				},
				include: ['teamSettings']
			})
			.pipe(
				map((customers: AccountManagementUserPermission[]) => {
					this.customers = sortByName(customers || [], 'lastName');
					this.customersBackup = cloneDeep(this.customers);
					return this.customers;
				})
			);
	}

	private loadClubTeams(clubId: string): Observable<AccountManagementTeam[]> {
		return this.#clubApi.getTeams(clubId, { fields: ['id', 'name', 'customersLimit'] }).pipe(
			map((teams: AccountManagementTeam[]) => {
				this.teams = sortByName(teams, 'name');
				return this.teams;
			})
		);
	}

	discard() {
		this.customers = cloneDeep(this.customersBackup);
		this.selectedRows = [];
	}

	deleteCustomers() {
		this.#confirmationService.confirm({
			message: this.#translateService.instant('confirm.deleteAll'),
			header: 'IterPRO',
			accept: () => {
				const removedCustomersObs$: Observable<AccountManagementUserPermission>[] = this.selectedRows.map(customer =>
					this.#customerApi.deleteById(customer.id)
				);
				this.handleUpdateRecords(removedCustomersObs$);
			}
		});
	}

	private handleUpdateRecords(obs$: Observable<AccountManagementUserPermission>[]) {
		this.isLoading = true;
		this.#blockUiInterceptorService
			.disableOnce(forkJoin(obs$))
			.pipe(
				first(),
				switchMap(() => this.loadClubCustomers(this.#club.id)),
				switchMap(() => this.#customerApi.getCurrent({ include: 'teamSettings' })),
				tap((current: Customer) => this.#authStore.dispatch(AuthActions.performPatchCustomer({ customer: current })))
			)
			.subscribe({
				next: () => {
					this.isLoading = false;
					this.selectedRows = [];
					this.#alertService.notify('success', 'permissions', 'alert.recordUpdated', false);
				},
				error: (error: Error) => {
					this.isLoading = false;
					this.#errorService.handleError(error);
				}
			});
	}

	//region Customer Edit Dialog
	editCustomer(rowData?: AccountManagementUserPermission, index?: number) {
		if (!rowData && this.customersOverLimit(this.#club, this.customers)) {
			this.#alertService.notify('error', 'home.settings', 'permissions.alert.limitCustomers', false);
		}
		if (!rowData) {
		}
		this.openCustomerEditDialog(rowData, index);
	}

	private openCustomerEditDialog(customer?: AccountManagementUserPermission, index?: number) {
		const ref = this.createCustomerEditDialog(customer);
		ref.onClose.subscribe((result: DialogOutput<CustomerEdit>) => {
			if (result) {
				let obs$: Observable<any>;
				const customerEdit = result.data;
				switch (result.action) {
					case DialogOutputAction.Edit:
						const newUser: Partial<Customer> = {
							...customerEdit,
							username: this.generateCustomerUsername(
								customerEdit.email,
								customerEdit.firstName,
								customerEdit.lastName
							),
							clubId: this.#club.id
						};
						obs$ = customerEdit?.id
							? this.#customerApi.patchAttributes(customerEdit.id, customerEdit)
							: this.#clubApi.addNewCustomer(this.#club.id, newUser);
						break;
					case DialogOutputAction.Delete:
						obs$ = this.#customerApi.deleteById(customerEdit.id);
						break;
				}
				this.handleUpdateRecords([obs$]);
			}
		});
	}

	private createCustomerEditDialog(customer?: AccountManagementUserPermission): DynamicDialogRef {
		const baseLabel = customer?.id ? 'permissions.editCustomer' : 'permissions.addCustomer';
		const header = this.#translate.instant(baseLabel);
		const otherCustomers = this.customers.filter(item => !customer?.id || customer.id !== item.id);
		return this.#dialogService.open(CustomerEditComponent, {
			data: <CustomerEditInput>{
				customer,
				currentUserAdmin: this.currentCustomer.admin,
				alreadyUsedFirstNames: otherCustomers.map(({ firstName }) => firstName),
				alreadyUsedLastNames: otherCustomers.map(({ lastName }) => lastName),
				alreadyUsedEmails: otherCustomers.map(({ email }) => email),
				header
			},
			width: '50%',
			height: '50%',
			closable: false,
			showHeader: false,
			modal: true,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}
	//endregion

	//region Adding new Team Settings
	createTeamSettings(customer: AccountManagementUserPermission, team: AccountManagementTeam) {
		const totalUsersForTeam = this.#teamCounterCustomerPipe.transform(team.id, this.customers);
		if (totalUsersForTeam >= (team.customersLimit || 15)) {
			this.#alertService.notify('error', 'home.settings', 'permissions.alert.limitCustomers', false);
		} else {
			const customerTeamSettingsNew = new CustomerTeamSettings({
				customerId: customer.id,
				teamId: team.id,
				position: null,
				admin: false,
				permissions: [],
				metricsTeamTactical: this.getDefaultMetricsTeam(this.#currentTeam.providerTeam),
				metricsPerformance: this.getDefaultMetricsForGps(),
				metricsIndividualTactical: this.getDefaultMetricsPlayer(this.#currentTeam.providerPlayer),
				notificationEventReminder: {}
			});
			customer.currentTeamId = team.id;
			this.openTeamSettingsDialog(customerTeamSettingsNew, customer);
		}
	}

	openTeamSettings(rowData: AccountManagementUserPermission, team: AccountManagementTeam) {
		const teamSettings = getTeamSettings(rowData.teamSettings, team.id) as TeamSettingsPermission;
		this.openTeamSettingsDialog(teamSettings, rowData);
	}

	//endregion

	//region Team Settings Dialog
	private openTeamSettingsDialog(teamSettings: CustomerTeamSettings, customer: AccountManagementUserPermission) {
		const ref = this.createTeamSettingsDialog(teamSettings, customer);
		ref.onClose.subscribe((result: DialogOutput<CustomerTeamSettingEdit>) => {
			if (result) {
				let obs$: Observable<any>;
				const editedSetting = result.data;
				switch (result.action) {
					case DialogOutputAction.Edit:
						const newTeamSetting: CustomerTeamSettings = new CustomerTeamSettings({
							...editedSetting,
							customerId: customer.id,
							teamId: teamSettings.teamId
						});
						obs$ = this.#customerTeamSettingsApi.patchOrCreate(newTeamSetting);
						break;
					case DialogOutputAction.Delete:
						obs$ = this.#customerTeamSettingsApi.deleteById(editedSetting.id);
						break;
				}
				this.handleUpdateRecords([obs$]);
			}
		});
	}

	private createTeamSettingsDialog(
		teamSettings: CustomerTeamSettings,
		customer: AccountManagementUserPermission
	): DynamicDialogRef {
		const baseLabel = customer?.id ? 'permissions.setPermissions' : 'permissions.addPermissions';
		const header = this.#translate.instant(baseLabel);
		return this.#dialogService.open(CustomerTeamSettingsEditComponent, {
			data: <CustomerTeamSettingEditFormInput>{
				teamSettings,
				customer,
				hasAnyMobileAppEnabled: this.hasAnyMobileAppEnabled(),
				permissionsOptions: this.permissionsOptions,
				positionsOptions: this.#positionsOptions,
				mobilePermissionsOptions: this.mobilePermissionsOptions,
				header,
				teamName: this.teams.find(({ id }) => id === teamSettings.teamId)?.name
			},
			width: '50%',
			height: '60%',
			closable: false,
			showHeader: false,
			modal: true,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}
	//endregion

	//region Utils
	private loadPermissionsOptions() {
		this.permissionsOptions = this.#permissionService.getGroupedPermissions().map(item => ({
			label: this.#translate.instant(`permissions.group.${item.group}`),
			items: item.items.map(permission => ({
				label: this.#translate.instant(`permissions.item.${permission}`),
				value: permission,
				disabled:
					this.#permissionService.getOnlyOneUserPermission().includes(permission) &&
					this.checkSomeoneHasAlreadyThisPermission(permission) &&
					!this.checkIfCurrentUserHasPermission(permission)
			}))
		}));
		this.mobilePermissionsOptions = this.#permissionService.getMobilePermissions().map(permission => ({
			label: this.#translate.instant(permission),
			value: permission
		}));
	}

	private loadOptions() {
		this.loadPermissionsOptions();
		this.loadPositionsOptions();
	}
	private loadPositionsOptions() {
		this.#positionsOptions = sortByName(
			this.#permissionService.getPositions().map(p => ({ label: this.#translate.instant(p), value: p })),
			'label'
		);
	}
	private checkSomeoneHasAlreadyThisPermission(permission: string): boolean {
		return (
			this.customers.filter(({ teamSettings }) =>
				teamSettings.find(({ permissions }) => permissions.includes(permission))
			).length >= 1
		);
	}
	private checkIfCurrentUserHasPermission(permission: string): boolean {
		const teamSettings = getTeamSettings(this.currentCustomer?.teamSettings, this.currentCustomer.currentTeamId);
		return userHasPermission(teamSettings, permission);
	}

	private customersOverLimit(club: Club, customers: AccountManagementUserPermission[]): boolean {
		return club.freemium && club.freemiumUsers
			? customers.length >= club.freemiumUsers
			: customers.length >= this.MAX_USERS;
	}

	private generateCustomerUsername(email: string, firstName: string, lastName: string): string {
		return email ? email.split('@')[0] : `${firstName}.${lastName}`;
	}

	private hasAnyMobileAppEnabled(): boolean {
		return this.#club.directorApp || this.#club.coachingApp;
	}

	//endregion

	//region 2FA / Welcome Email
	reset2FA() {
		this.onResetAuth([...this.selectedRows]);
	}

	private onResetAuth(customers: AccountManagementUserPermission[]) {
		const selfIndex = customers.findIndex(({ id }) => id === this.currentCustomer.id);
		const selfReset = selfIndex > -1;
		if (selfReset) {
			customers.splice(selfIndex, 1);
			this.alertSelfResetAuth(customers);
		} else {
			this.confirmResetAuth(customers);
		}
	}

	private alertSelfResetAuth(customers: AccountManagementUserPermission[]) {
		this.#confirmationService.confirm({
			header: this.#translate.instant('permissions.reset2FA'),
			message: this.#translate.instant('permissions.reset2FA.backoffice'),
			icon: 'fa fa-exclamation-circle',
			rejectVisible: false,
			accept: () => {
				if (customers.length > 0) {
					setTimeout(() => this.#zone.run(() => this.confirmResetAuth(customers)), 0);
				}
			}
		});
	}

	private confirmResetAuth(customers: AccountManagementUserPermission[]) {
		if (customers.length > 0) {
			this.#confirmationService.confirm({
				header: this.#translate.instant('permissions.reset2FA'),
				message:
					this.#translate.instant('permissions.reset2FA.confirm') +
					'<br><br>' +
					customers.map(({ firstName, lastName }) => `${lastName} ${firstName}`).join(', '),
				rejectVisible: true,
				icon: 'fa fa-question-circle',
				accept: () => {
					const observables$ = customers.map(({ id }) => this.#customerApi.resetSecret(id));
					forkJoin(observables$)
						.pipe(first())
						.subscribe({
							next: () => {
								this.selectedRows = [];
								this.#alertService.notify('success', 'permissions', 'permissions.reset2FA.success', false);
							},
							error: (error: Error) => this.#errorService.handleError(error)
						});
				}
			});
		}
	}

	sendWelcomeEmail(customer: Customer) {
		this.#blockUiInterceptorService
			.disableOnce(this.welcomeEmail(customer))
			.pipe(untilDestroyed(this))
			.subscribe({
				next: res => {
					this.#alertService.notify('success', 'Permissions', 'permissions.alert.email.sent', false);
				},
				error: error => this.#errorService.handleError(error)
			});
	}

	private welcomeEmail(customer: Customer) {
		return this.#customerApi.welcomeEmail(customer.id);
	}

	//endregion

	//region Metric Team / Player

	getDefaultMetricsForGps(): string[] {
		return fields['gps'];
	}
	private getDefaultMetricsTeam(teamProvider) {
		const me = fields['team'];
		const teamMetrics = me[teamProvider];
		const teamModded = [];
		if (teamMetrics && teamMetrics.length > 0) {
			for (const th of teamMetrics) {
				const newTh = th.replace(/\./g, '_');
				teamModded.push(newTh);
			}
		}
		return teamModded;
	}

	private getDefaultMetricsPlayer(playerProvider) {
		const me = fields['player'];
		const playerMetrics = me[playerProvider];
		const playerModded = [];
		if (playerMetrics && playerMetrics.length > 0) {
			for (const th of playerMetrics) {
				const newTh = th.replace(/\./g, '_');
				playerModded.push(newTh);
			}
		}
		return playerModded;
	}

	//endregion

	//region File CSV Upload

	downloadEmptyCsv() {
		const headerObj = {};
		headerObj['No.'] = '';
		const customerProperties = ['firstName', 'lastName', 'email'];
		customerProperties.forEach(prop => {
			headerObj[prop] = '';
		});
		for (const team of this.teams) {
			headerObj['position_' + team.name] = '';
			headerObj['permissions_' + team.name] = '';
		}
		const results = Papa.unparse([headerObj], {});
		const fileName = 'Customers_' + moment().format(getMomentFormatFromStorage()) + '_empty.csv';
		const contentDispositionHeader = 'Content-Disposition: attachment; filename=' + fileName;
		const blob = new Blob([results], { type: 'text/plain' });
		saveAs(blob, fileName);
	}

	fileChanged(e) {
		this.#uploadedCustomers = [];
		this.#fileReader = new FileReader();
		this.#countOfUploadedRows = 0;
		this.totalRowsInCsv = 0;

		this.#fileReader.onload = async () => {
			const csvRead = this.#fileReader.result;
			const resultsCsv: Papa.ParseResult<any> = Papa.parse(csvRead.toString(), {
				header: true,
				skipEmptyLines: true
			});

			const csvData = resultsCsv.data;
			this.totalRowsInCsv = csvData.length;

			for (let i = 0; i <= csvData.length - 1; i++) {
				const allTeamSettings = [];
				for (const team of this.teams) {
					const jobPosition: string = csvData[i]['position_' + team.name];
					const permissions =
						csvData[i]['permissions_' + team.name]?.length > 0 ? csvData[i]['permissions_' + team.name].split(',') : [];
					let finalPerm = [];
					if (permissions.length > 0) {
						for (let j = 0; j < permissions.length; j++) {
							permissions[j] = permissions[j].toLowerCase().trim();
							const groupedPerm = this.#permissionService.getGroupedPermissions();
							const temObj = groupedPerm.find(({ items }) => items.indexOf(permissions[j]) >= 0);
							const groupObj = groupedPerm.find(({ group }) => group === permissions[j]);
							if (temObj) {
								finalPerm.push(temObj.group);
								temObj.items.forEach(x => finalPerm.push(x));
							} else if (groupObj) {
								finalPerm = [...finalPerm, ...groupObj.items];
							}
							finalPerm.push(permissions[j]);
						}
						const position = this.#positionsOptions.find(
							p => p.value.toLowerCase() || p.label.toLowerCase() === jobPosition.toLowerCase()
						).value;
						const teamSettings: TeamSettingsPermission = {
							...new CustomerTeamSettings({
								position: jobPosition ? position : null,
								permissions: finalPerm.length > 0 ? uniq(finalPerm) : [],
								mobilePermissions: [],
								teamId: team.id ? team.id : null
							}),
							edited: true
						};
						allTeamSettings.push(teamSettings);
					}
				}
				const customer: AccountManagementUserPermission = {
					id: null,
					downloadUrl: null,
					firstName: csvData[i].firstName || null,
					lastName: csvData[i].lastName || null,
					email: csvData[i].email || null,
					username: this.generateCustomerUsername(
						csvData[i].email as string,
						csvData[i].firstName as string,
						csvData[i].lastName as string
					),
					clubId: this.#club.id,
					currentTeamId: allTeamSettings ? allTeamSettings[0].teamId.toString() : null,
					teamSettings: allTeamSettings,
					admin: false
				};
				this.#uploadedCustomers.push(customer);
				this.#countOfUploadedRows++;
			}
			if (this.#countOfUploadedRows > 0) {
				this.#fileReader.onloadend = () => this.addFileUploadedCustomersToTable();
			} else {
				this.#alertService.notify('error', 'CSV Error', 'alert.csv.error', false);
			}
			this.csvInput.nativeElement.value = '';
		};

		this.#fileReader.onerror = ev => {
			this.#alertService.notify('error', 'error', 'import.feedbacks.errorCSV');
		};
		this.#fileReader.readAsText(e.target.files[0]);
	}

	private addFileUploadedCustomersToTable() {
		if (this.#uploadedCustomers) {
			this.customers = [...this.#uploadedCustomers, ...this.customers];
		}
	}
	//endregion
}
