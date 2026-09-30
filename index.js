// suikoden-battle-search: brute-force battle searches on suikoden-rng-lib's battle simulator.
export { bruteForce } from './src/BruteForce.js';
export { default as ResultsDB } from './src/ResultsDB.js';

/** @typedef {import('./src/BruteForce.js').BruteForceStats} BruteForceStats */
/** @typedef {import('./src/BruteForce.js').PathCost} PathCost */
/**
 * @template S
 * @typedef {import('./src/BruteForce.js').BruteForceResult<S>} BruteForceResult
 */
/**
 * @template S
 * @typedef {import('./src/BruteForce.js').BruteForceOptions<S>} BruteForceOptions
 */
