import { AfterViewChecked, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CustomerApi, CustomerTeamSettingsApi, LoopBackAuth, Team, Test, TestApi } from '@iterpro/shared/data-access/sdk';
import {
	CanComponentDeactivate,
	EditModeService,
	ErrorService,
	getTeamSettings,
	sortByName
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, Message, SelectItem } from 'primeng/api';
import { Observable, Observer, Subscription } from 'rxjs';
import { ListboxChangeEvent } from 'primeng/listbox';

@UntilDestroy()
@Component({
	templateUrl: './examination.component.html',
	styleUrls: ['./examination.component.css']
})
export class ExaminationComponent implements CanComponentDeactivate, AfterViewChecked, OnInit, OnDestroy {
	instanceIdParam: any;
	modelIdParam: any;
	receivedTabIndex = 0; // read value of tab index (0 for protocol / 1 for records)
	msgs: Message[];
	tests: SelectItem[];
	filteredTests: SelectItem[];
	selectedTest: Test;
	newTest: boolean;
	currentTeam: Team;
	route$: Subscription;
	customer: any;
	currentPinnedTestsIds: any[];
	teamSettingsToUpdate: any;
	purposeList: SelectItem[];

	constructor(
		private error: ErrorService,
		private testApi: TestApi,
		private authService: LoopBackAuth,
		public editService: EditModeService,
		private confirmationService: ConfirmationService,
		private translate: TranslateService,
		private cdRef: ChangeDetectorRef,
		private route: ActivatedRoute,
		private customerApi: CustomerApi,
		private customerTeamSettingsApi: CustomerTeamSettingsApi
	) {}

	ngAfterViewChecked() {
		this.cdRef.detectChanges();
	}

	@HostListener('window:beforeunload')
	canDeactivate() {
		if (this.editService.editMode === false) {
			return true;
		}

		return new Observable((observer: Observer<boolean>) => {
			this.confirmationService.confirm({
				message: this.translate.instant('confirm.editGuard'),
				header: this.translate.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					this.editService.editMode = false;
					observer.next(true);
					observer.complete();
				},
				reject: () => {
					observer.next(false);
					observer.complete();
				}
			});
		});
	}

	ngOnDestroy() {
		console.debug('On Destroy');
	}

	ngOnInit() {
		this.route.paramMap.pipe(untilDestroyed(this)).subscribe(
			(results: any) => {
				if (results['params']) {
					this.modelIdParam = results['params'].testId;
					this.instanceIdParam = results['params'].id;
				}
				this.newTest = false;
				this.getPurpose();
				this.loadPinnedAndTests(null);
			},
			(error: Error) => this.error.handleError(error)
		);
	}

	/**
	 * This (parent component ) receive the value of index from test component (child component)
	 * @param index : 0 for protocol tab / 1 for records tab
	 */
	tabIndex(index: any) {
		this.receivedTabIndex = index;
	}

	getPurpose() {
		this.purposeList = [];
		this.purposeList.push(
			{ label: 'Agility', value: 'Agility' },
			{ label: 'Strength', value: 'Strength' },
			{ label: 'Speed', value: 'Speed' },
			{ label: 'Power', value: 'Power' },
			{ label: 'Aerobic', value: 'Aerobic' },
			{ label: 'Anaerobic', value: 'Anaerobic' },
			{ label: 'Coordination', value: 'Coordination' },
			{ label: 'Reaction', value: 'Reaction' },
			{ label: 'Sport Specific', value: 'Sport Specific' },
			{ label: 'Balance', value: 'Balance' },
			{ label: 'Movement Screening', value: 'Movement Screening' },
			{ label: 'Psychology', value: 'Psychology' },
			{ label: 'Anthropometry', value: 'Anthropometry' },
			{ label: 'CNS', value: 'CNS' },
			{ label: 'ANS', value: 'ANS' },
			{ label: 'Hydration', value: 'Hydration' },
			{ label: 'Haematology', value: 'Haematology' },
			{ label: 'Sleep', value: 'Sleep' },
			{ label: 'Adrenal', value: 'Adrenal' },
			{ label: 'Cardiovascular', value: 'Cardiovascular' },
			{ label: 'Metabolic', value: 'Metabolic' }
		);
		this.purposeList = sortByName(this.purposeList, 'value');
	}

	sortByInstances(tests) {
		return tests.sort((a, b) => {
			if ((!a.value.instances || a.value.instances.length === 0) && b.value.instances.length > 0) return 1;
			if (!b.value.instances || (b.value.instances.length === 0 && a.value.instances.length > 0)) return -1;
			if (
				!b.value.instances ||
				(b.value.instances.length === 0 && !a.value.instances) ||
				a.value.instances.length === 0
			)
				return 0;
			return a.value.instances.length < b.value.instances.length
				? 1
				: a.value.instances.length > b.value.instances.length
				? -1
				: 0;
		});
	}

	loadPinnedAndTests(event?: Test) {
		// Getting pinned test informstion per customer per team.
		this.customerApi
			.getCurrent({ include: ['teamSettings'] })
			.pipe(untilDestroyed(this))
			.subscribe(
				{
					next: (result: any) => {
						this.customer = result;
						this.teamSettingsToUpdate = getTeamSettings(this.customer.teamSettings, this.authService.getCurrentUserData().currentTeamId);
						this.currentPinnedTestsIds = [];
						this.currentPinnedTestsIds = this.teamSettingsToUpdate.pinnedTestsIds;
						this.loadTests(event);
					},
					error: (error: Error) => this.error.handleError(error)
				}
			);
	}

	private loadTests(event?: Test) {
		let tempTests = [];
		let tempFilteredTests = [];
		this.testApi
			.find({
				where: {
					teamId: { inq: [this.authService.getCurrentUserData().currentTeamId, 'GLOBAL'] },
					medical: true
				},
				include: {
					relation: 'instances',
					scope: {
						where: { teamId: this.authService.getCurrentUserData().currentTeamId },
						fields: ['id', 'date']
					}
				},
				order: 'name ASC'
			})
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (tests: Test[]) => {
					tests.forEach(x => {
						tempFilteredTests.push({ label: x.name, value: x });
						tempTests.push({ label: x.name, value: x });
					});
					tempTests = this.sortByPinned(tempTests);
					tempFilteredTests = this.sortByPinned(tempFilteredTests);
					if (event || this.modelIdParam) {
						const selected = this.modelIdParam
							? tempTests.find(x => x.value.id === this.modelIdParam)
							: tempFilteredTests.find(x => x.value.id === event.id);
						if (selected) {
							event = selected.value;
							this.selectTest(event);
						} else this.selectedTest = null;
					} else this.selectedTest = null;
					this.tests = tempTests;
					this.filteredTests = tempFilteredTests;
				},
				error: (error: Error) => this.error.handleError(error)
			});
	}

	onDiscardAdd() {
		this.selectedTest = null;
		this.newTest = false;
	}

	selectTest(test: Test) {
		if (!this.editService.editMode) {
			this.selectedTest = test;
			this.newTest = false;
			this.modelIdParam = null;
		}
	}

	addNewTest() {
		this.selectedTest = new Test({
			name: '',
			medical: true
		});
		this.selectedTest.instances = [];
		this.newTest = true;
	}

	handlePurposeChange(event) {
		const ps = event.value;
		if (!ps || ps.length === 0) {
			this.filteredTests = this.tests;
		} else {
			this.filteredTests = this.tests.filter(val => {
				if (val.value.purpose == null) return false;
				else return val.value.purpose.find(v => ps.indexOf(v) !== -1);
			});
		}
	}

	// Putting all the pinned tests at top of the list.
	sortByPinned(tests) {
		return tests.sort((a, b) => {
			if (
				this.currentPinnedTestsIds &&
				this.currentPinnedTestsIds.includes(a.value.id) &&
				this.currentPinnedTestsIds.includes(b.value.id)
			) {
				return 0;
			}
			if (this.currentPinnedTestsIds && this.currentPinnedTestsIds.includes(a.value.id)) {
				return -1;
			}
			if (this.currentPinnedTestsIds && this.currentPinnedTestsIds.includes(b.value.id)) {
				return 1;
			}
		});
	}

	// Find if all the tests pinned by customer for selected team.
	isTestPinned(testReceived) {
		const currentTeamSettings = getTeamSettings(this.customer.teamSettings, this.authService.getCurrentUserData().currentTeamId);
		const pinnedtestIds = currentTeamSettings?.pinnedTestsIds || [];
		return pinnedtestIds && pinnedtestIds.length > 0 && pinnedtestIds.includes(testReceived.value.id);
	}

	savePin(event, testReceived) {
		event.stopPropagation();
		let pinnedTestsIds = [];

		if (this.currentPinnedTestsIds) {
			if (this.currentPinnedTestsIds.includes(testReceived.value.id)) {
				this.currentPinnedTestsIds = this.currentPinnedTestsIds.filter(item => item !== testReceived.value.id);
			} else {
				this.currentPinnedTestsIds.push(testReceived.value.id);
			}
			pinnedTestsIds = this.currentPinnedTestsIds;
		}

		this.teamSettingsToUpdate = { ...this.teamSettingsToUpdate, pinnedTestsIds };

		this.customerTeamSettingsApi
			.patchAttributes(this.teamSettingsToUpdate.id, { pinnedTestsIds })
			.pipe(untilDestroyed(this))
			.subscribe({
				next: (teamSettings: any) => this.loadPinnedAndTests(null),
				error: (error: Error) => this.error.handleError(error)
			});
	}
}
