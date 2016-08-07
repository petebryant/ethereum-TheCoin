contract('TheCoin', function(accounts) {
  it("should be true", function(done) {
    var coin = TheCoin.deployed();
    assert.isTrue(true);
    done();
  });
  it("should put 21000000 in the first account", function() {
    var coin = TheCoin.deployed();
    return coin.balanceOf.call(accounts[0]).then(function(balance) {
      assert.equal(balance.valueOf(), 21000000, "21000000 wasn't in the first account");
    });
  });
});