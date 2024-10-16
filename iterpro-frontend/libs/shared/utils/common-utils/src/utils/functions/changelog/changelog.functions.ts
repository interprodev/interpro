import { diff } from 'deep-diff';
import { ChangelogDomain, getChangeLogLabel } from './assets/domain';

export const createChangeLog = (
	oldObject: any,
	newObject: any,
	keysToIgnore: string[] = [],
	translate: any,
	domain: ChangelogDomain
): string[] => {
	const differences = diff(oldObject, newObject);
	const changeLogs: string[] = [];
	if (differences) {
		differences
			.filter(({ path }) => !(keysToIgnore || []).includes(String(path)))
			.forEach((difference: any) => {
				const path: string = (difference.path || [])
					.filter((value: string) => !keysToIgnore.includes(value))
					.map((value: string) => {
						const label = getChangeLogLabel(value, domain);
						return label ? translate.instant(label) : value;
					})[0];
				if (path && !changeLogs.includes(path)) {
					changeLogs.push(path);
				}
			});
	}
	return changeLogs;
};
