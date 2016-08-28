import "Owned.sol";
import "TokenRecipient.sol";
import "TheCoin.sol";

contract TheAdvancedCoin is Owned, TheCoin {
    uint256 public totalSupply;
    uint256 public sellPrice;
    uint256 public buyPrice;

    mapping (address => bool) public frozenAccount;

     event FrozenFunds(address target, bool frozen);

     function TheAdvancedCoin(
            uint256 initialSupply, 
            string tokenName, 
            uint8 decimalUnits, 
            string tokenSymbol,
            address centralMinter
        ) TheCoin( tokenName, decimalUnits, tokenSymbol)
        {
            if (centralMinter != 0) owner = centralMinter;
            balanceOf[owner] = initialSupply;
    }

    function transfer(address _to, uint256 _value) {
        
        if (balanceOf[msg.sender] < _value) throw;
        if (balanceOf[_to] + _value < balanceOf[_to]) throw;
        if (frozenAccount[msg.sender]) throw;

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        Transfer(msg.sender, _to , _value);
    }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool success){
        
        if (frozenAccount[_from]) throw;
        if (balanceOf[_from] < _value) throw;
        if (balanceOf[_to] + _value < balanceOf[_to]) throw;
        if (_value > allowance[_from][msg.sender]) throw;

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;

        Transfer(_from,_to, _value);

        return true;
    }

    function mintToken(address _target, uint256 _mintedAmount) onlyOwner {

        balanceOf[_target] += _mintedAmount;
        totalSupply += _mintedAmount;
        
        Transfer(0, owner, _mintedAmount);
        Transfer(owner, _target, _mintedAmount);
    }

    function freezeAccount(address _target, bool _freeze) onlyOwner {

        frozenAccount[_target] = _freeze;

        FrozenFunds(_target, _freeze);
    } 

    function setPrices(uint256 _newSellPrice, uint256 _newBuyPrice) onlyOwner {
        // TODO hook this up to a standard data feed to have a floating price
        // http://github.com/ethereum/wiki/wiki/standardized_contract_apis#data-feed
        sellPrice = _newSellPrice;
        buyPrice = _newBuyPrice;
    } 

    function sell(uint _amount) returns (uint revenue) {
        if (balanceOf[msg.sender] < _amount) throw;

        balanceOf[this] += _amount;
        balanceOf[msg.sender] -= _amount;
        revenue = _amount * sellPrice;

        if (!msg.sender.send(revenue)){
           throw;
        } else {
            Transfer(msg.sender, this, _amount);
            return revenue;
        } 
    } 

    function buy() {
        var amount = msg.value / buyPrice;

        if (balanceOf[this] < amount) throw;

        balanceOf[msg.sender] += amount;
        balanceOf[this] -= amount;

        Transfer(this, msg.sender, amount);
    }

 

    function contractBalance() returns (uint256 balance) {
        return balanceOf[this];
    }     
}  