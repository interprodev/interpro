import { Component, inject, Input, OnInit } from '@angular/core';
import {
	FormGroup,
	FormGroupDirective,
	ReactiveFormsModule
} from '@angular/forms';
import { ClubSeasonBasic, TeamSeasonDetailsForm } from '../../models/seasons.type';
import { FormFeedbackComponent } from '@iterpro/shared/ui/components';
import { PaginatorModule } from 'primeng/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';
import { TeamIntegration } from '../../../settings-teams-integrations/team-integrations-third-parties/models/integrations-third-parties.type';
import { DeviceType } from '@iterpro/shared/data-access/sdk';

@Component({
	selector: 'iterpro-team-seasons-details',
	standalone: true,
	imports: [
		FormFeedbackComponent,
		PaginatorModule,
		ReactiveFormsModule,
		TranslateModule,
		PrimeNgModule
	],
	templateUrl: './team-seasons-details.component.html'
})
export class TeamSeasonsDetailsComponent implements OnInit {
	@Input({required: true}) formGroupName: string;
	@Input({required: true}) clubSeasons: ClubSeasonBasic[];
	@Input({required: true}) saveClicked: boolean;
	@Input({required: true}) editMode: boolean;
	@Input({required: true}) device: DeviceType;
	#rootFormGroup = inject(FormGroupDirective);
	detailForm: FormGroup<TeamSeasonDetailsForm>;

	ngOnInit(): void {
		this.detailForm = this.#rootFormGroup.control.get(this.formGroupName) as FormGroup<TeamSeasonDetailsForm>;
	}
}
