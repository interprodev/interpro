import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventApi, EventSegment, MoreLinkArg } from '@fullcalendar/core';
import {
	CalendarEventMouseOver,
	Customer,
	Event,
	ExtendedPlayerScouting,
	Player
} from '@iterpro/shared/data-access/sdk';
import {
	BlockUiInterceptorService, CustomTreatmentService,
	ErrorService,
	EventToHtmlService,
	MedicalEventLabelsService
} from '@iterpro/shared/utils/common-utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';
import { finalize, first } from 'rxjs/operators';
import { PlanningService } from 'src/app/manager/planning/services/planning.service';
import Tooltip from 'tooltip.js';
import { CalendarDetailEventPipe } from './calendar-detail-event.pipe';
import { CustomerNamePipe } from '@iterpro/shared/ui/pipes';

@UntilDestroy()
@Component({
	standalone: true,
	imports: [CommonModule, CalendarDetailEventPipe],
	providers: [EventToHtmlService, CustomerNamePipe, MedicalEventLabelsService, PlanningService, CustomTreatmentService],
	selector: 'iterpro-calendar-detail-dialog',
	templateUrl: './calendar-detail-dialog.html'
})
export class CalendarDetailDialogComponent implements OnInit, OnDestroy {
	cellInfo: MoreLinkArg;
	players: Player[] | ExtendedPlayerScouting[] = [];
	customers: Customer[] = [];

	tooltip: Tooltip;
	additionalInfo: Map<string, any> = new Map<string, any>();

	constructor(
		private readonly error: ErrorService,
		private readonly eventService: EventToHtmlService,
		private readonly planningService: PlanningService,
		private readonly blockUiInterceptorService: BlockUiInterceptorService,
		private readonly dialogRef: DynamicDialogRef,
		private readonly dialogConfig: DynamicDialogConfig
	) {}

	ngOnInit(): void {
		this.cellInfo = this.dialogConfig.data.cellInfo;
		this.players = this.dialogConfig.data.players;
		this.customers = this.dialogConfig.data.customers;
	}

	selectEvent(event: EventApi) {
		this.tooltip?.dispose();
		this.dialogRef.close(event.extendedProps.sourceEvent);
	}

	showEventTooltip(event: any, { currentTarget: element }: MouseEvent) {
		if (this.players) {
			const mouseOverEvent: CalendarEventMouseOver = {
				event: event._def.extendedProps.sourceEvent,
				// @ts-ignore
				element: element
			};
			this.renderTooltipEvent(mouseOverEvent);
		}
		const format = event._def.extendedProps.sourceEvent?.format;
		if ((format && format === 'game') || format === 'medical') {
			const observable$ = !this.additionalInfo.has(event._def.extendedProps.sourceEvent)
				? this.planningService.getAdditionalInfo(event._def.extendedProps.sourceEvent)
				: of(this.additionalInfo.get(event._def.extendedProps.sourceEvent));

			this.blockUiInterceptorService
				.disableOnce(observable$)
				.pipe(
					first(),
					untilDestroyed(this),
					finalize(() => this.blockUiInterceptorService.enableInterceptor())
				)
				.subscribe({
					next: (eventAdditionalInfo: Event) => {
						this.additionalInfo.set(event._def.extendedProps.sourceEvent.id, eventAdditionalInfo);
						this.updateTooltip(event._def.extendedProps.sourceEvent, eventAdditionalInfo);
					},
					error: (error: Error) => this.error.handleError(error)
				});
		}
	}

	hideTooltip() {
		this.tooltip?.hide();
	}

	ngOnDestroy(): void {
		if (this.tooltip) this.tooltip.dispose();
	}

	segId(_: number, seg: EventSegment): string {
		return seg.event.id;
	}

	private renderTooltipEvent({ element, event }: CalendarEventMouseOver) {
		const content = this.eventService.toHtml(
			{ ...event, format: event?.format ? event.format : 'scoutingGame' },
			this.players,
			this.customers
		);

		this.tooltip?.dispose();
		this.tooltip = new Tooltip(element, {
			placement: 'top',
			html: true,
			title: content,
			container: 'body',
			popperOptions: {
				removeOnDestroy: true
			}
		});
	}

	private updateTooltip(event: Event, additionalInfo: Event) {
		if (this.tooltip) {
			const content = this.eventService.toHtml(
				{
					...event,
					...additionalInfo
				},
				this.players,
				this.customers
			);
			if (content) this.tooltip.updateTitleContent(content);
		}
	}
}
