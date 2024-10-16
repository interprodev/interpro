import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Injury, InjuryAssessment, MedicalTreatment } from '@iterpro/shared/data-access/sdk';
import { InjuryStatusColor } from '@iterpro/shared/utils/common-utils';
import * as moment from 'moment';

@Component({
	selector: 'iterpro-kanban-item',
	templateUrl: './kanban-item.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanItemComponent implements OnChanges {
	@Input() injury!: Injury;
	@Input() color!: InjuryStatusColor;
	@Input() medicalTreatments: MedicalTreatment[];
	lastAssessment: InjuryAssessment | undefined;
	highPriority = false;
	pendingElements = false;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.injury) this._initInjuryInfo();
	}

	private _initInjuryInfo(): void {
		if (this.injury && this.injury._injuryAssessments && this.injury._injuryAssessments.length > 0) {
			this.injury._injuryAssessments.sort((a, b) => {
				return moment(b.date).toDate().getTime() - moment(a.date).toDate().getTime();
			});

			// INIT INFO
			this.lastAssessment = this.injury._injuryAssessments[0] as InjuryAssessment;
			this.highPriority = this.lastAssessment?.highPriority;
			this.pendingElements = this._getPendingElements();
		}
	}

	private _getPendingElements(): boolean {
		const check = (examOrTreatment: any) =>
			moment(examOrTreatment.date).isSameOrAfter(moment().startOf('day')) && !examOrTreatment.complete;

		const examsCheck: boolean = this.injury._injuryExams.some(check);
		const treatmentsCheck: boolean = (this.medicalTreatments || [])
			.filter(({ injuryId }) => injuryId === this.injury.id)
			.some(check);

		return examsCheck || treatmentsCheck;
	}
}
