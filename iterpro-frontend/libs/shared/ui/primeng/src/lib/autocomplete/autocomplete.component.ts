/* eslint-disable @angular-eslint/no-output-on-prefix */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @angular-eslint/no-host-metadata-property */
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
	AfterContentInit,
	AfterViewChecked,
	ChangeDetectorRef,
	Component,
	ContentChildren,
	DoCheck,
	ElementRef,
	EventEmitter,
	forwardRef,
	Input,
	IterableDiffers,
	OnDestroy,
	Output,
	QueryList,
	Renderer2,
	TemplateRef,
	ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';
import { DomHandler } from 'primeng/dom';
import { ObjectUtils } from 'primeng/utils';
import { ButtonModule } from 'primeng/button';

export const AUTOCOMPLETE_VALUE_ACCESSOR: any = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => AutoCompleteComponent),
	multi: true
};

@Component({
	standalone: true,
	imports: [CommonModule, ButtonModule],
	selector: 'iterpro-autocomplete',
	templateUrl: 'autocomplete.component.html',
	animations: [
		trigger('overlayAnimation', [
			state(
				'void',
				style({
					transform: 'translateY(5%)',
					opacity: 0
				})
			),
			state(
				'visible',
				style({
					transform: 'translateY(0)',
					opacity: 1
				})
			),
			transition('void => visible', animate('{{showTransitionParams}}')),
			transition('visible => void', animate('{{hideTransitionParams}}'))
		])
	],
	host: {
		class: 'p-element p-inputwrapper',
		'[class.p-inputwrapper-filled]': 'filled',
		'[class.p-inputwrapper-focus]': '(focus && !disabled) || overlayVisible'
	},
	providers: [AUTOCOMPLETE_VALUE_ACCESSOR]
})
export class AutoCompleteComponent
	implements AfterViewChecked, AfterContentInit, DoCheck, ControlValueAccessor, OnDestroy
{
	@Input() minLength = 1;
	@Input() delay = 300;
	@Input() style: any;
	@Input() styleClass!: string;
	@Input() inputStyle: any;
	@Input() inputId!: string;
	@Input() inputStyleClass!: string;
	@Input() placeholder!: string;
	@Input() readonly!: boolean;
	@Input() disabled!: boolean;
	@Input() maxlength!: number;
	@Input() required!: boolean;
	@Input() size!: number;
	@Input() appendTo: any;
	@Input() autoHighlight!: boolean;
	@Input() forceSelection!: boolean;
	@Input() type = 'text';
	@Input() autoZIndex = true;
	@Input() baseZIndex = 0;
	@Input() ariaLabel!: string;
	@Input() ariaLabelledBy!: string;

	@Output() completeMethod: EventEmitter<any> = new EventEmitter();
	@Output() onSelect: EventEmitter<any> = new EventEmitter();
	@Output() onUnselect: EventEmitter<any> = new EventEmitter();
	@Output() onFocus: EventEmitter<any> = new EventEmitter();
	@Output() onBlur: EventEmitter<any> = new EventEmitter();
	@Output() onDropdownClick: EventEmitter<any> = new EventEmitter();
	@Output() onClear: EventEmitter<any> = new EventEmitter();
	@Output() onKeyUp: EventEmitter<any> = new EventEmitter();
	@Output() addNewElement: EventEmitter<any> = new EventEmitter();

	@Input() field!: string;
	@Input() scrollHeight = '200px';
	@Input() dropdown!: boolean;
	@Input() dropdownMode = 'blank';
	@Input() multiple!: boolean;
	@Input() tabindex!: number;
	@Input() dataKey!: string;
	@Input() emptyMessage!: string;
	@Input() immutable = true;
	@Input() showTransitionOptions = '225ms ease-out';
	@Input() hideTransitionOptions = '195ms ease-in';
	@Input() autofocus!: boolean;

	@ViewChild('in', { static: false }) inputEL!: ElementRef;
	@ViewChild('multiIn', { static: false }) multiInputEL!: ElementRef;
	@ViewChild('multiContainer', { static: false }) multiContainerEL!: ElementRef;
	@ViewChild('ddBtn', { static: false }) dropdownButton!: ElementRef;

	@ContentChildren(PrimeTemplate) templates!: QueryList<any>;

	overlay!: HTMLDivElement | null;
	itemTemplate!: TemplateRef<any>;
	selectedItemTemplate!: TemplateRef<any>;
	value: any;
	_suggestions!: any[];
	timeout: any;
	overlayVisible = false;
	documentClickListener: any;
	suggestionsUpdated!: boolean;
	highlightOption: any;
	highlightOptionChanged!: boolean;
	focus = false;
	filled!: boolean;
	inputClick!: boolean;

	inputKeyDown!: boolean;
	noResults!: boolean;
	differ: any;

	inputFieldValue = '';
	loading = false;
	documentResizeListener: any;
	forceSelectionUpdateModelTimeout: any;
	inputVal!: string;

	onModelChange: any = () => {};
	onModelTouched: any = () => {};

	constructor(
		public el: ElementRef,
		public renderer: Renderer2,
		public cd: ChangeDetectorRef,
		public differs: IterableDiffers
	) {
		this.differ = differs.find([]).create();
	}

	@Input() get suggestions(): any[] {
		return this._suggestions;
	}

	set suggestions(val: any[]) {
		this._suggestions = val;
		if (this.immutable) {
			this.handleSuggestionsChange();
		}
	}

	ngDoCheck() {
		if (!this.immutable) {
			const changes = this.differ.diff(this.suggestions);

			if (changes) {
				this.handleSuggestionsChange();
			}
		}
	}

	ngAfterViewChecked() {
		//Use timeouts as since Angular 4.2, AfterViewChecked is broken and not called after panel is updated
		if (this.suggestionsUpdated && this.overlay && this.overlay.offsetParent) {
			setTimeout(() => this.alignOverlay(), 1);
			this.suggestionsUpdated = false;
		}

		if (this.highlightOptionChanged) {
			setTimeout(() => {
				const listItem = DomHandler.findSingle(this.overlay, 'li.p-state-highlight');
				if (listItem) {
					DomHandler.scrollInView(this.overlay, listItem);
				}
			}, 1);
			this.highlightOptionChanged = false;
		}
	}

	handleSuggestionsChange() {
		if (this._suggestions != null && this.loading) {
			this.highlightOption = null;
			if (this._suggestions.length) {
				this.noResults = false;
				this.show();
				this.suggestionsUpdated = true;

				if (this.autoHighlight) {
					this.highlightOption = this._suggestions[0];
				}
			} else {
				this.noResults = true;

				if (this.emptyMessage) {
					this.show();
					this.suggestionsUpdated = true;
				} else {
					this.hide();
				}
			}
			this.loading = false;
		}
	}

	ngAfterContentInit() {
		this.templates.forEach(item => {
			switch (item.getType()) {
				case 'item':
					this.itemTemplate = item.template;
					break;

				case 'selectedItem':
					this.selectedItemTemplate = item.template;
					break;

				default:
					this.itemTemplate = item.template;
					break;
			}
		});
	}

	writeValue(value: any): void {
		this.value = value;
		this.filled = this.value && this.value !== '';
		this.updateInputField();
	}

	registerOnChange(fn: () => void): void {
		this.onModelChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onModelTouched = fn;
	}

	setDisabledState(val: boolean): void {
		this.disabled = val;
	}

	onInput(event: Event) {
		if (!this.inputKeyDown) {
			return;
		}

		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		this.inputVal = (<HTMLInputElement>event.target).value;
		if (!this.multiple && !this.forceSelection) {
			this.onModelChange(this.inputVal);
		}

		if (this.inputVal.length === 0) {
			this.hide();
			this.onClear.emit(event);
			this.onModelChange(this.inputVal);
		}

		if (this.inputVal.length >= this.minLength) {
			this.timeout = setTimeout(() => {
				this.search(event, this.inputVal);
			}, this.delay);
		} else {
			this.suggestions = [];
			this.hide();
		}
		this.updateFilledState();
		this.inputKeyDown = false;
	}

	onInputClick(event: MouseEvent) {
		if (this.documentClickListener) {
			this.inputClick = true;
		}
	}

	search(event: any, query: string) {
		//allow empty string but not undefined or null
		if (query === undefined || query === null) {
			return;
		}

		this.loading = true;

		this.completeMethod.emit({
			originalEvent: event,
			query: query
		});
	}

	selectItem(option: any, focus = true) {
		if (this.forceSelectionUpdateModelTimeout) {
			clearTimeout(this.forceSelectionUpdateModelTimeout);
			this.forceSelectionUpdateModelTimeout = null;
		}

		if (this.multiple) {
			this.multiInputEL.nativeElement.value = '';
			this.value = this.value || [];
			if (!this.isSelected(option)) {
				this.value = [...this.value, option];
				this.onModelChange(this.value);
			}
		} else {
			this.inputEL.nativeElement.value = this.field ? ObjectUtils.resolveFieldData(option, this.field) || '' : option;
			this.value = option;
			this.onModelChange(this.value);
		}

		this.onSelect.emit(option);
		this.updateFilledState();

		if (focus) {
			this.focusInput();
		}
	}

	show() {
		if (this.multiInputEL || this.inputEL) {
			const hasFocus = this.multiple
				? document.activeElement === this.multiInputEL.nativeElement
				: document.activeElement === this.inputEL.nativeElement;
			if (!this.overlayVisible && hasFocus) {
				this.overlayVisible = true;
			}
		}
	}

	onOverlayAnimationStart(event: AnimationEvent) {
		switch (event.toState) {
			case 'visible':
				this.overlay = event.element;
				this.appendOverlay();
				if (this.autoZIndex && this.overlay) {
					this.overlay.style.zIndex = String(this.baseZIndex + ++DomHandler.zindex);
				}
				this.alignOverlay();
				this.bindDocumentClickListener();
				this.bindDocumentResizeListener();
				break;

			case 'void':
				this.onOverlayHide();
				break;
		}
	}

	onOverlayAnimationDone(event: AnimationEvent) {
		if (event.toState === 'void') {
			this._suggestions = [];
		}
	}

	appendOverlay() {
		if (this.appendTo) {
			if (this.appendTo === 'body' && this.overlay) document.body.appendChild(this.overlay);
			else DomHandler.appendChild(this.overlay, this.appendTo);

			if (this.overlay) this.overlay.style.minWidth = DomHandler.getWidth(this.el.nativeElement.children[0]) + 'px';
		}
	}

	resolveFieldData(value: any) {
		return this.field ? ObjectUtils.resolveFieldData(value, this.field) : value;
	}

	restoreOverlayAppend() {
		if (this.overlay && this.appendTo) {
			this.el.nativeElement.appendChild(this.overlay);
		}
	}

	alignOverlay() {
		if (this.appendTo)
			DomHandler.absolutePosition(
				this.overlay,
				this.multiple ? this.multiContainerEL.nativeElement : this.inputEL.nativeElement
			);
		else
			DomHandler.relativePosition(
				this.overlay,
				this.multiple ? this.multiContainerEL.nativeElement : this.inputEL.nativeElement
			);
	}

	hide() {
		this.overlayVisible = false;
	}

	handleDropdownClick(event: any) {
		this.focusInput();
		const queryValue = this.multiple ? this.multiInputEL.nativeElement.value : this.inputEL.nativeElement.value;

		if (this.dropdownMode === 'blank') this.search(event, '');
		else if (this.dropdownMode === 'current') this.search(event, queryValue);

		this.onDropdownClick.emit({
			originalEvent: event,
			query: queryValue
		});
	}

	focusInput() {
		if (this.multiple) this.multiInputEL.nativeElement.focus();
		else this.inputEL.nativeElement.focus();
	}

	removeItem(item: any) {
		const itemIndex = DomHandler.index(item);
		const removedValue = this.value[itemIndex];
		this.value = this.value.filter((val: any, i: number) => i !== itemIndex);
		this.onModelChange(this.value);
		this.updateFilledState();
		this.onUnselect.emit(removedValue);
	}

	onKeydown(event: any) {
		if (this.overlayVisible) {
			const highlightItemIndex = this.findOptionIndex(this.highlightOption);

			switch (event.which) {
				//down
				case 40:
					if (highlightItemIndex !== -1) {
						const nextItemIndex = highlightItemIndex + 1;
						if (nextItemIndex !== this.suggestions.length) {
							this.highlightOption = this.suggestions[nextItemIndex];
							this.highlightOptionChanged = true;
						}
					} else {
						this.highlightOption = this.suggestions[0];
					}

					event.preventDefault();
					break;

				//up
				case 38:
					if (highlightItemIndex > 0) {
						const prevItemIndex = highlightItemIndex - 1;
						this.highlightOption = this.suggestions[prevItemIndex];
						this.highlightOptionChanged = true;
					}

					event.preventDefault();
					break;

				//enter
				case 13:
					if (this.highlightOption) {
						this.selectItem(this.highlightOption);
						this.hide();
					}
					event.preventDefault();
					break;

				//escape
				case 27:
					this.hide();
					event.preventDefault();
					break;

				//tab
				case 9:
					if (this.highlightOption) {
						this.selectItem(this.highlightOption);
					}
					this.hide();
					break;
			}
		} else {
			if (event.which === 40 && this.suggestions) {
				this.search(event, event.target.value);
			}
		}

		if (this.multiple) {
			switch (event.which) {
				//backspace
				case 8:
					if (this.value && this.value.length && !this.multiInputEL.nativeElement.value) {
						this.value = [...this.value];
						const removedValue = this.value.pop();
						this.onModelChange(this.value);
						this.updateFilledState();
						this.onUnselect.emit(removedValue);
					}
					break;
			}
		}

		this.inputKeyDown = true;
	}

	onKeyup(event: any) {
		this.onKeyUp.emit(event);
	}

	onInputFocus(event: any) {
		this.focus = true;
		this.onFocus.emit(event);
	}

	onInputBlur(event: any) {
		this.focus = false;
		this.onModelTouched();
		this.onBlur.emit(event);
	}

	onInputChange(event: any) {
		if (this.forceSelection && this.suggestions) {
			let valid = false;
			const inputValue = event.target.value.trim();

			if (this.suggestions) {
				for (const suggestion of this.suggestions) {
					const itemValue = this.field ? ObjectUtils.resolveFieldData(suggestion, this.field) : suggestion;
					if (itemValue && inputValue === itemValue.trim()) {
						valid = true;
						this.forceSelectionUpdateModelTimeout = setTimeout(() => {
							this.selectItem(suggestion, false);
						}, 250);
						break;
					}
				}
			}

			if (!valid) {
				if (this.multiple) {
					this.multiInputEL.nativeElement.value = '';
				} else {
					this.value = null;
					this.inputEL.nativeElement.value = '';
				}

				this.onClear.emit(event);
				this.onModelChange(this.value);
			}
		}
	}

	onInputPaste(event: ClipboardEvent) {
		this.onKeydown(event);
	}

	isSelected(val: any): boolean {
		let selected = false;
		if (this.value && this.value.length) {
			for (let i = 0; i < this.value.length; i++) {
				if (ObjectUtils.equals(this.value[i], val, this.dataKey)) {
					selected = true;
					break;
				}
			}
		}
		return selected;
	}

	findOptionIndex(option: any): number {
		let index = -1;
		if (this.suggestions) {
			for (let i = 0; i < this.suggestions.length; i++) {
				if (ObjectUtils.equals(option, this.suggestions[i])) {
					index = i;
					break;
				}
			}
		}

		return index;
	}

	updateFilledState() {
		if (this.multiple)
			this.filled =
				(this.value && this.value.length) ||
				(this.multiInputEL && this.multiInputEL.nativeElement && this.multiInputEL.nativeElement.value !== '');
		else
			this.filled =
				(this.inputFieldValue && this.inputFieldValue !== '') ||
				(this.inputEL && this.inputEL.nativeElement && this.inputEL.nativeElement.value !== '');
	}

	updateInputField() {
		const formattedValue = this.value
			? this.field
				? ObjectUtils.resolveFieldData(this.value, this.field) || ''
				: this.value
			: '';
		this.inputFieldValue = formattedValue;

		if (this.inputEL && this.inputEL.nativeElement) {
			this.inputEL.nativeElement.value = formattedValue;
		}

		this.updateFilledState();
	}

	bindDocumentClickListener() {
		if (!this.documentClickListener) {
			this.documentClickListener = this.renderer.listen('document', 'click', event => {
				if (event.which === 3) {
					return;
				}

				if (!this.inputClick && !this.isDropdownClick(event)) {
					this.hide();
				}

				this.inputClick = false;
				this.cd.markForCheck();
			});
		}
	}

	isDropdownClick(event: any) {
		if (this.dropdown) {
			const target = event.target;
			return target === this.dropdownButton.nativeElement || target.parentNode === this.dropdownButton.nativeElement;
		} else {
			return false;
		}
	}

	unbindDocumentClickListener() {
		if (this.documentClickListener) {
			this.documentClickListener();
			this.documentClickListener = null;
		}
	}

	bindDocumentResizeListener() {
		this.documentResizeListener = this.onWindowResize.bind(this);
		window.addEventListener('resize', this.documentResizeListener);
	}

	unbindDocumentResizeListener() {
		if (this.documentResizeListener) {
			window.removeEventListener('resize', this.documentResizeListener);
			this.documentResizeListener = null;
		}
	}

	onWindowResize() {
		this.hide();
	}

	onOverlayHide() {
		this.unbindDocumentClickListener();
		this.unbindDocumentResizeListener();
		this.overlay = null;
	}

	ngOnDestroy() {
		this.restoreOverlayAppend();
		this.onOverlayHide();
	}

	addNewEl(value: any) {
		this.addNewElement.emit(value);
	}
}
