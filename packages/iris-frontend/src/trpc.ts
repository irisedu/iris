import type { AppRouter } from 'iris-backend/trpc';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

export default createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: '/trpc'
		})
	]
});
