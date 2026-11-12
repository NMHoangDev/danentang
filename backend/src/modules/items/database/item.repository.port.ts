import { RepositoryPort } from '../../../libs/ddd/repository.port.js';
import { ItemEntity } from '../domain/item.entity.js';

export interface ItemRepositoryPort extends RepositoryPort<ItemEntity> {
  findByStatus(status: string): Promise<ItemEntity[]>;
}
