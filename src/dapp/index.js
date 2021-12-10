
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        //Display airline options to register
        var select = document.getElementById("airline-options");
        var options=[];
        options.push("select one...");
        for(var i=0; i<contract.airlines.length;i++) {
            options.push(contract.airlines[i]);
        }
        
        // Optional: Clear all existing options first:
        select.innerHTML = "";
        // Populate list with options:
        for(var i = 0; i < options.length; i++) {
            var opt = options[i];
            select.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
        }

        var fundSelect =  document.getElementById("airline-fund");
        fundSelect.innerHTML = "";
        for(var i = 0; i < options.length; i++) {
            var opt = options[i];
            fundSelect.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
        }

        var getfundSelect =  document.getElementById("airline-get-fund");
        getfundSelect.innerHTML = "";
        for(var i = 0; i < options.length; i++) {
            var opt = options[i];
            getfundSelect.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
        }

        var getRegisterSelect =  document.getElementById("airline-get-register");
        getRegisterSelect.innerHTML = "";
        for(var i = 0; i < options.length; i++) {
            var opt = options[i];
            getRegisterSelect.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
        }

        var flights=[];
        flights.push("select one...");
        for(var i=0; i<contract.flights.length;i++) {
            var theObject = contract.flights[i];
            var theAirline = theObject.airline;
            var theFlight = theObject.flight;
            var opt = theAirline+","+theFlight;
            flights.push(opt);
        }
        var getFlightRegSelect =  document.getElementById("flight-options");
        getFlightRegSelect.innerHTML = "";
        for(var i = 0; i < flights.length; i++) {
            var opt = flights[i];
            getFlightRegSelect.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
        }


        var flightsInsurance=[];
        flightsInsurance.push("select one...");
        for(var i=0; i<contract.flights.length;i++) {
            var theObject = contract.flights[i];
            var theAirline = theObject.airline;
            var theFlight = theObject.flight;
            var thePassenger = contract.passengers[i];
            if (typeof thePassenger === 'undefined') {
                thePassenger = contract.passengers[0];
            }
            var opt = thePassenger + ","+theAirline+","+theFlight+ "," + (i+1);
            flightsInsurance.push(opt);
        }
        var getFlightInsuranceSelect =  document.getElementById("flight-insurance");
        getFlightInsuranceSelect.innerHTML = "";
        for(var i = 0; i < flightsInsurance.length; i++) {
            var opt = flightsInsurance[i];
            getFlightInsuranceSelect.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
        }

        var flightsStatus=[];
        flightsStatus.push("select one...");
        for(var i=0; i<contract.flights.length;i++) {
            var theObject = contract.flights[i];
            var theAirline = theObject.airline;
            var theFlight = theObject.flight;
            var thePassenger = contract.passengers[i];
            if (typeof thePassenger === 'undefined') {
                thePassenger = contract.passengers[0];
            }
            var opt = thePassenger + ","+theAirline+","+theFlight;
            flightsStatus.push(opt);
        }
        var getFlightStatusSelect =  document.getElementById("flight-status");
        getFlightStatusSelect.innerHTML = "";
        for(var i = 0; i < flightsStatus.length; i++) {
            var opt = flightsStatus[i];
            getFlightStatusSelect.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
        }

        var flightInsurance=[];
        flightInsurance.push("select one...");
        for(var i=0; i<contract.flights.length;i++) {
            var theObject = contract.flights[i];
            var theAirline = theObject.airline;
            var theFlight = theObject.flight;
            var thePassenger = contract.passengers[i];
            if (typeof thePassenger === 'undefined') {
                thePassenger = contract.passengers[0];
            }
            var opt = thePassenger + ","+theAirline+","+theFlight;
            flightInsurance.push(opt);
        }
        var getFlightInsuranceSelect =  document.getElementById("insurance-status");
        getFlightInsuranceSelect.innerHTML = "";
        for(var i = 0; i < flightInsurance.length; i++) {
            var opt = flightInsurance[i];
            getFlightInsuranceSelect.innerHTML += "<option value=\"" + opt + "\">" + opt + "</option>";
        }

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        // User-submitted transaction
        DOM.elid('airline-options').addEventListener('change', (e) => {
            console.log(e);
            let index = e.target.options.selectedIndex;
            console.log(index);
            if (index > 0) 
            {
                let airlineAddress = contract.airlines[index-1];
                console.log(airlineAddress);
 
                //check if first airline is funded
                contract.isAirlineFunded(contract.firstAirline, (error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(result);
                        if (!result) {
                            // fund first airline 
                            contract.sendFund(contract.firstAirline, 10, (error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(result);
                                    console.log("send funds to airline %s: ", contract.firstAirline);
                                    // Register the airline
                                    contract.registerAirline(airlineAddress, contract.firstAirline, (error, result) => {
                                        if (error)
                                        {
                                            //console.log(error);
                                            display('Airlines', 'Register airline', [ { label: airlineAddress, value: error}]);
                                        }
                                        else 
                                        {
                                            contract.isAirlineRegistered(airlineAddress, (er, res) => {
                                                display('Airlines', 'Register airline', [ { label: airlineAddress, error: er, value: res }]);
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            //Register the airline
                            //console.log("ready to register.")
                            contract.registerAirline(airlineAddress, contract.firstAirline, (error, result) => {
                                if (error)
                                {
                                    console.log(error);
                                    display('Airlines', 'Register airline', [ { label: airlineAddress, value: error}]);
                                }
                                else 
                                {
                                    contract.isAirlineRegistered(airlineAddress, (er, res) => {
                                        display('Airlines', 'Register airline', [ { label: airlineAddress, error: er, value: res }]);
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });

         // User-submitted transaction
         DOM.elid('airline-fund').addEventListener('change', (e) => {

            console.log(e);
            let index = e.target.options.selectedIndex;
            console.log(index);
            if (index > 0) 
            {
                let airlineAddress = contract.airlines[index-1];
                contract.sendFund(airlineAddress, 10, (error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(result);
                        console.log("send funds to airline %s: ", airlineAddress);
                    }
                });
            }
         });

        // User-submitted transaction
        DOM.elid('airline-get-fund').addEventListener('change', (e) => {

            console.log(e);
            let index = e.target.options.selectedIndex;
            console.log(index);
            if (index > 0) 
            {
                let airlineAddress = contract.airlines[index-1];
                contract.getFund(airlineAddress, (error, result) => {
                    display('Fund', 'Check an airline funds', [ { label: airlineAddress, error: error, value: result }]);
                    if (error) {
                        console.log(error);
                        //display('Fund', 'Airline Fund', [ { label: airlineAddress, error: error, value: result }]);
                    } else {
                        console.log(result);
                        //display('Fund', 'Airline Fund', [ { label: airlineAddress, error: error, value: result }]);
                        console.log("get funds of airline %s: , %s", airlineAddress, result);
                    }
                });
            }
        });

        // User-submitted transaction
        DOM.elid('airline-get-register').addEventListener('change', (e) => {

            console.log(e);
            let index = e.target.options.selectedIndex;
            console.log(index);
            if (index > 0) 
            {
                let airlineAddress = contract.airlines[index-1];
                contract.isAirlineRegistered(airlineAddress, (error, result) => {
                    display('Registration', 'Check if an airline is registered', [ { label: airlineAddress, error: error, value: result }]);
                    if (error) {
                        console.log(error);
                        //display('Registration', 'Check if an airline is registered', [ { label: airlineAddress, error: error, value: result }]);
                    } else {
                        console.log(result);
                        console.log("is airline registered %s: , %s", airlineAddress, result);
                    }
                });
            }
        });

        // User-submitted transaction
        DOM.elid('flight-options').addEventListener('change', (e) => {
            console.log(e);
            let index = e.target.options.selectedIndex;
            console.log(index);
            if (index > 0) 
            {
                let airlineFlight = contract.flights[index-1];
                let airlineAddress = airlineFlight.airline;
                let flight = airlineFlight.flight;
                contract.registerFlight(airlineAddress, flight, contract.timestamp, (error, result) => {
                    display('Register Flight', 'Register flight', [ { label: airlineFlight, error: error, value: result }]);
                });
            }
        });

        // Buy insurance
        DOM.elid('flight-insurance').addEventListener('change', (e) => {
            console.log(e);
            let index = e.target.options.selectedIndex;
            let passenger ="";
            console.log(index);
            if (index > 0) 
            {
                let airlineFlight = contract.flights[index-1];
                let airlineAddress = airlineFlight.airline;
                let flight = airlineFlight.flight;
                let passenger = contract.passengers[index-1];
                if (typeof passenger ==='undefined') {
                    passenger = contract.passengers[0];
                }
                contract.buyFlightInsurance(airlineAddress, flight, contract.timestamp, passenger, index, (error, result) => {
                    display('Insurance', 'Buy insurance for a flight', [ { label: airlineFlight, error: error, value: result }]);
                });
            }
        });

        // Check flight status
        DOM.elid('flight-status').addEventListener('change', (e) => {
            console.log(e);
            let index = e.target.options.selectedIndex;
            let passenger ="";
            console.log(index);
            if (index > 0) 
            {
                let airlineFlight = contract.flights[index-1];
                let airlineAddress = airlineFlight.airline;
                let flight = airlineFlight.flight;
                let passenger = contract.passengers[index-1];
                if (typeof passenger ==='undefined') {
                    passenger = contract.passengers[0];
                }
                contract.fetchFlightStatus(airlineAddress, flight, contract.timestamp, passenger, (error, result) => {
                    display('Oracles', 'Trigger oracles', [ { label: airlineFlight, error: error, value: result }]);
                });
            }
        });

        // get insurance refund
        DOM.elid('insurance-status').addEventListener('change', (e) => {
            console.log(e);
            let index = e.target.options.selectedIndex;
            let passenger ="";
            console.log(index);
            if (index > 0) 
            {
                let airlineFlight = contract.flights[index-1];
                let airlineAddress = airlineFlight.airline;
                let flight = airlineFlight.flight;
                let passenger = contract.passengers[index-1];
                if (typeof passenger ==='undefined') {
                    passenger = contract.passengers[0];
                }
                contract.getFlightInsurance(airlineAddress, flight, contract.timestamp, passenger, (error, result) => {
                    display('Insurance Claim', 'Get Insurance Refund', [ { label: airlineFlight, error: error, value: result }]);
                });
            }
        });

        // // User-submitted transaction
        // DOM.elid('submit-oracle').addEventListener('click', () => {
        //     let flight = DOM.elid('flight-number').value;
        //     // Write transaction
        //     contract.fetchFlightStatus(flight, (error, result) => {
        //         display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
        //     });
        // })
    
    });
    


})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-md-6 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-md-6 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}





