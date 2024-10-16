import { DatePipe, DecimalPipe, LocationStrategy, PathLocationStrategy, PercentPipe } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AuthInterceptor, NgRxAuthBridgeService } from '@iterpro/shared/data-access/auth';
import { LoopBackAuth, SDKBrowserModule } from '@iterpro/shared/data-access/sdk';
import { CloudUploadQueueService, MultipleCloudUploadSidebarComponent } from '@iterpro/shared/feature-components';
import { AlertComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import {
	AzureStoragePipe,
	BlockUIInterceptor,
	DateInterceptor,
	ReportService
} from '@iterpro/shared/utils/common-utils';
import { TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { BlockUIModule } from 'ng-block-ui';
import { BlockUIHttpModule } from 'ng-block-ui/http';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { RootStoreModule } from './+state/root.store.module';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { InitializerModule } from './initializer.module';
import { IterproBlockTemplateComponent } from './shared/block-template/block-template.component';
import { TopbarComponent } from './shared/topbar/topbar.component';
import { TranslatorModule } from './translator.module';

const UTILS_COMPONENTS = [
	AlertComponent,
	MultipleCloudUploadSidebarComponent,
	TopbarComponent,
	IterproBlockTemplateComponent
];

const UTILS_SERVICES = [
	ConfirmationService,
	CloudUploadQueueService,
	AzureStoragePipe,
	DecimalPipe,
	PercentPipe,
	DatePipe,
	DialogService,
	ReportService
];

@NgModule({
	bootstrap: [AppComponent],
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		RouterModule.forRoot(appRoutes, { initialNavigation: 'enabledBlocking' }),
		BlockUIModule.forRoot({
			delayStart: 100,
			delayStop: 500
		}),
		BlockUIHttpModule,
		SDKBrowserModule.forRoot(),
		PrimeNgModule,
		RootStoreModule,
		TranslatorModule,
		InitializerModule,
		...UTILS_COMPONENTS
	],
	providers: [
		{ provide: LocationStrategy, useClass: PathLocationStrategy },
		{ provide: LoopBackAuth, useClass: NgRxAuthBridgeService, multi: false },
		{ provide: HTTP_INTERCEPTORS, useClass: DateInterceptor, multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
		{ provide: HTTP_INTERCEPTORS, useClass: BlockUIInterceptor, multi: true },
		{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
		...UTILS_SERVICES
	]
})
export class AppModule {}
