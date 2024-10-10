// src/app/api/crawler/route.ts
import { NextResponse } from 'next/server';
import crawlerManager = require('../../../../crawlerManager');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const url = searchParams.get('url');

  if (action === 'start') {
    const result = crawlerManager.startCrawler(url || '');
    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }
  } else if (action === 'stop') {
    const result = crawlerManager.stopCrawler();
    if (result.success) {
      return NextResponse.json({ message: result.message });
    } else {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }
  } else {
    return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
  }
}
