import { NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '@iterpro/config';

@Component({
	standalone: true,
	selector: 'iterpro-guide-link',
	template: `
		<a class="submenu-item" [href]="url" _target="blank" title="Guide">
			<i class="fas fa-book"></i>
			<span>User Guide</span>
		</a>
	`
})
export class GuideLinkComponent implements OnInit {
	basic = false;

	url: string = environment.HUBSPOT_KB_URL;

	readonly #router = inject(Router);

	ngOnInit(): void {
		this.#router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				const [_, first, second, ...rest] = event.url.split('/').map(segment => segment.split(';')[0]);

				// this.basic = !event.url.includes('/home') && !event.url.includes('/administration');
				this.url = `${environment.HUBSPOT_KB_URL}/${second}#${rest.join('/')}`;
			}
		});
	}
}
