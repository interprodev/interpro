import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Team } from '@iterpro/shared/data-access/sdk';

const WIDTH = 200 + 20;

@Component({
	selector: 'iterpro-match-list',
	templateUrl: './match-list.component.html',
	styleUrls: ['./match-list.component.css']
})
export class MatchListComponent implements OnChanges {
	@Input() selected: any;
	@Input() matches: any;
	@Input() data: any;
	@Input() currentTeam: Team; 
	@Input() isLoading: boolean;
	@Output() matchClicked: EventEmitter<any> = new EventEmitter<any>();
	@ViewChild('container', { static: false }) container: ElementRef;

	teams: any[] = [];
	current: any;
	setupDone: boolean = false;
	myTeamImg: string;
	splitLabel: string;
	

	ngOnChanges(changes: SimpleChanges) {
		if (changes['selected'] && this.selected && this.selected.match) {
			this.current = this.selected.match.wyId || this.selected.match.instId;
			if (!this.setupDone) this.setView();
		}
		if (changes['data'] && this.data) {
			this.teams = this.data.teams || [];
			this.myTeamImg = this.teams.find(t => t.teamId === this.currentTeam.wyscoutId).team.imageDataURL;
		}
	}
	
	setView() {
		this.setup();
		const index = this.matches.findIndex(
			({ wyId, instId }) => (wyId && this.current === wyId) || (instId && this.current === instId)
		);
		const scrollLeft = index * WIDTH;
		this.container.nativeElement.scrollLeft = scrollLeft;
		this.container.nativeElement.style.scrollBehavior = 'smooth';
	}

	onResize(event) {
		this.setup();
	}

	setup() {
		this.container.nativeElement.style.width = '100%';
		const visibles = Math.floor(this.container.nativeElement.offsetWidth / WIDTH);
		this.container.nativeElement.style.width = `${visibles * WIDTH}px`;
		this.setupDone = true;
	}

	isCurrent({ wyId, instId }): boolean {
		return (wyId && this.current === wyId) || (instId && this.current === instId);
	}
	

	onClick(match) {
		console.log('match clicked', match);
		this.matchClicked.emit(match);
	}

	moveLeft() {
		const visibles = Math.floor(this.container.nativeElement.offsetWidth / WIDTH);
		const scrollLeft = visibles * WIDTH;
		this.container.nativeElement.scrollLeft -= scrollLeft;
	}
	moveRight() {
		const visibles = Math.floor(this.container.nativeElement.offsetWidth / WIDTH);
		const scrollLeft = visibles * WIDTH;
		this.container.nativeElement.scrollLeft += scrollLeft;
	}

	getBorderColor(match) {
		if (match.played === 'Played') {
			if (match.winner === 1) return 'green';
			else if (match.winner === 0) return 'yellow';
			else return 'red';
		} else return 'grey';
	}
}
