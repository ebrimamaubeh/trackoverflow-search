import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';


import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream';
const { parser } = require('stream-json');
const { pick } = require('stream-json/filters/Pick');
const { streamArray } = require('stream-json/streamers/StreamArray');


// Create a readable file stream
// const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });


suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    });

    test('Read File test', () => {
        // assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        // Run the async function
        readLargeJson().catch((err) => {
            console.error('Error:', err.message);
        });
    });



});

async function readLargeJson() {
    // Wrap pipeline in a Promise for async/await
    const filePath = '../../src/dataDump/large.json';

    // var postCounter = 0;
    // var codeCounter = 0;

    return new Promise < void> ((resolve, reject) => {
        pipeline(
            fs.createReadStream(filePath, { encoding: 'utf-8' }),
            parser(),
            streamArray(),
            pick(),
            async function (source: any) {

                for await (const { value } of source) {
                    // TODO: filter lines that have <code> in the text
                    // maybe you should not use filter, since you need to count the amount of code
                    // you didn't copy...

                    //postCounter++;

                    // this is not working.
                    if (value && value.name && value.id) {
                        console.log('Name:', value.name);
                    }

                }

                // console.log('postCounter: ', postCounter, ': codeCounter: ', codeCounter);
                console.log('Finished reading JSON file.');
            },
            (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}
