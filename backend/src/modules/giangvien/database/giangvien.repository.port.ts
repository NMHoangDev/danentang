import { GiangVienData, GiangVienEntity } from '../domain/giangvien.entity.js';

export interface GiangVienRepositoryPort {
  findAll(search?: string): Promise<GiangVienEntity[]>;
  findById(idgv: string): Promise<GiangVienEntity | null>;
  save(entity: GiangVienEntity): Promise<GiangVienEntity>;
  update(entity: GiangVienEntity): Promise<GiangVienEntity>;
  delete(idgv: string): Promise<boolean>;
  getStats(): Promise<{ totalTeachers: number; totalClasses: number; avgClasses: number }>;
}
