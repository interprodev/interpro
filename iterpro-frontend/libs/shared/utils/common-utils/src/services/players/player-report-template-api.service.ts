import { Injectable, inject } from '@angular/core';
import { JsonSchema, TeamApi } from '@iterpro/shared/data-access/sdk';
import { Observable, of } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class PlayerReportTemplateApiService {
	readonly #teamApi = inject(TeamApi);

	saveTemplate(type: 'game' | 'training', template: JsonSchema, clubId: string): Observable<JsonSchema> {
		switch (type) {
			case 'game':
				// @ts-ignore
				return this.#teamApi.upsertGameReportTemplate(clubId, template);
			case 'training':
				// @ts-ignore
				return this.#teamApi.upsertTrainingReportTemplate(clubId, template);
			default:
				throw new Error('Invalid template type');
		}
	}

	getAllTeamTemplates(type: 'game' | 'training', teamId: string): Observable<JsonSchema[]> {
		switch (type) {
			case 'game':
				// @ts-ignore
				return this.#teamApi.getGameReportTemplates(teamId);
			case 'training':
				// @ts-ignore
				return this.#teamApi.getTrainingReportTemplates(teamId);
			default:
				throw new Error('Invalid template type');
		}
	}

	getTemplateSpecificVersion(
		type: 'game' | 'training',
		teamId: string,
		templateKey: string,
		templateVersion: number
	): Observable<JsonSchema> {
		switch (type) {
			case 'game':
				return this.#teamApi.getSingleGameReportTemplateVersion(teamId, templateKey, templateVersion);
			case 'training':
				return this.#teamApi.getSingleTrainingReportTemplateVersion(teamId, templateKey, templateVersion);
			default:
				throw new Error('Invalid template type');
		}
	}
}
