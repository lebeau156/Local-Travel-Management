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

const FleetManagerDashboardOption3: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedView, setSelectedView] = useState<'grid' | 'table'>('grid');

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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      padding: '40px',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
        <h1 style={{ 
          fontSize: '42px', 
          fontWeight: '800',
          margin: '0 0 12px 0',
          background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px'
        }}>
          Fleet Management Dashboard
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#94a3b8',
          margin: 0
        }}>
          Complete overview of all fleet vehicles across United States
        </p>
      </div>

      {/* Stats Grid - Card Design */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* Total Vehicles Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '30px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(96, 165, 250, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚙</div>
          <div style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>Total Fleet</div>
          <div style={{ fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>{mockFleetData.totalVehicles}</div>
          <div style={{ fontSize: '14px', color: '#60a5fa' }}>Vehicles Nationwide</div>
        </div>

        {/* Active Vehicles Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '30px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(52, 211, 153, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
          <div style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>Active</div>
          <div style={{ fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>{mockFleetData.activeVehicles}</div>
          <div style={{ fontSize: '14px', color: '#34d399' }}>On Active Duty</div>
        </div>

        {/* Maintenance Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '30px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(251, 191, 36, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔧</div>
          <div style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>Maintenance</div>
          <div style={{ fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>{mockFleetData.inService}</div>
          <div style={{ fontSize: '14px', color: '#fbbf24' }}>In Service Bay</div>
        </div>

        {/* States Coverage Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '30px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(167, 139, 250, 0.3)';
          e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
        >
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📍</div>
          <div style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>Coverage</div>
          <div style={{ fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>{mockFleetData.byState.length}</div>
          <div style={{ fontSize: '14px', color: '#a78bfa' }}>States Covered</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* US Map */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '30px'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '700',
            color: '#fff',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>🗺️</span> Fleet Distribution Map
          </h3>
          <div style={{
            width: '100%',
            height: '350px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: '12px',
            border: '2px dashed rgba(96, 165, 250, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ fontSize: '56px' }}>🇺🇸</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>
              Interactive US Map
            </div>
            <div style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '300px', textAlign: 'center' }}>
              Real-time vehicle tracking across all states
            </div>
          </div>
        </div>

        {/* State Distribution */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '30px'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '700',
            color: '#fff',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>📊</span> Top States by Fleet Size
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mockFleetData.byState.map((item, idx) => {
              const colors = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'];
              return (
                <div key={idx} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = colors[idx % colors.length];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: colors[idx % colors.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#fff'
                      }}>
                        {item.abbr}
                      </div>
                      <span style={{ fontSize: '16px', color: '#e2e8f0', fontWeight: '600' }}>{item.state}</span>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      color: colors[idx % colors.length]
                    }}>
                      {item.count}
                    </div>
                  </div>
                  <div style={{ 
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(item.count / mockFleetData.totalVehicles) * 100}%`,
                      background: colors[idx % colors.length],
                      transition: 'width 0.6s ease',
                      boxShadow: `0 0 10px ${colors[idx % colors.length]}`
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Mileage Chart */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '40px'
      }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '700',
          color: '#fff',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>📈</span> Monthly Mileage Trends
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          gap: '24px',
          height: '220px',
          paddingTop: '20px'
        }}>
          {mockFleetData.monthlyMiles.map((item, idx) => (
            <div key={idx} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#60a5fa',
                marginBottom: '4px'
              }}>
                {(item.miles / 1000).toFixed(0)}k
              </div>
              <div style={{
                width: '100%',
                height: `${(item.miles / maxMiles) * 100}%`,
                background: `linear-gradient(180deg, ${idx % 2 === 0 ? '#60a5fa' : '#a78bfa'} 0%, ${idx % 2 === 0 ? '#3b82f6' : '#8b5cf6'} 100%)`,
                borderRadius: '12px 12px 0 0',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                boxShadow: `0 0 20px rgba(${idx % 2 === 0 ? '96, 165, 250' : '167, 139, 250'}, 0.4)`,
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scaleY(1.08)';
                e.currentTarget.style.filter = 'brightness(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scaleY(1)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80%',
                  height: '30%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  filter: 'blur(10px)'
                }} />
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#94a3b8',
                marginTop: '8px'
              }}>
                {item.month}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Registry */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '30px'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>🚗</span> Complete Fleet Registry
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedView('grid')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: selectedView === 'grid' ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.1)',
                background: selectedView === 'grid' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.05)',
                color: selectedView === 'grid' ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setSelectedView('table')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: selectedView === 'table' ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.1)',
                background: selectedView === 'table' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.05)',
                color: selectedView === 'table' ? '#60a5fa' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              Table
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <input
            type="text"
            placeholder="🔍 Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All" style={{ background: '#1e293b' }}>All States</option>
            {mockFleetData.byState.map(s => (
              <option key={s.state} value={s.state} style={{ background: '#1e293b' }}>{s.state}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All" style={{ background: '#1e293b' }}>All Status</option>
            <option value="Active" style={{ background: '#1e293b' }}>Active</option>
            <option value="In Service" style={{ background: '#1e293b' }}>In Service</option>
          </select>
        </div>

        {/* Vehicle Cards Grid */}
        {selectedView === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {filteredVehicles.map((vehicle, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = '#60a5fa';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(96, 165, 250, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{vehicle.year}</div>
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: vehicle.status === 'Active' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    color: vehicle.status === 'Active' ? '#34d399' : '#fbbf24',
                    border: `1px solid ${vehicle.status === 'Active' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                  }}>
                    {vehicle.status}
                  </span>
                </div>

                <div style={{ 
                  background: 'rgba(96, 165, 250, 0.1)',
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  border: '1px solid rgba(96, 165, 250, 0.2)'
                }}>
                  <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>License Plate</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa', letterSpacing: '1px' }}>
                    {vehicle.licensePlate}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Assigned To</div>
                  <div style={{ fontSize: '15px', color: '#e2e8f0', fontWeight: '600' }}>{vehicle.user}</div>
                </div>

                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Position</div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>{vehicle.position}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Mileage</div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>{vehicle.mileage.toLocaleString()} mi</div>
                  </div>
                </div>

                <div style={{ 
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Location</div>
                  <div style={{ fontSize: '14px', color: '#e2e8f0' }}>
                    {vehicle.city}, {vehicle.state} • {vehicle.circuit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Table View
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>ID</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>License</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>User</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Position</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Location</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Mileage</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle, idx) => (
                  <tr key={idx} style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  >
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#60a5fa' }}>{vehicle.id}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#e2e8f0' }}>{vehicle.make} {vehicle.model}</td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#94a3b8' }}>{vehicle.licensePlate}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#e2e8f0' }}>{vehicle.user}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: 'rgba(167, 139, 250, 0.2)',
                        color: '#a78bfa',
                        border: '1px solid rgba(167, 139, 250, 0.3)'
                      }}>
                        {vehicle.position}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#94a3b8' }}>{vehicle.city}, {vehicle.state}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: vehicle.status === 'Active' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                        color: vehicle.status === 'Active' ? '#34d399' : '#fbbf24',
                        border: `1px solid ${vehicle.status === 'Active' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
                      }}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#e2e8f0' }}>{vehicle.mileage.toLocaleString()} mi</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetManagerDashboardOption3;


