import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import { getMode, POLICY } from "./csp";

const handler = createStartHandler(defaultStreamHandler);

export default {
	async fetch(request: Request) {
		const mode = getMode(new URL(request.url).searchParams.get("mode"));
		const response = await handler(request);
		const headers = new Headers(response.headers);
		if (mode === "header" || mode === "trusted-types") {
			headers.set(
				"Content-Security-Policy",
				POLICY +
					(mode === "trusted-types"
						? "; require-trusted-types-for 'script'"
						: ""),
			);
		}
		headers.set("Cache-Control", "no-store");
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	},
};
