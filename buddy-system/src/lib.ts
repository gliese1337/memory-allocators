import { getf, seta, togf, clra, clrc } from "./bits";

export function nextPow2(n: number) {
  return 1 << Math.ceil(Math.log2(n));
}

/*
                       1
           2                      3
     4          5           6           7
  8     9    10    11    12    13    14    15
16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31
*/

export function alloc_level(tree_level: number, block_size: number, table: Uint8Array) {
  // level 0 -- the root -- only has a single block, which is always allocated
  if (tree_level < 1) { throw new Error("Out of Memory"); }

  // Check for free blocks on this level whose
  // sisters are allocated and use them first.
  const llen = 1 << tree_level;
  const lend = llen << 1;
  for (let l = llen; l < lend; l+=2) {
    const r = l + 1;
    const lbits = getf(table, l);
    const rbits = getf(table, r);
    // Because a sister has already been allocated in each of
    // these cases, we do not need to update the parent metadata.
    if (lbits === 0 && rbits !== 0) {
      seta(table, l); // allocate the left sister
      return block_size * (l - llen);
    }
    if (lbits !== 0 && rbits === 0) {
      seta(table, r); // allocate the right sister
      return block_size * (r - llen);
    }
  }

  // If we couldn't find any sister blocks to return,
  // allocate a block one level up to split.
  const nblok_size = block_size << 1;
  const p: number = alloc_level(tree_level - 1, nblok_size, table);
  
  // Convert pointer back to a table index.
  // Find the start index of the parent level
  // and add the block index within that level.
  const block_index = p / nblok_size;
  const pi = (llen >> 1) + block_index;
  
  // Toggle bits to indicate this block was not actually allocated,
  // but its left child (which is aligned on p) was allocated.
  togf(table, pi);

  // Allocate the aligned left child block
  seta(table, pi << 1);

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