import { Pipe, PipeTransform } from '@angular/core';
import { WyscoutCompetitionSeasons, WyscoutSeason } from '@iterpro/shared/data-access/sdk';
import { SelectItem } from 'primeng/api';

@Pipe({
	name: 'competitionSeasons',
	standalone: true
})
export class CompetitionSeasonsPipe implements PipeTransform {
	transform(competitionId: number, seasonOptions: SelectItem<WyscoutSeason>[]): SelectItem<WyscoutSeason>[] {
		return (seasonOptions || []).filter((({ value }) => value.competitionId === competitionId));
	}
}
