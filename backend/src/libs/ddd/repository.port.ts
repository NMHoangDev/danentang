export interface RepositoryPort<Entity> {
  findAll(): Promise<Entity[]>;
  findById(id: string): Promise<Entity | null>;
  save(entity: Entity): Promise<Entity>;
  delete(id: string): Promise<boolean>;
}
