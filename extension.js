// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const fs = require('fs');
const os = require('os');
const path = require('path');
const child_process = require('child_process');


let lastFile = '';
let lastHeartbeat = 0;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    let currentPanel = vscode.WebviewPanel || undefined;


    context.subscriptions.push(vscode.commands.registerCommand('codingTime.show', function () {
        const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (currentPanel) {
            currentPanel.reveal(columnToShowIn);
        } else {

            currentPanel = vscode.window.createWebviewPanel(
                'codingTime',
                '代码时间',
                vscode.ViewColumn.One, {
                    enableScripts: true
                }
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
    // const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'media', 'main.js'));
    // const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coding Time</title>
</head>
<body>
    <div>这是一个内容:${time}</div>
    <h1 id="lines-of-code-counter">0</h1>
    <script>
        const counter = document.getElementById('lines-of-code-counter');

        let count = 0;
        setInterval(() => {
            counter.textContent = count++;
        }, 100);
    </script>
</body>
</html>`
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

function getCodingTimeHome() {

}

function onChange() {
    onEvent(true);
}

function onSave() {
    onEvent(false);
}

function onEvent(isWrite) {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        let doc = editor.document;
        if (doc) {
            let file = doc.fileName;
            if (file) {
                let time = Date.now();
                if (isWrite || enoughTimePassed(time) || lastFile !== file) {
                    // this.sendHeartbeat(file, isWrite);
                    console.log(file);
                    let project = getProjectName(file);
                    console.log(project);
                    lastFile = file;
                    lastHeartbeat = time;
                }
            }
        }
    }
}

function enoughTimePassed(time) {
    return lastHeartbeat + 120000 < time;
}

function getProjectName(file) {
    let uri = vscode.Uri.file(file);
    let workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (vscode.workspace && workspaceFolder) {
        try {
            return workspaceFolder.name;
        } catch (e) {}
    }
    return null;
}
function init() {
    let statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
    );

    statusBar.text = '$(clock)';
    statusBar.tooltip = 'CodingTime is running...';
    statusBar.show();
    vscode.window.onDidChangeTextEditorSelection(onChange);
    vscode.window.onDidChangeActiveTextEditor(onChange);
    vscode.workspace.onDidSaveTextDocument(onSave);
}
init();
exports.deactivate = deactivate;