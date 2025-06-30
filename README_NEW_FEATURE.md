# All Medicines & Stock Feature

## Overview
A new page has been added to the Med-App UI that provides a comprehensive view of all medicines and their stock batches. This page is accessible only to users with Admin role.

## Features

### Access Control
- **Admin Only**: This page is protected and only accessible to users with Admin role
- **Route Protection**: Uses the existing `ProtectedRoute` component with `requireAdmin={true}`

### Page Location
- **URL**: `/all-medicines-stock`
- **Navigation**: Available in the sidebar menu for Admin users
- **Icon**: Uses `MedicationIcon` to distinguish from other inventory pages

### Functionality

#### Summary Dashboard
- **Total Medicines**: Count of all medicines in the system
- **Total Stock**: Sum of all available quantities across all batches
- **Total Value**: Total monetary value of all stock
- **Showing**: Number of medicines currently displayed after filtering

#### Search and Filtering
- **Search**: Real-time search through medicine names
- **Status Filter**: Filter by Active/Inactive medicines
- **Refresh**: Manual refresh button to reload data
- **Export**: Download current filtered data as CSV

#### Data Table
- **Expandable Rows**: Click to expand and see individual stock batches
- **Medicine Information**: Name, status (Active/Inactive), total stock, total value, batch count
- **Batch Details**: When expanded, shows:
  - Expiry date
  - Available quantity
  - Price per unit
  - Total batch value
  - Expiry status (Valid/Expiring Soon/Expired)

#### Pagination
- **Configurable**: 5, 10, 25, or 50 items per page
- **Navigation**: Previous/Next page controls

### Data Source
The page uses the existing `/api/medicines/flat-export` endpoint which returns:
```typescript
interface MedicineStockData {
  name: string;
  enabled: boolean;
  expDate: string;
  availableQty: number;
  price: number;
}
```

### Technical Implementation

#### Component Structure
- **Main Component**: `AllMedicinesStock.tsx`
- **Row Component**: Nested component for expandable table rows
- **Data Processing**: Groups flat data by medicine name and calculates totals

#### Key Features
- **Responsive Design**: Adapts to mobile and desktop screens
- **Real-time Filtering**: Instant search and filter results
- **Visual Feedback**: Color-coded expiry status chips
- **Currency Formatting**: Uses Indian currency format
- **Date Formatting**: Consistent date display format

#### Styling
- **Material-UI**: Consistent with existing app design
- **Theme Integration**: Uses app's theme colors and spacing
- **Hover Effects**: Visual feedback on row interactions
- **Expand/Collapse**: Smooth animations for row expansion

### Usage Instructions

1. **Access**: Login as Admin user and navigate to "All Medicines & Stock" from the sidebar
2. **Search**: Use the search box to find specific medicines
3. **Filter**: Use the status dropdown to show only Active or Inactive medicines
4. **Expand**: Click the arrow icon next to any medicine to see its stock batches
5. **Export**: Click "Export CSV" to download the current filtered data
6. **Refresh**: Click "Refresh" to reload data from the server

### Security
- **Role-based Access**: Only Admin users can access this page
- **API Protection**: Backend endpoint is protected with `@PreAuthorize("hasRole('ADMIN')")`
- **Route Protection**: Frontend route is protected with `requireAdmin={true}`

### Future Enhancements
- **Sorting**: Add column sorting functionality
- **Advanced Filters**: Filter by expiry date ranges, price ranges
- **Bulk Actions**: Enable bulk operations on selected medicines
- **Real-time Updates**: WebSocket integration for live data updates
- **Print Functionality**: Add print-friendly view
- **Email Export**: Send reports via email

## Files Modified/Created

### New Files
- `med-app-ui/src/pages/AllMedicinesStock.tsx` - Main component

### Modified Files
- `med-app-ui/src/routes.tsx` - Added new route
- `med-app-ui/src/components/Layout.tsx` - Added menu item

### Existing API Used
- `medicineApi.getFlatExport()` - Fetches all medicines and stock data 