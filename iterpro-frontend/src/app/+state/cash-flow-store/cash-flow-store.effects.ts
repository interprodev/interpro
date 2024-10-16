import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { ClubSeason, ClubSeasonApi, LoopBackAuth, TeamApi } from '@iterpro/shared/data-access/sdk';
import { AlertService, ReportService, difference, isEmptyObj, sortByName } from '@iterpro/shared/utils/common-utils';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import * as Papa from 'papaparse';
import { EMPTY, Observable, forkJoin, of } from 'rxjs';
import { catchError, concatMap, defaultIfEmpty, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { RootStoreState } from '../root-store.state';
import * as CashFlowStoreActions from './cash-flow-store.actions';
import * as CashFlowStoreSelectors from './cash-flow-store.selectors';
import { CashFlowData } from './cash-flow-store.state';

const exportCSV = (tableData, clubSeasons) => {
	const copy: any = cloneDeep(tableData);
	copy.forEach(season => {
		const clubSeason = clubSeasons.find(({ start }) => moment(season.date).year() === moment(start).year());
		season['sales/transferFee'] = season.sales.transferFee;
		season['sales/bonus'] = season.sales.bonus;
		season['sales/agentFee'] = season.sales.agentFee;
		season['sales/bonusAgent'] = season.sales.bonusAgent;
		delete season.sales;
		season['purchases/transferFee'] = season.purchases.transferFee;
		season['purchases/bonus'] = season.purchases.bonus;
		season['purchases/agentFee'] = season.purchases.agentFee;
		season['purchases/bonusAgent'] = season.purchases.bonusAgent;
		season['operatingCashFlow'] = clubSeason
			? clubSeason.operatingCashFlow
			: clubSeasons.reduce((a, { operatingCashFlow }) => a + operatingCashFlow, 0);
		delete season.purchases;
		delete season.date;
	});
	const results = Papa.unparse(copy);
	const blob = new Blob([results], { type: 'text/plain' });
	saveAs(blob, `cash-flow.csv`);
};

const exportPDF = (tableData, translate: TranslateService, decimal, currency, clubSeasons, combination) => {
	const chartData = CashFlowStoreSelectors.wrapChartData(tableData);
	const chartOptions = CashFlowStoreSelectors.wrapChartOptions(tableData);
	const headers = {
		header: `${translate.instant('profile.overview.value')}/${translate.instant('profile.season')}`,
		transferFee: translate.instant('admin.contracts.transferFee'),
		bonus: translate.instant('bonus.bonus'),
		agentFee: translate.instant('profile.contracts.agentFee'),
		bonusAgent: translate.instant('finance.cashFlow.bonusAgent'),
		tradingBalance: translate.instant('tradingBalance'),
		operatingCashFlow: translate.instant('club.season.operatingCashFlow'),
		sales: translate.instant('transfers.sales'),
		purchases: translate.instant('transfers.purchase')
	};
	const copy = cloneDeep(tableData);
	copy.forEach(season => {
		const clubSeason = clubSeasons.find(({ start }) => moment(season.date).year() === moment(start).year());
		season.sales.bonuses = `${decimal.transform(season.sales.bonuses || 0, '1.0-0', translate.currentLang)}${currency}`;
		season.sales.agentFee = `${decimal.transform(
			season.sales.agentFee || 0,
			'1.0-0',
			translate.currentLang
		)}${currency}`;
		season.sales.agentBonuses = `${decimal.transform(
			season.sales.agentBonuses || 0,
			'1.0-0',
			translate.currentLang
		)}${currency}`;
		season.sales.transferFee = `${decimal.transform(
			season.sales.transferFee || 0,
			'1.0-0',
			translate.currentLang
		)}${currency}`;
		season.purchases.bonuses = `${decimal.transform(
			season.purchases.bonuses || 0,
			'1.0-0',
			translate.currentLang
		)}${currency}`;
		season.purchases.agentFee = `${decimal.transform(
			season.purchases.agentFee || 0,
			'1.0-0',
			translate.currentLang
		)}${currency}`;
		season.purchases.agentBonuses = `${decimal.transform(
			season.purchases.agentBonuses || 0,
			'1.0-0',
			translate.currentLang
		)}${currency}`;
		season.purchases.transferFee = `${decimal.transform(
			season.purchases.transferFee || 0,
			'1.0-0',
			translate.currentLang
		)}${currency}`;
		season.tradingBalance = `${decimal.transform(
			season.tradingBalance || 0,
			'1.0-0',
			translate.currentLang
		)}${currency}`;
		season.operatingCashFlow = `${decimal.transform(
			(clubSeason
				? clubSeason.operatingCashFlow
				: clubSeasons.reduce((a, { operatingCashFlow }) => a + operatingCashFlow, 0)) || 0,
			'1.0-0',
			translate.currentLang
		)}${currency}`;
	});
	const data = {
		headers,
		combination,
		tableData: copy,
		chartData,
		chartOptions
	};

	return data;
};

@Injectable()
export class CashFlowStoreEffects {
	loadCashFlowStores$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(CashFlowStoreActions.loadCashFlowStores),
			concatMap(() =>
				/** An EMPTY observable only emits completion. Replace with your own observable API request */
				EMPTY.pipe(
					map(data => CashFlowStoreActions.loadCashFlowStoresSuccess({ data })),
					catchError(error => of(CashFlowStoreActions.loadCashFlowStoresFailure({ error })))
				)
			)
		);
	});

	getCashFlowData$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(CashFlowStoreActions.getCashFlowData),
			withLatestFrom(this.store$.select(CashFlowStoreSelectors.selectDataFromParameters)),
			map(([combination, { data }]) => {
				return combination
					? !data
						? CashFlowStoreActions.performCashFlowFromServer(combination)
						: CashFlowStoreActions.onCashFlowDataAlreadyPresent({ data })
					: CashFlowStoreActions.performCashFlowDataFailure({
							error: this.translate.instant('finance.cashFlow.error.noParameters')
					  });
			})
		);
	});

	getCashFlowDataFromServer$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(CashFlowStoreActions.performCashFlowFromServer),
			withLatestFrom(
				this.store$.select(CashFlowStoreSelectors.selectCombination),
				this.store$.select(CashFlowStoreSelectors.selectAllClubSeasons)
			),
			switchMap(([, { national, international, achieved }, clubSeasons]) =>
				forkJoin([
					this.teamApi.getCashFlow(this.auth.getCurrentUserData().currentTeamId, national, international, achieved),
					clubSeasons.length > 0
						? of<ClubSeason[]>(clubSeasons)
						: this.currentTeamService.getClubSeasons(this.auth.getCurrentUserData().clubId)
				]).pipe(
					map(([data, seasons]: [CashFlowData, ClubSeason[]]) => this.handleClubSeasonsToShow(data, seasons)),
					catchError(error => of(CashFlowStoreActions.performCashFlowDataFailure({ error })))
				)
			)
		);
	});

	getCashFlowDataAlreadyPresent$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(CashFlowStoreActions.onCashFlowDataAlreadyPresent),
			withLatestFrom(this.store$.select(CashFlowStoreSelectors.selectAllClubSeasons)),
			switchMap(([{ data }, clubSeasons]) =>
				forkJoin([
					of<CashFlowData>(data),
					clubSeasons.length > 0
						? of<ClubSeason[]>(clubSeasons)
						: this.currentTeamService.getClubSeasons(this.auth.getCurrentUserData().clubId)
				]).pipe(
					map(([cashFlowData, seasons]: [CashFlowData, ClubSeason[]]) =>
						this.handleClubSeasonsToShow(cashFlowData, seasons)
					),
					catchError(error => of(CashFlowStoreActions.performCashFlowDataFailure({ error })))
				)
			)
		);
	});

	raiseErrorAlert$: Observable<void> = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(CashFlowStoreActions.performCashFlowDataFailure),
				withLatestFrom(this.store$.select(CashFlowStoreSelectors.selectError)),
				map(([{ error }]) => this.alert.notify('error', 'Cash Flow', error))
			);
		},
		{ dispatch: false }
	);

	downloadCSV$: Observable<void> = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(CashFlowStoreActions.downloadCSV),
				withLatestFrom(
					this.store$.select(CashFlowStoreSelectors.selectCashFlowData),
					this.store$.select(CashFlowStoreSelectors.selectClubSeasons)
				),
				map(([, { tableData }, clubSeasons]) => exportCSV(tableData, clubSeasons))
			);
		},
		{ dispatch: false }
	);

	downloadPDF$: Observable<void> = createEffect(
		() => {
			return this.actions$.pipe(
				ofType(CashFlowStoreActions.downloadPDF),
				withLatestFrom(
					this.store$.select(CashFlowStoreSelectors.selectCashFlowData),
					this.store$.select(CashFlowStoreSelectors.selectClubSeasons),
					this.store$.select(CashFlowStoreSelectors.selectCombination)
				),
				map(([, { tableData }, clubSeasons, combination]) => {
					const currency = this.currentTeamService.getCurrency();
					const data: unknown = exportPDF(tableData, this.translate, this.decimal, currency, clubSeasons, combination);
					return this.reportService.getReport('finance_cash_flow', data);
				})
			);
		},
		{ dispatch: false }
	);

	save$: Observable<Action> = createEffect(() => {
		return this.actions$.pipe(
			ofType(CashFlowStoreActions.save),
			withLatestFrom(
				this.store$.select(CashFlowStoreSelectors.selectAllClubSeasons),
				this.store$.select(CashFlowStoreSelectors.selectTempSeasons)
			),
			switchMap(([, clubSeasons, tempSeasons]) => {
				const diffObs = [];
				const indexes = [];
				clubSeasons.forEach((season: ClubSeason, index: number) => {
					const diff = difference(season, tempSeasons[index]);
					if (!isEmptyObj(diff)) {
						indexes.push(index);
						diffObs.push(
							this.clubSeasonApi.patchAttributes(season.id, { operatingCashFlow: season.operatingCashFlow })
						);
					}
				});

				return forkJoin(diffObs).pipe(
					defaultIfEmpty([]),
					withLatestFrom(this.store$.select(CashFlowStoreSelectors.selectClubSeasons)),
					map(([selectedClubSeasons, originalClubSeasons]) => {
						const copy = cloneDeep(originalClubSeasons);
						indexes.forEach((i, index) => {
							copy[i] = selectedClubSeasons[index];
						});
						return CashFlowStoreActions.performSaveSuccess({ clubSeasons: copy });
					}),
					catchError(error => of(CashFlowStoreActions.performCashFlowDataFailure({ error })))
				);
			})
		);
	});

	handleClubSeasonsToShow(data: CashFlowData, seasons: ClubSeason[]): Action {
		const toConsider = data.tableData.filter(x => x.season !== 'TOTAL').map(x => moment(x.date).year());
		const filteredClubSeasons = seasons.filter(season => toConsider.includes(moment(season.start).year()));
		const toAdd = sortByName(filteredClubSeasons.length > 0 ? filteredClubSeasons : seasons, 'name');
		return CashFlowStoreActions.performCashFlowDataSuccess({
			data,
			clubSeasonsToShow: toAdd,
			clubSeasons: seasons
		});
	}

	constructor(
		private actions$: Actions,
		private store$: Store<RootStoreState>,
		private alert: AlertService,
		private translate: TranslateService,
		private teamApi: TeamApi,
		private auth: LoopBackAuth,
		private reportService: ReportService,
		private decimal: DecimalPipe,
		private currentTeamService: CurrentTeamService,
		private clubSeasonApi: ClubSeasonApi
	) {}
}
