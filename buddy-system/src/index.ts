import {
  nextPow2,
  getf, setc, seta, clra,
  left, prnt, sstr,
  alloc_level, merge, resize_block,
} from "./lib";

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

  alloc(n: number): number {
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
    // Don't allow freeing the metadata table!
    if (n === 0) { throw new Error("Cannot free null."); }
    const { table } = this;
    const i = this.table_index(n);
    merge(i, table);
  }

  alloc_size(n: number) {
    const { minblock, max_level } = this;
    const i = this.table_index(n);
    return (1 << (max_level - (Math.log2(i)|0))) * minblock;
  }

  realloc(n: number, s: number) {
    const { table, minblock, max_level } = this;
    const i = this.table_index(n);
    const old_size = (1 << (max_level - (Math.log2(i)|0))) * minblock;
    if(resize_block(i, old_size, s, minblock, table)) {
      return n;
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