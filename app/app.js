	window.onload = function() {
	var accounts = web3.eth.accounts;
  var coin = TheCoin.deployed();
  var account;
  var balance;

  $("#coinAddress").html(coin.address);

  function setStatus(message) {
    $("#status").html(message);
  };

  function initialValues() {
    coin.balanceOf.call(accounts[0]).then(function(value) {
      $("#balance").html = value.valueOf();
    }).catch(function(e) {
      console.log(e);
      setStatus("Error getting balance; see log.");
    });
  };

 initialValues();
};