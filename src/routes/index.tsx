import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MODES } from "../csp";

declare global {
	interface Window {
		__reproRuns?: number;
	}
}

export const Route = createFileRoute("/")({
	scripts: () => [
		{
			"data-repro": "inline-counter",
			children: "window.__reproRuns = (window.__reproRuns || 0) + 1;",
		},
	],
	component: Home,
});

function Home() {
	const { mode } = Route.useSearch();
	const [count, setCount] = useState(0);
	const [scripts, setScripts] = useState<object[] | null>(null);
	const [runs, setRuns] = useState<number | null>(null);

	useEffect(() => {
		// Wait for Scripts' effects. Only read the DOM; do not patch browser APIs.
		const timer = setTimeout(() => {
			setRuns(window.__reproRuns ?? 0);
			setScripts(
				Array.from(
					document.head.querySelectorAll<HTMLScriptElement>(
						'script[data-repro="inline-counter"]',
					),
				).map((script) => ({
					text: script.textContent,
					nonceAttribute: script.getAttribute("nonce"),
					nonceProperty: script.nonce,
				})),
			);
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<main>
			<h1>Inline script nonce reproduction</h1>
			<p>
				Mode: <strong>{mode}</strong>
			</p>
			<nav aria-label="CSP mode">
				{MODES.map((value) => (
					<a key={value} href={`/?mode=${value}`}>
						{value}
					</a>
				))}
			</nav>
			<p>These links reload the document so the browser receives a new CSP.</p>
			<button type="button" onClick={() => setCount(count + 1)}>
				Clicked {count} times
			</button>
			<h2>Route inline scripts in &lt;head&gt; after hydration</h2>
			<p>
				Expected: 0. With the header, the affected version adds the route script
				here.
			</p>
			<p>
				Inline script executions:{" "}
				<output data-testid="runs">{runs ?? "Waiting"}</output>. Expected: 1.
			</p>
			<pre data-testid="scripts">
				{scripts === null
					? "Waiting for hydration…"
					: JSON.stringify(scripts, null, 2)}
			</pre>
			<p>
				The Trusted Types case should show a TrustedScript assignment error.
			</p>
		</main>
	);
}
