var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');

contract('Passengers', async (accounts) => {

  const TEST_ORACLES_COUNT = 10;
      // Watch contract events
      const STATUS_CODE_UNKNOWN = 0;
      const STATUS_CODE_ON_TIME = 10;
      const STATUS_CODE_LATE_AIRLINE = 20;
      const STATUS_CODE_LATE_WEATHER = 30;
      const STATUS_CODE_LATE_TECHNICAL = 40;
      const STATUS_CODE_LATE_OTHER = 50;

      let flight = 'ND1309'; // Course number
      let timestamp = Math.floor(Date.now() / 1000);

      var AirlineLateFound = false;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);

    // // Watch contract events
    // const STATUS_CODE_UNKNOWN = 0;
    // const STATUS_CODE_ON_TIME = 10;
    // const STATUS_CODE_LATE_AIRLINE = 20;
    // const STATUS_CODE_LATE_WEATHER = 30;
    // const STATUS_CODE_LATE_TECHNICAL = 40;
    // const STATUS_CODE_LATE_OTHER = 50;

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

  it('can buy insurance', async () => {
    
    // ARRANGE
    // let flight = 'ND1309'; // Course number
    // let timestamp = Math.floor(Date.now() / 1000);

    // register an airline
    // first airline is already registered at deployment time
    // fund the first airline
    let fund = 10;
    await config.flightSuretyApp.sendFund(config.firstAirline, fund, {from: config.owner, gasPrice:0});

    let amount = await config.flightSuretyApp.getFund.call(config.firstAirline, {from: config.owner, gasPrice:0});;
    //await debug(amount.toNumber());
    assert.equal(amount, fund, "sendFund does not work correctly.");

    // Register a flight for insurance
    try {
        await config.flightSuretyApp.registerFlight(config.firstAirline, flight, timestamp);
    } catch(e) {
        console.log(e)
    }
    // ACT
    let result = await config.flightSuretyApp.isFlightRegistered.call(config.firstAirline, flight, timestamp);

    assert.equal(result, true, "flight is registered");

    //buy insurance of the flight
    //let insuranceFee = 100000000000000000; //wei
    //let insuranceFee = ethers.BigNumber.from("1").pow(18);
    let insuranceFee = web3.utils.toBN("1000000000000000000");
    try {
        await config.flightSuretyApp.buyInsurance(config.firstAirline, flight, timestamp, insuranceFee, {from:config.firstAirline, gasPrice:0, gas:666666});
    } catch(e) {
        console.log(e)
    }

  });

  it('can request flight status', async () => {
    
    // ARRANGE
    // let flight = 'ND1309'; // Course number
    // let timestamp = Math.floor(Date.now() / 1000);

    // let fund = 10;
    // await config.flightSuretyApp.sendFund(config.firstAirline, fund, {from: config.owner, gasPrice:0});

    // let amount = await config.flightSuretyApp.getFund.call(config.firstAirline, {from: config.owner, gasPrice:0});;
    // //await debug(amount.toNumber());
    // assert.equal(amount, fund, "sendFund does not work correctly.");

    config.flightSuretyApp.contract.events.allEvents((error, result) => {
      if (error)
      {
        console.log(error);
      } else {
        //console.log(result);

        // if (result.event === 'insuranceReturn') {
        //   console.log(result.returnValues);
        //   //var refund = result.returnValues.amount;
        //   //console.log("get refund: ", refund);
        // }
       
        // if (result.event === 'OracleReport') {
        //   var airline = result.returnValues.airline;
        //   //console.log(airline);
        //   var flight = result.returnValues.flight;
        //   //console.log(flight);
        //   var timestamp = result.returnValues.timestamp;
        //   //console.log(timestamp);
        //   var statusCode = result.returnValues.status;
        //   //console.log(statusCode);
        //   console.log(`\nOracle Report: Airline: %s, flight: %s, timestamp: %s, statusCode: %s`, airline, flight, timestamp, statusCode);
        // } 
        if (result.event === 'FlightStatusInfo') {
          var airline = result.returnValues.airline;
          //console.log(airline);
          var flight = result.returnValues.flight;
          //console.log(flight);
          var timestamp = result.returnValues.timestamp;
          //console.log(timestamp);
          var statusCode = result.returnValues.status;

          var confirmer = result.returnValues.confirmer;

          console.log(`\nOracle Status: Airline: %s, flight: %s, timestamp: %s, statusCode: %s, confirmer: %s`, airline, flight, timestamp, statusCode, confirmer);

          if (statusCode == 20) {
            console.log("set airlineLateFound to be true")
            AirlineLateFound = true;
          }
          // // check status code
          // if (statusCode === STATUS_CODE_LATE_AIRLINE) {
          //   //request refund
          //   try {
          //     config.flightSuretyApp.getInsuranceReturn(airline, flight, timestamp, {from: config.firstAirline});
          //   } catch (e) {
          //     console.log(e);
          //   }
          // }
        }
        
        // if (result.event === 'insuranceReturn') {
        //   console.log(result.returnValues);
        //   //var refund = result.returnValues.amount;
        //   //console.log("get refund: ", refund);
        // }
                // if (result.event === 'OracleRequest')
                // {
                //   //index, airline, flight, timestamp
                //   var index = result.returnValues.index;
                //   var airline = result.returnValues.airline;
                //   //console.log(airline);
                //   var flight = result.returnValues.flight;
                //   //console.log(flight);
                //   var timestamp = result.returnValues.timestamp;
                //   //console.log(timestamp);
                //   console.log(`\nOracle Request: index: %s, Airline: %s, flight: %s, timestamp: %s`, index, airline, flight, timestamp);
                // }
      }
      
    });

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp, {from:config.firstAirline});
    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
      for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_LATE_AIRLINE, config.firstAirline,{ from: accounts[a] });

        }
        catch(e) {
          console.log(e);
          // Enable this when debugging
           console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }

      }
    }

    // try {
    //   await config.flightSuretyApp.getInsuranceReturn(config.firstAirline, flight, timestamp, {from: config.firstAirline});
    // } catch (e) {
    //   console.log(e);
    // }
  });

  it('can get refund', async () => {

    config.flightSuretyApp.contract.events.allEvents((error, result) => {
      if (error)
      {
        console.log(error);
      } else {
        //console.log(result);

        if (result.event === 'insuranceReturn') {
          console.log(result.returnValues);
          //var refund = result.returnValues.amount;
          //console.log("get refund: ", refund);
        }
      }
    });
  
    if(AirlineLateFound) {
      //request refund
      try {
        await debug(config.flightSuretyApp.getInsuranceReturn(config.firstAirline, flight, timestamp, {from: config.firstAirline}));
      } catch (e) {
        console.log(e);
      }
   }
  
  });

  // it('can process flight status', async () => {

  //   // config.flightSuretyApp.contract.events.allEvents((error, result) => {
  //   //   if (error)
  //   //   {
  //   //     console.log(error);
  //   //   } else {
  //   //     //console.log(result);

  //   //     if (result.event === 'insuranceReturn') {
  //   //       console.log(result.returnValues);
  //   //       //var refund = result.returnValues.amount;
  //   //       //console.log("get refund: ", refund);
  //   //     }
  //   //   }
  //   // });
  
  //   if(AirlineLateFound) {
  //     console.log("send process flight status request")
  //     //request refund
  //     try {
  //       await debug(config.flightSuretyApp.processFlightStatus(config.firstAirline, flight, timestamp, STATUS_CODE_LATE_AIRLINE, config.firstAirline, {from: config.firstAirline}));
  //     } catch (e) {
  //       console.log(e);
  //     }
  //  }
  
  // });
});