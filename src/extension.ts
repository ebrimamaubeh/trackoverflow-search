// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { TrackOverflowPost, createTrackOverflowPost } from './trackOverflowData';
import * as Helpers from './helpers';

// Global variable to store the interval ID
let intervalId: NodeJS.Timeout | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Create a background task that runs every 5 munites.
    const ONE_SECOND = 1000;
    const ONE_HOUR = ONE_SECOND * 60 * 60;
    intervalId = setInterval( async () => {

        const hasUnseenPost = Helpers.hasUnseenPost(context);
        const hasPostBeenUpdated = await Helpers.hasPostBeenUpdated(context);
        if(hasUnseenPost && hasPostBeenUpdated){
            const warningMessage = 'Warning: Some Code You Copied Has Changed';
            const selection = await vscode.window.showWarningMessage(warningMessage,'Show List', 'Ignore');
            if ((selection !== undefined) && selection !== 'Ignore') {
                // check how to pass args to commands. 
                vscode.commands.executeCommand('trackoverflow-search.dataStorage', true);
            }
        }
    }, 20000);//TODO: change to one hour.

    //delete
    // Helpers.deleteAllWorkspaceData(context);
    // Helpers.changeCopiedDates(context);

	const commandId = 'trackoverflow-search.mainView';
	const trackOverflowDisposable = vscode.commands.registerCommand(commandId, async () => {
		
		const panel = vscode.window.createWebviewPanel(
			'TrackOverflow Search',
			'TrackOverflow Search View',
			vscode.ViewColumn.Two,
			{
				enableScripts: true, 
                retainContextWhenHidden: true, // save when switch from one window to the next.
			}
		);

        // Get path to resource on disk
        const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'src/js/', 'trackoverflow.js');
        const scriptSrc = panel.webview.asWebviewUri(scriptPath);

		panel.webview.html = getHtmlContent(scriptSrc);
           
         // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch(message.command){
                    case 'copy': 
                        const post: TrackOverflowPost = createTrackOverflowPost(message);
                        const key = post.id.toString();
                        context.workspaceState.update(key, post);
                        vscode.window.showInformationMessage('copied');
                    break;
                }
            },
            undefined,
            context.subscriptions
        );

	});

    const trackOverflowStorageDisposable = vscode.commands.registerCommand('trackoverflow-search.dataStorage', async (serIntervalArg) => {
        
        const panel = vscode.window.createWebviewPanel(
			'TrackOverflow Search',
			'TrackOverflow Stored Data',
			vscode.ViewColumn.Two,
			{
				enableScripts: true, 
                retainContextWhenHidden: true, // save when switch from one window to the next.
			}
		);


        const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'src/js/', 'dataStorage.js');
        const scriptSrc = panel.webview.asWebviewUri(scriptPath);

        panel.webview.html = getDataPageHTML(scriptSrc);

        if(serIntervalArg){ // function called by setInterval...
            var updated_posts = await Helpers.getAllUpdatedStoredPosts(context);
            console.log('setIntervalArgs: updated_posts: ', updated_posts);
            if(updated_posts.length === 1){
                var post = updated_posts[0];//only one post.
                panel.webview.postMessage({ 
                    command: 'detail-post',
                    post_id: post.id,
                    post: post
                });
            }
        }else{
            // function called through command palette
            const hasPostBeenUpdated = await Helpers.hasPostBeenUpdated(context);
            if(hasPostBeenUpdated){
                var updated_posts = await Helpers.getAllUpdatedStoredPosts(context);
                panel.webview.postMessage({ 
                    command: 'list-posts',
                    updated_posts: updated_posts 
                });
            }
        }

        

        panel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'dataStorage-detail-page':
                    var post = context.workspaceState.get(message.post_id);
                    panel.webview.postMessage({ 
                        command: 'detail-post',
                        post_id: message.post_id,
                        post: post
                    });
                break;
                case 'back-button': 
                    var updated_posts = await Helpers.getAllUpdatedStoredPosts(context);
                    panel.webview.postMessage({ 
                        command: 'list-posts',
                        updated_posts: updated_posts 
                    });
                break;
                case 'update-seen': 
                    var oldPost: TrackOverflowPost | undefined = context.workspaceState.get(message.post.id);
                    if(oldPost){
                        if( !oldPost.seen ){
                            oldPost.seen = true;
                            context.workspaceState.update(oldPost.id.toString(), oldPost);
                        }
                    }
                    else{
                        throw new Error('Cannot update Post to Seen: '+ oldPost);
                    }       
                break;

            }
        });

    });

	context.subscriptions.push(trackOverflowDisposable);
    context.subscriptions.push(trackOverflowStorageDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
    // Clear the interval when the extension is deactivated
    clearInterval(intervalId);
}


function getDataPageHTML(scriptSrc: vscode.Uri){
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

                <h1>
                    Data Storage Page.
                </h1>

                <div id="loadingContainer"></div>

                <div id="backButtonDiv"></div>
                
                <hr>

                <div class="accordion accordion-flush"></div>

                <div id="linksDiv"> </div>

                <hr>

                <div id="pagination"></div>

                <hr>

                <div id="revisionCointainer"></div>

                <div id="detailPageContent"> </div>


            </div>

            <script src="${scriptSrc}"></script>
        </body>
        </html>
    `;
}   

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
