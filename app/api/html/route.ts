import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_PREFIX = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')}/storage/v1/object/public/batches/`

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Paramètre url manquant.', { status: 400 })
  }

  // Sécurité : uniquement les fichiers du bucket batches de notre projet
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const allowedPrefix = `${supabaseUrl}/storage/v1/object/public/batches/`
  if (!url.startsWith(allowedPrefix)) {
    return new NextResponse('URL non autorisée.', { status: 403 })
  }

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return new NextResponse('Fichier introuvable.', { status: 404 })
    }
    const html = await res.text()
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('Erreur lors de la récupération du fichier.', { status: 500 })
  }
}
