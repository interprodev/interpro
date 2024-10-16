import { Component, OnInit } from '@angular/core';
import { AuthSelectors, CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { IterproOrgType, PermissionsService } from '@iterpro/shared/data-access/permissions';
import { UIBlock } from '@iterpro/shared/ui/components';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { RootStoreState } from '../+state/root-store.state';

@Component({
	selector: 'iterpro-performance',
	template: `
		<div class="main">
			<iterpro-launchpad [blocks]="blocks" [hideDisabledModules]="(clubType$ | async) === 'agent'" />
		</div>
	`
})
export class PerformanceComponent implements OnInit {
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
						link: '/performance/session-analysis',
						title: 'navigator.sessionAnalysis',
						subtitle: 'navigator.sessionAnalysis.description',
						img: `assets/img/blocks/performance/session-analysis${!type || type !== 'football' ? `-${type}` : ''}.jpg`
					},
					{
						link: '/performance/workload-analysis',
						title: 'navigator.workloadAnalysis',
						subtitle: 'navigator.workloadAnalysis.description',
						img: 'assets/img/blocks/performance/workload-analysis.jpg'
					},
					{
						link: '/performance/readiness',
						title: 'navigator.readiness',
						subtitle: 'navigator.readiness.description',
						img: 'assets/img/blocks/performance/readiness.jpg'
					},
					{
						link: '/performance/assessments',
						title: 'navigator.assessments',
						subtitle: 'navigator.assessments.description',
						img: 'assets/img/blocks/performance/assessment.jpg'
					},
					{
						link: '/performance/test-analysis',
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
