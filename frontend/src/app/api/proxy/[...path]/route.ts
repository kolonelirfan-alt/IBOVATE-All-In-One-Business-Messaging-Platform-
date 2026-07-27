import { NextRequest, NextResponse } from 'next/server';

const getBackendBaseUrl = () => {
  const url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return url.replace(/\/+$/, '');
};

async function handleProxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const rawPath = path ? path.join('/') : '';
  const search = req.nextUrl.search;
  const baseUrl = getBackendBaseUrl();
  
  const cleanPath = rawPath.startsWith('api/') ? rawPath : `api/${rawPath}`;
  const targetUrl = `${baseUrl}/${cleanPath}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  });

  try {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer();

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store'
    });

    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      resHeaders.set(key, value);
    });

    const resBody = await backendRes.arrayBuffer();

    return new NextResponse(resBody, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error('Backend proxy error:', err);
    return NextResponse.json({ detail: `Backend proxy error: ${err?.message || err}` }, { status: 502 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
