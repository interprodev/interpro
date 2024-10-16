import { NgFor, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LaunchpadBlockComponent } from '../launchpad-block/launchpad-block.component';
import { IterproRoute } from '@iterpro/shared/data-access/permissions';

export interface UIBlock {
	link: IterproRoute;
	params?: object;
	title: string;
	subtitle: string;
	img: string;
	enabled?: boolean;
	beta?: boolean;
}

@Component({
	standalone: true,
	imports: [NgFor, LaunchpadBlockComponent, NgIf],
	selector: 'iterpro-launchpad',
	templateUrl: './launchpad.component.html'
})
export class LaunchpadComponent {
	@Input({ required: true }) blocks: UIBlock[] = [];
	@Input({ required: true }) hideDisabledModules!: boolean;
}
