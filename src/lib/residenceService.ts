import { api } from './api';

export interface Residence {
  id?: string;
  title: string;
  location: string;
  price: string;
  originalPrice?: string;
  blockedDates?: string[];
  beds: number;
  baths: number;
  sqft?: number;
  imageUrl: string;
  images?: string[];
  tags: string[];
  createdAt?: number; // unix ms
}

function normalizeResidence(data: Record<string, unknown>, id: string): Residence {
  const raw = data as Record<string, unknown>;
  const createdAt = typeof raw.createdAt === 'number'
    ? raw.createdAt
    : typeof raw.created_at === 'number'
      ? raw.created_at
      : Date.now();

  const images = Array.isArray(raw.images) ? (raw.images as string[]) : [];
  const tags = Array.isArray(raw.tags) ? (raw.tags as string[]) : [];

  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    location: typeof raw.location === 'string' ? raw.location : '',
    price: typeof raw.price === 'string' ? raw.price : '',
    originalPrice: typeof raw.originalPrice === 'string' ? raw.originalPrice : typeof raw.original_price === 'string' ? raw.original_price : '',
    blockedDates: Array.isArray(raw.blocked_dates) ? raw.blocked_dates.filter((value): value is string => typeof value === 'string') : [],
    beds: typeof raw.beds === 'number' ? raw.beds : 0,
    baths: typeof raw.baths === 'number' ? raw.baths : 0,
    sqft: typeof raw.sqft === 'number' ? raw.sqft : undefined,
    imageUrl: typeof raw.imageUrl === 'string'
      ? raw.imageUrl
      : typeof raw.image_url === 'string'
        ? raw.image_url
        : '',
    images,
    tags,
    id,
    createdAt,
  } as Residence;
}

export async function getResidences(): Promise<Residence[]> {
  const data = await api<Array<Record<string, unknown> & { id?: string }>>('residences');
  return (data || []).map((item) => normalizeResidence(item, item.id || ''));
}

export async function addResidence(residence: Omit<Residence, 'id' | 'createdAt'>): Promise<string> {
  const { id } = await api<{ id: string }>('residences', { method: 'POST', body: residence });
  return id;
}

export async function removeResidence(id: string): Promise<void> {
  await api('residences', { method: 'DELETE', id });
}

export async function updateResidence(id: string, residence: Partial<Omit<Residence, 'id' | 'createdAt'>>): Promise<void> {
  await api('residences', { method: 'PUT', id, body: residence });
}
