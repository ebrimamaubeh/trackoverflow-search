// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const commandId = 'trackoverflow-search.mainView';
	const trackOverflowDisposable = vscode.commands.registerCommand(commandId, () => {
		
		const panel = vscode.window.createWebviewPanel(
			'TrackOverflow Search',
			'TrackOverflow Search View',
			vscode.ViewColumn.Two,
			{
				enableScripts: true, 
			}
		);

        // Get path to resource on disk
        const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'src/js/', 'trackoverflow.js');
        const scriptSrc = panel.webview.asWebviewUri(scriptPath);

		panel.webview.html = getHtmlContent(scriptSrc);

        // show one notification at a time..... maybe I should do this in js.
        // then use switch cases in message below.

        /**
         * You shoud have: 
         * 1. trackoverflow-search
         * 2. trackoverflow-storage 
         * 
         * you should have two commands. one for searching other for tracking.
         * but everytime they copy, you notify them, but keep it tracked.
         * they can see all their tracked messages, and manage them.
         */


        /////////////////////////////////////////////////////////
         // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                const value = {
                    id: message.id, 
                    type: message.stringType,
                    dateCopied: message.dateCopied,
                    lastEdited: message.lastEdited,
                    code: message.code, 
                    post: message.post,
                    seen: false // has the user seen this notification. if so, don't show it.
                };

                const key = value.id; // unique. 
                context.workspaceState.update(key, value);

                vscode.window.showInformationMessage('message copied'); // you should show this in html.
            },
            undefined,
            context.subscriptions
        );
        /////////////////////////////////////////////////////////

	});

	context.subscriptions.push(trackOverflowDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}


// this code is from index.js
function getHtmlContent(scriptSrc: vscode.Uri){
	return `
        <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>pagination example</title>

                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" 
                    integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paginationjs/2.1.4/pagination.css"/>
                
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
                    integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
                    crossorigin="anonymous">
                </script>
                <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/paginationjs/2.1.4/pagination.min.js"></script>

            </head>
            <body>

                <div class="container">

                    <nav class="navbar navbar-light bg-light sticky-top">
                        <form id="searchForm" class="form-inline col-md-12">
                            <input id="searchInput" class="form-control form-control-lg" type="search" placeholder="Search StackOverflow" aria-label="Search">
                        </form>
                    </nav>

                    <hr>

                    <div id="errorCointainer"></div>

                    <div id="loadingContainer"></div>

                    <div class="accordion accordion-flush" id="accordionFlushDiv"></div>

                    <hr>

                    <div id="pagination" class="d-flex justify-content-lg-center"></div>

                    <hr>

                    <div id="answerCointainer"></div>


                </div>

                <script src="${scriptSrc}"></script>
            </body>
        </html>
    `;
}
