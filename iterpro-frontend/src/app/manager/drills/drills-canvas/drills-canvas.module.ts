import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { drillsCanvasRoutes } from './drills-canvas.routes';

@NgModule({
	imports: [RouterModule.forChild(drillsCanvasRoutes)]
})
export class DrillsCanvasModule {}
