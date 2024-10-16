/* tslint:disable */
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
/**
* Default error handler
*/
@Injectable()
export class ErrorHandler {
public handleError(errorResponse: HttpErrorResponse): Observable<never> {
	if (errorResponse instanceof Error) {
	return throwError(errorResponse);
	}

	const error = errorResponse?.error?.error;
	const errorMessage = error?.message || error?.stack || error || 'Unknown error occured';

	return throwError(new Error(errorMessage));
	}
	}