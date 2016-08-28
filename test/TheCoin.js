contract('TheAdvancedCoin', function(accounts) {
  it("Should be deployed", function() {
    var coin = TheAdvancedCoin.deployed();
    assert.isTrue(true);
  });
  it("Should set ctor values", function() {
    var coin = TheAdvancedCoin.deployed();
    var theOwner;
    return coin.owner.call().then(function(owner){
      theOwner = owner;
      assert.equal(owner,accounts[0], "not the expected owner " + owner);
      return coin.balanceOf.call(owner).then(function(balance) {
        assert.equal(balance.valueOf(), 21000000, "21000000 wasn't in the owners account");
        return coin.name.call().then(function(name){
          assert.equal(name, "TheCoin 1.0", "the token wasn't called TheCoin");
          return coin.decimals.call().then(function(decimals){
            assert.equal(decimals, 2, "the decimal unit wasn't 2");
            return coin.symbol.call().then(function(symbol){
              assert.equal(symbol, "#", "the symbol unit wasn't #");
            });
          });
        });
      }); 
    });
  });
  it("Should transfer coins", function() {
    var coin = TheAdvancedCoin.deployed();
    var accOne = accounts[0];
    var accTwo = accounts[1];
    var amount = 10;
    var accOneStart;
    var accTwoStart;
    var accOneEnd;
    var accTwoEnd;
      return coin.balanceOf.call(accOne).then(function(balance) {
        accOneStart = balance.toNumber();
        console.log("Balance of 1: " + accOneStart);
        return coin.balanceOf.call(accTwo).then(function(balance) {
          accTwoStart = balance.toNumber();
          console.log("Balance of 2: " + accTwoStart);
          return coin.transfer(accTwo, amount, {from: accOne}).then(function() {
            return coin.balanceOf.call(accOne).then(function(balance) {
              accOneEnd = balance.toNumber();
              console.log("Balance of 1: " + accOneEnd);
              return coin.balanceOf.call(accTwo).then(function(balance) {
                accTwoEnd = balance.toNumber();
                console.log("Balance of 2: " + accTwoEnd);
                assert.equal(accOneEnd, accOneStart - amount, "Amount wasn't correctly taken from the sender");
                assert.equal(accTwoEnd, accTwoStart + amount, "Amount wasn't correctly sent to the receiver");
              });
          });
        });
      });
    });
  });
  it("should transfer ownership by owner", function() {
    var coin = TheAdvancedCoin.deployed();
    coin.transferOwnership(accounts[1], {from: accounts[0]});
    return coin.owner.call().then(function(newOwner){
      console.log("Account[0]: " + accounts[0]);
     	console.log("New owner: " + newOwner);
      assert.equal(newOwner, accounts[1],"Ownership was not changed correctly");
    });
  }); 
  it("should only transfer ownership by owner", function() {
    var coin = TheAdvancedCoin.deployed();
    coin.transferOwnership(accounts[3], {from: accounts[2]})
    return coin.owner.call().then(function(newOwner){
      console.log("Owner: " + newOwner);
      assert.notEqual(newOwner, accounts[3],"Ownership was incorrectly chnaged by non-owner");
      return coin.transferOwnership(accounts[0], {from: accounts[1]});
    });
  }); 
  it("should only mintTokens by owner", function() {
    var coin = TheAdvancedCoin.deployed();
    coin.mintToken(accounts[4], 10, {from: accounts[0]});
    return coin.balanceOf.call(accounts[4], {from: accounts[0]}).then(function(balance){
      console.log("New balance: " + balance);
      assert.equal(balance, 10, "Tokens were not minted");
    });
  });
  it("should freeze account", function() {
    var coin = TheAdvancedCoin.deployed();
    coin.freezeAccount(accounts[4], true, {from: accounts[0]});
    return coin.frozenAccount.call(accounts[4], {from: accounts[0]}).then(function(frozen){
      console.log("Account frozen: " + frozen);
      assert.isTrue(frozen, "Account was not frozen correctly");
    });
  }); 
  it("should freeze account by owner only", function() {
    var coin = TheAdvancedCoin.deployed();
    coin.freezeAccount(accounts[5], true, {from: accounts[1]});
    return coin.frozenAccount.call(accounts[5], {from: accounts[0]}).then(function(frozen){
      var isTrue = frozen == false;
      console.log("Account frozen: " + frozen);
      assert.isTrue(isTrue, "Account was frozen incorrectly");
    });
  });
  it("should set prices by owner", function() {
    var coin = TheAdvancedCoin.deployed();
    coin.setPrices(42, 21, {from: accounts[0]});
    return coin.sellPrice.call({from: accounts[0]}).then(function(sell){
      console.log("Sell price (42): " + sell);
      assert.equal(sell, 42, "Sell price not set correctly");
      return coin.buyPrice.call({from: accounts[0]}).then(function(buy){
        console.log("Buy price (21): " + buy);
        assert.equal(buy, 21, "Buy price not set correctly");
      });
    });
  }); 
  it("should set prices by owner only", function() {
    var coin = TheAdvancedCoin.deployed();
    coin.setPrices(40, 20, {from: accounts[1]});
    return coin.sellPrice.call({from: accounts[0]}).then(function(sell){
      console.log("Sell price (40): " + sell);
      assert.equal(sell, 42, "Sell price not set correctly");
      return coin.buyPrice.call({from: accounts[0]}).then(function(buy){
        console.log("Buy price (20): " + buy);
        assert.equal(buy, 21, "Buy price not set correctly");
      });
    });
  }); 
  it("should sell tokens", function(){
    var coin = TheAdvancedCoin.deployed();
    var accOne = accounts[0];
    var amount = 100;
    var accOneStart;
    var accOneEnd;

    coin.setPrices(40, 20, {from: accOne});  
    return coin.sellPrice.call({from: accOne}).then(function(sell){
    console.log("Sell price: " + sell);
      return coin.balanceOf.call(accOne).then(function(balance) {
        accOneStart = balance.toNumber();     
        console.log("Balance start: " + accOneStart);
        return coin.sell(amount, {from: accOne}).then(function(revenue){
          console.log("Revenue: " + revenue.tonumber());
          return coin.balanceOf.call(accOne).then(function(balance) {
            accOneEnd = balance.toNumber(); 
            console.log("Balance end: " + accOneEnd);
            assert.equal(accOneEnd, accOneStart - amount, "Amount wasn't correctly sold by the sender");
              return coin.contractBalance.call().then(function(balance){
              console.log("Contract balance: " + balance);
              assert.equal(balance, amount, "Amount wasn't correctly bought by contract");
            });
          });
        });
      }); 
    });
  });  
  it("should buy tokens", function(){
    var coin = TheAdvancedCoin.deployed();
    var accOne = accounts[0];
    var amount = 200;
    var accOneStart;
    var accOneEnd;
    var contractBalance;
    var tokens;

    coin.setPrices(40, 20, {from: accOne});  
    return coin.buyPrice.call({from: accOne}).then(function(buy){
    tokens = amount / buy;
    console.log("Buy price: " + buy);
    console.log("buying: " + tokens);
      return coin.contractBalance.call().then(function(balance){
        contractBalance = balance.toNumber();
        console.log("Contract balance: " + balance);
        return coin.balanceOf.call(accOne).then(function(balance) {
          accOneStart = balance.toNumber();     
          console.log("Balance start: " + accOneStart);
          return coin.buy(amount, {from: accOne}).then(function(){
            return coin.contractBalance.call().then(function(balance){
            console.log("Contract balance: " + balance);
            assert.equal(contractBalance, balance - tokens, "Amount wasn't correctly sold by contract");
            return coin.balanceOf.call(accOne).then(function(balance) {
              accOneEnd = balance.toNumber(); 
              console.log("Balance end: " + accOneEnd);
              assert.equal(accOneEnd, accOneStart + tokens, "Amount wasn't correctly bought by the sender");
              });
            });
          });
        });
      }); 
    });
  }); 
});
