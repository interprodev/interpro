import { inject } from '@angular/core';
import { Router, UrlSegment } from '@angular/router';
import { CurrentTeamService } from '../services/current-team.service';

export const nationalClubGuard = (segment: UrlSegment): boolean => {
	const router = inject(Router);
	const currentTeamService = inject(CurrentTeamService);
	const url: string = segment.path;

	const club = currentTeamService.getCurrentTeam()?.club;
	const block = club && club.nationalClub && url.includes('standings');
	if (block) router.navigate(['/settings']);
	return !block;
};
