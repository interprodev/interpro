import { Directive, ElementRef, EventEmitter, HostListener, Output, inject } from '@angular/core';

@Directive({
	standalone: true,
	selector: '[iterproClickOutside]'
})
export class ClickOutsideDirective {
	readonly #elementRef = inject(ElementRef);
	@Output() public iterproClickOutside = new EventEmitter();

	@HostListener('document:click', ['$event.target'])
	public onClick(targetElement: HTMLElement) {
		const clickedInside = this.#elementRef.nativeElement.contains(targetElement);
		if (!clickedInside) {
			this.iterproClickOutside.emit();
		}
	}
}
