const mongoose = require('mongoose');

/**
 * Standard Operational Health Check Endpoint (/healthz)
 * Suitable for cloud load balancers, Docker HEALTHCHECK, Kubernetes probes, or uptime monitors.
 */
const getHealthz = async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const statusCode = isConnected ? 200 : 503;

  return res.status(statusCode).json({
    status: isConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: isConnected ? 'connected' : 'disconnected',
      name: mongoose.connection.name || null,
    },
    memory: {
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
};

const getDbStatus = async (req, res, next) => {
  try {
    const states = {
      0: { label: 'Disconnected', color: 'danger' },
      1: { label: 'Connected', color: 'success' },
      2: { label: 'Connecting', color: 'warning' },
      3: { label: 'Disconnecting', color: 'warning' },
    };

    const currentState = mongoose.connection.readyState;
    const statusInfo = states[currentState] || { label: 'Unknown', color: 'secondary' };

    let pingTime = null;
    let collectionsList = [];

    if (currentState === 1 && mongoose.connection.db) {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      pingTime = Date.now() - startTime;

      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        collectionsList = collections.map(c => c.name);
      } catch (e) {
        collectionsList = [];
      }
    }

    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      },
      env: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      mongoUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@') : 'N/A',
      dbName: mongoose.connection.name || 'N/A',
      dbHost: mongoose.connection.host || 'N/A',
      dbPort: mongoose.connection.port || 'N/A',
    };

    // Support JSON response if requested via Accept header or query ?format=json
    if (req.query.format === 'json' || req.xhr) {
      return res.json({
        success: currentState === 1,
        status: statusInfo.label,
        pingTimeMs: pingTime,
        system: systemInfo,
        collections: collectionsList,
      });
    }

    res.render('public/db-status', {
      title: 'Kiểm tra Kết nối Database & Sức khỏe Hệ thống',
      statusInfo,
      currentState,
      pingTime,
      systemInfo,
      collectionsList,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthz,
  getDbStatus,
};
