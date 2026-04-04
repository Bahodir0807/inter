type WithId = Record<string, unknown> & { _id?: unknown; id?: unknown };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeIds<T>(payload: T): T {
  if (Array.isArray(payload)) {
    return payload.map(item => normalizeIds(item)) as T;
  }

  if (!isPlainObject(payload)) {
    return payload;
  }

  const source = payload as WithId;
  const next: Record<string, unknown> = {};

  if (source._id != null && source.id == null) {
    next.id = String(source._id);
  }

  for (const [key, value] of Object.entries(source)) {
    if (key === '_id') {
      continue;
    }

    next[key] = normalizeIds(value);
  }

  return next as T;
}
