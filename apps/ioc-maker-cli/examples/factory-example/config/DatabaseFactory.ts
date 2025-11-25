import { IDatabase } from './IDatabase';

class PostgresDatabase implements IDatabase {
    private connected = false;

    async connect(): Promise<void> {
        console.log('🔌 Connecting to PostgreSQL database...');
        this.connected = true;
    }

    async disconnect(): Promise<void> {
        console.log('🔌 Disconnecting from PostgreSQL database...');
        this.connected = false;
    }

    async query(sql: string): Promise<any> {
        if (!this.connected) {
            throw new Error('Database not connected');
        }
        console.log(`📊 Executing query: ${sql}`);
        return { rows: [], rowCount: 0 };
    }
}

class MySQLDatabase implements IDatabase {
    private connected = false;

    async connect(): Promise<void> {
        console.log('🔌 Connecting to MySQL database...');
        this.connected = true;
    }

    async disconnect(): Promise<void> {
        console.log('🔌 Disconnecting from MySQL database...');
        this.connected = false;
    }

    async query(sql: string): Promise<any> {
        if (!this.connected) {
            throw new Error('Database not connected');
        }
        console.log(`📊 Executing query: ${sql}`);
        return { rows: [], rowCount: 0 };
    }
}

/**
 * Factory function that creates a database instance based on environment
 * This demonstrates how factories can contain complex logic for instance creation
 */
export function createDatabase(): IDatabase {
    const dbType = process.env.DB_TYPE || 'postgres';

    console.log(`🏭 Database Factory: Creating ${dbType} database instance`);

    if (dbType === 'mysql') {
        return new MySQLDatabase();
    }

    return new PostgresDatabase();
}

