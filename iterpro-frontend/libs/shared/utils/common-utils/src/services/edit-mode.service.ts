import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class EditModeService {
	editMode: boolean;

	constructor() {
		this.editMode = false;
	}

	public get value(): boolean {
		return this.editMode;
	}

	public set value(v: boolean) {
		this.editMode = v;
	}
}
