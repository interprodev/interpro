import { Component, EventEmitter, Input, Output, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Injury, InjuryAvailability } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { EventFormat } from '../../../../+state/event-viewer-store/ngrx/event-viewer-store.state';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { InjuryIconService } from '../../../../shared/injury-icon/injury-icon.service';
import { CheckboxChangeEvent } from 'primeng/checkbox';

@Component({
	selector: 'iterpro-planning-event-player',
	templateUrl: './event-player.component.html'
})
export class EventPlayerComponent implements OnInit {
	@Input({ required: true }) displayName: string;
	@Input({ required: true }) photoUrl: string;
	@Input() expandable: boolean;
	@Input() injuries: Injury[];
	@Input() injuryOccurred: boolean;
	@Input() healthStatusAvailability: InjuryAvailability;
	@Input({ required: true }) editable: boolean;
	@Input({ required: true }) selected: boolean;
	@Input() eventFormat: EventFormat;
	@Input() modified: boolean;
	@Input() selection: { selectable: boolean; cause: string } = { selectable: true, cause: null };
	@Input({ required: false }) showAlertOnUncheckPlayer: boolean;
	@Output() playerSelect: EventEmitter<void> = new EventEmitter<void>();
	@Output() playerModified: EventEmitter<boolean> = new EventEmitter<boolean>();
	expanded: boolean = false;
	healthStatus: string;
	// Services
	readonly #translateService = inject(TranslateService);
	readonly #injuryIconService = inject(InjuryIconService);
	readonly #confirmationService = inject(ConfirmationService);
	trainingOptions: SelectItem[] = [
		{ label: this.#translateService.instant('event.tooltip.full'), value: false },
		{ label: this.#translateService.instant('event.tooltip.modified'), value: true }
	];

	ngOnInit() {
		if (this.injuries) {
			this.healthStatus = this.#injuryIconService.getHealthStatusLabel(this.injuries, null);
		}
	}

	getPointColorClass(): string {
		if (this.healthStatusAvailability !== undefined && this.healthStatusAvailability !== InjuryAvailability.Ok)
			return 'tw-bg-red-500';
		return this.selected ? 'tw-bg-success-500' : 'tw-bg-gray-500';
	}

	selectPlayer(event: CheckboxChangeEvent): void {
		if (!this.showAlertOnUncheckPlayer || event.checked) return this.playerSelect.emit();
		event.originalEvent.preventDefault();
		this.#confirmationService.confirm({
			message: this.#translateService.instant('confirm.removeParticipantWithGameReport'),
			header: 'IterPRO',
			accept: () => {
				this.playerSelect.emit();
			},
			reject: () => {
				this.selected = true;
			}
		});
	}
}
