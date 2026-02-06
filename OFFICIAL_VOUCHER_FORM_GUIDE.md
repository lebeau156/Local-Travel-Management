# Official USDA Travel Voucher Form (AD-616) - Implementation Guide

## Overview

We've implemented a pixel-perfect replica of the official **USDA Travel Voucher Form AD-616** (2-page form) that can be generated directly from the system and printed or saved as PDF.

## Features

### ✅ What's Included

1. **Page 1 - Main Travel Voucher**
   - Section A: Identification (employee info, travel dates, claim type)
   - Section B: Mailing Address Options
   - Section C: Transportation Costs (mileage tracking)
   - Section D: Claims Summary (per diem, subsistence)
   - Section E: Accounting Classification
   - Section F: Certifications (signatures, fraud warning)

2. **Page 2 - Schedule of Expenses**
   - Section G: Detailed Itinerary
   - Daily expense breakdown
   - Mileage calculations
   - Parking, tolls, transportation
   - Meal and lodging details
   - Privacy Act notice

### ✅ Auto-Populated Fields

The form automatically fills in:
- **Employee information** (name, ID, email)
- **Travel period** (month/year from voucher)
- **Total mileage** from all trips
- **Mileage reimbursement** ($0.67/mile current rate)
- **Per diem days** and amounts
- **Lodging costs** total
- **Meals costs** total
- **Other expenses** (parking, tolls, etc.)
- **Total claim amount** (automatic calculation)
- **Trip itineraries** (from/to addresses, dates, times)

### ✅ Manual Fields

Fields left blank for manual completion:
- Travel authorization number
- Agency originating office number
- Official duty station
- Training document number (if applicable)
- Traveler signature and date
- Approving official signature and date
- Distributed accounting codes

## How to Use

### 1. Access the Official Voucher

1. Navigate to any **Voucher Detail** page
2. Click the purple **"📋 Official Voucher"** button (next to Excel and PDF buttons)
3. The official form will open in a modal overlay

### 2. Review the Form

The form displays:
- **2 pages** in official USDA format
- **Pre-filled data** from your trips and voucher
- **Accurate calculations** (mileage × rate, totals)
- **Professional layout** matching the government form exactly

### 3. Print or Save as PDF

1. Click the blue **"🖨️ Print/Save as PDF"** button at the top
2. In the print dialog:
   - **To print**: Select your printer and click Print
   - **To save as PDF**: Choose "Save as PDF" or "Microsoft Print to PDF" as destination
3. The printed/saved document will be formatted perfectly for official submission

### 4. Close the Form

Click the red **"✕ Close"** button to return to the voucher detail page

## Technical Implementation

### Components

**`frontend/src/components/OfficialVoucherForm.tsx`**
- React component that renders the 2-page form
- Props: `voucherData`, `onClose`
- Automatic data mapping and calculations

**`frontend/src/components/OfficialVoucherForm.css`**
- Pixel-perfect styling matching official USDA form
- Print-optimized CSS with `@media print` rules
- Letter size (8.5" × 11") page formatting

### Integration Points

**`frontend/src/pages/VoucherDetail.tsx`**
- New button: "📋 Official Voucher"
- State: `showOfficialForm` (boolean)
- Renders `<OfficialVoucherForm>` when button clicked

### Data Flow

```
Voucher Data (from API)
    ↓
VoucherDetail Component
    ↓
OfficialVoucherForm Component
    ↓
Auto-populate fields + calculations
    ↓
Print/PDF Output
```

## Form Sections Breakdown

### Page 1

#### Section A - Identification
- **Purpose**: Basic employee and travel information
- **Auto-filled**: Name, ID, dates, agency (USDA)
- **Manual**: Authorization number, office numbers, duty station

#### Section B - Mailing Address
- **Purpose**: Where to send the check/deposit
- **Auto-filled**: Email address
- **Manual**: Physical mailing address if different

#### Section C - Transportation Costs
- **Purpose**: Track all transportation used
- **Auto-filled**: POV (Privately Owned Vehicle) mileage total
- **Manual**: Other transportation methods (rental car, etc.)

#### Section D - Claims
- **Purpose**: Summary of all expense claims
- **Auto-filled**:
  - Mileage: Total miles × $0.67/mile
  - Per diem: Total from meals + lodging
  - Parking/tolls: Other expenses total
  - **Total Claim**: Sum of all above
  - **Net to Traveler**: Total claim amount

#### Section E - Accounting Classification
- **Purpose**: Budget coding for payment processing
- **Manual**: Accounting codes, distributed accounting details

#### Section F - Certifications
- **Purpose**: Legal certification and approval
- **Auto-filled**: Fraud warning text
- **Manual**: Traveler and approving official signatures/dates

### Page 2 - Schedule of Expenses

#### Section G - Detailed Itinerary
- **Auto-filled**:
  - Each trip's from/to locations
  - Dates and times
  - Cities and states
  - Number of per diem days

#### Expense Details Tables
- **Auto-filled**:
  - Total miles per trip
  - Mileage rate ($0.67)
  - Mileage reimbursement amounts
  - Parking/tolls total
  - All expense totals

## Calculations

### Automatic Calculations

1. **Mileage Reimbursement**:
   ```
   Total Miles × Current Rate ($0.67) = Mileage Amount
   ```

2. **Per Diem Total**:
   ```
   Lodging + Meals = Per Diem Amount
   ```

3. **Total Claim**:
   ```
   Mileage + Per Diem + Parking/Tolls + Other = Total Claim
   ```

4. **Net to Traveler**:
   ```
   Total Claim - Outstanding Bills - Advances = Net Amount
   ```

### Current Rates (2026)

- **POV Mileage**: $0.67 per mile
- **Per Diem**: Varies by location (pulled from trip data)

## Print Specifications

### Print Settings

- **Paper Size**: Letter (8.5" × 11")
- **Orientation**: Portrait
- **Margins**: 0.5 inches all sides
- **Color**: Black and white recommended
- **Quality**: Normal (government forms don't require high quality)

### Print Features

- **Page Breaks**: Automatic between Page 1 and Page 2
- **Headers/Footers**: Removed for clean output
- **Form Fields**: Preserved for manual completion
- **Signatures**: Blank signature lines for wet signatures

## Browser Compatibility

### Tested Browsers

✅ **Chrome/Edge** - Perfect rendering and print  
✅ **Firefox** - Perfect rendering and print  
✅ **Safari** - Good rendering, minor print variations  

### Print to PDF Options

1. **Chrome/Edge**: Built-in "Save as PDF"
2. **Windows**: "Microsoft Print to PDF"
3. **macOS**: "Save as PDF" in print dialog
4. **Linux**: cups-pdf or similar

## Workflow Examples

### Example 1: Monthly Voucher Submission

1. Inspector creates trips throughout the month
2. System auto-generates voucher at month-end
3. Inspector reviews voucher details
4. Inspector clicks "📋 Official Voucher"
5. Inspector reviews pre-filled data
6. Inspector prints form
7. Inspector manually adds:
   - Signatures
   - Accounting codes (from supervisor)
8. Inspector submits physical form to finance

### Example 2: Digital Submission

1. Inspector generates official voucher
2. Inspector saves as PDF
3. Inspector digitally signs PDF (if allowed)
4. Inspector emails PDF to supervisor
5. Supervisor reviews and approves digitally
6. Supervisor forwards to finance

## Future Enhancements

### Potential Improvements

1. **Digital Signatures**: Add signature pad for electronic signing
2. **Accounting Codes**: Pre-populate from user profile/settings
3. **Office Numbers**: Store in user profile
4. **Duty Station**: Store in user profile
5. **Batch Generation**: Generate vouchers for multiple months
6. **Email Integration**: Send PDF directly to supervisor/finance
7. **QR Code**: Add QR code linking to digital voucher in system

## Compliance Notes

### Official Use

- This form replicates the **official USDA Form AD-616 (2-83)(Rev. 11/96)**
- Format matches government specifications
- All required sections included
- Fraud warning text included as required
- Privacy Act notice included

### Legal Disclaimers

⚠️ **Important**:
- Verify with your finance office that printed forms are acceptable
- Some agencies may require original forms or specific versions
- Digital/scanned submissions may need prior approval
- Wet signatures may be required (not digital)
- Check current regulations for your agency

## Troubleshooting

### Issue: Form doesn't print correctly

**Solution**: 
- Use Chrome or Edge for best results
- Disable "Headers and footers" in print settings
- Set margins to 0.5 inches
- Ensure paper size is Letter (8.5" × 11")

### Issue: Data missing or incorrect

**Solution**:
- Verify trips have all required fields (dates, addresses, mileage)
- Check that voucher has been generated (not in draft)
- Refresh the voucher detail page
- Re-calculate mileage for old trips if needed

### Issue: PDF doesn't save

**Solution**:
- Try different browser
- Update browser to latest version
- Use "Print to PDF" instead of "Save as PDF"
- Check disk space

### Issue: Signature lines don't appear

**Solution**:
- Signature lines are intentionally blank for wet signatures
- Print and sign manually, or
- Use PDF editor to add digital signature after saving

## Summary

The Official USDA Travel Voucher form feature provides:

✅ **Exact replica** of government Form AD-616  
✅ **Auto-populated** with trip and voucher data  
✅ **Print-ready** for official submission  
✅ **PDF-savable** for digital workflows  
✅ **Professional formatting** matching official specifications  
✅ **Easy to use** - one click to generate  

This eliminates manual form filling and ensures accuracy in reimbursement claims while maintaining compliance with government requirements.
