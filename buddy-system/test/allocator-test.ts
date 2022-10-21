import 'mocha';
import { expect } from 'chai';
import { BuddyAllocator } from '../src';
import { s2u, tree2sexpr } from './utils';

describe("Buddy Allocator Tests", () => {
  
  it("should initialize 256 bytes of memory with 2-byte blocks", () => {
    const ba = new BuddyAllocator(2, 256);
    expect(ba.alloc_size(0)).to.eql(64);
    const m = new Uint8Array(ba.memory, 0, 64);
    console.log(tree2sexpr(m, 256));
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
    console.log(tree2sexpr(m, 256));
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

  it("should initialize 256 bytes of memory with 8-byte blocks", () => {
    const ba = new BuddyAllocator(8, 256);
    expect(ba.alloc_size(0)).to.eql(16);
    const m = new Uint8Array(ba.memory, 0, 16);
    console.log(tree2sexpr(m, 256));
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
    console.log(tree2sexpr(m, 256));
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