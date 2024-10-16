import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '@iterpro/config';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Event, NavigationEnd, Router } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { NgClass } from '@angular/common';

@UntilDestroy()
@Component({
	selector: 'iterpro-support-widget',
	standalone: true,
	imports: [
		TranslateModule,
		TooltipModule,
		RippleModule,
		NgClass
	],
	templateUrl: './support-widget.component.html'
})
export class SupportWidgetComponent implements OnInit {
	url: string = environment.HUBSPOT_KB_URL;
	router = inject(Router);
	ngOnInit() {
		this.handleRoutingEvents();
	}

	private handleRoutingEvents(): void {
		this.router.events.pipe(untilDestroyed(this)).subscribe((event: Event) => {
			if (event instanceof NavigationEnd) {
				const [_, first, ...rest] = event.url.split('/').map(segment => segment.split(';')[0]);

				this.url = `${environment.HUBSPOT_KB_URL}/${first}#${rest.join('/')}`;
			}
		});
	}
}
