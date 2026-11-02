import { api } from './api';

export type RequestStatus = 'nouveau' | 'contacte' | 'confirme' | 'annule';

export interface ReservationRequest {
  id: number;
  residence_id: string | null;
  residence_title: string | null;
  residence_location: string | null;
  source: 'modal' | 'details';
  booking_date: string | null;
  nights: number | null;
  status: RequestStatus;
  created_at: string;
}

export async function trackReservationClick(
  residenceId: string | undefined,
  source: 'modal' | 'details',
  details?: { title?: string; location?: string; bookingDate?: string; nights?: number }
) {
  if (!residenceId) return;
  try {
    await api('click', {
      method: 'POST',
      body: {
        residence_id: residenceId,
        source,
        residence_title: details?.title || null,
        residence_location: details?.location || null,
        booking_date: details?.bookingDate || null,
        nights: details?.nights || null,
      },
    });
  } catch (error) {
    console.warn('Analytics reservation click not recorded:', error);
  }
}

export async function trackVisit() {
  try {
    if (sessionStorage.getItem('safetrip_visit_recorded')) return;
    sessionStorage.setItem('safetrip_visit_recorded', '1');
  } catch {
    // sessionStorage indisponible : on enregistre quand même la visite
  }
  try {
    await api('visit', { method: 'POST', body: {} });
  } catch (error) {
    console.warn('Analytics visit not recorded:', error);
  }
}

export async function getAnalytics() {
  const data = await api<{ clicks: { residence_id: string | null; created_at: string }[]; visits: { id: number; created_at: string }[] }>('analytics');
  return { clicks: data.clicks || [], visits: data.visits || [] };
}

export async function getReservationRequests(): Promise<ReservationRequest[]> {
  return (await api<ReservationRequest[]>('requests')) || [];
}

export async function updateRequestStatus(id: number, status: RequestStatus): Promise<void> {
  await api('requests', { method: 'PUT', id, body: { status } });
}
