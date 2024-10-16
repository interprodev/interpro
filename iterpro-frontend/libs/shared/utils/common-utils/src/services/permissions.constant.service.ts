import { Injectable } from '@angular/core';
import { uniq } from 'lodash';
import { IterproUserPermission } from '@iterpro/shared/data-access/permissions';

export interface GroupedPermissions {
	group: IterproUserPermission;
	items: IterproUserPermission[];
}
@Injectable({
	providedIn: 'root'
})
export class PermissionConstantService {
	private readonly permissions: IterproUserPermission[];
	private readonly positionConstants: string[] = [];
	private readonly groupedPermissions: GroupedPermissions[] = [];
	private readonly mobilePermissions: string[];
	private readonly onlyOneUserPermissions: string[] = ['legal-admin'];

	routes: string[] = [];
	proPermissions: string[] = [];
	basicPermissions: string[] = [];

	public getPositions(): string[] {
		return this.positionConstants;
	}

	public getPermissions(): string[] {
		return this.permissions;
	}

	public getMobilePermissions(): string[] {
		return this.mobilePermissions;
	}

	public getGroupedPermissions(): GroupedPermissions[] {
		return this.groupedPermissions;
	}

	public getOnlyOneUserPermission(): string[] {
		return this.onlyOneUserPermissions;
	}

	public getParentModules(permissions: IterproUserPermission[]): IterproUserPermission[] {
		this.groupedPermissions.forEach(grouped => {
			if ((grouped.group as string) !== 'other') {
				const hasSomeChild = grouped.items.some(child => permissions.includes(child));
				if (hasSomeChild) {
					permissions = [...permissions, grouped.group];
				} else {
					const index = permissions.findIndex(permission => permission === grouped.group);
					if (index > -1) {
						permissions.splice(index, 1);
					}
				}
			}
		});
		return uniq(permissions);
	}

	constructor() {
		this.positionConstants = [
			'positions.headCoach',
			'positions.assistantCoach',
			'positions.fitnessCoach',
			'positions.goalkeeperCoach',
			'positions.coach',
			'positions.athleticTrainer',
			'positions.footballAnalist',
			'positions.sportScientist',
			'positions.headOfPerformance',
			'positions.SCCoach',
			'positions.dataAnalist',
			'positions.headOfMedicine',
			'positions.physiotherapist',
			'positions.doctor',
			'positions.masseur',
			'positions.nutritionist',
			'positions.kinesiologist',
			'positions.headOfScouting',
			'positions.scout',
			'positions.ceo',
			'positions.cfo',
			'positions.cto',
			'positions.sportDirector',
			'positions.academyDirector',
			'positions.director',
			'positions.teamManager',
			'positions.itSpecialist',
			'positions.secretary',
			'positions.medicalSecretary',
			'positions.management'
		];

		this.permissions = [
			'manager',
			'tactics',
			'planning',
			'drills',
			'attendances',
			'video-gallery',

			'performance',
			'session-analysis',
			'readiness',
			'assessments',
			'test-analysis',
			'workload-analysis',

			'medical',
			'infirmary',
			'examination',
			'medical-test-analysis',
			'medical-statistics',
			'maintenance',

			'players',
			'my-team',
			'overview',
			'fitness',
			'game-stats',
			'robustness',
			'thresholds',
			'profile-attributes',
			'compare-players',
			'scouting',
			'scouting-games',
			'scouting-games-report',
			'transfers',

			'administration',
			'squads',
			'legal',
			'legal-admin',
			'notarize',
			'notifyContract',
			'finance-overview',
			'bonus',
			'cash-flow',
			'cost-items',

			'settings',

			'import-data'
		];

		this.mobilePermissions = ['directorApp', 'directorAppScouting', 'coachingApp', 'coachingAppAdmin'];

		this.groupedPermissions = [
			{
				group: 'manager',
				items: ['tactics', 'drills', 'planning', 'attendances', 'video-gallery']
			},
			{
				group: 'performance',
				items: ['session-analysis', 'readiness', 'assessments', 'test-analysis', 'workload-analysis']
			},
			{
				group: 'medical',
				items: ['infirmary', 'examination', 'medical-statistics', 'maintenance', 'medical-test-analysis']
			},
			{
				group: 'players',
				items: [
					'my-team',
					'overview',
					'fitness',
					'game-stats',
					'robustness',
					'thresholds',
					'profile-attributes',
					'compare-players',
					'scouting',
					'scouting-games',
					'scouting-games-report',
					'transfers'
				]
			},
			{
				group: 'administration',
				items: [
					'squads',
					'legal',
					'legal-admin',
					'notarize',
					'notifyContract',
					'finance-overview',
					'bonus',
					'cash-flow',
					'cost-items'
				]
			},
			// @ts-ignore
			{ group: 'other', items: ['import-data'] }
		];
	}
}
