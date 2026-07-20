import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  const url = `${API_URL}/api/inbox/counts?workspace_id=00000000-0000-0000-0000-000000000000`;
  try {
    const res = await fetch(url, { next: { revalidate: 10 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ all: 0, unassigned: 0, assigned: 0, resolved: 0 });
  }
}
