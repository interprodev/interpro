import { NgStyle } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Staff } from '@iterpro/shared/data-access/sdk';
import {
	ActionButtonsComponent,
	IconButtonComponent,
	PictureComponent,
	PlayerFlagComponent
} from '@iterpro/shared/ui/components';
import { AgePipe } from '@iterpro/shared/ui/pipes';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog/dynamicdialog-ref';
import { PeopleBulkChangeItem } from '../people-bulk-change/model/people-bulk-change.model';
import { PeopleBulkChangeComponent } from '../people-bulk-change/people-bulk-change.component';

@Component({
	selector: 'iterpro-team-season-staff',
	standalone: true,
	imports: [
		ActionButtonsComponent,
		PrimeNgModule,
		PictureComponent,
		PlayerFlagComponent,
		AgePipe,
		IconButtonComponent,
		TranslateModule,
		NgStyle
	],
	templateUrl: './team-season-staff.component.html'
})
export class TeamSeasonStaffComponent implements OnInit, OnChanges {
	@Input({ required: true }) clubStaff: Staff[];
	@Input({ required: true }) seasonName: string;
	@Input({ required: true }) seasonStaffIds: string[];
	@Input({ required: true }) editMode: boolean;
	@Output() staffChangeEmitter: EventEmitter<string[]> = new EventEmitter<string[]>();
	staff: Staff[];
	#dialogService: DialogService = inject(DialogService);
	#translate = inject(TranslateService);

	ngOnInit() {
		this.initStaff();
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes['seasonStaffIds']) {
			this.initStaff();
		}
	}

	private initStaff() {
		this.staff = (this.clubStaff || []).filter(({ id }) => (this.seasonStaffIds || []).includes(id));
	}

	openPeopleBulkChangeDialog() {
		const ref = this.createPeopleBulkChangeDialog();
		ref.onClose.subscribe((targetStaffIds: string[]) => {
			if (targetStaffIds) {
				this.staffChangeEmitter.emit(targetStaffIds);
			}
		});
	}

	private createPeopleBulkChangeDialog(): DynamicDialogRef {
		const baseLabel = `${this.#translate.instant('admin.staff')} - ${this.#translate.instant('profile.season')}: ${this.seasonName}`;
		const header = this.#translate.instant(baseLabel);
		return this.#dialogService.open(PeopleBulkChangeComponent, {
			data: {
				sourceItems: (this.clubStaff || [])
					.filter(({ id }) => !this.staff.map(({ id }) => id).includes(id))
					.map(this.staffToPeopleBulkChangeItem.bind(this)),
				targetItems: (this.staff || []).map(this.staffToPeopleBulkChangeItem.bind(this)),
				sourceHeader: this.#translate.instant('settings.clubStaff'),
				targetHeader: this.#translate.instant('settings.teamStaff'),
				editMode: true
			},
			width: '70%',
			height: '70%',
			header,
			closable: true,
			modal: true,
			contentStyle: { overflowY: 'unset' },
			styleClass: 'dialog-header-padding-2 dialog-content-padding-2 dialog-shark-theme'
		});
	}

	private staffToPeopleBulkChangeItem(staff: Staff): PeopleBulkChangeItem {
		return {
			id: staff.id,
			label: `${staff.firstName} ${staff.lastName}`,
			imageUrl: staff.downloadUrl
		};
	}
}
