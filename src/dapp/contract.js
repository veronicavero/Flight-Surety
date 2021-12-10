import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json'
import Config from './config.json';
import Web3 from 'web3';

//// first airline is set by the depolyment and it is not any account in Ganache
//// first airline is registered via deployment
let firstAirline = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url));
        console.log("start init at: %s", Math.floor(Date.now() / 1000));
        console.log("0");
        this.initialize(callback);
       // this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
       console.log("done init at: %s", Math.floor(Date.now() / 1000));
       console.log("1");
       //console.log(this.airlines);
        //this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress, config.dataAddress, this.airlines[1]);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        //this.initialize(callback);
        console.log("3");
        this.owner = null;
        console.log("4");
        this.airlines = [];
        console.log("5");
        this.passengers = [];
        console.log("6");
        this.config = config;
        this.firstAirline = firstAirline;
        this.flights = [];
        this.timestamp = Math.floor(Date.now() / 1000);
    }

    initialize(callback) {
        //asynchronous call
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];
            console.log(this);
            console.log("now: ", Math.floor(Date.now() / 1000));
            console.log("2");
            let counter = 1;
            
            while(this.airlines.length < 5) {
                var airline = accts[counter++];
                this.airlines.push(airline);
                var airlineFlight = {
                    airline: airline,
                    flight: "NO120"+counter
                };
                this.flights.push(airlineFlight);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }
            //console.log(this.config.appAddress);
            //this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, this.config.appAddress, this.config.dataAddress, this.airlines[1]);
            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    registerAirline(airline, caller, callback) {
        let self = this;
        console.log(self);
        self.flightSuretyApp.methods
             .registerAirline(airline, caller)
             .send({ from: self.owner, gasPrice:0, gas: 6666666}, (error, result) => {
                // const {0: variable_1, 1: variable_2} = result;
                // console.log(variable_1);
                // console.log(variable_2);
                callback(error, result);
            });
    }

    isAirlineRegistered(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isAirlineRegistered(airline)
            .call({from: self.owner}, callback);
    }

    isAirlineFunded(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isAirlineFunded(airline)
            .call({from: self.owner}, callback);
    }

    getFund(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .getFund(airline)
            .call({from: self.owner}, callback);
    }


    sendFund(airline,fund, callback) {
        let self = this;
        console.log(self.firstAirline);
        self.flightSuretyApp.methods
            .sendFund(airline, fund)
            .send({from: self.owner, gasPrice:0, gas: 6666666}, (error, result) => {
                callback(error, result);
            });
    }

    registerFlight(airline,flightNumber,timestamp, callback) {
        let self = this;
        console.log(self);
        self.flightSuretyApp.methods
             .registerFlight(airline, flightNumber, timestamp)
             .send({ from: self.owner, gasPrice:0, gas: 6666666}, (error, result) => {
                // const {0: variable_1, 1: variable_2} = result;
                // console.log(variable_1);
                // console.log(variable_2);
                callback(error, result);
            });
    }

    buyFlightInsurance(airline, flight, timestamp, passenger, payInsurance, callback) {
        let self = this;
        let insuranceFee = payInsurance * 1000000;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp,
            payInsurance: insuranceFee
        }
        self.flightSuretyApp.methods
            .buyInsurance(payload.airline, payload.flight, payload.timestamp, payload.payInsurance)
            .send({from: passenger,  gasPrice:0, gas: 6666666}, (error, result) => {
                callback(error, result);
            });
    }

    fetchFlightStatus(airline, flight, timestamp, passenger, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: passenger}, (error, result) => {
                callback(error, result);
            });
    }

    getFlightInsurance(airline, flight, timestamp, passenger, callback) {
        let self = this;
        let payload = {
            airline: airline,
            flight: flight,
            timestamp: timestamp
        }
        self.flightSuretyApp.methods
            .getInsuranceReturn(payload.airline, payload.flight, payload.timestamp)
            .send({from: passenger,  gasPrice:0, gas: 6666666}, (error, result) => {
                callback(error, result);
            });
    }
}