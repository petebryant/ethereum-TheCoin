	window.onload = function() {
	var accounts = web3.eth.accounts;
  var coin = TheCoin.deployed();
  var account = accounts[0];
  var balance;

  function setStatus(message) {
    $("#status").html(message);
  };

/* there is an issue with the followiong if the contract is deployed with 0x as the owner */ 
  function initialValues() {
      coin.name.call().then(
      function(name) { 
				$("#name").html(name); 
        return coin.owner.call().then(
          function(owner){
            $("#owner").html(owner); 
          return coin.balanceOf.call(account).then(
            function(balance) { 
              $("#balance").html(balance.valueOf());    
              return coin.symbol.call().then(
                function(symbol){
                  $("#symbol").html(symbol.valueOf());    
                  return coin.decimals.call().then(
                    function(decimals){
                      $("#decimals").html(decimals.valueOf()); 
                      return;
              });
            });
          });
        });
      }).catch(function(e) {
        console.log(e);
        setStatus("Error getting balance; see log.");
    });
	};

  function freezeAccount(freezeThis, freeze) {
    var status = "";
    coin.owner.call().then(
      function(owner){
        return  coin.freezeAccount(freezeThis, freeze, {from: owner}).then(
      function(){
          return coin.frozenAccount.call(freezeThis).then(
          function(frozen){
            if (freeze)
            {
              if (frozen)
                setStatus("account was frozen");
              else
                setStatus("failed to freeze account");
            }
            else
            {
              if (!frozen)
                setStatus("account was unfrozen");
              else
                setStatus("failed to unfreeze account");
            }
     	  });
      });
    });
    return status;
  };

	$("#freeze").click(function() {
		var freezeThis = $("#freezeThis").val();
		freezeAccount(freezeThis, true);
	});

  	$("#unfreeze").click(function() {
		var unfreezeThis = $("#unfreezeThis").val();
		freezeAccount(unfreezeThis, false);
	});
  
  $("#coinAddress").html(coin.address);

  initialValues();
};