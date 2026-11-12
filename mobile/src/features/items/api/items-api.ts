import { apiRequest } from '../../../lib/api-client';

export type ItemStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';
export type ItemPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SupabaseItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ItemStatus;
  priority: ItemPriority;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemInput {
  title: string;
  description?: string;
  category?: string;
  status?: ItemStatus;
  priority?: ItemPriority;
}

export async function getItems(statusFilter?: string): Promise<SupabaseItem[]> {
  const query =
    statusFilter && statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
  const res = await apiRequest<{ items: SupabaseItem[] }>(`/items${query}`, {
    method: 'GET',
  });
  return res.data.items;
}

export async function createItem(
  input: CreateItemInput,
): Promise<SupabaseItem> {
  const res = await apiRequest<{ item: SupabaseItem }>('/items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data.item;
}

export async function updateItemStatus(
  id: string,
  status: ItemStatus,
): Promise<SupabaseItem> {
  const res = await apiRequest<{ item: SupabaseItem }>(`/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data.item;
}

export async function deleteItem(id: string): Promise<string> {
  const res = await apiRequest<{ deletedId: string }>(`/items/${id}`, {
    method: 'DELETE',
  });
  return res.data.deletedId;
}
