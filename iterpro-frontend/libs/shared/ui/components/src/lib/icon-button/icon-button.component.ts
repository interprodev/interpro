import { Component, Input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { NgClass } from '@angular/common';

@Component({
	standalone: true,
	imports: [TooltipModule, NgClass],
	selector: 'iterpro-icon-button',
	template: `
		<i
			[class]="icon + ' tw-text-white iterpro-clickable-icon'"
			[class.tw-text-sm]="small"
			[class.tw-opacity-[0.5]]="opaque || disabled"
			[class.tw-pointer-events-none]="disabled"
			[class.!tw-text-shark-300]="disabled"
			appendTo="body"
			[pTooltip]="tooltip"
			[tooltipPosition]="tooltipPosition"
		></i>
	`
})
export class IconButtonComponent {
	@Input({ required: true }) icon!: string;
	@Input({ required: true }) tooltip!: string;
	@Input() tooltipPosition: 'bottom' | 'top' | 'left' | 'right' = 'bottom';
	@Input() disabled!: boolean;
	@Input() small = false;
	@Input() opaque = false;
}
