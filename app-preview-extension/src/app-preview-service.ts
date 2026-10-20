import * as http from 'http';
import * as vscode from 'vscode';
import { COMMANDS, PROBE, VIEW_IDS } from './constants';
import type { AppPreview } from './env';

function isUp(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const req = http.get(
			{ host: '127.0.0.1', port, path: '/', timeout: PROBE.TIMEOUT_MS },
			(res) => {
				res.resume();
				resolve(true);
			}
		);
		req.on('timeout', () => req.destroy());
		req.on('error', () => resolve(false));
	});
}

function getPanelHtml(uri: vscode.Uri, title: string): string {
	const src = uri.toString(true).replace(/"/g, '&quot;');
	const safeTitle = title.replace(/[<>"&]/g, '');
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src ${uri.scheme}://${uri.authority}; style-src 'unsafe-inline';">
	<style>html, body, iframe { margin: 0; padding: 0; width: 100%; height: 100%; border: 0; overflow: hidden; background: #fff; }</style>
</head>
<body data-loaded-at="${Date.now()}">
	<iframe src="${src}" title="${safeTitle}"></iframe>
</body>
</html>`;
}

class AppPreviewHandle implements vscode.Disposable {
	private readonly statusBarItem: vscode.StatusBarItem;
	private probeTimer: NodeJS.Timeout | undefined;
	private panel: vscode.WebviewPanel | undefined;
	private opening: Promise<void> | undefined;
	private disposed = false;

	constructor(
		readonly app: AppPreview,
		priority: number
	) {
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
		this.statusBarItem.text = `$(play) ${app.label}`;
		this.statusBarItem.tooltip = `Open ${app.label}`;
		this.statusBarItem.command = {
			command: COMMANDS.OPEN,
			title: `Open ${app.label}`,
			arguments: [app.label]
		};
	}

	start(): void {
		void this.waitUntilUp();
	}

	open(): Promise<void> {
		this.opening ??= this.load().finally(() => (this.opening = undefined));
		return this.opening;
	}

	private async load(): Promise<void> {
		if (!(await isUp(this.app.port))) {
			void vscode.window.showWarningMessage(
				`${this.app.label} isn't responding. Try again in a few seconds.`
			);
			return;
		}
		if (this.disposed) {
			return;
		}
		this.statusBarItem.show();
		const uri = await vscode.env.asExternalUri(
			vscode.Uri.parse(`http://localhost:${this.app.port}${this.app.path}`)
		);
		if (this.disposed) {
			return;
		}
		if (this.panel) {
			this.panel.reveal(undefined, true);
		} else {
			const panel = vscode.window.createWebviewPanel(
				VIEW_IDS.PANEL,
				this.app.label,
				{ viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
				{ enableScripts: true, retainContextWhenHidden: true }
			);
			panel.onDidDispose(() => {
				if (this.panel === panel) {
					this.panel = undefined;
				}
			});
			this.panel = panel;
		}
		this.panel.webview.html = getPanelHtml(uri, this.app.label);
	}

	private async waitUntilUp(): Promise<void> {
		const up = await isUp(this.app.port);
		if (this.disposed) {
			return;
		}
		if (up) {
			this.statusBarItem.show();
			return;
		}
		this.probeTimer = setTimeout(() => void this.waitUntilUp(), PROBE.INTERVAL_MS);
	}

	dispose(): void {
		this.disposed = true;
		clearTimeout(this.probeTimer);
		this.panel?.dispose();
		this.statusBarItem.dispose();
	}
}

export class AppPreviewService implements vscode.Disposable {
	private readonly handles: AppPreviewHandle[];

	constructor(apps: AppPreview[]) {
		this.handles = apps.map((app, index) => new AppPreviewHandle(app, 100 - index));
	}

	get enabled(): boolean {
		return this.handles.length > 0;
	}

	start(): void {
		this.handles.forEach((handle) => handle.start());
	}

	async open(label?: string): Promise<void> {
		const handle =
			this.handles.find((h) => h.app.label === label) ??
			(this.handles.length === 1
				? this.handles[0]
				: (
						await vscode.window.showQuickPick(
							this.handles.map((h) => ({ label: h.app.label, handle: h })),
							{ placeHolder: 'Open which app?' }
						)
					)?.handle);
		await handle?.open();
	}

	dispose(): void {
		this.handles.forEach((handle) => handle.dispose());
	}
}
