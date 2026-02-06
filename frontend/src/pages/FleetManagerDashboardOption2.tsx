import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data for prototype
const mockFleetData = {
  totalVehicles: 156,
  activeVehicles: 142,
  inService: 14,
  byState: [
    { state: 'California', count: 45, abbr: 'CA' },
    { state: 'Texas', count: 38, abbr: 'TX' },
    { state: 'Florida', count: 28, abbr: 'FL' },
    { state: 'New York', count: 25, abbr: 'NY' },
    { state: 'Illinois', count: 20, abbr: 'IL' },
  ],
  vehicles: [
    { id: 'V001', make: 'Ford', model: 'F-150', year: 2022, licensePlate: 'CA-1234', 
      user: 'John Smith', position: 'Food Inspector', role: 'Inspector', 
      state: 'California', city: 'Los Angeles', circuit: 'District 1', status: 'Active', mileage: 45230 },
    { id: 'V002', make: 'Chevrolet', model: 'Silverado', year: 2021, licensePlate: 'TX-5678', 
      user: 'Sarah Johnson', position: 'CSI', role: 'Inspector', 
      state: 'Texas', city: 'Houston', circuit: 'District 2', status: 'Active', mileage: 38450 },
    { id: 'V003', make: 'Toyota', model: 'Tacoma', year: 2023, licensePlate: 'FL-9012', 
      user: 'Michael Brown', position: 'SCSI', role: 'Supervisor', 
      state: 'Florida', city: 'Miami', circuit: 'District 3', status: 'In Service', mileage: 12890 },
    { id: 'V004', make: 'RAM', model: '1500', year: 2022, licensePlate: 'NY-3456', 
      user: 'Emily Davis', position: 'FLS', role: 'Supervisor', 
      state: 'New York', city: 'Buffalo', circuit: 'District 4', status: 'Active', mileage: 52100 },
    { id: 'V005', make: 'GMC', model: 'Sierra', year: 2021, licensePlate: 'IL-7890', 
      user: 'David Wilson', position: 'DDM', role: 'Supervisor', 
      state: 'Illinois', city: 'Chicago', circuit: 'District 5', status: 'Active', mileage: 41200 },
  ],
  monthlyMiles: [
    { month: 'Jan', miles: 125000 },
    { month: 'Feb', miles: 132000 },
    { month: 'Mar', miles: 128000 },
    { month: 'Apr', miles: 145000 },
    { month: 'May', miles: 138000 },
    { month: 'Jun', miles: 142000 },
  ]
};

const FleetManagerDashboardOption2: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredVehicles = mockFleetData.vehicles.filter(vehicle => {
    const matchesSearch = vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.make.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filterState === 'All' || vehicle.state === filterState;
    const matchesStatus = filterStatus === 'All' || vehicle.status === filterStatus;
    return matchesSearch && matchesState && matchesStatus;
  });

  const maxMiles = Math.max(...mockFleetData.monthlyMiles.map(m => m.miles));

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '0'
    }}>
      {/* Modern Sidebar Stats Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '0',
        minHeight: '100vh'
      }}>
        {/* Left Sidebar with Dark Theme */}
        <div style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          padding: '30px 20px',
          color: 'white',
          borderRight: '1px solid #334155'
        }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              margin: '0 0 8px 0',
              color: '#fff'
            }}>
              Fleet Command
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#94a3b8',
              margin: 0
            }}>
              Vehicle Management System
            </p>
          </div>

          {/* Key Metrics Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Total Fleet */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ fontSize: '14px', color: '#dbeafe', marginBottom: '8px' }}>Total Fleet</div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff' }}>{mockFleetData.totalVehicles}</div>
              <div style={{ fontSize: '12px', color: '#93c5fd', marginTop: '4px' }}>Vehicles</div>
            </div>

            {/* Active */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ fontSize: '14px', color: '#d1fae5', marginBottom: '8px' }}>Active</div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff' }}>{mockFleetData.activeVehicles}</div>
              <div style={{ fontSize: '12px', color: '#6ee7b7', marginTop: '4px' }}>On Duty</div>
            </div>

            {/* In Service */}
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ fontSize: '14px', color: '#fef3c7', marginBottom: '8px' }}>Maintenance</div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff' }}>{mockFleetData.inService}</div>
              <div style={{ fontSize: '12px', color: '#fde68a', marginTop: '4px' }}>In Service</div>
            </div>

            {/* States Coverage */}
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{ fontSize: '14px', color: '#ede9fe', marginBottom: '8px' }}>Coverage</div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff' }}>{mockFleetData.byState.length}</div>
              <div style={{ fontSize: '12px', color: '#ddd6fe', marginTop: '4px' }}>States</div>
            </div>
          </div>

          {/* State Distribution */}
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              color: '#f1f5f9',
              marginBottom: '20px'
            }}>
              State Distribution
            </h3>
            {mockFleetData.byState.map((item, idx) => (
              <div key={idx} style={{
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: '500' }}>{item.abbr}</span>
                  <span style={{ fontSize: '16px', color: '#fff', fontWeight: '600' }}>{item.count}</span>
                </div>
                <div style={{ 
                  height: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(item.count / mockFleetData.totalVehicles) * 100}%`,
                    background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div style={{ padding: '30px 40px', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '700',
              color: '#0f172a',
              margin: '0 0 8px 0'
            }}>
              Fleet Overview
            </h2>
            <p style={{ 
              fontSize: '15px', 
              color: '#64748b',
              margin: 0
            }}>
              Real-time monitoring and management of all fleet vehicles
            </p>
          </div>

          {/* Interactive US Map Placeholder */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            marginBottom: '30px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '100%',
              height: '400px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '12px',
              border: '2px dashed #3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ fontSize: '48px' }}>🗺️</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                Interactive US Map
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px' }}>
                Click on any state to view detailed vehicle information and locations
              </div>
            </div>
          </div>

          {/* Monthly Mileage Chart */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#0f172a',
              marginBottom: '24px'
            }}>
              Monthly Mileage Trends
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end',
              gap: '20px',
              height: '200px',
              paddingTop: '20px'
            }}>
              {mockFleetData.monthlyMiles.map((item, idx) => (
                <div key={idx} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#3b82f6',
                    marginBottom: '4px'
                  }}>
                    {(item.miles / 1000).toFixed(0)}k
                  </div>
                  <div style={{
                    width: '100%',
                    height: `${(item.miles / maxMiles) * 100}%`,
                    background: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)',
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    boxShadow: '0 -4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scaleY(1.05)';
                    e.currentTarget.style.background = 'linear-gradient(180deg, #2563eb 0%, #1e3a8a 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scaleY(1)';
                    e.currentTarget.style.background = 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)';
                  }}
                  />
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginTop: '8px'
                  }}>
                    {item.month}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet Registry Table */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '16px'
              }}>
                Complete Fleet Registry
              </h3>
              
              {/* Filters */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr',
                gap: '12px'
              }}>
                <input
                  type="text"
                  placeholder="🔍 Search by license plate, user, or make..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  <option value="All">All States</option>
                  {mockFleetData.byState.map(s => (
                    <option key={s.state} value={s.state}>{s.state}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="In Service">In Service</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Make/Model</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>License Plate</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned User</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Position</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>State/City</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Circuit</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mileage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle, idx) => (
                    <tr key={idx} style={{
                      background: 'white',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.transform = 'scale(1.01)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#3b82f6', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', borderRadius: '8px 0 0 8px' }}>{vehicle.id}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>{vehicle.make} {vehicle.model}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#64748b', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>{vehicle.licensePlate}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>{vehicle.user}</td>
                      <td style={{ padding: '16px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: '#dbeafe',
                          color: '#1e40af'
                        }}>
                          {vehicle.position}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>{vehicle.state}, {vehicle.city}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>{vehicle.circuit}</td>
                      <td style={{ padding: '16px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: vehicle.status === 'Active' ? '#d1fae5' : '#fef3c7',
                          color: vehicle.status === 'Active' ? '#065f46' : '#92400e'
                        }}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderRadius: '0 8px 8px 0' }}>{vehicle.mileage.toLocaleString()} mi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetManagerDashboardOption2;


