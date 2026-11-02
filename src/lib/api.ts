const API_URL = '/api/index.php';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  id?: string | number;
  body?: unknown;
};

/** Appel de l'API PHP (même domaine, cookie de session admin envoyé automatiquement). */
export async function api<T = unknown>(route: string, { method = 'GET', id, body }: ApiOptions = {}): Promise<T> {
  const query = new URLSearchParams({ r: route });
  if (id !== undefined) query.set('id', String(id));

  const res = await fetch(`${API_URL}?${query}`, {
    method,
    credentials: 'same-origin',
    headers: {
      'X-Requested-With': 'safetrip',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // réponse non JSON (ex. erreur serveur HTML)
  }
  if (!res.ok) throw new Error(data?.error || `Erreur serveur (${res.status})`);
  return data as T;
}
