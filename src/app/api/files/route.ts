// src/app/api/files/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const directoryPath = path.join(process.cwd(), '/dist/public', 'data');

  try {
    const files = fs.readdirSync(directoryPath);
    const csvFiles = files.filter((file) => file.endsWith('.csv'));
    return NextResponse.json({ files: csvFiles });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Unable to scan files.' }, { status: 500 });
  }
}
