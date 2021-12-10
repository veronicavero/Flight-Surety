import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express, { response } from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

let STATUS_CODES = [STATUS_CODE_UNKNOWN, STATUS_CODE_ON_TIME, STATUS_CODE_LATE_AIRLINE, STATUS_CODE_LATE_WEATHER, STATUS_CODE_LATE_TECHNICAL, STATUS_CODE_LATE_OTHER];

  function initialAccounts() {
    return new Promise((resolve, reject) => {
                  //asynchronous call
              web3.eth.getAccounts()
                                    .then(accounts => {
                                                        web3.eth.defaultAccount = accounts[0];
                                                        resolve(accounts);
                                          })
                                    .catch(err =>{console.log("failed to init accounts");
                                                reject(err)});
                              });
  }

  function initialOrales(accounts) {
    return new Promise((resolve, reject) =>{
      let counts = accounts.length;
      let oracles =[];
      console.log(accounts);
      flightSuretyApp.methods.REGISTRATION_FEE().call()
              .then(fee => {
                  console.log("fee %s:", fee);
                  accounts.forEach(account =>{     
                                  flightSuretyApp.methods.registerOracle().send({from: account, value: fee, gasPrice:0, gas: 6666666})
                                            .then(() => {
                                                flightSuretyApp.methods.getMyIndexes().call({from: account})
                                                  .then(result=> {
                                                        console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
                                                        oracles.push(result);
                                                        counts --;
                                                        if(counts<=0)
                                                          resolve(oracles);})
                                                  .catch(err => {
                                                    console("register oracle failed %s:", err);
                                                    reject(err)});
                                                })
                                            .catch(err =>{
                                              console("register oracle failed %s:", err);
                                              reject(err)});
                              });
              })
              .catch(err => {
                console("register oracle failed %s:", err); 
                reject(err);
              });
  });
}

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/* Function call tester
function initFee() {
  return new Promise((resolve, reject) => {
    console.log("invoke")
    flightSuretyApp.methods.REGISTRATION_FEE().call((error, result) => {
      console.log("get fee.")
      if (error) reject(error);
      console.log("result: %s", result);
      resolve(result);
    });
  });
}

initFee().then(fee => console.log("get fee: %s",fee))
         .catch(err => {console.log("get fee failed: ", err)});
*/

initialAccounts()
                .then(accounts => {
                  initialOrales(accounts).then((oracles)=> {
                                                console.log(oracles);
                                                //listen to event OracleRequest
                                                flightSuretyApp.events.OracleRequest({
                                                  fromBlock: "latest"
                                                }, function (error, event) {
                                                  console.log("at here.");
                                                  if (error) console.log(error)
                                                  console.log("here");
                                                  var index = event.returnValues.index;
                                                  //console.log(index);
                                                  var airline = event.returnValues.airline;
                                                  //console.log(airline);
                                                  var flight = event.returnValues.flight;
                                                  //console.log(flight);
                                                  var timestamp = event.returnValues.timestamp;

                                                  var passenger = event.returnValues.passenger;
                                                  
                                                  var matched = false;
                                                  
                                                  //random select a status code
                                                  var randomIndex = randomIntFromInterval(0, STATUS_CODES.length-1);
                                                  //var selected_status_code = STATUS_CODES[randomIndex];
                                                  var selected_status_code = STATUS_CODE_LATE_AIRLINE;

                                                  //for each registered oracle to try to find a match
                                                  oracles.forEach((oracle, index) => {
                                                      // if(matched) {
                                                      //   return false;
                                                      // }
                                                      for(let idx=0;idx<3;idx++) {
                                                        // if(matched) {
                                                        //   break;
                                                        // }

                                                        // if(selected_status_code == STATUS_CODE_LATE_AIRLINE) {
                                                        //   flightSuretyApp.methods.processFlightStatus(airline, flight, timestamp, selected_status_code)
                                                        //     .send({from:accounts[index], gasPrice:0, gas: 6666666})
                                                        //     .then(result => {console.log(`Flight ${flight} issues credit for users.`)})
                                                        //     .catch(err => {console.log("Issue credit failed %s", err)});
                                                        // }
                                                        console.log(`\nOracle index: %s`, oracle[idx]);
                                                        // Submit a response...it will only be accepted if there is an Index match
                                                        flightSuretyApp.methods.submitOracleResponse(oracle[idx], airline, flight, timestamp, selected_status_code, passenger)
                                                          .send({from:accounts[index], gasPrice:0, gas: 6666666})
                                                          .then(() => {
                                                            //matched = true;
                                                            console.log(`Oracle: ${oracle[idx]} submit flight ${flight} status ${selected_status_code}`);
                                                          })
                                                          .catch(err => {console.log(err.message)});
                                                      }
                                                  });
                                                });
                                              })
                                          .catch(err => {console.log("failed to initial oracles %s", err)});
                  })
                .catch(err => {console.log("Failed to init accounts %s", err);
        });

/* Function call tester
function sendFund(airline,fund, caller) {
  return new Promise((resolve, reject) =>{
  flightSuretyApp.methods
      .sendFund(airline, fund)
      .send({from: caller, gasPrice:0, gas: 6666666}, (error, result) => {
        if(error) reject(error);
          resolve(result);
      });
    });
}

initialAccounts().then(accounts => {sendFund(accounts[1],10, accounts[0])
                                        .then(()=>{console.log("send funds")})
                                        .catch(err => console.log(err))});
 */

  // flightSuretyApp.events.OracleRequest({
  //     fromBlock: 0
  //   }, function (error, event) {
  //     console.log("at here.");
  //     if (error) console.log(error)
  //     console.log("here");
  //     //console.log(event);
  //     //for each oracle, random decide to return the status code

  //     // for(let a=1; a<TEST_ORACLES_COUNT; a++) {
  //     //   console.log("get here.");
  //     //   // Get oracle information
  //     //   let oracleIndexes = flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
  //     //   console.log("get orcale index.");
  //     //   for(let idx=0;idx<3;idx++) {
  //     //     console.log(`\nOracle index: %s`, oracleIndexes[idx]);
  //     //     try {
  //     //       // Submit a response...it will only be accepted if there is an Index match
  //     //       flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });

  //     //     }
  //     //     catch(e) {
  //     //       console.log(e);
  //     //       // Enable this when debugging
  //     //        console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
  //     //     }

  //     //   }
  //     // }
  // });

  // flightSuretyApp.events.FlightStatusInfo({
  //   fromBlock: 0
  // }, function (error, event) {
  //   if (error) console.log(error)
  //   console.log(event)
  // });

  // flightSuretyApp.events.OracleReport({
  //   fromBlock: 0
  // }, function (error, event) {
  //   if (error) console.log(error)
  //   console.log(event)
  // });


console.log("reach here");
const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


