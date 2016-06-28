/* 
Contract built by Vlad and Vitalik for Ether signal
*/

contract EtherVote {
    event LogVote(bytes32 indexed proposalHash, bool pro, address addr);
    function vote(bytes32 proposalHash, bool pro) {
        LogVote(proposalHash, pro, msg.sender);
    }
}