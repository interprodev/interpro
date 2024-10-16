import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { TieredMenu } from 'primeng/tieredmenu';

@Component({
	selector: 'iterpro-tiered-menu',
	templateUrl: './tiered-menu.component.html'
})
export class TieredMenuComponent {
	@Input() iconOnly!: boolean;
	@Input() isLoading!: boolean;
	@Input() label!: string;
	@Input() disabled!: boolean;
	@Input() icon = 'fas fa-bars';
	@Input() styleClass!: string;
	@Input() isText: boolean = false;
	@Input({required: true}) menuItems!: MenuItem[];
	@Output() menuClicked: EventEmitter<void> = new EventEmitter<void>();

	buttonClicked(menu: TieredMenu, event: any) {
		this.menuClicked.emit();
		menu.toggle(event);
	}
}
