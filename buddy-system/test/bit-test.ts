import 'mocha';
import { expect } from 'chai';
import { 
  nextPow2,
  getf, togf, seta, clra, setc, clrc,
  sstr, prnt, left,
} from '../src/allocator';

describe("Helper Function Tests", () => {
  it("should find the next power of 2", () => {
    const r = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,25,27,32,33,44,57].map(nextPow2);
    expect(r).to.eql([1,2,4,4,8,8,8,8,16,16,16,16,16,16,16,16,32,32,32,64,64,64]);
  });

  it("should get 2-bit aligned fields", () => {
    const r = new Uint8Array(["01010101","00101000"].map(a => parseInt(a, 2)));
    const fields = [1,1,1,1,0,2,2,0];
    for (let i = 0; i < 8; i++) {
      expect(getf(r, i)).to.eql(fields[i]);
    }
  });
  
  it("should toggle specific 2-bit aligned fields", () => {
    const r = new Uint8Array(["01010101","00101000"].map(a => parseInt(a, 2)));
    const t = new Uint8Array(["10011001","11100100"].map(a => parseInt(a, 2)));
    for (let i = 0; i < 8; i+=2) {
      togf(r, i);
    }
    expect(r).to.eql(t);
  });

  it("should set even-numbered bits", () => {
    const r = new Uint8Array(["01010101","00101000"].map(a => parseInt(a, 2)));
    const t = new Uint8Array(["11111111","10101010"].map(a => parseInt(a, 2)));
    for (let i = 0; i < 8; i++) {
      seta(r, i);
    }
    expect(r).to.eql(t);
  });

  it("should clear even-numbered bits", () => {
    const r = new Uint8Array(["01010101","00101000"].map(a => parseInt(a, 2)));
    const t = new Uint8Array(["01010101","00000000"].map(a => parseInt(a, 2)));
    for (let i = 0; i < 8; i++) {
      clra(r, i);
    }
    expect(r).to.eql(t);
  });

  it("should set odd-numbered bits", () => {
    const r = new Uint8Array(["01010101","00101000"].map(a => parseInt(a, 2)));
    const t = new Uint8Array(["01010101","01111101"].map(a => parseInt(a, 2)));
    for (let i = 0; i < 8; i++) {
      setc(r, i);
    }
    expect(r).to.eql(t);
  });

  it("should clear odd-numbered bits", () => {
    const r = new Uint8Array(["01010101","00101000"].map(a => parseInt(a, 2)));
    const t = new Uint8Array(["00000000","00101000"].map(a => parseInt(a, 2)));
    for (let i = 0; i < 8; i++) {
      clrc(r, i);
    }
    expect(r).to.eql(t);
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