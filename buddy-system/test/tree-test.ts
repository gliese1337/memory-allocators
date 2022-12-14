import 'mocha';
import { expect } from 'chai';
import { 
  nextPow2,
  alloc_level, merge, resize_block, table_index,
} from '../src/tree';
import { s2u } from './utils';

describe("Tree Manipulation Tests", () => {
  // Initial table state:
  //"00 01"
  //"01 00"
  //"01 00" "00 00"
  //"01 00" "00 00" "00 00" "00 00"
  //"10 00" "00 00" "00 00" "00 00" "00 00" "00 00" "00 00" "00 00"
  
  it("should find the next power of 2", () => {
    const r = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,25,27,32,33,44,57].map(nextPow2);
    expect(r).to.eql([1,2,4,4,8,8,8,8,16,16,16,16,16,16,16,16,32,32,32,64,64,64]);
  });

  it("should allocate the second minimal block", () => {
    const tab = s2u(["00010100","01000000","01000000","00000000","10000000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01000000","00000000","10100000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(4);
    expect(table_index(4, 4, 4, tab)).to.eql(17);
  });
  
  it("should split a second-level block and allocate the third minimal block", () => {
    const tab = s2u(["00010100","01000000","01000000","00000000","10100000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01010000","00000000","10101000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(8);
    expect(table_index(8, 4, 4, tab)).to.eql(18);
  });

  it("should fail to resize the second minimal block into a level-2 block", () => {
    const tab = s2u(["00010100","01000000","01000000","00000000","10100000","00000000","00000000","00000000"]);
    const t = resize_block(17, 4, 6, 4, tab);
    expect(t).to.be.false;
  });

  it("should resize the third minimal block into a level-2 block", () => {
    const tab = s2u(["00010100","01000000","01010000","00000000","10101000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01100000","00000000","10100000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const t = resize_block(18, 4, 6, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(t).to.be.true;
    expect(tab).to.eql(res);
    expect(table_index(8, 4, 4, tab)).to.eql(9);
  });

  it("should fail to resize the third minimal block into a level-3 block", () => {
    const tab = s2u(["00010100","01000000","01010000","00000000","10101000","00000000","00000000","00000000"]);
    const t = resize_block(18, 4, 12, 4, tab);
    expect(t).to.be.false;
  });

  it("should resize the first minimal block into a level-3 block", () => {
    const tab = s2u(["00010100","01000000","01000000","00000000","10000000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","10000000","01000000","00000000","00000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const t = resize_block(16, 4, 12, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(t).to.be.true;
    expect(tab).to.eql(res);
    expect(table_index(0, 4, 4, tab)).to.eql(4);
  });
  
  it("should allocate the fourth minimal block", () => {
    const tab = s2u(["00010100","01000000","01010000","00000000","10101000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01010000","00000000","10101010","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(12);
    expect(table_index(12, 4, 4, tab)).to.eql(19);
  });

  it("should re-allocate the third minimal block rather than splitting a new level-2 block", () => {
    const tab = s2u(["00010100","01000000","01010000","00000000","10100010","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01010000","00000000","10101010","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(8);
    expect(table_index(8, 4, 4, tab)).to.eql(18);
  });

  it("should free the second level-2 block when both of its children are free, starting from the left child", () => {
    const tab = s2u(["00010100","01000000","01010000","00000000","10101000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01000000","00000000","10100000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    merge(18, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
  });

  it("should free the second level-2 block when both of its children are free, starting from the right child", () => {
    const tab = s2u(["00010100","01000000","01010000","00000000","10100010","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01000000","00000000","10100000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    merge(19, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
  });
  
  it("should allocate the second level-2 block", () => {
    const tab = s2u(["00010100","01000000","01000000","00000000","10000000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01100000","00000000","10000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(3, 8, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(8);
    expect(table_index(8, 4, 4, tab)).to.eql(9);
  });

  it("should resize the second level-2 block into a pair of level-1 blocks", () => {
    const tab = s2u(["00010100","01000000","01100000","00000000","10000000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01010000","00000000","10001000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const t = resize_block(9, 8, 3, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(t).to.be.true;
    expect(tab).to.eql(res);
    expect(table_index(8, 4, 4, tab)).to.eql(18);
  });
  
  it("should allocate the second level-3 block", () => {
    const tab = s2u(["00010100","01000000","01000000","00000000","10000000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01100000","01000000","00000000","10000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(2, 16, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(16);
    expect(table_index(16, 4, 4, tab)).to.equal(5);
  });

  it("should resize the second level-3 block into a minimal block", () => {
    const tab = s2u(["00010100","01100000","01000000","00000000","10000000","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01010000","01000100","00000000","10000000","10000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const t = resize_block(5, 16, 3, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(t).to.be.true;
    expect(tab).to.eql(res);
    expect(table_index(16, 4, 4, tab)).to.eql(20);
  });

  it("should split the second level-3 block to allocate the fifth minimal block", () => {
    const tab = s2u(["00010100","01000000","01010000","00000000","10101010","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01010000","01010100","00000000","10101010","10000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(16);
    expect(table_index(16, 4, 4, tab)).to.eql(20);
  });

  it("should free the second level-3 block when all children all free", () => {
    const tab = s2u(["00010100","01010000","01010100","00000000","10101010","00000000","00000000","00000000"]);
    const res = s2u(["00010100","01000000","01010000","00000000","10101010","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    merge(20, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
  });

  it("should allocate the second level-4 block", () => {
    const tab = s2u(["00010100","01000000","01000000","00000000","10000000","00000000","00000000","00000000"]);
    const res = s2u(["00010110","01000000","01000000","00000000","10000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(1, 32, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(32);
    expect(table_index(32, 4, 4, tab)).to.eql(3);
  });
});