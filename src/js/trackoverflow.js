$(document).ready(function(){

    // global variables. 
    const vscode = acquireVsCodeApi();
    
    $('#searchForm').submit(enterButtonPressed);
    
    async function enterButtonPressed(event){
        event.preventDefault();

        $('#loadingContainer').append('<p class="display-1 text-center"> Loading ...</p>');

        var searchInputValut = $('#searchInput').val(); // fix no search result.

        if(searchInputValut.trim().length === 0){
            createErrorHTML('Error: Search Box Cannot Be Empty!');
            $('#loadingContainer').html('');
            return;
        }
        clearErrorHTML();

        var jsonData = await getStackOverflowData(searchInputValut);
        has_more = jsonData.has_more;
        var items = jsonData.items; // this might increase later. > 100 items. 

        if(items.length === 0){
            var message = '<h1>Error: No Search Results Found For Input: "'+ searchInputValut + '"</h1>';
            createErrorHTML(message);
            $('#loadingContainer').html('');
            return;
        }
        clearErrorHTML();

        //sometimes, there is always an error when loading certain pages
        //it's a bug with the pagination extension.
        let container = $('#pagination');
        container.pagination({
            pageSize: 5, // if hich, you will get a loading error.
            showGoInput: true,
            showGoButton: true,
            dataSource: items,
            callback: async function (data, pagination) {
                var html = template(data);
                $("#accordionFlushDiv").html(html);

                addCodeStyles();
                addCopyButton();// add onclick on all buttons later.
                $('#loadingContainer').html(''); 
            }
        });
    }

    async function getStackOverflowData(searchInput, page = 1){
        var link = 'https://api.stackexchange.com/2.3/search?page='+ page +'&pageSize=100'+ '' 
                    +'&order=desc&sort=relevance&intitle='+ searchInput +'&'+ '' 
                    +'site=stackoverflow&filter=!*Mg4PjfgUgqOW6wX';
        let result = await fetch(link);
        let jsonData = await result.json();
        return jsonData; // get has_more and items variables
    }

    function getAnswers(answers){//here...
        var result = '';
        
        for(var j = 0; j < answers.length; j++){// foreach answer
            var ans = answers[j];

            var textCSS = ans.is_accepted ? 'text-bg-success' : 'text-bg-secondary';
            var borderCSS = ans.is_accepted ? 'border-success': 'border-danger';
            var btnStatus = ans.is_accepted ? 'btn-success': 'btn-secondary';
            var icon = ans.is_accepted ? getIcon() : '';

            result += answerTemplate(ans.body, textCSS, borderCSS, btnStatus, icon, j + 1, ans.answer_id, answers[j].link);
        }

        return result;
    }

    function template(items){
        var html = '';
        for(var i = 0; i < items.length; i++){
            var dataTarget = 'flush-collapse' + i;
            var answers = getAnswers(items[i].answers);
            var questionID = items[i].question_id;
            var qt = questionTemplate(items[i].title, items[i].body, dataTarget, items[i].link, answers, questionID);
            html += qt;
        }
        
        return html;
    }

    function addCodeStyles(){
        var pre = document.querySelectorAll('pre');
        for(let i = 0; i < pre.length; i++){
            pre[i].style.backgroundColor = 'lightGrey';
        }
    }

    function addCopyButton(){
        var codes = document.querySelectorAll('pre > code');
        for(let i = 0; i < codes.length; i++){
            var button = document.createElement('button');
            button.setAttribute('class', 'btn btn-secondary');

            button.innerHTML = 'Copy Code';
            // codes[i].parentNode.after(button); // not working yet.
            codes[i].after(button);

            //this will be null if it's an answer.
            var question_div = codes[i].parentNode.parentNode;
            var answer_div = codes[i].parentNode.parentNode.parentNode;
           
            if(question_div.id){
                button.setAttribute('id', 'questionButton_' + i);
                $('#questionButton_'+i).click(async function(){
                    // you must get the id this way, otherwise it will not work.
                    var question_id = codes[i].parentNode.parentNode.id;
                    var code = codes[i].parentNode.firstChild.innerHTML;
                    var link = (question_div.parentNode.parentNode).children[3].value;
                    copyToClipboard(code);
                    await sendPostMessageToExtension(question_id, 'question', code, link);
                });
            }

            if(answer_div.id){
                button.setAttribute('id', 'answerButton_' + i);
                $('#answerButton_'+i).click(async function(){
                    var answer_id = codes[i].parentNode.parentNode.parentNode.id;
                    var code = codes[i].parentNode.firstChild.innerHTML;
                    var link = answer_div.parentNode.children[3].value;
                    copyToClipboard(code);
                    await sendPostMessageToExtension(answer_id, 'answer', code, link);
                });
            }

            function copyToClipboard(value){
                var e = document.createElement('textarea');
                e.value = value;
                e.setAttribute('readonly', '');
                document.body.appendChild(e);
                e.select();
                document.execCommand('copy');
                document.body.removeChild(e);
            }

            /**
             * 
             * @param {question or answer id} id 
             * @param {indicate if it's a question or answer} stringType  
             * @param {the code copied by the user.} code 
             */
            async function sendPostMessageToExtension(id, stringType, code, link){
                //answer id = 1077349 
                const post_url = 'https://api.stackexchange.com/2.3/posts/'+ id +'?order=desc&sort=activity&site=stackoverflow&filter=!nNPvSNQ6rQ';

                ////////////////////////////////////////
                //an error might accure. do with try catch later.
                let fetchResult = await fetch(post_url);
                let data = await fetchResult.json();
                console.log(data);
                var post = data.items[0]; 

                console.log(post);
                
                vscode.postMessage({
                    command: 'copy', // code has been copied.
                    id: id, 
                    dateCopied: Date.now(),
                    lastEdited: post.last_edit_date,
                    code: code, 
                    post: post.body,
                    link: link, // question or answer link.
                    seen: false, 
                    isHidden: false
                });
                ///////////////////////////////////////

            }

        }
    }

    //no search results, and no empty submits. 
    function createErrorHTML(message){
        const errorCointainer = document.getElementById('errorCointainer');
        //empty errorCointainer if its not empty.
        errorCointainer.innerHTML = '';
        
        var errorDiv = document.createElement('div');
        errorDiv.setAttribute('class', 'alert alert-danger text-center');
        errorDiv.setAttribute('role', 'alert');
    
        errorDiv.innerHTML = message;
    
        errorCointainer.appendChild(errorDiv);
    }

    function clearErrorHTML(){
        $('#errorCointainer').html('');
    }


    function questionTemplate(title, text, dataTarget, link, answers, questionID){
        return `
             <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed bg-info-subtle" type="button" data-bs-toggle="collapse" data-bs-target="#`+ dataTarget +`" aria-expanded="false" aria-controls="flush-collapseOne">
                        `+ title +`
                        </button>
                    </h2>
                    <div id="`+ dataTarget +`" class="accordion-collapse collapse" data-bs-parent="#accordionFlushDiv">
                        <div class="accordion-body">
        
                            <div class="card" >
                                <h5 class="card-header">Question</h5>
                                <div class="card-body" id="`+ questionID +`">
                                    <h5 class="card-title">`+ title +`</h5>
                                    <p class="card-text">
                                        `+ text +`
                                    </p>
                                    <a href="`+ link +`" class="card-link" target='_blank'>
                                        View Original Question On StackOverflow
                                    </a>
                                    <input id='x' type='hidden' value='`+ link +`'/>
                                </div>

                                <div id="answerContainer">
                                    `+ answers +`
                                </div>                         

                            </div>
                        </div>
                    </div>

                </div>
    `;
    }


    function answerTemplate(text, textStatusCSS, borderStatusCSS, btnStatus, icon = '', counter, answerID, link){
        return `
            <div class="card `+ borderStatusCSS +`">
                <div class="card-header `+ textStatusCSS +`">
                    <div id="showAnswerButton" class="d-grid gap-2">
                        <button class="btn `+ btnStatus +`" type="button">
                            `+ icon +`
                            Answer `+ counter +`
                        </button>
                    </div>
                </div>
                <div class="card-body" id="`+ answerID +`">
                    <blockquote class="blockquote mb-0">
                        `+ text +`
                    </blockquote>
                </div>
                <a href='`+ link +`'> Link to Answer on StackOverflow </a>
                <input type='hidden' value='`+ link +`'/>
            </div>
        `;
    }

    function getIcon(){
        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
        `;
    }

});