contract TokenRecipient {
    function recieveApproval(address _from, uint256 _value, address _token, bytes _extraData);
}