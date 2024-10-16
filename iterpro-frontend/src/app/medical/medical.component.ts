import { Component, OnInit } from '@angular/core';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { IterproOrgType, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { UIBlock } from '@iterpro/shared/ui/components';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { RootStoreState } from '../+state/root-store.state';

@Component({
	selector: 'iterpro-medical',
	template: `
		<div class="main">
			<iterpro-launchpad [blocks]="blocks" [hideDisabledModules]="(clubType$ | async) === 'agent'" />
		</div>
	`
})
export class MedicalComponent implements OnInit {
	public blocks: UIBlock[] = [];
	public readonly clubType$: Observable<IterproOrgType> = this.store$.select(AuthSelectors.selectOrganizationType);
	constructor(
		private readonly store$: Store<RootStoreState>,
		private readonly permissionService: PermissionsService,
		private readonly currentTeamService: CurrentTeamService
	) {}

	ngOnInit() {
		this.store$.select(AuthSelectors.selectSportType).subscribe({
			next: (type: string) => {
				this.blocks = [
					{
						link: '/medical/maintenance',
						title: 'navigator.medicalRecords2',
						subtitle: 'navigator.medicalPrevention.description',
						img: 'assets/img/blocks/medical/maintenance.jpg'
					},
					{
						link: '/medical/infirmary',
						title: 'navigator.infirmary',
						subtitle: 'navigator.infirmary.description',
						img: `assets/img/blocks/medical/infirmary${!type || type !== 'football' ? `-${type}` : ''}.jpg`
					},
					{
						link: '/medical/medical-statistics',
						title: 'navigator.medicalStatistics',
						subtitle: 'navigator.medicalStatistics.description',
						img: 'assets/img/blocks/medical/medical-statistics.jpg'
					},
					{
						link: '/medical/examination',
						title: 'navigator.examination',
						subtitle: 'navigator.examination.description',
						img: 'assets/img/blocks/medical/examination.jpg'
					},
					{
						link: '/medical/medical-test-analysis',
						title: 'navigator.testAnalysis',
						subtitle: 'navigator.testAnalysis.description',
						img: 'assets/img/blocks/performance/test-analysis.jpg'
					}
				];

				this.blocks = this.blocks.map(block => ({
					...block,
					enabled: this.permissionService.canAccessToRoute(block.link, this.currentTeamService.getCurrentTeam())
				}));
			}
		});
	}
}
