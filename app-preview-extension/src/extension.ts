import * as vscode from 'vscode';
import { AppPreviewService } from './app-preview-service';
import { COMMANDS, CONTEXT_KEYS } from './constants';
import { getAppPreviews } from './env';

export function activate(context: vscode.ExtensionContext): void {
	const previews = new AppPreviewService(getAppPreviews());
	void vscode.commands.executeCommand('setContext', CONTEXT_KEYS.ENABLED, previews.enabled);
	previews.start();
	context.subscriptions.push(
		previews,
		vscode.commands.registerCommand(COMMANDS.OPEN, (label?: string) => previews.open(label))
	);
}

export function deactivate(): void {}
