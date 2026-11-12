export interface BaseEntityProps {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export abstract class Entity<Props> {
  protected readonly _id: string;
  protected readonly props: Props;
  protected readonly _createdAt: string;
  protected _updatedAt: string;

  protected constructor(props: Props & Partial<BaseEntityProps>, id?: string) {
    const now = new Date().toISOString();
    this._id = id || props.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this._createdAt = props.createdAt || now;
    this._updatedAt = props.updatedAt || now;
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  protected markUpdated(): void {
    this._updatedAt = new Date().toISOString();
  }
}
