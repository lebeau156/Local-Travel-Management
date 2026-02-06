import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../api/axios';
import TripMapModal from '../components/TripMapModal';

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
  other_expenses?: number;
  avoid_tolls?: number;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function CalendarView() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [view, setView] = useState<'month' | 'year'>('month');
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await api.get('/trips');
      setTrips(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const getTripsByDate = (date: Date): Trip[] => {
    const dateStr = date.toISOString().split('T')[0];
    return trips.filter(trip => trip.date.startsWith(dateStr));
  };

  const getTripCountForMonth = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate.getFullYear() === year && tripDate.getMonth() === month;
    }).length;
  };

  const getSelectedDayTrips = (): Trip[] => {
    if (!selectedDate || Array.isArray(selectedDate)) return [];
    return getTripsByDate(selectedDate);
  };

  const getTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayTrips = getTripsByDate(date);
      if (dayTrips.length > 0) {
        return (
          <div className="flex justify-center items-center mt-1">
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
              {dayTrips.length}
            </span>
          </div>
        );
      }
    }
    return null;
  };

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayTrips = getTripsByDate(date);
      if (dayTrips.length > 0) {
        return 'has-trips';
      }
    }
    return '';
  };

  const getMonthStats = () => {
    if (!selectedDate || Array.isArray(selectedDate)) return { trips: 0, miles: 0, expenses: 0 };
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const monthTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate.getFullYear() === year && tripDate.getMonth() === month;
    });

    const totalMiles = monthTrips.reduce((sum, t) => sum + t.miles_calculated, 0);
    const totalExpenses = monthTrips.reduce((sum, t) => 
      sum + (t.lodging_cost || 0) + (t.meals_cost || 0) + (t.other_expenses || 0), 0
    );

    return {
      trips: monthTrips.length,
      miles: totalMiles,
      expenses: totalExpenses
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  const selectedDayTrips = getSelectedDayTrips();
  const monthStats = getMonthStats();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trip Calendar</h1>
        <button
          onClick={() => navigate('/trips/add')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
        >
          ➕ Add Trip
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
            <div className="calendar-container">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileContent={getTileContent}
                tileClassName={getTileClassName}
                className="w-full border-0 rounded-lg"
              />
            </div>

            <style>{`
              .calendar-container .react-calendar {
                border: none;
                font-family: inherit;
              }
              .calendar-container .react-calendar__tile {
                height: 80px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                padding: 8px;
              }
              .calendar-container .react-calendar__tile--active {
                background: #2563eb;
                color: white;
              }
              .calendar-container .react-calendar__tile--now {
                background: #dbeafe;
              }
              .calendar-container .react-calendar__tile:hover {
                background: #eff6ff;
              }
              .calendar-container .react-calendar__tile--active:hover {
                background: #1d4ed8;
              }
              .calendar-container .has-trips {
                font-weight: 600;
              }
            `}</style>
          </div>

          {/* Monthly Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Trips This Month</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{monthStats.trips}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Miles</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{monthStats.miles.toFixed(0)}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Expenses</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">${monthStats.expenses.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {selectedDate && !Array.isArray(selectedDate) 
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : 'Select a date'}
            </h2>

            {selectedDayTrips.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-600 dark:text-gray-400">No trips on this day</p>
                <button
                  onClick={() => {
                    if (selectedDate && !Array.isArray(selectedDate)) {
                      navigate('/trips/add', { 
                        state: { 
                          prefilledDate: selectedDate.toISOString().split('T')[0] 
                        } 
                      });
                    }
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Add a trip for this day
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {selectedDayTrips.map(trip => (
                  <div 
                    key={trip.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900 text-sm">
                        {trip.site_name || 'Trip'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {trip.miles_calculated.toFixed(1)} mi
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <div className="truncate">📍 {trip.from_address}</div>
                      <div className="truncate">📍 {trip.to_address}</div>
                    </div>
                    {trip.purpose && (
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        {trip.purpose}
                      </div>
                    )}
                    {((trip.lodging_cost || 0) + (trip.meals_cost || 0) + (trip.other_expenses || 0)) > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        💰 ${((trip.lodging_cost || 0) + (trip.meals_cost || 0) + (trip.other_expenses || 0)).toFixed(2)}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowMapModal(true);
                        }}
                        className="flex-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        🗺️ View Map
                      </button>
                      <button
                        onClick={() => navigate(`/trips/edit/${trip.id}`)}
                        className="flex-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Edit Trip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trip Map Modal */}
      {showMapModal && selectedTrip && (
        <TripMapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setSelectedTrip(null);
          }}
          fromAddress={selectedTrip.from_address}
          toAddress={selectedTrip.to_address}
          siteName={selectedTrip.site_name}
          miles={selectedTrip.miles_calculated}
          date={selectedTrip.date}
          avoidTolls={Boolean(selectedTrip.avoid_tolls)}
        />
      )}
    </div>
  );
}


