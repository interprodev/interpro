import { DOCUMENT, registerLocaleData } from '@angular/common';
import { AfterContentChecked, AfterContentInit, Component, ElementRef, Inject, OnInit, Renderer2 } from '@angular/core';
import { environment } from '@iterpro/config';
import { AuthActions, AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { LoopBackAuth } from '@iterpro/shared/data-access/sdk';
import { CloudUploadQueueService } from '@iterpro/shared/feature-components';
import {
	AzureStorageService,
	CURRENCIES_MAP,
	CompetitionsConstantsService,
	InstatCompetitionsConstantsService,
	LANGUAGES,
	OsicsService,
	ProviderIntegrationService,
	UserDateFormatSetting,
	WyscoutCompetitionsConstantsService,
	getAngularLocale,
	getDateFormatConfig,
	sports
} from '@iterpro/shared/utils/common-utils';
import { EtlTeamObserverService } from '@iterpro/shared/utils/etl';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import Hotjar from '@hotjar/browser';
import mixpanel from 'mixpanel-browser';
import moment from 'moment';
import * as numeral from 'numeral';
import { PrimeNGConfig } from 'primeng/api';
import { LocaleSettings } from 'primeng/calendar';
import { Observable } from 'rxjs';
import { distinctUntilKeyChanged, filter } from 'rxjs/operators';
import { RootStoreService } from './+state/root-store.service';
import { RootStoreState } from './+state/root-store.state';
import { SeasonStoreSelectors } from './+state/season-store';
import { TopbarStoreSelectors } from './+state/topbar-store';
import { IterproBlockTemplateComponent } from './shared/block-template/block-template.component';

@Component({
	selector: 'iterpro-root',
	template: `
		<!-- <block-ui [template]="blockTemplate" /> -->

		<p-confirmDialog [ngClass]="{ 'body .p-dialog .p-dialog-titlebar noShow': true }" [closable]="false" />

		<p-confirmDialog
			key="auth"
			[ngClass]="{ 'body .p-dialog .p-dialog-titlebar noShow': true }"
			[closable]="false"
			[closeOnEscape]="false"
			[rejectVisible]="false"
			[acceptLabel]="'Ok'"
			[acceptIcon]="''"
		/>

		<!-- App Version -->
		@if (appVersion) {
			<small
				class="tw-font-italic tw-fixed tw-bottom-0 tw-right-0 tw-z-50 tw-bg-primary-500 tw-p-2 tw-text-xs tw-text-white"
				>{{ appVersion }}</small
			>
		}

		<!-- Topbar -->
		@if (visible$ | async) {
			<iterpro-topbar />
		}

		<!-- Cloud Upload Sidebar -->
		@if (cloudUploadQueueService) {
			<iterpro-multiple-cloud-upload-sidebar />
		}

		<!-- Alert -->
		<iterpro-alert />

		<!-- Router Outlet -->
		<div class="total" *blockUI="'general'; template: blockTemplate">
			<router-outlet></router-outlet>
		</div>
	`
})
export class AppComponent implements OnInit, AfterContentChecked, AfterContentInit {
	blockTemplate = IterproBlockTemplateComponent;
	visible$: Observable<boolean>;
	appVersion: string | null = null;

	constructor(
		public cloudUploadQueueService: CloudUploadQueueService,
		@Inject(DOCUMENT) private readonly document: Document,
		private readonly rootStoreService: RootStoreService,
		private readonly store$: Store<RootStoreState>,
		private readonly providerIntegrationService: ProviderIntegrationService,
		private readonly currentTeamService: CurrentTeamService,
		private readonly authService: LoopBackAuth,
		private readonly competitionService: CompetitionsConstantsService,
		private readonly wyscoutCompetitionsService: WyscoutCompetitionsConstantsService,
		private readonly instatCompetitionsService: InstatCompetitionsConstantsService,
		private readonly azureStorageService: AzureStorageService,
		private readonly etlTeamService: EtlTeamObserverService,
		private readonly osicsService: OsicsService,
		private readonly elementRef: ElementRef,
		private readonly renderer: Renderer2,
		private readonly translateService: TranslateService,
		private readonly primeNGConfig: PrimeNGConfig
	) {
		this.initAzureStorage();
		this.downloadStaticFiles();
		this.setLanguage();
		this.registerLanguageLocales();
		this.registerCurrencyLocales();
		this.cleanDeprecatedUrl();
		this.initMixpanel();
		this.initHotjar();
		this.rootStoreService.init();
	}

	ngOnInit() {
		this.visible$ = this.store$.select(TopbarStoreSelectors.selectVisible);
		this.store$.select(AuthSelectors.selectSportType).subscribe({
			next: type => this.renderBackground(type)
		});

		const teamObservable$ = this.store$.select(AuthSelectors.selectTeam).pipe(
			filter(team => !!team),
			distinctUntilKeyChanged('id')
		);

		const seasonObservable = this.store$.select(SeasonStoreSelectors.selectCurrent).pipe(
			filter(season => !!season),
			distinctUntilKeyChanged('id')
		);

		this.competitionService.initTeamObserver(teamObservable$);
		this.etlTeamService.initTeam(teamObservable$);
		this.providerIntegrationService.initTeamObserver(teamObservable$);
		this.currentTeamService.initTeamObserver(teamObservable$);
		this.currentTeamService.initSeasonObserver(seasonObservable);

		this.currentTeamService.currentTeam$.subscribe({
			next: currentTeam => {
				this.store$.dispatch(AuthActions.performUpdateTeam({ currentTeam }));
			}
		});

		this.azureStorageService.token$.subscribe({
			next: sasTokenKey => {
				this.store$.dispatch(AuthActions.performUpdateSasToken({ sasTokenKey }));
			}
		});
	}

	ngAfterContentChecked(): void {
		this.setAppInfo();
	}

	private cleanDeprecatedUrl() {
		const url = window.location.href;
		if (url.includes('/#/')) {
			const newUrl = url.replace('/#/', '/');
			window.location.replace(newUrl);
		}
	}

	ngAfterContentInit(): void {
		((h, o, t, j, a, r) => {
			h.hj =
				h.hj ||
				// eslint-disable-next-line func-names
				function () {
					// eslint-disable-next-line prefer-rest-params
					(h.hj.q = h.hj.q || []).push(arguments);
				};
			h._hjSettings = { hjid: environment.HOTJAR_CONFIG.trackingCode, hjsv: environment.HOTJAR_CONFIG.version };
			// eslint-disable-next-line prefer-destructuring, no-param-reassign
			a = o.getElementsByTagName('head')[0];
			// eslint-disable-next-line no-param-reassign
			r = o.createElement('script');
			r.async = 1;
			r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
			a.appendChild(r);
		})(window as any, this.document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
	}

	private initMixpanel() {
		mixpanel.init(environment.MIXPANEL_TOKEN, {
			debug: true,
			track_pageview: true,
			persistence: 'localStorage'
		});
	}

	private initHotjar() {
		Hotjar.init(Number(environment.HOTJAR_CONFIG.trackingCode), Number(environment.HOTJAR_CONFIG.version));
	}

	private initAzureStorage() {
		this.azureStorageService.init();
	}

	private downloadStaticFiles() {
		this.wyscoutCompetitionsService.initAreasList();
		this.wyscoutCompetitionsService.initCompetitionList();
		this.instatCompetitionsService.initAreasList();
		this.instatCompetitionsService.initCompetitionList();
		this.osicsService.initOSICSList();
	}

	private setLanguage() {
		const browserLang = this.translateService.getBrowserCultureLang();
		const lang = LANGUAGES.indexOf(browserLang) > -1 ? browserLang : LANGUAGES[0];
		const userData = this.authService.getCurrentUserData();
		const userSettingLang =
			!!userData && LANGUAGES.indexOf(userData.currentLanguage) > -1 ? userData.currentLanguage : lang;
		this.translateService.use(userSettingLang);
		moment.locale(userSettingLang);
		this.setDateFormat();
		if (userSettingLang === 'ar-SA') this.renderer.addClass(document.documentElement, 'arabic');
	}

	private setDateFormat() {
		const userData = this.authService.getCurrentUserData();
		const userSettingDateFormat: UserDateFormatSetting =
			userData?.currentDateFormat || UserDateFormatSetting.EuropeanFormat;
		localStorage.setItem('currentDateFormat', JSON.stringify(userSettingDateFormat));
		this.translateService.get('primeng').subscribe((primengConfig: LocaleSettings) => {
			this.primeNGConfig.setTranslation({
				...(primengConfig || {}),
				...getDateFormatConfig(userSettingDateFormat).primengConfig
			});
		});
	}

	private registerLanguageLocales() {
		LANGUAGES.forEach(language => {
			const locale = getAngularLocale(language);
			registerLocaleData(locale, language);
		});
	}

	private registerCurrencyLocales() {
		Array.from(CURRENCIES_MAP.entries()).forEach(currency => {
			numeral.register('locale', currency[0], currency[1]);
		});
		numeral.locale('eur');
	}

	private renderBackground(type: string) {
		Object.keys(sports).forEach(sport =>
			this.renderer.removeClass(this.elementRef.nativeElement.ownerDocument.body, sport)
		);
		this.renderer.addClass(this.elementRef.nativeElement.ownerDocument.body, type);
	}

	private setAppInfo(): void {
		const rootComponent = this.document.querySelector('iterpro-root');
		if (rootComponent) {
			this.renderer.setAttribute(rootComponent, 'iterpro-version', environment.version);
			this.renderer.setAttribute(rootComponent, 'iterpro-env', environment.name);
			this.appVersion = `v${environment.version}`;
		}
	}
}
