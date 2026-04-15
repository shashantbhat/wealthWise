# Migration Checklist: Switch to Optimized Storage

## Files Created

- ✅ `app/utils/expenseStorageOptimized.ts` - New optimized storage
- ✅ `context/expenseContextOptimized.tsx` - New optimized context
- ✅ `PERFORMANCE_OPTIMIZATION.md` - Documentation
- ✅ `MIGRATION_CHECKLIST.md` - This file

## Migration Steps

### Step 1: Update Storage Imports

Find all files that import from `expenseStorage.ts` and update them:

**Files to update:**

- [ ] `context/expenseContextOptimized.tsx` → Already points to optimized ✅
- [ ] `app/insights.tsx` - Update imports

**Search for:**

```typescript
from "@/app/utils/expenseStorage"
```

**Replace with:**

```typescript
from "@/app/utils/expenseStorageOptimized"
```

### Step 2: Update Context Imports

Find all files that import the context and update them:

**Files to update:**

- [ ] `app/(tabs)/index.tsx` - Home screen
- [ ] `app/insights.tsx` - Insights screen
- [ ] Any other component using `useExpenses()`

**Search for:**

```typescript
import { useExpenses } from "@/context/expense-context";
```

**Replace with:**

```typescript
import { useExpenses } from "@/context/expenseContextOptimized";
```

### Step 3: Switch Provider

Update your app's root provider:

**File:** `app/_layout.tsx` (or wherever you have providers)

**Find:**

```typescript
import { ExpenseProvider } from "@/context/expense-context";
```

**Replace with:**

```typescript
import { ExpenseProvider } from "@/context/expenseContextOptimized";
```

### Step 4: Verify All Imports

Search your entire codebase for any remaining references:

```bash
# In your terminal
grep -r "expenseStorage[^O]" --include="*.tsx" --include="*.ts" ~/Documents/GitHub/wealthWise/

grep -r "expense-context" --include="*.tsx" --include="*.ts" ~/Documents/GitHub/wealthWise/
```

Replace any matches with the new optimized versions.

### Step 5: Test the App

After switching to optimized versions:

- [ ] App starts without errors
- [ ] Can add expenses
- [ ] Can delete expenses
- [ ] Can view insights
- [ ] Can archive month
- [ ] Performance is smooth
- [ ] No console errors

### Step 6: Optional - Clean Up Old Files

Once everything is working, you can optionally delete the old files:

**Old files to delete:**

- `app/utils/expenseStorage.ts` (keep backup first!)
- `context/expense-context.tsx` (keep backup first!)

**Or keep them for reference** - It's fine to leave them if they're not being imported.

## Verification Commands

### Check all storage imports

```bash
grep -r "expenseStorage" ~/Documents/GitHub/wealthWise/app --include="*.tsx" --include="*.ts"
# Should only show: expenseStorageOptimized
```

### Check all context imports

```bash
grep -r "expense-context" ~/Documents/GitHub/wealthWise --include="*.tsx" --include="*.ts"
# Should show nothing (all should be expenseContextOptimized)
```

### Check for old pattern usage

```bash
grep -r "useExpenses" ~/Documents/GitHub/wealthWise --include="*.tsx" --include="*.ts"
# Check that it's importing from expenseContextOptimized
```

## Common Issues & Solutions

### Issue: App crashes after migration

**Solution:**

- Check that all imports are updated
- Run `npm start` fresh (clear cache)
- Check console for specific error

### Issue: Data not persisting

**Solution:**

- Ensure both storage AND context imports are updated
- Check that `ExpenseProvider` wraps your components

### Issue: Performance still slow

**Solution:**

- Verify you're using the optimized context (check provider in `_layout.tsx`)
- Check for any remaining imports of old files
- Clear app cache and reload

### Issue: Type errors

**Solution:**

- Make sure TypeScript compiler runs without errors
- Check that exported types are the same as before
- They should be - all types are re-exported with same names

## Files That Definitely Need Updates

1. **`app/(tabs)/index.tsx`** - Imports expense context for home screen
2. **`app/insights.tsx`** - Imports expense storage and context
3. **`app/_layout.tsx`** - Provider import
4. **`context/user-context.tsx`** - May read from expense context
5. **Any custom components** - That use expenses

## Rollback Plan

If something goes wrong:

1. Keep old files as backup (don't delete initially)
2. Revert imports to old files
3. Restart app
4. Debug and fix the issue

The optimized versions are fully backward compatible with the same API.

## Performance Verification

After migration, verify improvements:

### 1. Check cache effectiveness

```typescript
console.time("first-load");
const store1 = await loadExpenseStore();
console.timeEnd("first-load"); // ~200-300ms

console.time("cached-load");
const store2 = await loadExpenseStore();
console.timeEnd("cached-load"); // ~1-5ms (10-50x faster!)
```

### 2. Monitor React renders

- Use React Profiler (Expo DevTools)
- Look for unnecessary re-renders
- Should only re-render on actual data changes

### 3. Test on slow device

- Performance will be even more noticeable on older phones
- Should feel snappy and responsive

## Next Steps

After successful migration, you can:

1. Delete old files
2. Add cloud sync for backup
3. Add data compression
4. Implement local search indexing
5. Add analytics for usage patterns

## Support

If you encounter issues:

1. Check the PERFORMANCE_OPTIMIZATION.md guide
2. Review the migration checklist above
3. Check console errors for specific issues
4. Verify all imports are correct

---

**Migration Completed:** Date: ****\_\_\_****  
**Verified Working:** Yes ☐ No ☐
