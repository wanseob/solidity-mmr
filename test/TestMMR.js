const MMRWrapper = artifacts.require('MMRWrapper');
const MMR = artifacts.require('MMR');
const chai = require('chai')
chai.use(require('chai-bn')(web3.utils.BN));
chai.use(require("chai-as-promised"));
chai.should();


/**
 * Merkle Mountain Range Tree
 * MMR
 */
contract("MerkleMountainRange", async () => {
    let mmrLib;
    let res;
    before(async () => {
        mmrLib = await MMR.new();
        await MMRWrapper.link("MMR", mmrLib.address);
        console.log('MMR Tree : 5 |                             31')
        console.log('           4 |             15                                 30                                    46')
        console.log('           3 |      7             14                 22                 29                 38                 45')
        console.log('           2 |   3      6     10       13       18       21        25       28        34        37       41        44       49')
        console.log('           1 | 1  2   4  5   8  9    11  12   16  17    19  20   23  24    26  27   32  33    35  36   39  40    42  43   47  48    50')
    })
    context('Test pure functions', async () => {
        describe('getChildren()', async () => {
            it('should return 1,2 as children for 3', async () => {
                res = await mmrLib.getChildren(3)
                res.left.should.be.a.bignumber.that.equals('1')
                res.right.should.be.a.bignumber.that.equals('2')
            })
            it('should return 3,6 as children for 7', async () => {
                res = await mmrLib.getChildren(7)
                res.left.should.be.a.bignumber.that.equals('3')
                res.right.should.be.a.bignumber.that.equals('6')
            })
            it('should return 22,29 as children for 30', async () => {
                res = await mmrLib.getChildren(30)
                res.left.should.be.a.bignumber.that.equals('22')
                res.right.should.be.a.bignumber.that.equals('29')
            })
            it('should be reverted for leaves like 1,2,4', async () => {
                await mmrLib.getChildren(1).should.be.rejected
                await mmrLib.getChildren(2).should.be.rejected
                await mmrLib.getChildren(4).should.be.rejected
            })
        })
        describe('getPeaks()', async () => {
            it('should return [15, 22, 25] for a mmr which size is 25', async () => {
                res = await mmrLib.getPeaks(25)
                res[0].should.be.a.bignumber.that.equals('15')
                res[1].should.be.a.bignumber.that.equals('22')
                res[2].should.be.a.bignumber.that.equals('25')
            })
            it('should return [3] for a mmr which size is 3', async () => {
                res = await mmrLib.getPeaks(3)
                res[0].should.be.a.bignumber.that.equals('3')
            })
            it('should return [31, 46, 49, 50] for a mmr which size is 50', async () => {
                res = await mmrLib.getPeaks(50)
                res[0].should.be.a.bignumber.that.equals('31')
                res[1].should.be.a.bignumber.that.equals('46')
                res[2].should.be.a.bignumber.that.equals('49')
                res[3].should.be.a.bignumber.that.equals('50')
            })
        })
        describe('hashParent()', async () => {
            it('should return sha3(m|left,right)', async () => {
                let left = web3.utils.soliditySha3(1, '0x00')// At 1
                let right = web3.utils.soliditySha3(2, '0x00')// At 2
                res = await mmrLib.hashParent(3, left, right)
                res.should.equal(web3.utils.soliditySha3(3, left, right))
            })
        })
        describe('hashLeaf()', async () => {
            it('should return sha3(m|data)', async () => {
                let leaf = web3.utils.soliditySha3(23, '0xa300')// At 1
                res = await mmrLib.hashLeaf(23, '0xa300')
                res.should.equal(leaf)
            })
        })
        describe('mountainHeight()', async () => {
            it('should return 3 for its highest peak when the size is less than 12 and greater than 4', async () => {
                for (let i = 5; i < 12; i++) {
                    (await mmrLib.mountainHeight(i)).should.be.a.bignumber.that.equals('3')
                }
            })
            it('should return 4 for its highest peak when the size is less than 27 and greater than 11', async () => {
                for (let i = 12; i < 27; i++) {
                    (await mmrLib.mountainHeight(i)).should.be.a.bignumber.that.equals('4')
                }
            })
        })
        describe('heightAt()', async () => {
            let firstFloor = [1, 2, 4, 5, 8, 9, 11, 12, 16, 17, 19, 20, 23, 24, 26, 27, 32, 33, 35, 36, 39, 40, 42, 43, 47, 48]
            let secondFloor = [3, 6, 10, 13, 18, 21, 25, 28, 34, 37, 41, 44, 49]
            let thirdFloor = [7, 14, 22, 29, 38, 45]
            let fourthFloor = [15, 30, 46]
            let fifthFloor = [31]
            it('should return 1 as the height of the index which belongs to the first floor', async () => {
                for (let index of firstFloor) {
                    (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('1')
                }
            })
            it('should return 2 as the height of the index which belongs to the second floor', async () => {
                for (let index of secondFloor) {
                    (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('2')
                }
            })
            it('should return 3 as the height of the index which belongs to the third floor', async () => {
                for (let index of thirdFloor) {
                    (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('3')
                }
            })
            it('should return 4 as the height of the index which belongs to the fourth floor', async () => {
                for (let index of fourthFloor) {
                    (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('4')
                }
            })
            it('should return 5 as the height of the index which belongs to the fifth floor', async () => {
                for (let index of fifthFloor) {
                    (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('5')
                }
            })
        })
    })

    context('Append items to an on-chain MMR tree', async () => {
        describe('append()', async () => {
            it('should increase the size to 15 when 8 items are added', async () => {
                let mmr = await MMRWrapper.new();
                for (let i = 0; i < 8; i++) {
                    await mmr.append('0x0000');
                }
                (await mmr.getSize()).should.be.a.bignumber.that.equals('15')
            })
            it('should increase the size to 50 when 27 items are added', async () => {
                let mmr = await MMRWrapper.new();
                for (let i = 0; i < 27; i++) {
                    await mmr.append('0x0000');
                }
                (await mmr.getSize()).should.be.a.bignumber.that.equals('50')
            })
        })
        describe('getMerkleProof()', async () => {
            /**
             |[LEAF](1, 0x0000) => 0xa85e69ea988ed58c849a3537e0237f906baec7697351ef6830751a984b45b9ee'
             |------[NODE](3, 0xa853.., 0xea7...) => 0x1ef993f0cf2a6b453c12c4dc5c634d9d509c55a9d27d849cc2105a73fa7822b5'
             |[LEAF](2, 0x0001) => 0xea7ca2ce425d20eee8c18f2aefbd660a76266e5e5351698d04b333187db92044'
             |------------[PEAK]  (7, 0x1ef9..., 0x91bd...)=> 0xfdb618490bb72540adc4f60681c449063ccd284c200b5524d55c4ecde3c28cc5'
             |[LEAF](4, 0x0002) => 0x5b09d08b1fd4a322d48fd6cb6bb49f11ef5b641c034cf885689eecb0d0aaaf37'
             |------[NODE](6, 0x5b09..., 0xd360...) => 0x91bd82d9d8326ed10fa09b58157a382fa2b14f86c0e0beff093cf8d2eabf1089'
             |[LEAF](5, 0x0003) => 0xd360c2ccda5896b9ae78e29e4f66d65891a273e9e925a146b5ca9b21f3082b7e'
             |
             |[LEAF](8, 0x0004) => 0x9320264d7bff01df37485d2d0fb3607841b37b38a0ff55707407e236318f03a4'
             |------[PEAK](10, 0x9320..., 0x91ea...) => 0x3fd82e5dd8a518732fa1bcb1ed12f15c69e5a4a2dca3a3b8bdbb457b6f6750bb'
             |[LEAF](9, 0x0005) => 0x91eafe2c928033160404d65f4f5e09c1b8a4411afd127753db0dcdc522897c57'
             |[PEAK](11, 0x0006) => 0x2fceabdcb4c1a9780bcdb9b0bdedc6d778319816dbf397d910228d48ff988646'

             Peak Bagging: sha3(11 | sha3(11 | 0xfdb61...| 0x3fd8... | 0x2fce...')) = 0x93e567ec8f93fd9917acde01f1fe243ca40e3fe499592ac8602447757993461f')
             */
            let mmr
            before(async () => {
                mmr = await MMRWrapper.new()
                for (let i = 0; i < 7; i++) {
                    await mmr.append(`0x000${i}`);
                }
                let index = 8
                res = await mmr.getMerkleProof(index)
            })
            it('should return 0x2f... for its root value', async () => {
                res.root.should.equal('0xba233bb115f487ce58f53e1f81d39d8d1b221402048e25155b745f1dce79c0d5')
            })
            it('should return 11 for its size', async () => {
                res.size.should.be.a.bignumber.that.equals('11')
            })
            it('should return [0xfdb6.., 0x3fd8.., 0x2fce..] for its peaks', async () => {
                res.peakBagging[0].should.equal('0xfdb618490bb72540adc4f60681c449063ccd284c200b5524d55c4ecde3c28cc5')
                res.peakBagging[1].should.equal('0x3fd82e5dd8a518732fa1bcb1ed12f15c69e5a4a2dca3a3b8bdbb457b6f6750bb')
                res.peakBagging[2].should.equal('0x2fceabdcb4c1a9780bcdb9b0bdedc6d778319816dbf397d910228d48ff988646')
            })
            it('should return hash value at the index 9 as its sibling', async () => {
                res.siblings[0].should.equal('0x91eafe2c928033160404d65f4f5e09c1b8a4411afd127753db0dcdc522897c57')
            })
        })
        describe('inclusionProof()', async () => {
            before(async () => {
                mmr = await MMRWrapper.new()
                for (let i = 0; i < 40; i++) {
                    await mmr.append('0x0000');
                }
            })
            it('should return pass true when it receives a valid merkle proof', async () => {
                let index = 27
                res = await mmr.getMerkleProof(index)
                await mmrLib.inclusionProof(res.root, res.size, index, '0x0000', res.peakBagging, res.siblings).should.eventually.equal(true)
            })
            it('should revert when it receives an invalid merkle proof', async () => {
                let index = 27
                res = await mmr.getMerkleProof(index)
                // Stored value is 0x0000 not 0x0001
                await mmrLib.inclusionProof(res.root, res.size, index, '0x0001', res.peakBagging, res.siblings).should.be.rejected
            })
        })
    })
});
