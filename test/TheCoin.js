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
          assert.isTrue(isTrue,"failed call didn't return false");
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
});