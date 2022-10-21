import { getf, seta, togf, clra, clrc, setc } from "./bits";

/*
  Allocation metadata is stored as an array-backed implicit full
  binary tree in a prefix of the total memory, where each node
  is 2 bits long. The fist two bits are reserved so that the root
  of the tree occurs at index 1, which simplifies parent-child
  relations and ensures that sister nodes are always in the same
  byte, aligned on nybbles. Child nodes of a node k are located
  at indices 2k and 2k+1, and a node's parent is at floor(k/2).
  Each level of the tree corresponds to a set of blocks of equal
  size, where sister nodes are "buddies". Each two bit node
  stores the state of one block, encoded as follows:
    - 00: Unallocated
    - 10: Allocated as a single block
    - 01: At least one child block is separately allocated
          (I.e., this block has been split.)
    - 11: Invalid state
*/

export function nextPow2(n: number) {
  return 1 << Math.ceil(Math.log2(n));
}

export function alloc_level(tree_level: number, block_size: number, table: Uint8Array) {
  let pi: number;
  let level = tree_level;
  let llen = 1 << (level + 1);
  scan: for (;;level--) {
    // level 0 -- the root -- only has a single block, which is always split
    if (level < 1) { throw new Error("Out of Memory"); }

    // Check for free blocks on this
    // level whose sisters are non-free.
    const lend = llen;
    llen = llen >> 1;
    for (let l = llen; l < lend; l+=2) {
      // Read all 4 bits of a buddy pair at once.
      const b = (table[l>>2] >> (4 - ((l&2) << 1))) & 0xf;
      // If b has exactly one on bit, then one block
      // is allocated or split, and the other is free.
      if(b && !(b & (b - 1))) {
        // If b = 1 or 2, the left block is free.
        // If b = 4 or 8, the right block is free.
        pi = +(b >= 4) + l;
        break scan;
      }
    }

    // If we couldn't find any sister blocks
    // to return, split a block one level up.
    block_size = block_size << 1;
  }

  const p = block_size * (pi - llen);
  for (;level < tree_level; level++) {
    setc(table, pi); // Split this block
    pi = pi << 1; // Look at the aligned left child block.
  }
  
  // Actually allocate the leftmost block
  // at the level that was originally requested.
  seta(table, pi);

  return p;
}

export function merge(i: number, table: Uint8Array) {
  clra(table, i); // free this block
  // while the sister is free,
  // free the parent, then check *its* sister.
  while (getf(table, i^1 /* sister node */) === 0) {
    i = i >> 1; // parent node
    if (i === 0) return;
    clrc(table, i); // turn off 'allocated child' bit
  }
}

export function resize_block(i: number, old_size: number, s: number, minblock: number, table: Uint8Array) {
  let new_size = old_size >> 1;
  if (s <= new_size && new_size >= minblock) {
    do {
      // toggle this block from self-allocated to child-allocated
      togf(table, i);
      // allocate the aligned left child
      i = i << 1;
      seta(table, i);
      new_size = new_size >> 1;
    } while(s <= new_size && new_size >= minblock);
    return true;
  }
  
  if (s <= old_size) {
    // not enough smaller to move down a block size
    return true;
  }

  // Check if we have a chain of free right
  // sisters long enough to expand this block.
  if((i&1) === 0) { // if i is not even, it has no right sister
    let k = i;
    new_size = old_size << 1;
    do { 
      // Break if the right sister is not free
      if (getf(table, k + 1) > 0) { break; }
      const p = k >> 1; // get k's parent
      // If merging this sister makes a big enough block...
      if (s <= new_size) {
        togf(table, p); // allocate the aligned parent block
        do { // free all left children
          clra(table, k);
          k = k << 1;
        } while(k <= i);
        return true;
      }
      new_size = new_size << 1;
      k = p;
    } while((k&1) === 0);
  }

  return false;
}

export function table_index(n: number, minblock: number, max_level: number, table: Uint8Array) {
  if (n % minblock) {
    throw new Error("Unaligned pointer");
  }
  // Start at the smallest aligned block, and
  // move up levels until we find the index
  // at which a block is actually allocated.
  const block_index = n / minblock;
  let i = (1 << max_level) + block_index;
  for (;i > 0; i = i >> 1) {
    if (getf(table, i) === 2) { return i; }
  }
  throw new Error("Unknown pointer");
}