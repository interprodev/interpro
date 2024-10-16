import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, Input, OnInit } from '@angular/core';
import { SportType, getCircles } from '@iterpro/shared/utils/common-utils';

@Component({
	standalone: true,
	imports: [CommonModule],
	selector: 'iterpro-tactic-board',
	templateUrl: './tactic-board.component.html',
	styleUrls: ['./tactic-board.component.scss']
})
export class TacticBoardComponent implements OnInit, AfterContentInit {
	@Input({required: true}) first!: string;
	@Input() second!: string;
	@Input() third!: string;
	@Input() selected!: string;
	@Input({required: true}) sportType: SportType = 'football';
	public positions: any;

	ngOnInit() {
		this.mapPositions();
	}

	ngAfterContentInit() {
		this.mapPositions();
	}

	private mapPositions() {
		this.positions = getCircles(this.selected, this.first, this.second, this.third, this.sportType);
	}
}
