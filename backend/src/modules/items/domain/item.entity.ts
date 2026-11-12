import { Entity } from '../../../libs/ddd/entity.base.js';

export type ItemStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';
export type ItemPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ItemProps {
  title: string;
  description: string;
  category: string;
  status: ItemStatus;
  priority: ItemPriority;
}

export interface ItemPersistenceRecord extends ItemProps {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export class ItemEntity extends Entity<ItemProps> {
  static create(
    props: ItemProps & { id?: string; createdAt?: string; updatedAt?: string },
  ): ItemEntity {
    if (!props.title || props.title.trim().length < 2) {
      throw new Error('Item title must be at least 2 characters');
    }
    return new ItemEntity(
      {
        title: props.title.trim(),
        description: (props.description || '').trim(),
        category: (props.category || 'GENERAL').trim().toUpperCase(),
        status: props.status || 'PENDING',
        priority: props.priority || 'MEDIUM',
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
      props.id,
    );
  }

  updateStatus(status: ItemStatus): void {
    this.props.status = status;
    this.markUpdated();
  }

  updateDetails(partial: Partial<ItemProps>): void {
    if (partial.title !== undefined) {
      this.props.title = partial.title.trim();
    }
    if (partial.description !== undefined) {
      this.props.description = partial.description.trim();
    }
    if (partial.category !== undefined) {
      this.props.category = partial.category.trim().toUpperCase();
    }
    if (partial.status !== undefined) {
      this.props.status = partial.status;
    }
    if (partial.priority !== undefined) {
      this.props.priority = partial.priority;
    }
    this.markUpdated();
  }

  toRecord(): ItemPersistenceRecord {
    return {
      id: this.id,
      title: this.props.title,
      description: this.props.description,
      category: this.props.category,
      status: this.props.status,
      priority: this.props.priority,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
