// helper functions.

import * as vscode from 'vscode';

import { TrackOverflowPost } from './trackOverflowData';
import { assert } from 'console';
import { deactivate } from './extension';


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

export function getStoredDataPostIDs(context: vscode.ExtensionContext): string{
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

export function getStoredDataLinks(context: vscode.ExtensionContext): string[] {
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
export function hasCodeBeenUpdated(context: vscode.ExtensionContext){
    //TODO
}

export async function getAllUpdatedStoredPosts(context: vscode.ExtensionContext){
    const posts_ids: string = getStoredDataPostIDs(context);
    const local_posts = getAllStoredPosts(context);

    interface ApiResponse{
        items: any[];
    }

    const post_url = 'https://api.stackexchange.com/2.3/posts/'+ posts_ids +'?order=desc&sort=activity&site=stackoverflow&filter=!nNPvSNQ6rQ';
    let fetchResult = await fetch(post_url);
    let data = (await fetchResult.json()) as ApiResponse; // saw this using gemini.
    var new_posts = data.items;

    console.log('new posts: ', new_posts);
    console.log('old posts: ', local_posts);

    console.log('testing: ', data.items[0].last_edit_date);

    assert(local_posts.length === new_posts.length, 'Posts have a different number');

    //check last edited date > date stored.
    var updated_posts = [];
    for(var i = 0; i < local_posts.length; i++){
        if(new_posts[i].last_edit_date > local_posts[i].dateCopied){
            updated_posts[i] = new_posts[i];
        }
    }

    console.log('in function: ', updated_posts);

    return updated_posts;

}

export function deleteAllWorkspaceData(context: vscode.ExtensionContext): void {
    var keys = context.workspaceState.keys();
    console.log('keys before: ', keys);

    for(var i = 0; i < keys.length; i++){
        context.workspaceState.update(keys[i], undefined);
    }

    keys = context.workspaceState.keys();
    console.log('keys after: ', keys);
}

