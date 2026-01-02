import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'

// =============================================================================
// Core Types
// =============================================================================

export type PaginationMode = 'client' | 'server'

export interface TableQuery {
  page: number
  pageSize: number
  search: string
  sortBy: string | null
  sortDir: 'asc' | 'desc' | null
  filters: Record<string, string | string[]>
}

export interface PaginationInfo {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// =============================================================================
// Filter Types
// =============================================================================

export type FilterType = 'select' | 'multi-select' | 'date-range' | 'text'

export interface FilterOption {
  label: string
  value: string
  icon?: LucideIcon
}

export interface FilterConfig {
  id: string
  label: string
  type: FilterType
  options?: FilterOption[]
  placeholder?: string
  column?: string // Column to filter (defaults to id)
}

export interface DateRangeValue {
  from: Date | null
  to: Date | null
}

// =============================================================================
// Action Types
// =============================================================================

export interface ActionConfig {
  id: string
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  disabled?: boolean
}

export interface RowAction<TData> {
  id: string
  label: string
  icon?: LucideIcon
  onClick: (row: TData) => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  disabled?: boolean | ((row: TData) => boolean)
  hidden?: boolean | ((row: TData) => boolean)
}

// =============================================================================
// DataTable Props
// =============================================================================

export interface DataTableProps<TData> {
  // Required
  columns: ColumnDef<TData, unknown>[]
  data: TData[]

  // Pagination
  mode?: PaginationMode
  totalItems?: number
  defaultPageSize?: number
  pageSizeOptions?: number[]

  // Server-side callbacks
  onQueryChange?: (query: TableQuery) => void

  // Search
  searchable?: boolean
  searchPlaceholder?: string
  searchColumns?: (keyof TData)[] // Columns to search in client mode

  // Filters
  filters?: FilterConfig[]

  // Sorting
  sortable?: boolean
  defaultSort?: SortingState

  // Actions
  primaryAction?: ActionConfig
  secondaryActions?: ActionConfig[]

  // Row actions
  rowActions?: RowAction<TData>[]

  // Selection
  selectable?: boolean
  onSelectionChange?: (selected: TData[]) => void

  // States
  loading?: boolean
  error?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: LucideIcon

  // Layout
  toolbar?: React.ReactNode | false
  showPagination?: boolean
  stickyHeader?: boolean

  // Styling
  className?: string
  striped?: boolean

  // Row customization
  onRowClick?: (row: TData) => void
  getRowId?: (row: TData) => string
}

// =============================================================================
// Hook Types
// =============================================================================

export interface UseDataTableOptions<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  mode: PaginationMode
  totalItems?: number
  defaultPageSize?: number
  defaultSort?: SortingState
  searchColumns?: (keyof TData)[]
  onQueryChange?: (query: TableQuery) => void
}

export interface UseDataTableReturn<TData> {
  table: import('@tanstack/react-table').Table<TData>
  query: TableQuery
  pagination: PaginationInfo
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearch: (search: string) => void
  setSorting: (sorting: SortingState) => void
  setFilters: (filters: ColumnFiltersState) => void
  setFilter: (id: string, value: string | string[] | null) => void
  resetFilters: () => void
}

export interface UseTableUrlStateOptions {
  enabled?: boolean
  defaultPageSize?: number
}

export interface UseTableUrlStateReturn {
  query: TableQuery
  setQuery: (query: Partial<TableQuery>) => void
  resetQuery: () => void
}

// =============================================================================
// Component Props
// =============================================================================

export interface DataTableToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterConfig[]
  filterValues?: Record<string, string | string[]>
  onFilterChange?: (id: string, value: string | string[] | null) => void
  onResetFilters?: () => void
  primaryAction?: ActionConfig
  secondaryActions?: ActionConfig[]
  children?: React.ReactNode
}

export interface DataTablePaginationProps {
  pageIndex: number
  pageSize: number
  totalItems: number
  totalPages: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export interface DataTableSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export interface DataTableFilterProps {
  config: FilterConfig
  value: string | string[] | undefined
  onChange: (value: string | string[] | null) => void
}

export interface DataTableActionsProps {
  primaryAction?: ActionConfig
  secondaryActions?: ActionConfig[]
}

export interface DataTableColumnHeaderProps<TData, TValue> {
  column: import('@tanstack/react-table').Column<TData, TValue>
  title: string
  className?: string
}

export interface DataTableEmptyProps {
  title?: string
  description?: string
  icon?: LucideIcon
  action?: ActionConfig
}

export interface DataTableLoadingProps {
  columns: number
  rows?: number
}

// =============================================================================
// Status Badge Types
// =============================================================================

export type StatusVariant = 'active' | 'new' | 'inactive' | 'pending' | 'default'

export interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  className?: string
}

export const statusVariantMap: Record<string, StatusVariant> = {
  active: 'active',
  new: 'new',
  inactive: 'inactive',
  pending: 'pending',
  suspended: 'inactive',
  cancelled: 'inactive',
  expired: 'inactive',
}

// =============================================================================
// Mobile Card Types
// =============================================================================

/**
 * Configuration for a field in the mobile card
 */
export interface MobileCardField<TData> {
  /** Column accessor key or custom id */
  id: keyof TData | string
  /** Label to show (optional, defaults to column header) */
  label?: string
  /** Custom render function */
  render?: (value: unknown, row: TData) => React.ReactNode
}

/**
 * Configuration for mobile card layout
 */
export interface MobileCardConfig<TData> {
  /** Fields to show in the card header (prominent) */
  titleField?: keyof TData | string
  /** Subtitle field */
  subtitleField?: keyof TData | string
  /** Fields to show in the primary section */
  primaryFields?: (keyof TData | string | MobileCardField<TData>)[]
  /** Fields to show in the secondary/details section */
  secondaryFields?: (keyof TData | string | MobileCardField<TData>)[]
  /** Whether to show row actions in card */
  showActions?: boolean
  /** Custom avatar/icon render */
  renderAvatar?: (row: TData) => React.ReactNode
}

/**
 * Props for custom mobile card rendering
 */
export interface MobileCardRenderProps<TData> {
  row: import('@tanstack/react-table').Row<TData>
  table: import('@tanstack/react-table').Table<TData>
  onRowClick?: (row: TData) => void
}

/**
 * Extended DataTable props with mobile support
 */
export interface DataTableMobileProps<TData> {
  /** Enable mobile card view (default: true) */
  enableMobileCards?: boolean
  /** Breakpoint for switching to mobile (default: 768) */
  mobileBreakpoint?: number
  /** Mobile card configuration */
  mobileCardConfig?: MobileCardConfig<TData>
  /** Custom mobile card render function (overrides mobileCardConfig) */
  renderMobileCard?: (props: MobileCardRenderProps<TData>) => React.ReactNode
}

/**
 * Props for MobileCard component
 */
export interface DataTableMobileCardProps<TData> {
  row: import('@tanstack/react-table').Row<TData>
  config?: MobileCardConfig<TData>
  columns: ColumnDef<TData, unknown>[]
  onRowClick?: (row: TData) => void
  actions?: RowAction<TData>[]
}

/**
 * Props for MobileToolbar component
 */
export interface DataTableMobileToolbarProps extends DataTableToolbarProps {
  /** Title to show in mobile toolbar */
  title?: string
}

/**
 * Props for MobilePagination component
 */
export interface DataTableMobilePaginationProps {
  pageIndex: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
}
