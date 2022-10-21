import 'mocha';
import { expect } from 'chai';
import {
  getf, togf, seta, clra, setc, clrc,
} from '../src/bits';

describe("Bitfield Tests", () => {

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
});