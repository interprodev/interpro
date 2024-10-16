import { DOCUMENT } from '@angular/common';
import { Directive, Inject, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
	standalone: true,
	selector: '[iterproTeleportTo]'
})
export class TeleportToDirective implements OnInit, OnDestroy {
	@Input('iterproTeleportTo') selector!: string;
	private host: Element | null = null;

	constructor(
		private tpl: TemplateRef<any>,
		private vcr: ViewContainerRef,
		@Inject(DOCUMENT) private document: Document
	) {}

	ngOnInit() {
		const viewRef = this.vcr.createEmbeddedView(this.tpl);
		this.host = this.document.querySelector(this.selector);
		viewRef.rootNodes.forEach(node => this.host && this.host.appendChild(node));
	}

	ngOnDestroy() {
		if (this.host) this.host.innerHTML = '';
	}
}
