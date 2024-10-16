import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChatFeatureInboxComponent } from '@iterpro/chat-feature-inbox';
import { Contact, CustomersService } from '@iterpro/chat/data-access';
import { Observable } from 'rxjs';

@Component({
	selector: 'iterpro-chat-shell',
	standalone: true,
	imports: [CommonModule, ChatFeatureInboxComponent],
	template: `
		<div class="main pflex-my-6">
			<div class="pflex-w-full">
				<iterpro-chat-feature-inbox [staff]="customers$ | async" [players]="customersPlayers$ | async" />
			</div>
		</div>
	`,
	styles: [],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatShellComponent {
	customers$: Observable<Contact[]>;
	customersPlayers$: Observable<Contact[]>;

	constructor(private readonly customersService: CustomersService) {
		this.customers$ = this.customersService.getCustomers();
		this.customersPlayers$ = this.customersService.getCustomersPlayers();
	}
}
