import { api } from './api';

export interface Testimonial {
  id?: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  createdAt?: number;
}

function normalizeTestimonial(data: Record<string, unknown>, id: string): Testimonial {
  const raw = data as Record<string, unknown>;
  const createdAt = typeof raw.createdAt === 'number'
    ? raw.createdAt
    : typeof raw.created_at === 'number'
      ? raw.created_at
      : Date.now();

  return {
    name: typeof raw.name === 'string' ? raw.name : '',
    role: typeof raw.role === 'string' ? raw.role : '',
    text: typeof raw.text === 'string' ? raw.text : '',
    rating: typeof raw.rating === 'number' ? raw.rating : 5,
    id,
    createdAt,
  } as Testimonial;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const data = await api<Array<Record<string, unknown> & { id?: string }>>('testimonials');
  return (data || []).map((item) => normalizeTestimonial(item, item.id || ''));
}

export async function addTestimonial(testimonial: Omit<Testimonial, 'id' | 'createdAt'>): Promise<string> {
  const { id } = await api<{ id: string }>('testimonials', { method: 'POST', body: testimonial });
  return id;
}

export async function removeTestimonial(id: string): Promise<void> {
  await api('testimonials', { method: 'DELETE', id });
}

export async function updateTestimonial(id: string, testimonial: Partial<Omit<Testimonial, 'id' | 'createdAt'>>): Promise<void> {
  await api('testimonials', { method: 'PUT', id, body: testimonial });
}
