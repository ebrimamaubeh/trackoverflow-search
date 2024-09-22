
// the interface...
export interface TrackOverflowPost{
    id: number; // copied post id.
    dateCopied: Date;
    lastEdited: Date;
    code: string;
    post: string;
    link: string;
    seen: boolean; // post has been seen.
}

export function createTrackOverflowPost(message: any){
    const post: TrackOverflowPost = {
        id: message.id,
        dateCopied: message.dateCopied,
        lastEdited: message.lastEdited,
        code: message.code,
        post: message.post,
        link: message.link,
        seen: false, 
    }; 

    return post;
}
