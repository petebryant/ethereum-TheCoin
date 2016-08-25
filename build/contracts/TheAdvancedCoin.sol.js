var Web3 = require("web3");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  return accept(tx, receipt);
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("TheAdvancedCoin error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("TheAdvancedCoin error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("TheAdvancedCoin contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of TheAdvancedCoin: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to TheAdvancedCoin.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: TheAdvancedCoin not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "_newSellPrice",
            "type": "uint256"
          },
          {
            "name": "_newBuyPrice",
            "type": "uint256"
          }
        ],
        "name": "setPrices",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_from",
            "type": "address"
          },
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "sellPrice",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "standard",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_target",
            "type": "address"
          },
          {
            "name": "_mintedAmount",
            "type": "uint256"
          }
        ],
        "name": "mintToken",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "buyPrice",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "buy",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "frozenAccount",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_spender",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          },
          {
            "name": "_extraData",
            "type": "bytes"
          }
        ],
        "name": "approveAndCall",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          },
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "sell",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_target",
            "type": "address"
          },
          {
            "name": "_freeze",
            "type": "bool"
          }
        ],
        "name": "freezeAccount",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "initialSupply",
            "type": "uint256"
          },
          {
            "name": "tokenName",
            "type": "string"
          },
          {
            "name": "decimalUnits",
            "type": "uint8"
          },
          {
            "name": "tokenSymbol",
            "type": "string"
          },
          {
            "name": "centralMinter",
            "type": "address"
          }
        ],
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "target",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "frozen",
            "type": "bool"
          }
        ],
        "name": "FrozenFunds",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x60a0604052600b6060527f546865436f696e20312e300000000000000000000000000000000000000000006080526001805460008290527f546865436f696e20312e3000000000000000000000000000000000000000001682556100b4907fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf66020600283861615610100026000190190931692909204601f01919091048101905b8082111561016557600081556001016100a0565b5050604051610ced380380610ced8339810160405280805190602001909190805182019190602001805190602001909190805182019190602001805190602001909190505083838360008054600160a060020a031916331790558260026000509080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061016957805160ff19168380011785555b506101999291506100a0565b5090565b82800160010185558215610159579182015b8281111561015957825182600050559160200191906001019061017b565b50506004805460ff19168317905560038054825160008390527fc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b602060026001851615610100026000190190941693909304601f90810184900482019386019083901061021957805160ff19168380011785555b506102499291506100a0565b8280016001018555821561020d579182015b8281111561020d57825182600050559160200191906001019061022b565b5050505050600160a060020a0381166000146102725760008054600160a060020a031916821790555b60008054600160a060020a031681526006602052604090208590555050505050610a4d806102a06000396000f3606060405236156100f05760e060020a600035046305fefda781146100f857806306fdde031461011c57806318160ddd1461017657806323b872dd1461017f578063313ce567146101b15780634b750334146101bd5780635a3b7e42146101c657806370a082311461022257806379c650681461023a5780638620410b1461025e5780638da5cb5b1461026757806395d89b4114610279578063a6f2ae3a146102d6578063a9059cbb14610306578063b414d4b614610335578063cae9ca5114610350578063dd62ed3e146104b6578063e4849b32146104db578063e724529c14610507578063f2fde38b1461052b575b61054c610002565b61054c60043560243560005433600160a060020a039081169116146105da57610002565b61054e60028054602060018216156101000260001901909116829004601f810182900490910260809081016040526060828152929190828280156106105780601f106105e557610100808354040283529160200191610610565b6105bc60085481565b6105c6600435602435604435600160a060020a0383166000908152600b602052604081205460ff161561061857610002565b6105bc60045460ff1681565b6105bc60095481565b61054e600180546020600282841615610100026000190190921691909104601f810182900490910260809081016040526060828152929190828280156106105780601f106105e557610100808354040283529160200191610610565b6105bc60043560066020526000908152604090205481565b61054c60043560243560005433600160a060020a0390811691161461076c57610002565b6105bc600a5481565b6105bc600054600160a060020a031681565b61054e60038054602060026001831615610100026000190190921691909104601f810182900490910260809081016040526060828152929190828280156106105780601f106105e557610100808354040283529160200191610610565b600a5430600160a060020a031660009081526006602052604090205461054c913404908190101561080357610002565b61054c60043560243533600160a060020a03166000908152600660205260409020548190101561084a57610002565b6105c6600435600b6020526000908152604090205460ff1681565b6020604435600481810135601f8101849004909302608090810160405260608481526105c6948335946024803595946064949392909101919081908382808284375094965050505050505060006000836007600050600033600160a060020a03168152602001908152602001600020600050600087600160a060020a031681526020019081526020016000206000508190555084905080600160a060020a031663bde6312c338630876040518560e060020a0281526004018085600160a060020a0316815260200184815260200183600160a060020a03168152602001806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600f02600301f150905090810190601f1680156104895780820380516001836020036101000a031916815260200191505b50955050505050506000604051808303816000876161da5a03f11561000257506001979650505050505050565b6007602090815260043560009081526040808220909252602435815220546105bc9081565b61054c60043533600160a060020a03166000908152600660205260409020548190101561092d57610002565b61054c60043560243560005433600160a060020a039081169116146109b557610002565b61054c60043560005433600160a060020a03908116911614610a0b57610002565b005b60405180806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600f02600301f150905090810190601f1680156105ae5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6060908152602090f35b604080519115158252519081900360200190f35b600991909155600a55565b820191906000526020600020905b8154815290600101906020018083116105f357829003601f168201915b505050505081565b600660205260408120548290101561062f57610002565b600160a060020a03831681526040812054828101101561064e57610002565b600160a060020a03808516825260076020908152604080842033909316845291905281205482111561067f57610002565b816006600050600086600160a060020a03168152602001908152602001600020600082828250540392505081905550816006600050600085600160a060020a03168152602001908152602001600020600082828250540192505081905550816007600050600086600160a060020a03168152602001908152602001600020600050600033600160a060020a0316815260200190815260200160002060008282825054039250508190555082600160a060020a031684600160a060020a0316600080516020610a2d833981519152846040518082815260200191505060405180910390a35060019392505050565b600160a060020a0380831660009081526006602090815260408220805485019055600880548501905581546060858152931692600080516020610a2d8339815191529190a381600160a060020a0316600060009054906101000a9004600160a060020a0316600160a060020a0316600080516020610a2d833981519152836040518082815260200191505060405180910390a35050565b60406000818120600160a060020a03338116808452938320805486019055301691829052805484900390556060838152600080516020610a2d83398151915290602090a350565b600160a060020a03821660009081526040902054808201101561086c57610002565b33600160a060020a03166000908152600b602052604090205460ff161561089257610002565b806006600050600033600160a060020a03168152602001908152602001600020600082828250540392505081905550806006600050600084600160a060020a0316815260200190815260200160002060008282825054019250508190555081600160a060020a031633600160a060020a0316600080516020610a2d833981519152836040518082815260200191505060405180910390a35050565b6040600081812030600160a060020a0390811683529282208054850190553390921680825282548490039092556009548302606082818181858883f19350505050151561097957610002565b30600160a060020a031633600160a060020a0316600080516020610a2d833981519152836040518082815260200191505060405180910390a350565b600160a060020a0382166000818152600b602052604090819020805460ff19168417905560609182528215156080527f48335238b4855f35377ed80f164e8c6f3c366e54ac00b96a6402d4a9814a03a591a15050565b6000805473ffffffffffffffffffffffffffffffffffffffff1916821790555056ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "updated_at": 1472147256059,
    "links": {},
    "address": "0xddb28727c3bb69145f58e3b56aaf1dcdd8131abc"
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "object") {
      Object.keys(name).forEach(function(n) {
        var a = name[n];
        Contract.link(n, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "TheAdvancedCoin";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.1.2";

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.TheAdvancedCoin = Contract;
  }
})();
