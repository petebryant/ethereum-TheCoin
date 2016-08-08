	window.onload = function() {
	var accounts = web3.eth.accounts;
  var coin = TheCoin.deployed();
  var account = accounts[0];;
  var balance;

  function setStatus(message) {
    $("#status").html(message);
  };

  function initialValues() {
    coin.name.call().then(
      function(name) { 
				$("#name").html(name); 
        return coin.balanceOf.call(account, {from: account}).then(
          function(balance) { 
            $("#balance").html(balance.valueOf());    
            return coin.symbol.call().then(
              function(symbol){
                $("#symbol").html(symbol);    
                return coin.decimals.call().then(
                  function(decimals){
                    $("#decimals").html(decimals.valueOf()); 
                    return;
            });
          });
        });
      }).catch(function(e) {
        console.log(e);
        setStatus("Error getting balance; see log.");
    });
	};


  $("#coinAddress").html(coin.address);

  initialValues();
};