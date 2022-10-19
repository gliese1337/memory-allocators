function nextPow2(n: number) {
  return 1 << Math.ceil(Math.log2(n));
}

// Get a two-bit field at index i
function getf(m: Uint8Array, i: number) {
  return (m[i>>2] >> (6 - 2*(i&3))) & 3;
}

// Toggle bits of field at index i
function togf(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] ^ (0xC0 >> (6 - 2*(i&3))));
}

// Set the block allocation bit of field i
function seta(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] | (0x80 >> (6 - 2*(i&3))));
}

// Clear the block allocation bit of field i
function clra(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] & ~(0x80 >> (6 - 2*(i&3))));
}

// Set the child allocation bit of field i
function setc(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] | (0x40 >> (6 - 2*(i&3))));
}

// Clear the child allocation bit of field i
function clrc(m: Uint8Array, i: number) {
  const b = i >> 2;
  m[b] = (m[b] & ~(0x40 >> (6 - 2*(i&3))));
}

// Get the sibling index
function sstr(i: number) { return i+(i&1?1:-1); }

// Get the parent index
function prnt(i: number) { return (i - 1) >> 1; }

// Get the left child index
function left(i: number) { return (i << 1) + 1; }

function alloc_level(tree_level: number, block_size: number, table: Uint8Array) {
  // level 0 -- the root -- only has a single block, which is always allocated
  if (tree_level < 1) { throw new Error("Out of Memory"); }

  // Check for free blocks on this level whose
  // sisters are allocated and use them first.
  const level_length = 1 << tree_level;
  const level_start = level_length - 1;
  // Iterate by twos, over pairs of sisters.
  for (let k = 0; k < level_length; k += 2) {
    const l = k + level_start;
    const r = l + 1;
    const lbits = getf(table, l);
    const rbits = getf(table, r);
    
    // Because a sister has already been allocated in each of
    // these cases, we do not need to update the parent metadata.
    if (lbits === 0 && rbits !== 0) {
      seta(table, l); // allocate the left sister
      return block_size * k;
    }
    if (lbits !== 0 && rbits === 0) {
      seta(table, r); // allocate the right sister
      return block_size * (k + 1);
    }
  }

  // If we couldn't find any sister blocks to return,
  // allocate a block one level up to split.
  const nblok_size = block_size * 2;
  const p: number = alloc_level(tree_level - 1, nblok_size, table);
  
  // Convert pointer back to a table index.
  // Find the start index of the parent level
  // and add the block index within that level.
  const block_index = p / nblok_size;
  const pi = ((level_length >> 1) - 1) + block_index;
  
  // Toggle bits to indicate this block was not actually allocated,
  // but its left child (which is aligned on p) was allocated.
  togf(table, pi);

  // Allocate the aligned left child block
  seta(table, left(pi));

  return p;
}

function merge(i: number, table: Uint8Array) {
  do {
    i = prnt(i);
    if (i === 0) return;
    clrc(table, i); // turn off 'allocated child' bit
    // continue merging while sister is also free
  } while (getf(table, sstr(i)) === 0);
}

export class BuddyAllocator {
  public readonly memory: ArrayBuffer;
  private table: Uint8Array;
  private minblock: number;
  private max_level: number;

  /*
  The table is a prefix of total memory which stores allocation metadata.
  It is arranged as an implicit full binary tree, where each node's children
  are at index 2k+1 and 2k+2, and a node's parent is at floor((k-1)/2).
  Each level of the tree corresponds to a set of blocks of equal size,
  where sister nodes are "buddies".
  Metadata is 2 bits per block (so 4 blocks per byte), as follows:
   - 00: Completely unallocated
   - 10: Allocated as a single block
   - 01: At least one child block is separately allocated
         (I.e., this block has been split.)
  */

  constructor(minblock: number, size: number) {
    minblock = nextPow2(minblock);
    size = nextPow2(size);
    const leaves = size / minblock;
    const reserve = Math.max(leaves / 4, minblock);
    const memory = new ArrayBuffer(size);
    const table = new Uint8Array(memory); //, 0, reserve);
    
    this.minblock = minblock;
    this.max_level = Math.log2(leaves); // ceiling, except pre-processing ensures this is always an integer.
    this.memory = memory;
    this.table = table;

    // Initialize the allocation table by allocating itself.
    // Reserve the left-most block that's large enough to hold the table.
    const reserve_level_depth = Math.ceil(Math.log2(reserve/minblock)) - 1;
    let p = 0;
    for (let i = 0; i < reserve_level_depth; i++) {
      setc(table, p); // Indicate that the block is split
      p = left(p); 
    }
    // Allocate the table itself
    seta(table, p);
  }

  alloc(n: number) {
    const { minblock } = this;
    const level = Math.ceil(Math.log2(Math.ceil(n / minblock)));
    const tree_level = this.max_level - level - 1;
    return alloc_level(tree_level, minblock * (1 << level), this.table); 
  }

  private table_index(n: number) {
    const { table, minblock } = this;
    if (n % minblock) {
      throw new Error("Unaligned pointer");
    }
    // Start at the smallest aligned block, and
    // move up levels until we find the index
    // at which a block is actually allocated.
    const block_index = n / minblock;
    let i = 1 << this.max_level + block_index - 1;
    for (;i > 0; i = prnt(i)) {
      if (getf(table, i) === 2) { return i; }
    }
    throw new Error("Unknown pointer");
  }

  free(n: number) {
    const { table } = this;
    const i = this.table_index(n);
    clra(table, i);
    if (getf(table, sstr(i)) === 0) {
      merge(i, table);
    }
  }

  alloc_size(n: number) {
    const { minblock, max_level } = this;
    const i = this.table_index(n);
    return (1 << (max_level - (Math.log2(i)|0))) * minblock;
  }

  realloc(n: number, s: number) {
    const { table, minblock, max_level } = this;
    const i = this.table_index(n);
    let old_size = (1 << (max_level - (Math.log2(i)|0))) * minblock;
    if (s < old_size/2 && s > minblock) {
      // toggle this block from self-allocated to child-allocated
      togf(table, i);
      // allocate the aligned left child
      seta(table, left(i));
      return n;
    }
    
    if (s <= old_size) {
      // either below the minimum block size,
      // or not enough smaller to move down a block size
      return n;
    }

    // Check if we have a chain of free right
    // sisters long enough to expand this block.
    if(i&1) { // if i is not odd, it has no right sister
      let k = i;
      let new_size = old_size << 1;
      do { 
        // Break if the right sister is not free
        if (getf(table, k + 1) > 0) { break; }
        const p = prnt(k);
        // If merging this sister makes a big enough block...
        if (s <= new_size) {
          clra(table, k); // free the current block
          seta(table, p); // allocate the aligned parent block
          return n;
        }
        new_size = new_size << 1;
        k = p;
      } while(k&1);
    }

    // Allocate a new larger block and move data there.
    this.free(n);
    const p = this.alloc(s);
    const end = n + old_size;
    for (let w = p; n < end; n++, w++) {
      table[w] = table[n];
    }
    return p;
  }
}