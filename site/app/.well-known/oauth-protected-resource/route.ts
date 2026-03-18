import { protectedResourceHandler, metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { SITE_URL } from '../../mcp-lib/constants';

export const GET = protectedResourceHandler({
  authServerUrls: [SITE_URL],
  resourceUrl: SITE_URL,
});

export const OPTIONS = metadataCorsOptionsRequestHandler();
