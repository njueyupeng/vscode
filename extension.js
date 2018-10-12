// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const fs = require('fs');
const os = require('os');
const path = require('path');
const child_process = require('child_process');

let extensionPath = '';

let lastFile = '';
let lastHeartbeat = 0;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    extensionPath = context.extensionPath;
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
                let time = getTime();
                // let now = new Date();
                // let time = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
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
    const scriptPathOnDisk = vscode.Uri.file(path.join(extensionPath, 'media', 'main.js'));
    const chartUri = vscode.Uri.file(path.join(extensionPath, 'media', 'Chart.bundle.min.js')).with({ scheme: 'vscode-resource'});
    const scriptUri = scriptPathOnDisk.with({
        scheme: 'vscode-resource'
    });
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Coding Time</title>
        </head>
        <body>
            <div>这是一个内容:${JSON.stringify(time)}</div>
            <div style="height:300px">
                <canvas id="myChart" style="width:50px;height:50px" ></canvas>
            </div>
            <script  src="${chartUri}"></script>
            <script  src="${scriptUri}"></script>
        </body>
        </html>`
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

function getCodingTimeHome() {}

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
                if (enoughTimePassed(time)) {
                    if (isWrite || lastFile !== file) {
                        // this.sendHeartbeat(file, isWrite);
                        console.log(file);
                        let project = getProjectName(file);
                        console.log(project);
                        console.log(__dirname);
                        collectTime(project, time - lastHeartbeat);
                        console.log(getTime());
                        lastFile = file;
                        lastHeartbeat = time;
                    }
                } else {
                    lastFile = file;
                    lastHeartbeat = time;
                }
            }
        }
    }
}

function collectTime(project, time) {
    let json = getTime() || {};
    let now = new Date();
    let strDate = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    for (let key in json) {
        if (now - new Date(key).getTime() > 31 * 24 * 60 * 60 * 1000) {
            delete json[key]
        }
    }
    json[strDate] = json[strDate] || {};
    json[strDate][project] = Number(json[strDate][project] || 0) + time;
    let result = JSON.stringify(json);
    console.log(result);
    fs.writeFileSync(path.join(__dirname, '..', 'codingTime.json'), result, 'utf8');
}

function removeOldData() {

}

function getTime() {
    let time = {};
    let data = '{}'
    try {
        data = fs.readFileSync(path.join(__dirname, '..', 'codingTime.json'), 'utf8') || '{}';
    } catch (error) {
        console.log(error);
    }
    console.log(data);
    try {
        time = JSON.parse(data);
    } catch (error) {
        console.log(error);
    }
    return time;
}


function enoughTimePassed(time) {
    return lastHeartbeat + 1000 * 60 * 15 > time;
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