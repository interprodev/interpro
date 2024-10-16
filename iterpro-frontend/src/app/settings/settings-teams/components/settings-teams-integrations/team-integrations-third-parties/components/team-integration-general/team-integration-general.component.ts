import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormFeedbackComponent } from '@iterpro/shared/ui/components';
import { FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TeamIntegration, TeamIntegrationsThirdPartiesForm } from '../../models/integrations-third-parties.type';
import { SelectItem } from 'primeng/api';
import * as timezone from 'moment-timezone';
import { PrimeNgModule } from '@iterpro/shared/ui/primeng';

@Component({
	selector: 'iterpro-team-integration-general',
	standalone: true,
	imports: [
		FormFeedbackComponent,
		ReactiveFormsModule,
		TranslateModule,
		PrimeNgModule
	],
	templateUrl: './team-integration-general.component.html',
})
export class TeamIntegrationGeneralComponent implements OnInit, OnChanges {
	@Input({required: true}) formGroupName: string;
	@Input({required: true}) team: TeamIntegration;
	@Input({required: true}) saveClicked: boolean;
	@Input({required: true}) editMode: boolean;
	readonly #rootFormGroup = inject(FormGroupDirective);
	generalForm: FormGroup<TeamIntegrationsThirdPartiesForm>;
	separatorOptions: SelectItem[] = [
		{ label: ',', value: ',' },
		{ label: ';', value: ';' },
		{ label: ':', value: ':' },
		{ label: '.', value: '.' },
		{ label: 'tab', value: '	' }
	];
	timezoneOptions: SelectItem[];

	ngOnInit(): void {
		this.timezoneOptions = timezone.tz
			.names()
			.map(name => ({ label: `(${timezone.tz(name).format('Z')}) ${name}`, value: name }));
		this.generalForm = this.#rootFormGroup.control.get(this.formGroupName) as FormGroup<TeamIntegrationsThirdPartiesForm>;
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.editMode && this.generalForm) {
			this.generalForm = this.#rootFormGroup.control.get(this.formGroupName) as FormGroup<TeamIntegrationsThirdPartiesForm>;
		}
	}
}
