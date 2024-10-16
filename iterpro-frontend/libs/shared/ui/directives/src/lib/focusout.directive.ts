import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
	standalone: true,
	selector: '[iterproFocusOut]'
})
export class FocusOutDirective {
	@Output() focusOut: EventEmitter<boolean> = new EventEmitter<boolean>(false);

	@HostListener('focusout', ['$event'])
	onFocusOut(): void {
		this.focusOut.emit(true);
	}
}
