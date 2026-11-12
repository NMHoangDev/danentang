export interface GiangVienData {
  IDGV: string;
  Fullname: string;
  Image: string;
  SumClass: number;
}

export class GiangVienEntity {
  private readonly _idgv: string;
  private _fullname: string;
  private _image: string;
  private _sumClass: number;

  constructor(data: GiangVienData) {
    if (!data.IDGV || data.IDGV.trim().length === 0) {
      throw new Error('Mã Giảng viên (IDGV) không được để trống');
    }
    if (!data.Fullname || data.Fullname.trim().length === 0) {
      throw new Error('Họ và tên (Fullname) không được để trống');
    }

    this._idgv = data.IDGV.trim().toUpperCase();
    this._fullname = data.Fullname.trim();
    this._image = data.Image ? data.Image.trim() : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    this._sumClass = Number(data.SumClass) || 0;
  }

  get IDGV(): string {
    return this._idgv;
  }

  get Fullname(): string {
    return this._fullname;
  }

  get Image(): string {
    return this._image;
  }

  get SumClass(): number {
    return this._sumClass;
  }

  updateDetails(partial: Partial<Omit<GiangVienData, 'IDGV'>>): void {
    if (partial.Fullname !== undefined) {
      this._fullname = partial.Fullname.trim();
    }
    if (partial.Image !== undefined) {
      this._image = partial.Image.trim();
    }
    if (partial.SumClass !== undefined) {
      this._sumClass = Number(partial.SumClass) || 0;
    }
  }

  toData(): GiangVienData {
    return {
      IDGV: this._idgv,
      Fullname: this._fullname,
      Image: this._image,
      SumClass: this._sumClass,
    };
  }
}
