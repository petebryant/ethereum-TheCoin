module.exports = function(deployer) {
  deployer.deploy(Owned),
  deployer.deploy(TheCoin, 21000000, "TheCoin", 2, "#", 0);
};
