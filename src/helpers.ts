// helper functions.

import * as vscode from 'vscode';

import { TrackOverflowPost } from './trackOverflowData';


export function hasData(context: vscode.ExtensionContext){
    const myKeys = context.workspaceState.keys();

    for(var i = 0; i < myKeys.length; i++){
        const post: TrackOverflowPost | undefined = context.workspaceState.get(myKeys[i]);
        if(post && !post.isHidden){
            return true;    // there is atleast one item.
        }
    }

    return false;
}

export function getStoredDataPostIDs(context: vscode.ExtensionContext){
    const myKeys = context.workspaceState.keys();
    var post_ids = '';
    for(var i = 0; i < myKeys.length; i++){
        const post: TrackOverflowPost | undefined = context.workspaceState.get(myKeys[i]);
        if(post && !post.isHidden){
            post_ids += post.id + ';';
        }
    }

    post_ids = post_ids.substring(0, post_ids.length - 1); // remove last ';'

    return post_ids;
}

export function getStoredDataLinks(context: vscode.ExtensionContext){
    const myKeys = context.workspaceState.keys();
    var links = [];
    for(var i = 0; i < myKeys.length; i++){
        const post: TrackOverflowPost | undefined = context.workspaceState.get(myKeys[i]);
        if(post && !post.isHidden){
            // post_ids += post.link + ';';
            links[i] = post.link;
        }
    }

    return links;
}

// you need to check which post have changed then get those ones. not all posts.
export function getAllStoredPosts(context: vscode.ExtensionContext){
    const keys = context.workspaceState.keys();
    var posts = [];
    
    for(var i = 0; i < keys.length; i++){
        const post: TrackOverflowPost | undefined = context.workspaceState.get(keys[i]);
        if(post && !post.isHidden){
            posts[i] = post;
        }
    }

    return posts;
}

// function to check if code has changed using post ids. 
export function hasUpdatedCode(context: vscode.ExtensionContext){

}

export function getAllUpdatedStoredPosts(context: vscode.ExtensionContext){
    
}

export function deleteAllWorkspaceData(context: vscode.ExtensionContext){
    var keys = context.workspaceState.keys();
    console.log('keys before: ', keys);

    for(var i = 0; i < keys.length; i++){
        context.workspaceState.update(keys[i], undefined);
    }

    keys = context.workspaceState.keys();
    console.log('keys after: ', keys);
}

