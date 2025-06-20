export abstract class AbstractRepository {
  protected abstract tableName: string;
  
  abstract findById(id: string): Promise<any | null>;
  abstract save(entity: any): Promise<any>;
  abstract delete(id: string): Promise<boolean>;
  
  protected log(message: string): void {
    console.log(`[${this.tableName}] ${message}`);
  }
}
