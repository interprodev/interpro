import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	standalone: true,
	name: 'configForMetric'
})
export class ConfigForMetricPipe implements PipeTransform {
	transform(item: string): {label: string, backgroundColor: string} {
		switch (item) {
			case 'rpe':
				return { label: 'Perceived', backgroundColor: '#71d0ff' };
			case 'heartRate85to90':
				return { label: 'Cardio', backgroundColor: '#a05195' };
			case 'totalDistance':
				return { label: 'Kinematic', backgroundColor: '#4800e4' };
			case 'powerDistance':
				return { label: 'Metabolic', backgroundColor: '#ffae00' };
			case 'highIntensityDeceleration':
				return { label: 'Mechanical', backgroundColor: '#008956' };
			case 'averageMetabolicPower':
				return { label: 'Metabolic', backgroundColor: '#F61111' };
			case 'workload':
				return { label: 'Workload', backgroundColor: '#ffffff' };
			default:
				return null;
		}
	}
}
