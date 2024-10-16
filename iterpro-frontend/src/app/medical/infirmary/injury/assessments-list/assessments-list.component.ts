import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Customer, Injury, InjuryAssessment } from '@iterpro/shared/data-access/sdk';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { filter, take } from 'rxjs/operators';
import { EditAssessmentComponent } from '../edit-assessment/edit-assessment.component';

@UntilDestroy()
@Component({
	selector: 'iterpro-assessments-list',
	templateUrl: './assessments-list.component.html',
	styleUrls: ['./assessments-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssessmentsListComponent {
	@Input() injury: Injury;
	@Input() assessments: InjuryAssessment[];
	@Input() customers: Customer[];
	@Input() currentUserId: string;
	@Output() create = new EventEmitter<InjuryAssessment>();
	@Output() edit = new EventEmitter<InjuryAssessment>();
	@Output() delete = new EventEmitter<InjuryAssessment>();

	constructor(private readonly dialogService: DialogService) {}

	addNewAssessment(): void {
		this.openDialog();
	}

	editAssessment(assessment: InjuryAssessment): void {
		this.openDialog(assessment);
	}

	deleteAssessment(assessment: InjuryAssessment): void {
		this.delete.emit(assessment);
	}

	private openDialog(assessment?: InjuryAssessment): void {
		const dialogRef: DynamicDialogRef = this.dialogService.open(EditAssessmentComponent, {
			header: assessment ? 'Edit' : 'New',
			width: '70vw',
			height: '70vh',
			data: {
				assessment,
				injury: this.injury,
				customers: this.customers,
				currentUserId: this.currentUserId
			}
		});

		dialogRef.onClose
			.pipe(
				take(1),
				filter(assessment => !!assessment)
			)
			.subscribe((assessment: InjuryAssessment) => {
				assessment.id ? this.edit.emit(assessment) : this.create.emit(assessment);
			});
	}
}
