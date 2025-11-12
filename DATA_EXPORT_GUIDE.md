# Data Export Feature

## Overview
The Unnanu extension now supports exporting your collected data to CSV format, which can be easily imported into Google Sheets, Excel, or other spreadsheet applications.

## 🚨 Important Safety Features

### LinkedIn Tab Protection
**The extension will NOT export data if LinkedIn is open anywhere in your browser.**

This comprehensive safety feature checks:
- ✅ All tabs in the current window
- ✅ All tabs in other Chrome windows
- ✅ All variations of LinkedIn URLs (`linkedin.com`, `www.linkedin.com`, etc.)

**Before exporting, you MUST:**
1. Close **ALL** LinkedIn tabs in **ALL** Chrome windows
2. Check other browser windows if you have multiple Chrome windows open
3. Make sure no LinkedIn pages are open anywhere
4. Then click the Export button

**Quick Close Feature:**
If LinkedIn tabs are detected, you'll see a warning with a "Close All LinkedIn Tabs" button that will automatically close all LinkedIn tabs for you.

If any LinkedIn tabs are detected anywhere, you'll see this error:
```
❌ Cannot export while LinkedIn is open. Please close ALL LinkedIn tabs in ALL browser windows before exporting.
```

**Why this matters:**
- Prevents accidental data exposure
- Respects LinkedIn's terms of service
- Ensures data privacy and security
- Protects against unauthorized data collection

### Date Range Filtering
Export only the data you need by selecting a specific time period:
- **Start Date**: Export data from this date forward
- **End Date**: Export data up to this date
- **Leave blank**: Export all data (no date filter)

## Features

### For Recruiters
Export all saved LinkedIn profiles with:
- Full Name, Email, Phone
- Current Company & Job Title
- LinkedIn URL
- Skills, Education, Experience
- Location & Contact Details
- And more...

### For Job Seekers (Talent)
Export all tracked job applications with:
- Job Title & Company
- Application Date & Status
- Job URL & Description
- Salary Range & Location
- Notes & Follow-up Dates
- Resume Used
- And more...

## How to Use

### Exporting Data
1. **Close ALL LinkedIn tabs in ALL browser windows first** (Required - export will fail otherwise)
   - Check all Chrome windows - not just the current one
   - Look for any tabs with `linkedin.com` in the URL
   - The extension will block export if LinkedIn is detected anywhere
2. Open the extension popup (click the extension icon)
3. **(Optional)** Select a date range:
   - Click on "Start Date" to export from a specific date
   - Click on "End Date" to export up to a specific date
   - Leave both blank to export all data
   - Click "Clear Dates" to remove date filters
4. Click the **"📊 Export to CSV"** button
5. The CSV file will automatically download to your Downloads folder
6. File naming format: 
   - Recruiters: `LinkedIn_Profiles_Export_YYYY-MM-DD_to_YYYY-MM-DD_timestamp.csv`
   - Talent: `Job_Applications_Export_YYYY-MM-DD_to_YYYY-MM-DD_timestamp.csv`

### Example Export Scenarios

**Export all data:**
- Leave both date fields blank
- Click "Export to CSV"
- Downloads: `LinkedIn_Profiles_Export_2025-11-12.csv`

**Export last 30 days:**
- Start Date: 2025-10-13
- End Date: 2025-11-12
- Downloads: `LinkedIn_Profiles_Export_2025-10-13_to_2025-11-12_timestamp.csv`

**Export since specific date:**
- Start Date: 2025-01-01
- End Date: (leave blank)
- Downloads: `LinkedIn_Profiles_Export_2025-01-01_to_present_timestamp.csv`

### Importing to Google Sheets
1. Open Google Sheets (sheets.google.com)
2. Create a new spreadsheet or open an existing one
3. Go to **File → Import**
4. Select **Upload** tab
5. Drag and drop your CSV file or click "Select a file from your device"
6. Choose import settings:
   - Import location: Create new spreadsheet (recommended)
   - Separator type: Comma
   - Convert text to numbers: Yes
7. Click **Import data**

### Importing to Excel
1. Open Microsoft Excel
2. Go to **Data → Get Data → From File → From Text/CSV**
3. Select your downloaded CSV file
4. Click **Import**
5. Verify data preview and click **Load**

## Data Statistics

The extension shows you:
- Total records saved (profiles or applications)
- Number of exports performed
- Last export date
- For Talent: Submitted vs Pending applications

## Data Privacy

✅ **All data is stored locally** on your device  
✅ **No data is sent to external servers** (unless you choose to upload to Google Sheets)  
✅ **You have full control** over your data  
✅ **Data can be cleared** at any time from the extension settings  

## Future Features (Coming Soon)

- 🔄 Direct Google Sheets API integration (auto-sync)
- 📧 Email export option
- 📊 Advanced filtering and sorting before export
- 🔍 Search and filter within exported data
- 📅 Schedule automatic exports
- ☁️ Cloud backup options

## File Format Details

### LinkedIn Profiles CSV Columns
```
Full Name, First Name, Last Name, Headline, Location, Current Company, 
Current Title, Email, Phone, LinkedIn URL, Profile Picture URL, 
About/Summary, Total Experience (Years), Education, Skills, Languages, 
Certifications, Connections, Saved Date, Profile Source
```

### Job Applications CSV Columns
```
Job Title, Company Name, Location, Job URL, Application Date, Status, 
Submitted, Job Description, Requirements, Salary Range, Job Type, 
Remote/Hybrid/Onsite, Experience Level, Department, Source Website, 
Notes, Contact Name, Contact Email, Resume Used, Cover Letter, 
Follow Up Date, Last Updated
```

## Troubleshooting

**Q: "Cannot export while LinkedIn is open" error**  
A: You have LinkedIn open somewhere. Close ALL LinkedIn tabs in ALL Chrome windows (not just the current window). Check:
   - Main browser window
   - Any popup windows
   - Any minimized Chrome windows
   - Any LinkedIn URLs in any tab

**Q: I closed LinkedIn but still get the error**  
A: 
1. Press `Ctrl+Shift+T` (Windows) or `Cmd+Shift+T` (Mac) to see if LinkedIn was reopened
2. Check the address bar in ALL tabs - LinkedIn might be in an inactive tab
3. Close and reopen Chrome if the issue persists
4. Check Chrome's Task Manager (`Shift+Esc`) for any LinkedIn processes

**Q: Export button doesn't work**  
A: Make sure you have selected a role (Recruiter or Talent) first

**Q: "No records found in date range" error**  
A: Adjust your date range or clear the dates to export all data

**Q: Start date is after end date error**  
A: Make sure your start date is before (or the same as) your end date

**Q: CSV file shows garbled characters**  
A: Open the CSV in Google Sheets instead of Excel, or ensure Excel is using UTF-8 encoding

**Q: No data to export**  
A: You need to save some LinkedIn profiles (Recruiters) or job applications (Talent) first

**Q: Where is the file saved?**  
A: Check your browser's default Downloads folder

## Support

For issues or feature requests, please contact: support@unnanu.com
