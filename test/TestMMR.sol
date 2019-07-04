pragma solidity >=0.4.21 <0.6.0;

import "truffle/Assert.sol";
import "../contracts/MMR.sol";

/**
 * I wrote this solidity test file just to show how to use this library
 * More detail test cases are written in javascript. Please see TestMMR.js
 */
contract TestMMR {
    using MMR for MMR.Tree;
    MMR.Tree mmr;

    /**
     * Appending 10 items will construct a Merkle Mountain Range like below
     *              15
     *       7             14
     *    3      6     10       13       18
     *  1  2   4  5   8  9    11  12   16  17
     */
    function testMerkleMountainRange() public {
        mmr.append('0x0001'); // stored at index 1
        mmr.append('0x0002'); // stored at index 2
        mmr.append('0x0003'); // stored at index 4
        mmr.append('0x0004'); // stored at index 5
        mmr.append('0x0005'); // stored at index 8
        mmr.append('0x0006'); // stored at index 9
        mmr.append('0x0007'); // stored at index 11
        mmr.append('0x0008'); // stored at index 12
        mmr.append('0x0009'); // stored at index 16
        mmr.append('0x000a'); // stored at index 17

        uint256 index = 17;
        // Get a merkle proof for index 17
        (bytes32 root, uint256 size, bytes32[] memory peakBagging, bytes32[] memory siblings) = mmr.getMerkleProof(index);
        // using MMR library verify the root includes the leaf
        Assert.isTrue(MMR.inclusionProof(root, size, index, '0x000a', peakBagging, siblings), "should return true or reverted");
    }
}
