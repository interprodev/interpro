import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RootStoreState } from '../../root-store.state';

@Injectable()
export class TopbarStoreEffects {
	constructor(private actions$: Actions, private store$: Store<RootStoreState>) {}
}
