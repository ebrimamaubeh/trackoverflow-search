import { deactivate } from './extension';

// the interface...
// export interface TrackOverflowPost {
//     id: number; // copied post id.
//     dateCopied: Date;
//     lastEdited: Date;
//     code: string;
//     post: string;
//     link: string;
//     seen: boolean; // post has been seen.
// }

export class TrackOverflowPost {
    id: number; // copied post id.
    dateCopied: Date;
    lastEdited: Date;
    code: string;
    post: string; // actual post on StackOverflow.
    link: string;
    seen: boolean; // post has been seen.

    constructor(id: number, dateCopied: Date, lastEdited: Date, code: string, post: string, link: string, seen: boolean) {
        this.id = id;
        this.dateCopied = dateCopied;
        this.lastEdited = lastEdited;
        this.code = code;
        this.post = post;
        this.link = link;
        this.seen = seen;
    }
}

// export function createTrackOverflowPost(message: any) {
//     const post: TrackOverflowPost = {
//         id: message.id,
//         dateCopied: message.dateCopied,
//         lastEdited: message.lastEdited,
//         code: message.code,
//         post: message.post,
//         link: message.link,
//         seen: false,
//     };

//     return post;
// }

// a set of words I will be looking for in edits and updates.
export function wordSnippetList() {
    // link to get comments. 
    // https://api.stackexchange.com/docs/comments-on-posts
    const array = [
        'error', 'errors', 'debug error',
        'code does not work', 'contains errors', 'not working',
        'deprecated code', 'update', 'updated code', 'code upgrade', 'code changed',
        'more details'
    ];

    return array;
}
