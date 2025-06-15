import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('✅ Extension Activated: Glottis');

	const diagnosticCollection = vscode.languages.createDiagnosticCollection('translation-missing');
	context.subscriptions.push(diagnosticCollection);

	const disposable = vscode.commands.registerCommand('glottis.fixTranslationsFiles', async () => {
		const files = await vscode.window.showOpenDialog({
			canSelectMany: true,
			openLabel: 'Select language JSON files',
			filters: { 'JSON files': ['json'] }
		});

		if (!files || files.length < 2) {
			vscode.window.showErrorMessage('Please select at least two language JSON files.');
			return;
		}

		const referenceFilePath = files[0].fsPath;
		const referenceContent = fs.readFileSync(referenceFilePath, 'utf-8');
		const referenceJson = JSON.parse(referenceContent);
		const referenceFlat = flattenJSON(referenceJson);

		const allFilesData: {
			path: string,
			raw: any,
			flat: Record<string, any>
		}[] = [];

		for (const file of files) {
			const content = fs.readFileSync(file.fsPath, 'utf-8');
			const json = JSON.parse(content);
			const flat = flattenJSON(json);
			allFilesData.push({ path: file.fsPath, raw: json, flat });
		}

		const missingKeysReport: string[] = [];
		const diffsToOpen: { left: vscode.Uri; right: vscode.Uri; title: string }[] = [];

		for (const fileData of allFilesData) {
			if (fileData.path === referenceFilePath) continue;

			const fileName = path.basename(fileData.path);
			const missingKeys = Object.keys(referenceFlat).filter(k => !(k in fileData.flat));
			if (missingKeys.length === 0) continue;

			missingKeysReport.push(`📄 ${fileName} is missing ${missingKeys.length} keys:\n  - ${missingKeys.join('\n  - ')}`);

			// Show diagnostics
			const document = await vscode.workspace.openTextDocument(fileData.path);
			const diagnostics: vscode.Diagnostic[] = [];
			for (const key of missingKeys) {
				const text = document.getText();
                                const index = text.split('\n').findIndex(l => l.includes('{'));
                                const line = index === -1 ? 0 : index; // fallback to first line
				const range = new vscode.Range(line, 0, line, 0);
				diagnostics.push(new vscode.Diagnostic(range, `Missing key: ${key}`, vscode.DiagnosticSeverity.Warning));
			}
			diagnosticCollection.set(document.uri, diagnostics);

			// Prepare diff (before vs after) for later
			const originalContent = fs.readFileSync(fileData.path, 'utf-8');
			const tempPath = fileData.path + '.temp';
			fs.writeFileSync(tempPath, originalContent, 'utf-8');

			// Fill missing keys in memory
			for (const key of missingKeys) {
				deepSet(fileData.raw, key, 'MISSING_TRANSLATION');
			}

			const updatedContent = JSON.stringify(fileData.raw, null, 2);
			const tempUpdatedPath = fileData.path + '.new.json';
			fs.writeFileSync(tempUpdatedPath, updatedContent, 'utf-8');

			diffsToOpen.push({
				left: vscode.Uri.file(tempPath),
				right: vscode.Uri.file(tempUpdatedPath),
				title: `Preview: ${fileName}`
			});
		}

		if (missingKeysReport.length === 0) {
			vscode.window.showInformationMessage('✅ All files are in sync!');
		} else {
			const output = vscode.window.createOutputChannel('Translation Sync');
			output.clear();
			output.appendLine('🚨 Missing Translation Keys:\n');
			output.appendLine(missingKeysReport.join('\n\n'));
			output.show();

			const confirm = await vscode.window.showInformationMessage(
				'Missing keys detected. Do you want to apply changes and view diffs?',
				{ modal: true },
				'Yes',
				'No'
			);

			if (confirm === 'Yes') {
				let currentColumn = vscode.ViewColumn.One;

				for (const diff of diffsToOpen) {
					await vscode.commands.executeCommand(
						'vscode.diff',
						diff.left,
						diff.right,
						diff.title,
						{ viewColumn: currentColumn, preserveFocus: false }
					);

					// Cycle through columns 1, 2, 3 to force new tab opens
					currentColumn =
						currentColumn === vscode.ViewColumn.One
							? vscode.ViewColumn.Two
							: currentColumn === vscode.ViewColumn.Two
								? vscode.ViewColumn.Three
								: vscode.ViewColumn.One;

					await delay(200); // slight pause still helps
				}

			}
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

function flattenJSON(obj: any, prefix = ''): Record<string, string> {
	let result: Record<string, string> = {};
	for (const key in obj) {
		const newKey = prefix ? `${prefix}.${key}` : key;
		if (typeof obj[key] === 'object' && obj[key] !== null) {
			Object.assign(result, flattenJSON(obj[key], newKey));
		} else {
			result[newKey] = obj[key];
		}
	}
	return result;
}

function deepSet(obj: any, keyPath: string, value: string) {
	const keys = keyPath.split('.');
	let curr = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		if (!curr[keys[i]]) curr[keys[i]] = {};
		curr = curr[keys[i]];
	}
	curr[keys[keys.length - 1]] = value;
}

function delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
}

export { flattenJSON, deepSet };
