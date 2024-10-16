import { animate, style, transition, trigger } from '@angular/animations';
import { NgIf } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';

@Component({
	selector: 'iterpro-handler-ng-content',
	standalone: true,
	template: ` <ng-content></ng-content> `
})
export class HandlerComponent {
	@Input() onClick: () => void = () => {}; 
	@HostListener('click', ['$event'])
	click(e: any) {
		if (e) e.stopPropagation();
		this.onClick();
	}
}

@Component({
	standalone: true,
	selector: 'iterpro-modal-preview',
	templateUrl: './modal-preview.component.html',
	styleUrls: ['./modal-preview.component.scss'],
	imports: [HandlerComponent, NgIf],
	animations: [
		trigger('fadeInOut', [
			transition(':enter', [style({ opacity: 0 }), animate(200, style({ opacity: 1 }))]),
			transition(':leave', [animate(200, style({ opacity: 0 }))])
		])
	]
})
export class ModalPreviewComponent {
	open = false;

	openModal = () => (this.open = true);
	closeModal = (e: any) => {
		if (e) e.stopPropagation();
		this.open = false;
	};
}
