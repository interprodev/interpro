import { Injectable, inject } from '@angular/core';
import { EntityChangelog, EntityChangelogApi } from '@iterpro/shared/data-access/sdk';
import { Observable } from 'rxjs';

type SupportedEntityTypes = 'Customer' | 'Team';
@Injectable({
	providedIn: 'root'
})
export class ChangelogService {
	readonly #changelogApi = inject(EntityChangelogApi);

	/**
	 * Retrieves the changelog for specific entities based on the provided entity IDs.
	 * @param entityIds An array of strings representing the IDs of entities for which the changelog is requested. Currently only Customer and Team entities are supported.
	 * @returns An Observable of type EntityChangelog[], providing the changelog data for the specified entities.
	 */
	public getEntitiesChangelog(entityIds: string[]): Observable<EntityChangelog[]> {
		return this.#changelogApi.find({
			where: {
				entityId: { inq: entityIds }
			},
			order: 'date DESC'
		});
	}

	/**
	 * Retrieves the changelog for entities based on the provided admin author ID and entity types.
	 * @param adminAuthorId A string representing the ID of the admin user requesting the changelog.
	 * @param entityTypes An array of SupportedEntityTypes representing the types of entities for which the changelog is requested. Currently only Customer and Team entities are supported.
	 * @returns An Observable of type EntityChangelog[], providing the changelog data for the specified admin and entity types.
	 */
	public getAdminEntitiesChangelog(
		adminAuthorId: string,
		entityTypes: SupportedEntityTypes[]
	): Observable<EntityChangelog[]> {
		return this.#changelogApi.find({
			where: {
				or: [{ authorId: adminAuthorId }, { entityId: adminAuthorId }],
				entityType: { inq: entityTypes }
			},
			order: 'date DESC'
		});
	}
}
