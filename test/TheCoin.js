contract('TheCoin', function(accounts) {
  it("should be true", function(done) {
    var coin = TheCoin.deployed();
    assert.isTrue(true);
    done();
  });
  it("should set ctor values", function() {
    var coin = TheCoin.deployed();
    return coin.balanceOf.call(accounts[0]).then(function(balance) {
      assert.equal(balance, 21000000, "21000000 wasn't in the first account");
      }).then(function(){
        return coin.name.call().then(function(name){
        assert.equal(name, "TheCoin", "the token wasn't called TheCoin");
        }).then(function(){
          return coin.decimals.call().then(function(decimals){
          assert.equal(decimals, 2, "the decimal unit wasn't 2");
          }).then(function(){
            return coin.symbol.call().then(function(symbol){
            assert.equal(symbol, "#", "the symbol unit wasn't #");
          }).then(function(){
            return coin.owner.call().then(function(owner){
              assert.equal(owner,accounts[0], "not the expected owner " + owner);
            });
          });
        });
      });
    });
  });
  it("should return false if value greater than balance", function() {
    var coin = TheCoin.deployed();
    var account_one = accounts[0];
    var account_two = accounts[1];
    var amount = 22000000;
    return coin.transfer.call(account_two, amount, {from: account_one}).then(
      function(result){
        var isTrue = !result;
          assert.isTrue(isTrue,"failed transfer didn't return false");
      });
  });
    it("should return true if transfer is successful", function() {
    var coin = TheCoin.deployed();
    var account_one = accounts[0];
    var account_two = accounts[1];
    var amount = 10;
    return coin.transfer.call(account_two, amount, {from: account_one}).then(
      function(result){
          assert.isTrue(result,"successful tx didn't return true");
      });
  });
  it("shouldn't tranfers if value greater than balance", function() {
    var coin = TheCoin.deployed();
    // Get initial balances of first and second account.
    var account_one = accounts[0];
    var account_two = accounts[1];

    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;

    var amount = 22000000;

    return coin.balanceOf.call(account_one).then(function(balance) {
      account_one_starting_balance = balance.toNumber();
      return coin.balanceOf.call(account_two);
    }).then(function(balance) {
      account_two_starting_balance = balance.toNumber();
      return coin.transfer(account_two, amount, {from: account_one});
    }).then(function() {
      return coin.balanceOf.call(account_one);
    }).then(function(balance) {
      account_one_ending_balance = balance.toNumber();
      return coin.balanceOf.call(account_two);
    }).then(function(balance) {
      account_two_ending_balance = balance.toNumber();

      assert.equal(account_one_ending_balance, account_one_starting_balance, "Amount was incorrectly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance, "Amount was incorrectly sent to the receiver");
    });
  });  
  it("should transfer coin correctly", function() {
    var coin = TheCoin.deployed();

    // Get initial balances of first and second account.
    var account_one = accounts[0];
    var account_two = accounts[1];

    var account_one_starting_balance;
    var account_two_starting_balance;
    var account_one_ending_balance;
    var account_two_ending_balance;

    var amount = 10;

    return coin.balanceOf.call(account_one).then(function(balance) {
      account_one_starting_balance = balance.toNumber();
      return coin.balanceOf.call(account_two);
    }).then(function(balance) {
      account_two_starting_balance = balance.toNumber();
      return coin.transfer(account_two, amount, {from: account_one});
    }).then(function() {
      return coin.balanceOf.call(account_one);
    }).then(function(balance) {
      account_one_ending_balance = balance.toNumber();
      return coin.balanceOf.call(account_two);
    }).then(function(balance) {
      account_two_ending_balance = balance.toNumber();

      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver");
    });
  });
  it("should transfer ownership by owner", function() {
    var coin = TheCoin.deployed();
    coin.transferOwnership(accounts[1], {from: accounts[0]});
    return coin.owner.call().then(
      function(newOwner){
          assert.equal(newOwner, accounts[1],"Ownership was not changed correctly");
      });
  });   
  it("should transfer ownership by owner only", function() {
    var coin = TheCoin.deployed();
    coin.transferOwnership(accounts[3], {from: accounts[2]})
    return coin.owner.call().then(
      function(newOwner){
          assert.notEqual(newOwner, accounts[3],"Ownership was incorrectly chnaged by non-owner");
          return coin.transferOwnership(accounts[0], {from: accounts[1]});
      });
  }); 
    it("should mintTokens by owner", function() {
    var coin = TheCoin.deployed();
    coin.mintToken(accounts[4], 10, {from: accounts[0]});
    return coin.balanceOf.call(accounts[4], {from: accounts[0]}).then(
      function(balance){
          assert.equal(balance,10, "Tokens were not minted");
      });
  });  
    it("should mintTokens by owner only", function() {
    var coin = TheCoin.deployed();
    coin.mintToken(accounts[4], 10, {from: accounts[1]});
    return coin.balanceOf.call(accounts[4], {from: accounts[0]}).then(
      function(balance){
          assert.equal(balance,10, "Tokens were not minted");
      });
  });  
  it("should freeze account by owner", function() {
    var coin = TheCoin.deployed();
    coin.freezeAccount(accounts[4], true, {from: accounts[0]});
    return coin.frozenAccount.call(accounts[4], {from: accounts[0]}).then(
      function(frozen){
          assert.isTrue(frozen, "Account was not frozen correctly");
      });
  });   
  it("should freeze account by owner only", function() {
    var coin = TheCoin.deployed();
    coin.freezeAccount(accounts[5], true, {from: accounts[1]});
    return coin.frozenAccount.call(accounts[5], {from: accounts[0]}).then(
      function(frozen){
        var isTrue = frozen == false;
          assert.isTrue(isTrue, "Account was frozen incorrectly");
      });
  });   
    it("shouldn't transfer from a frozen account", function() {
    var coin = TheCoin.deployed();

    return coin.transfer(accounts[1], 10, {from: accounts[0]}).then(function(result) {
      return coin.freezeAccount(accounts[1], true, {from: accounts[0]});
      }).then(function() {
      return coin.transfer.call(accounts[2], 5, {from: accounts[1]});
      }).then(function(txed) {
        var isTrue = !txed;
        assert.isTrue(isTrue,"failed transfer didn't return false");
      return coin.freezeAccount(accounts[1], false, {from: accounts[0]});
    });
  }); 
});