// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { TrackOverflowPost } from './trackOverflowData';
import * as Helpers from './helpers';

// Global variable to store the interval ID
let intervalId: NodeJS.Timeout | undefined;
let storagePanelVisible: boolean = false;

// track if user copied code.
let hasCopiedCode: boolean = false;
let tempCopiedPost: any = null;
const PAST_THRESHOLD = 10;   // typing 10 chars instantly means pasting...
// track if user copied code.

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Create a background task that runs every 5 munites.
    const ONE_SECOND = 1000;
    const ONE_HOUR = ONE_SECOND * 60 * 60;
    intervalId = setInterval(async () => {

        const hasUnseenPost = Helpers.hasUnseenPost(context);
        const hasPostBeenUpdated = await Helpers.hasPostBeenUpdated(context);
        const hasNewComments = await Helpers.postsHasNewComments(context);
        if (hasUnseenPost && (hasPostBeenUpdated || hasNewComments) && !storagePanelVisible) {
            //TODO: get current panel. dont show this message if you are on dataStorage page.
            const warningMessage = 'Warning: Some Code You Copied Has Changed';
            const selection = await vscode.window.showWarningMessage(warningMessage, 'Show List', 'Ignore');
            if ((selection !== undefined) && selection !== 'Ignore') {
                // check how to pass args to commands.
                vscode.commands.executeCommand('trackoverflow-search.dataStorage', true);
            }
        }
    }, ONE_SECOND * 60 * 5);

    //delete
    // Helpers.deleteAllWorkspaceData(context);

    //changbe dates.
    // TODO: check dates of the comments, ont working yet.
    // Helpers.changeCopiedDates(context);

    // Helpers.postsHasNewComments(context);
    // Helpers.getCommentsWithWordShippets(context);

    // Helpers.getNewPostComments(context);//here...

    // Helpers.getAllStoredPosts(context);

    // Helpers.hasPostBeenUpdated(context);//here...

    // Helpers.getNewRevisionsPost(context); // implement this funciton in html.

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
                switch (message.command) {
                    case 'copy':
                        tempCopiedPost = new TrackOverflowPost(message.id, message.dateCopied, message.lastEdited, message.code, message.post, message.link, false);
                        // const key = post.id.toString();
                        hasCopiedCode = true;
                        //context.workspaceState.update(key, post);
                        vscode.window.showInformationMessage('copied');
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        // handle pasting events. 
        vscode.workspace.onDidChangeTextDocument(event => {
            // Call your function to analyze the document changes
            handleTextDocumentChange(event, context);
        });

    });

    function handleTextDocumentChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
        if (hasCopiedCode) {
            if (event.contentChanges.length > 0) {
                const change = event.contentChanges[0]; // Typically, a paste results in a single large change

                const hasPasted = change.rangeLength === 0 && change.text.length > PAST_THRESHOLD;
                const hasReplacedPasted = change.rangeLength > 0 && change.text.length > change.rangeLength * 2;

                if ((hasPasted || hasReplacedPasted) && tempCopiedPost) {

                    // check if the copied text is the same as pasted text.
                    var copiedCodeSub = change.text.substring(0, 5); // check first 5 chars. 
                    var temptCodeSub = tempCopiedPost.code.substring(0, 5);
                    if (copiedCodeSub === temptCodeSub) {
                        const key = tempCopiedPost.id.toString();
                        context.workspaceState.update(key, tempCopiedPost);
                        vscode.window.showInformationMessage('Pasted Code is being Tracked.');
                    }

                    // reset variables. 
                    hasCopiedCode = false;
                    tempCopiedPost = null;
                }
            }
        }
    }

    const trackOverflowStorageDisposable = vscode.commands.registerCommand('trackoverflow-search.dataStorage', async (setIntervalArg) => {

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
        storagePanelVisible = true;

        var updated_posts = await Helpers.getAllUpdatedStoredPosts(context);
        console.log('here mau: updated_posts: ', updated_posts);

        panel.onDidDispose(() => { storagePanelVisible = false; }, null, context.subscriptions);

        //TODO: This should change later, to revisions or comments. 
        if (setIntervalArg && Helpers.unSeenPostCount(updated_posts) === 1) { // function called by setInterval...
            var post = updated_posts[0];//only one post.
            panel.webview.postMessage({
                command: 'detail-revision-post',//change the if to down.
                post_id: post.id,
                post: post
            });
        }
        else {
            /**
             * TODO: remove if and else. change with
             *  if(newcomments){links for new comments.}
             * else{ new post links }
             */
            //TODO: this should have both post revisions or comments. 
            const postHasNewComments = await Helpers.postsHasNewComments(context);
            const postHasNewRevisions = await Helpers.hasNewRevisionsPost(context);

            if (postHasNewRevisions || postHasNewComments) { // bring revisions.
                const revisions_with_snippets = await Helpers.getNewRevisionsPost(context);
                const comments_with_snippets = await Helpers.getCommentsWithWordShippets(context);
                //await Helpers.getStoredDataPostIDs(context);
                const post_ids = context.workspaceState.keys();
                console.log('in else: post ids here: ', post_ids);

                // revisions or comments can be missing.
                // here: not working....
                panel.webview.postMessage({
                    command: 'list-post-revisions-comments',
                    revisions_with_snippets: revisions_with_snippets,
                    comments_with_snippets: comments_with_snippets,
                    post_ids: post_ids,

                });
            }

        }


        panel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'dataStorage-detail-page':
                    var post = context.workspaceState.get(message.post_id);
                    panel.webview.postMessage({
                        command: 'detail-revision-post',
                        post_id: message.post_id, //here...
                        post: post
                    });
                    break;
                case 'back-button':
                    const revisions_with_snippets = await Helpers.getNewRevisionsPost(context);
                    const comments_with_snippets = await Helpers.getCommentsWithWordShippets(context);
                    const post_ids = context.workspaceState.keys();

                    panel.webview.postMessage({
                        command: 'list-post-revisions-comments',
                        revisions_with_snippets: revisions_with_snippets,
                        comments_with_snippets: comments_with_snippets,
                        post_ids: post_ids,
                    });
                    break;
                case 'hide-button':
                    // hide post should just delete post.
                    const warningMessage = 'This Will Delete Revision. Are You Sure?';
                    const selection = await vscode.window.showWarningMessage(warningMessage, 'Delete?', 'Ignore');
                    if ((selection !== undefined) && selection !== 'Ignore') {
                        var oldPost: TrackOverflowPost | undefined = context.workspaceState.get(message.post_id);
                        if (oldPost) {
                            context.workspaceState.update(oldPost.id.toString(), undefined); // delete..
                        }
                    }

                    // then send him to main page.
                    var updated_posts = await Helpers.getAllUpdatedStoredPosts(context);
                    panel.webview.postMessage({
                        command: 'list-posts',
                        updated_posts: updated_posts
                    });
                    break;
                case 'update-seen':
                    var oldPost: TrackOverflowPost | undefined = context.workspaceState.get(message.post.id);
                    if (oldPost) {
                        if (!oldPost.seen) {
                            oldPost.seen = true;
                            context.workspaceState.update(oldPost.id.toString(), oldPost);
                        }
                    }
                    else {
                        throw new Error('Cannot update Post to Seen: ' + oldPost);
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


function getDataPageHTML(scriptSrc: vscode.Uri) {
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

                <div class="row">
                    <div class="col-3">
                        <div id="backButtonDiv"></div>
                    </div>
                    <div class="col-6"> </div>
                    <div class="col-3">
                        <div id="hideButtonDiv"></div>
                    </div>
                </div>
                
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
function getHtmlContent(scriptSrc: vscode.Uri) {
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
