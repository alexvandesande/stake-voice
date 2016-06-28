
var ethervote, ethervoteContract;
var proposalHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
var contractAddress = '0xa93c0838daa2631bb66eb460ccfd551e16e9306f';

function init() {
    // set events
    var seeResultsButton = document.getElementById('see-results');
    seeResultsButton.addEventListener('click', checkVotes , false);

    var supportButton = document.getElementById('vote-support');
    supportButton.addEventListener('click', function(){ vote(true);}, false);

    var againstButton = document.getElementById('vote-against');
    againstButton.addEventListener('click', function(){ vote(false);}, false);
    
    var newProposalInput = document.getElementById('new-proposal');
    newProposalInput.addEventListener('blur', newProposal);

    // get parameters
    var proposal = decodeURI(getParameterByName('proposal'));

    var proposalText = document.getElementById('proposal');
    proposalText.textContent = proposal;
    
    proposalHash = web3.sha3(proposal);

    // detect web3
    if (typeof web3 == 'undefined') 
        alert('Mist required. Download it at ethereum.org');

    // Load the contract
    ethervoteContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"proposalHash","type":"bytes32"},{"name":"pro","type":"bool"}],"name":"vote","outputs":[],"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalHash","type":"bytes32"},{"indexed":false,"name":"pro","type":"bool"},{"indexed":false,"name":"addr","type":"address"}],"name":"LogVote","type":"event"}]);

    ethervote = ethervoteContract.at(contractAddress);

    // GET the latest blockchain information
    web3.eth.filter('latest').watch(function(e, res){
        if(!e) {
            console.log('Block arrived ', res);
            checkVotes();
        }
    });

    checkVotes();
}

function checkVotes() {

    var status = document.getElementById('status');
    status.textContent = 'Calculating votes...';

    var proMap = {};
    var antiMap = {};

    var logVotes = ethervote.LogVote({proposalHash: proposalHash}, {fromBlock: 1000000});
    
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

            Object.keys(proMap).map(function(a) { totalPro += parseFloat(proMap[a]); });
            Object.keys(antiMap).map(function(a) { totalAgainst += parseFloat(antiMap[a]); });

            var proResult = document.getElementById('support');
            proResult.textContent = totalPro;

            var againstResult = document.getElementById('opposition');
            againstResult.textContent = totalAgainst;
        }
    })

    setTimeout(function(){
        status.textContent = '';
    }, 2000);
}

function vote(support) {
    // alert(support);
    if (web3.eth.accounts && web3.eth.accounts.length > 0) {
        console.log(web3.eth.accounts[0]);
        ethervote.vote(proposalHash, support, {from: web3.eth.accounts[0]})
        // checkVotes();
        var status = document.getElementById('status');
        status.textContent = 'Waiting for new block...';

      } else {
        alert('add account')
      }
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
