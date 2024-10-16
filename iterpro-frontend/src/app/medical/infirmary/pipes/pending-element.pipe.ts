import { Pipe, PipeTransform } from '@angular/core';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { Injury, InjuryExam, MedicalTreatment } from '@iterpro/shared/data-access/sdk';
import { getMedicationName, getMomentFormatFromStorage } from '@iterpro/shared/utils/common-utils';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

@Pipe({
	name: 'pendingElementsToolitp'
})
export class PendingElementPipe implements PipeTransform {
	constructor(
		private readonly translateService: TranslateService,
		private readonly currentTeamService: CurrentTeamService
	) {}

	transform(injury: Injury, medicalTreatments: MedicalTreatment[]): string {
		const exams: InjuryExam[] = injury._injuryExams.filter(
			x => moment(x.date).isSameOrAfter(moment().startOf('day')) && !x.complete
		);
		const treatments: MedicalTreatment[] = (medicalTreatments || []).filter(
			treatment => moment(treatment.date).isSameOrAfter(moment().startOf('day')) && !treatment.complete
		);

		let text = '<ul>';

		if (exams) {
			exams.forEach(ex => {
				text = text.concat(`<li>${ex.exam} - ${moment(ex.date).format(`${getMomentFormatFromStorage()} hh:mm`)}</li>`);
			});
		}

		if (treatments) {
			treatments.forEach(tr => {
				let treatment;

				if (tr.treatmentType === 'medicationSupplements') {
					treatment = getMedicationName(tr.treatment, this.currentTeamService.getCurrentTeam());
				} else {
					treatment = this.translateService.instant(
						`medical.prevention.treatments.${tr?.treatmentType.toLowerCase()}.${tr}`
					);
				}

				text = text.concat(
					`<li>${treatment} - ${moment(tr.date).format(`${getMomentFormatFromStorage()} hh:mm`)}</li>`
				);
			});
		}

		text = text.concat('</ul>');

		return text;
	}
}
