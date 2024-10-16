import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@iterpro/config';
import { TeamApi } from '@iterpro/shared/data-access/sdk';
import { Observable } from 'rxjs';
import { DrillCanvas, DrillCanvasMapping } from '../models/drills-canvas.types';

@Injectable({
	providedIn: 'root'
})
export class DrillsCanvasService {
	readonly #teamApiService = inject(TeamApi);
	readonly #httpClientService = inject(HttpClient);
	readonly drillCanvasAssetsPath = '/canvas/mappings.json';

	/**
	 * Load all drills canvas
	 * @param { string } teamID
	 */
	loadCanvases(teamID: string): Observable<DrillCanvas[]> {
		return this.#teamApiService.getAllDrillCanvases(teamID);
	}

	/**
	 * Load Drill Template by ID
	 * @param { string } teamID
	 * @param { string } canvasID
	 */
	getCanvas(teamID: string, canvasID: string): Observable<DrillCanvas> {
		return this.#teamApiService.getSingleDrillCanvas(teamID, canvasID);
	}

	/**
	 * Create a new Drill Canvas
	 * @param { string } teamID
	 * @param { DrillCanvas } drillCanvas
	 * @returns { Observable<boolean> }
	 */
	createDrillCanvas(teamID: string, drillCanvas: Partial<DrillCanvas>): Observable<{ id: string; name: string }> {
		return this.#teamApiService.createDrillCanvas(teamID, drillCanvas);
	}

	/**
	 * Create a new Drill Canvas
	 * @param { string } teamID
	 * @param { DrillCanvas } drillCanvas
	 * @returns { Observable<boolean> }
	 */
	updateDrillCanvas(teamID: string, drillCanvas: Partial<DrillCanvas>): Observable<boolean> {
		return this.#teamApiService.updateDrillCanvas(teamID, drillCanvas);
	}

	/**
	 * Delete Drill Template
	 * @param { string } teamID
	 * @param { string } canvasID
	 * @returns { Observable<boolean> }
	 */
	deleteDrillCanvas(teamID: string, canvasId: string): Observable<boolean> {
		return this.#teamApiService.deleteDrillCanvas(teamID, canvasId);
	}

	loadMappings(): Observable<DrillCanvasMapping> {
		return this.#httpClientService.get<DrillCanvasMapping>(`${environment.CDN_URL}${this.drillCanvasAssetsPath}`);
	}
}
