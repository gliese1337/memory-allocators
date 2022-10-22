// Get a two-bit field at index i
export function getf(m: Uint8Array, i: number) {
  return (m[i>>2] >> ((3^i&3) << 1)) & 3;
}

// Toggle bits of field at index i
export function togf(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] ^ (0xC0 >> ((i&3) << 1)));
}

// Set the block allocation bit of field i
export function seta(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] | (0x80 >> ((i&3) << 1)));
}

// Clear the block allocation bit of field i
export function clra(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] & ~(0x80 >> ((i&3) << 1)));
}

// Set the child allocation bit of field i
export function setc(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] | (0x40 >> ((i&3) << 1)));
}

// Clear the child allocation bit of field i
export function clrc(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] & ~(0x40 >> ((i&3) << 1)));
}
