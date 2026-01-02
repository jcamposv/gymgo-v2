// Main component (auto-switches between desktop and mobile)
export { DataTable } from './data-table'

// Desktop components
export { DataTableDesktop } from './data-table-desktop'
export { DataTableToolbar } from './data-table-toolbar'
export { DataTablePagination, DataTableSimplePagination } from './data-table-pagination'
export { DataTableSearch } from './data-table-search'
export { DataTableFilter, DataTableFilters } from './data-table-filter'
export { DataTableActions, DataTableRowActions } from './data-table-actions'
export { DataTableColumnHeader, DataTableSortableHeader } from './data-table-column-header'
export {
  DataTableEmpty,
  DataTableNoResults,
  DataTableLoading,
  DataTableSpinner,
} from './data-table-states'
export { StatusBadge, AutoStatusBadge, getStatusVariant } from './status-badge'

// Mobile components
export {
  DataTableMobileCards,
  DataTableMobileCard,
  DataTableMobileToolbar,
  DataTableMobilePagination,
} from './mobile'
