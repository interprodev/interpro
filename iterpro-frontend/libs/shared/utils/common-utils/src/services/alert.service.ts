import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

export type Severity = 'success' | 'info' | 'warn' | 'error' | 'chat';
export interface AlertParams {
	severity: Severity;
	summary: string;
	detail: string;
	sticky?: boolean;
	params?: any;
	life?: number;
	redirectUrl?: string;
}

@Injectable({
	providedIn: 'root'
})
export class AlertService {
	alertChange: Subject<AlertParams> = new Subject<AlertParams>();
	alertChangeAll: Subject<AlertParams[]> = new Subject<AlertParams[]>();

	private readonly translateService = inject(TranslateService);

	notify(
		severity: Severity,
		summary: string,
		detail: string,
		sticky?: boolean,
		params?: any,
		life?: number,
		redirectUrl?: string
	) {
		const alert: AlertParams = { severity, summary, detail, sticky, params, life, redirectUrl };
		this.alertChange.next(this.getParam(alert));
	}

	notifyAll(alerts: AlertParams[]) {
		const alertParams: AlertParams[] = [];
		for (const alert of alerts) {
			alertParams.push(this.getParam(alert));
		}
		this.alertChangeAll.next(alertParams);
	}

	clearAll() {
		this.alertChangeAll.next([]);
	}

	private getParam(alert: AlertParams): AlertParams {
		const translationParam = this.getTranslations(alert);
		return {
			severity: alert.severity,
			summary: translationParam.summary,
			detail: translationParam.detail,
			sticky: alert.sticky,
			params: alert.params,
			life: this.getAlertLifetime(alert),
			redirectUrl: alert.redirectUrl
		};
	}

	private getAlertLifetime(alert: AlertParams): number {
		if (alert.life) return alert.life;
		return 10000;
	}

	private getTranslations(alert: AlertParams): { summary: string; detail: string } {
		const summary = this.translateService.instant(alert.summary);
		const detail = this.translateService.instant(alert.detail, { value: alert.params });
		return { summary, detail };
	}
}
