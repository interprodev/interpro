import { contractFieldToLabel } from './contracts';

export type ChangelogDomain = 'contract';
export function getChangeLogLabel(value: string, domain: ChangelogDomain): string {
	switch (domain) {
		case 'contract':
			return contractFieldToLabel(value);
		default:
			console.warn('Unknown domain: ' + domain);
			return '';
	}
}
