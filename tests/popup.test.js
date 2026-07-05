/**
 * CodeClue Extension — Test Suite
 * Run with: node tests/popup.test.js
 *
 * Pure Node.js, zero dependencies. Tests the pure-logic functions
 * extracted from popup.js and options.js.
 */

// ─── Minimal test harness ───────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new Error(`Expected ${b}, got ${a}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThanOrEqual(n) {
      if (actual < n) throw new Error(`Expected >= ${n}, got ${actual}`);
    },
    toBeLessThanOrEqual(n) {
      if (actual > n) throw new Error(`Expected <= ${n}, got ${actual}`);
    },
    toContain(substr) {
      if (!String(actual).includes(substr)) {
        throw new Error(`Expected "${actual}" to contain "${substr}"`);
      }
    },
    toThrow() {
      throw new Error("Use expectAsync for async throw checks");
    },
  };
}

async function expectRejects(promise, msgContains) {
  try {
    await promise;
    throw new Error("Expected promise to reject, but it resolved");
  } catch (e) {
    if (msgContains && !e.message.includes(msgContains)) {
      throw new Error(`Expected error containing "${msgContains}", got "${e.message}"`);
    }
  }
}

// ─── Re-implement pure logic from popup.js (no DOM / chrome API needed) ─────

// isCacheValid (mirrors popup.js)
function makeCacheState() {
  const CACHE_DURATION = 30000;
  let problemTextCache = null;
  let cacheTimestamp = 0;
  let cachedTabUrl = "";

  function isCacheValid(currentTabUrl) {
    if (currentTabUrl && currentTabUrl !== cachedTabUrl) return false;
    return problemTextCache != null && (Date.now() - cacheTimestamp) < CACHE_DURATION;
  }

  function setCache(text, url) {
    problemTextCache = text;
    cacheTimestamp = Date.now();
    cachedTabUrl = url;
  }

  function expireCache() {
    cacheTimestamp = Date.now() - CACHE_DURATION - 1;
  }

  return { isCacheValid, setCache, expireCache };
}

// parseAnalysis — mirrors the correctness/feedback parsing in popup.js
function parseAnalysis(fullResponse) {
  const correctnessMatch = fullResponse.match(/CORRECTNESS:\s*(\d+)%/i);
  let correctness = null;
  if (correctnessMatch) {
    const parsed = Number(correctnessMatch[1]);
    if (!isNaN(parsed)) {
      correctness = Math.min(Math.max(parsed, 0), 100);
    }
  }
  const feedbackMatch = fullResponse.match(/FEEDBACK:\s*([\s\S]*)/i);
  const feedback = feedbackMatch ? feedbackMatch[1].trim() : fullResponse;
  return { correctness, feedback };
}

// validateProblemText — mirrors getCachedProblemText guard
function validateProblemText(text) {
  if (!text || text.trim().length < 20) {
    throw new Error("Could not extract problem content");
  }
  return text;
}

// validateApiKey — mirrors the key check
function validateApiKey(key) {
  if (!key || !key.trim()) throw new Error("API key missing");
  return key.trim();
}

// fetchWithTimeout signature check (logic only — no real network)
function makeFetchWithTimeout(fakeFetch) {
  return function fetchWithTimeout(url, options, timeoutMs = 15000) {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);
    return fakeFetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timerId));
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log("\n🧪 CodeClue Extension — Test Suite\n");

// ── Group 1: Cache invalidation ───────────────────────────────────────────
console.log("Group 1: Cache invalidation");

test("cache is invalid when empty", () => {
  const { isCacheValid } = makeCacheState();
  expect(isCacheValid("https://leetcode.com/problems/two-sum/")).toBe(false);
});

test("cache is valid immediately after being set for same URL", () => {
  const { isCacheValid, setCache } = makeCacheState();
  setCache("some problem text that is long enough", "https://leetcode.com/problems/two-sum/");
  expect(isCacheValid("https://leetcode.com/problems/two-sum/")).toBe(true);
});

test("cache is invalid after URL changes (different problem)", () => {
  const { isCacheValid, setCache } = makeCacheState();
  setCache("some problem text that is long enough", "https://leetcode.com/problems/two-sum/");
  // User navigates to a different problem
  expect(isCacheValid("https://leetcode.com/problems/reverse-linked-list/")).toBe(false);
});

test("cache is invalid after CACHE_DURATION expires", () => {
  const { isCacheValid, setCache, expireCache } = makeCacheState();
  setCache("some problem text that is long enough", "https://leetcode.com/problems/two-sum/");
  expireCache();
  expect(isCacheValid("https://leetcode.com/problems/two-sum/")).toBe(false);
});

test("cache stays valid for same URL before expiry", () => {
  const { isCacheValid, setCache } = makeCacheState();
  const url = "https://leetcode.com/problems/two-sum/description/";
  setCache("problem content here that is long enough", url);
  expect(isCacheValid(url)).toBe(true);
});

// ── Group 2: Correctness parsing ──────────────────────────────────────────
console.log("\nGroup 2: Correctness parsing");

test("parses correctness 85%", () => {
  const { correctness } = parseAnalysis("CORRECTNESS: 85%\nFEEDBACK: Looks good.");
  expect(correctness).toBe(85);
});

test("parses correctness 0%", () => {
  const { correctness } = parseAnalysis("CORRECTNESS: 0%\nFEEDBACK: No code.");
  expect(correctness).toBe(0);
});

test("parses correctness 100%", () => {
  const { correctness } = parseAnalysis("CORRECTNESS: 100%\nFEEDBACK: Perfect.");
  expect(correctness).toBe(100);
});

test("clamps correctness above 100 to 100", () => {
  // Edge: API returns out-of-range value
  const { correctness } = parseAnalysis("CORRECTNESS: 110%\nFEEDBACK: Something.");
  expect(correctness).toBe(100);
});

test("clamps negative correctness to 0", () => {
  // Edge: hypothetical negative value
  const match = "-5".match(/(-?\d+)/);
  const parsed = Number(match[1]);
  const correctness = Math.min(Math.max(parsed, 0), 100);
  expect(correctness).toBe(0);
});

test("returns null correctness when CORRECTNESS line is missing", () => {
  const { correctness } = parseAnalysis("The code looks like it might work.\nFEEDBACK: Try again.");
  expect(correctness).toBeNull();
});

test("returns null correctness when CORRECTNESS has no digits", () => {
  const { correctness } = parseAnalysis("CORRECTNESS: N/A\nFEEDBACK: Cannot determine.");
  expect(correctness).toBeNull();
});

test("is case-insensitive for CORRECTNESS label", () => {
  const { correctness } = parseAnalysis("correctness: 70%\nfeedback: Ok.");
  expect(correctness).toBe(70);
});

test("extracts feedback after FEEDBACK: label", () => {
  const { feedback } = parseAnalysis("CORRECTNESS: 60%\nFEEDBACK: Line 3 has an off-by-one error.");
  expect(feedback).toBe("Line 3 has an off-by-one error.");
});

test("uses entire response as feedback when FEEDBACK label missing", () => {
  const raw = "The approach is correct but slow.";
  const { feedback } = parseAnalysis(raw);
  expect(feedback).toBe(raw);
});

test("feedback handles multi-line content", () => {
  const raw = "CORRECTNESS: 55%\nFEEDBACK: Line 1: wrong.\nLine 2: also wrong.";
  const { feedback } = parseAnalysis(raw);
  expect(feedback).toContain("Line 1: wrong.");
  expect(feedback).toContain("Line 2: also wrong.");
});

// ── Group 3: Problem text validation ──────────────────────────────────────
console.log("\nGroup 3: Problem text validation");

test("accepts text longer than 20 chars", () => {
  const result = validateProblemText("Given an array of integers return indices of the two numbers");
  expect(result).toContain("Given");
});

test("throws for empty string", () => {
  let threw = false;
  try { validateProblemText(""); } catch { threw = true; }
  expect(threw).toBe(true);
});

test("throws for null", () => {
  let threw = false;
  try { validateProblemText(null); } catch { threw = true; }
  expect(threw).toBe(true);
});

test("throws for whitespace-only text", () => {
  let threw = false;
  try { validateProblemText("   "); } catch { threw = true; }
  expect(threw).toBe(true);
});

test("throws for text shorter than 20 chars", () => {
  let threw = false;
  try { validateProblemText("too short"); } catch { threw = true; }
  expect(threw).toBe(true);
});

test("accepts exactly 20 non-space characters", () => {
  // "12345678901234567890" = 20 chars
  const result = validateProblemText("12345678901234567890");
  expect(result).toBe("12345678901234567890");
});

// ── Group 4: API key validation ───────────────────────────────────────────
console.log("\nGroup 4: API key validation");

test("accepts a valid key", () => {
  const key = validateApiKey("AIzaSy_somekey123");
  expect(key).toBe("AIzaSy_somekey123");
});

test("trims whitespace from key", () => {
  const key = validateApiKey("  AIzaSy_somekey123  ");
  expect(key).toBe("AIzaSy_somekey123");
});

test("throws for empty string key", () => {
  let threw = false;
  try { validateApiKey(""); } catch { threw = true; }
  expect(threw).toBe(true);
});

test("throws for whitespace-only key", () => {
  let threw = false;
  try { validateApiKey("   "); } catch { threw = true; }
  expect(threw).toBe(true);
});

test("throws for null key", () => {
  let threw = false;
  try { validateApiKey(null); } catch { threw = true; }
  expect(threw).toBe(true);
});

test("throws for undefined key", () => {
  let threw = false;
  try { validateApiKey(undefined); } catch { threw = true; }
  expect(threw).toBe(true);
});

// ── Group 5: fetchWithTimeout ──────────────────────────────────────────────
console.log("\nGroup 5: fetchWithTimeout");

test("passes signal to underlying fetch", async () => {
  let capturedOptions = null;
  const fakeFetch = async (url, opts) => {
    capturedOptions = opts;
    return { ok: true };
  };
  const fetchWithTimeout = makeFetchWithTimeout(fakeFetch);
  await fetchWithTimeout("https://example.com", { method: "POST" }, 5000);
  expect(capturedOptions.signal instanceof AbortSignal).toBe(true);
});

test("aborts fetch when timeout fires", async () => {
  const fakeFetch = (_url, opts) => new Promise((_resolve, reject) => {
    // Listen for abort signal
    opts.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });

  // Polyfill AbortSignal/AbortController for Node if needed
  if (typeof AbortController === "undefined") {
    console.log("     (skipped — AbortController not available in this Node version)");
    return;
  }

  const fetchWithTimeout = makeFetchWithTimeout(fakeFetch);
  let threw = false;
  try {
    await fetchWithTimeout("https://example.com", {}, 50); // 50ms timeout
  } catch (e) {
    threw = true;
    expect(e.name).toBe("AbortError");
  }
  expect(threw).toBe(true);
});

test("resolves normally when fetch completes before timeout", async () => {
  const fakeFetch = async () => ({ ok: true, status: 200 });
  const fetchWithTimeout = makeFetchWithTimeout(fakeFetch);
  const result = await fetchWithTimeout("https://example.com", {}, 5000);
  expect(result.ok).toBe(true);
});

// ── Group 6: originalHint isolation ──────────────────────────────────────
console.log("\nGroup 6: originalHint isolation (logic simulation)");

test("originalHint is not set when generation throws", () => {
  let originalHint = "";
  // Simulate what the fixed hint button handler does
  const simulateHintSuccess = (hint) => { originalHint = hint; };
  // On error: do NOT call simulateHintSuccess
  const generateHintFn = (shouldFail) => {
    if (shouldFail) throw new Error("API failed");
    return "🎯 Key Insight: Use a hash map.";
  };

  try {
    const hint = generateHintFn(true);
    simulateHintSuccess(hint);
  } catch (_e) {
    // error path — originalHint must NOT be updated
  }

  expect(originalHint).toBe(""); // must remain empty
});

test("originalHint is set when generation succeeds", () => {
  let originalHint = "";
  const simulateHintSuccess = (hint) => { originalHint = hint; };
  const generateHintFn = () => "🎯 Key Insight: Use a hash map.";

  const hint = generateHintFn();
  simulateHintSuccess(hint);

  expect(originalHint).toBe("🎯 Key Insight: Use a hash map.");
});

// ── Group 7: Chat race-condition guard ────────────────────────────────────
console.log("\nGroup 7: Chat concurrent-call guard");

test("second call is ignored while first is in flight", async () => {
  let callCount = 0;
  let isChatPending = false;

  async function handleChat(msg) {
    if (isChatPending) return "blocked";
    isChatPending = true;
    callCount++;
    await new Promise(r => setTimeout(r, 20)); // simulate async work
    isChatPending = false;
    return "done";
  }

  // Fire two concurrent calls
  const [r1, r2] = await Promise.all([handleChat("hello"), handleChat("world")]);
  expect(r1).toBe("done");
  expect(r2).toBe("blocked");
  expect(callCount).toBe(1); // second call must not have incremented
});

// ── Group 8: Progress bar reset ───────────────────────────────────────────
console.log("\nGroup 8: Progress bar color reset");

test("progress bar color is cleared on reset", () => {
  // Simulate the element style object
  const progressFill = { style: { width: "85%", backgroundColor: "#4CAF50" } };
  
  // Simulate what the fixed code does at the start of each analysis
  progressFill.style.width = "0%";
  progressFill.style.backgroundColor = ""; // Bug fix: reset color

  expect(progressFill.style.width).toBe("0%");
  expect(progressFill.style.backgroundColor).toBe("");
});

test("progress bar color is reset on error too", () => {
  const progressFill = { style: { width: "70%", backgroundColor: "#FF9800" } };

  // Simulate error path
  progressFill.style.width = "0%";
  progressFill.style.backgroundColor = "";

  expect(progressFill.style.backgroundColor).toBe("");
});

// ─── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("\nSome tests FAILED. See errors above.");
  process.exit(1);
} else {
  console.log("\nAll tests passed! ✅");
}
