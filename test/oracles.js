
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 5;
  // Watch contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
  });


  it('can register oracles', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee, gasPrice:0 });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can request flight status', async () => {
    
    // ARRANGE
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);

    config.flightSuretyApp.contract.events.allEvents((error, result) => {
      if (error)
      {
        console.log(error);
      } else {
       
        if (result.event === 'OracleReport') {
          var airline = result.returnValues.airline;
          //console.log(airline);
          var flight = result.returnValues.flight;
          //console.log(flight);
          var timestamp = result.returnValues.timestamp;
          //console.log(timestamp);
          var statusCode = result.returnValues.status;
          //console.log(statusCode);
          console.log(`\nOracle Report: Airline: %s, flight: %s, timestamp: %s, statusCode: %s`, airline, flight, timestamp, statusCode);
        } 
        if (result.event === 'FlightStatusInfo') {
          var airline = result.returnValues.airline;
          //console.log(airline);
          var flight = result.returnValues.flight;
          //console.log(flight);
          var timestamp = result.returnValues.timestamp;
          //console.log(timestamp);
          var statusCode = result.returnValues.status;

          console.log(`\nOracle Status: Airline: %s, flight: %s, timestamp: %s, statusCode: %s`, airline, flight, timestamp, statusCode);
        } 
        if (result.event === 'OracleRequest')
        {
          //index, airline, flight, timestamp
          var index = result.returnValues.index;
          var airline = result.returnValues.airline;
          //console.log(airline);
          var flight = result.returnValues.flight;
          //console.log(flight);
          var timestamp = result.returnValues.timestamp;
          //console.log(timestamp);

          var passenger = result.returnValues.passenger;
          console.log(`\nOracle Request: index: %s, Airline: %s, flight: %s, timestamp: %s, passenger: %s`, index, airline, flight, timestamp, passenger);
        }
      }
      
    });

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});

      for(let idx=0;idx<3;idx++) {
        console.log(`\nOracle index: %s`, oracleIndexes[idx]);
        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, config.firstAirline,{ from: accounts[a] });

        }
        catch(e) {
          console.log(e);
          // Enable this when debugging
           console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }

      }
    }
  });

});
