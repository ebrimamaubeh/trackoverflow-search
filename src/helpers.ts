// helper functions.

import * as vscode from 'vscode';

import { TrackOverflowPost } from './trackOverflowData';
import { assert } from 'console';

export function hasData(context: vscode.ExtensionContext){
    const myKeys = context.workspaceState.keys();

    for(var i = 0; i < myKeys.length; i++){
        const post: TrackOverflowPost | undefined = context.workspaceState.get(myKeys[i]);
        if(post){
            return true;    // there is atleast one item.
        }
    }

    return false;
}

export function hasUnseenPost(context: vscode.ExtensionContext){
    const myKeys = context.workspaceState.keys();

    for(var i = 0; i < myKeys.length; i++){
        const post: TrackOverflowPost | undefined = context.workspaceState.get(myKeys[i]);
        if(post && !post.seen){
            return true;    
        }
    }

    return false;
}

export function getStoredDataPostIDs(context: vscode.ExtensionContext): string{
    const myKeys = context.workspaceState.keys();
    var post_ids = '';
    for(var i = 0; i < myKeys.length; i++){
        const post: TrackOverflowPost | undefined = context.workspaceState.get(myKeys[i]);
        if(post){
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
        if(post){
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
        if(post){
            posts[i] = post;
        }
    }

    return posts;
}

// function to check if code has changed using post ids. 
export async function hasPostBeenUpdated(context: vscode.ExtensionContext){
    const posts_ids: string = getStoredDataPostIDs(context);
    const local_posts = getAllStoredPosts(context);
    
    // check before doing fetch call.
    if(local_posts.length === 0){ return false; }

    interface ApiResponse{ items: any[]; }

    const post_url = 'https://api.stackexchange.com/2.3/posts/'+ posts_ids +'?order=desc&sort=activity&site=stackoverflow&filter=!nNPvSNQ6rQ';
    let fetchResult = await fetch(post_url);
    let data = (await fetchResult.json()) as ApiResponse; // saw this using gemini.
    var new_posts = data.items;

    assert(local_posts.length === new_posts.length, 'Posts have a different number');

    for(var i = 0; i < local_posts.length; i++){
        if(new_posts[i].last_edit_date > local_posts[i].dateCopied){
            return true;
        }
    }

    return false;
}

export async function getAllUpdatedStoredPosts(context: vscode.ExtensionContext){
    const posts_ids: string = getStoredDataPostIDs(context);
    const local_posts = getAllStoredPosts(context);

    if(local_posts.length === 0){ return []; }

    interface ApiResponse{
        items: any[];
    }

    const post_url = 'https://api.stackexchange.com/2.3/posts/'+ posts_ids +'?order=desc&sort=activity&site=stackoverflow&filter=!nNPvSNQ6rQ';
    let fetchResult = await fetch(post_url);
    let data = (await fetchResult.json()) as ApiResponse; // saw this using gemini.
    var new_posts = data.items;

    assert(local_posts.length === new_posts.length, 'Posts have a different number');

    //check last edited date > date stored.
    var updated_posts = [];
    var post_counter = 0;
    for(var i = 0; i < local_posts.length; i++){
        if(new_posts[i].last_edit_date > local_posts[i].dateCopied){
            updated_posts[post_counter++] = local_posts[i];
        }
    }

    return updated_posts; // copy the array. 
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

export async function changeCopiedDates(context: vscode.ExtensionContext){
    const posts_ids: string = getStoredDataPostIDs(context);
    const local_posts = getAllStoredPosts(context);

    if(local_posts.length === 0){ return []; }

    interface ApiResponse{
        items: any[];
    }

    const post_url = 'https://api.stackexchange.com/2.3/posts/'+ posts_ids +'?order=desc&sort=activity&site=stackoverflow&filter=!nNPvSNQ6rQ';
    let fetchResult = await fetch(post_url);
    let data = (await fetchResult.json()) as ApiResponse;
    var new_posts = data.items;

    assert(local_posts.length === new_posts.length, 'Posts have a different number');

    for(var i = 0; i < local_posts.length; i++){
        local_posts[i].dateCopied = new_posts[i].creation_date;
        context.workspaceState.update(local_posts[i].id.toString(), local_posts[i]);
    }

}

