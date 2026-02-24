/**
 * Dyck Word Enumeration and Validation
 *
 * Dyck words use +1/-1 representation:
 *   +1 = up step / open paren
 *   -1 = down step / close paren
 *
 * A valid Dyck word of order n has 2n symbols, all prefix sums >= 0,
 * and final sum === 0.
 *
 * The nth Catalan number C(n) counts the number of Dyck words of order n:
 *   C(1)=1, C(2)=2, C(3)=5, C(4)=14
 */

const CATALAN = [1, 1, 2, 5, 14];

/**
 * Validate whether a word is a valid Dyck word.
 * @param {number[]} word - Array of +1 and -1 values
 * @returns {boolean} true if word is a valid Dyck word
 */
export function validate(word) {
  let sum = 0;
  for (let i = 0; i < word.length; i++) {
    sum += word[i];
    if (sum < 0) return false;
  }
  return sum === 0;
}

/**
 * Enumerate all Dyck words of order n.
 * Uses recursive generation: at each position, we can add +1 if opens < n,
 * or -1 if closes < opens (current opens count).
 *
 * @param {number} n - The order (1-4)
 * @returns {number[][]} Array of Dyck words, each a +1/-1 array of length 2n
 * @throws {RangeError} if n is not in range 1-4
 */
export function enumerate(n) {
  if (!Number.isInteger(n) || n < 1 || n > 4) {
    throw new RangeError(`enumerate(n) requires n in 1..4, got ${n}`);
  }

  const result = [];
  const target = 2 * n;

  function generate(word, opens, closes) {
    if (word.length === target) {
      result.push(word.slice());
      return;
    }
    if (opens < n) {
      word.push(1);
      generate(word, opens + 1, closes);
      word.pop();
    }
    if (closes < opens) {
      word.push(-1);
      generate(word, opens, closes + 1);
      word.pop();
    }
  }

  generate([], 0, 0);

  // Self-verification: count must match Catalan number
  console.assert(
    result.length === CATALAN[n],
    `enumerate(${n}): expected ${CATALAN[n]} words, got ${result.length}`
  );
  // Self-verification: every word must be valid
  console.assert(
    result.every(w => validate(w)),
    `enumerate(${n}): produced invalid Dyck word`
  );

  return result;
}
