import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@iterpro/config';
import { CurrentTeamService } from '@iterpro/shared/data-access/auth';
import { ClubApi, Customer, LoopBackAuth, Team } from '@iterpro/shared/data-access/sdk';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { cloneDeep, toPairs } from 'lodash';
import * as moment from 'moment';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as Papa from 'papaparse';
import { Observable, forkJoin, throwError as observableThrowError, of } from 'rxjs';
import { catchError, first, map, mapTo, mergeMap } from 'rxjs/operators';
import { AzureStoragePipe } from '../pipes/azure-storage.pipe';
import { getMomentFormatFromStorage } from '../utils/dates/date-format.util';
import { ErrorService } from './error.service';
import { DEFAULT_PERSON_IMAGE_BASE64 } from '../constants/assets/default-player-image.constants';
import { isBase64Image } from '../utils/functions/uploads/uploads.functions';

@Injectable({
	providedIn: 'root'
})
export class ReportService {
	@BlockUI('general') blockUI!: NgBlockUI;

	constructor(
		private readonly http: HttpClient,
		private readonly errorService: ErrorService,
		private readonly clubApi: ClubApi,
		private readonly translateService: TranslateService,
		private readonly currentTeamService: CurrentTeamService,
		private readonly numberPipe: DecimalPipe,
		private readonly percentPipe: PercentPipe,
		private readonly azurePipe: AzureStoragePipe,
		private readonly datePipe: DatePipe,
		private readonly auth: LoopBackAuth
	) {}

	// NOTE: version with server as a proxy
	request(name: string, data?: any): Observable<any> {
		const body = { name, data };

		const headers: HttpHeaders = new HttpHeaders({
			'Content-Type': 'application/json',
			Authorization: this.auth.getAccessTokenId()
		});

		const url = `${environment.BASE_URL}/pdf-report`;

		return this.http
			.post(url, body, {
				headers,
				responseType: 'blob'
			})
			.pipe(catchError(this.handleErrorObservable));
	}

	private handleErrorObservable(error: Response | any) {
		return observableThrowError(error.message || error);
	}

	private download(response: any, windowObject: any, fileName = 'report.pdf') {
		try {
			const blob = new Blob([response], { type: 'application/pdf;charset=utf-8' });
			const fileURL = URL.createObjectURL(blob);
			window.open(fileURL, '_blank');
			// if (windowObject) {
			// 	const fileURL = URL.createObjectURL(file);
			// 	windowObject.location.href = fileURL;
			// 	windowObject.name = 'Report';
			// 	window.open(fileURL, '_blank');
			// } else {
			// 	saveAs(file, fileName);
			// }
		} catch (e) {
			console.error(e);
		} finally {
			this.blockUI.stop();
		}
	}

	getReport(
		name: string,
		data?: any,
		position = 'positions.headCoach',
		windowObject = null,
		filename?: string,
		customTeamHeader = false
	): void {
		const t = this.translateService.instant.bind(this.translateService);
		let teamId = '';
		const currentTeamHeader: any = { logo: '', team: '', coach: '' };
		const currentTeam = this.currentTeamService.getCurrentTeam();
		if (!customTeamHeader) {
			if (currentTeam) {
				teamId = currentTeam.id;
				currentTeamHeader.team = currentTeam.name;
			}
		}

		this.blockUI.start();

		this.getReportData(teamId, position, currentTeam)
			.pipe(
				mergeMap(([crest, coach]) => {
					if (crest) currentTeamHeader.logo = crest;
					if (coach) {
						const customer: Customer = coach;
						currentTeamHeader.coach = position
							? `${t(position)}: ${customer.firstName} ${customer.lastName}`
							: `${customer.firstName} ${customer.lastName}`;
					}
					const convertedData = this.convertToChartV2({ ...data });
					if (convertedData?.header) {
						convertedData.header = { ...convertedData.header, currentTeamHeader };
					}
					if (!customTeamHeader) {
						if (convertedData?.header) {
							convertedData.header = { ...convertedData.header, currentTeamHeader };
						}
						return this.request(name, { ...convertedData, currentTeamHeader });
					}
					return this.request(name, { ...convertedData });
				}),
				first()
			)
			.subscribe({
				next: res => this.download(res, windowObject, filename),
				error: err => {
					this.blockUI.stop();
					this.errorService.handleError(err);
				}
			});
	}

	private getCoach(teamId: string, position: string): Observable<Customer> {
		return this.clubApi
			.getCustomers(this.auth.getCurrentUserData().clubId, {
				fields: ['teamSettings', 'firstName', 'lastName', 'id'],
				where: {
					'teamSettings.teamId': teamId,
					'teamSettings.position': position
				}
			})
			.pipe(map((customers: Customer[]) => customers[0]));
	}

	private getCrest(currentTeam?: Team) {
		return !currentTeam?.club?.crest
			? of(DEFAULT_PERSON_IMAGE_BASE64)
			: isBase64Image(currentTeam.club.crest)
				? resizeImage(currentTeam.club.crest).pipe(catchError(() => of(null)))
				: of(this.azure(currentTeam.club.crest));
	}

	getReportData(teamId: string, position: string, currentTeam?: Team) {
		const getCrest = this.getCrest(currentTeam);
		const getCoach = this.getCoach(teamId, position);
		return forkJoin([getCrest, getCoach]);
	}

	getImages(images: string[]) {
		const baseUrl = 'https://app.iterpro.com';
		const requests = images.map(image =>
			this.http.head(this.azure(image)).pipe(
				mapTo(this.azure(image)),
				catchError(error => of(`${baseUrl}/assets/img/default_icon.png`))
			)
		);
		if (!requests.length) return of([]);
		return forkJoin(requests);
	}

	getImage(image: string) {
		return this.getImages([image]).pipe(first());
	}

	translate(str: string): string {
		if (!str || str === '') return str;
		return this.translateService.instant(str);
	}

	number(n: number, f: string) {
		return this.numberPipe.transform(n, f);
	}

	percent(n: number) {
		return this.percentPipe.transform(n);
	}

	date(d: Date, f = getMomentFormatFromStorage(), locale = 'en') {
		return this.datePipe.transform(d, f, '', locale);
	}

	azure(url: string) {
		return this.azurePipe.transform(url) as string;
	}

	getReportCSV(name: string, rows: any[], config?: any) {
		return getReportCSV(name, rows, config);
	}

	private convertToChartV2(data: any): any {
		const copy = cloneDeep(data);
		if (copy.options) {
			copy.options = this.convertOptions(copy.options);
		}
		if (copy.chart) {
			copy.chart.options = this.convertOptions(copy.chart.options);
		}
		if (copy.medical && copy.medical.chart) {
			copy.medical.chart.options = this.convertOptions(copy.medical.chart.options);
		}
		if (copy.valueChart) {
			copy.valueChart.options = this.convertOptions(copy.valueChart.options);
		}
		if (copy.expiry && copy.expiry.chart) {
			copy.expiry.chart.options = this.convertOptions(copy.expiry.chart.options);
		}
		if (copy.tot && copy.tot.chart) {
			copy.tot.chart.options = this.convertOptions(copy.tot.chart.options);
		}
		if (copy.contracts && copy.contracts.chart) {
			copy.contracts.chart.options = this.convertOptions(copy.contracts.chart.options);
		}
		if (copy.chartOptions) {
			copy.chartOptions = this.convertOptions(copy.chartOptions);
		}
		if (copy.options2) {
			copy.options2 = {
				...copy.options2,
				legend: { display: false },
				scale: {
					ticks: {
						showLabelBackdrop: false,
						display: false,
						beginAtZero: true
					},
					angleLines: {
						color: '#333333'
					},
					gridLines: {
						color: '#333333'
					}
				}
			};
			copy.data2.datasets = copy.data2.datasets.map((dataset: any) => ({
				...dataset,
				backgroundColor: 'rgba(255, 105, 1, 0.5)',
				borderColor: '#ff6901',
				pointBackgroundColor: '#ff6901',
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: '#ff6901',
				lineTension: 0
			}));
		}
		if (copy.radar) {
			copy.radar.options = {
				...copy.radar.options,
				legend: { display: false },
				scale: {
					ticks: {
						showLabelBackdrop: false,
						display: false,
						beginAtZero: true
					},
					angleLines: {
						color: '#333333'
					},
					gridLines: {
						color: '#333333'
					}
				}
			};
			copy.radar.data.datasets = copy.radar.data.datasets.map((dataset: any) => ({
				...dataset,
				backgroundColor: 'rgba(255, 105, 1, 0.5)',
				borderColor: '#ff6901',
				pointBackgroundColor: '#ff6901',
				pointBorderColor: '#fff',
				pointHoverBackgroundColor: '#fff',
				pointHoverBorderColor: '#ff6901',
				lineTension: 0
			}));
		}
		if (copy.investment && copy.investment.chart) {
			copy.investment.chart.options = this.convertOptions(copy.investment.chart.options);
		}
		if (copy.capital && copy.capital.trend && copy.capital.trend.chart) {
			copy.capital.trend.chart.options = this.convertOptions(copy.capital.trend.chart.options);
		}
		if (copy.comparisonOptions) {
			copy.comparisonOptions = this.convertOptions(copy.comparisonOptions);
		}
		if (copy.compositionOptions) {
			copy.compositionOptions = this.convertOptions(copy.compositionOptions);
		}
		if (copy.drillsOptions) {
			copy.drillsOptions = this.convertOptions(copy.drillsOptions);
		}
		if (copy.breakdownOptions) {
			copy.breakdownOptions = this.convertOptions(copy.breakdownOptions, false);
		}
		if (copy.titOptions) {
			copy.titOptions = this.convertOptions(copy.titOptions);
		}
		if (copy.loadOptions) {
			copy.loadOptions = this.convertOptions(copy.loadOptions);
		}
		if (copy.trendOptions) {
			copy.trendOptions = this.convertOptions(copy.trendOptions);
		}
		if (copy.playerPages) {
			copy.playerPages.forEach((page: any) => {
				page.chart.options = this.convertOptions(page.chart.options);
				page.header = {
					...page.header
				};
			});
		}
		return copy;
	}

	private convertOptions(options: any, stacked = true): any {
		const scales = toPairs(options.scales).map(([key, value]: [string, any]) => ({
			id: key,
			gridLines: value.grid,
			...value
		}));
		options.scales = {
			xAxes: scales.filter(({ id }) => id.includes('x')),
			yAxes: scales.filter(({ id }) => id.includes('y'))
		};
		if (options.scales.xAxes[0]) {
			if (options.scales.xAxes[0].type === 'time') {
				options.scales.xAxes[0] = {
					...options.scales.xAxes[0],
					stacked,
					offset: true,
					type: 'time',
					distirbution: 'series',
					bounds: 'ticks',
					time: {
						minUnit: 'day',
						displayFormats: {
							day: 'DD/MM/YYYY ddd',
							month: 'MMMM YYYY',
							year: 'YYYY'
						},
						parser: false
					},
					ticks: {
						...options.scales.xAxes[0].ticks
						// source: 'data'
					}
				};
			} else {
				options.scales.xAxes[0] = {
					...options.scales.xAxes[0],
					ticks: {
						...options.scales.xAxes[0].ticks,
						autoSkip: false
					}
				};
			}
		}
		options.scales.yAxes = options.scales.yAxes.map((axis: any) => ({
			...axis,
			ticks: {
				...axis.ticks,
				beginAtZero: axis.beginAtZero
			}
		}));
		options.legend = options.plugins.legend;
		options.annotation = options.plugins.annotation;
		/*		options.responsive = true;
		options.maintainAspectRatio = false;*/
		return options;
	}
}

export function getPDFv2Path(domain: PDFDomains, filename: string, addNewSuffix = true): string {
	const basePath = 'templates/v2/modules';
	const result = `/${basePath}/${domain}/${filename}`; // TODO remove new when all is ok
	return addNewSuffix ? `${result}_new` : result;
}

export type PDFDomains =
	| 'scouting'
	| 'session-analysis'
	| 'injury'
	| 'medical-records'
	| 'readiness'
	| 'calendar'
	| 'infirmary'
	| 'admin'
	| 'my-team'
	| 'workload-analysis'
	| 'planning'; // TODO ADD OTHERS

const resizeImage = (imagePath: string) => {
	return new Observable(observer => {
		const img = new Image();
		img.src = imagePath;
		img.onload = () => {
			try {
				const canvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
				canvas.width = 150;
				canvas.height = 150;
				const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
				const hRatio = canvas.width / img.width;
				const vRatio = canvas.height / img.height;
				const ratio = Math.min(hRatio, vRatio);
				const w = img.width * ratio;
				const h = img.height * ratio;
				const x = (canvas.width - w) / 2;
				const y = (canvas.height - h) / 2;
				ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h);
				observer.next(canvas.toDataURL());
				observer.complete();
			} catch (e) {
				// tslint:disable-next-line: no-console
				console.error(e);
				observer.error(e);
			}
		};
		img.onerror = err => {
			observer.error(err);
		};
	});
};

export const getReportCSV = (name: string, rows: any[], config = {}) => {
	const date = moment().startOf('day').format(getMomentFormatFromStorage());
	const fileName = `${name} ${date}.csv`;
	const results = Papa.unparse(rows, config);
	const blob = new Blob([results], { type: 'text/plain' });
	saveAs(blob, fileName);
};
