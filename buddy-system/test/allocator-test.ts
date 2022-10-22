import 'mocha';
import { expect } from 'chai';
import { BuddyAllocator } from '../src';
import { s2u } from './utils';

describe("Basic Allocation Tests", () => {
  
  it("should initialize 256 bytes of memory with 2-byte blocks", () => {
    const ba = new BuddyAllocator(2, 256);
    expect(ba.alloc_size(0)).to.eql(64);
    const m = new Uint8Array(ba.memory, 0, 64);
    //console.log(tree2sexpr(m, 256));
    expect(m).to.eql(s2u([
      '00010100','10000000','00000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
    ]));
  });

  it("should initialize 256 bytes of memory with 4-byte blocks", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    const m = new Uint8Array(ba.memory, 0, 32);
    //console.log(tree2sexpr(m, 256));
    expect(m).to.eql(s2u([
      '00010100','01000000','10000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000','00000000','00000000','00000000','00000000',
    ]));
  });

  it("should allocate 4-byte minimal blocks in order", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(4)).to.eql(32);
    expect(ba.alloc(4)).to.eql(36);
    expect(ba.alloc(4)).to.eql(40);
  });

  it("should allocate 8-byte level-2 blocks in order", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(5)).to.eql(32);
    expect(ba.alloc(6)).to.eql(40);
    expect(ba.alloc(7)).to.eql(48);
  });
  
  it("should allocate 64-byte level-5 blocks in order", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(40)).to.eql(64);
    expect(ba.alloc(50)).to.eql(128);
    expect(ba.alloc(60)).to.eql(192);
  });

  it("should initialize 256 bytes of memory with 8-byte blocks", () => {
    const ba = new BuddyAllocator(8, 256);
    expect(ba.alloc_size(0)).to.eql(16);
    const m = new Uint8Array(ba.memory, 0, 16);
    //console.log(tree2sexpr(m, 256));
    expect(m).to.eql(s2u([
      '00010100','01000000','01000000','00000000',
      '10000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000',
    ]));
  });

  it("should initialize 256 bytes of memory with 16-byte blocks", () => {
    const ba = new BuddyAllocator(16, 256);
    expect(ba.alloc_size(0)).to.eql(16);
    const m = new Uint8Array(ba.memory, 0, 16);
    //console.log(tree2sexpr(m, 256));
    expect(m).to.eql(s2u([
      '00010100','01000000','01000000','00000000',
      '10000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000',
      '00000000','00000000','00000000','00000000',
    ]));
  });

  it("should allocate 16-byte minimal blocks in order", () => {
    const ba = new BuddyAllocator(16, 256);
    expect(ba.alloc_size(0)).to.eql(16);
    expect(ba.alloc(4)).to.eql(16);
    expect(ba.alloc(4)).to.eql(32);
    expect(ba.alloc(4)).to.eql(48);
  });
});

describe("Deallocation Tests", () => {
  
  it("should free a block and re-allocate the same block", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(5)).to.eql(32);
    expect(ba.alloc(6)).to.eql(40);
    expect(ba.alloc(7)).to.eql(48);
    ba.free(32);
    expect(ba.alloc(5)).to.eql(32);
    ba.free(48);
    expect(ba.alloc(5)).to.eql(48);
    ba.free(40);
    expect(ba.alloc(5)).to.eql(40);
  });

  it("should merge a block and then allocate it", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(5)).to.eql(32);
    expect(ba.alloc(6)).to.eql(40);
    expect(ba.alloc(7)).to.eql(48);
    ba.free(32);
    ba.free(40);
    expect(ba.alloc(10)).to.eql(32);
  });

  it("should free a large block and split it to allocate a smaller block", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(10)).to.eql(32);
    expect(ba.alloc(6)).to.eql(48);
    expect(ba.alloc(7)).to.eql(56);
    ba.free(32);
    expect(ba.alloc(6)).to.eql(32);
    expect(ba.alloc(7)).to.eql(40);
  });
});

describe("Reallocation Tests", () => {
  
  it("should re-allocate to a smaller size in place", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(5)).to.eql(32);
    const m = new Uint8Array(ba.memory);
    m[32] = 0xCC;
    expect(ba.realloc(32, 3)).to.eql(32);
    expect(m[32]).to.eql(0xCC);
  });

  it("should re-allocate to a larger size in place", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(5)).to.eql(32);
    const m = new Uint8Array(ba.memory);
    m[32] = 0xCC;
    expect(ba.realloc(32, 10)).to.eql(32);
    expect(m[32]).to.eql(0xCC);
    expect(ba.alloc(5)).to.eql(48);
  });

  it("should re-allocate to a larger size moving backwards", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(5)).to.eql(32);
    expect(ba.alloc(5)).to.eql(40);
    const m = new Uint8Array(ba.memory);
    m[40] = 0xCC;
    ba.free(32);
    expect(ba.realloc(40, 10)).to.eql(32);
    expect(m[32]).to.eql(0xCC);
    expect(ba.alloc(5)).to.eql(48);
  });

  it("should re-allocate to a larger size moving forwards", () => {
    const ba = new BuddyAllocator(4, 256);
    expect(ba.alloc_size(0)).to.eql(32);
    expect(ba.alloc(5)).to.eql(32);
    expect(ba.alloc(5)).to.eql(40);
    const m = new Uint8Array(ba.memory);
    m[40] = 0xCC;
    expect(ba.realloc(40, 10)).to.eql(48);
    expect(m[48]).to.eql(0xCC);
    expect(ba.alloc(10)).to.eql(64);
    expect(ba.alloc(5)).to.eql(40);
  });
});