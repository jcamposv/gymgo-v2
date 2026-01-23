# Multi-Location Accounting Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for adding multi-branch (location) accounting to GymGo. The goal is to enable per-branch revenue tracking, expense attribution, and reporting while maintaining backward compatibility and data integrity.

---

## Part 1: Current Architecture Analysis

### 1.1 Affected Tables

| Table | Has `organization_id` | Has `location_id` | Status |
|-------|----------------------|-------------------|--------|
| `members` | ✅ | ❌ | **Needs `location_id`** |
| `payments` | ✅ | ❌ | **Needs `location_id`** (Option A) |
| `income` | ✅ | ❌ | **Needs `location_id`** (nullable) |
| `expenses` | ✅ | ❌ | **Needs `location_id`** (nullable) |
| `locations` | ✅ | N/A | ✅ Already exists |
| `classes` | ✅ | ❌ | Future phase |
| `check_ins` | ✅ | ❌ | Future phase |

### 1.2 Affected Files

#### Member Flows
- `src/components/members/member-form.tsx` - Add location selector
- `src/actions/member.actions.ts` - Handle location_id in CRUD
- `src/schemas/member.schema.ts` - Add location_id validation
- `src/app/(dashboard)/dashboard/members/new/page.tsx` - Pass locations

#### Payment Flows
- `src/components/finances/payment-form.tsx` - Auto-set location from member
- `src/actions/finance.actions.ts` - Set location_id on create
- `src/schemas/finance.schema.ts` - Add location_id to payment schema

#### Income/Expense Flows
- `src/components/finances/expense-form.tsx` - Add location selector
- `src/components/finances/income-form.tsx` - **CREATE** + add location selector
- `src/actions/finance.actions.ts` - Handle location_id in CRUD
- `src/schemas/finance.schema.ts` - Add location_id to schemas

#### Dashboard/Reports
- `src/actions/dashboard.actions.ts` - Filter by location
- `src/actions/reports.actions.ts` - Filter by location
- `src/actions/finance.actions.ts` - `getFinanceOverview` filter by location
- `src/app/(dashboard)/dashboard/dashboard-content.tsx` - Location filter UI
- `src/app/(dashboard)/dashboard/reports/reports-client.tsx` - Location filter

#### Context/Providers
- `src/providers/location-provider.tsx` - ✅ Already exists
- `src/components/layout/location-switcher.tsx` - ✅ Already exists

### 1.3 Current Authorization Model

```
Roles:
- SUPER_ADMIN: All permissions (platform-wide)
- ADMIN: Full org access (all locations)
- ASSISTANT: Operational access (all locations currently)
- TRAINER: Training-related only
- NUTRITIONIST: Nutrition-related only
- CLIENT: Own data only
```

**Current State**: No location-based restrictions. All staff see all data within their organization.

---

## Part 2: Schema Design

### 2.1 Decision: Payment location_id

**Chosen Option: A (Add `payments.location_id`)**

**Reasoning:**
1. **Performance**: Reports aggregate payments by location. Joining payments→members→location for every report query is expensive.
2. **Historical Accuracy**: If a member changes location, their historical payments should remain attributed to the original location.
3. **Query Simplicity**: `WHERE location_id = X` is simpler than complex joins.
4. **Index Efficiency**: Can create `idx_payments_location_date` for fast aggregations.

### 2.2 Column Additions

```sql
-- Members: Required location (backfill to primary, then NOT NULL)
ALTER TABLE members ADD COLUMN location_id UUID REFERENCES locations(id);

-- Payments: Required location (derived from member at creation time)
ALTER TABLE payments ADD COLUMN location_id UUID REFERENCES locations(id);

-- Expenses: Optional location (NULL = org-wide)
ALTER TABLE expenses ADD COLUMN location_id UUID REFERENCES locations(id);

-- Income: Optional location (NULL = org-wide)
ALTER TABLE income ADD COLUMN location_id UUID REFERENCES locations(id);
```

### 2.3 Indexes

```sql
-- Members by location
CREATE INDEX idx_members_location ON members(location_id);
CREATE INDEX idx_members_org_location ON members(organization_id, location_id);

-- Payments by location (critical for reports)
CREATE INDEX idx_payments_location ON payments(location_id);
CREATE INDEX idx_payments_location_date ON payments(organization_id, location_id, payment_date);
CREATE INDEX idx_payments_location_status ON payments(organization_id, location_id, status);

-- Expenses by location
CREATE INDEX idx_expenses_location ON expenses(location_id);
CREATE INDEX idx_expenses_org_location_date ON expenses(organization_id, location_id, expense_date);

-- Income by location
CREATE INDEX idx_income_location ON income(location_id);
CREATE INDEX idx_income_org_location_date ON income(organization_id, location_id, income_date);
```

---

## Part 3: Migration Plan (Safe Rollout)

### Step 1: Add columns (nullable)

```sql
-- Migration: 025_location_attribution.sql

-- 1. Add location_id to members (nullable initially)
ALTER TABLE members
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- 2. Add location_id to payments (nullable initially)
ALTER TABLE payments
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- 3. Add location_id to expenses (nullable, stays nullable)
ALTER TABLE expenses
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- 4. Add location_id to income (nullable, stays nullable)
ALTER TABLE income
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
```

### Step 2: Backfill existing data

```sql
-- Backfill members with their org's primary location
UPDATE members m
SET location_id = (
  SELECT l.id FROM locations l
  WHERE l.organization_id = m.organization_id
  AND l.is_primary = true
  LIMIT 1
)
WHERE m.location_id IS NULL;

-- Backfill payments from their member's location
UPDATE payments p
SET location_id = (
  SELECT m.location_id FROM members m
  WHERE m.id = p.member_id
)
WHERE p.location_id IS NULL;
```

### Step 3: Add NOT NULL constraint to members

```sql
-- Only after backfill is complete and verified
ALTER TABLE members
ALTER COLUMN location_id SET NOT NULL;

-- Add constraint to ensure location belongs to same org
ALTER TABLE members
ADD CONSTRAINT members_location_org_check
CHECK (
  location_id IS NULL OR
  EXISTS (
    SELECT 1 FROM locations l
    WHERE l.id = members.location_id
    AND l.organization_id = members.organization_id
  )
);
```

### Step 4: Create indexes

```sql
-- Performance indexes
CREATE INDEX idx_members_location ON members(location_id);
CREATE INDEX idx_members_org_location ON members(organization_id, location_id);
CREATE INDEX idx_payments_location ON payments(location_id);
CREATE INDEX idx_payments_location_date ON payments(organization_id, location_id, payment_date);
CREATE INDEX idx_expenses_location ON expenses(location_id);
CREATE INDEX idx_income_location ON income(location_id);
```

### Step 5: Create trigger for auto-setting payment location

```sql
-- Auto-set payment.location_id from member on insert
CREATE OR REPLACE FUNCTION set_payment_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location_id IS NULL AND NEW.member_id IS NOT NULL THEN
    SELECT location_id INTO NEW.location_id
    FROM members
    WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_set_location
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION set_payment_location();
```

---

## Part 4: RLS & Access Control

### 4.1 User Location Assignment

**Decision: Use existing profiles table**

For v1, location access is role-based:
- **ADMIN/SUPER_ADMIN**: Access ALL locations in org
- **ASSISTANT/TRAINER/NUTRITIONIST**: Access ALL locations (future: restrict)
- **CLIENT**: Access only their own member data (no location restriction needed)

**Future Enhancement**: Add `user_locations` table for fine-grained control.

### 4.2 RLS Policies for Location-Scoped Tables

```sql
-- Members: Staff can view members in org (admin sees all, future: restrict by location)
CREATE POLICY "members_select_by_location" ON members
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
);

-- Payments: Same org-level for now
CREATE POLICY "payments_select_by_location" ON payments
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
);

-- Expenses: Admin sees all, including org-wide (NULL location)
-- Org-wide expenses (location_id IS NULL): Admin only
CREATE POLICY "expenses_select_by_location" ON expenses
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
);

-- Income: Same pattern as expenses
CREATE POLICY "income_select_by_location" ON income
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization_id()
);
```

### 4.3 Org-Wide Records (NULL location_id)

**Decision**: Visible to all staff but read-only for non-admin.

- **Expenses with NULL location_id**: Shown in global reports, labeled "General"
- **Income with NULL location_id**: Same treatment
- **UI**: Admin can create org-wide records; non-admin cannot

---

## Part 5: UI Changes

### 5.1 Member Form

**File**: `src/components/members/member-form.tsx`

```tsx
// Add location selector (required field)
<FormField
  name="location_id"
  control={form.control}
  render={({ field }) => (
    <FormItem>
      <FormLabel>Sucursal *</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una sucursal" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc.id} value={loc.id}>
              {loc.name}
              {loc.is_primary && " (Principal)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Behavior**:
- Pre-select current location from LocationContext
- If user has only 1 location: auto-set and hide selector
- Required field (no NULL option)

### 5.2 Expense Form

**File**: `src/components/finances/expense-form.tsx`

```tsx
// Add optional location selector
<FormField
  name="location_id"
  control={form.control}
  render={({ field }) => (
    <FormItem>
      <FormLabel>Sucursal</FormLabel>
      <Select
        onValueChange={(val) => field.onChange(val === 'general' ? null : val)}
        defaultValue={field.value ?? 'general'}
      >
        <SelectTrigger>
          <SelectValue placeholder="General (Todas las sucursales)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="general">
            General (Todas las sucursales)
          </SelectItem>
          {locations.map((loc) => (
            <SelectItem key={loc.id} value={loc.id}>
              {loc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>
        Los gastos generales se distribuyen entre todas las sucursales en reportes.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 5.3 Income Form (CREATE NEW)

**File**: `src/components/finances/income-form.tsx`

Same pattern as expense form with optional location selector.

### 5.4 Payment Form

**File**: `src/components/finances/payment-form.tsx`

**No UI change needed**. Location is auto-derived from selected member.

Show info text:
```tsx
{selectedMember && (
  <p className="text-sm text-muted-foreground">
    Este pago se registrará en: {selectedMember.location_name}
  </p>
)}
```

### 5.5 Dashboard Location Filter

**File**: `src/app/(dashboard)/dashboard/dashboard-content.tsx`

Add location filter dropdown in header:

```tsx
<div className="flex items-center gap-4">
  <LocationFilter
    locations={locations}
    currentLocation={currentLocation}
    onLocationChange={setCurrentLocation}
    showAllOption={isAdmin} // Only admin sees "All locations"
  />
  {/* existing period selector */}
</div>
```

### 5.6 Reports Location Filter

**File**: `src/app/(dashboard)/dashboard/reports/reports-client.tsx`

Same pattern as dashboard.

### 5.7 Finance Pages

Add location column to data tables:
- `src/components/finances/payments-columns.tsx`
- `src/components/finances/expenses-columns.tsx`
- `src/components/finances/income-columns.tsx`

```tsx
{
  accessorKey: 'location',
  header: 'Sucursal',
  cell: ({ row }) => {
    const location = row.original.location
    return location ? location.name : (
      <span className="text-muted-foreground">General</span>
    )
  },
}
```

---

## Part 6: Reporting Queries

### 6.1 Finance Overview (Per Location)

```typescript
// finance.actions.ts - getFinanceOverview
export async function getFinanceOverview(params?: {
  locationId?: string | null  // null = all locations
  startDate?: string
  endDate?: string
}) {
  const { locationId, startDate, endDate } = params ?? {}

  // Build base query
  let paymentsQuery = supabase
    .from('payments')
    .select('amount')
    .eq('organization_id', organizationId)
    .eq('status', 'paid')

  // Filter by location if specified
  if (locationId) {
    paymentsQuery = paymentsQuery.eq('location_id', locationId)
  }

  // Date filters...

  // Same pattern for expenses and income
}
```

### 6.2 Report Summary (Per Location)

```typescript
// reports.actions.ts - getReportSummary
export async function getReportSummary(params: {
  period: 'week' | 'month' | 'year'
  locationId?: string | null
}) {
  const { period, locationId } = params

  // Members count by location
  let membersQuery = supabase
    .from('members')
    .select('id', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (locationId) {
    membersQuery = membersQuery.eq('location_id', locationId)
  }

  // Revenue by location
  let revenueQuery = supabase
    .from('payments')
    .select('amount')
    .eq('organization_id', organizationId)
    .eq('status', 'paid')

  if (locationId) {
    revenueQuery = revenueQuery.eq('location_id', locationId)
  }

  // Expenses: Include both location-specific AND org-wide
  let expensesQuery = supabase
    .from('expenses')
    .select('amount')
    .eq('organization_id', organizationId)

  if (locationId) {
    // Location-specific: include this location OR org-wide (NULL)
    expensesQuery = expensesQuery.or(`location_id.eq.${locationId},location_id.is.null`)
  }

  // ...aggregate results
}
```

### 6.3 Global vs Location Reports

**Global Report (All Locations)**:
```sql
-- Total revenue across all locations
SELECT SUM(amount) as total_revenue
FROM payments
WHERE organization_id = $org_id
AND status = 'paid'
AND payment_date BETWEEN $start AND $end;

-- Total expenses (including org-wide)
SELECT SUM(amount) as total_expenses
FROM expenses
WHERE organization_id = $org_id
AND expense_date BETWEEN $start AND $end;
```

**Location Report**:
```sql
-- Revenue for specific location
SELECT SUM(amount) as location_revenue
FROM payments
WHERE organization_id = $org_id
AND location_id = $location_id
AND status = 'paid'
AND payment_date BETWEEN $start AND $end;

-- Expenses for location (including proportional org-wide)
-- Option A: Show org-wide separately
SELECT
  SUM(CASE WHEN location_id = $location_id THEN amount ELSE 0 END) as direct_expenses,
  SUM(CASE WHEN location_id IS NULL THEN amount ELSE 0 END) as shared_expenses
FROM expenses
WHERE organization_id = $org_id
AND expense_date BETWEEN $start AND $end;
```

---

## Part 7: UI Messages (Spanish)

### Empty States

```typescript
// No data for location
"No hay ingresos registrados para esta sucursal en el período seleccionado."
"No hay gastos registrados para esta sucursal en el período seleccionado."
"No hay miembros en esta sucursal."
"No hay pagos registrados para esta sucursal."

// No access
"No tienes acceso a esta sucursal."

// Org-wide label
"General (Todas las sucursales)"

// Location selector
"Selecciona una sucursal"
"Todas las sucursales"

// Form helpers
"Los gastos generales aplican a todas las sucursales."
"Este miembro pertenecerá a la sucursal seleccionada."
"El pago se registrará en la sucursal del miembro."
```

---

## Part 8: Implementation Order

### Phase 1: Database (This Sprint)
1. ✅ Create `locations` table (DONE)
2. ✅ Auto-create primary location for orgs (DONE)
3. Create migration `025_location_attribution.sql`
4. Run backfill
5. Add NOT NULL constraint to members

### Phase 2: Backend (Next)
1. Update member schema + actions
2. Update payment actions (auto-set location)
3. Update expense/income schemas + actions
4. Add location filters to report queries

### Phase 3: UI (After Backend)
1. Add location selector to member form
2. Add location selector to expense/income forms
3. Create income form (missing)
4. Add location column to data tables
5. Add location filter to dashboard
6. Add location filter to reports

### Phase 4: Testing
1. Test member creation with location
2. Test payment attribution
3. Test expense/income with/without location
4. Test reports by location
5. Test global reports
6. Test permission boundaries

---

## Part 9: Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backfill fails | Members without location | Run in batches, verify counts |
| Performance regression | Slow reports | Add indexes before queries |
| Breaking existing queries | App errors | Test all finance queries |
| User confusion | Support tickets | Clear UI labels + help text |
| Historical data issues | Wrong reports | Keep payment.location_id immutable |

---

## Part 10: Testing Checklist

### Admin User
- [ ] Can switch between locations in dashboard
- [ ] Can view global (all locations) report
- [ ] Can create member with any location
- [ ] Can create expense for specific location
- [ ] Can create expense for all locations (general)
- [ ] Sees correct totals per location

### Non-Admin User (Assistant)
- [ ] Sees location filter (if multiple locations)
- [ ] Can create member with location
- [ ] Can create expense with location
- [ ] Cannot create org-wide expense (admin only) [Future]
- [ ] Sees correct data for selected location

### Data Correctness
- [ ] New payment inherits member's location
- [ ] Member count by location is accurate
- [ ] Revenue by location matches payments
- [ ] Expenses by location + general shown correctly
- [ ] Global totals = sum of all locations + general

---

## Appendix: Full Migration SQL

```sql
-- Migration: 025_location_attribution.sql
-- Multi-location accounting support

-- =============================================================================
-- 1. ADD COLUMNS
-- =============================================================================

-- Members: location_id (will be NOT NULL after backfill)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Payments: location_id (derived from member)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Expenses: location_id (optional, NULL = org-wide)
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Income: location_id (optional, NULL = org-wide)
ALTER TABLE income
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- =============================================================================
-- 2. BACKFILL MEMBERS
-- =============================================================================

UPDATE members m
SET location_id = (
  SELECT l.id FROM locations l
  WHERE l.organization_id = m.organization_id
  AND l.is_primary = true
  LIMIT 1
)
WHERE m.location_id IS NULL;

-- =============================================================================
-- 3. BACKFILL PAYMENTS
-- =============================================================================

UPDATE payments p
SET location_id = (
  SELECT m.location_id FROM members m
  WHERE m.id = p.member_id
)
WHERE p.location_id IS NULL
AND p.member_id IS NOT NULL;

-- =============================================================================
-- 4. ADD NOT NULL CONSTRAINT TO MEMBERS
-- =============================================================================

ALTER TABLE members
ALTER COLUMN location_id SET NOT NULL;

-- =============================================================================
-- 5. CREATE INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_members_location
ON members(location_id);

CREATE INDEX IF NOT EXISTS idx_members_org_location
ON members(organization_id, location_id);

CREATE INDEX IF NOT EXISTS idx_payments_location
ON payments(location_id);

CREATE INDEX IF NOT EXISTS idx_payments_location_date
ON payments(organization_id, location_id, payment_date);

CREATE INDEX IF NOT EXISTS idx_payments_location_status
ON payments(organization_id, location_id, status);

CREATE INDEX IF NOT EXISTS idx_expenses_location
ON expenses(location_id);

CREATE INDEX IF NOT EXISTS idx_expenses_org_location_date
ON expenses(organization_id, location_id, expense_date);

CREATE INDEX IF NOT EXISTS idx_income_location
ON income(location_id);

CREATE INDEX IF NOT EXISTS idx_income_org_location_date
ON income(organization_id, location_id, income_date);

-- =============================================================================
-- 6. AUTO-SET PAYMENT LOCATION TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION set_payment_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate location_id from member if not provided
  IF NEW.location_id IS NULL AND NEW.member_id IS NOT NULL THEN
    SELECT location_id INTO NEW.location_id
    FROM members
    WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_set_location ON payments;
CREATE TRIGGER payment_set_location
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION set_payment_location();

-- =============================================================================
-- 7. HELPER FUNCTION: Get location members count
-- =============================================================================

CREATE OR REPLACE FUNCTION get_location_member_count(loc_id UUID)
RETURNS INTEGER AS $$
DECLARE
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM members
  WHERE location_id = loc_id
  AND status = 'active';

  RETURN member_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DONE
-- =============================================================================
```

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Create the migration** file
3. **Test on staging** environment
4. **Update TypeScript types** after migration
5. **Implement backend changes** (actions, schemas)
6. **Implement UI changes** (forms, filters)
7. **QA testing** with test data
8. **Deploy to production**
