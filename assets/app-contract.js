import { Contract, ethers } from "./ethers-5.0.esm.min.js";
var provider,
    signer,
    networkInHouse = ['name', 'networkId', 'explorerToken', 'explorerTx'],
    isMetaMaskLocked,
    address,
    contractABIToUse,
    contractType,
    contractAddress;

var metamaskStatus = $('#metamask-status');
var accountAddress = $('#current-address');
var currentNetwork = $('#current-network');
var metamaskLocked = $('#metamask-locked');
var metamaskUnlocked = $('#metamask-unlocked');

var addressForm = $('#address-form');
var addressFormInput = $('#address-form :input');
var functionEntryForm = $('#functionEntryForm');
var functionEntryFormInput = $('#functionEntryForm :input');
//disable all form input fields
addressFormInput.prop("disabled", true);

window.addEventListener('load', async () => {
    // New ethereum provider
    if (window.ethereum) {
        console.log("New MetaMask provider detected");
        // Instance ethers with the provided information
        provider = new ethers.providers.Web3Provider(window.ethereum);
        provider.on("network", providerBlockAdjust);
        signer = provider.getSigner();
        // ask user for permission
        metamaskStatus
            .html('Please allow MetaMask to view your addresses')
            .css({
                "text-align": "center",
                "color": "#0000ff"
            })
            .show();
        requestAccounts().then(function (abc) {
            // user approved permission
            console.log("abc ===>", abc);
            start();
        }).catch(function (error) {
            metamaskStatus.css({ "color": "#ff0000" })
            // user rejected permission
            if (error.code == 4001) {
                metamaskStatus.html('You reject the permission request, Please refresh to try again');
                console.log("User rejected the permission request.");
            } else if (error.code == -32002) {
                metamaskStatus.html("Metamask permission request is already pending</br>Open Metamask to allow")
                    .css({ "color": "#ffa500" });
            } else {
                metamaskStatus.html(error.message);
                console.error("Error while try to connect with Metamask", error);
            }
        });
    }
    // No web3 provider
    else {
        console.log('No web3 provider detected || web3 not exits');
        metamaskStatus.html('You do not appear to be connected to any Harmony network. To use this service and deploy your contract, we recommend using the <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en">MetaMask</a> plugin for Google Chrome, which allows your web browser to connect to an Harmony network.').show();
    }
});

function providerBlockAdjust(newNetwork, oldNetwork) {
    if(oldNetwork) {
        window.location.reload();
    }
}

function handleAccountsChanged(accounts) {
    // Handle the new accounts, or lack thereof.
    // "accounts" will always be an array, but it can be empty.
    window.location.reload();
}

function handleChainChanged(_chainId) {
    window.location.reload();
}

function metamaskEvents() {
    ethereum.on('accountsChanged', handleAccountsChanged)
        .on('chainChanged', handleChainChanged);
}

function start() {
    addressFormInput.prop("disabled", false);
    metamaskStatus.hide()
    metamaskEvents()
    getEthNetworkId()
        .then(function (networkId) {
            console.log("Network ID: "+networkId);
            if (networkId === '1') {
                networkInHouse['name'] = 'Ethereum Mainnet';
                networkInHouse['networkId'] = networkId;
                networkInHouse['explorerToken'] = 'https://etherscan.io/token/';
                networkInHouse['explorerTx'] = 'https://etherscan.io/tx/';
                currentNetwork.html('You are currently connected to the <b style="color: red;">' + networkInHouse['name'] + ' (ID: ' + networkInHouse['networkId'] + ')</b>').show();
            } else if (networkId === '3') {
                networkInHouse['name'] = 'Ethereum Ropsten testnet';
                networkInHouse['networkId'] = networkId;
                networkInHouse['explorerToken'] = 'https://ropsten.etherscan.io/token/';
                networkInHouse['explorerTx'] = 'https://ropsten.etherscan.io/tx/';
                currentNetwork.html('You are currently connected to the <b style="color: red;">' + networkInHouse['name'] + ' (ID: ' + networkInHouse['networkId'] + ')</b>').show();
            } else if (networkId === '4') {
                networkInHouse['name'] = 'Ethereum Rinkeby testnet';
                networkInHouse['networkId'] = networkId;
                networkInHouse['explorerToken'] = 'https://rinkeby.etherscan.io/token/';
                networkInHouse['explorerTx'] = 'https://rinkeby.etherscan.io/tx/';
                currentNetwork.html('You are currently connected to the <b style="color: red;">' + networkInHouse['name'] + ' (ID: ' + networkInHouse['networkId'] + ')</b>').show();
            } else if (networkId === '5') {
                networkInHouse['name'] = 'Ethereum Goerli testnet';
                networkInHouse['networkId'] = networkId;
                networkInHouse['explorerToken'] = 'https://goerli.etherscan.io/token/';
                networkInHouse['explorerTx'] = 'https://goerli.etherscan.io/tx/';
                currentNetwork.html('You are currently connected to the <b style="color: red;">' + networkInHouse['name'] + ' (ID: ' + networkInHouse['networkId'] + ')</b>').show();
            } else if (networkId === '0x63564c40') {
                networkInHouse['name'] = 'Harmony Mainnet';
                networkInHouse['networkId'] = networkId;
                networkInHouse['explorerToken'] = 'https://explorer.harmony.one/#/address/';
                networkInHouse['explorerTx'] = 'https://explorer.harmony.one/#/tx/';
                currentNetwork.html('You are currently connected to the <b style="color: red;">' + networkInHouse['name'] + ' (ID: ' + networkInHouse['networkId'] + ')</b>').show();
            } else if (networkId === '0x6357d2e0') {
                networkInHouse['name'] = 'Harmony Testnet';
                networkInHouse['networkId'] = networkId;
                networkInHouse['explorerToken'] = 'https://explorer.pops.one/#/address/';
                networkInHouse['explorerTx'] = 'https://explorer.pops.one/#/tx/';
                currentNetwork.html('You are currently connected to the <b style="color: red;">' + networkInHouse['name'] + ' (ID: ' + networkInHouse['networkId'] + ')</b>').show();
            } else {
                networkInHouse['name'] = 'none';
                networkInHouse['networkId'] = networkId;
                networkInHouse['explorerToken'] = '';
                networkInHouse['explorerTx'] = '';
                currentNetwork.text('Your current network id is <b style="color: red;">(' + networkId + ')</b>.  If this is showing random numbers, please contact us.').show();
            }
        })
        .fail(function (err) {
            console.log(err)
        });

    setInterval(function () {
        isLocked()
            .then(function (isLocked) {
                if (isLocked) {
                    isMetaMaskLocked = true;
                    metamaskUnlocked.hide();
                    accountAddress.hide();
                    metamaskLocked.show();
                    addressFormInput.prop("disabled", true);
                    throw Error("Metamask Locked");
                }
                metamaskUnlocked.show();
                metamaskLocked.hide();

                return getAccount();
            })
            .then(function (account) {
                if (account.length > 0) {
                    if (isMetaMaskLocked) {
                        isMetaMaskLocked = false;
                        addressFormInput.prop("disabled", false);
                    }
                    address = account[0];
                    return getBalance(account[0]);
                }
            })
            .then(function (balance) {
                accountAddress.html('<strong>Selected Account: ' + address + '<br /><br />(' + balance + ' ONE)</strong>').show();
            })
            .fail(function (err) {
                if (err.message !== "Metamask Locked")
                    console.log(err)
            });
    }, 5 * 1000);
}

function sendSync(params) {
    var defer = $.Deferred();
    window.ethereum.request(params).then(function (result) {
        defer.resolve(result)
    }).catch(function (error) {
        return defer.reject(error);
    });
    return defer.promise();
}

function getEthNetworkId() {
    return sendSync({ method: "net_version" })
        .then(function (result) {
            return result;
        })
        .fail(function (err) {
            console.log(err);
            return err;
        });
}

function requestAccounts() {
    return sendSync({ method: 'eth_requestAccounts' })
        .then(function (result) {
            return result;
        })
        .fail(function (err) {
            console.log(err);
            return err;
        });
}

function getAccount() {
    return sendSync({ method: "eth_accounts" })
        .then(function (result) {
            return result;
        })
        .fail(function (err) {
            console.log(err);
            return err;
        });
}

function getBalance(address) {
    return sendSync({ method: "eth_getBalance", params: [address] })
        .then(function (result) {
            return ethers.utils.formatEther(ethers.BigNumber.from(result));
        })
        .fail(function (err) {
            return err;
        });
}

function isLocked() {
    return getAccount()
        .then(function (accounts) {
            return accounts.length <= 0;
        })
        .fail(function (err) {
            return err
        });
}

functionEntryForm.submit(function (e) {

    //prevent the form from actually submitting.
    e.preventDefault();

    var submittalArray = [];

    $('#functionEntryForm *').filter(':input').each(function() {
        submittalArray.push($(this).val());
    });

    var methodToUse = submittalArray[0];

    submittalArray.shift();
    submittalArray.shift();
    submittalArray.pop();

    var tokenContract = new ethers.Contract(contractAddress, contractABIToUse, signer);
    tokenContract[methodToUse](...submittalArray, {gasPrice: 2000000000}).then(function(result) {
        console.log(result);
        if(typeof result === 'object' && typeof result.value === 'object') {
            statusField.innerHTML = "<p align=\"center\" style=\"color: green\">Successfully Executed<br /><br />Returned Value (may not hold any pertinent information):<br /><br />" + result.value + "</p>";
        } else {
            statusField.innerHTML = "<p align=\"center\" style=\"color: green\">" + result + "</p>";
        }
        if(result.hash != undefined) {
            statusField.innerHTML += "<br /><br /><p align=\"center\"><b>Transaction Hash:<b><br /><br /><a href=\"" + networkInHouse['explorerTx'] + result.hash + "\" target=\"_blank\">" + result.hash + "</a></p>";
        }
    }).catch(function(error) {
        console.error(error);
        statusField.innerHTML = "<p align='center' style='color: red'>Error: " + error.data.message + "</p>";
    });
})

addressForm.submit(function (e) {
    
    //prevent the form from actually submitting.
    e.preventDefault();

    $('#functionToUse').empty().append('<option value="null">Select a function</option>');
    contractAddress = $('#address').val();
    contractABIToUse = JSON.parse($('#abi-to-use').val());
    console.log(contractABIToUse);
    console.log(contractABIToUse.length);

    if (contractAddress === '') {
        alert('address can\'t be blank');
    } else if (contractABIToUse === '') {
        alert('ABI can\'t be blank');
    } else {
        //addressFormInput.prop("disabled", true);

        statusField.innerHTML = '<p align="center">Waiting to connect to contract.<br /><br />If nothing happens for a little bit, press F12 to look for errors.</p>';

        statusField.innerHTML = '<p align="center">Awaiting function selection</p>';
        for(var i=0; i<contractABIToUse.length; i++) {
            if(contractABIToUse[i].type === "function") {
                var opt = document.createElement('option');
                opt.value = i;
                opt.innerHTML = contractABIToUse[i].name+" - "+contractABIToUse[i].stateMutability+" - "+contractABIToUse[i].type;
                functionToUse.appendChild(opt);
            }
        }

        console.log(functionToUse);
        
        setTimeout(function() {
            $("#interactionField").show();
        }, 1000);
    }
});

$(function () {
    $("#preloaded_contracts").change(function() {
        var selectedName = $(this).val();
        
        var arrayAssoc = { "hrc20_standard": hrc20_standard_abi, "tj_mintable": tj_mintable_abi, "tj_hardcap": tj_hardcap_abi, "ript_io_token_creator": ript_io_token_creator_abi, "onchainmining": onchainmining_abi, "tj_mooncoin": mooncoin_abi, "viperswap_masterbreeder": viperswap_masterbreeder, "tj_hardcap_pausable": tj_hardcap_pausable_abi };

        //console.log(arrayAssoc[selectedName]);

        document.getElementById("abi-to-use").value = JSON.stringify(arrayAssoc[selectedName]);
    });
});

$(function () {
    $("#functionToUse").change(function() {
        statusField.innerHTML = '<p align="center">Awaiting function execution</p>';

        var selectedID = $(this).val()
        console.log(contractABIToUse[selectedID]);
        $("#functionEntryData").show();
        $("#functionEntryForm").empty();

        var functionEntryForm = document.getElementById('functionEntryForm');
        functionEntryForm.appendChild(document.createElement("br"));
        var hiddenName = document.createElement('input');
        hiddenName.type = "hidden";
        hiddenName.value = contractABIToUse[selectedID].name;
        functionEntryForm.appendChild(hiddenName);
        var hiddenInputCount = document.createElement('input');
        hiddenInputCount.type = "hidden";
        hiddenInputCount.value = contractABIToUse[selectedID].inputs.length;
        functionEntryForm.appendChild(hiddenInputCount);

        if(contractABIToUse[selectedID].inputs.length >= 1) {
            for(var i=0; i<contractABIToUse[selectedID].inputs.length; i++) {
                var addDiv = document.createElement('div');
                addDiv.classList.add("form-group");
                var addEle = document.createElement('input');
                addEle.type = "text";
                addEle.name = contractABIToUse[selectedID].inputs[i]['name'];
                addEle.classList.add("form-control");
                addEle.style = "text-align: center; width: 500px; margin: 5px;";
                addEle.id = contractABIToUse[selectedID].inputs[i]['name'];
                addEle.placeholder = contractABIToUse[selectedID].inputs[i]['name']+"     -     Type: " + contractABIToUse[selectedID].inputs[i]['type'];
                addEle.required = true;

                addDiv.appendChild(addEle);
                functionEntryForm.appendChild(addDiv);
            }
        } else {
            var addDiv = document.createElement('div');
            addDiv.classList.add("form-group");
            addDiv.innerHTML = "This function requires no inputs.  You may hit \"Execute Function\" to query.<br /><br />";

            functionEntryForm.appendChild(addDiv);
        }

        var addHR = document.createElement('hr');
        var addDiv = document.createElement('div');
        addDiv.class = "form-group";
        var addEle = document.createElement('button');
        addEle.align = "center";
        addEle.style = "text-align: center; border-radius: 8px; padding: 14px 40px; font-size: 16px; background-color: #008CBA; border: none; text-decoration: none; display: inline-block; margin-top: 15px;"
        addEle.id = "submit-btn";
        addEle.type = "submit";
        addEle.innerHTML = "Execute Function";

        addDiv.appendChild(addEle);
        functionEntryForm.appendChild(addDiv);
        functionEntryForm.appendChild(document.createElement("br"));
        functionEntryForm.appendChild(addHR);
    });
});