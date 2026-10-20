export type AppPreview = { label: string; port: number; path: string };

/** Parses `TRIDE_APP_PREVIEWS`, e.g. `Shop:7410,API docs:7420/docs`. Invalid entries are skipped. */
export function getAppPreviews(): AppPreview[] {
	return (process.env.TRIDE_APP_PREVIEWS ?? '')
		.split(',')
		.map((entry) => /^\s*([^:]+?)\s*:\s*(\d+)(\/\S*)?\s*$/.exec(entry))
		.filter(
			(match): match is RegExpExecArray =>
				match !== null && Number(match[2]) > 0 && Number(match[2]) < 65536
		)
		.map((match) => ({ label: match[1], port: Number(match[2]), path: match[3] ?? '/' }));
}
