/* 
Based on a contract built by Vlad and Vitalik for Ether signal
If you need a license, refer to WTFPL.
*/
pragma solidity ^0.4.11;
contract EtherVote {
    event LogVote(bytes32 indexed proposalHash, bool pro, address addr);
    
    /// @notice I `pro? agree : disagree` with the statement whose hash is `proposalHash`
    /// @param proposalHash hash of the proposal    
    /// @param pro do you support it or not?   
    function vote(bytes32 proposalHash, bool pro) {
        // Log the vote
        LogVote(proposalHash, pro, msg.sender);
    }

    // again, no ether
    function () { throw; }
}