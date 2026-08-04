import { NextRequest, NextResponse } from 'next/server';

const getBackendBaseUrl = () => {
  const url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return url.replace(/\/+$/, '');
};

async function handleWebhook(req: NextRequest) {
  const search = req.nextUrl.search;
  const baseUrl = getBackendBaseUrl();
  const targetUrl = `${baseUrl}/webhook/instagram${search}`;

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

    const resBody = await backendRes.arrayBuffer();
    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => resHeaders.set(key, value));

    return new NextResponse(resBody, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error('Webhook proxy error:', err);
    return NextResponse.json({ detail: `Webhook proxy error: ${err?.message || err}` }, { status: 502 });
  }
}

export const GET = handleWebhook;
export const POST = handleWebhook;
