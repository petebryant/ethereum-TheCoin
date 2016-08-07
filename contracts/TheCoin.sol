
contract TheCoin {
    mapping (address => uint256) public balanceOf;

    function TheCoin(uint256 initialSupply){
        balanceOf[msg.sender] = initialSupply;
    }
}
