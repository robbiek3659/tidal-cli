import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '../../mcp-lib/tidal-oauth';

// RFC 7591 Dynamic Client Registration
// Claude Desktop registers itself as an OAuth client before starting the auth flow.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const clientId = generateId();

  return NextResponse.json({
    client_id: clientId,
    client_name: body.client_name || 'MCP Client',
    redirect_uris: body.redirect_uris || [],
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  }, {
    status: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
