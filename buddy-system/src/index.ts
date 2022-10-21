import {
  nextPow2, alloc_level, merge, resize_block, table_index,
} from "./tree";

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
   this.alloc(reserve);
  }

  alloc(n: number): number {
    const { minblock } = this;
    const level = Math.ceil(Math.log2(Math.ceil(n / minblock)));
    const tree_level = this.max_level - level - 1;
    return alloc_level(tree_level, minblock * (1 << level), this.table); 
  }

  free(n: number) {
    // Don't allow freeing the metadata table!
    if (n === 0) { throw new Error("Cannot free null."); }
    const { minblock, max_level, table } = this;
    const i = table_index(n, minblock, max_level, table);
    merge(i, table);
  }

  alloc_size(n: number) {
    const { minblock, max_level, table } = this;
    const i = table_index(n, minblock, max_level, table);
    return (1 << (max_level - (Math.log2(i)|0))) * minblock;
  }

  realloc(n: number, s: number) {
    // Don't allow altering the metadata table!
    if (n === 0) { throw new Error("Cannot free null."); }
    const { minblock, max_level, table } = this;
    const i = table_index(n, minblock, max_level, table);
    const old_size = (1 << (max_level - (Math.log2(i)|0))) * minblock;
    if(resize_block(i, old_size, s, minblock, table)) {
      return n;
    }

    // Allocate a new larger block and move data there.
    // Free the current block first in case it can be incorporated
    // on the right. Block tree structure ensures that source
    // and destination ranges can never overlap.
    merge(i, table);
    const p = this.alloc(s);
    const end = n + old_size;
    for (let w = p; n < end; n++, w++) {
      table[w] = table[n];
    }
    return p;
  }
}