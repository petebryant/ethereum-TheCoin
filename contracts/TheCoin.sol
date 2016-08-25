import "TokenRecipient.sol";

contract TheCoin {
    string public standard = "TheCoin 1.0";
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping (address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);

    function TheCoin(
        string tokenName, 
        uint8 decimalUnits, 
        string tokenSymbol) {

        name = tokenName;
        decimals = decimalUnits;
        symbol = tokenSymbol;
    }

    function transfer(address _to, uint256 _value) {
        
        if (balanceOf[msg.sender] < _value) throw;
        if (balanceOf[_to] + _value < balanceOf[_to]) throw;

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        Transfer(msg.sender, _to , _value);
    }

    function approveAndCall(address _spender, uint256 _value, bytes _extraData)
        returns (bool success){

        allowance[msg.sender][_spender]  = _value;
        TokenRecipient spender = TokenRecipient(_spender);
        spender.recieveApproval(msg.sender, _value, this, _extraData);
        
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool success){

        if (balanceOf[_from] < _value) throw;
        if (balanceOf[_to] + _value < balanceOf[_to]) throw;
        if (_value > allowance[_from][msg.sender]) throw;

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;

        Transfer(_from,_to, _value);

        return true;
    }

    /* this unnamed function is called whenever some tries to send ether to the contract */
    function(){
        throw;
    }
}
