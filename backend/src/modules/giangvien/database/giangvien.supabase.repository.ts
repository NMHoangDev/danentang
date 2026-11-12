import fs from 'fs';
import path from 'path';
import {
  getSupabaseAdapter,
  SupabaseTableAdapter,
} from '../../../config/supabase.config.js';
import { GiangVienData, GiangVienEntity } from '../domain/giangvien.entity.js';
import { GiangVienRepositoryPort } from './giangvien.repository.port.js';

export class GiangVienSupabaseRepository implements GiangVienRepositoryPort {
  private readonly tableName = 'GiangVien';
  private readonly store: SupabaseTableAdapter;
  private readonly fallbackFilePath: string;

  constructor(store: SupabaseTableAdapter = getSupabaseAdapter()) {
    this.store = store;
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.fallbackFilePath = path.join(dataDir, 'local-giangvien.json');
    this.ensureSeedData();
  }

  private ensureSeedData(): void {
    if (!fs.existsSync(this.fallbackFilePath)) {
      const initial: GiangVienData[] = [
        {
          IDGV: 'GV001',
          Fullname: 'TS. Nguyễn Văn An',
          Image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          SumClass: 5,
        },
        {
          IDGV: 'GV002',
          Fullname: 'ThS. Trần Thị Mai',
          Image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
          SumClass: 8,
        },
        {
          IDGV: 'GV003',
          Fullname: 'PGS.TS. Lê Hoàng Nam',
          Image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          SumClass: 12,
        },
        {
          IDGV: 'GV004',
          Fullname: 'ThS. Phạm Thu Hà',
          Image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
          SumClass: 6,
        },
        {
          IDGV: 'GV005',
          Fullname: 'TS. Vũ Đức Minh',
          Image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          SumClass: 4,
        },
      ];
      fs.writeFileSync(this.fallbackFilePath, JSON.stringify(initial, null, 2), 'utf-8');
    }
  }

  private readFallback(): GiangVienData[] {
    try {
      const raw = fs.readFileSync(this.fallbackFilePath, 'utf-8');
      return JSON.parse(raw) as GiangVienData[];
    } catch {
      return [];
    }
  }

  private writeFallback(data: GiangVienData[]): void {
    fs.writeFileSync(this.fallbackFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async findAll(search?: string): Promise<GiangVienEntity[]> {
    if (this.store.getMode() === 'SUPABASE_LOCAL_PERSISTENT_ENGINE') {
      let list = this.readFallback();
      if (search && search.trim().length > 0) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (gv) =>
            gv.IDGV.toLowerCase().includes(q) ||
            gv.Fullname.toLowerCase().includes(q),
        );
      }
      return list.map((item) => new GiangVienEntity(item));
    }

    // Supabase Cloud
    const rows = await this.store.selectAll<Record<string, unknown>>(this.tableName);
    let items = (rows as unknown as GiangVienData[]) || [];
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (gv) =>
          gv.IDGV.toLowerCase().includes(q) ||
          gv.Fullname.toLowerCase().includes(q),
      );
    }
    return items.map((item) => new GiangVienEntity(item));
  }

  async findById(idgv: string): Promise<GiangVienEntity | null> {
    const cleanId = idgv.trim().toUpperCase();
    if (this.store.getMode() === 'SUPABASE_LOCAL_PERSISTENT_ENGINE') {
      const list = this.readFallback();
      const found = list.find((item) => item.IDGV === cleanId);
      return found ? new GiangVienEntity(found) : null;
    }

    const row = await this.store.selectById<Record<string, unknown>>(this.tableName, cleanId);
    if (!row) return null;
    return new GiangVienEntity(row as unknown as GiangVienData);
  }

  async save(entity: GiangVienEntity): Promise<GiangVienEntity> {
    const data = entity.toData();
    if (this.store.getMode() === 'SUPABASE_LOCAL_PERSISTENT_ENGINE') {
      const list = this.readFallback();
      const existingIdx = list.findIndex((x) => x.IDGV === data.IDGV);
      if (existingIdx >= 0) {
        list[existingIdx] = data;
      } else {
        list.push(data);
      }
      this.writeFallback(list);
      return entity;
    }

    await this.store.upsertRow(this.tableName, data.IDGV, data as unknown as Record<string, unknown>);
    return entity;
  }

  async update(entity: GiangVienEntity): Promise<GiangVienEntity> {
    return this.save(entity);
  }

  async delete(idgv: string): Promise<boolean> {
    const cleanId = idgv.trim().toUpperCase();
    if (this.store.getMode() === 'SUPABASE_LOCAL_PERSISTENT_ENGINE') {
      const list = this.readFallback();
      const filtered = list.filter((x) => x.IDGV !== cleanId);
      const deleted = filtered.length < list.length;
      if (deleted) {
        this.writeFallback(filtered);
      }
      return deleted;
    }

    return this.store.deleteRow(this.tableName, cleanId);
  }

  async getStats(): Promise<{ totalTeachers: number; totalClasses: number; avgClasses: number }> {
    const list = await this.findAll();
    const totalTeachers = list.length;
    const totalClasses = list.reduce((acc, curr) => acc + curr.SumClass, 0);
    const avgClasses = totalTeachers > 0 ? Number((totalClasses / totalTeachers).toFixed(1)) : 0;
    return { totalTeachers, totalClasses, avgClasses };
  }
}
