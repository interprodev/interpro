import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { environment } from '@iterpro/config';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

interface Apps {
	name: string;
	image: string;
	appStoreLink: string;
	playStoreLink: string;
	guideLink: string;
}

@Component({
	standalone: true,
	imports: [NgFor, TranslateModule, ButtonModule],
	selector: 'iterpro-download-apps',
	templateUrl: './download-apps.component.html'
})
export class DownloadAppsComponent {
	apps: Apps[] = [
		{
			name: 'Player',
			image: 'assets/img/mockups/iterpro-player.png',
			appStoreLink: 'https://apps.apple.com/it/app/iterpro-player/id1489146528',
			playStoreLink: 'https://play.google.com/store/apps/details?id=com.iterpro.playerApp',
			guideLink: environment.HUBSPOT_KB_URL + '/how-to-use-the-player-app'
		},
		{
			name: 'Coach',
			image: 'assets/img/mockups/iterpro-coaching.png',
			appStoreLink: 'https://apps.apple.com/it/app/iterpro-coach/id6443678813',
			playStoreLink: 'https://play.google.com/store/apps/details?id=com.iterpro.coach',
			guideLink: environment.HUBSPOT_KB_URL + '/how-to-use-the-coach-app'
		},
		{
			name: 'Director',
			image: 'assets/img/mockups/iterpro-director.png',
			appStoreLink: 'https://apps.apple.com/it/app/iterpro-director/id1500593378',
			playStoreLink: 'https://play.google.com/store/apps/datasafety?id=com.iterpro.director',
			guideLink: environment.HUBSPOT_KB_URL + '/how-to-use-the-director-app'
		}
	];

	openGuide(guideLink: string) {
		window.open(guideLink, '_blank');
	}
}
