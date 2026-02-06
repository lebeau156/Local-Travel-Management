# 📋 Quick Start Guide: Bulk Import Team Members

## Visual Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Team Management Page                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [📄 Download Template]  [📤 Bulk Import]  [📥 Export]  ...  │
│     (Purple Button)       (Orange Button)   (Green)          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Instructions

### STEP 1: Download Template
Click the **purple** button labeled **"📄 Download Template"**

📥 **Downloads**: `team-import-template.csv`

---

### STEP 2: Open & Edit CSV
Open the downloaded CSV in Excel or text editor:

```csv
Num,Last Name,First Name,Middle Name,Position Title,EOD,Email,State,Circuit,Phone,Employee ID
1,PENG,LAMBERT,XIAOYI,CSI,1/12/2025,lambert.peng@usda.gov,New York,NY-01,555-0101,EMP001
2,RAINERO JR,RONALD,ANTHONY,CSI,10/20/2024,ronald.rainero@usda.gov,New York,NY-01,555-0102,EMP002
...
```

**Template already includes 20 inspectors from your Excel screenshot!**

✏️ **Edit as needed**: Change emails, names, dates, etc.

---

### STEP 3: Upload CSV
Click the **orange** button labeled **"📤 Bulk Import"**

📤 **Modal Opens** with 3-step wizard:

```
┌───────────────────────────────────────────────┐
│         Bulk Import Team Members              │
├───────────────────────────────────────────────┤
│                                               │
│  Step 1: Download Template                   │
│    [📄 Download CSV Template]                │
│                                               │
│  Step 2: Fill the Template                   │
│    • Required columns: First/Last Name, Email│
│    • Optional: EOD, Position, State, etc.    │
│    • Default password: Test123!              │
│                                               │
│  Step 3: Upload File                         │
│    [Choose File] team-import-template.csv    │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ Preview (First 5 Rows)                  │ │
│  ├─────────────────────────────────────────┤ │
│  │ LAMBERT PENG | CSI | 1/12/2025 | ...   │ │
│  │ RONALD RAINERO JR | CSI | 10/20/2024..│ │
│  │ DELORIA FIGUEROA | CSI | 3/10/2024... │ │
│  │ ...                                     │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│    [Close]          [Import 20 Members]      │
│                                               │
└───────────────────────────────────────────────┘
```

---

### STEP 4: Review Preview
The modal shows a **preview** of the first 5 rows.

✅ **Verify**:
- Names look correct
- Emails are valid
- Dates are formatted properly
- Position titles are correct

---

### STEP 5: Import
Click **"Import X Members"** button (X = number of rows in CSV)

⏳ **Processing...**

---

### STEP 6: View Results

```
┌───────────────────────────────────────────────┐
│  Import Results                               │
├───────────────────────────────────────────────┤
│  Total: 20                                    │
│  ✓ Success: 20                                │
│  ✗ Errors: 0                                  │
│  Default Password: Test123!                   │
│                                               │
│  Successfully imported:                       │
│    ✓ LAMBERT PENG (lambert.peng@usda.gov)    │
│    ✓ RONALD RAINERO JR (ronald.rainero@...)  │
│    ✓ DELORIA FIGUEROA (deloria.figueroa@...) │
│    ... (17 more)                              │
│                                               │
└───────────────────────────────────────────────┘
```

🎉 **Done!** All team members are now in the system.

---

## What Happens After Import?

### For Each Imported Member:
1. ✅ **User account created** with email & password (`Test123!`)
2. ✅ **Profile created** with name, position, EOD date, etc.
3. ✅ **Assigned to you** as their supervisor
4. ✅ **Seniority calculated** from EOD (Entry on Duty) date
5. ✅ **Can login immediately** at http://localhost:5173

### Seniority Ranking
The system uses the **EOD (hire date)** to calculate seniority:
- **Oldest hire date** = Most seniority
- **Newest hire date** = Least seniority

Example from your data:
```
1. PHELAN (11/27/1983)     ← 41 years
2. JALLAH (7/3/1988)       ← 36 years
3. RIVERA (9/25/1988)      ← 36 years
...
20. PENG (1/12/2025)       ← 0 years
```

---

## Testing the Import

### Quick Test (5 members):
1. Delete rows 7-21 from the CSV (keep only first 5 inspectors)
2. Import the shortened CSV
3. Verify 5 members appear in team roster

### Full Import (20 members):
1. Use the template as-is (all 20 inspectors included)
2. Import the full CSV
3. Verify all 20 members appear with correct EOD dates

---

## Troubleshooting

### Error: "User with this email already exists"
- **Cause**: Email is already in the system
- **Fix**: Change the email in the CSV or delete the existing user

### Error: "Missing required fields"
- **Cause**: First Name, Last Name, or Email is empty
- **Fix**: Fill in all required fields in the CSV

### Preview shows wrong data
- **Cause**: CSV format is incorrect (extra commas, quotes, etc.)
- **Fix**: Ensure CSV has exactly 11 columns, no extra separators

### Import button is disabled
- **Cause**: No file uploaded or preview failed
- **Fix**: Re-upload the CSV file

---

## Important Notes

⚠️ **Default Password**: All imported users get password `Test123!`
   - Users should change it on first login
   - Same password for all imported users (by design)

⚠️ **Email Uniqueness**: Each email must be unique across the system
   - No duplicates allowed
   - Use format: `firstname.lastname@usda.gov`

⚠️ **Supervisor Assignment**: All imported users are assigned to YOU (logged-in supervisor)
   - They will appear in your team roster
   - You can approve their vouchers

⚠️ **EOD Date Format**: Flexible formats accepted
   - `1/15/2024` ✅
   - `01/15/2024` ✅
   - `1/15/24` ✅
   - Any JavaScript-parseable date

---

## Current Status

✅ **Backend**: Fully functional and tested
✅ **API**: Working with 5-member import
✅ **Template**: Pre-filled with your 20 inspectors
✅ **Servers**: Running and ready

🟡 **Frontend UI**: Ready for testing (by you)

---

## What to Test

- [ ] Download template button works
- [ ] CSV file downloads correctly
- [ ] Bulk Import button opens modal
- [ ] File upload shows preview
- [ ] Import button processes all members
- [ ] Results show success/error counts
- [ ] Team roster updates with new members
- [ ] New members can login with Test123!
- [ ] Seniority is calculated from EOD dates

---

**Ready to test!** 🚀

Login at: http://localhost:5173
User: `fls@usda.gov`
Password: `Test123!`
