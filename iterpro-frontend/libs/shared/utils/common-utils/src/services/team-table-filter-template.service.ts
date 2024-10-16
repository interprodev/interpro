import { Injectable } from '@angular/core';
import {
	CustomerTeamSettings, CustomerTeamSettingsApi,
	TeamTableFilterTemplate,
	TeamTableFilterTemplateApi
} from '@iterpro/shared/data-access/sdk';
import { uniq } from 'lodash';
import { Observable } from 'rxjs';

export type SupportedTableId =
	| 'admin_squads_table'
	| 'scouting_table'
	| 'scouting_game_reports_table'
	| 'medical_records_table'
	| 'injury_list_table';
@Injectable({
	providedIn: 'root'
})
export class TeamTableFilterTemplateService {
	constructor(private customerTeamSettingsApi: CustomerTeamSettingsApi, private teamTableFilterApi: TeamTableFilterTemplateApi) {}

	/**
	 * Filters the templates for a specific table.
	 * @param tableId
	 * @param templates the team templates.
	 */
	public getTeamTableFilterTemplates(
		tableId: SupportedTableId,
		templates: TeamTableFilterTemplate[]
	): TeamTableFilterTemplate[] {
		return (templates || []).filter(template => template.tableId === tableId);
	}

	/**
	 * Retrieves the filter templates for a specific team and table. A user can have a favorite template for a specific table.
	 * @param templates
	 * @param customerTeamSettings
	 */
	public getUserFavoriteTableFilterTemplates(
		templates: TeamTableFilterTemplate[],
		customerTeamSettings: CustomerTeamSettings
	): TeamTableFilterTemplate | undefined {
		return templates.find(template => customerTeamSettings.tableFilterTemplateIds.includes(template.id));
	}

	/**
	 * Sets a template as favorite for a specific customer for a specific team.
	 * @param templateId
	 * @param customerTeamSettings
	 * @param tableTemplateIds the ids of the templates for the specific table. Needed to remove the template from the list of favorites. Only one template can be favorite for a specific table.
	 */
	public setTemplateAsFavorite(
		templateId: string,
		customerTeamSettings: CustomerTeamSettings,
		tableTemplateIds: string[]
	): Observable<CustomerTeamSettings> {
		return this.customerTeamSettingsApi.patchAttributes(customerTeamSettings.id, {
			tableFilterTemplateIds: customerTeamSettings?.tableFilterTemplateIds
				? uniq([
						...customerTeamSettings.tableFilterTemplateIds.filter((id: string) => !tableTemplateIds.includes(id)),
						templateId
				  ])
				: [templateId]
		});
	}

	/**
	 * Removes a template as favorite for a specific customer for a specific team.
	 * @param customerTeamSettings
	 * @param tableTemplateIds the ids of the templates for the specific table. Needed to remove the template from the list of favorites. Only one template can be favorite for a specific table.
	 */
	public resetFavoriteTemplate(
		customerTeamSettings: CustomerTeamSettings,
		tableTemplateIds: string[]
	): Observable<CustomerTeamSettings> {
		return this.customerTeamSettingsApi.patchAttributes(customerTeamSettings.id,{
			tableFilterTemplateIds: customerTeamSettings?.tableFilterTemplateIds
				? customerTeamSettings.tableFilterTemplateIds.filter((id: string) => !tableTemplateIds.includes(id))
				: []
		});
	}

	public createTemplate(template: TeamTableFilterTemplate): Observable<TeamTableFilterTemplate> {
		return this.teamTableFilterApi.create(template);
	}
}
