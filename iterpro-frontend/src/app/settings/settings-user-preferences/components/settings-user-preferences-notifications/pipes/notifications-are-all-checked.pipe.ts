import { Pipe } from '@angular/core';
import { SectionToggle } from '../models/notification.type';
import { FormGroup } from '@angular/forms';

@Pipe({
	name: 'notificationsAreAllChecked',
	standalone: true,
	pure: false
})
export class NotificationsAreAllCheckedPipe {
	transform(form: FormGroup, sectionKeys: SectionToggle): boolean {
		return sectionKeys.every(({ groupName, controlName  }) => {
			if (groupName) {
				const control = form.get(groupName)?.get(controlName);
				return control?.value;
			} else {
				const control = form.get(controlName);
				return control?.value;
			}
		});
	}
}
