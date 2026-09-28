import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { getMode, POLICY } from "../csp";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	validateSearch: (search) => ({ mode: getMode(search.mode) }),
	loaderDeps: ({ search }) => ({ mode: search.mode }),
	loader: ({ deps }) => deps,
	head: ({ loaderData }) => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "TanStack inline script nonce reproduction" },
			...(loaderData?.mode === "meta"
				? [{ httpEquiv: "Content-Security-Policy", content: POLICY }]
				: []),
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: ({ children }) => (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	),
});
