import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { registerTools } from '../../mcp-lib/tools';
import { getAccessTokenUserId } from '../../mcp-lib/redis';
import { SITE_URL } from '../../mcp-lib/constants';

const mcpHandler = createMcpHandler(
  (server: McpServer) => {
    registerTools(server);
  },
  {
    serverInfo: {
      name: 'tidal-cli',
      version: '1.1.2',
    },
  },
  {
    streamableHttpEndpoint: '/api/mcp',
    maxDuration: 60,
  },
);

const verifyToken = async (_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  const userId = await getAccessTokenUserId(bearerToken);
  if (!userId) return undefined;

  return {
    token: bearerToken,
    clientId: 'tidal-cli',
    scopes: [],
    extra: { userId },
  };
};

const handler = withMcpAuth(mcpHandler, verifyToken, {
  required: true,
  resourceUrl: SITE_URL,
});

export { handler as GET, handler as POST, handler as DELETE };
