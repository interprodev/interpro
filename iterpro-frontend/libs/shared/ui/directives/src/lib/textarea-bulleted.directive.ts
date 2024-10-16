import { Directive, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';

/**
 * This is custom directive, used when TextArea need to be populated with
 * bulleted data for each element of an array.
 */
@Directive({
	standalone: true,
	selector: '[iterproDotTextBox]' // This attribute need to be added to HTML to apply this custom directive to DOM.
})
export class BulletTextBoxDirective implements OnInit {
	@Input() points!: string[];
	@Output() pointsChange = new EventEmitter();

	// ElementRef : A service defined in angular that gives us access to a dom element
	readonly #elementRef = inject(ElementRef);

	/**
	 * Inside Textarea, When user press the enter button then bullet will be added to next line.
	 * The decorators function is used to subscribe to the event raise from the DOM element (i.e. hosting this directive)
	 */
	@HostListener('keydown.enter', ['$event']) onEnter(event: KeyboardEvent) {
		this.rawValue = this.rawValue += '\n• ';
		event.preventDefault();
	}

	@HostListener('focus', ['$event']) onFocus(event: KeyboardEvent) {
		if (this.rawValue === '' || !this.rawValue) this.rawValue = this.rawValue += '\n• ';
		event.preventDefault();
	}

	// Spliting the data to display it in TextArea on the basis of nextline and bullet charachter.
	@HostListener('change', ['$event']) change(event: any) {
		const splitted = this.rawValue.split('\n• ').filter(x => x && x !== '');
		this.pointsChange.emit(splitted);
	}

	// On page load...
	ngOnInit(): void {
		let temp = '';
		if (this.points && this.points.length > 0) {
			this.points.forEach(item => {
				if (item) {
					temp += '\r\n';
					temp += '• ' + item;
				}
			});
		}
		this.rawValue = temp;
	}

	// Getter and Setter
	get rawValue(): string {
		return this.#elementRef.nativeElement.value;
	}
	set rawValue(value: string) {
		this.#elementRef.nativeElement.value = value;
	}
}
