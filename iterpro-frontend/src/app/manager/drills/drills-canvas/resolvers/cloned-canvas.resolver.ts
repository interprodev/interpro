import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { AuthSelectors, AuthState } from '@iterpro/shared/data-access/auth';
import { Store } from '@ngrx/store';
import { Observable, filter, switchMap, take } from 'rxjs';
import { DrillCanvas } from '../models/drills-canvas.types';
import { DrillsCanvasService } from '../services/drills-canvas.service';

export const clonedCanvasResolver: ResolveFn<Object> = (
	route: ActivatedRouteSnapshot,
	state
): Observable<DrillCanvas> | null => {
	const canvasID: string = route.queryParams['id'];
	const authStore = inject(Store<AuthState>);
	const drillsCanvasService = inject(DrillsCanvasService);

	return canvasID
		? authStore.select(AuthSelectors.selectCurrentTeamId).pipe(
				take(1),
				filter(id => !!id),
				switchMap(id => drillsCanvasService.getCanvas(id, canvasID))
			)
		: null;
};
