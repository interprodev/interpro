'use strict';
/**
 * This is test class for SessionsStatsService...
 * SessionPeriodTrend
 * sessionsPeriodTotal
 * periodCsv
 * workloadAnalysisPeriod
 */
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../server/server');
const viewResponse = require('./sessions-stats-response');
chai.use(chaiHttp);

const expectedArrayDataForEwma = viewResponse.getExpectedDataForEwma();
const partiallyCorrectedArrayDataForEwma = viewResponse.getPartiallyCorrectedDataForEwma();

const expectedArrayDataForTrend = viewResponse.getExpectedDataForTrend();
const partiallyCorrectedArrayDataForTrend = viewResponse.getPartiallyCorrectedDataForTrend();

const expectedArrayDataForTotal = viewResponse.getExpectedDataForTotal();
const partiallyCorrectedArrayDataForTotal = viewResponse.getPartiallyCorrectedDataForTotal();

const expectedArrayDataForCsv = viewResponse.getExpectedDataForCsv();
const partiallyCorrectedArrayDataForCsv = viewResponse.getPartiallyCorrectedDataForCsv();

const expectedArrayDataForWorkload = viewResponse.getExpectedDataForWorkload();
const partiallyCorrectedArrayDataForWorkload = viewResponse.getPartiallyCorrectedDataForWorkload();

module.exports = function (validToken) {
	// 2nd Test Group
	describe('POST => /api/SessionsStats/sessionsPeriodTrend , should return 200 OK and data with valid token ', () => {
		it('A. SessionPeriodTrend - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlPeriodTrend)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsTrend) // Adding params
				.then(res => {
					expect(res).to.have.status(200);
					expect(typeof res).to.equal('object');
					expect(res.headers['content-type']).to.equal(viewResponse.expectedContentType);
					expect(res.headers['content-type']).not.equal(viewResponse.wrongContentType);

					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('B. SessionPeriodTrend - Test datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlPeriodTrend)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsTrend) // Adding params
				.then(res => {
					expect(res.body).to.exist;
					expect(res.body.data).to.be.instanceOf(Array);
					expect(typeof res.body.eventData).to.equal('object');
					expect(res.body.splits).to.be.instanceOf(Array);

					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. SessionPeriodTrend - Test Data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlPeriodTrend)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsTrend) // Adding params
				.then(res => {
					expect(res.body).to.eql(expectedArrayDataForTrend[0]);
					expect(res.body).not.eql(partiallyCorrectedArrayDataForTrend[0]);
					expect(res.body).not.eql(viewResponse.wrongData);
					expect(res.body.trainings).to.be.equal(0);
					expect(res.body.games).to.be.equal(0);

					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});

	// 3rd Test Group
	describe('POST => /api/SessionsStats/sessionsPeriodTotal , should return 200 OK and data with valid token ', () => {
		it('A. sessionsPeriodTotal - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlPeriodTotal)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsTotal) // Adding params
				.then(res => {
					expect(res).to.have.status(200);
					expect(typeof res).to.equal('object');
					expect(res.headers['content-type']).to.equal(viewResponse.expectedContentType);
					expect(res.headers['content-type']).not.equal(viewResponse.wrongContentType);

					done();
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('B. sessionsPeriodTotal - Test datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlPeriodTrend)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsTrend) // Adding params
				.then(res => {
					expect(res.body).to.exist;
					expect(res.body.data).to.be.instanceOf(Array);
					expect(typeof res.body.eventData).to.equal('object');
					expect(res.body.splits).to.be.instanceOf(Array);

					done();
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. sessionsPeriodTotal - Test Data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlPeriodTrend)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsTrend) // Adding params
				.then(res => {
					expect(res.body).to.eql(expectedArrayDataForTotal[0]);
					expect(res.body).not.eql(partiallyCorrectedArrayDataForTotal[0]);
					expect(res.body).not.eql(viewResponse.wrongData);
					expect(res.body.trainings).to.be.equal(0);
					expect(res.body.games).to.be.equal(0);

					done();
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});

	// 4th Test Group
	describe('POST => /api/SessionsStats/periodCsv , should return 200 OK and data with valid token ', () => {
		it('A. periodCsv - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlPeriodCsv)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsCsv) // Adding params
				.then(res => {
					expect(res).to.have.status(200);
					expect(typeof res).to.equal('object');
					expect(res.headers['content-type']).to.equal(viewResponse.expectedContentTypeForCsv);
					expect(res.headers['content-type']).not.equal(viewResponse.wrongContentType);

					done();
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('B. periodCsv - Test datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlPeriodCsv)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsCsv) // Adding params
				.then(res => {
					expect(res.body).to.exist;
					expect(typeof res.body).to.equal('object');

					done();
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. periodCsv - Test Data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlPeriodCsv)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsCsv) // Adding params
				.then(res => {
					expect(res.body).to.eql(expectedArrayDataForCsv[0]);
					expect(res.body).not.eql(partiallyCorrectedArrayDataForCsv[0]);
					expect(res.body).not.eql(viewResponse.wrongData);

					done();
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});

	// 5th Test Group
	describe('POST => /api/SessionsStats/workloadAnalysisPeriod , should return 200 OK and data with valid token ', () => {
		it('A. workloadAnalysisPeriod - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlWorkload)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsWorkload) // Adding params
				.then(res => {
					expect(res).to.have.status(200);
					expect(typeof res).to.equal('object');
					expect(res.headers['content-type']).to.equal(viewResponse.expectedContentType);
					expect(res.headers['content-type']).not.equal(viewResponse.wrongContentType);

					done();
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('B. workloadAnalysisPeriod - Test datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlWorkload)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsWorkload) // Adding params
				.then(res => {
					expect(res.body).to.exist;
					expect(res.body.stress_balance).to.be.instanceOf(Array);
					expect(typeof res.body.general).to.equal('object');

					done();
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. workloadAnalysisPeriod - Test Data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlWorkload)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsWorkload) // Adding params
				.then(res => {
					expect(res.body.general.totalDays).to.be.equal(7);
					expect(res.body.stress_balance[0].label).to.be.equal('06/06/2019');
					expect(res.body).to.eql(expectedArrayDataForWorkload[0]);
					expect(res.body).not.eql(partiallyCorrectedArrayDataForWorkload[0]);
					expect(res.body).not.eql(viewResponse.wrongData);

					done();
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});
};
