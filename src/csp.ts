// Fixed only to keep this reproduction small. Real apps need a fresh nonce per response.
export const NONCE = "dGFuc3RhY2stbm9uY2UtcmVwcm8=";
export const POLICY = `script-src 'nonce-${NONCE}' 'strict-dynamic'`;
export const MODES = ["header", "meta", "none", "trusted-types"] as const;
export type Mode = (typeof MODES)[number];

export function getMode(value: unknown): Mode {
	return MODES.includes(value as Mode) ? (value as Mode) : "header";
}
