
var ethervote, ethervoteContract;
var proposalHash;
var contractAddress = '0xa93c0838daa2631bb66eb460ccfd551e16e9306f';
var contractAddressTestnet = '0xa93c0838daa2631bb66eb460ccfd551e16e9306f';

var totalVotes;
var contractABI = [{"constant":false,"inputs":[{"name":"proposalHash","type":"bytes32"},{"name":"pro","type":"bool"}],"name":"vote","outputs":[],"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalHash","type":"bytes32"},{"indexed":false,"name":"pro","type":"bool"},{"indexed":false,"name":"addr","type":"address"}],"name":"LogVote","type":"event"}];

function init() {

    // Get parameters and set up the basic structure
    var proposal = decodeURI(getParameterByName('proposal'));
    var proposalText = document.getElementById('proposal');
    proposalText.textContent = proposal;
    
    // Add event listeners
    document.getElementById('see-results').addEventListener('click', function(){
        document.getElementById("results").style.opacity = "1";
        document.getElementById("see-results").style.opacity = "0";
        checkVotes();
    } , false);

    document.getElementById('vote-support').addEventListener('click', function(){ vote(true);}, false);
    document.getElementById('vote-against').addEventListener('click', function(){ vote(false);}, false);
    
    var newProposalInput = document.getElementById('new-proposal');    
    newProposalInput.addEventListener('keypress', function() {
        document.getElementById("new-proposal-link").style.display = "block";
    });

    newProposalInput.addEventListener('blur', newProposal);

    // Check if web3 is present
    if (typeof web3 === 'undefined') {
        document.getElementById("results").style.display = "none";
        document.getElementById("see-results").style.display = "none";
        document.getElementById("vote-support").style.display = "none";
        document.getElementById("vote-against").style.display = "none";
        document.getElementById("subtitle").style.display = "none";
        document.getElementById("proposal").textContent = "Give Stakers a Voice";
        
        var message = document.getElementById("message");
        message.style.display = "block";
        return;
    }

    if (!web3.eth.accounts || web3.eth.accounts.length == 0) {
        document.getElementById("vote-support").style.display = "none";
        document.getElementById("vote-against").style.display = "none";
        document.getElementById("add-account").style.display = "block";
    }


    // Do things that require web3
    proposalHash = web3.sha3(proposal);
    document.body.style.background = "#" + proposalHash.substr(2,6);

    if (proposalHash == '0xefbde2c3aee204a69b7696d4b10ff31137fe78e3946306284f806e2dfc68b805') {
        // No Proposals
        document.getElementById("results").style.display = "none";
        document.getElementById("see-results").style.display = "none";
        document.getElementById("vote-support").style.display = "none";
        document.getElementById("vote-against").style.display = "none";
        document.getElementById("subtitle").style.display = "none";
        document.getElementById("proposal").textContent = "Give Stakers a Voice";
        var message = document.getElementById("message");
        message.style.display = "block";
        message.textContent = "This tool will enable anyone to create any statement that ethereum token holders can voice their support or opposition to.";
    } else {
        // GET the latest blockchain information
        web3.eth.filter('latest').watch(function(e, res){
            if(!e) {
                console.log('Block arrived ', res);
                checkVotes();
            }
        });        
    }

    // Load the contract
    web3.eth.getCode(contractAddress, function(e, r) { 
        console.log(e, r);
        if (!e) {
            if (r.length < 3) {
                contractAddress = contractAddressTestnet;
            }

            // Load the contract
            ethervoteContract = web3.eth.contract(contractABI);
            ethervote = ethervoteContract.at(contractAddress);
        }
    })    
}

function checkVotes() {
    // Set the texts and variables
    var status = document.getElementById('status');
    status.textContent = 'Calculating votes...';

    var proMap = {};
    var antiMap = {};
    var logVotes = ethervote.LogVote({proposalHash: proposalHash}, {fromBlock: 1000000});
    
    // Start the watch
    console.time('watch')
    logVotes.watch(function(error, res){ 
        if (!error) {
            var totalPro = 0;
            var totalAgainst = 0;

            var bal = Number(web3.fromWei(web3.eth.getBalance(res.args.addr), "finney"));

            if (res.args.pro) {
                proMap[res.args.addr] = bal;
                antiMap[res.args.addr] = 0;
            } else {
                proMap[res.args.addr] = 0;
                antiMap[res.args.addr] = bal;
            }

            if (web3.eth.accounts && web3.eth.accounts[0] == res.args.addr) {
                if (res.args.pro) {
                    document.getElementById('vote-support').classList.add("pressed");
                    document.getElementById('vote-against').classList.remove("pressed");
                } else {
                    document.getElementById('vote-support').classList.remove("pressed");
                    document.getElementById('vote-against').classList.add("pressed");
                }
            }

            Object.keys(proMap).map(function(a) { totalPro += parseFloat(proMap[a]); });
            Object.keys(antiMap).map(function(a) { totalAgainst += parseFloat(antiMap[a]); });

            totalVotes = totalPro + totalAgainst;
            console.log('totalVotes', totalVotes);

            document.getElementById("results").style.display = "block";                
            var proResult = document.getElementById('support');
            proResult.textContent = convertToString(totalPro, totalVotes);
            proResult.style.width = Math.round(totalPro/totalVotes)*100 + "%";            

            var againstResult = document.getElementById('opposition');
            againstResult.textContent = convertToString(totalAgainst, totalVotes);
            againstResult.style.width = Math.round(totalAgainst/totalVotes)*100 + "%";
            
            document.getElementById("message").style.display = "none";

            console.timeEnd('watch');
        }
    })

    setTimeout(function(){
        status.textContent = '';
        console.log(totalVotes);
        if (!(totalVotes > 0)){
            document.getElementById("results").style.display = "none";
            var message = document.getElementById("message");
            message.textContent = "No votes yet. Vote now!";
            message.style.display = "block";
        }

    }, 1000);
}

function convertToString(vote, total){
    var magnitude = Math.floor(Math.log10(total));

    if (magnitude <= 3) {
        return Math.round(vote*10)/10 + " finney";
    } else if (magnitude < 6) {
        return Math.round(vote/10)/100 + " ether";
    } else if (magnitude < 9) {
        return Math.round(vote/10000)/100 + "k ether";
    } else {
        return Math.round(vote/10000000)/100 + " million ether";
    }

}

function vote(support) {
    // alert(support);
    console.log('accounts', web3.eth.accounts , web3.eth.accounts.length , web3.eth.accounts && web3.eth.accounts.length > 0)
    if (web3.eth.accounts && web3.eth.accounts.length > 0) {
        console.log(web3.eth.accounts[0]);
        ethervote.vote(proposalHash, support, {from: web3.eth.accounts[0]})
        // checkVotes();
        var status = document.getElementById('status');
        status.textContent = 'Waiting for new block...';

      } else {
        alert('add account')
      }

    document.getElementById("results").style.opacity = "1";
    document.getElementById("see-results").style.opacity = "0";
}


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function newProposal() {
    var newProposal = document.getElementById('new-proposal');
    var newProposalLink = document.getElementById('new-proposal-link');
    newProposalLink.href = '?proposal=' + encodeURI(newProposal.value);
}
