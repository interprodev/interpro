import { Pipe, PipeTransform } from '@angular/core';
import { Team } from '@iterpro/shared/data-access/sdk';

@Pipe({
	standalone: true,
	name: 'teamName'
})
export class TeamNamePipe implements PipeTransform {
	transform(teamId: string, teams: Pick<Team, 'id' | 'name'>[]): string {
		const team: Pick<Team, 'id' | 'name'> | undefined = (teams || []).find(({ id }) => id === teamId);
		return team ? team.name : teamId;
	}
}
