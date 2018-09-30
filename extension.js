// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    let currentPanel = vscode.WebviewPanel | undefined;


    context.subscriptions.push(vscode.commands.registerCommand('codingTime.show', function () {
        const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (currentPanel) {
            currentPanel.reveal(columnToShowIn);
        } else {

            currentPanel = vscode.window.createWebviewPanel(
                'codingTime',
                '代码时间',
                vscode.ViewColumn.One, {}
            );


            const updateWebview = () => {
                let now = new Date();
                let time = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
                currentPanel.webview.html = getWebviewContent(time);
            }

            // Set initial content
            updateWebview();

            // And schedule updates to the content every second
            const interval = setInterval(updateWebview, 1000);

            currentPanel.onDidDispose(() => {
                // When the panel is closed, cancel any future updates to the webview content
                clearInterval(interval);
            }, null, context.subscriptions)
        }
    }))
}

function getWebviewContent(time) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coding Time</title>
</head>
<body>
    <div>这是一个内容:${time}</div>
</body>
</html>`
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;