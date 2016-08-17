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
                      return coin.sellPrice.call().then(
                        function(sell){
                          $("#sell").html(sell.valueOf());
                          return coin.buyPrice.call().then(
                            function(buy){
                              $("#buy").html(buy.valueOf());
                              return;
                            });
                        });
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

  function approveAccount(approveThis, approve) {
      return  coin.approveAccount(approveThis, approve, {from: owner})
  };

  $("#mint").click(function() {
		var amount = $("#mintAmount").val();
		coin.mintToken(owner, amount, {from: owner});
	});

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

	$("#isApproved").click(function() {
		var isApproved = $("#isThisApproved").val();
		return coin.approvedAccount.call(isApproved).then(function(approved){
      if (approved)
        setStatus("Account is approved.")
      else
        setStatus("Account is not approved.");
    });
	});

	$("#approve").click(function() {
		var approveThis = $("#approveThis").val();
		approveAccount(approveThis, true);
	});  

  $("#getBalance").click(function() {
		var acc = $("#balanceThis").val();
		return coin.balanceOf.call(acc).then(function(amt){
      setStatus("Account has " + amt);
    });
	});

  $("#sentToken").click(function() {
		var amount = $("#sendThis").val();
    var acc = $("#toHere").val();
		return coin.transfer(acc, amount, {from: owner}).then(function(status){
      return coin.balanceOf.call(acc).then(function(amt){
      setStatus("New balance is " + amt);
    });
    });
	});  

  $("#setPrices").click(function() {
		var sell = $("#sellPrice").val();
    var buy = $("#buyPrice").val();
		
    coin.setPrices(sell, buy, {from: owner}).then(
      function(){
        return coin.sellPrice.call().then(
          function(sell){
            $("#sell").html(sell.valueOf());
            return coin.buyPrice.call().then(
              function(buy){
                $("#buy").html(buy.valueOf());
                return;
              });
          });
      });
	}); 
  
  $("#coinAddress").html(coin.address);

  initialValues();

  var txEvent = coin.Transfer({sender: owner});

  txEvent.watch(function(err, result){
    if (err)
    {
      setStatus(err);
      return;
    }

    initialValues();
  });

  var freezeEvent = coin.FrozenFunds({sender: owner});

  freezeEvent.watch(function(err, result){
    if (err)
    {
      setStatus(err);
      return;
    }

    if (result.args.frozen)
      setStatus("account has been frozen");
    else
      setStatus("account has not been frozen");
  });

  var approveEvent = coin.ApprovedAccount({sender: owner});

  approveEvent.watch(function(err, result){
    if (err)
    {
      setStatus(err);
      return;
    } 

    if (result.args.approved)
      setStatus("account has been approved");
    else
      setStatus("account has not beeen approved");
  });
};