
contract TheCoin {
    mapping (address => uint256) public balanceOf;
    string public name;
    string public symbol;
    uint8 public decimals;

    event Transfer(address indexed from, address indexed to, uint256 value);

    function TheCoin(uint256 initialSupply, string tokenName, uint8 decimalUnits, string tokenSymbol){
        balanceOf[msg.sender] = initialSupply;
        name = tokenName;
        decimals = decimalUnits;
        symbol = tokenSymbol;
    }

    function transfer(address to, uint256 value) public returns(bool result) {

        if (balanceOf[msg.sender] < value || balanceOf[to] + value < balanceOf[to]){
            msg.sender.send(value);
            return false;
        }

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        Transfer(msg.sender, to , value);

        return true;
    }
}
