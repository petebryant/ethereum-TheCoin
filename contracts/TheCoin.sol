
import "Owned.sol";

contract TheCoin is Owned {
    mapping (address => uint256) public balanceOf;
    mapping (address => bool) public frozenAccount;
    mapping (address => bool) public approvedAccount;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    uint256 public sellPrice;
    uint256 public buyPrice;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event FrozenFunds(address indexed sender, address target, bool frozen);
    event ApprovedAccount(address indexed sender, address target, bool approved);

    function TheCoin(
        uint256 initialSupply, 
        string tokenName, 
        uint8 decimalUnits, 
        string tokenSymbol) {

        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
        name = tokenName;
        decimals = decimalUnits;
        symbol = tokenSymbol;
    }

    function freezeAccount(address target, bool freeze) onlyOwner {
        frozenAccount[target] = freeze;
        FrozenFunds(msg.sender, target, freeze);
    }

    function approveAccount(address target, bool approved) onlyOwner {
        approvedAccount[target] = approved;
        ApprovedAccount(msg.sender, target, approved);
    }

    function mintToken(address target, uint256 mintedAmount) onlyOwner {

        balanceOf[target] += mintedAmount;
        totalSupply += mintedAmount;
        Transfer(0, owner, mintedAmount);
        Transfer(owner, target, mintedAmount);
    }

    function transfer(address to, uint256 value) public returns(bool result) {
        
        if (frozenAccount[msg.sender]) {
            msg.sender.send(value);
            return false;
        }

        if (!approvedAccount[msg.sender]) {
            msg.sender.send(value);
            return false;
        }

        if (balanceOf[msg.sender] < value || balanceOf[to] + value < balanceOf[to]) {
            msg.sender.send(value);
            return false;
        }

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        Transfer(msg.sender, to , value);

        return true;
    }

    function setPrices(uint256 newSellPrice, uint256 newBuyPrice) onlyOwner {
        // TODO hook this up to a standard data feed to have a floating price
        // http://github.com/ethereum/wiki/wiki/standardized_contract_apis#data-feed
        sellPrice = newSellPrice;
        buyPrice = newBuyPrice;
    }

    function buy() returns (uint amount){
        amount = msg.value / buyPrice;

        if (balanceOf[this] < amount) throw;

        balanceOf[msg.sender] += amount;
        balanceOf[this] -= amount;

        Transfer(this, msg.sender, amount);

        return amount;
    }

    function sell(uint amount) returns(uint revenue){
        if (balanceOf[msg.sender] < amount) throw;

        balanceOf[this] += amount;
        balanceOf[msg.sender] -= amount;
        revenue = amount * sellPrice;

        if (!msg.sender.send(revenue)){
            throw;
        } else {
            Transfer(msg.sender, this, amount);
            return revenue;
        }
    }
}
