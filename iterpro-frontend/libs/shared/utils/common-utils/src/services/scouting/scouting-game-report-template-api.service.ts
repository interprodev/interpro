import { Injectable, inject } from '@angular/core';
import { ClubApi, JsonSchema } from '@iterpro/shared/data-access/sdk';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ScoutingGameReportTemplateApiService {
	readonly #clubApi = inject(ClubApi);

	saveTemplate(template: JsonSchema, clubId: string): Observable<JsonSchema> {
		// @ts-ignore // ignore because it's a custom endpoint and it returns a JsonSchema not  a Club
		return this.#clubApi.upsertGameReportTemplate(clubId, template) as JsonSchema;
	}

	getAllClubTemplates(clubId: string): Observable<JsonSchema[]> {
		return this.#clubApi.getGameReportTemplates(clubId);
	}

	getTemplateSpecificVersion(clubId: string, templateKey: string, templateVersion: number): Observable<JsonSchema> {
		return this.#clubApi.getSingleGameReportTemplateVersion(clubId, templateKey, templateVersion);
	}
}
