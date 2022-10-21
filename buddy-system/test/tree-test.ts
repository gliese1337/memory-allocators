import 'mocha';
import { expect } from 'chai';
import { 
  nextPow2, left, prnt, sstr,
  alloc_level, merge, resize_block, table_index,
} from '../src/lib';

function s2u(a: string[]) {
  return new Uint8Array(a.map(a => parseInt(a, 2)));
}

/*
const zeros = "00000000";
function byteToString(b: number) {
  const s = b.toString(2);
  return zeros.slice(0, 8 - s.length) + s;
}

function u2s(a: Uint8Array) {
  return [...a].map(byteToString);
}

function tree2sexpr(u: Uint8Array, s: number, i = 0): string {
  if (i >= 4*u.length) { return "(freed)"; }
  switch(getf(u, i)) {
    case 0: return `(freed ${s})`;
    case 1: return `(split ${tree2sexpr(u, s/2, 2 * i + 1)} ${tree2sexpr(u, s/2, 2*(i+1))})`;
    case 2: return `(alloc ${s})`;
    default: return `(what? ${s})`;
  }
}
*/

describe("Tree Navigation Tests", () => {

  it("should find the next power of 2", () => {
    const r = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,25,27,32,33,44,57].map(nextPow2);
    expect(r).to.eql([1,2,4,4,8,8,8,8,16,16,16,16,16,16,16,16,32,32,32,64,64,64]);
  });

  it("should calculate sister node indices", () => {
    const is = [
      1, 2,
      3, 4, 5, 6,
      7, 8, 9, 10, 11, 12, 13, 14,
    ];
    expect(is.map(sstr)).to.eql([
      2, 1,
      4, 3, 6, 5,
      8, 7, 10, 9, 12, 11, 14, 13,
    ]);
  });

  it("should calculate parent node indices", () => {
    const is = [
      1, 2,
      3, 4, 5, 6,
      7, 8, 9, 10, 11, 12, 13, 14,
    ];
    expect(is.map(prnt)).to.eql([
      0, 0,
      1, 1, 2, 2,
      3, 3, 4, 4, 5, 5, 6, 6,
    ]);
  });

  it("should calculate left child node indices", () => {
    const is = [
      1, 2,
      3, 4, 5, 6,
      7, 8, 9, 10, 11, 12, 13, 14,
    ];
    expect(is.map(left)).to.eql([
      3, 5,
      7, 9, 11, 13,
      15, 17, 19, 21, 23, 25, 27, 29,
    ]);
  });
});

describe("Tree Manipulation Tests", () => {
  // Initial table state:
  //"01"
  //"01 00"
  //"01 00" "00 00"
  //"01 00" "00 00" "00 00" "00 00"
  //"10 00" "00 00" "00 00" "00 00" "00 00" "00 00" "00 00" "00 00"
  
  it("should allocate the second minimal block", () => {
    const tab = s2u(["01010001","00000001","00000000","00000010","00000000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","00000000","00000010","10000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(4);
    expect(table_index(4, 4, 4, tab)).to.eql(16);
  });
  
  it("should split a second-level block and allocate the third minimal block", () => {
    const tab = s2u(["01010001","00000001","00000000","00000010","10000000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","01000000","00000010","10100000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(8);
    expect(table_index(8, 4, 4, tab)).to.eql(17);
  });

  it("should fail to resize the second minimal block into a level-2 block", () => {
    const tab = s2u(["01010001","00000001","00000000","00000010","10000000","00000000","00000000","00000000"]);
    const t = resize_block(16, 4, 6, 4, tab);
    expect(t).to.be.false;
  });

  it("should resize the third minimal block into a level-2 block", () => {
    const tab = s2u(["01010001","00000001","01000000","00000010","10100000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","10000000","00000010","10000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const t = resize_block(17, 4, 6, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(t).to.be.true;
    expect(tab).to.eql(res);
    expect(table_index(8, 4, 4, tab)).to.eql(8);
  });

  it("should fail to resize the third minimal block into a level-3 block", () => {
    const tab = s2u(["01010001","00000001","01000000","00000010","10100000","00000000","00000000","00000000"]);
    const t = resize_block(17, 4, 12, 4, tab);
    expect(t).to.be.false;
  });

  it("should resize the first minimal block into a level-3 block", () => {
    const tab = s2u(["01010001","00000001","00000000","00000010","00000000","00000000","00000000","00000000"]);
    const res = s2u(["01010010","00000001","00000000","00000000","00000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const t = resize_block(15, 4, 12, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(t).to.be.true;
    expect(tab).to.eql(res);
    expect(table_index(0, 4, 4, tab)).to.eql(3);
  });
  
  it("should allocate the fourth minimal block", () => {
    const tab = s2u(["01010001","00000001","01000000","00000010","10100000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","01000000","00000010","10101000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(12);
    expect(table_index(12, 4, 4, tab)).to.eql(18);
  });

  it("should re-allocate the third minimal block rather than splitting a new level-2 block", () => {
    const tab = s2u(["01010001","00000001","01000000","00000010","10001000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","01000000","00000010","10101000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(8);
    expect(table_index(8, 4, 4, tab)).to.eql(17);
  });

  it("should free the second level-2 block when both of its children are free, starting from the left child", () => {
    const tab = s2u(["01010001","00000001","01000000","00000010","10100000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","00000000","00000010","10000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    merge(17, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
  });

  it("should free the second level-2 block when both of its children are free, starting from the right child", () => {
    const tab = s2u(["01010001","00000001","01000000","00000010","10001000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","00000000","00000010","10000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    merge(18, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
  });
  
  it("should allocate the second level-2 block", () => {
    const tab = s2u(["01010001","00000001","00000000","00000010","00000000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","10000000","00000010","00000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(3, 8, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(8);
    expect(table_index(8, 4, 4, tab)).to.eql(8);
  });

  it("should resize the second level-2 block into a pair of level-1 blocks", () => {
    const tab = s2u(["01010001","00000001","10000000","00000010","00000000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","01000000","00000010","00100000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const t = resize_block(8, 8, 3, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(t).to.be.true;
    expect(tab).to.eql(res);
    expect(table_index(8, 4, 4, tab)).to.eql(17);
  });
  
  it("should allocate the second level-3 block", () => {
    const tab = s2u(["01010001","00000001","00000000","00000010","00000000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","10000001","00000000","00000010","00000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(2, 16, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(16);
    expect(table_index(16, 4, 4, tab)).to.equal(4);
  });

  it("should resize the second level-3 block into a minimal block", () => {
    const tab = s2u(["01010001","10000001","00000000","00000010","00000000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","01000001","00010000","00000010","00000010","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const t = resize_block(4, 16, 3, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(t).to.be.true;
    expect(tab).to.eql(res);
    expect(table_index(16, 4, 4, tab)).to.eql(19);
  });

  it("should split the second level-3 block to allocate the fifth minimal block", () => {
    const tab = s2u(["01010001","00000001","01000000","00000010","10101000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","01000001","01010000","00000010","10101010","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(4, 4, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(16);
    expect(table_index(16, 4, 4, tab)).to.eql(19);
  });

  it("should free the second level-3 block when all children all free", () => {
    const tab = s2u(["01010001","01000001","01010000","00000010","10101000","00000000","00000000","00000000"]);
    const res = s2u(["01010001","00000001","01000000","00000010","10101000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    merge(19, tab)
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
  });

  it("should allocate the second level-4 block", () => {
    const tab = s2u(["01010001","00000001","00000000","00000010","00000000","00000000","00000000","00000000"]);
    const res = s2u(["01011001","00000001","00000000","00000010","00000000","00000000","00000000","00000000"]);
    //console.log(tree2sexpr(tab, 64));
    const p = alloc_level(1, 32, tab);
    //console.log(tree2sexpr(tab, 64));
    expect(tab).to.eql(res);
    expect(p).to.eql(32);
    expect(table_index(32, 4, 4, tab)).to.eql(2);
  });
});