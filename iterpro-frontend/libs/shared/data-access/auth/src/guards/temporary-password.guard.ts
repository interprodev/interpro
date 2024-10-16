import { inject } from '@angular/core';
import { Router, RouterStateSnapshot } from '@angular/router';
import { LoopBackAuth } from '@iterpro/shared/data-access/sdk';
import { AlertService } from '@iterpro/shared/utils/common-utils';

export const temporaryPasswordGuard = (routeState: RouterStateSnapshot): boolean => {
	const router = inject(Router);
	const auth = inject(LoopBackAuth);
	const alertService = inject(AlertService);
	const user = auth.getCurrentUserData();
	const block = !!user && !!user.isTempPassword;

	if (block) {
		alertService.notify('error', 'alert.authGuard.title', 'alert.tempPasswordChange.message', false);
		router.navigate(['/settings'], {
			queryParams: { returnUrl: routeState.url }
		});
	}

	return !block;
};
