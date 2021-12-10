pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    uint256 constant oneEther = 1000000000000000000; //wei

    address private contractFirstAirline;
    bool isInitialized = false;
    uint voteThreshold = 50;

    address[] registeredAirline;
    /*
    struct registeredAirline {
        address airline;
    }
    */

    struct airlineProfile {
        bool isRegistered;
        bool isFunded; //ether
        uint votes;
    }

    mapping(address => uint256) private authorizedContracts;
    mapping (address => airlineProfile) private airlineProfiles;

    mapping(address => uint256) private airlineFunds;
    uint256 totalFunds; //ether

    struct userProfile {
        bytes32 flightInsured;
        uint256 insuraceFee; //wei
        uint256 insuranceReturn; //wei
    }
    mapping(address => userProfile[]) private userInsuranceFee;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
    }

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
        require(operational, "Contract is currently not operational");
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

    modifier requireIsRegistered()
    {
        require(isAirlineRegistered(msg.sender), "message sender is not registered");
        _;
    }

    modifier requireIsFunded()
    {
        require(isAirlineFunded(msg.sender), "message sender is not funded");
        _;
    }

    modifier requireIsCallerAuthorized()
    {
        require(authorizedContracts[msg.sender] == 1, "Caller is not authorizedContracts");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner
    {
        operational = mode;
    }

    function addAirlineAddress(address _address) internal {
        registeredAirline.push(_address);
    }
        
    function getAllAirlineAddresses() internal view returns (address[] memory) {
        return registeredAirline;
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function initFirstAirline(address firstAirline) external requireIsOperational
    {
        require(!isInitialized, "Contract is already initialized!");
        airlineProfiles[firstAirline].isRegistered = true;
        airlineProfiles[firstAirline].isFunded = false;
        airlineProfiles[firstAirline].votes = 0;
        registeredAirline.push(firstAirline);
        contractFirstAirline = firstAirline;
        isInitialized = true;
    }

    function authorizeContract
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
                            requireIsOperational
    {
        require(contractAddress != address(0), "'contract Address' must be a valid address.");
        authorizedContracts[contractAddress] = 1;
    }

    function deauthorizeContract
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
                            requireIsOperational
    {
        require(contractAddress != address(0), "'contract Address' must be a valid address.");
        delete authorizedContracts[contractAddress];
    }

    function isAirlineRegistered
                            (
                                address airline
                            )
                            public
                            view
                            requireIsOperational
                            returns(bool)
    {
        require(airline != address(0), "'account' must be a valid address.");
        return airlineProfiles[airline].isRegistered;
    }

    function isAirlineFunded
                            (
                                address airline
                            )
                            public
                            view
                            requireIsOperational
                            returns(bool)
    {
        require(airline != address(0), "'account' must be a valid address.");
        return airlineProfiles[airline].isFunded;
    }

    function vote(address votee) internal requireIsOperational returns (bool)
    {
        require(votee != address(0), "'account' must be a valid address.");
        require(isAirlineRegistered(votee), "Cannot vote unless it is registered");
        require(isAirlineFunded(votee), "Cannot vote unless it is funded");
        //make the vote using random number
        uint voteCounts = airlineProfiles[votee].votes;
        if (voteCounts > 10) 
        {
            airlineProfiles[votee].votes = 0;
            return false;
        } else {
            return true;
        }
    }

    function canVote(address votee) public requireIsOperational returns (bool)
    {
        require(votee != address(0), "'account' must be a valid address.");
        return (isAirlineRegistered(votee) && isAirlineFunded(votee));
    }

    function allowToRegister() public requireIsOperational returns (bool)
    {
        uint256 votedAllow = 0;
        uint256 registeredCount = registeredAirline.length;
        
        for (uint256 i=0; i<registeredCount; i++) 
        {
            address registered = registeredAirline[i];     
            bool allowToVote = canVote(registered);
            if(allowToVote)
            {
                bool voted = vote(registered);
                if(voted)
                {
                    votedAllow ++;
                    airlineProfiles[registered].votes += 1;
                }
            }
        }
        
        if (registeredCount > 0) {
            uint256 allowed = uint256((votedAllow *100))/registeredCount;
            //votes = votedAllow;
            if(allowed > voteThreshold) 
            {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
            //votes = 0;
        }
        
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (   
                                address newairline,
                                address caller
                            )
                            external
                            requireIsOperational
                            returns (bool)
    {
        require(newairline != address(0), "'account' must be a valid address.");
        require(!airlineProfiles[newairline].isRegistered, "airline is already registered.");
        require(caller != address(0), "'account' must be a valid address.");
        require(isAirlineRegistered(caller), "Caller is not registered");
        require(isAirlineFunded(caller), "Caller is not funded");

        bool fundStatus = airlineProfiles[newairline].isFunded;
        uint voteCounts = airlineProfiles[newairline].votes;
        if (registeredAirline.length< 4) {
            airlineProfiles[newairline] = airlineProfile({
                                                isRegistered: true,
                                                isFunded: fundStatus,
                                                votes: voteCounts
                                            });
            registeredAirline.push(newairline);
            //success = true;
            //votes = 0;
            return true;
        } else {
            bool success = allowToRegister();
            if (success) 
            {
                airlineProfiles[newairline] = airlineProfile({
                                                isRegistered: true,
                                                isFunded: fundStatus,
                                                votes: voteCounts
                                            });
                registeredAirline.push(newairline);
                return true;
            } 
            return false;
        }
    }


   /**
    * @dev Buy insurance for a flight
    * insuraceFee in the unit of wei
    */   
    function buy
                            ( 
                                bytes32 flightKey,
                                uint256 insuraceFee,
                                address user                            
                            )
                            external
                            requireIsOperational
                            payable
    {
        userProfile memory userInfo = userProfile({
                                                flightInsured: flightKey,
                                                insuraceFee: insuraceFee,
                                                insuranceReturn: 0
                                            });
        userInsuranceFee[user].push(userInfo);
    }

    /**
     *  @dev Credits payouts to insurees
     * insurace return in the unit of wei
    */
    function creditInsurees
                                (
                                    bytes32 flightKey,
                                    address user
                                )
                                external
                                payable
                                requireIsOperational
    {
        uint counts = userInsuranceFee[user].length;
        for (uint i=0; i< counts; i++)
        {
            userProfile memory userInfoA = userInsuranceFee[user][i];
            if (userInfoA.flightInsured == flightKey) 
            {
                uint256 refund = userInfoA.insuraceFee * 3/2;
                userInsuranceFee[user][i].insuranceReturn = refund;
                userInfoA.insuranceReturn = refund;
            }
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *  refund in unit of wei
    */
    function pay
                            (
                                bytes32 flightKey,
                                address user
                            )
                            external
                            payable
                            requireIsOperational
                            returns (uint256)
    {
        uint counts = userInsuranceFee[user].length;
        for (uint i=0; i< counts; i++)
        {
            userProfile memory userInfoB = userInsuranceFee[user][i];
            if (userInfoB.flightInsured == flightKey) 
            {
                uint256 reFund = userInfoB.insuranceReturn;
                uint256 currentTotalFunds = totalFunds * oneEther; //wei
                totalFunds= (currentTotalFunds.sub(reFund))/oneEther;
                //not enough funds
                if (totalFunds <=0)
                {
                    totalFunds = 0;
                    reFund = currentTotalFunds;
                }
                //reset
                //userInsuranceFee[user][i].insuranceReturn = 0;
                //userInsuranceFee[user][i].insuraceFee = 0;
                //userInsuranceFee[user][i].flightInsured = bytes32(0);
                return reFund;
            }
        }
        return 0;
    }

    function getFund(address airline) public view requireIsOperational returns (uint256)
    {
        require(airline != address(0), "'account' must be a valid address.");
        return airlineFunds[airline];
    }

    function sendFund(address airline, uint256 amount) public payable requireIsOperational
    {
        require(airline != address(0), "'account' must be a valid address.");
        uint256 current = airlineFunds[airline];

        airlineFunds[airline] = current + amount;
        if (airlineFunds[airline] >= 10) 
        {
            airlineProfiles[airline].isFunded = true;
        }
        totalFunds += amount;
    }
   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (  
                            )
                            public
                            payable
    {
    
    }

/*
    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        external
                        requireIsOperational
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }
*/
    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external
                            requireIsOperational 
                            payable 
    {
        fund();
    }


}

