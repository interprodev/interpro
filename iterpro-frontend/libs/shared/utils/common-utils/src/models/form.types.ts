import { FormControl, FormGroup } from "@angular/forms";

export type ControlsOf<T> = {
	[K in keyof T]: T[K] extends Record<string, any> ? FormGroup<ControlsOf<T[K]>> : FormControl<T[K]>;
};