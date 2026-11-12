import {
  getSupabaseAdapter,
  SupabaseTableAdapter,
} from '../../../config/supabase.config.js';
import {
  ItemEntity,
  ItemPersistenceRecord,
  ItemPriority,
  ItemStatus,
} from '../domain/item.entity.js';
import { ItemRepositoryPort } from './item.repository.port.js';

interface SupabaseItemRow extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ItemStatus;
  priority: ItemPriority;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ItemSupabaseRepository implements ItemRepositoryPort {
  private readonly tableName = 'items';
  private readonly store: SupabaseTableAdapter;

  constructor(store: SupabaseTableAdapter = getSupabaseAdapter()) {
    this.store = store;
  }

  private toEntity(row: SupabaseItemRow): ItemEntity {
    return ItemEntity.create({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt,
    });
  }

  private toRow(record: ItemPersistenceRecord): SupabaseItemRow {
    if (this.store.getMode() === 'SUPABASE_LOCAL_PERSISTENT_ENGINE') {
      return {
        ...record,
      };
    }
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      status: record.status,
      priority: record.priority,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  }

  async findAll(): Promise<ItemEntity[]> {
    const rows = await this.store.selectAll<SupabaseItemRow>(this.tableName);
    const entities = rows.map((row) => this.toEntity(row));
    return entities.sort((a, b) =>
      String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
    );
  }

  async findByStatus(status: string): Promise<ItemEntity[]> {
    const all = await this.findAll();
    return all.filter((item) => item.toRecord().status === status);
  }

  async findById(id: string): Promise<ItemEntity | null> {
    const row = await this.store.selectById<SupabaseItemRow>(
      this.tableName,
      id,
    );
    if (!row) {
      return null;
    }
    return this.toEntity(row);
  }

  async save(entity: ItemEntity): Promise<ItemEntity> {
    const record = entity.toRecord();
    const row = this.toRow(record);
    await this.store.upsertRow(this.tableName, record.id, row);
    return entity;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.deleteRow(this.tableName, id);
  }
}
