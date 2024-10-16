'use strict';
/**
 * This is test class for ProfilePlayersService...
 * profileGameStats
 * profileRobustness
 * profileFitness
 */
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../server/server');
const viewResponse = require('./profile-players-response');

const expectedDataGameStat = viewResponse.getExpectedDataGameStat();
const partiallyCorrectedDataGameStat = viewResponse.getPartiallyCorrectedDataGameStat();

const expectedDataRobustness = viewResponse.getExpectedDataRobustness();
const partiallyCorrectedDataRobustness = viewResponse.getPartiallyCorrectedDataRobustness();

const expectedDataFitness = viewResponse.getExpectedDataFitness();
const partiallyCorrectedDataFitness = viewResponse.getPartiallyCorrectedDataFitness();

chai.use(chaiHttp);

module.exports = function (validToken) {
	// 1st test group
	describe('POST => /api/ProfilePlayers/profileGameStats , should return 200 OK and data with valid token ', () => {
		it('A. profileGameStats - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlGameStat)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsGameStat) // Adding params
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

		it('B. profileGameStats - Test datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlGameStat)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsGameStat) // Adding params
				.then(res => {
					expect(res.body.avgMetrics).to.be.a('object');
					expect(res.body.avgPlanning).to.be.a('object');
					expect(res.body.matches).to.be.a('array');
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. profileGameStats - Test data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlGameStat)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsGameStat) // Adding params
				.then(res => {
					//expect(res.body).to.eql(expectedDataGameStat[0]);
					expect(res.body).not.eql(partiallyCorrectedDataGameStat[0]);
					expect(res.body.data).not.eql(viewResponse.wrongData);

					expect(res.body.avgMetrics.linkupPlays).to.be.null;
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});

	// 2nd test group
	describe('POST => /api/ProfilePlayers/profileRobustness , should return 200 OK and data with valid token ', () => {
		it('A. profileRobustness - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlRobustness)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsRobustness) // Adding params
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

		it('B. profileRobustness - Test datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlRobustness)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsRobustness) // Adding params
				.then(res => {
					expect(res.body).to.be.a('object');
					const playerKey = viewResponse.paramsRobustness.playerIds[0];
					expect(res.body[playerKey].appsBySubFormat).to.be.a('object');
					expect(res.body[playerKey].minutesPlayedBySubFormat).to.be.a('object');
					expect(res.body[playerKey].breakdownStatus).to.be.a('object');
					expect(res.body[playerKey].breakdown).to.be.a('object');
					expect(res.body[playerKey].periodBreakDown).to.be.a('object');
					expect(res.body[playerKey].monthBreakdown).to.be.a('object');
					expect(res.body[playerKey].healthStatus).to.be.a('string');
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. profileRobustness - Test data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlRobustness)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsRobustness) // Adding params
				.then(res => {
					const playerKey = viewResponse.paramsRobustness.playerIds[0];

					expect(res.body[playerKey].healthStatus).to.be.equal('fit');
					//expect(res.body[playerKey]).to.eql(expectedDataRobustness[0]);
					expect(res.body[playerKey]).not.eql(partiallyCorrectedDataRobustness[0]);
					expect(res.body[playerKey]).not.eql(viewResponse.wrongData);

					expect(res.body[playerKey].availability).to.be.null;
					expect(res.body[playerKey].gameRate).to.be.null;
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});

	// 3rd test group
	describe('POST => /api/ProfilePlayers/profileFitness , should return 200 OK and data with valid token ', () => {
		it('A. profileFitness - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlFitness)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsFitness) // Adding params
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

		it('B. profileFitness - Test datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlFitness)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsFitness) // Adding params
				.then(res => {
					expect(typeof res.body.testsValues).to.equal('object');
					expect(typeof res.body.lastResults).to.equal('object');
					expect(typeof res.body.lastResults.Abdominal).to.equal('object');

					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. profileFitness - Test data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlFitness)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsFitness) // Adding params
				.then(res => {
					expect(res.body.lastResults.Abdominal.testName).to.be.equal('Anthropometry');
					expect(res.body.lastResults.Abdominal.testId).to.be.equal('5ba11a07341d8f054170e4a1');
					expect(res.body).to.eql(expectedDataFitness[0]);
					expect(res.body).not.eql(partiallyCorrectedDataFitness[0]);
					expect(res.body.data).not.eql(viewResponse.wrongData);

					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});
};
