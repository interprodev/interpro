import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthActions } from '@iterpro/shared/data-access/auth';
import { Customer } from '@iterpro/shared/data-access/sdk';
import { DownloadAppsComponent, PictureComponent } from '@iterpro/shared/ui/components';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { RootStoreState } from 'src/app/+state/root-store.state';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [RouterModule, RippleModule, StyleClassModule, TranslateModule, AsyncPipe, PictureComponent],
	selector: 'iterpro-user-menu',
	templateUrl: './user-menu.component.html',
	styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent {
	@Input({required: true}) customer: Customer;

	constructor(
		private readonly store$: Store<RootStoreState>,
		private dialogService: DialogService,
		private translateService: TranslateService
	) {}

	openDownloadApps() {
		this.createAppDialog();
	}

	private createAppDialog(): DynamicDialogRef {
		return this.dialogService.open(DownloadAppsComponent, {
			width: '50%',
			header: this.translateService.instant('iterproapp.downloadOurMobileApps'),
			closable: true,
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2'
		});
	}

	logout(): void {
		this.store$.dispatch(AuthActions.performLogout({}));
	}
}
