import { NextRequest, NextResponse } from 'next/server';
import { getCounter, updateCounter } from '@/lib/counters';
import { uploadCounterImage, deleteCounterImage } from '@/lib/supabaseStorage';

type Params = Promise<{ id: string }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params;
  const counter = await getCounter(id);
  if (!counter) {
    return NextResponse.json({ error: 'Counter not found' }, { status: 404 });
  }
  return NextResponse.json({ image_url: counter.image_url ?? null });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    const existing = await getCounter(id);
    if (!existing) {
      return NextResponse.json({ error: 'Counter not found' }, { status: 404 });
    }

    if (existing.image_url) {
      await deleteCounterImage(existing.image_url);
    }

    const { publicUrl } = await uploadCounterImage(id, file);
    const updated = await updateCounter(id, { image_url: publicUrl });

    return NextResponse.json({ image_url: publicUrl, counter: updated }, { status: 200 });
  } catch (error) {
    console.error('Failed to upload counter image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const counter = await getCounter(id);
    if (!counter) {
      return NextResponse.json({ error: 'Counter not found' }, { status: 404 });
    }

    if (counter.image_url) {
      await deleteCounterImage(counter.image_url);
      await updateCounter(id, { image_url: null });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete counter image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
