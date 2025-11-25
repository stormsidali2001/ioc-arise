export interface IDatabase {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string): Promise<any>;
}

