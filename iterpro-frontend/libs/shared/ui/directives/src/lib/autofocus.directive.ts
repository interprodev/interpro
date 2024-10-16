import { Directive, ElementRef, Input } from '@angular/core';
import { timer } from 'rxjs';
import { first } from 'rxjs/operators';

@Directive({
	standalone: true,
	selector: '[iterproAutofocus]'
})
export class IterproAutofocusDirective {
	private _activate = false;
	@Input() focusDelay = 0;
	@Input() blurDelay = 0;
	@Input() selectAllText = false;

	@Input()
	set iterproAutofocus(activate: boolean) {
		this._activate = activate;
		const wait = activate ? this.focusDelay : this.blurDelay;
		timer(wait)
			.pipe(first())
			.subscribe(() => {
				if (this._activate) {
					this.addFocus();
				} else {
					this.removeFocus();
				}
			});
	}

	constructor(private element: ElementRef) {
		if (!element.nativeElement['focus']) {
			throw new Error('Element does not accept focus.');
		}
	}

	private addFocus(): void {
		const input: HTMLInputElement = this.getNativeElement();
		input.focus();
		if (this.selectAllText) {
			input.select();
		}
	}

	private removeFocus(): void {
		const input: HTMLInputElement = this.getNativeElement();
		input.blur();
	}

	private getNativeElement(): HTMLInputElement {
		return this.element.nativeElement as HTMLInputElement;
	}
}
