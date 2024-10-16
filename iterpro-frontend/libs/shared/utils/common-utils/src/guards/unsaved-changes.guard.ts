import { CanDeactivateFn, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type CanDeactivateType = Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;
export interface CanComponentDeactivate {
	canDeactivate: () => CanDeactivateType;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (
	component: CanComponentDeactivate
): CanDeactivateType => {
	return component.canDeactivate ? component.canDeactivate() : true;
};


export const unsavedChangesGuardNew: CanDeactivateFn<CanComponentDeactivate> = (
	component: CanComponentDeactivate
): CanDeactivateType => {
	const shouldNavigate = component.canDeactivate ? component.canDeactivate() : true;
	if (!shouldNavigate) {
		const confirmationService = inject(ConfirmationService);
		const translateService = inject(TranslateService);
		return new Promise<boolean>((resolve) => {
			confirmationService.confirm({
				message: translateService.instant('confirm.editGuard'),
				header: translateService.instant('confirm.title'),
				icon: 'fa fa-question-circle',
				accept: () => {
					resolve(true); // Resolve with true to allow navigation
				},
				reject: () => {
					resolve(false); // Resolve with false to prevent navigation
				}
			});
		});
	}
	return true; // Allow navigation if there are no unsaved changes
};
