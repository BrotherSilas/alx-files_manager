import { MongoClient } from 'mongodb';

class DBClient {
    constructor() {
        // Environment variables for MongoDB connection
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';

        const url = `mongodb://${host}:${port}`;
        this.client = new MongoClient(url, { useUnifiedTopology: true });
        this.db = null;

        // Connect to the database
        this.client.connect()
            .then(() => {
                this.db = this.client.db(database);
            })
            .catch((err) => console.error('MongoDB Client Error:', err));
    }

    isAlive() {
        // Check if MongoDB connection is alive
        return !!this.db;
    }

    async nbUsers() {
        // Return the number of documents in the 'users' collection
        if (!this.db) return 0;
        return this.db.collection('users').countDocuments();
    }

    async nbFiles() {
        // Return the number of documents in the 'files' collection
        if (!this.db) return 0;
        return this.db.collection('files').countDocuments();
    }
}

// Export a DBClient instance
const dbClient = new DBClient();
export default dbClient;

