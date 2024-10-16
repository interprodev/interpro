import { Pipe, PipeTransform, inject } from '@angular/core';
import { CompetitionInfo, ProviderType } from '@iterpro/shared/data-access/sdk';
import { CompetitionsConstantsService } from '@iterpro/shared/utils/common-utils';
import { SelectItem } from 'primeng/api';

@Pipe({
	standalone: true,
	name: 'competitionNamePipe'
})
export class CompetitionNamePipe implements PipeTransform {
	readonly #competitionsService = inject(CompetitionsConstantsService);

	transform(competitionInfo: CompetitionInfo, provider: ProviderType, competitions: SelectItem[]): string {
		const result: any =
			provider !== 'Dynamic'
				? this.#competitionsService.withProvider(provider).getCompetitionFromJson(competitionInfo.competition) ||
				  competitions?.find(({ value }) => value === competitionInfo.competition) ||
				  competitionInfo
				: competitionInfo;
		return result.name || result.label || '';
	}
}
