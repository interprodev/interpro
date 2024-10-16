import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { SideTabsComponent } from './side-tabs.component';

@Component({
	standalone: true,
	imports: [CommonModule],
	selector: 'iterpro-side-tab',
	template: `
		<div [hidden]="!active">
			<ng-content></ng-content>
		</div>
	`
})
export class SideTabComponent implements OnChanges {
	@Input() tabKey!: string;
	@Input({ required: true }) tabTitle!: string;
	@Input() tabDisabled?: boolean;
	@Input() tabFixed?: boolean;
	@Input() tabActionTemplate!: TemplateRef<any> | null;
	@Input() active = false;

	private sideTabsComponent: SideTabsComponent;

	constructor(tabs: SideTabsComponent) {
		this.sideTabsComponent = tabs;
		tabs.addTab(this);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['tabDisabled'] && changes['tabDisabled'].currentValue) {
			this.active = false;
			const nextAvailable = this.sideTabsComponent.tabs.find(t => !t.tabDisabled);
			this.sideTabsComponent.select(nextAvailable);
		}
	}
}
