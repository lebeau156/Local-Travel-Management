import React, { useState } from 'react';
import './OfficialVoucherForm.css';

interface Trip {
  id: number;
  date: string;
  from_address: string;
  to_address: string;
  site_name?: string;
  purpose?: string;
  miles_calculated: number;
  lodging_cost?: number;
  meals_cost?: number;
  per_diem_days?: number;
  other_expenses?: number;
  expense_notes?: string;
  departure_time?: string;
  return_time?: string;
}

interface VoucherData {
  month: number;
  year: number;
  trips: Trip[];
  profile: {
    name?: string;
    employee_id?: string;
    email?: string;
  };
  total_miles: number;
  total_amount: number;
  total_lodging?: number;
  total_meals?: number;
  total_other?: number;
}

interface Props {
  voucherData: VoucherData;
  onClose: () => void;
}

export default function OfficialVoucherForm({ voucherData, onClose }: Props) {
  // State for checkboxes in Section E
  const [authAccounting, setAuthAccounting] = useState(false);
  const [distAccounting, setDistAccounting] = useState(false);
  
  // State for Section F - Final Voucher Indicator
  const [finalVoucherYes, setFinalVoucherYes] = useState(false);
  const [finalVoucherNo, setFinalVoucherNo] = useState(false);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Calculate first and last day of the month for travel period
  const firstDay = new Date(voucherData.year, voucherData.month - 1, 1);
  const lastDay = new Date(voucherData.year, voucherData.month, 0);
  
  // Calculate mileage reimbursement (current rate $0.67/mile)
  const mileageRate = 0.67;
  const mileageAmount = voucherData.total_miles * mileageRate;
  
  // Total claim
  const totalClaim = mileageAmount + (voucherData.total_lodging || 0) + 
                     (voucherData.total_meals || 0) + (voucherData.total_other || 0);

  // Count nights with lodging
  const nightsLodging = voucherData.trips.filter(t => (t.lodging_cost || 0) > 0).length;

  // Group trips by week for Section G
  const groupTripsByWeek = () => {
    const weeks: Array<{
      startDate: Date;
      endDate: Date;
      trips: Trip[];
      totalMiles: number;
      city: string;
      state: string;
    }> = [];

    // Get all trip dates and sort them
    const sortedTrips = [...voucherData.trips].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sortedTrips.length === 0) return weeks;

    // Start from the first trip's date
    let currentWeekStart = new Date(sortedTrips[0].date);
    // Set to beginning of week (Sunday)
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    
    // Process trips week by week through the month
    const monthEnd = new Date(voucherData.year, voucherData.month, 0);
    
    while (currentWeekStart <= monthEnd) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Saturday
      
      // Get trips for this week
      const weekTrips = sortedTrips.filter(trip => {
        const tripDate = new Date(trip.date);
        return tripDate >= currentWeekStart && tripDate <= weekEnd;
      });

      if (weekTrips.length > 0) {
        // Calculate total miles for the week
        const totalMiles = weekTrips.reduce((sum, trip) => sum + trip.miles_calculated, 0);
        
        // Get most common city/state from this week's trips
        const locations = weekTrips.map(trip => {
          const parts = trip.to_address?.split(',') || [];
          return {
            city: parts[0]?.trim() || '',
            state: parts[1]?.trim().split(' ')[0] || ''
          };
        });
        
        // Use first location (or could use most frequent)
        const city = locations[0]?.city || '';
        const state = locations[0]?.state || '';

        weeks.push({
          startDate: new Date(currentWeekStart),
          endDate: new Date(weekEnd),
          trips: weekTrips,
          totalMiles,
          city,
          state
        });
      }

      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return weeks;
  };

  const weeklyData = groupTripsByWeek();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="voucher-overlay">
      <div className="voucher-controls no-print">
        <button onClick={handlePrint} className="btn-print">
          🖨️ Print/Save as PDF
        </button>
        <button onClick={onClose} className="btn-close">
          ✕ Close
        </button>
      </div>

      {/* PAGE 1 - Main Voucher */}
      <div className="voucher-page page-1">
        <div className="form-title">TRAVEL VOUCHER (Temporary Duty Travel)</div>
        
        {/* Section A - Identification */}
        <div className="section section-a">
          <div className="section-header">SECTION A – IDENTIFICATION</div>
          
          {/* Row 1: Travel Auth, SSN, Name, Agency */}
          <table className="section-table">
            <tbody>
              <tr>
                <td className="field-cell" style={{ width: '15%' }}>
                  <div className="field-label">1. TRAVEL AUTHORIZATION NO.</div>
                  <div className="field-value">N/A</div>
                </td>
                <td className="field-cell" style={{ width: '15%' }}>
                  <div className="field-label">2. EMPLOYEE IDENTIFICATION NO.</div>
                  <div className="field-value">{voucherData.profile.employee_id || ''}</div>
                </td>
                <td className="field-cell" style={{ width: '25%' }}>
                  <div className="field-label">3. NAME (Last)</div>
                  <div className="field-value">{voucherData.profile.name?.split(' ').slice(-1)[0] || ''}</div>
                </td>
                <td className="field-cell" style={{ width: '20%' }}>
                  <div className="field-label">(First)</div>
                  <div className="field-value">{voucherData.profile.name?.split(' ')[0] || ''}</div>
                </td>
                <td className="field-cell" style={{ width: '10%' }}>
                  <div className="field-label">(Middle Initial)</div>
                  <div className="field-value"></div>
                </td>
                <td className="field-cell" style={{ width: '15%' }}>
                  <div className="field-label">4. AGENCY</div>
                  <div className="field-value">USDA</div>
                </td>
              </tr>

              {/* Row 2: Office numbers, Travel dates, Type claim, Program */}
              <tr>
                <td className="field-cell" colSpan={1}>
                  <div className="field-label">5. AGENCY ORIGINATING OFFICE NUMBER</div>
                  <div className="field-value"></div>
                </td>
                <td className="field-cell" colSpan={1}>
                  <div className="field-label">6. TRAVELER'S OPERATING OFFICE NUMBER</div>
                  <div className="field-value"></div>
                </td>
                <td className="field-cell" colSpan={2}>
                  <div className="field-label">7. DATES OF TRAVEL EXPENSES</div>
                  <div className="field-value inline-fields">
                    <span className="date-part">
                      <span className="date-label">Month</span>
                      <span className="date-input">{voucherData.month}</span>
                    </span>
                    <span className="date-part">
                      <span className="date-label">Day</span>
                      <span className="date-input">{firstDay.getDate()}</span>
                    </span>
                    <span className="date-part">
                      <span className="date-label">Year</span>
                      <span className="date-input">{voucherData.year}</span>
                    </span>
                    <span className="date-separator">THRU</span>
                    <span className="date-part">
                      <span className="date-label">Month</span>
                      <span className="date-input">{voucherData.month}</span>
                    </span>
                    <span className="date-part">
                      <span className="date-label">Day</span>
                      <span className="date-input">{lastDay.getDate()}</span>
                    </span>
                    <span className="date-part">
                      <span className="date-label">Year</span>
                      <span className="date-input">{voucherData.year}</span>
                    </span>
                  </div>
                </td>
                <td className="field-cell" colSpan={1}>
                  <div className="field-label">8. TYPE CLAIM (Before one type only)</div>
                  <div className="field-value">
                    <label className="checkbox-inline">
                      <input type="checkbox" checked readOnly /> TDY
                    </label>
                    <label className="checkbox-inline">
                      <input type="checkbox" readOnly /> PCS
                    </label>
                  </div>
                </td>
                <td className="field-cell" colSpan={1}>
                  <div className="field-label">9. PROGRAM INCLUDED</div>
                  <div className="field-value"></div>
                </td>
              </tr>

              {/* Row 3: Leave taken, Training doc, Official duty station, Resident city */}
              <tr>
                <td className="field-cell">
                  <div className="field-label">10. LEAVE TAKEN</div>
                  <div className="field-value">
                    <label className="radio-inline">
                      <input type="radio" name="leave" readOnly /> Y
                    </label>
                    <label className="radio-inline">
                      <input type="radio" name="leave" checked readOnly /> N
                    </label>
                  </div>
                </td>
                <td className="field-cell" colSpan={2}>
                  <div className="field-label">11. TRAINING DOCUMENT NO. (For training only)</div>
                  <div className="field-value"></div>
                </td>
                <td className="field-cell" colSpan={2}>
                  <div className="field-label">12. OFFICIAL DUTY STATION CITY AND STATE</div>
                  <div className="field-value"></div>
                </td>
                <td className="field-cell" colSpan={1}>
                  <div className="field-label">13. RESIDENT CITY AND STATE (If other than official station)</div>
                  <div className="field-value"></div>
                </td>
              </tr>

              {/* Row 4: Post approval, Total nights lodging, Number of nights approved */}
              <tr>
                <td className="field-cell">
                  <div className="field-label">14. POST APPROVAL INDICATOR</div>
                  <div className="field-value">
                    <label className="checkbox-inline">
                      <input type="checkbox" readOnly /> Y
                    </label>
                    <label className="checkbox-inline">
                      <input type="checkbox" checked readOnly /> N
                    </label>
                  </div>
                </td>
                <td className="field-cell">
                  <div className="field-label">15. TOTAL NIGHTS LODGING</div>
                  <div className="field-value">{nightsLodging}</div>
                </td>
                <td className="field-cell" colSpan={4}>
                  <div className="field-label">16. NUMBER OF NIGHTS APPROVED ACCOMMODATIONS PER HERE SET/ACT 5 STANDARDS</div>
                  <div className="field-value"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section B - Mailing Address */}
        <div className="section section-b">
          <div className="section-header">SECTION B – TRAVEL VOUCHER MAILING ADDRESS OPTIONS</div>
          
          <table className="section-table">
            <tbody>
              <tr>
                <td className="field-cell" style={{ width: '20%' }}>
                  <div className="field-label">17. SALARY ADDRESS</div>
                  <div className="field-value">
                    <label className="radio-inline">
                      <input type="radio" name="address" checked readOnly /> 1. (2B)
                    </label>
                  </div>
                </td>
                <td className="field-cell" style={{ width: '35%' }}></td>
                <td className="field-cell" style={{ width: '20%' }}>
                  <div className="field-label">18. MAILING CONTACT NUMBER</div>
                  <div className="field-value"></div>
                </td>
                <td className="field-cell" style={{ width: '25%' }} rowSpan={2}>
                  <div className="field-label">21. TRAVEL EP ACCOUNT</div>
                  <div className="field-value"></div>
                </td>
              </tr>
              <tr>
                <td className="field-cell" colSpan={3}>
                  <div className="field-label">19. CHECK ADDRESS</div>
                  <div className="field-value">{voucherData.profile.email || ''}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sections C and D side by side */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {/* Section C - Transportation Costs */}
          <div className="section section-c" style={{ flex: '0 0 48%' }}>
            <div className="section-header">SECTION C – TRANSPORTATION COSTS</div>
            
            <table className="section-table transport-table">
              <thead>
                <tr>
                  <th>22. METHOD OF PAYMENT</th>
                  <th>23. VENDOR/CARRIER</th>
                  <th>24. IDENTIFICATION NUMBER</th>
                  <th style={{ width: '60px' }}>MILES</th>
                  <th style={{ width: '50px' }}>DAYS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>POV</td>
                  <td>Personal Vehicle</td>
                  <td></td>
                  <td className="text-right">{voucherData.total_miles.toFixed(1)}</td>
                  <td></td>
                </tr>
                {[...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td>&nbsp;</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="totals-row">
              <span style={{ fontWeight: 'bold' }}>TOTALS ▶</span>
              <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{voucherData.total_miles.toFixed(1)}</span>
              <span style={{ marginLeft: '50px' }}>0.00</span>
            </div>

            <div className="field-note" style={{ marginTop: '4px', fontSize: '7pt', padding: '2px' }}>
              If payment was made by traveler, complete Section C on reverse
            </div>
          </div>

          {/* Section D - Claims */}
          <div className="section section-d" style={{ flex: '1' }}>
            <div className="section-header">SECTION D – CLAIMS</div>
            
            <div className="subsist-header">28. SUMMARY OF SUBSISTENCE</div>
            
            <table className="section-table subsist-table">
              <thead>
                <tr>
                  <th>TDY LOCATION</th>
                  <th style={{ width: '50px' }}>STATE</th>
                  <th style={{ width: '60px' }}>NO. OF DAYS</th>
                  <th style={{ width: '80px' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {voucherData.trips.slice(0, 5).map((trip, i) => (
                  <tr key={i}>
                    <td>{trip.to_address.split(',')[1]?.trim() || ''}</td>
                    <td>{trip.to_address.split(',')[2]?.trim().slice(0, 2) || ''}</td>
                    <td className="text-right">{trip.per_diem_days || 0}</td>
                    <td className="text-right">${((trip.lodging_cost || 0) + (trip.meals_cost || 0)).toFixed(2)}</td>
                  </tr>
                ))}
                {[...Array(Math.max(0, 5 - voucherData.trips.length))].map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td>&nbsp;</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Claims list */}
            <div className="claims-list">
              <div className="claim-row">
                <span className="claim-label">29. PER DIEM</span>
                <span className="claim-amount">${(voucherData.total_meals || 0).toFixed(2)}</span>
              </div>
              <div className="claim-row">
                <span className="claim-label">30. ACTUAL SUBSISTENCE</span>
                <span className="claim-amount">$0.00</span>
              </div>
              <div className="claim-row">
                <span className="claim-label">31. MILEAGE</span>
                <div className="mileage-detail">
                  <span>Rate [ ${mileageRate} ]</span>
                  <span>Miles [ {voucherData.total_miles.toFixed(1)} ]</span>
                </div>
                <span className="claim-amount">${mileageAmount.toFixed(2)}</span>
              </div>
              <div className="claim-row">
                <span className="claim-label">32. PARKING, TOLLS, ETC.</span>
                <span className="claim-amount">${(voucherData.total_other || 0).toFixed(2)}</span>
              </div>
              <div className="claim-row">
                <span className="claim-label">33. PLANE, BUS, TRAIN (Paid by Traveler)</span>
                <span className="claim-amount">$0.00</span>
              </div>
              <div className="claim-row">
                <span className="claim-label">34. UNACCOMPANIED BAGGAGE</span>
                <span className="claim-amount">$0.00</span>
              </div>
              <div className="claim-row">
                <span className="claim-label">35. LOCAL TRANSPORTATION</span>
                <span className="claim-amount">$0.00</span>
              </div>
              <div className="claim-row">
                <span className="claim-label">36. MISCELLANEOUS EXPENSES</span>
                <span className="claim-amount">$0.00</span>
              </div>
              <div className="claim-row">
                <span className="claim-label">37. CAR RENTAL</span>
                <span className="claim-amount">$0.00</span>
              </div>
              <div className="claim-row total-row">
                <span className="claim-label">38. TOTAL CLAIM (Blocks 29 thru 37)</span>
                <span className="claim-amount">${totalClaim.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section E - Accounting Classification */}
        <div className="section section-e">
          <div className="section-header">SECTION E – ACCOUNTING CLASSIFICATION</div>
          
          <table className="section-table">
            <tbody>
              <tr>
                <td className="field-cell" style={{ width: '50%', verticalAlign: 'top' }}>
                  <div className="field-label">
                    <input
                      type="checkbox"
                      checked={authAccounting}
                      onChange={(e) => setAuthAccounting(e.target.checked)}
                      style={{ marginRight: '6px' }}
                    />
                    45. AUTHORIZATION ACCOUNTING
                  </div>
                  <div className="field-value" style={{ fontSize: '7pt', paddingLeft: '18px' }}>
                    (Check this block if accounting and purpose of travel code(s) from travel authorization are to be charged for the total voucher claim.)
                  </div>
                  <div className="code-list" style={{ fontSize: '7pt', marginTop: '4px', paddingLeft: '18px' }}>
                    <div>PURPOSE OF TRAVEL CODES</div>
                    <div>1 = Site visit</div>
                    <div>2 = Information meeting</div>
                    <div>3 = Training attendance</div>
                    <div>4 = Speech or presentation</div>
                    <div>5 = Conference attendance</div>
                  </div>
                </td>
                <td className="field-cell" style={{ width: '50%', verticalAlign: 'top' }}>
                  <div className="field-label">
                    <input
                      type="checkbox"
                      checked={distAccounting}
                      onChange={(e) => setDistAccounting(e.target.checked)}
                      style={{ marginRight: '6px' }}
                    />
                    46. DISTRIBUTED ACCOUNTING
                  </div>
                  <div className="field-value" style={{ fontSize: '7pt', paddingLeft: '18px' }}>
                    (Check this block distribute total claim from Section D to the applicable Purpose of Travel Code and Accounting Classification line.)
                  </div>
                  <table className="dist-table" style={{ marginTop: '4px', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ fontSize: '6pt' }}>PURPOSE CODE</th>
                        <th style={{ fontSize: '6pt' }}>ACCOUNTING CLASSIFICATION</th>
                        <th style={{ fontSize: '6pt' }}>PERCENTAGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(6)].map((_, i) => (
                        <tr key={i}>
                          <td style={{ borderBottom: '1px solid #ccc', height: '16px' }}></td>
                          <td style={{ borderBottom: '1px solid #ccc' }}></td>
                          <td style={{ borderBottom: '1px solid #ccc', textAlign: 'right' }}>%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ textAlign: 'right', fontSize: '7pt', fontWeight: 'bold', marginTop: '2px' }}>
                    THESE PERCENTAGES MUST EQUAL 100%
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section F - Certifications */}
        <div className="section section-f" style={{ marginBottom: '12px' }}>
          <div className="section-header">SECTION F – CERTIFICATIONS</div>

          {/* Fraudulent Claim Warning */}
          <div className="legal-text" style={{ fontSize: '7pt', padding: '4px 6px', borderBottom: '1px solid black' }}>
            <strong>FRAUDULENT CLAIM.</strong> Falsification of an item in an expense account will result in a forfeiture of the claim 
            (28 USC 2514) and may result in a fine of not more than $10,000 or imprisonment of not more than 5 years or both 
            (18 USC 287; i.d. 1001).
          </div>

          {/* Claimant's Responsibilities */}
          <div className="legal-text" style={{ fontSize: '7pt', padding: '4px 6px', borderBottom: '1px solid black' }}>
            <strong>CLAIMANT'S RESPONSIBILITIES AND SIGNATURE.</strong> I hereby assign to the United States any rights I may have 
            against other parties in connection with any reimbursable carrier transportation charges described herein. I have received no 
            payment for claims shown herein. All travel and reimbursable claims were incurred on official business of the United States 
            Government. All tickets, coupons, promotional items and credits received in connection with travel claimed on this voucher 
            have been accounted for as required by 41 CFR 301- 304 and other regulations. I have reviewed this voucher and certify it 
            to be correct.
          </div>

          {/* Claimant Signature Row */}
          <table className="cert-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td className="field-cell" style={{ width: '50%', borderRight: '1px solid black' }}>
                  <div className="field-label">47. CLAIMANT'S SIGNATURE</div>
                  <div className="signature-line"></div>
                </td>
                <td className="field-cell" style={{ width: '25%', borderRight: '1px solid black' }}>
                  <div className="field-label">48. DATE</div>
                  <div className="field-value inline-fields">
                    <span className="date-part">
                      <span className="date-label">Month</span>
                      <span className="date-input"></span>
                    </span>
                    <span className="date-part">
                      <span className="date-label">Day</span>
                      <span className="date-input"></span>
                    </span>
                    <span className="date-part">
                      <span className="date-label">Year</span>
                      <span className="date-input"></span>
                    </span>
                  </div>
                </td>
                <td className="field-cell" style={{ width: '25%' }}>
                  <div className="field-label">49. FINAL VOUCHER INDICATOR</div>
                  <div className="field-value" style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '8px' }}>
                    <label style={{ fontSize: '8pt', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={finalVoucherYes}
                        onChange={(e) => {
                          setFinalVoucherYes(e.target.checked);
                          if (e.target.checked) setFinalVoucherNo(false);
                        }}
                        style={{ marginRight: '4px' }}
                      />
                      Y = Yes
                    </label>
                    <label style={{ fontSize: '8pt', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={finalVoucherNo}
                        onChange={(e) => {
                          setFinalVoucherNo(e.target.checked);
                          if (e.target.checked) setFinalVoucherYes(false);
                        }}
                        style={{ marginRight: '4px' }}
                      />
                      N = No
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Approving Officer's Responsibilities */}
          <div className="legal-text" style={{ fontSize: '7pt', padding: '4px 6px', borderBottom: '1px solid black', marginTop: '8px' }}>
            <strong>APPROVING OFFICER'S RESPONSIBILITIES AND SIGNATURE.</strong> In approving this voucher, I have determined 
            that: (1) Reimbursement is claimed for official travel only; (2) Use of rental car, taxicab, or other special conveyance for which 
            reimbursement is claimed is to the Government's advantage; and (3) Long distance phone calls and supplies or equipment 
            purchased are necessary and in the interest of the Government. Note: To approve long distance phone calls, approving officer 
            must have written authorization from Agency Head or his/her designee (31 USC 1348).
          </div>

          {/* Approving Officer Signature Rows */}
          <table className="cert-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td className="field-cell" style={{ width: '75%', borderRight: '1px solid black' }}>
                  <div className="field-label">50. APPROVING OFFICER'S SIGNATURE</div>
                  <div className="signature-line"></div>
                </td>
                <td className="field-cell" style={{ width: '25%' }}>
                  <div className="field-label">51. SOCIAL SECURITY NO.</div>
                  <div className="field-value">&nbsp;</div>
                </td>
              </tr>
              <tr>
                <td className="field-cell" style={{ width: '40%', borderRight: '1px solid black' }}>
                  <div className="field-label">54. NAME AND TITLE (Last, First, Middle Initial/Type or Print)</div>
                  <div className="field-value">&nbsp;</div>
                </td>
                <td className="field-cell" style={{ width: '25%', borderRight: '1px solid black' }}>
                  <div className="field-label">AGENCY CODE</div>
                  <div className="field-value">&nbsp;</div>
                </td>
              </tr>
              <tr>
                <td className="field-cell" style={{ width: '40%', borderRight: '1px solid black' }}>
                  <div className="field-label">55. CONTACT PERSON'S NAME</div>
                  <div className="field-value">&nbsp;</div>
                </td>
                <td className="field-cell" style={{ width: '25%', borderRight: '1px solid black' }}>
                  <div className="field-label">52. DATE APPROVED</div>
                  <div className="field-value inline-fields">
                    <span className="date-part">
                      <span className="date-label">Month</span>
                      <span className="date-input"></span>
                    </span>
                    <span className="date-part">
                      <span className="date-label">Day</span>
                      <span className="date-input"></span>
                    </span>
                    <span className="date-part">
                      <span className="date-label">Year</span>
                      <span className="date-input"></span>
                    </span>
                  </div>
                </td>
                <td className="field-cell" style={{ width: '35%' }}>
                  <div className="field-label">53. PHONE (Area Code and No.)</div>
                  <div className="field-value">&nbsp;</div>
                </td>
              </tr>
              <tr>
                <td className="field-cell" style={{ borderRight: '1px solid black' }}>
                  <div className="field-label">56. PHONE (Area Code and No.)</div>
                  <div className="field-value">&nbsp;</div>
                </td>
                <td colSpan={2} className="field-cell">
                  <div className="field-value" style={{ textAlign: 'right', fontSize: '7pt', fontWeight: 'bold' }}>
                    FORM AD - 616 (USDA) (Rev. 11/96)
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom of Page 1 - Submission Instructions */}
        <div className="submission-note" style={{ marginTop: '16px', padding: '8px', fontSize: '10pt', borderTop: '2px solid black' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Upon completion and approval, submit original voucher to:
          </div>
          <div style={{ marginLeft: '20px' }}>
            <strong>USDA</strong> – National Finance Center, P.O.Box 60000, New Orleans, LA 70160
          </div>
          <div style={{ textAlign: 'right', fontSize: '8pt', marginTop: '8px' }}>
            Exception to SF 1012 approved by GSA 11/20/96
          </div>
        </div>
      </div>

      {/* PAGE 2 - REVERSE SIDE */}
      <div className="voucher-form" style={{ background: 'white', padding: '20px', maxWidth: '8.5in', margin: '20px auto', boxShadow: '0 0 10px rgba(0,0,0,0.3)', pageBreakBefore: 'always' }}>
        {/* Header Row - Social Security and Traveler's Name */}
        <div style={{ display: 'flex', border: '2px solid black', borderBottom: '1px solid black', marginBottom: '0' }}>
          <div className="field-cell" style={{ flex: '0 0 25%', borderRight: '1px solid black', padding: '4px 6px' }}>
            <div className="field-label">SOCIAL SECURITY NO.</div>
            <div className="field-value">&nbsp;</div>
          </div>
          <div className="field-cell" style={{ flex: '1', padding: '4px 6px' }}>
            <div className="field-label">TRAVELER'S NAME</div>
            <div className="field-value">{voucherData.profile.name || ''}</div>
          </div>
        </div>

        {/* Section G - Schedule of Expenses */}
        <div className="section section-g" style={{ border: '2px solid black', borderTop: 'none' }}>
          <div className="section-header">SECTION G – SCHEDULE OF EXPENSES AND AMOUNTS CLAIMED</div>

          {/* Main Expense Table */}
          <table className="expense-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: '120px', verticalAlign: 'middle', borderRight: '1px solid black' }}>
                  <div>ITINERARY</div>
                  <div>FROM</div>
                  <div style={{ borderTop: '1px solid black', marginTop: '2px', paddingTop: '2px' }}>DATE (Month/Day)</div>
                </th>
                <th colSpan={7} style={{ borderBottom: '1px solid black', borderRight: '1px solid black' }}>&nbsp;</th>
                <th rowSpan={2} style={{ width: '100px', background: 'black', color: 'white', verticalAlign: 'middle', padding: '4px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>TOTALS</div>
                  <div style={{ fontSize: '6pt', marginTop: '4px' }}>Transfer these totals to Section D on Voucher Front.</div>
                  <div style={{ fontSize: '6pt', marginTop: '4px' }}>If additional days are required, use continuation sheet</div>
                </th>
              </tr>
              <tr>
                {[...Array(7)].map((_, i) => (
                  <th key={i} style={{ borderRight: '1px solid black', padding: '2px' }}>&nbsp;</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Week Date Range Row - Shows start and end dates for each week */}
              <tr>
                <td style={{ borderRight: '1px solid black', padding: '2px 4px', fontWeight: 'bold' }}>WEEK DATES</td>
                {weeklyData.slice(0, 7).map((week, i) => {
                  const start = `${week.startDate.getMonth() + 1}/${week.startDate.getDate()}`;
                  const end = `${week.endDate.getMonth() + 1}/${week.endDate.getDate()}`;
                  return <td key={i} style={{ borderRight: '1px solid black', padding: '2px', textAlign: 'center', fontSize: '6pt' }}>
                    {start} - {end}
                  </td>;
                })}
                {[...Array(Math.max(0, 7 - weeklyData.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
                <td rowSpan={3} style={{ verticalAlign: 'top', padding: '2px' }}>&nbsp;</td>
              </tr>

              {/* CITY Row - General location for the week */}
              <tr>
                <td style={{ borderRight: '1px solid black', padding: '2px 4px', fontWeight: 'bold' }}>CITY</td>
                {weeklyData.slice(0, 7).map((week, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', padding: '2px' }}>{week.city}</td>
                ))}
                {[...Array(Math.max(0, 7 - weeklyData.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
              </tr>

              {/* STATE Row */}
              <tr>
                <td style={{ borderRight: '1px solid black', padding: '2px 4px', fontWeight: 'bold' }}>STATE</td>
                {weeklyData.slice(0, 7).map((week, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', padding: '2px' }}>{week.state}</td>
                ))}
                {[...Array(Math.max(0, 7 - weeklyData.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
              </tr>

              {/* Divider - TO TDY LOCATION not needed for weekly summary */}
              <tr style={{ background: '#f0f0f0' }}>
                <td style={{ borderRight: '1px solid black', padding: '2px 4px', fontWeight: 'bold' }}>
                  <div>WEEKLY MILEAGE</div>
                </td>
                {weeklyData.slice(0, 7).map((week, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', padding: '2px', textAlign: 'right', fontWeight: 'bold' }}>
                    {week.totalMiles.toFixed(1)}
                  </td>
                ))}
                {[...Array(Math.max(0, 7 - weeklyData.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
                <td rowSpan={2} style={{ verticalAlign: 'top', padding: '2px' }}>&nbsp;</td>
              </tr>

              {/* Number of trips per week */}
              <tr>
                <td style={{ borderRight: '1px solid black', padding: '2px 4px', fontWeight: 'bold' }}>NO. OF TRIPS</td>
                {weeklyData.slice(0, 7).map((week, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', padding: '2px', textAlign: 'center' }}>
                    {week.trips.length}
                  </td>
                ))}
                {[...Array(Math.max(0, 7 - weeklyData.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
              </tr>

              {/* Divider Row */}
              <tr style={{ height: '8px', background: '#ddd' }}>
                <td colSpan={8} style={{ borderTop: '2px solid black', borderBottom: '2px solid black' }}>&nbsp;</td>
              </tr>

              {/* PER DIEM Section */}
              <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                <td style={{ borderRight: '1px solid black', padding: '2px 4px' }}>PER DIEM</td>
                <td colSpan={7} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>TOTAL NO. DAYS</td>
              </tr>

              <tr>
                <td style={{ borderRight: '1px solid black', padding: '2px 4px' }}>NO. OF DAYS</td>
                {weeklyData.slice(0, 7).map((week, i) => {
                  const weekPerDiemDays = week.trips.reduce((sum, t) => sum + (t.per_diem_days || 0), 0);
                  return <td key={i} style={{ borderRight: '1px solid black', textAlign: 'center' }}>
                    {weekPerDiemDays > 0 ? weekPerDiemDays.toFixed(1) : ''}
                  </td>;
                })}
                {[...Array(Math.max(0, 7 - weeklyData.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>
                  {voucherData.trips.reduce((sum, t) => sum + (t.per_diem_days || 0), 0).toFixed(2)}
                </td>
              </tr>

              <tr style={{ background: '#333', color: 'white' }}>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>
                  <div>LODGING</div>
                  <div style={{ fontSize: '6pt' }}>(Receipt Required)</div>
                </td>
                <td colSpan={6} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>

              <tr>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>
                  <div>MEALS and Enter Rate</div>
                  <div>INCID. EXPENSES</div>
                </td>
                {voucherData.trips.slice(0, 6).map((_, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'right', padding: '2px' }}>0.00</td>
                ))}
                {[...Array(Math.max(0, 6 - voucherData.trips.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black', textAlign: 'right' }}>0.00</td>
                ))}
                <td rowSpan={2}>&nbsp;</td>
              </tr>

              <tr>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>
                  <div>LESS MEALS</div>
                  <div>AT GOVERNMENT EXPENSE</div>
                </td>
                {[...Array(6)].map((_, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'center' }}>-</td>
                ))}
              </tr>

              <tr style={{ fontWeight: 'bold' }}>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>PER DIEM AMOUNT</td>
                {voucherData.trips.slice(0, 6).map((_, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'right', padding: '2px' }}>0.00</td>
                ))}
                {[...Array(Math.max(0, 6 - voucherData.trips.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black', textAlign: 'right' }}>0.00</td>
                ))}
                <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>TOTAL PER DIEM</td>
              </tr>

              <tr>
                <td colSpan={2}>&nbsp;</td>
                {[...Array(6)].map((_, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'center' }}>-</td>
                ))}
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>$ 0.00</td>
              </tr>

              {/* Actual Subsistence Section */}
              <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>ACTUAL SUBSISTENCE</td>
                <td colSpan={6} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                <td style={{ padding: '2px 4px' }}>TOTAL NO. DAYS</td>
              </tr>

              <tr>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>NO. OF DAYS</td>
                {[...Array(6)].map((_, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'center' }}>-</td>
                ))}
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>0.00</td>
              </tr>

              {/* Meal breakdown rows */}
              {[
                { label: 'LODGING', sublabel: '(Receipt Required)' },
                { label: 'BREAKFAST', sublabel: '' },
                { label: 'LUNCH', sublabel: '' },
                { label: 'DINNER', sublabel: '' },
                { label: 'M&IE/OTHER', sublabel: '' }
              ].map((row, idx) => (
                <tr key={idx}>
                  <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>
                    <div>{row.label}</div>
                    {row.sublabel && <div style={{ fontSize: '6pt' }}>{row.sublabel}</div>}
                  </td>
                  {[...Array(6)].map((_, i) => (
                    <td key={i} style={{ borderRight: '1px solid black', textAlign: 'center' }}>-</td>
                  ))}
                  <td>&nbsp;</td>
                </tr>
              ))}

              <tr style={{ fontWeight: 'bold', borderTop: '2px solid black' }}>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>
                  <div>ACTUAL</div>
                  <div>SUBSISTENCE AMOUNT</div>
                </td>
                {voucherData.trips.slice(0, 6).map((_, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'right', padding: '2px' }}>0.00</td>
                ))}
                {[...Array(Math.max(0, 6 - voucherData.trips.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black', textAlign: 'right' }}>0.00</td>
                ))}
                <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>
                  <div>TOTAL ACTUAL</div>
                  <div>SUBSISTENCE</div>
                </td>
              </tr>

              <tr>
                <td colSpan={2}>&nbsp;</td>
                {[...Array(6)].map((_, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'center' }}>-</td>
                ))}
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>$ 0.00</td>
              </tr>

              {/* Mileage Section */}
              <tr style={{ background: '#f0f0f0', fontWeight: 'bold', borderTop: '2px solid black' }}>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>MILEAGE</td>
                <td colSpan={6} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                <td style={{ padding: '2px 4px' }}>TOTAL MILES</td>
              </tr>

              <tr>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>MILES</td>
                {weeklyData.slice(0, 6).map((week, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'right', padding: '2px' }}>
                    {week.totalMiles.toFixed(1)}
                  </td>
                ))}
                {[...Array(Math.max(0, 6 - weeklyData.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
                <td rowSpan={2}>&nbsp;</td>
              </tr>

              <tr>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>RATE PER MILE</td>
                {weeklyData.slice(0, 6).map((_, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'right', padding: '2px' }}>
                    67¢
                  </td>
                ))}
                {[...Array(Math.max(0, 6 - weeklyData.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black' }}>&nbsp;</td>
                ))}
              </tr>

              <tr style={{ fontWeight: 'bold' }}>
                <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px' }}>MILEAGE AMOUNT</td>
                {weeklyData.slice(0, 6).map((week, i) => {
                  const amount = week.totalMiles * 0.67;
                  return <td key={i} style={{ borderRight: '1px solid black', textAlign: 'right', padding: '2px' }}>
                    {amount.toFixed(2)}
                  </td>;
                })}
                {[...Array(Math.max(0, 6 - weeklyData.length))].map((_, i) => (
                  <td key={`empty-${i}`} style={{ borderRight: '1px solid black', textAlign: 'right' }}>0.00</td>
                ))}
                <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>TOTAL MILEAGE</td>
              </tr>

              <tr>
                <td colSpan={2}>&nbsp;</td>
                {[...Array(6)].map((_, i) => (
                  <td key={i} style={{ borderRight: '1px solid black', textAlign: 'center' }}>-</td>
                ))}
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>$ {(voucherData.total_miles * 0.67).toFixed(2)}</td>
              </tr>

              {/* Other Expense Categories */}
              {[
                { label: 'PARKING, TOLLS, ETC.', total: 'TOTAL PARKING' },
                { label: 'PLANE, BUS, TRAIN\n(Paid by Traveler)', total: 'TOTAL PLANE, BUS, TRN' },
                { label: 'UNACCOMPANIED\nBAGGAGE', total: 'TOTAL UNACCOMPANIED BGA' },
                { label: 'LOCAL TRANSPORTATION\nNO. TRIPS\nDAILY EXPENSE', total: 'TOTAL LOCAL TRANSPORTATION' },
                { label: 'MISCELLANEOUS EXPENSES\nTELEPHONE CALLS\nSUPPLIES, ETC.', total: 'TOTAL MISCELLANEOUS' },
                { label: 'CAR RENTAL\n(Paid by Traveler)\nReceipt and Car Rental\nAgreement Required\nRENTAL EXPENSE\nGASOLINE EXPENSE', total: 'TOTAL CAR RENTAL' }
              ].map((category, idx) => (
                <React.Fragment key={idx}>
                  <tr>
                    <td colSpan={2} style={{ borderRight: '1px solid black', padding: '2px 4px', whiteSpace: 'pre-line', fontSize: '6pt' }}>
                      {category.label}
                    </td>
                    {[...Array(6)].map((_, i) => (
                      <td key={i} style={{ borderRight: '1px solid black', textAlign: 'center' }}>-</td>
                    ))}
                    <td style={{ padding: '2px 4px', fontSize: '6pt' }}>{category.total}</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>&nbsp;</td>
                    {[...Array(6)].map((_, i) => (
                      <td key={i} style={{ borderRight: '1px solid black', textAlign: 'center' }}>-</td>
                    ))}
                    <td style={{ textAlign: 'right', padding: '2px 4px' }}>$ 0.00</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Remarks Section */}
          <div style={{ border: '1px solid black', borderTop: '2px solid black', padding: '4px 6px', minHeight: '60px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '7pt' }}>REMARKS</div>
            <div style={{ fontSize: '7pt', marginTop: '4px' }}>&nbsp;</div>
          </div>

          {/* Privacy Act Notice */}
          <div style={{ border: '1px solid black', borderTop: 'none', padding: '4px 6px', fontSize: '5pt', lineHeight: '1.3' }}>
            <strong>PRIVACY ACT NOTICE.</strong> The following information is provided to comply with the Privacy Act of 1974 (P.L. 93-579). 
            The information requested on this form is required under the provisions of 5 USC, Chapter 57 (as amended) and Executive Orders 
            11609 of July 22, 1971, and 11012 of March 27, 1962, for the purpose of recording travel expenses incurred by the employee and 
            to claim other entitlements and allowances as prescribed in the Federal Travel Regulations (41 CFR 301-304). The information 
            contained in this form will be used by the appropriate Federal Agency personnel to authorize payments as prescribed. 
            We may share or use of the information in the performance of our duties. Transmittal may be transferred to appropriate Federal, 
            State, local or foreign agencies, when relevant to civil, criminal, or regulatory investigations or prosecutions or pursuant to 
            a requirement by GSA or such other agency in connection with the hiring or firing, or security clearances, or other personnel 
            actions, and other lawful uses. Failure to provide the information required will result in delay or suspension of the employee's 
            claim for reimbursement.
          </div>
        </div>
      </div>
    </div>
  );
}


