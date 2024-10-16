import { ATC_LIST, Team } from '@iterpro/shared/data-access/sdk';
import { isArray } from 'lodash';

export const getMedicationName = (drug: string[] | string, currentTeam: Team): string => {
	const selectedDrug: string = isArray(drug) ? drug[0] : (drug as string);
	const atc = ATC_LIST.find(({ name }) => name === selectedDrug);
	if (atc) {
		const mapping = currentTeam.club.atcCommercialNamesMapping.find((mapping: any) => mapping.code === atc.code);
		if (mapping) return mapping.commercialName;
	}
	return selectedDrug;
};
