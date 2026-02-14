import app from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';

const PORT = config.port;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`
🚀 Server is running!
📡 Port: ${PORT}
🌍 Environment: ${config.nodeEnv}
🔗 URL: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing server...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Closing server...');
  process.exit(0);
});

startServer();