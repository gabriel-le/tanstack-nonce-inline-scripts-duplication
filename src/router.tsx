import { createRouter } from "@tanstack/react-router";
import { NONCE } from "./csp";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	return createRouter({ routeTree, ssr: { nonce: NONCE } });
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
