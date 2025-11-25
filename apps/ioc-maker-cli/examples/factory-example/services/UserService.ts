import { IUserService } from './IUserService';
import { IDatabase } from '../config/IDatabase';

export class UserService implements IUserService {
    constructor(private database: IDatabase) { }

    async getUser(id: string): Promise<{ id: string; name: string }> {
        await this.database.query(`SELECT * FROM users WHERE id = '${id}'`);
        return { id, name: 'John Doe' };
    }

    async createUser(name: string): Promise<{ id: string; name: string }> {
        const id = Math.random().toString(36).substring(7);
        await this.database.query(`INSERT INTO users (id, name) VALUES ('${id}', '${name}')`);
        return { id, name };
    }
}

