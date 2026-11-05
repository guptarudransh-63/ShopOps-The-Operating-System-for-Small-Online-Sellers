require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const reservationExpiryJob = require('./jobs/reservationExpiryJob');

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    // Start background reservation expiry monitor (checks every 60s)
    reservationExpiryJob.start(60000);

    const server = app.listen(PORT, () => {
      console.log(`[ShopOps Server] Running on http://localhost:${PORT}`);
    });

    const shutdown = () => {
      console.log('[ShopOps Server] Gracefully shutting down...');
      reservationExpiryJob.stop();
      server.close(() => {
        console.log('[ShopOps Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[ShopOps Startup Error]:', error);
    process.exit(1);
  }
};

startServer();
