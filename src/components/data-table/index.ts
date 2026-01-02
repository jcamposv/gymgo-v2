// Main component (auto-switches between desktop and mobile)
export { DataTable } from './components'

// Desktop components
export {
  DataTableDesktop,
  DataTableToolbar,
  DataTablePagination,
  DataTableSimplePagination,
  DataTableSearch,
  DataTableFilter,
  DataTableFilters,
  DataTableActions,
  DataTableRowActions,
  DataTableColumnHeader,
  DataTableSortableHeader,
  DataTableEmpty,
  DataTableNoResults,
  DataTableLoading,
  DataTableSpinner,
  StatusBadge,
  AutoStatusBadge,
  getStatusVariant,
} from './components'

// Mobile components
export {
  DataTableMobileCards,
  DataTableMobileCard,
  DataTableMobileToolbar,
  DataTableMobilePagination,
} from './components'

// Hooks
export { useDataTable, useTableUrlState } from './hooks'

// Types
export type {
  // Core types
  PaginationMode,
  TableQuery,
  PaginationInfo,
  FilterType,
  FilterOption,
  FilterConfig,
  DateRangeValue,
  ActionConfig,
  RowAction,
  DataTableProps,
  // Hook types
  UseDataTableOptions,
  UseDataTableReturn,
  UseTableUrlStateOptions,
  UseTableUrlStateReturn,
  // Component props types
  DataTableToolbarProps,
  DataTablePaginationProps,
  DataTableSearchProps,
  DataTableFilterProps,
  DataTableActionsProps,
  DataTableColumnHeaderProps,
  DataTableEmptyProps,
  DataTableLoadingProps,
  StatusVariant,
  StatusBadgeProps,
  // Mobile types
  MobileCardField,
  MobileCardConfig,
  MobileCardRenderProps,
  DataTableMobileProps,
  DataTableMobileCardProps,
  DataTableMobileToolbarProps,
  DataTableMobilePaginationProps,
} from './types'
