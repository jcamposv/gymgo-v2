# Multi-Location Feature Design

## Overview

This document outlines the architecture and implementation plan for supporting multiple physical locations (branches) within a single GymGo organization.

## Plan Availability

- **Starter, Basic, Pro**: Single location (default)
- **Business**: Up to 5 locations
- **Enterprise**: Unlimited locations

The `multiLocation` feature flag in pricing.config.ts controls UI access, while `maxLocations` enforces the limit.

## Database Schema

### New Table: `locations`

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly identifier
  description TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'MX',

  -- Contact
  phone TEXT,
  email TEXT,

  -- Coordinates (for map display)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Operating hours (JSONB for flexibility)
  operating_hours JSONB DEFAULT '{}',
  -- Example: { "mon": { "open": "06:00", "close": "22:00" }, ... }

  -- Settings
  timezone TEXT DEFAULT 'America/Mexico_City',
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Main location

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one primary location per org
CREATE UNIQUE INDEX idx_locations_primary ON locations(organization_id) WHERE is_primary = true;

-- Unique slug within organization
CREATE UNIQUE INDEX idx_locations_org_slug ON locations(organization_id, slug);

-- RLS policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view locations in their org"
  ON locations FOR SELECT
  USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin')
  );
```

### Entity Associations

Tables that need `location_id` column:

| Table | Required | Notes |
|-------|----------|-------|
| `members` | Optional | Members can be associated with a "home" location |
| `classes` | Required | Classes happen at specific locations |
| `class_templates` | Optional | Templates can be location-specific |
| `trainers` (profiles) | Optional | Trainers can work at specific locations |
| `check_ins` | Required | Track which location check-in occurred |
| `bookings` | Inherited | From class location |
| `expenses` | Optional | Track expenses by location |
| `income` | Optional | Track revenue by location |

### Migration Strategy

1. Create `locations` table
2. Auto-create a "default" location for each existing organization
3. Add `location_id` columns to affected tables (nullable initially)
4. Backfill `location_id` with the default location
5. Make `location_id` NOT NULL where required

## API Design

### Server Actions

```typescript
// src/actions/location.actions.ts

// CRUD
createLocation(data: LocationFormData): Promise<ActionResult>
updateLocation(id: string, data: LocationFormData): Promise<ActionResult>
deleteLocation(id: string): Promise<ActionResult>
getLocations(): Promise<Location[]>
getLocation(id: string): Promise<Location | null>

// Helpers
setDefaultLocation(id: string): Promise<ActionResult>
getLocationUsage(id: string): Promise<LocationUsageStats>
```

### Plan Limit Integration

The `checkLocationLimit()` function already exists in `src/lib/plan-limits.ts`.

Usage in createLocation:
```typescript
export async function createLocation(data: LocationFormData): Promise<ActionResult> {
  // ... auth checks ...

  // Check location limit
  const limitCheck = await checkLocationLimit(user.organizationId)
  if (!limitCheck.allowed) {
    return {
      success: false,
      message: limitCheck.message,
      errors: {
        [PLAN_LIMIT_ERROR_CODE]: [limitCheck.message || 'Location limit reached'],
      },
    }
  }

  // ... create location ...
}
```

## UI Components

### Location Selector (Global)

Add a location selector in the dashboard header/sidebar for organizations with multi-location enabled:

```
src/components/layout/location-selector.tsx
```

Features:
- Dropdown showing all active locations
- "All locations" option for aggregate views
- Persists selection in localStorage/cookie
- Context provider for current location

### Location Management Page

```
src/app/(dashboard)/dashboard/settings/locations/page.tsx
src/app/(dashboard)/dashboard/settings/locations/[id]/page.tsx
```

Features:
- List all locations with usage stats
- Add/edit/delete locations
- Set primary location
- View members, classes, trainers per location

### Location-Aware Components

Components that need location filtering:

1. **Members list** - Filter by home location
2. **Classes list/calendar** - Filter by class location
3. **Check-in** - Select location for check-in
4. **Reports** - Filter analytics by location
5. **Expenses/Income** - Associate with location

## Context & State Management

### LocationContext

```typescript
// src/contexts/location-context.tsx

interface LocationContextValue {
  locations: Location[]
  currentLocation: Location | null // null = "All locations"
  setCurrentLocation: (id: string | null) => void
  isMultiLocation: boolean // Organization has feature enabled
  canAddLocation: boolean // Has quota remaining
}
```

### URL Strategy

Option A: Query parameter
```
/dashboard/members?location=abc123
/dashboard/classes?location=abc123
```

Option B: Path segment
```
/dashboard/locations/abc123/members
/dashboard/locations/abc123/classes
```

**Recommendation**: Use query parameter for flexibility - allows "all locations" view easily.

## Data Scoping

### Query Patterns

For location-aware queries:

```typescript
// Get members for current location (or all if null)
const query = supabase
  .from('members')
  .select('*')
  .eq('organization_id', organizationId)

if (locationId) {
  query.eq('location_id', locationId)
}
```

### Aggregate Views

When viewing "All Locations":
- Show combined data
- Include location name in list views
- Group reports by location

## Migration Path

### Phase 1: Foundation (Current)
- [x] Location limits in plan configuration
- [x] `checkLocationLimit()` function
- [ ] Create `locations` table and RLS

### Phase 2: Basic Multi-Location
- [ ] Location CRUD actions
- [ ] Location management UI
- [ ] Location selector component
- [ ] Add `location_id` to classes

### Phase 3: Entity Association
- [ ] Add `location_id` to members
- [ ] Location-aware check-ins
- [ ] Update forms to include location selection

### Phase 4: Reporting
- [ ] Location-based analytics
- [ ] Per-location revenue tracking
- [ ] Multi-location comparison reports

## Security Considerations

1. **RLS Policies**: All location data must be scoped to organization
2. **Feature Gating**: Hide UI elements for plans without multi-location
3. **Limit Enforcement**: Prevent location creation beyond plan limit
4. **Cross-Location Access**: Users should only see locations in their org

## Edge Cases

1. **Deleting a location**:
   - Cannot delete primary location
   - Must reassign entities before deletion
   - Soft delete option for historical data

2. **Downgrading plans**:
   - If org has 5 locations and downgrades to Pro (1 location)
   - Show warning, require deactivation of extra locations
   - Block downgrade until locations are reduced

3. **Member transfers**:
   - Allow changing member's home location
   - Track history of location changes

## File Structure

```
src/
├── actions/
│   └── location.actions.ts
├── components/
│   ├── layout/
│   │   └── location-selector.tsx
│   └── locations/
│       ├── location-form.tsx
│       ├── location-card.tsx
│       └── location-list.tsx
├── contexts/
│   └── location-context.tsx
├── hooks/
│   └── use-location.ts
├── app/(dashboard)/dashboard/settings/locations/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
└── schemas/
    └── location.schema.ts
```

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Foundation | 1 day |
| Phase 2: Basic Multi-Location | 3-4 days |
| Phase 3: Entity Association | 3-4 days |
| Phase 4: Reporting | 2-3 days |

**Total**: ~10-12 days for full implementation
