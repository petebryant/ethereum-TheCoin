
import "Owned.sol";

contract TheCoin is Owned {
    mapping (address => uint256) public balanceOf;
    mapping (address => bool) public frozenAccount;
    string public name;
    string public symbol;
    uint8 public decimals;

    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event FrozenFunds(address target, bool frozen);

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
        FrozenFunds(target, freeze);
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

        if (balanceOf[msg.sender] < value || balanceOf[to] + value < balanceOf[to]) {
            msg.sender.send(value);
            return false;
        }

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        Transfer(msg.sender, to , value);

        return true;
    }
}
