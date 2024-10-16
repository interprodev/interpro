import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
	HttpResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import * as moment from 'moment';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class DateInterceptor implements HttpInterceptor {
	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		let customReq: any = request.clone();
		if (customReq.headers.has('filter')) {
			const newF = JSON.stringify(this.convertToServer(JSON.parse(customReq.headers.get('filter'))));
			const headers = customReq.headers.set('filter', newF);
			customReq = customReq.clone({
				headers
			});
		}

		return next.handle(customReq).pipe(
			map((event: HttpEvent<any>) => {
				if (event instanceof HttpResponse) {
					return event.clone({
						body: this.convertDates(event.body)
					});
				} else {
					return event;
				}
			}),
			tap((err: any) => {
				if (err instanceof HttpErrorResponse) {
					return observableThrowError(err);
				}
				return err;
			})
		);
	}

	private castToDate(date: Date) {
		return moment(date).toDate();
	}

	private convertDates(body: any) {
		if (body) {
			body = this.searchProperty(body, this.castToDate, 'from server', true);
		}

		return body;
	}

	private convertToServer(body: any) {
		if (body) {
			body = this.searchProperty(cloneDeep(body), this.castToDate, 'filter', true);
		}
		return body;
	}

	private searchProperty(object: any, convertFn: (d: Date) => Date, headerMessage = '', root = false) {
		if (root && object instanceof Array) {
			for (let i = 0; i < object.length; i++) {
				object[i] = this.searchProperty(object[i], convertFn, headerMessage);
			}
		} else {
			for (const p in object) {
				if (object[p]) {
					if (this.isDateField(p)) {
						object[p] = this.isValidDate(object[p])
							? convertFn(new Date(object[p]))
							: this.searchProperty(object[p], convertFn, headerMessage);
					} else if (object[p] instanceof Array) {
						for (let i = 0; i < object[p].length; i++) {
							object[p][i] = this.searchProperty(object[p][i], convertFn, headerMessage);
						}
					} else if (object[p] instanceof Object) {
						object[p] = this.searchProperty(object[p], convertFn, headerMessage);
					}
				}
			}
		}
		return object;
	}

	private isValidDate(d: string): boolean {
		const date: Date = new Date(d);
		return date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date as any);
	}

	private isDateField(p: string) {
		return (
			p === 'time' ||
			p === 'date' ||
			p === 'start' ||
			p === 'expirationDate' ||
			p === 'end' ||
			p === 'birthDate' ||
			p === 'contractStart' ||
			p === 'contractEnd' ||
			p === 'archivedDate' ||
			p === 'endDate' ||
			p === 'admissionDate' ||
			p === 'expectedReturn' ||
			p === 'splitStartTime' ||
			p === 'splitEndTime' ||
			p === 'next' ||
			p === 'expectation' ||
			p === 'gte' ||
			p === 'lte' ||
			p === 'lt' ||
			p === 'dateFrom' ||
			p === 'dateTo' ||
			p === 'signatureDate' ||
			p === 'inTeamFrom' ||
			p === 'inTeamTo' ||
			p === 'startDate' ||
			p === 'untilDate' ||
			p === 'endDate' ||
			p === 'announceDate' ||
			p === 'from' ||
			p === 'to' ||
			p === 'on' ||
			p === 'issueDate' ||
			p === 'filingDate' ||
			p === 'issuedDate' ||
			p === 'expiryDate' ||
			p === 'buyBackDate' ||
			p === 'sellOnFeeDate' ||
			p === 'within' ||
			p === 'dueDate' ||
			p === 'lastUpdateDate' ||
			p === 'offseason' ||
			p === 'preseason' ||
			p === 'inseasonStart' ||
			p === 'inseasonEnd' ||
			p === 'foundation' ||
			p === 'stipulationDate' ||
			p === 'itcDate' ||
			p === 'achievedDate' ||
			p === 'membershipDate' ||
			p === 'creationDate'
		);
	}
}
