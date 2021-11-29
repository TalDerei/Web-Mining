const Ethash = require('../index.js')

/** 
 * Creates a new instance of Ethash without existing cache
 */
var ethash = new Ethash()

/** 
 * Creates a cache of N items, and buffer of 32 Bytes each
 */
ethash.mkcache(1000, Buffer.alloc(32).fill(0))

/**
 * Run ethash on a header hash / nonce pair
 */
var result = ethash.run(Buffer.from('Test'), Buffer.from([0]), 1000)

/**
 * Print hash result
 */
console.log(result.hash.toString('hex'))