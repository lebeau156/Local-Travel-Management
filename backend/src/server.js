const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { initDatabase } = require('./models/database');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// File logger
const logFile = 'debug.log';
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (e) {
    // Ignore write errors
  }
}

// Clear old log
try {
  fs.writeFileSync(logFile, '=== Server Starting ===\n');
} catch (e) {}

// Force console output to flush immediately
if (process.stdout._handle) {
  process.stdout._handle.setBlocking(true);
}
if (process.stderr._handle) {
  process.stderr._handle.setBlocking(true);
}

// Process-level error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION: ' + error.message);
  console.error('Stack: ' + error.stack);
  log('💥 UNCAUGHT EXCEPTION: ' + error.message);
  log('Stack: ' + error.stack);
  // Don't exit immediately - let us see the error
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION: ' + reason);
  log('💥 UNHANDLED REJECTION: ' + reason);
  // Don't exit immediately - let us see the error
  setTimeout(() => process.exit(1), 1000);
});

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.FRONTEND_URL,
      'https://*.railway.app',
      'https://*.up.railway.app'
    ].filter(Boolean)
  : [
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://localhost:5175', 
      'http://localhost:5176', 
      'http://localhost:3000'
    ];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*.', '');
        return origin.endsWith(pattern);
      }
      return origin === allowedOrigin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
// Rate limiting - DISABLED FOR DEVELOPMENT
// app.use('/api/', apiLimiter);

// Request logging
app.use((req, res, next) => {
  log(`📥 ${req.method} ${req.url}`);
  
  // Log when response finishes
  res.on('finish', () => {
    log(`📤 ${req.method} ${req.url} - ${res.statusCode}`);
  });
  
  next();
});

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/supervisors', require('./routes/supervisors'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/export', require('./routes/export'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/team', require('./routes/teamUpdate')); // NEW ALTERNATIVE ENDPOINT
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/mileage-rates', require('./routes/mileageRates'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/csv', require('./routes/csvImport'));
app.use('/api/system-config', require('./routes/systemConfig'));
app.use('/api/templates', require('./routes/tripTemplates'));
app.use('/api/search', require('./routes/search'));
app.use('/api/comments', require('./routes/comments'));

// Circuit Plants routes
try {
  const circuitPlantsRoutes = require('./routes/circuitPlants');
  console.log('🏭 Registering circuit plants routes at /api/circuit-plants');
  app.use('/api/circuit-plants', circuitPlantsRoutes);
  console.log('🏭 Circuit plants routes registered successfully');
  
  // Test direct route
  app.get('/api/circuit-plants-test', (req, res) => {
    res.json({ message: 'Circuit plants test route works!' });
  });
} catch (err) {
  console.error('❌ Failed to load circuit plants routes:', err);
}

// Test PDF route (disabled in production)
// app.use('/api/test', require('./routes/test-pdf'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'USDA Travel Tracker API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Express Error Handler:', err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
  }
});

app.listen(PORT, () => {
  log(`\n✅ Server running on http://localhost:${PORT}`);
  log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  log(`\n🔐 Default Login Credentials:`);
  log(`   Inspector: inspector@usda.gov / Test123!`);
  log(`   Supervisor: supervisor@usda.gov / Test123!`);
  log(`   Fleet Manager: fleetmgr@usda.gov / Test123!`);
  log(`   Admin: admin@usda.gov / Admin123!\n`);
  
  // Debug: Check if Google Maps API key is loaded
  const hasGoogleMapsKey = !!process.env.GOOGLE_MAPS_API_KEY;
  if (hasGoogleMapsKey) {
    log(`🗺️  Google Maps API Key: Loaded (${process.env.GOOGLE_MAPS_API_KEY.substring(0, 20)}...)`);
  } else {
    log(`⚠️  Google Maps API Key: NOT FOUND (autocomplete will not work)`);
  }
});
