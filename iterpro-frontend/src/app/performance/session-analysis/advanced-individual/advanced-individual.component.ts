import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ALCLIndividual } from 'src/app/+state/session-analysis-store/ngrx/session-analysis-store.interfaces';

@Component({
	selector: 'iterpro-advanced-individual',
	templateUrl: './advanced-individual.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdvancedIndividualComponent {
	@Input() individualALCL: ALCLIndividual[];
	@Input() advancedFlags: { inProgress: boolean; wrongSelection: boolean; noData: boolean };
}
