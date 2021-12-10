
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
//const { debug } = require('webpack');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    //console.log(config.firstAirline);
    //console.log(config.owner);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
    await config.flightSuretyData.setOperatingStatus(true);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  //Test 1
  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  //Test 2
  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  //Test 3
  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  //Test 4
  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  //Test 5
  it('(first airline) is registered after deployment', async () => {
    
    let result = await config.flightSuretyApp.isAirlineRegistered.call(config.firstAirline); 

    // ASSERT
    assert.equal(result, true, "First airline should be registered");

  });

  it('(first airline) is NOT funded after deployment', async () => {
    
    let result = await config.flightSuretyApp.isAirlineFunded.call(config.firstAirline); 

    // ASSERT
    assert.equal(result, false, "First airline is NOT funded");

  });

  //Test 6
  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, config.firstAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

    // //Test 6
    // it('(a registered airline) can send funds to an airline ', async () => {

    //     // ARRANGE
    //     let newAirline = accounts[2];

    //     let fund = 10;
    //     await config.flightSuretyApp.sendFund(newAirline, fund, {from: config.firstAirline, gasPrice:0});

    //     let amount = await config.flightSuretyApp.getFund.call(newAirline, {from: config.firstAirline, gasPrice:0});
    //     // ASSERT
    //     assert.equal(amount, fund, "sendFund does not work correctly.");

    //     let result = await config.flightSuretyData.isAirlineFunded.call(newAirline, {from: config.firstAirline, gasPrice:0}); 
    //     // ASSERT
    //     assert.equal(result, true, "Airline is funded after sending funds");

    // });

    //Test 7
    it('(airline) can send funds to an airline', async () => {

        // ARRANGE
        let newAirline = accounts[2];

        let fund = 10;
        await config.flightSuretyApp.sendFund(newAirline, fund, {from: config.firstAirline, gasPrice:0});

        let amount = await config.flightSuretyApp.getFund.call(newAirline, {from: config.firstAirline, gasPrice:0});
        // ASSERT
        assert.equal(amount, fund, "sendFund does not work correctly.");

        let result = await config.flightSuretyData.isAirlineFunded.call(newAirline, {from: config.firstAirline, gasPrice:0}); 
        // ASSERT
        assert.equal(result, true, "Airline is funded after sending funds");

    });
  
    //Test 8
    it('(airline) can register an Airline using registerAirline() if it is funded', async () => {

        // ARRANGE
        let newAirline = accounts[2];

        //let fund = web3.utils.toWei("10", "ether");
        let fund = 10;
        await config.flightSuretyApp.sendFund(config.firstAirline, fund, {from: config.owner, gasPrice:0});

        let amount = await config.flightSuretyApp.getFund.call(config.firstAirline, {from: config.owner, gasPrice:0});;

        //await debug(amount.toNumber());
        assert.equal(amount, fund, "sendFund does not work correctly.");
        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, config.firstAirline, {from: config.firstAirline});
        }
        catch(e) {
            console.log(e)
        }

        let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline, {from: config.owner, gasPrice:0}); 

        // ASSERT
        assert.equal(result, true, "Airline should be able to register another airline if it has provided funding");

    });
 
    //Test 9
    it('(airline) can register an Airline using registerAirline() if it is funded up to 4', async () => {

        // ARRANGE
        let newAirline2 = accounts[3];
        let newAirline3 = accounts[4];

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline2, config.firstAirline, {from: config.firstAirline});
        }
        catch(e) {
            console.log(e)
        }

        let result2 = await config.flightSuretyData.isAirlineRegistered.call(newAirline2, {from: config.owner, gasPrice:0}); 

        // ASSERT
        assert.equal(result2, true, "Airline should be able to register another airline if it has provided funding");

        try {
            await config.flightSuretyApp.registerAirline(newAirline3, config.firstAirline, {from: config.firstAirline});
        }
        catch(e) {
            console.log(e)
        }

        let result3 = await config.flightSuretyData.isAirlineRegistered.call(newAirline3, {from: config.owner, gasPrice:0}); 

        // ASSERT
        assert.equal(result3, true, "Airline should be able to register another airline if it has provided funding");

    });

    //Test 10
    it('(multiparty) can NOT register an Airline using registerAirline() if registered and airlines voted to NOT register', async () => {

        // ARRANGE
        let newAirline4 = accounts[5];
        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline4, config.firstAirline, {from: config.firstAirline});
        }
        catch(e) {
            console.log(e)
        }

        let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline4, {from: config.owner, gasPrice:0}); 

        // ASSERT
        assert.equal(result, false, "Airline should NOT be able to register another airline if if registered and airlines voted to NOT register");
    });

     //Test 10
     it('(multiparty) can NOT register an Airline using registerAirline() if registered and airlines voted NOT to register', async () => {

        // ARRANGE
        let newAirline5 = accounts[6];
        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline5, config.firstAirline, {from: config.firstAirline});
        }
        catch(e) {
            console.log(e)
        }

        let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline5, {from: config.owner, gasPrice:0}); 

        // ASSERT
        assert.equal(result, false, "Airline should be able to register another airline if if registered and airlines voted NOT to register");

    });

    //Test 11
    it('(multiparty) can register an Airline using registerAirline() if registered and airlines voted to register', async () => {

        let fundAirline = accounts[3];
        //console.log(fundAirline);
        let fund = 10;
        await config.flightSuretyApp.sendFund(fundAirline, fund, {from: fundAirline, gasPrice:0});

        let amount = await config.flightSuretyApp.getFund.call(fundAirline, {from: fundAirline, gasPrice:0});
        // ASSERT
        assert.equal(amount, fund, "sendFund does not work correctly.");

        let fundResult = await config.flightSuretyData.isAirlineFunded.call(fundAirline, {from: fundAirline, gasPrice:0}); 
        // ASSERT
        assert.equal(fundResult, true, "Airline is funded after sending funds"); 


        // ARRANGE
        let newAirline5 = accounts[5];
        //console.log(newAirline5);
        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline5, config.firstAirline, {from: config.firstAirline});
        }
        catch(e) {
            console.log(e)
        }

        let result = await config.flightSuretyData.isAirlineRegistered.call(newAirline5, {from: config.owner, gasPrice:0}); 

        // ASSERT
        assert.equal(result, true, "Airline should be able to register another airline if if registered and airlines voted to register");

    });
    // //Test 6
    // it('(airline) can send funds to itself', async () => {

    //     // ARRANGE
    //     let newAirline = accounts[2];

    //     let fund = 10;
    //     await config.flightSuretyApp.sendFund(newAirline, fund, {from: newAirline, gasPrice:0});

    //     let amount = await config.flightSuretyApp.getFund.call(newAirline, {from: newAirline, gasPrice:0});;

    //     let result = await config.flightSuretyData.isAirlineFunded.call(newAirline, {from: newAirline, gasPrice:0}); 

    //     // ASSERT
    //     assert.equal(result, true, "Airline should be able to register another airline if it has provided funding");

    // });
});
