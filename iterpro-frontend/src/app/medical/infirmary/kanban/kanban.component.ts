import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import {
	Injury,
	InjuryApi,
	LoopBackAuth,
	MedicalTreatment,
	NotificationApi,
} from '@iterpro/shared/data-access/sdk';
import {
	ErrorService,
	INJURY_STATUSES,
	InjuryStatus,
	InjuryStatusColor,
	InjuryStatusLabel
} from '@iterpro/shared/utils/common-utils';
import moment from 'moment';
import { mergeMap } from 'rxjs';

type InjuryKanbanStatus = {
	color: InjuryStatusColor;
	injuries: Injury[];
};

@Component({
	selector: 'iterpro-kanban',
	templateUrl: './kanban.component.html',
	styles: [
		`
			.col-box {
				background-color: rgba(100, 100, 100, 0.24);
				transition: all 0.3s linear;
				cursor: grab;
			}
		`
	]
})
export class KanbanComponent implements OnChanges {
	@Input() injuries: Injury[];
	@Input() medicalTreatments: MedicalTreatment[];
	@Output() selectInjury: EventEmitter<string> = new EventEmitter<string>(); // Injury ID

	injuryStatusesMap = new Map<InjuryStatusLabel, InjuryKanbanStatus>();
	addInjuryTrigger = false;
	draggingInj: Injury | null = null;

	constructor(
		private readonly auth: LoopBackAuth,
		private readonly error: ErrorService,
		private readonly injApi: InjuryApi,
		private readonly notApi: NotificationApi
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.injuries) this.refreshStatusesMap();
	}

	refreshStatusesMap(): void {
		this.injuryStatusesMap.clear();
		INJURY_STATUSES.filter(status => status.visible).map((status: InjuryStatus) => {
			const filteredInjuries: Injury[] = this.injuries.filter(({ currentStatus }) => currentStatus === status.label);
			this.injuryStatusesMap.set(status.label, { color: status.color, injuries: filteredInjuries });
		});
	}

	onInjuryClick(injury: Injury): void {
		this.selectInjury.emit(injury.id);
	}

	// Preserve map original order
	// https://stackoverflow.com/questions/52793944/angular-keyvalue-pipe-sort-properties-iterate-in-order
	originalOrder = (): number => 0;

	dragStart(injury: Injury): void {
		this.draggingInj = injury;
	}

	dragEnd(): void {
		this.draggingInj = null;
	}

	drop(e: Event): void {
		const prevStatus = this.draggingInj.currentStatus as InjuryStatusLabel;
		const newStatus = (e.target as HTMLUListElement).getAttribute('data-status') as InjuryStatusLabel;

		// If dropped in new inj status column
		if (this.draggingInj && newStatus && prevStatus !== newStatus) {
			// Update UI injuries Map
			this.updateStatusKanban(prevStatus, newStatus);

			// Update dragging inj object changing the author and status history
			this.draggingInj.statusHistory = [
				...this.draggingInj.statusHistory,
				{
					phase: this.draggingInj.currentStatus,
					date: moment().toDate(),
					author: this.auth.getCurrentUserData().lastName + ' ' + this.auth.getCurrentUserData().firstName
				}
			];

			// Create new Inj instance
			const injUpdate = Object.assign({}, this.draggingInj);
			delete injUpdate.player;

			// Update Inj status
			this.updateInjStatus(injUpdate);
		}
	}

	private updateStatusKanban(prevStatus: InjuryStatusLabel, newStatus: InjuryStatusLabel): void {
		if (prevStatus && newStatus) {
			this.draggingInj.currentStatus = newStatus;

			this.injuryStatusesMap.set(prevStatus, {
				color: this.injuryStatusesMap.get(prevStatus).color,
				injuries: this.injuryStatusesMap.get(prevStatus).injuries.filter(({ id }) => id !== this.draggingInj.id)
			});

			this.injuryStatusesMap.set(newStatus, {
				color: this.injuryStatusesMap.get(newStatus).color,
				injuries: [...this.injuryStatusesMap.get(newStatus).injuries, this.draggingInj]
			});
		}
	}

	private updateInjStatus(injury: Injury): void {
		this.injApi
			.updateAttributes(injury.id, injury)
			.pipe(
				mergeMap((inj: Injury) =>
					this.notApi.checkForInjuryStatusChanges(inj.id, this.auth.getCurrentUserData().currentTeamId)
				)
			)
			.subscribe({
				error: (error: Error) => this.error.handleError(error)
			});
	}
}
