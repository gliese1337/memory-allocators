import { getf } from "../src/bits";

export function s2u(a: string[]) {
  return new Uint8Array(a.map(a => parseInt(a, 2)));
}

export function tree2sexpr(u: Uint8Array, s: number, i = 1): string {
  if (i >= 4*u.length) { return "(freed)"; }
  switch(getf(u, i)) {
    case 0: return `(freed ${s})`;
    case 1: return `(split ${tree2sexpr(u, s/2, 2 * i)} ${tree2sexpr(u, s/2, 2*i+1)})`;
    case 2: return `(alloc ${s})`;
    default: return `(what? ${s})`;
  }
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
*/