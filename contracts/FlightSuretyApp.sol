pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;
    
    uint256 constant oneEther = 1000000000000000000; //wei

    address private contractOwner;          // Account used to deploy contract
    address private contractFirstAirline;
    bool isInitialized = false;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    event insuranceReturn(uint256 amount);
 
    FlightSuretyData flightSuretyData;
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
        require(true, "Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor
                                (
                                    address dataContract,
                                    address firstAirline
                                ) 
                                public
    {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract);
        initialize(firstAirline);
    }
    
    function initialize(address firstAirline) internal {
        require(!isInitialized, "Contract is already initialized!");
        contractFirstAirline = firstAirline;
        flightSuretyData.initFirstAirline(contractFirstAirline);
        isInitialized = true;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() 
                            public 
                            view
                            returns(bool) 
    {
        return flightSuretyData.isOperational();
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
   /**
    * @dev Add an airline to the registration queue
    *
    */   
    function registerAirline
                            (   
                                address airline,
                                address caller
                            )
                            external
                            requireIsOperational
                            returns (bool)
    {
       return flightSuretyData.registerAirline(airline, caller);
    }

    function isAirlineRegistered
                                (
                                    address airline
                                )
                                external
                                requireIsOperational
                                returns (bool)
    {
        return flightSuretyData.isAirlineRegistered(airline);
    }

    function isAirlineFunded
                            (
                                address airline
                            )
                            external
                            requireIsOperational
                            returns (bool)
    {
        return flightSuretyData.isAirlineFunded(airline);
    }

    function fund() public payable
    {
        flightSuretyData.fund();
    }

    function sendFund(address airline, uint256 amount) public payable
    {
        flightSuretyData.sendFund(airline, amount);
    }

    function getFund(address airline) public returns(uint256)
    {
        return flightSuretyData.getFund(airline);
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
                                (
                                    address airline,
                                    string flightNumber,
                                    uint256 timestamp
                                )
                                external
                                requireIsOperational
                                returns(bool success)
    {
        require(flightSuretyData.isAirlineRegistered(airline), "Cannot register a flight unless the airline is registered.");
        bytes32 flightKey = getFlightKey(airline, flightNumber, timestamp);
        flights[flightKey] = Flight ({
                                        isRegistered: true,
                                        statusCode: STATUS_CODE_UNKNOWN,
                                        updatedTimestamp: timestamp,       
                                        airline: airline
                                    });
       
        success = true;
    }

    function isFlightRegistered (
                                    address airline,
                                    string flightNumber,
                                    uint256 timestamp
                                )
                                public
                                requireIsOperational
                                returns(bool)
    {
        bytes32 flightKey = getFlightKey(airline, flightNumber, timestamp);
        return flights[flightKey].isRegistered;
    }

    function isValidInsuranceFee(uint256 insuranceFee) internal requireIsOperational returns (bool)
    {
        if ((0< insuranceFee) && ( insuranceFee <= oneEther))
        {
            return true;
        }
        return false;
    }

    function buyInsurance 
                                (
                                    address airline,
                                    string flightNumber,
                                    uint256 timestamp,
                                    uint256 payInsurance
                                )
                                public
                                payable
                                requireIsOperational
    {
        
        require(isValidInsuranceFee(payInsurance), "Cannot buy insurance unless pay less than 0 ether or more than 1 either.");
        require(flightSuretyData.isAirlineRegistered(airline), "Cannot buy insurance from an airline unless the airline is registered.");
        require(flightSuretyData.isAirlineFunded(airline), "Cannot buy insurance from an airline unless the airline is funded.");
        require(isFlightRegistered(airline, flightNumber, timestamp), "Cannot buy insurance for a flight unless the flight is registered.");
        bytes32 flightKey = getFlightKey(airline, flightNumber, timestamp);
        if (payInsurance > 0)
        {
            //msg.sender is the passenger buy the insurance
            flightSuretyData.buy(flightKey, payInsurance, msg.sender);
        }
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp,
                                    uint8 statusCode,
                                    address passenger
                                )
                                public
                                requireIsOperational
    {
        if (statusCode == STATUS_CODE_LATE_AIRLINE)
        {
            //issue credit for each passenger bought the insurance
            bytes32 flightKey = getFlightKey(airline, flight, timestamp);
            //this processFlightStatus is handled in the submoracleresponse
            //msg.sender is the confirmer of the flight status, not the passenger
            //use passenger to be specific
            flightSuretyData.creditInsurees(flightKey,passenger);
        }
    }

    /**
    * @dev Called to get insurance return
    * insurance return in unit of wei
    */ 
    function getInsuranceReturn  (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp
                                )
                                public
                                payable
                                requireIsOperational
    {
            bytes32 flightKey = getFlightKey(airline, flight, timestamp);
            //msg.sender is the passenger to get the insurance return
            uint256 refund =  flightSuretyData.pay(flightKey, msg.sender);
            msg.sender.transfer(refund);
            emit insuranceReturn(refund);
    }

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status, address confirmer);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp, address passenger);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp                            
                        )
                        external
                        requireIsOperational
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        // msg.sender is the passenger is request flight status
        // user passenger to be consistent
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp, msg.sender);
    } 


    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode,
                            address passenger
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        //require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");
        if (oracleResponses[key].isOpen) 
        {
            oracleResponses[key].responses[statusCode].push(msg.sender);

            // Information isn't considered verified until at least MIN_RESPONSES
            // oracles respond with the *** same *** information
            emit OracleReport(airline, flight, timestamp, statusCode);
            if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

                emit FlightStatusInfo(airline, flight, timestamp, statusCode, msg.sender);

                // Handle flight status as appropriate
                // msg.sender is the confirmer of the flight status, which will be issue the credit to
                // this is not correct
                processFlightStatus(airline, flight, timestamp, statusCode, passenger);
            }
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   


contract FlightSuretyData {
    function registerAirline(   
                                address newairline,
                                address caller
                            )
                            external
                            returns (bool);
    function isAirlineRegistered    
                            (
                                address airline
                            )
                            public
                            view
                            returns(bool);
    function isAirlineFunded
                            (
                                address airline
                            )
                            public
                            view
                            returns(bool);

    function isOperational() 
                            public 
                            view 
                            returns(bool);
    function fund() public payable;
    function initFirstAirline(address firstAirline) external;
    function getFund(address airline) public view returns (uint256);
    function sendFund(address airline, uint256 amount) public payable;
    function buy
                ( 
                    bytes32 flightKey,
                    uint256 insuraceFee,
                    address user                            
                )
                external
                payable;
    function pay
                (
                    bytes32 flightKey,
                    address user
                )
                external
                returns (uint256);
    function creditInsurees
                            (
                                bytes32 flightKey,
                                address user
                            )
                            external;
}