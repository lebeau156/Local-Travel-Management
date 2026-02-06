# USDA Travel Mileage Tracker - Complete System

A comprehensive travel reimbursement management system for USDA inspectors, supervisors, and fleet managers.

## 🚀 Features Overview

### Inspector Features
- ✅ Add/Edit/Delete trips with addresses, plant names, and purposes
- ✅ Automatic mileage calculation (Google Maps API integration)
- ✅ Track expenses (lodging, meals, other)
- ✅ Generate monthly vouchers (AD-616 form)
- ✅ Submit vouchers for approval
- ✅ Download vouchers as PDF or Excel
- ✅ Export trips to Excel/CSV
- ✅ Bulk trip operations (select & delete multiple)
- ✅ Advanced filtering by date, location, purpose
- ✅ Mobile-responsive design with card views
- ✅ Personal activity audit log
- ✅ Dashboard with 6-month trend visualization

### Supervisor Features
- ✅ Review and approve/reject vouchers from inspectors
- ✅ View pending approvals with detailed breakdown
- ✅ Team activity monitoring (audit logs)
- ✅ Dashboard showing pending workload and team stats
- ✅ Quick approval workflow from dashboard
- ✅ View all vouchers with filtering

### Fleet Manager Features
- ✅ Final approval for vouchers (after supervisor approval)
- ✅ Fleet-wide analytics and reporting
- ✅ 6-month reimbursement trend visualization
- ✅ Total mileage and cost tracking
- ✅ Inspector activity monitoring
- ✅ Comprehensive dashboard with KPIs

### System-Wide Features
- ✅ Role-based access control (Inspector, Supervisor, Fleet Manager, Admin)
- ✅ Audit trail for all actions (WHO, WHAT, WHEN, WHERE)
- ✅ JWT authentication with secure token management
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Real-time data updates
- ✅ PDF generation for official forms
- ✅ Excel/CSV export for reporting

## 📋 Technology Stack

### Backend
- **Runtime**: Node.js v24.13.0
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT (jsonwebtoken)
- **PDF Generation**: PDFKit
- **Excel Export**: ExcelJS
- **API Integration**: Google Maps Distance Matrix API

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 7.3.1
- **Routing**: React Router v7.12.0
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v24.13.0 or higher
- npm or yarn
- (Optional) Google Maps API key for accurate mileage

### Backend Setup

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# (Optional) Configure Google Maps API
# Create a .env file and add:
# GOOGLE_MAPS_API_KEY=your_key_here
# See GOOGLE_MAPS_SETUP.md for detailed instructions

# Start backend server
node src/server.js
```

Backend will run on: **http://localhost:5000**

### Frontend Setup

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:5173**

## 👥 Default User Accounts

The system comes with pre-configured test accounts:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Inspector | inspector@usda.gov | Test123! | Log trips, create vouchers |
| Supervisor | supervisor@usda.gov | Test123! | Approve inspector vouchers |
| Fleet Manager | fleetmgr@usda.gov | Test123! | Final voucher approval |
| Admin | admin@usda.gov | Admin123! | System administration |

## 📱 Role-Specific Dashboards

### Inspector Dashboard (Blue Theme)
**Purpose**: Personal trip and voucher management

**Features**:
- Current month stats (trips, miles, amount)
- Pending vouchers count
- 6-month travel trend chart
- Quick action buttons (Add Trip, View Trips, Vouchers)
- Recent trips list with edit capability
- Today's trip indicator

**Key Metrics**:
- This Month: Trip count
- Total Miles: Current month mileage
- Est. Amount: Expected reimbursement
- Pending: Draft/submitted vouchers

### Supervisor Dashboard (Purple Theme)
**Purpose**: Team voucher approval and monitoring

**Features**:
- Pending approvals with one-click approve/reject
- Team activity feed from audit logs
- Approved vouchers this month
- Total inspectors count
- Pending amount total
- Detailed voucher cards with trip breakdown

**Workflow**:
1. Inspector submits voucher
2. Appears in Supervisor's "Pending Approvals"
3. Supervisor reviews details
4. Approves (→ Fleet Manager) or Rejects (→ back to Inspector)

### Fleet Manager Dashboard (Indigo Theme)
**Purpose**: Fleet-wide oversight and final approvals

**Features**:
- Fleet-wide KPIs (vouchers approved, total miles, avg voucher amount)
- 6-month reimbursement trend chart
- Final approval workflow for supervisor-approved vouchers
- Total paid this month
- Active inspectors count
- Detailed voucher breakdown (mileage + expenses)

**Workflow**:
1. Voucher approved by Supervisor
2. Appears in Fleet Manager's "Awaiting Final Approval"
3. Fleet Manager reviews
4. Final Approve (→ Ready for payment) or Reject

## 🔐 Security Features

### Authentication
- JWT tokens with expiration
- Secure password hashing (bcrypt)
- Token refresh on page reload
- Protected API routes

### Authorization
- Role-based access control
- Route-level permissions
- API endpoint restrictions
- User-scoped data access

### Audit Trail
- All actions logged (CREATE, UPDATE, DELETE, APPROVE, REJECT)
- User identification
- IP address tracking
- Timestamp recording
- Immutable log entries

## 📊 Key Workflows

### 1. Trip Entry & Voucher Creation

```
Inspector adds trip
  ↓
System calculates mileage (Google Maps API or mock)
  ↓
Inspector adds expenses (lodging, meals, other)
  ↓
End of month: Inspector creates voucher
  ↓
System groups all trips for that month
  ↓
Calculates totals (mileage + expenses)
  ↓
Inspector submits voucher
```

### 2. Approval Workflow

```
Draft → Submitted → Supervisor Approved → Fleet Approved → Paid
  ↓         ↓              ↓                    ↓
  Edit    Pending     Pending Fleet        Ready for
          Supervisor    Approval             Payment
```

### 3. Rejection Flow

```
Submitted Voucher
  ↓
Supervisor/Fleet Manager rejects with reason
  ↓
Status: Rejected
  ↓
Inspector can view rejection reason
  ↓
Inspector can reopen for editing
  ↓
Make corrections
  ↓
Resubmit
```

## 📄 Export Formats

### PDF (AD-616 Official Form)
- **Purpose**: Official USDA Form AD-616 for payment processing
- **Sections**:
  - Section A: Employee Information
  - Section B: Claim Period
  - Section C: Purpose of Travel
  - Section D: Expense Summary (mileage + expenses)
  - Section E: Certification Statement
  - Section F: Approval Signatures
  - Section G: Detailed Trip Breakdown Table
- **Columns**: Date | From | To | Plant | Purpose | Miles | Value($) | Expenses | Total
- **Filename**: `AD-616_MonthName_YEAR.pdf`

### Excel Export
**Trips Export**:
- All trip data in spreadsheet format
- Formatted headers and currency columns
- Total rows with SUM formulas
- **Filename**: `trips_YYYY-MM-DD.xlsx`

**Voucher Export**:
- Complete voucher details
- Trip listing with calculations
- Grand totals
- **Filename**: `voucher_MonthName_YEAR.xlsx`

### CSV Export (Trips)
- Plain text format for data interchange
- Compatible with Excel, Google Sheets
- **Filename**: `trips_YYYY-MM-DD.csv`

## 🗃️ Database Schema

### Key Tables
- **users**: Authentication and roles
- **profiles**: User details (name, SSN, phone, address, mileage rate)
- **trips**: Trip records (date, from/to, miles, expenses)
- **vouchers**: Monthly reimbursement claims
- **audit_log**: Action tracking (user, action, resource, details, IP, timestamp)

### Relationships
```
users (1) ←→ (many) trips
users (1) ←→ (many) vouchers
users (1) ← (1) profiles
vouchers (1) ←→ (many) trips (via month/year matching)
```

## 🔍 Audit Logging

### What Gets Logged

| Action | Details Captured |
|--------|------------------|
| CREATE_TRIP | from, to, miles |
| UPDATE_TRIP | from, to, miles |
| DELETE_TRIP | from, to, miles |
| CREATE_VOUCHER | month, year, tripCount, totalMiles, totalAmount |
| SUBMIT_VOUCHER | status change, totalAmount |
| APPROVE_VOUCHER_SUPERVISOR | approver, voucherDetails |
| APPROVE_VOUCHER_FLEET | approver, voucherDetails |
| REJECT_VOUCHER | rejector, reason |
| REOPEN_VOUCHER | status transition |
| DELETE_VOUCHER | voucherDetails |
| EXPORT_TRIPS_EXCEL/CSV | recordCount |
| EXPORT_VOUCHER_EXCEL | voucherId, month, year |

### Audit Log Features
- Filter by action type
- Filter by entity type (trip/voucher)
- Filter by date range
- Pagination (50 records per page)
- Color-coded action badges
- IP address display
- User name display
- JSON details display

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md/lg)
- **Desktop**: > 1024px

### Mobile Features
- Card-based layout for trips/vouchers (instead of tables)
- Collapsible filter sections
- Touch-friendly buttons (minimum 44px)
- Responsive navigation sidebar
- Optimized dashboard layouts
- Horizontal scrolling for wide tables

## 🌐 Google Maps API Integration

### Setup Instructions
See **GOOGLE_MAPS_SETUP.md** for complete guide.

### Quick Start
1. Get API key from Google Cloud Console
2. Create `backend/.env` file
3. Add: `GOOGLE_MAPS_API_KEY=your_key_here`
4. Restart backend server

### Fallback Behavior
- Without API key: Uses random mock mileage (10-60 miles)
- With API key: Calculates real driving distance

### Cost
- $0.005 per request
- $200 FREE credit monthly
- Typical usage: ~100 trips/month = ~$0.50/month

## 🐛 Troubleshooting

### Export Fails with "Access token required"
**Fixed**: Export now uses authenticated Axios requests instead of `window.open()`

### Voucher Filter "Approved" shows nothing
**Fixed**: Changed filter value from `fleet_approved` to `approved` to match database

### PDF table totals don't match
**Fixed**: Redesigned table with 4 columns (Miles, Value($), Expenses, Total) for clarity

### IP Address not showing in Audit Log
**Fixed**: Changed text color from light gray to darker gray, added monospace font

## 🚀 Deployment Recommendations

### Production Setup
1. **Environment Variables**:
   - Set `JWT_SECRET` to secure random string
   - Add `GOOGLE_MAPS_API_KEY`
   - Set `PORT` if needed (default: 5000)

2. **Database**:
   - SQLite is suitable for small-medium deployments
   - For large scale: consider PostgreSQL migration
   - Regular backups recommended

3. **Frontend Build**:
   ```powershell
   cd frontend
   npm run build
   # Serve dist/ folder with nginx or similar
   ```

4. **Backend Process Manager**:
   ```powershell
   npm install -g pm2
   pm2 start backend/src/server.js --name usda-tracker
   pm2 startup
   pm2 save
   ```

### Security Checklist
- ✅ Change default passwords
- ✅ Set strong JWT_SECRET
- ✅ Restrict Google Maps API key by IP
- ✅ Enable HTTPS (reverse proxy)
- ✅ Set up firewall rules
- ✅ Regular security updates
- ✅ Database backups
- ✅ Log rotation

## 📚 Additional Documentation

- **GOOGLE_MAPS_SETUP.md**: Complete Google Maps API setup guide
- **AUDIT_LOGGING_EXPLAINED.md**: Detailed audit logging documentation
- **backend/env.example**: Environment variable template

## 🎯 Future Enhancements (Optional)

- Email notifications for voucher approvals/rejections
- Advanced reporting dashboard with charts
- Bulk voucher operations
- Historical data comparison
- Mobile app (React Native)
- Integration with payment systems
- Multi-language support

## 📞 Support

For issues or questions:
1. Check this README
2. Review GOOGLE_MAPS_SETUP.md for API issues
3. Check audit logs for debugging
4. Review browser console for errors

## 📝 License

USDA Internal Use Only

---

**Version**: 2.0.0  
**Last Updated**: January 15, 2026  
**Status**: Production Ready ✅
