// helper functions.

import * as vscode from 'vscode';

import { TrackOverflowPost, wordSnippetList } from './trackOverflowData';
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

    console.log('stored posts: ', posts);
    return posts;
}

// function to check if code has changed using post ids. also check if words snippets are used.
export async function hasPostBeenUpdated(context: vscode.ExtensionContext){
    const posts_ids: string = getStoredDataPostIDs(context);
    const local_posts = getAllStoredPosts(context);
    
    if(local_posts.length === 0){ return false; }

    interface ApiResponse{ items: any[]; }

    const post_url = 'https://api.stackexchange.com/2.3/posts/'+ posts_ids +'?order=desc&sort=activity&site=stackoverflow&filter=!nNPvSNQ6rQ';
    let fetchResult = await fetch(post_url);
    let data = (await fetchResult.json()) as ApiResponse; // saw this using gemini.
    var new_posts = data.items;

    assert(local_posts.length === new_posts.length, 'Posts have a different number');

    for(var i = 0; i < local_posts.length; i++){
        var isNew = new_posts[i].last_edit_date > local_posts[i].dateCopied;
        //TODO: if not new, don't need to loop, add if here later. not in loop.
        if(isNew && hasWordSnippet(new_posts[i].body)){
            return true;
        }

    }

    return false;
}

function hasWordSnippet(text: string){
    const words = wordSnippetList();

    for(var w = 0; w < words.length; w++){
        if(text.includes(words[w])){
            return true;
        }
    }

    return false;
}

//TODO: here...
//TODO: you must add dates here.
export async function postsHasNewComments(context: vscode.ExtensionContext) {
    const newComments = await getNewPostComments(context);
    const words = wordSnippetList();

    // return array containing only of comments with the words.
    for(var i = 0; i < newComments.length; i++){

        for(var w = 0; w < words.length; w++){
            const containsWord = newComments[i].body.includes(words[w]);
            if(containsWord){
                return true;
            }
        }

    }
    return false;
}

export async function getNewPostComments(context: vscode.ExtensionContext) {
    const posts_ids: string = getStoredDataPostIDs(context);
    const local_posts = getAllStoredPosts(context);
    interface ApiResponse{ items: any[]; }

    /////////////////////////
    const url = 'https://api.stackexchange.com/2.3/posts/'+ posts_ids +'/comments?order=desc&sort=creation&site=stackoverflow&filter=!6WPIompASGkR4';
    let fetchResult = await fetch(url);
    let data = (await fetchResult.json()) as ApiResponse; 
    var comments = data.items;

    var updated_comments = [];
    var counter = 0;

    for(var comment_index = 0; comment_index < comments.length; comment_index++){
        for(var local_index = 0; local_index < local_posts.length; local_index++){
            
            //Note: local post id is a string, must convert it first.
            if(Number(local_posts[local_index].id) === comments[comment_index].post_id){
                var isNewComment = comments[comment_index].creation_date > local_posts[local_index].dateCopied;
                if(isNewComment){
                    updated_comments[counter++] = comments[comment_index];
                }
                
            }
        }
    }

    return updated_comments; 
}

export async function getCommentsWithWordShippets(context: vscode.ExtensionContext) {
    const newComments = await getNewPostComments(context);
    const words = wordSnippetList();

    //TODO: Must add time comment was made, it must be new. comment time >= copied date.
    var results = [];
    var count = 0;
    for(var i = 0; i < newComments.length; i++){

        for(var w = 0; w < words.length; w++){
            const containsWord = newComments[i].body.includes(words[w]);
            const isAdded = results.includes(newComments[i]);
            
            if(containsWord && !isAdded){
                results[count++] = newComments[i];
            }
        }

    }

    console.log('comments with words: ', results);
    return results;
}

export async function getNewRevisionsPost(context: vscode.ExtensionContext) {
 
    const posts_ids: string = getStoredDataPostIDs(context);
    const local_posts = getAllStoredPosts(context);

    if(local_posts.length === 0){ return []; }
    interface ApiResponse{ items: any[]; }

    const url = 'https://api.stackexchange.com/2.3/posts/'+ posts_ids +'/revisions?site=stackoverflow&filter=!*MUMPxmwAsI.Jq8h';
    let fetchResult = await fetch(url);
    let data = (await fetchResult.json()) as ApiResponse; 
    var revisions = data.items;

    var latest_revisions = []; // revisions with the latest date, after copy date.
    var revision_count = 0;

    for(var p = 0; p < local_posts.length; p++){

        for(var r = 0; r < revisions.length; r++){
            //Note: local post id is a string, must convert it first.
            if(revisions[r].post_id === Number(local_posts[p].id)){
                
                var isNewRevision = revisions[r].creation_date > Number(local_posts[p].id);
                var commentHasWordSnippet = revisions[r].comment && hasWordSnippet(revisions[r].comment);
                var revisionBodyHasWordSnippet = revisions[r].body && hasWordSnippet(revisions[r].body);
                //comment or body might be missing.
                if(isNewRevision && (commentHasWordSnippet || revisionBodyHasWordSnippet)){
                    latest_revisions[revision_count++] = revisions[r];
                }
            }
        }
    }

    console.log('latest_revisions: ', latest_revisions);

    return latest_revisions;

}

export async function hasNewRevisionsPost(context: vscode.ExtensionContext){
    const posts_ids: string = getStoredDataPostIDs(context);
    const local_posts = getAllStoredPosts(context);

    if(local_posts.length === 0){ return []; }
    interface ApiResponse{ items: any[]; }

    const url = 'https://api.stackexchange.com/2.3/posts/'+ posts_ids +'/revisions?site=stackoverflow&filter=!*MUMPxmwAsI.Jq8h';
    let fetchResult = await fetch(url);
    let data = (await fetchResult.json()) as ApiResponse; 
    var revisions = data.items;

    for(var p = 0; p < local_posts.length; p++){

        for(var r = 0; r < revisions.length; r++){
            //Note: local post id is a string, must convert it first.
            if(revisions[r].post_id === Number(local_posts[p].id)){
                
                var isNewRevision = revisions[r].creation_date > Number(local_posts[p].id);
                var commentHasWordSnippet = revisions[r].comment && hasWordSnippet(revisions[r].comment);
                var revisionBodyHasWordSnippet = revisions[r].body && hasWordSnippet(revisions[r].body);
                //comment or body might be missing.
                if(isNewRevision && (commentHasWordSnippet || revisionBodyHasWordSnippet)){
                    return true;
                }
            }
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
    let data = (await fetchResult.json()) as ApiResponse; 
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

export function unSeenPostCount(updated_post: TrackOverflowPost[]) : number {

    var counter = 0;
    for(var i = 0; i < updated_post.length; i++){
        if(!updated_post[i].seen){
            counter++;
        }
    }

    return counter;
}

