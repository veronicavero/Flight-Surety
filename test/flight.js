var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Flights', async (accounts) => {

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;
     // ARRANGE
    const flight = 'ND1309'; // Course number
    const timestamp = Math.floor(Date.now() / 1000);
    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
    });


  it('can register flight if airline is registered', async () => {
    // Register a flight for insurance
    try {
        await config.flightSuretyApp.registerFlight(config.firstAirline, flight, timestamp);
    } catch(e) {
        console.log(e)
    }
    // ACT
    let result = await config.flightSuretyApp.isFlightRegistered.call(config.firstAirline, flight, timestamp);

    assert.equal(result, true, "flight is registered");

  });


  it('can NOT register flight if airline is NOT registered', async () => {
    let newAirline = accounts[2];
    // Register a flight for insurance
    try {
        await config.flightSuretyApp.registerFlight(newAirline, flight, timestamp);
    } catch(e) {
        //console.log(e)
    }
    // ACT
    let result = await config.flightSuretyApp.isFlightRegistered.call(newAirline, flight, timestamp);

    assert.equal(result, false, "flight is NOT registered");

  });

  it('can NOT buy insurance for a registered flight unless the airline is registered and funded', async () => {
    // Register a flight for insurance
    let insuranceFee = 1000; //wei
    var funded = false;
    try {
        await config.flightSuretyApp.buyInsurance(config.firstAirline, flight, timestamp, insuranceFee);
        funded = true;
    } catch(e) {
        //console.log(e);
        funded = false;
    }
    // ACT
    assert.equal(funded, false, "Cannot buy insurance from an airline unless the airline is registered and funded.");

  });

  it('can buy insurance for a registered flight from the airline is registered and funded', async () => {

    let fund = 10;
    await config.flightSuretyApp.sendFund(config.firstAirline, fund, {from: config.owner, gasPrice:0});

    let amount = await config.flightSuretyApp.getFund.call(config.firstAirline, {from: config.owner, gasPrice:0});;
    //await debug(amount.toNumber());
    assert.equal(amount, fund, "sendFund does not work correctly.");

    // Register a flight for insurance
    let insuranceFee = 1000; //wei
    var funded = false;
    try {
        await config.flightSuretyApp.buyInsurance(config.firstAirline, flight, timestamp, insuranceFee);
        funded = true;
    } catch(e) {
        //console.log(e);
        funded = false;
    }
    // ACT
    assert.equal(funded, true, "Can buy insurance from an airline unless the airline is registered and funded.");

  });

});