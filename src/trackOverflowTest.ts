import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

//my local imports.....
import * as TrackOverflowData from './trackOverflowData';
//my local imports.....

const MAX_POSTS = 100 * 1000;
const MAX_COMMENTS = MAX_POSTS * 10;
const MAX_POST_HISTORY = MAX_POSTS * 10;

// you need to check if this is an answer or question that set off the notification.
// think about adding wiki post types...
const QUESTION_TYPE = 1;
const ANSWER_TYPE = 2;


// variables to print the notification results. 
var postCounter = 0;
var postWithCodeCounter = 0;

var questionCounter = 0;
var answerCounter = 0;

var questionWithNotification = 0;
var answerWithNotification = 0;

var commentsCounter = 0;
var commentsWithErrorMessageCounter = 0;

var postHistoryCounter = 0;
var postHistoryNotificationsCounter = 0;

var stored_posts = [];

export function fileStreamFunctionTest() {
    countPostNotifications();
}

async function countPostNotifications() {

    const filePath = path.join(__dirname, '../src/test/dataDump/stackoverflow/Posts.json');
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

    var post_ids = [];
    var accepted_answer_ids = [];

    // Set up the pipeline
    pipeline(
        fileStream,
        parser(),
        streamArray(), // use streamArray if the root of the JSON is an array
        async function (source) {

            for await (const { key: count, value: post } of source) {

                postCounter++;

                if (containsCodeBlock(post.Body)) {
                    stored_posts.push(post);
                    post_ids.push(post.Id);

                    postWithCodeCounter++;

                    if (post.PostTypeId === QUESTION_TYPE) {
                        questionCounter++;
                    }

                    if (post.PostTypeId === ANSWER_TYPE) {
                        answerCounter++;
                    }
                }

                //check if answer is accepted
                if (post.AcceptedAnswerId) { // value may not exist.
                    accepted_answer_ids.push(post.AcceptedAnswerId);
                }

                if (++postCounter === MAX_POSTS) {
                    console.log('Max Post: ', MAX_POSTS);
                    // fileStream.destroy(); // This ends the pipeline immediately
                    break;
                }

            }

            console.log('postCounter: ', postCounter, ' : PostWithCode: ', postWithCodeCounter);
            console.log('questionCounter: ', questionCounter, ': answerCounter: ', answerCounter);

            countCommentNotifications(post_ids, accepted_answer_ids);
        },
        (err) => {
            if (err) {
                console.error(err.message);
            }
        }
    );
}

function countCommentNotifications(post_ids: any[], accepted_answer_ids: any[]) {
    const filePath = path.join(__dirname, '../src/test/dataDump/stackoverflow/Comments.json');
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

    pipeline(
        fileStream,
        parser(),
        streamArray(),
        async function (source) {

            for await (const { key: count, value: comment } of source) {
                commentsCounter++;

                if (comment.PostId in post_ids) {

                    if (containsErrorSnippet(comment.Text)) {
                        commentsWithErrorMessageCounter++;
                    }
                }

                if (count === MAX_COMMENTS) {
                    break;
                }

            }

            console.log('commentsCounter: ', commentsCounter);
            console.log('notifications from commnets: ', commentsWithErrorMessageCounter);

            countPostHistoryNotifications(post_ids, accepted_answer_ids);
        },
        (err) => {
            if (err) {
                console.error(err.message);
            }
        }
    );
}

// I must pass my post ids, else It will not work. 
function countPostHistoryNotifications(post_ids: any[], accepted_answer_ids: any[]) {
    const filePath = path.join(__dirname, '../src/test/dataDump/stackoverflow/PostHistory.json');
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

    //some counters.
    var acceptedAnswerWithNotification = 0;
    var nonAcceptedAnswerWithNotification = 0;

    pipeline(
        fileStream,
        parser(),
        streamArray(),
        async function (source) {
            for await (const { key: count, value: postHistory } of source) {
                postHistoryCounter++;

                if (postHistory.PostId in post_ids) {

                    if (containsErrorSnippet(postHistory.Text)) {
                        postHistoryNotificationsCounter++;

                        if (postHistory.PostHistoryTypeId === QUESTION_TYPE) {
                            questionWithNotification++;
                        }
                        else if (postHistory.PostHistoryTypeId === ANSWER_TYPE) {
                            answerWithNotification++;


                        }

                        if (postHistory.PostId in accepted_answer_ids) { // post is an accepted ans
                            acceptedAnswerWithNotification++;
                        }
                        else {
                            nonAcceptedAnswerWithNotification++;
                        }
                    }
                }

                if (count === MAX_POST_HISTORY) {
                    break;
                }

            }

            console.log('Post History Counter: ', postHistoryCounter);
            console.log('notifications from Post History: ', postHistoryNotificationsCounter);
            console.log('question With Notification: ', questionWithNotification);
            console.log('answer with notification: ', answerWithNotification);
            console.log('accepted answer with Notification: ', acceptedAnswerWithNotification);
            console.log('non-accepted answer with notification: ', nonAcceptedAnswerWithNotification);
        },
        (err) => {
            if (err) {
                console.error(err.message);
            }
        }
    );
}

/**
 * This function checks if the comment that is passed to the function contains code snippets that 
 * are found in words snippets wordlist. 
 * @param jsonComment; the comment to check. 
 */
function containsErrorSnippet(text: String): boolean {
    var error_snippets: string[] = TrackOverflowData.wordSnippetList();

    for (var i = 0; i < error_snippets.length; i++) {
        var hasErrorMsg = text.toLowerCase().includes(error_snippets[i]);
        if (hasErrorMsg) {
            return true;
        }
    }

    return false;
}

function containsCodeBlock(postBody: string) {
    const codeBlockRegex = /<code>[\s\S]*?<\/code>/i;

    return codeBlockRegex.test(postBody);
}

function getCodeFromPostBody(postBody: string) {

    const match = postBody.match(/<code>([\s\S]*?)<\/code>/i);
    if (match) {
        return match[1];
    }

    return null;
}

