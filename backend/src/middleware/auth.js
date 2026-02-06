const jwt = require('jsonwebtoken');
const fs = require('fs');

function traceLog(message) {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync('trace.log', `[${timestamp}] ${message}\n`);
  } catch (e) {}
  console.log(message);
}

function debugLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] AUTH: ${message}\n`;
  console.log('AUTH:', message);
  try {
    fs.appendFileSync('debug.log', logMessage);
  } catch (e) {}
}

const JWT_SECRET = process.env.JWT_SECRET || 'usda-travel-tracker-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  traceLog('AUTH_START');
  try {
    traceLog('AUTH_LOG');
    debugLog('🔒 Auth middleware called for: ' + req.method + ' ' + req.url);
    traceLog('AUTH_HEADER');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    traceLog('AUTH_TOKEN_CHECK');
    if (!token) {
      traceLog('AUTH_NO_TOKEN');
      return res.status(401).json({ error: 'Access token required' });
    }

    traceLog('AUTH_JWT_VERIFY');
    jwt.verify(token, JWT_SECRET, (err, user) => {
      traceLog('AUTH_CALLBACK_START');
      try {
        traceLog('AUTH_CALLBACK_TRY');
        if (err) {
          traceLog('AUTH_JWT_ERROR');
          console.error('JWT verify error:', err);
          return res.status(403).json({ error: 'Invalid or expired token' });
        }
        traceLog('AUTH_USER_SET');
        req.user = user;
        traceLog('AUTH_BEFORE_NEXT');
        next();
        traceLog('AUTH_AFTER_NEXT');
      } catch (callbackErr) {
        traceLog('AUTH_CALLBACK_ERROR');
        console.error('💥 Error in jwt.verify callback:', callbackErr);
        return res.status(500).json({ error: 'Authentication error' });
      }
    });
    traceLog('AUTH_END_OUTER');
  } catch (outerErr) {
    traceLog('AUTH_OUTER_ERROR');
    console.error('💥 Error in authenticateToken:', outerErr);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

function authorize(...roles) {
  console.log('⚙️ authorize() called with roles:', roles);
  return (req, res, next) => {
    console.log('⚙️ authorize middleware executing for roles:', roles);
    console.log('⚙️ User:', req.user);
    
    if (!req.user) {
      console.log('❌ No user found');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      console.log(`❌ User role ${req.user.role} not in allowed roles:`, roles);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    console.log('✅ Authorization passed');
    next();
  };
}

function requireRole(roles) {
  console.log('⚙️ requireRole factory called with roles:', roles);
  
  const middleware = (req, res, next) => {
    console.log('⚙️ requireRole middleware executing');
    
    try {
      if (!req.user) {
        console.log('❌ No user');
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      if (!roles.includes(req.user.role)) {
        console.log(`❌ Role ${req.user.role} not in ${roles}`);
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      console.log('✅ Role OK');
      next();
    } catch (err) {
      console.error('💥 requireRole error:', err);
      return res.status(500).json({ error: 'Auth error' });
    }
  };
  
  console.log('⚙️ Returning middleware function');
  return middleware;
}

module.exports = { authenticateToken, authorize, requireRole, JWT_SECRET };
