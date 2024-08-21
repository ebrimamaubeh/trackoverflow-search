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
        const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'js/', 'trackoverflow.js');
        const scriptSrc = panel.webview.asWebviewUri(scriptPath);

		panel.webview.html = getHtmlContent(scriptSrc);

	});

	context.subscriptions.push(trackOverflowDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}


function getHtmlContent(scriptSrc: vscode.Uri){
	return `
	<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="Mark Otto, Jacob Thornton, and Bootstrap contributors">
    <meta name="generator" content="Hugo 0.72.0">

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" 
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
        integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
        crossorigin="anonymous">
    </script>
</head>

<body>
    <div class="container">

        <nav class="navbar navbar-light bg-light sticky-top">
            <form class="form-inline col-md-12">
                <input class="form-control form-control-lg" type="search" placeholder="Search StackOverflow" aria-label="Search">
            </form>
        </nav>

        <hr>
        <div class="accordion accordion-flush" id="accordionFlushExample">
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
                  Accordion Item #1
                </button>
              </h2>
              <div id="flush-collapseOne" class="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
                <div class="accordion-body">

                    <div class="card" >
                        <h5 class="card-header">Featured</h5>
                        <div class="card-body">
                            <h5 class="card-title">Card title</h5>
                            <p class="card-text">
                                Some quick example text to build on the card title and make up the bulk 
                                of the card's content.
                            </p>
                            <a href="#" class="card-link">Card link</a>
                        </div>
                    </div>

                </div>
              </div>
            </div>
         
        </div>

    </div>

    <script src="${scriptSrc}"></script>
</body>

</html>
	`;
}
