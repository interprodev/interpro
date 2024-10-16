import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SideMenu } from './side-menu.type';
import { TooltipModule } from 'primeng/tooltip';

@Component({
	selector: 'iterpro-side-menu',
	standalone: true,
	imports: [NgClass, RouterLink, RouterLinkActive, TranslateModule, TooltipModule],
	templateUrl: './side-menu.component.html',
	styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {
	items = input.required<SideMenu[]>();
}
