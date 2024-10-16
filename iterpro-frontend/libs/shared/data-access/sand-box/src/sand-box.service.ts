import { EventEmitter, Injectable, inject } from '@angular/core';
import { ofType } from '@ngrx/effects';
import { ActionCreator, ActionsSubject, Store } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { Observable, Subject } from 'rxjs';
import { filter, skip, takeUntil } from 'rxjs/operators';

@Injectable({
	providedIn: 'any'
})
export class SandBoxService {
	// remember to call destroy() in component ngDestroy
	private destroy$ = new Subject<void>();
	warning = true;

	readonly #eventListener$ = inject(ActionsSubject);

	listenToInput<T>(input$: Observable<T>): Observable<T> {
		return input$.pipe(takeUntil(this.destroy$));
	}

	destroy() {
		this.destroy$.next();
	}

	mirrorStateChange<T>(
		selector: Observable<T>,
		store$: Store,
		action: ActionCreator<string, (props: T) => TypedAction<string>>
	) {
		this.listenToInput(selector).subscribe({
			next: payload => store$.dispatch(action(payload)),
			error: (error: Error) => this.handleError(error)
		});
	}

	emitStateChange<T>(selector: Observable<T | undefined>, emitter: EventEmitter<T>, all = false) {
		this.listenToInput<T>(selector as Observable<T>)
			.pipe(filter<T>(value => all || Boolean(value)))
			.subscribe({
				next: (payload: T) => emitter.emit(payload),
				error: (error: Error) => this.handleError(error)
			});
	}

	listenToAction(action: ActionCreator): Observable<any> {
		if (this.warning) console.warn(`${action.type} - SandBox: if possible use a selector instead of listenToAction()`);
		return this.#eventListener$.pipe(skip(1), takeUntil(this.destroy$), ofType(action));
	}

	handleError(error: Error): void {
		throw new Error('SandBox error: ' + error?.message);
	}
}
