import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Contact, ContactGroup } from '@iterpro/chat/data-access';
import { PictureComponent } from '@iterpro/shared/ui/components';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
	standalone: true,
	imports: [CommonModule, FormsModule, TranslateModule, PrimeNgModule, PictureComponent],
	selector: 'iterpro-add-partecipant',
	templateUrl: './add-partecipant.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddPartecipantComponent implements OnInit {
	selectedPartecipants: Contact[] = [];
	contactsGroups: ContactGroup[] = [];
	banPartecipants = false;

	constructor(
		private readonly dialogConfig: DynamicDialogConfig,
		private readonly dialogReference: DynamicDialogRef,
		private readonly translateService: TranslateService
	) {}

	ngOnInit(): void {
		this.banPartecipants = this.dialogConfig.data.banPartecipants;
		const partecipantIds: (string | number)[] = this.dialogConfig.data.partecipantIds;
		const players: Contact[] = (this.dialogConfig.data.players as Contact[]).filter(({ id }) =>
			this.banPartecipants ? partecipantIds.includes(id) : !partecipantIds.includes(id)
		);
		const staff: Contact[] = (this.dialogConfig.data.staff as Contact[]).filter(({ id }) =>
			this.banPartecipants ? partecipantIds.includes(id) : !partecipantIds.includes(id)
		);

		if (players && staff) {
			this.contactsGroups.push(
				{
					groupName: this.translateService.instant('players'),
					contacts: players
				},
				{
					groupName: this.translateService.instant('admin.staff'),
					contacts: staff
				}
			);
		}
	}

	confirmAddPartecipants(): void {
		this.dialogReference.close(this.selectedPartecipants);
	}
}
