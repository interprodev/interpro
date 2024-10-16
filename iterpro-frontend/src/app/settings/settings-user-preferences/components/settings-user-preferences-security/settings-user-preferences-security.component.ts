import { Component, inject } from '@angular/core';
import { AuthActions } from '@iterpro/shared/data-access/auth';
import { SDKToken } from '@iterpro/shared/data-access/sdk';
import { ActionButtonsComponent } from '@iterpro/shared/ui/components';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { RootStoreState } from '../../../../+state/root-store.state';
import { SettingsHeaderComponent } from '../../../components/settings-header/settings-header.component';
import { PasswordEditComponent } from './components/password-edit/password-edit.component';

@Component({
	standalone: true,
	imports: [ActionButtonsComponent, TranslateModule, PasswordEditComponent, SettingsHeaderComponent],
	selector: 'iterpro-user-preferences-security',
	templateUrl: './settings-user-preferences-security.component.html'
})
export class SettingsUserPreferencesSecurityComponent {
	// Services
	readonly #store$ = inject(Store<RootStoreState>);

	changePasswordSaved(token: SDKToken) {
		this.#store$.dispatch(AuthActions.performLoginSetToken({ token, changePassword: true }));
	}
}
