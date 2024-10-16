import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { ClubSeason } from '@iterpro/shared/data-access/sdk';
import { EditModeService } from '@iterpro/shared/utils/common-utils';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable, Observer } from 'rxjs';
import { CashFlowStoreActions, CashFlowStoreSelectors } from 'src/app/+state/cash-flow-store';
import { CashFlowTableData } from 'src/app/+state/cash-flow-store/cash-flow-store.state';
import { RootStoreState } from 'src/app/+state/root-store.state';

@Component({
	selector: 'iterpro-finance-cash-flow',
	templateUrl: './finance-cash-flow.component.html',
	styleUrls: ['./finance-cash-flow.component.css']
})
export class FinanceCashFlowComponent implements OnInit, OnDestroy {
	tableData$: Observable<Array<CashFlowTableData>>;
	chartData$: Observable<any>;
	chartOptions$: Observable<any>;
	clubSeasons$: Observable<ClubSeason[]>;
	totalOperatingCashFlow$: Observable<number>;
	isLoading$: Observable<boolean>;
	nationalItems: SelectItem[] = [
		{ label: 'admin.contracts.home', value: 'national' },
		{ label: 'admin.contracts.away', value: 'international' }
	];
	national: string[] = ['national', 'international'];
	achieved = true;
	currency = `€`;
	tabIndex = 0;

	bonusItems: SelectItem[] = [
    { label: 'finance.cashFlow.achievedBonus', value: true },
    { label: 'finance.cashFlow.totalBonus', value: false }
  ];
	constructor(
		private store$: Store<RootStoreState>,
		private currentTeamService: CurrentTeamService,
		private translate: TranslateService,
		public editService: EditModeService,
		private confirmationService: ConfirmationService
	) {}

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
		this.store$.dispatch(CashFlowStoreActions.clearState());
	}

	ngOnInit() {
		this.currency = this.currentTeamService.getCurrency();
		this.nationalItems = this.nationalItems.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.bonusItems = this.bonusItems.map(x => ({ label: this.translate.instant(x.label), value: x.value }));
		this.tableData$ = this.store$.select(CashFlowStoreSelectors.selectTableData);
		this.chartData$ = this.store$.select(CashFlowStoreSelectors.selectChartData);
		this.chartOptions$ = this.store$.select(CashFlowStoreSelectors.selectChartOptions);
		this.isLoading$ = this.store$.select(CashFlowStoreSelectors.selectIsLoading);
		this.clubSeasons$ = this.store$.select(CashFlowStoreSelectors.selectClubSeasons);
		this.totalOperatingCashFlow$ = this.store$.select(CashFlowStoreSelectors.selectTotalOperatingCashFlow);
		this.onChangeParameters();
	}

	onChangeParameters(): void {
		this.getCashFlow(this.national, this.achieved);
	}

	getCashFlow(national: string[], achieved: boolean): void {
		this.store$.dispatch(
			CashFlowStoreActions.getCashFlowData({
				national: national.includes('national'),
				international: national.includes('international'),
				achieved
			})
		);
	}

	edit(): void {
		this.editService.editMode = true;
		this.store$.dispatch(CashFlowStoreActions.toggleEditMode({ edit: this.editService.editMode }));
	}

	discard(): void {
		this.editService.editMode = false;
		this.store$.dispatch(CashFlowStoreActions.toggleEditMode({ edit: this.editService.editMode }));
	}

	save(): void {
		this.editService.editMode = false;
		this.store$.dispatch(CashFlowStoreActions.save());
	}

	downloadCSV(): void {
		this.store$.dispatch(CashFlowStoreActions.downloadCSV());
	}

	downloadPDF(): void {
		this.store$.dispatch(CashFlowStoreActions.downloadPDF());
	}

	onChangeOperatingCashFlow(value, index): void {
		this.store$.dispatch(CashFlowStoreActions.updateOperatingCashFlow({ value, index }));
	}

	onTabChange(event) {
		this.tabIndex = event.index;
	}
}
