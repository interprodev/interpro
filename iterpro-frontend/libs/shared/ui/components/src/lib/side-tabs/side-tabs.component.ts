import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { SideTabComponent } from './side-tab.component';

@Component({
	standalone: true,
	imports: [CommonModule, SideTabComponent],
	selector: 'iterpro-side-tabs',
	templateUrl: './side-tabs.component.html',
	styleUrls: ['./side-tabs.component.scss']
})
export class SideTabsComponent {
	public tabs: SideTabComponent[] = [];

	@Output() changeEmitter: EventEmitter<any> = new EventEmitter<any>();

	addTab(tab: SideTabComponent) {
		if (this.tabs.length === 0) {
			tab.active = true;
			if (this.changeEmitter) this.changeEmitter.emit(tab);
		}
		this.tabs.push(tab);
	}

	select(tab) {
		this.tabs.forEach(t => {
			t.active = false;
		});
		tab.active = true;
		if (this.changeEmitter) this.changeEmitter.emit(tab);
	}
}
