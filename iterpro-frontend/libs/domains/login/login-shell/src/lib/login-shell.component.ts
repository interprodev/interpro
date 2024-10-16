import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LoginFeatureFormComponent } from '@iterpro/login-feature-form';

@Component({
	standalone: true,
	imports: [CommonModule, LoginFeatureFormComponent],
	template: `<iterpro-login-feature-form />`,
	selector: 'iterpro-login-shell'
})
export class LoginShellComponent {}
