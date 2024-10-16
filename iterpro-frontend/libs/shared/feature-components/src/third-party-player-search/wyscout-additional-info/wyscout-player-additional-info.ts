import { NgClass } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import Tooltip from 'tooltip.js';
import { PlayerToHtmlService } from '../services/player-to-html.service';

@Component({
	standalone: true,
	imports: [NgClass],
	selector: 'iterpro-wyscout-player-additional-info',
	templateUrl: './wyscout-player-additional-info.html',
	styleUrls: ['./../wyscout-player-search/wyscout-player-search.component.css']
})
export class WyscoutPlayerAdditionalInfoComponent implements OnInit, OnDestroy, OnChanges {
	@Input({ required: true }) player: any;
	@Input() hasAdditionalInfo!: boolean;
	@Output() emptyAdditionalInfo: EventEmitter<any> = new EventEmitter();

	element: ElementRef;
	htmlService: PlayerToHtmlService;
	tooltip: any;
	hasRequestedAdditionalInfo = false;

	constructor(hostElement: ElementRef, htmlService: PlayerToHtmlService) {
		this.element = hostElement;
		this.htmlService = htmlService;
	}

	ngOnDestroy() {
		this.tooltip.dispose();
	}

	ngOnInit() {
		const content = this.htmlService.toHtml(this.player, this.isLoading());
		this.tooltip = new Tooltip(this.element.nativeElement, {
			placement: 'right',
			html: true,
			title: content
		});
	}

	ngOnChanges() {
		this.updateTooltip();
	}

	updateTooltip() {
		if (this.tooltip) {
			const content = this.htmlService.toHtml(this.player, this.isLoading());
			this.tooltip.updateTitleContent(content);
		}
	}

	isLoading() {
		return !this.hasAdditionalInfo;
	}

	checkAdditionalInfo() {
		if (!this.hasRequestedAdditionalInfo && !this.player.hasAdditionalInfo) {
			this.hasRequestedAdditionalInfo = true;
			this.emptyAdditionalInfo.emit([this.player.wyId]);
			this.updateTooltip();
		}
	}
}
