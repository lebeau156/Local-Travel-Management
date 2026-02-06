interface TripMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromAddress: string;
  toAddress: string;
  siteName?: string;
  miles: number;
  date: string;
  avoidTolls?: boolean;
}

export default function TripMapModal({
  isOpen,
  onClose,
  fromAddress,
  toAddress,
  siteName,
  miles,
  date,
  avoidTolls = false
}: TripMapModalProps) {
  if (!isOpen) return null;

  // Google Maps Embed API key
  const apiKey = 'AIzaSyD6RNEiJ8PzGMcVvAk7nC0iBab4ydEu5sI';
  
  // Build embedded map URL (Directions in iframe)
  let embeddedMapUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(fromAddress)}&destination=${encodeURIComponent(toAddress)}&mode=driving`;
  
  // Add avoid=tolls parameter if requested
  if (avoidTolls) {
    embeddedMapUrl += '&avoid=tolls';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Trip Route Preview</h2>
            <p className="text-sm text-blue-100">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Trip Info */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">📍 From</div>
              <div className="text-gray-900 font-medium">{fromAddress}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">📍 To</div>
              <div className="text-gray-900 font-medium">{toAddress}</div>
            </div>
          </div>
          {siteName && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-600 mb-1">🏢 Site</div>
              <div className="text-gray-900 font-medium">{siteName}</div>
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              📏 {miles.toFixed(1)} miles
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              💰 ${(miles * 0.67).toFixed(2)} reimbursement
            </div>
            {avoidTolls && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                🚫 No toll roads
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-gray-100" style={{ height: '500px' }}>
          <iframe
            src={embeddedMapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Interactive Route Map"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            💡 Use map controls to zoom, pan, and view turn-by-turn directions
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


