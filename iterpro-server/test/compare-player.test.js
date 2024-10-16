'use strict';
/**
 * This is test class for ComparePlayersStatsService...
 * comparePlayerStats
 * CompareTeamStats
 *
 */
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../server/server');
const viewResponse = require('./compare-player-response');
const expectedArrayData = viewResponse.getExpectedData();
const partiallyCorrectedArrayData = viewResponse.getPartiallyCorrectedData();
const expectedArrayDataForTeam = viewResponse.getExpectedDataForTeam();
const partiallyCorrectedArrayDataForTeam = viewResponse.getPartiallyCorrectedDataForTeam();

chai.use(chaiHttp);

module.exports = function (validToken) {
	// First test group
	describe('POST => /api/ComparePlayersStats/comparePlayerStats , should return 200 OK and data with valid token ', () => {
		it('A. ComparePlayersStats - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrl)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.params) // Adding params
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

		it('B. ComparePlayersStats - Test Datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrl)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.params) // Adding params
				.then(res => {
					expect(typeof res.body.gps).to.equal('object');
					expect(res.body.playerStats).to.be.instanceof(Array);
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. ComparePlayersStats - Test data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrl)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.params) // Adding params
				.then(res => {
					expect(res.body.gps[0]._id).to.exist;
					expect(res.body.gps[0]).to.eql(expectedArrayData[0].gps[0]);
					expect(res.body[0]).not.eql(partiallyCorrectedArrayData[0]);
					expect(res.body.data).not.eql(viewResponse.wrongData);

					expect(res.body.gps[0].averageMetabolicPower).to.equal(9.951633333333334);
					expect(res.body.gps[0].highspeedRunningDistance).to.equal(516.8981666666667);
					expect(res.body.gps[0].powerPlays).to.equal(51.666666666666664);
					expect(res.body.playerStats).to.be.empty;
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});

	// Second test group
	describe('POST => /api/ComparePlayersStats/compareTeamStats , should return 200 OK and data with valid token ', () => {
		it('A. CompareTeamStats - Test 200 OK response', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlForTeam)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsForTeam) // Adding params
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

		it('B. CompareTeamStats - Test Datatypes', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlForTeam)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsForTeam) // Adding params
				.then(res => {
					expect(typeof res.body).to.equal('object');
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});

		it('C. CompareTeamStats - Test data', done => {
			chai
				.request(app)
				.post(viewResponse.expectedEndpointUrlForTeam)
				.set('Authorization', validToken) // setting token
				.send(viewResponse.paramsForTeam) // Adding params
				.then(res => {
					expect(res.body._id).to.be.null;
					expect(res.body).not.eql(partiallyCorrectedArrayDataForTeam[0]);
					done(); // complete async request : chai.request()
				})
				.catch(err => {
					console.log(err.message);
				});
		});
	});
};
