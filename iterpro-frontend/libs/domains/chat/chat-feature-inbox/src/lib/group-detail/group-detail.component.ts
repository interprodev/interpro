import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
	standalone: true,
	imports: [CommonModule, TranslateModule, ReactiveFormsModule, ButtonModule, InputTextModule],
	selector: 'iterpro-group-detail',
	templateUrl: './group-detail.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupDetailComponent {
	groupForm: FormGroup;

	constructor(private readonly fb: FormBuilder, private readonly dialogReference: DynamicDialogRef) {
		this.groupForm = this.fb.group({
			name: ['']
		});
	}

	closeDialog(): void {
		this.dialogReference.close(this.groupForm.value);
	}
}
