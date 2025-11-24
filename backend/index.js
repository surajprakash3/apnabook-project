import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const URI = process.env.MongoDBURI;

let server;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.json({ status: 'ok', message: 'Bookstore API' });
});

async function startServer() {
    if (!URI) {
        console.error('MongoDB URI not provided. Set process.env.MongoDBURI');
        process.exit(1);
    }

    try {
        // Remove deprecated options — mongoose v6+ handles them internally
        await mongoose.connect(URI);

        console.log('Connected to MongoDB');
        server = app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
const shutdown = async signal => {
	console.log(`Received ${signal}. Closing server...`);
	try {
		if (server) {
			server.close(() => console.log('HTTP server closed'));
		}
		await mongoose.disconnect();
		console.log('MongoDB connection closed');
		process.exit(0);
	} catch (err) {
		console.error('Error during shutdown', err);
		process.exit(1);
	}
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
