# Solidity Merkle Mountain Range library

[![npm](https://img.shields.io/npm/v/solidity-mmr/latest.svg)](https://www.npmjs.com/package/solidity-mmr)
[![Build Status](https://travis-ci.org/wanseob/solidity-mmr.svg?branch=master)](https://travis-ci.org/wanseob/solidity-mmr)

### Deployed state

- Mainnet: 0x7a1092e623f1194c4f89fef82f405075ba348e76 [view on Etherscan](https://etherscan.io/address/0x7a1092e623f1194c4f89fef82f405075ba348e76#contracts)
- Ropsten: 0x3708b7360f31467355cf38013161865eb8bde15f [view on Etherscan](https://ropsten.etherscan.io/address/0x3708b7360f31467355cf38013161865eb8bde15f#contracts)

### What is Merkle Mountain Range?

1. Append only data structure
1. Easy for inclusion proof
1. Use significantly small amount of gas to insert a new item
   - To append 1000 items, MMR used 95307 gas on average while Merkle patricia tree used 676606 gas
   - Regarding to insert, MMR was roughly 7 more times cheaper than MPT

To get more detail information [see this](https://github.com/mimblewimble/grin/blob/master/doc/mmr.md)

### How to use?

1. Run the following command in your repository(if you are working on javascript dev env like truffle)

   ```sh
   npm install --save solidity-mmr
   ```

1. import to your smart contract. See [MMRWrapper.sol](contracts/MMRWrapper.sol).

   ```solidity
   pragma solidity >=0.4.21 <0.6.0;

   import {MMR} from "solidity-mmr/contracts/MMR.sol";

   contract TestMMR {
       using MMR for MMR.Tree;
       MMR.Tree mmr;

       /**
        * Merkle Mountain Range tree looks like below
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
           // Get merkle proof for index number 17
           (bytes32 root, uint256 size, bytes32[] memory peakBagging, bytes32[] memory siblings) = mmr.getMerkleProof(index);
           // using MMR library verify inclusion
           Assert.isTrue(MMR.inclusionProof(root, size, index, '0x000a', peakBagging, siblings), "should return true or reverted");
       }
   }
   ```

### APIs

```solidity
/**
 * @dev This only stores the hashed value of the leaf.
 * If you need to retrieve the detail data later, use a map to store them.
 */
function append(Tree storage tree, bytes memory data) public;

/**
 * @dev It returns the root value of the tree
 */
function getRoot(Tree storage tree) public view returns (bytes32);

/**
 * @dev It returns the size of the tree
 */
function getSize(Tree storage tree) public view returns (uint256);

/**
 * @dev It returns the hash value of a node for the given position. Note that the index starts from 1
 */
function getNode(Tree storage tree, uint256 index) public view returns (bytes32);

/**
 * @dev It returns a merkle proof for the given position. Note that the index starts from 1
 */
function getMerkleProof(Tree storage tree, uint256 index) public view returns (
    bytes32 root,
    uint256 size,
    bytes32[] memory peakBagging,
    bytes32[] memory siblings
);

/** Pure functions */

/**
 * @dev It returns true when the given params verifies that the given value exists in the tree or reverts the transaction.
 */
function inclusionProof(
    bytes32 root,
    uint256 size,
    uint256 index,
    bytes memory value,
    bytes32[] memory peakBagging,
    bytes32[] memory siblings
) public pure returns (bool);

// Hash(M | Left | Right )
function hashParent(uint256 index, bytes32 left, bytes32 right) public pure returns (bytes32);

// Hash(M | DATA )
function hashLeaf(uint256 index, bytes memory data) public pure returns (bytes32);

/**
 * It returns the height of the highest peak
 */
function mountainHeight(uint256 size) public pure returns (uint8);

/**
 * It returns the height of the index
 */
function heightAt(uint256 index) public pure returns (uint8 height);

function isLeaf(uint256 index) public pure returns (bool);

function getChildren(uint256 index) public pure returns (uint256 left, uint256 right);

/**
 * @dev It returns all peaks of the smallest merkle mountain range tree which includes
        the given index(size)
 */
function getPeaks(uint256 size) public pure returns (uint256[] memory peaks);
```

### Contribution

- Please check the test cases in the [TestMMR.js](test/TestMMR.js)

### Future work

- ZK RollUp for MMR (compare the gas cost)

### License

This software is under the [MIT License](LICENSE)
