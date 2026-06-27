import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const scriptPath = join(process.cwd(), '..', '..', '..', 'scripts', 'install.ps1');
    const content = readFileSync(scriptPath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return new NextResponse('Install script not found', { status: 404 });
  }
}
