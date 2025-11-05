import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const DEFAULT_BUCKET = 'Counter_images';
const DEFAULT_STORAGE_ENDPOINT = 'https://lxfnryfvovzpjctyfuza.storage.supabase.co/storage/v1';
let client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase URL or anon key is not configured. Please set SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_URL and SYNC_COUNTER_NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  client = createClient(url, anonKey);
  const storageEndpoint = getStorageEndpoint();
  if (storageEndpoint && client.storage) {
    configureStorageEndpoint(client.storage, storageEndpoint);
  }
  return client;
}

function buildObjectPath(counterId: string, fileExtension: string | null): string {
  const safeExt = fileExtension?.replace(/[^a-zA-Z0-9.]/g, '') || 'png';
  const uniqueId = randomUUID();
  return `counter-images/${counterId}/${uniqueId}.${safeExt}`;
}

function getBucketName(): string {
  return process.env.SYNC_COUNTER_SUPABASE_BUCKET?.trim() || DEFAULT_BUCKET;
}

function getStorageEndpoint(): string {
  return normalizeStorageEndpoint(process.env.SYNC_COUNTER_SUPABASE_STORAGE_URL?.trim() || DEFAULT_STORAGE_ENDPOINT);
}

function configureStorageEndpoint(storageClient: SupabaseClient['storage'], endpoint: string) {
  const storage = storageClient as unknown as { url?: string };
  if (storage.url !== endpoint) {
    storage.url = endpoint;
  }
}

function normalizeStorageEndpoint(endpoint: string | undefined): string {
  if (!endpoint) return DEFAULT_STORAGE_ENDPOINT;
  const trimmed = endpoint.replace(/\/$/, '');
  if (trimmed.endsWith('/s3')) {
    return trimmed.slice(0, -3);
  }
  return trimmed;
}

function extractPathFromPublicUrl(publicUrl: string): string | null {
  try {
    const bucket = getBucketName();
    const url = new URL(publicUrl);
    // https://lxfnryfvovzpjctyfuza.supabase.co/storage/v1/object/public/Counter_images/IMG_5131L.jpeg
    const markers = [
      `/storage/v1/object/public/${bucket}/`,
      `/object/public/${bucket}/`
    ];
    const marker = markers.find(path => url.pathname.includes(path));
    if (!marker) return null;
    const idx = url.pathname.indexOf(marker);
    return decodeURIComponent(url.pathname.slice(idx + marker.length));
  } catch (error) {
    console.warn('Failed to extract Supabase storage path from URL:', error);
    return null;
  }
}

export async function uploadCounterImage(counterId: string, file: File): Promise<{ publicUrl: string; path: string }> {
  const supabase = getSupabaseClient();
  const bucket = getBucketName();
  const fileExt = file.name?.split('.').pop() || file.type.split('/')[1] || 'png';
  const path = buildObjectPath(counterId, fileExt);
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/png'
  });

  if (error) {
    console.error('Failed to upload counter image to Supabase:', error);
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

export async function deleteCounterImage(publicUrl: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const bucket = getBucketName();
  const path = extractPathFromPublicUrl(publicUrl);
  if (!path) {
    console.warn('Cannot delete counter image: could not parse path from URL');
    return false;
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error('Failed to delete counter image from Supabase:', error);
    return false;
  }
  return true;
}
