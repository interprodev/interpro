/* eslint-disable @typescript-eslint/no-empty-function */
import { animate, state, style, transition, trigger } from '@angular/animations';
import { NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import {
	AfterContentInit,
	AfterViewChecked,
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ContentChildren,
	ElementRef,
	EventEmitter,
	Input,
	NgZone,
	OnDestroy,
	OnInit,
	Output,
	QueryList,
	Renderer2,
	TemplateRef,
	ViewChild,
	forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ObjectUtilsService } from '@iterpro/shared/utils/common-utils';
import { PrimeTemplate, SelectItem } from 'primeng/api';
import { DomHandler } from 'primeng/dom';

export const DROPDOWN_VALUE_ACCESSOR: any = {
	provide: NG_VALUE_ACCESSOR,
	useExisting: forwardRef(() => PlusDropdownComponent),
	multi: true
};

@Component({
	standalone: true,
	imports: [NgIf, NgClass, NgFor, NgStyle],
	selector: 'iterpro-plus-dropdown',
	templateUrl: './plus-dropdown.component.html',
	styleUrls: ['./plus-dropdown.component.css'],
	animations: [
		trigger('panelState', [
			state(
				'hidden',
				style({
					opacity: 0
				})
			),
			state(
				'visible',
				style({
					opacity: 1
				})
			),
			transition('visible => hidden', animate('400ms ease-in')),
			transition('hidden => visible', animate('400ms ease-out'))
		])
	],
	// eslint-disable-next-line @angular-eslint/no-host-metadata-property
	host: {
		'[class.ui-inputwrapper-filled]': 'filled',
		'[class.ui-inputwrapper-focus]': 'focus'
	},
	providers: [DomHandler, ObjectUtilsService, DROPDOWN_VALUE_ACCESSOR]
})
export class PlusDropdownComponent
	implements OnInit, AfterViewInit, AfterContentInit, AfterViewChecked, OnDestroy, ControlValueAccessor
{
	@Input() scrollHeight = '200px';
	@Input() filter = true;
	@Input() name!: string;
	@Input() style: any;
	@Input() panelStyle: any;
	@Input() styleClass!: string;
	@Input() panelStyleClass!: string;
	@Input() disabled!: boolean;
	@Input() readonly!: boolean;
	@Input() autoWidth = true;
	@Input() required!: boolean;
	@Input() editable!: boolean;
	@Input() appendTo: any;
	@Input() tabindex!: number;
	@Input() pTooltip!: string;
	@Input() placeholder!: string;
	@Input() filterPlaceholder!: string;
	@Input() inputId!: string;
	@Input() dataKey!: string;
	@Input() filterBy = 'label';
	@Input() lazy = true;
	@Input() autofocus!: boolean;
	@Input() resetFilterOnHide = false;
	@Input() dropdownIcon = 'fa fa-fw fa-caret-down';
	@Input() optionLabel!: string;
	@Input() emptyFilterMessage = 'No results found';

	@Output() plusChange: EventEmitter<any> = new EventEmitter();
	@Output() plusFocus: EventEmitter<any> = new EventEmitter();
	@Output() plusBlur: EventEmitter<any> = new EventEmitter();

	@ViewChild('container', { static: true }) containerViewChild!: ElementRef;
	@ViewChild('panel', { static: true }) panelViewChild!: ElementRef;
	@ViewChild('itemswrapper', { static: true }) itemsWrapperViewChild!: ElementRef;
	@ViewChild('filter', { static: false }) filterViewChild!: ElementRef;
	@ViewChild('in', { static: false }) focusViewChild!: ElementRef;
	@ViewChild('editableInput', { static: false }) editableInputViewChild!: ElementRef;
	@ContentChildren(PrimeTemplate) templates!: QueryList<any>;

	public itemTemplate!: TemplateRef<any>;
	public selectedItemTemplate!: TemplateRef<any>;

	selectedOption: any;
	_options!: any[];
	value: any;
	optionsToDisplay!: any[];
	hover!: boolean;
	focus!: boolean;
	filled!: boolean;

	public panelVisible = false;
	public shown!: boolean;
	public documentClickListener: any;
	public optionsChanged!: boolean;
	public panel!: HTMLDivElement;
	public container!: HTMLDivElement;
	public itemsWrapper!: HTMLDivElement;
	public initialized!: boolean;
	public selfClick!: boolean;
	public itemClick!: boolean;
	public hoveredItem: any;
	public selectedOptionUpdated!: boolean;
	public filterValue!: string | null;

	onModelChange: (value?: any) => any = () => {};
	onModelTouched: (value?: any) => any = () => {};

	constructor(
		public el: ElementRef,
		public domHandler: DomHandler,
		public renderer: Renderer2,
		private cd: ChangeDetectorRef,
		public objectUtils: ObjectUtilsService,
		public zone: NgZone
	) {}

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

	ngOnInit() {
		this.optionsToDisplay = this.options;
		this.updateSelectedOption(null);
	}

	@Input() get options(): any[] {
		return this._options;
	}

	set options(val: any[]) {
		const opts = this.optionLabel ? this.objectUtils.generateSelectItems(val, this.optionLabel) : val;
		this._options = opts;
		this.optionsToDisplay = this._options;
		this.updateSelectedOption(this.value);
		this.optionsChanged = true;

		if (this.filterValue && this.filterValue.length) {
			this.activateFilter();
		}
	}

	ngAfterViewInit() {
		this.container = this.containerViewChild.nativeElement as HTMLDivElement;
		this.panel = this.panelViewChild.nativeElement as HTMLDivElement;
		this.itemsWrapper = this.itemsWrapperViewChild.nativeElement as HTMLDivElement;

		if (this.editable) {
			this.updateEditableLabel();
		}

		// this.updateDimensions();
		this.initialized = true;

		if (this.appendTo) {
			if (this.appendTo === 'body') document.body.appendChild(this.panel);
			else DomHandler.appendChild(this.panel, this.appendTo);
		}
	}

	get label(): string {
		return this.selectedOption ? this.selectedOption.label : null;
	}

	updateEditableLabel(): void {
		if (this.editableInputViewChild && this.editableInputViewChild.nativeElement) {
			this.editableInputViewChild.nativeElement.value = this.selectedOption
				? this.selectedOption.label
				: this.value || '';
		}
	}

	onItemClick(event: any, option: any) {
		this.itemClick = true;
		this.selectItem(event, option);
		this.focusViewChild.nativeElement.focus();
		this.filled = true;
		this.hide();
	}

	selectItem(event: any, option: any) {
		if (this.selectedOption !== option) {
			this.selectedOption = option;
			this.value = option.value;

			this.onModelChange(this.value);
			this.updateEditableLabel();
			this.plusChange.emit({
				originalEvent: event,
				value: this.value
			});
		}
	}

	ngAfterViewChecked() {
		if (this.shown) {
			this.onShow();
			this.shown = false;
		}

		if (this.optionsChanged && this.panelVisible) {
			this.optionsChanged = false;

			this.zone.runOutsideAngular(() => {
				setTimeout(() => {
					// this.updateDimensions();
					this.alignPanel();
				}, 1);
			});
		}

		if (this.selectedOptionUpdated && this.itemsWrapper) {
			const selectedItem = DomHandler.findSingle(this.panel, 'li.ui-state-highlight');
			if (selectedItem) {
				DomHandler.scrollInView(this.itemsWrapper, DomHandler.findSingle(this.panel, 'li.ui-state-highlight'));
			}
			this.selectedOptionUpdated = false;
		}
	}

	writeValue(value: any): void {
		if (this.filter) {
			this.resetFilter();
		}

		this.value = value;
		this.updateSelectedOption(value);
		this.updateEditableLabel();
		this.updateFilledState();
		this.cd.markForCheck();
	}

	resetFilter(): void {
		if (this.filterViewChild && this.filterViewChild.nativeElement) {
			this.filterViewChild.nativeElement.value = '';
		}

		this.optionsToDisplay = this.options;
	}

	updateSelectedOption(val: any): void {
		this.selectedOption = this.findOption(val, this.optionsToDisplay);
		if (
			!this.placeholder &&
			!this.selectedOption &&
			this.optionsToDisplay &&
			this.optionsToDisplay.length &&
			!this.editable
		) {
			this.selectedOption = this.optionsToDisplay[0];
		}
		this.selectedOptionUpdated = true;
	}

	registerOnChange(fn: () => any): void {
		this.onModelChange = fn;
	}

	registerOnTouched(fn: () => any): void {
		this.onModelTouched = fn;
	}

	setDisabledState(val: boolean): void {
		this.disabled = val;
	}

	onMouseclick(event: any) {
		if (this.disabled || this.readonly) {
			return;
		}

		this.selfClick = true;

		if (!this.itemClick) {
			// this.focusViewChild.nativeElement.focus();

			if (this.panelVisible) this.hide();
			else {
				this.show();

				if (this.filterViewChild !== undefined) {
					setTimeout(() => {
						this.filterViewChild.nativeElement.focus();
					}, 200);
				}
			}
		}
	}

	onEditableInputClick(event: any) {
		this.itemClick = true;
		this.bindDocumentClickListener();
	}

	onEditableInputFocus(event: any) {
		this.focus = true;
		this.hide();
	}

	onEditableInputChange(event: any) {
		this.value = event.target.value;
		this.updateSelectedOption(this.value);
		this.onModelChange(this.value);
		this.plusChange.emit({
			originalEvent: event,
			value: this.value
		});
	}

	onShow() {
		this.bindDocumentClickListener();

		if (this.options && this.options.length) {
			this.alignPanel();

			const selectedListItem = DomHandler.findSingle(this.itemsWrapper, '.ui-dropdown-item.ui-state-highlight');
			if (selectedListItem) {
				DomHandler.scrollInView(this.itemsWrapper, selectedListItem);
			}
		}
	}

	show() {
		if (this.appendTo) {
			this.panel.style.minWidth = DomHandler.getWidth(this.container) + 'px';
		}

		this.panel.style.zIndex = String(++DomHandler.zindex);
		this.panelVisible = true;
		this.shown = true;
	}

	hide() {
		this.panelVisible = false;

		if (this.filter && this.resetFilterOnHide) {
			this.resetFilter();
		}
	}

	alignPanel() {
		if (this.appendTo) DomHandler.absolutePosition(this.panel, this.container);
		else DomHandler.relativePosition(this.panel, this.container);
	}

	onInputFocus(event: any) {
		this.focus = true;
		this.plusFocus.emit(event);
	}

	onInputBlur(event: any) {
		this.focus = false;
		this.onModelTouched();
		this.plusBlur.emit(event);
	}

	onKeydown(event: any) {
		if (this.readonly) {
			return;
		}

		const selectedItemIndex = this.selectedOption
			? this.findOptionIndex(this.selectedOption.value, this.optionsToDisplay)
			: -1;

		switch (event.which) {
			// down
			case 40:
				if (!this.panelVisible && event.altKey) {
					this.show();
				} else {
					if (selectedItemIndex !== -1) {
						const nextItemIndex = selectedItemIndex + 1;
						if (nextItemIndex !== this.optionsToDisplay.length) {
							this.selectItem(event, this.optionsToDisplay[nextItemIndex]);
							this.selectedOptionUpdated = true;
						}
					} else if (this.optionsToDisplay) {
						this.selectItem(event, this.optionsToDisplay[0]);
					}
				}

				event.preventDefault();

				break;

			// up
			case 38:
				if (selectedItemIndex > 0) {
					const prevItemIndex = selectedItemIndex - 1;
					this.selectItem(event, this.optionsToDisplay[prevItemIndex]);
					this.selectedOptionUpdated = true;
				}

				event.preventDefault();
				break;

			// space
			case 32:
				if (!this.panelVisible) {
					this.show();
					event.preventDefault();
				}
				break;

			// enter
			case 13:
				this.hide();

				event.preventDefault();
				break;

			// escape and tab
			case 27:
			case 9:
				this.hide();
				break;
		}
	}

	findOptionIndex(val: any, opts: SelectItem[]): number {
		let index = -1;
		if (opts) {
			for (let i = 0; i < opts.length; i++) {
				if ((val == null && opts[i].value == null) || this.objectUtils.equals(val, opts[i].value, 'displayName')) {
					index = i;
					break;
				}
			}
		}

		return index;
	}

	findOption(val: any, opts: SelectItem[]): SelectItem<any> | null {
		const index: number = this.findOptionIndex(val, opts);
		return index !== -1 ? opts[index] : null;
	}

	onFilter(event: any): void {
		const inputValue = event.target.value.toLowerCase();
		if (inputValue && inputValue.length) {
			this.filterValue = inputValue;
			this.activateFilter();
		} else {
			this.filterValue = null;
			this.optionsToDisplay = this.options;
		}

		this.optionsChanged = true;
	}

	activateFilter() {
		const searchFields: string[] = this.filterBy.split(',');
		if (this.options && this.options.length) {
			this.optionsToDisplay = this.objectUtils.filter(this.options, searchFields, this.filterValue || '');
			this.optionsChanged = true;
		}
	}

	applyFocus(): void {
		if (this.editable) DomHandler.findSingle(this.el.nativeElement, '.p-dropdown-label.p-inputtext').focus();
		else DomHandler.findSingle(this.el.nativeElement, 'input[readonly]').focus();
	}

	bindDocumentClickListener() {
		if (!this.documentClickListener) {
			this.documentClickListener = this.renderer.listen('document', 'click', () => {
				if (!this.selfClick && !this.itemClick) {
					this.panelVisible = false;
					this.unbindDocumentClickListener();
				}

				this.selfClick = false;
				this.itemClick = false;
				this.cd.markForCheck();
			});
		}
	}

	unbindDocumentClickListener() {
		if (this.documentClickListener) {
			this.documentClickListener();
			this.documentClickListener = null;
		}
	}

	updateFilledState() {
		this.filled = this.value != null;
	}

	ngOnDestroy() {
		this.initialized = false;

		this.unbindDocumentClickListener();

		if (this.appendTo) {
			this.el.nativeElement.appendChild(this.panel);
		}
	}
}
