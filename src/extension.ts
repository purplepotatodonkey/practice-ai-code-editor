// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "practice-ai-code-editor" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('practice-ai-code-editor.ai-chat', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from practice-ai-code-editor!');
	});

	context.subscriptions.push(disposable);

	const webview = new AiChatWebViewProvider();
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'ai-chat.ai-chat-gui',
			webview,
		)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}

class AiChatWebViewProvider implements vscode.WebviewViewProvider {
	resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken
	) {
		webviewView.webview.options = {
			enableScripts: true
		};

		webviewView.webview.html = /*html*/`<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <!-- Content Security Policy without nonce -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webviewView.webview.cspSource}; script-src 'unsafe-inline' ${webviewView.webview.cspSource}; style-src 'unsafe-inline' ${webviewView.webview.cspSource};" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AI Chat</title>
      </head>
      <body>
        <div id="chatContainer"></div>
        <input id="promptInput" type="text" placeholder="Ask something..." />
        <button onclick="sendMessage()">Send</button>
        <script>
          const vscode = acquireVsCodeApi();
          const input = document.getElementById('promptInput');
          function sendMessage() {
            const prompt = input.value;
            vscode.postMessage({ type: 'prompt', value: prompt });
          }
          // Listen for messages from extension:
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'response') {
              const chatDiv = document.getElementById('chatContainer');
              chatDiv.textContent = message.value;
            }
          });
        </script>
      </body>
      </html>`;


		webviewView.webview.onDidReceiveMessage(async (message: any) => {
			console.log('joseph saw message!');

			if (message.type === 'prompt') {
				vscode.window.showInformationMessage('Button clicked!');

				const editor = vscode.window.activeTextEditor;
				const activeFileContent = editor ? editor.document.getText() : '';
				console.log('joseph checking activeFileContent', activeFileContent);

				const streamResponse = await ollama.chat({
					model: 'deepseek-r1:1.5b',
					messages: [{ role: 'user', content: message.value + activeFileContent}],
					stream: true
				});

				let responseText = ''

				for await (const part of streamResponse) {
					responseText += part.message.content
					webviewView.webview.postMessage({ type: 'response', value: responseText })
				}
			}
		});
	}
}