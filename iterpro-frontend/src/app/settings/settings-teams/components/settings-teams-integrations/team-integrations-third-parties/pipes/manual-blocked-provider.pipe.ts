import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'manualBlockedProvider'
})
export class ManualBlockedProviderPipe implements PipeTransform {
	transform(provider: string): string {
		switch (provider) {
			case 'Wyscout':
				return 'blockedWyscout';
			case 'StatSports':
				return 'blockedStatSport';
			case 'Gpexe':
				return 'blockedGpexe';
			case 'Catapult':
				return 'blockedCatapult';
			case 'Sonra':
				return 'blockedSonra';
			case 'Wimu':
				return 'blockedWimu';
		}
	}
}
