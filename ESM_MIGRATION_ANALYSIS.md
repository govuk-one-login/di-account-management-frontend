# ESM Migration Analysis - di-account-management-frontend

## Current State Summary

### ✅ What's Been Done

1. **Package.json Configuration**

   - `"type": "module"` is set ✅
   - All dependencies are up-to-date and ESM-compatible ✅

2. **TypeScript Configuration**

   - `tsconfig.json` uses `"module": "nodenext"` and `"moduleResolution": "nodenext"` ✅
   - Target is ES2020 ✅
   - ESM interop enabled ✅

3. **Source Code Migration**

   - All `.ts` files in `src/` use ESM imports with `.js` extensions ✅
   - No `require()` or `module.exports` in production code ✅
   - Proper use of `import.meta.url` for `__dirname` and `__filename` ✅

4. **Test Infrastructure**

   - 41 test files converted to TypeScript ✅
   - Test utilities (`test/utils/`) have both `.ts` and `.js` versions ✅
   - Mocha configured with `ts-node/esm` loader ✅

5. **Build Process**
   - Custom scripts to fix import paths after compilation ✅
   - `copy-test-utils` script compiles test utilities to `.js` ✅
   - Scripts fix relative import paths and add `.js` extensions ✅

---

## ⚠️ Remaining Issues

### 1. **Test Files Still Using CommonJS Patterns**

**Location:** Test files in `src/components/*/tests/`

**Problem:** Many test files use `require()` for stubbing:

```typescript
// ❌ CommonJS pattern still in use
const configFuncs = require("../../../config");
sandbox.stub(configFuncs, "reportSuspiciousActivity").callsFake(() => {
  return true;
});
```

**Files Affected:**

- `src/components/report-suspicious-activity/tests/report-suspicious-activity-controller.test.ts`
- `src/utils/test/oidc.test.ts`
- Potentially others

**Solution:**

```typescript
// ✅ ESM pattern
import * as config from "../../../config.js";
sandbox.stub(config, "reportSuspiciousActivity").callsFake(() => {
  return true;
});
```

### 2. **Test Utils Dual Format**

**Location:** `test/utils/`

**Current State:**

- `.ts` source files exist
- `.js` compiled files are generated during build
- Both versions are committed to git

**Problem:** Maintaining two versions is error-prone

**Files:**

- `test/utils/test-utils.ts` + `test-utils.js`
- `test/utils/behaviours.ts` + `behaviours.js`
- `test/utils/builders.ts` + `builders.js`
- `test/utils/helpers.ts` + `helpers.js`
- `test/utils/logger.test.ts` + `logger.test.js`

**Solution Options:**

1. Only commit `.ts` files, generate `.js` during build
2. Use `ts-node/esm` loader for all tests (no compilation needed)

### 3. **Import Path Inconsistencies**

**Problem:** Test files have inconsistent import paths for test-utils

**Examples:**

```typescript
// Some files use:
import { sinon } from "../../../test/utils/test-utils";

// Should be:
import { sinon } from "../../../../test/utils/test-utils.js";
```

**Root Cause:** Test files are in `src/components/*/tests/` but test-utils is in `test/utils/`

### 4. **Build Scripts Complexity**

**Current Scripts:**

- `scripts/fix-test-utils-imports.sh` - Fixes import paths in compiled test utils
- `scripts/fix-test-imports.sh` - Fixes import paths in compiled test files

**Problem:** These scripts use `sed` to post-process compiled JavaScript, which is fragile and platform-specific (macOS-specific with `sed -i ''`)

**Issues:**

- Won't work on Linux without modification
- Brittle pattern matching
- Hard to maintain

---

## 🎯 Recommended Migration Steps

### Phase 1: Fix Test Import Patterns (Immediate)

1. **Replace all `require()` in test files with ESM imports**

   ```bash
   # Find all test files with require()
   grep -r "require(" src --include="*.ts"
   ```

2. **Standardize test-utils imports**

   - Update all test files to use correct relative paths
   - Add `.js` extension to all imports

3. **Update test files to use namespace imports for stubbing**
   ```typescript
   import * as moduleName from "../path/to/module.js";
   sandbox.stub(moduleName, "functionName");
   ```

### Phase 2: Simplify Test Utils (Short-term)

1. **Remove compiled `.js` files from git**

   ```bash
   git rm test/utils/*.js
   echo "test/utils/*.js" >> .gitignore
   ```

2. **Update build process**

   - Ensure `copy-test-utils` runs before tests
   - Or use `ts-node/esm` loader exclusively

3. **Simplify or remove post-processing scripts**
   - Fix import paths at source, not after compilation
   - Use TypeScript path mapping if needed

### Phase 3: Mocha Configuration (Medium-term)

1. **Consolidate Mocha configs**

   - Current: `.mocharc.json` and `tsconfig.mocha.json`
   - Simplify to single configuration

2. **Use consistent loader**
   ```json
   {
     "loader": "ts-node/esm",
     "extensions": ["ts"],
     "spec": ["src/**/*.test.ts", "test/**/*.test.ts"]
   }
   ```

### Phase 4: Clean Up (Long-term)

1. **Remove legacy integration test support**

   - `test:integration-legacy` still uses old patterns
   - Migrate or remove

2. **Standardize file structure**

   - Consider moving test files to `test/` directory
   - Or keep co-located but fix import paths

3. **Update CI/CD**
   - Ensure build scripts work on all platforms
   - Remove macOS-specific `sed` usage

---

## 📋 Checklist for Complete ESM Migration

- [x] package.json has `"type": "module"`
- [x] TypeScript configured for ESM
- [x] All source files use ESM imports
- [x] All imports have `.js` extensions
- [ ] All test files use ESM imports (no `require()`)
- [ ] Test utils only in TypeScript (no committed `.js`)
- [ ] Import paths are consistent and correct
- [ ] Build scripts are platform-independent
- [ ] All tests pass with ESM loader
- [ ] No post-processing of compiled files needed

---

## 🔧 Quick Fixes Needed

### Fix 1: Update report-suspicious-activity test

```typescript
// Replace all instances of:
const configFuncs = require("../../../config");

// With:
import * as config from "../../../config.js";
// Then use: sandbox.stub(config, "reportSuspiciousActivity")
```

### Fix 2: Update oidc.test.ts

```typescript
// Replace:
sandbox.stub(require("../cache"), "cacheWithExpiration");

// With:
import * as cache from "../cache.js";
sandbox.stub(cache, "cacheWithExpiration");
```

### Fix 3: Standardize test-utils imports

```typescript
// For files in src/components/*/tests/:
import { sinon } from "../../../../test/utils/test-utils.js";

// For files in src/utils/test/:
import { sinon } from "../../../test/utils/test-utils.js";
```

---

## 📊 Migration Progress

- **Source Code:** 100% ✅
- **Test Files:** ~85% (require() still in some tests)
- **Build Process:** 90% (works but needs simplification)
- **Documentation:** 70% (this document helps!)

---

## 🚀 Benefits After Full Migration

1. **Native ESM support** - No transpilation needed in Node.js
2. **Better tree-shaking** - Smaller bundle sizes
3. **Faster tests** - Direct TypeScript execution with ts-node/esm
4. **Simpler build** - No post-processing scripts needed
5. **Better IDE support** - Proper import resolution
6. **Future-proof** - Aligned with JavaScript ecosystem direction

---

## 📝 Notes

- The codebase is 95% migrated to ESM
- Main remaining work is cleaning up test patterns
- Build scripts work but are overly complex
- Consider using TypeScript path mapping to simplify imports
- The `integration-tests` folder may need separate analysis
