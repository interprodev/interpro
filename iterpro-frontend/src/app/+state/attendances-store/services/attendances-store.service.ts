import { Injectable, Injector } from '@angular/core';
import { EtlBaseInjectable } from '@iterpro/shared/utils/etl';

@Injectable({
	providedIn: 'root'
})
export class AttendancesStoreService extends EtlBaseInjectable {
	constructor(injector: Injector) {
		super(injector);
	}

	get service() {
		return this.etlPlayerService;
	}

	metricName() {
		return this.service.getDurationField().metricName;
	}
}
