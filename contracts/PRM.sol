pragma solidity ^0.4.0;

/**
 * @title PRM Token Implementation Smart Contract
 * @author Alex "AL_X" Papageorgiou
 *  The stripped-down token interface of the PRM Token for the PRM contract to communicate with in its future deployment.
 *      This is purely to generate the function signatures in a human-readable & secure format instead of using address.call(bytes4(sha3("function_name(types)")), parameters_values).
 */
contract PRMToken {
    string public name = "Photo Rights Management Token";
    string public symbol = "PRM";
    address public admin;
    address public PRMAddress;
    uint8 public decimals = 16;
    uint256 public totalFunds;
    uint256 public contractCreation;
    uint256 public totalSupply = 10000000*(10**16);
    uint256 private decimalMultiplier = 10**16;
    bool private running;
    mapping(address => uint256) balances;
    mapping(address => mapping (address => uint256)) allowed;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    /**
     * @notice Ensures admin is caller
     */
    modifier isAdmin() {
        require(msg.sender == admin);
        _;
    }

    /**
     * @notice Ensures PRM contract is caller
     */
    modifier isPRM() {
        require(msg.sender == PRMAddress);
        _;
    }

    /**
    * @notice Re-entry protection
    */
    modifier isRunning() {
        require(!running);
        running = true;
        _;
        running = false;
    }

    /**
     * @notice SafeMath Library safeSub Import
     * 
            Since we are dealing with a limited currency
            circulation of 10m tokens and values
            that will not surpass the uint256 limit, only
            safeSub is required to prevent underflows.
    */
    function safeSub(uint256 a, uint256 b) internal pure returns (uint256 z) {
        assert((z = a - b) <= a);
    }

    /**
     * @notice PRM Constructor
     * 
            Normal constructor function, 8m tokens
            on sale during the ICO, 250000 tokens for
            bounties & 1.75m tokens for the developers.
    */
    constructor() public {
        admin = msg.sender;
        contractCreation = now;
        balances[this] = 8000000*decimalMultiplier;
        balances[msg.sender] = 2000000*decimalMultiplier;
    }

    /**
     * @notice Check the name of the token ~ ERC-20 Standard
     * @return {
                    "_name": "The token name"
                }
     */
    function name() external constant returns (string _name) {
        return name;
    }

    /**
     * @notice Check the symbol of the token ~ ERC-20 Standard
     * @return {
                    "_symbol": "The token symbol"
                }
     */
    function symbol() external constant returns (string _symbol) {
        return symbol;
    }

    /**
     * @notice Check the decimals of the token ~ ERC-20 Standard
     * @return {
                    "_decimals": "The token decimals"
                }
     */
    function decimals() external constant returns (uint8 _decimals) {
        return decimals;
    }

    /**
     * @notice Check the total supply of the token ~ ERC-20 Standard
     * @return {
                    "_totalSupply": "Total supply of tokens"
                }
     */
    function totalSupply() external constant returns (uint256 _totalSupply) {
        return totalSupply;
    }

    /**
     * @notice Query the available balance of an address ~ ERC-20 Standard
     * @param _owner The address whose balance we wish to retrieve
     * @return {
                    "balance": "Balance of the address"
                }
     */
    function balanceOf(address _owner) external constant returns (uint256 balance) {
        return balances[_owner];
    }
    /**
     * @notice Query the amount of tokens the spender address can withdraw from the owner address ~ ERC-20 Standard
     * @param _owner The address who owns the tokens
     * @param _spender The address who can withdraw the tokens
     * @return {
                    "remaining": "Remaining withdrawal amount"
                }
     */
    function allowance(address _owner, address _spender) external constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    /**
     * @notice Transfer tokens from an address to another ~ ERC-20 Standard
     * @param _from The address whose balance we will transfer
     * @param _to The recipient address
     * @param _value The amount of tokens to be transferred
     */
    function transferFrom(address _from, address _to, uint256 _value) external {
        uint256 _allowance = allowed[_from][_to];
        balances[_to] = balances[_to]+_value;
        balances[_from] = safeSub(balances[_from], _value);
        allowed[_from][_to] = safeSub(_allowance, _value);
        emit Transfer(_from, _to, _value);
    }

    /**
     * @notice Authorize an address to retrieve funds from you ~ ERC-20 Standard
     * 
            Each approval comes with a default cooldown of 30 minutes
            to prevent against the ERC-20 race attack.
     * @param _spender The address you wish to authorize
     * @param _value The amount of tokens you wish to authorize
     */
    function approve(address _spender, uint256 _value) external {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
    }

    /**
     * @notice Transfer the specified amount to the target address ~ ERC-20 Standard
     * 
            A boolean is returned so that callers of the function
            will know if their transaction went through.
     * @param _to The address you wish to send the tokens to
     * @param _value The amount of tokens you wish to send
     * @return {
                    "success": "Transaction success"
                }
     */
    function transfer(address _to, uint256 _value) external isRunning returns (bool success) {
        bytes memory empty;
        if (_to == address(this)) {
            revert();
        } else if (isContract(_to)) {
            return transferToContract(_to, _value, empty);
        } else {
            return transferToAddress(_to, _value, empty);
        }
    }

    /**
     * @notice Check whether address is a contract ~ ERC-223 Proposed Standard
     * @param _address The address to check
     * @return {
                    "is_contract": "Result of query"
                }
     */
    function isContract(address _address) internal view returns (bool is_contract) {
        uint length;
        assembly {
            length := extcodesize(_address)
        }
        return length > 0;
    }

    /**
     * @notice Transfer the specified amount to the target address with embedded bytes data ~ ERC-223 Proposed Standard
     * @param _to The address to transfer to
     * @param _value The amount of tokens to transfer
     * @param _data Any extra embedded data of the transaction
     * @return {
                    "success": "Transaction success"
                }
     */
    function transfer(address _to, uint256 _value, bytes _data) external isRunning returns (bool success) {
        if (_to == address(this)) {
            revert();
        } else if (isContract(_to)) {
            return transferToContract(_to, _value, _data);
        } else {
            return transferToAddress(_to, _value, _data);
        }
    }

    /**
     * @notice Handles transfer to an ECA (Externally Controlled Account), a normal account ~ ERC-223 Proposed Standard
     * @param _to The address to transfer to
     * @param _value The amount of tokens to transfer
     * @param _data Any extra embedded data of the transaction
     * @return {
                    "success": "Transaction success"
                }
     */
    function transferToAddress(address _to, uint256 _value, bytes _data) internal returns (bool success) {
        balances[msg.sender] = safeSub(balances[msg.sender], _value);
        balances[_to] = balances[_to]+_value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    /**
     * @notice Handles transfer to a contract ~ ERC-223 Proposed Standard
     * @param _to The address to transfer to
     * @param _value The amount of tokens to transfer
     * @param _data Any extra embedded data of the transaction
     * @return {
                    "success": "Transaction success"
                }
     */
    function transferToContract(address _to, uint256 _value, bytes _data) internal returns (bool success) {
        balances[msg.sender] = safeSub(balances[msg.sender], _value);
        balances[_to] = balances[_to] + _value;
        PRMToken rec = PRMToken(_to);
        rec.tokenFallback(msg.sender, _value, _data);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    /**
     * @notice Reverting tokenFallback method to ensure ERC-223 compatibility & prevent accidental ERC-223 transfers
     * @param _sender The address who sent the ERC-223 tokens
     * @param _value The amount of tokens the address sent to this contract
     * @param _data Any embedded data of the transaction
     */
    function tokenFallback(address _sender, uint256 _value, bytes _data) public {
        revert();
    }

    /**
     * @notice Retrieve ERC Tokens sent to contract
     *  Feel free to contact us and retrieve your ERC tokens should you wish so.
     * @param _token The token contract address
     */
    function claimTokens(address _token) isAdmin external {
        require(_token != address(this));
        PRMToken token = PRMToken(_token);
        uint balance = token.balanceOf(this);
        token.transfer(admin, balance);
    }

    /**
     * @notice Fallback function
     *  Triggered when Ether is sent to the contract. Adjusts price based on time.
     */
    function() payable external {
        require(msg.value > 0);
        uint256 tokenAmount;
        tokenAmount = tokenMultiplier()*msg.value;
        balances[msg.sender] += tokenAmount;
        balances[this] -= tokenAmount;
        totalFunds += msg.value;
        emit Transfer(this, msg.sender, tokenAmount);
        admin.transfer(msg.value);
    }

    /**
     * @notice Token Multiplier getter
     *  Allows users who invest early to get more tokens per Ether
     */
    function tokenMultiplier() public view returns (uint8) {
        if (now < contractCreation + 1 days) {
            return 20;
        } else if (now < contractCreation + 7 days) {
            return 17;
        } else if (now < contractCreation + 14 days) {
            return 15;
        } else if (now < contractCreation + 21 days) {
            return 12;
        } else {
            return 10;
        }
    }

    /**
     * @notice Burning function
     * 
     *      Burns any leftover ICO tokens to ensure a proper value is
     *      set in the Coin Market Cap.
     */
    function burnLeftovers() external {
        require(contractCreation + 30 days < now && balances[this] > 0);
        totalSupply -= balances[this];
        balances[this] = 0;
    }

    /**
     * @notice Set the PRM Address. Interoperable only with the PRM Address.
     * @param _PRMAddress The address of the PRM  contract
     * 
     *      This function is unnecessary in case this contract is deployed
     *      after the PRM contract has been as the address can be hard-coded.
     */
    function setPRMAddress(address _PRMAddress) external isAdmin {
        PRMAddress = _PRMAddress;
    }

    /**
     * @notice Reflect the latest photo auction bid on the appropriate balances
     * @param _previousBidder The address of the previous bidder
     * @param _previousBid The value of the previous bid
     * @param _newBidder The address of the new bidder
     * @param _newBid The value of the new bid
     */
    function refundAndBid(address _previousBidder, uint256 _previousBid, address _newBidder, uint256 _newBid) external isPRM {
        if (_previousBidder == 0x0) {
            balances[msg.sender] += _newBid;
        } else {
            balances[msg.sender] += (_newBid - _previousBid);
        }
        balances[_previousBidder] += _previousBid;
        balances[_newBidder] = safeSub(balances[_newBidder], _newBid);
    }

    /**
     * @notice Reflect a photo purchase on the appropriate balances
     * @param _buyer The address of the buyer
     * @param _amount The value of the purchase
     * @param _owner The address of the recipient
     */
    function saleTransfer(address _buyer, uint256 _amount, address _owner) external isPRM {
        balances[_owner] += _amount;
        balances[_buyer] = safeSub(balances[_buyer], _amount);
    }

    /**
     * @notice Reflect an auction's finalization on the appropriate balances
     * @param _owner The address of the auction's owner
     * @param _bid The value of the latest bid
     */
    function releaseBid(address _owner, uint256 _bid) external isPRM {
        balances[_owner] += _bid;
        //Underflow impossible to occur due to Smart Contract workflow
        balances[msg.sender] -= _bid;
    }
}


/**
 * @title PRM (Photo Rights Management) Smart Contract
 * @author Alex "AL_X" Papageorgiou
 *  The smart contract facilitating the operation of the X platform & handling the sale/auction of photos as well as the ownership.
 */
contract PRM {
    address public PRMTokenAddress;
    address public admin;

    uint256 public incrementalID = 0;

    mapping(uint256 => PhotoAsset) photoAssets;

    /**
     *  All photo details gathered in one place for
     *      easy access and a single mapping reference
     */
    struct PhotoAsset {
        uint256 photoPrice;
        uint256 photoTokenPrice;
        uint256 expiryDate;
        bool saleType;
        address owner;
        address lastBidder;
    }

    event PhotoOwnershipTransfer(address indexed _newOwner, address indexed _previousOwner, uint256 indexed _photoID);
    event PhotoRelease(address indexed _viewer, uint256 indexed _photoID);
    event PhotoBid(uint256 indexed _photoID, uint256 _bidPrice);
    event PhotoUpload(address indexed _uploader, uint256 _photoID);

    /**
	 * @notice Ensures admin is the caller of a function
	 */
    modifier isAdmin() {
        require(msg.sender == admin);
        //Continue executing rest of method body
        _;
    }

    /**
     * @notice PRM Constructor
     */
    constructor() public {
        admin = msg.sender;
    }

    /**
     * @notice Set the PRM Token Address. Interoperable with PRMToken schema-compliant tokens as well
     * @param _PRMTokenAddress The address of the PRM Token contract
     *  This function is unnecessary in case this contract is deployed
     *      after the token contract has been as the address can be hard-coded.
     */
    function setPRMTokenAddress(address _PRMTokenAddress) external isAdmin {
        PRMTokenAddress = _PRMTokenAddress;
    }

    /**
     * @notice Enables retrieval of ERC-20 compliant tokens
     * @param _tokenAddress The address of the ERC-20 compliant token
     *  Feel free to reach out to us for any accidental loss
     *      of tokens to retrieve them.
     */
    function retrieveAccidentalTransfers(address _tokenAddress) external isAdmin {
        require(_tokenAddress != PRMTokenAddress);
        PRMToken tokenObject = PRMToken(_tokenAddress);
        uint256 fullBalance = tokenObject.balanceOf(this);
        tokenObject.transfer(admin, fullBalance);
    }

    /**
     * @notice Retrieve uploaded photo info based on the photo's ID
     * @param _photoID The ID of the photo whose info we wish to retrieve
     * @return The photo's contained information as stored within the object's structure
     */
    function getPhotoInfo(uint _photoID) external view returns (uint256, uint256, uint256, bool, address, address) {
        PhotoAsset memory photo = photoAssets[_photoID];
        return (photo.photoPrice, photo.photoTokenPrice, photo.expiryDate, photo.saleType, photo.owner, photo.lastBidder);
    }

    /**
     * @notice Upload photo to the PRM network & set for sale as an opt-in
     * @param _saleType The type of sale should there be one (1 = Single Sale, 2 = Reselling, 2< = Auction Sale & Hour Duration)
     * @param _salePrice The price of the photo should a sale take place
     * @param _isToken Whether tokens should be used for the sale or not
     */
    function photoUpload(uint256 _saleType, uint256 _salePrice, bool _isToken) external {
        photoAssets[incrementalID].owner = msg.sender;
        if (_saleType == 1) {
            photoSale(_salePrice, incrementalID, _isToken);
        } else if (_saleType == 2) {
            photoResale(_salePrice, incrementalID, _isToken);
        } else if (_saleType > 2) {
            photoAuction(_salePrice, _saleType, incrementalID, _isToken);
        }
        emit PhotoUpload(msg.sender, incrementalID);
        incrementalID++;
    }

    /**
     * @notice Set photo up for sale
     * @param _salePrice The price to sell the photo at
     * @param _photoID The photo's ID
     * @param _isToken Whether tokens should be used for the sale or not
     */
    function photoSale(uint256 _salePrice, uint256 _photoID, bool _isToken) public {
        if (_isToken) {
            photoAssets[_photoID].photoTokenPrice = _salePrice;
        } else {
            photoAssets[_photoID].photoPrice = _salePrice;
        }
    }

    /**
     * @notice Set photo up for resale
     * @param _resalePrice The price to re-sell the photo at
     * @param _photoID The photo's ID
     * @param _isToken Whether tokens should be used for the sale or not
     */
    function photoResale(uint256 _resalePrice, uint256 _photoID, bool _isToken) public {
        PhotoAsset storage asset = photoAssets[_photoID];
        if (_isToken) {
            asset.photoTokenPrice = _resalePrice;
        } else {
            asset.photoPrice = _resalePrice;
        }
        asset.saleType = true;
    }

    /**
     * @notice Set photo up for auction
     * @param _startingBid The minimum bid requirement
     * @param _auctionDuration The duration of the auction in days
     * @param _photoID The photo's ID
     * @param _isToken Whether tokens should be used for the sale or not
     */
    function photoAuction(uint256 _startingBid, uint256 _auctionDuration, uint256 _photoID, bool _isToken) public {
        PhotoAsset storage asset = photoAssets[_photoID];
        if (_isToken) {
            asset.photoTokenPrice = _startingBid;
        } else {
            asset.photoPrice = _startingBid;
        }
        asset.expiryDate = now + (1 hours * _auctionDuration);
    }

    /**
     * @notice Bid on auction of photo
     * @param _photoID The ID of the photo
     * @param _tokenAmount The amount of tokens to use, should the token system be in effect
     */
    function bidOnAuction(uint256 _photoID, uint256 _tokenAmount) external payable {
        PhotoAsset storage asset = photoAssets[_photoID];
        assert(asset.expiryDate > now);
        if (_tokenAmount > asset.photoTokenPrice) {
            PRMToken tokenObject = PRMToken(PRMTokenAddress);
            tokenObject.refundAndBid(asset.lastBidder, asset.photoTokenPrice, msg.sender, _tokenAmount);
            asset.photoTokenPrice = _tokenAmount;
            asset.lastBidder = msg.sender;
            emit PhotoBid(_photoID, _tokenAmount);
        } else if (msg.value > asset.photoPrice) {
            if (asset.lastBidder != 0x0) {
                asset.lastBidder.transfer(asset.photoPrice);
            }
            asset.photoPrice = msg.value;
            asset.lastBidder = msg.sender;
            emit PhotoBid(_photoID, msg.value);
        } else {
            revert();
        }
    }

    /**
     * @notice Purchase right to view & use a photo
     * @param _photoID The ID of the photo
     * @param _tokenAmount The amount of tokens to use, should the token system be in effect
     */
    function purchaseUsageRight(uint256 _photoID, uint256 _tokenAmount) external payable {
        PhotoAsset storage asset = photoAssets[_photoID];
        assert(asset.saleType);
        if (_tokenAmount == asset.photoTokenPrice && asset.photoTokenPrice > 0) {
            PRMToken tokenObject = PRMToken(PRMTokenAddress);
            tokenObject.saleTransfer(msg.sender, _tokenAmount, asset.owner);
            emit PhotoRelease(msg.sender, _photoID);
        } else if (msg.value == asset.photoPrice && asset.photoPrice > 0) {
            asset.owner.transfer(msg.value);
            emit PhotoRelease(msg.sender, _photoID);
        } else {
            revert();
        }
    }

    /**
     * @notice Purchase complete ownership of photo
     * @param _photoID The ID of the photo
     * @param _tokenAmount The amount of tokens to use, should the token system be in effect
     */
    function purchaseOwnershipRight(uint256 _photoID, uint256 _tokenAmount) external payable {
        PhotoAsset storage asset = photoAssets[_photoID];
        assert(!asset.saleType && asset.expiryDate == 0);
        if (_tokenAmount == asset.photoTokenPrice && asset.photoTokenPrice > 0) {
            PRMToken tokenObject = PRMToken(PRMTokenAddress);
            tokenObject.saleTransfer(msg.sender, _tokenAmount, asset.owner);
            asset.photoTokenPrice = 0;
            emit PhotoOwnershipTransfer(msg.sender, asset.owner, _photoID);
            asset.owner = msg.sender;
        } else if (msg.value == asset.photoPrice && asset.photoPrice > 0) {
            asset.owner.transfer(msg.value);
            asset.photoPrice = 0;
            emit PhotoOwnershipTransfer(msg.sender, asset.owner, _photoID);
            asset.owner = msg.sender;
        } else {
            revert();
        }
    }

    /**
     * @notice Resolve auction outcome
     * @param _photoID The ID of the photo
     */
    function finalizeAuction(uint256 _photoID) external {
        PhotoAsset storage asset = photoAssets[_photoID];
        assert(asset.expiryDate < now && (asset.lastBidder == msg.sender || (msg.sender == asset.owner && asset.lastBidder == 0x0)));
        if (asset.photoPrice > 0) {
            if (asset.lastBidder != 0x0) {
              asset.owner.transfer(asset.photoPrice);
              emit PhotoOwnershipTransfer(asset.lastBidder, asset.owner, _photoID);
              asset.owner = asset.lastBidder;
              asset.lastBidder = 0x0;
            }
            asset.photoPrice = 0;
            asset.expiryDate = 0;
        } else if (asset.photoTokenPrice > 0) {
            if (asset.lastBidder != 0x0) {
              PRMToken tokenObject = PRMToken(PRMTokenAddress);
              tokenObject.releaseBid(asset.owner, asset.photoTokenPrice);
              emit PhotoOwnershipTransfer(asset.lastBidder, asset.owner, _photoID);
              asset.owner = asset.lastBidder;
              asset.lastBidder = 0x0;
            }
            asset.photoTokenPrice = 0;
            asset.expiryDate = 0;
        }
    }

    /**
     * @notice Reverting fallback to prevent accidental Ethereum transfers
     */
    function() public payable {
        revert();
    }
}