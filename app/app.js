	window.onload = function() {
	var accounts = web3.eth.accounts;
  var coin = TheCoin.deployed();
  var account = accounts[0];
  var balance;
  var owner;

  function setStatus(message) {
    $("#status").html(message);
  };

  function initialValues() {
      coin.name.call().then(
      function(name) { 
				$("#name").html(name); 
        return coin.owner.call().then(
          function(result){
            owner = result;
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
        return  coin.freezeAccount(freezeThis, freeze, {from: owner})
  };

	$("#isFrozen").click(function() {
		var isFrozen = $("#isThisFrozen").val();
		return coin.frozenAccount.call(isFrozen).then(function(frozen){
      if (frozen)
        setStatus("Account is frozen.")
      else
        setStatus("Account is not frozen.");
    });
	});

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

    var freezeEvent = coin.FrozenFunds({sender: owner});

  freezeEvent.watch(function(err, result){
    if (err)
    {
      setStatus(err);
      return;
    }

    if (result.args.frozen)
      setStatus("account is frozen");
    else
      setStatus("account is not frozen");
  });
};