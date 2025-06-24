$(document).ready(function () {

    const vscode = acquireVsCodeApi();

    window.addEventListener('message', mainDataStorage);


    function template(posts) {
        /**
         * Note: the links are correct, the parent element link is being use here (ie the question)
         * Also, it takes time for the DataStorage elements to work, must re-run a few times. 
         */
        if (posts.length > 0) {
            console.log('in function');
            var html = '<ul class="list-group">';
            for (var i = 0; i < posts.length; i++) {
                html += '<li class="list-group-item"> <a href="#" class="posts-list" ' +
                    'id="' + posts[i].id + '"> ';

                const post_link = posts[i].link ? posts[i].link : posts[i].id;

                html += post_link + '</a> </li>';

                console.log('posts[i]: ', posts[i]);
            }
            html += '</ul>';

            return html;
        }

        return '<p> No Data To Display </p>';
    }

    function getRevisionListElements(revisions) {
        if (!revisions) { return; }

        var li = '';
        for (var i = 0; i < revisions.length; i++) {
            if (revisions[i].comment) {
                li = '<li class="list-group-item"> <a href="#" class="posts-list" ' +
                    'id="' + revisions[i].post_id + '">' + revisions[i].comment + '</a> </li>';
            }
            else {
                li = '<li class="list-group-item"> <a href="#" class="posts-list" ' +
                    'id="' + revisions[i].post_id + '">' + revisions[i].post_id + '</a> </li>';
            }
            li += '<br>';
        }

        return li;
    }

    function getCommentListElements(comments) {
        if (!comments) { return; }

        var li = '';
        for (var i = 0; i < comments.length; i++) {
            li = '<li class="list-group-item"> <a href="#" class="comments-list" ' +
                'id="' + comments[i].comment_id + '">' + comments[i].link + '</a> </li>';

            li += '<br>';
        }

        return li;
    }

    async function mainDataStorage(event) {

        var command = event.data.command;

        console.log('message.postevent: ', event);

        //TODO:  I think this should be removed. exchange to revisions.
        // if(command === 'list-posts'){
        //     clearDetailPageContent();

        //     setLoadingDiv('Loading Links');
        //     listCopiedLinks(event);
        //     clearLoadingDiv();
        //     clearBackButton();
        //     clearHideButton();

        // }
        if (command === 'list-post-revisions-comments') {
            /**
             * Don't copy functions above, some of the functions have changed. 
             * Solve tomorrow.
             */


            console.log('todo: back button makes link undefined.');

            const comments = event.data.comments_with_snippets;
            const revisions = event.data.revisions_with_snippets;

            console.log('revisions: ', revisions);
            console.log('comments: ', comments);


            // call funcsions
            var commentsLiHTML = getCommentListElements(comments);
            var postLiHTML = getRevisionListElements(revisions);
            var template_list = [postLiHTML, commentsLiHTML];
            console.log('template-list: ', template_list);
            // call functions.

            clearDetailPageContent();
            setLoadingDiv('Loading Links');
            // listCopiedLinks(event); // here... continue... (comment clicks not working.)
            listRevisionsAndCommentsLinks(template_list);
            clearLoadingDiv();
            clearBackButton();
            clearHideButton();

        }
        else if (command === 'detail-revision-post') {
            clearLinksPageContent();

            const post = event.data.post;
            const revisions_with_comments = event.data.revisions_with_comments;
            setLoadingDiv('Loading Detail Page');
            getDetailRevisionPageHTML(post, revisions_with_comments);
            clearLoadingDiv();

            addBackButton();
            addHideButton(event.data.post.id); // TODO; here. change.

            //send a post message to indicate message is seen.
            updatePostSeen(event.data.post);
        }
        else if (command === '') {

        }

    }

    function updatePostSeen(post) {
        vscode.postMessage({
            command: 'update-seen',
            post: post
        });
    }

    function getDetailRevisionPageHTML(post, revisions_with_comments) {

        //throw ('you must check todo.txt number 0.');
        //TODO: no need to get the revisions, you already have them.

        var contentDiv = document.getElementById('detailPageContent');

        const url = 'https://api.stackexchange.com/2.3/posts/' + post.id + '/revisions?fromdate=' +
            post.dateCopied + '&site=stackoverflow&filter=!nNPvSNH9Kx';

        fetch(url)
            .then(response => {
                if (!response.ok) { throw new Error(`Failed to fetch data: ${response.status}`); }
                return response.json();
            }).then(data => {
                const revisions = data.items;

                var revisionHTML = '<div class="accordion" id="accordionRevision">';
                revisionHTML += `   <h6> Copied Code: </h6>
                                <div> ========================================== </div>
                                    <div class='text-secondary'>`+ post.code + `</div>
                                <div> ========================================== </div>
                                <br> `;
                for (var i = 0; i < revisions.length; i++) {
                    var body = revisions[i].body;
                    var comment = revisions[i].comment;

                    comment = comment ? comment : 'see code changes below';
                    body = body ? body : '';

                    revisionHTML += getAccordionItem(comment, body, i);
                }
                revisionHTML += '</div>';

                contentDiv.innerHTML = revisionHTML;
            }).catch(error => { console.error('Error:', error); });

    }

    function addBackButton() {
        var backButtonDiv = document.getElementById('backButtonDiv');

        var backButton = document.createElement('button');
        backButton.setAttribute('class', 'btn btn-primary');
        backButton.innerHTML = 'Back To Posts';
        backButtonDiv.appendChild(backButton);

        backButton.addEventListener('click', function () {
            vscode.postMessage({
                command: 'back-button'
            });
        });

    }

    function addHideButton(id) {
        var hideButtonDiv = document.getElementById('hideButtonDiv');

        var hideButton = document.createElement('button');
        hideButton.setAttribute('class', 'btn btn-danger');
        hideButton.innerHTML = 'Hide Revisions';
        hideButtonDiv.appendChild(hideButton);

        hideButton.addEventListener('click', function () {
            vscode.postMessage({
                command: 'hide-button',
                post_id: id
            });
        });
    }

    function clearLinksPageContent() {
        document.getElementById('linksDiv').innerHTML = '';
        document.getElementById('pagination').innerHTML = '';
    }

    function setLoadingDiv(message) {
        var loadingDiv = document.getElementById('loadingContainer');
        loadingDiv.innerHTML = '<p class="display-1 text-center">' + message + '</p>';
    }
    function clearLoadingDiv() {
        document.getElementById('loadingContainer').innerHTML = '';
    }

    function clearDetailPageContent() {
        document.getElementById('detailPageContent').innerHTML = '';
    }

    function clearBackButton() {
        document.getElementById('backButtonDiv').innerHTML = '';
    }

    function clearHideButton() {
        document.getElementById('hideButtonDiv').innerHTML = '';
    }

    function getAccordionItem(comment, body = '', counter) {
        return `<div class="accordion-item">
                    <h2 class="accordion-header" id="heading`+ counter + `">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse`+ counter + `" aria-expanded="true" aria-controls="collapse` + counter + `">
                        `+ comment + `
                    </button>
                    </h2>
                    <div id="collapse`+ counter + `" class="accordion-collapse collapse show" aria-labelledby="heading` + counter + `" data-bs-parent="#accordionRevision">
                    <div class="accordion-body">
                        `+ body + `
                    </div>
                    </div>
                </div>`;
    }


    function listCopiedLinks(event) {
        var updated_posts = event.data.updated_posts;
        console.log('in datastrogae: updated_post: ', updated_posts);
        let container = $('#pagination');
        container.pagination({
            pageSize: 10,
            dataSource: updated_posts,
            callback: function (data) {
                var html = template(data);
                $("#linksDiv").html(html);

                $('#loadingContainer').html('');

                // add onclick on first button
                addOnClickToPostLinks();
            }
        });

        function addOnClickToPostLinks() {
            const links = document.querySelectorAll('.posts-list');
            links.forEach(link => {
                link.addEventListener('click', (event) => {
                    vscode.postMessage({
                        command: 'dataStorage-detail-page',
                        post_id: link.id
                    });
                });
            });
        }
    }


    function listRevisionsAndCommentsLinks(template_list) {
        //this function has been highly modivied with templates list, datasorce...
        let container = $('#pagination');
        container.pagination({
            pageSize: 10,
            dataSource: template_list,
            callback: function (template_list) {

                // ul outter element.

                var postLIs = template_list[0];
                var commentLIs = template_list[1];

                var html = '<ul class="list-group">';
                html = postLIs + commentLIs;
                html += '</ul>';
                // here...
                $("#linksDiv").html(html);

                $('#loadingContainer').html('');

                // add onclick on first button
                addOnClickToPostLinks();
            }
        });

        function addOnClickToPostLinks() {
            const links = document.querySelectorAll('.posts-list');
            links.forEach(link => {
                link.addEventListener('click', (event) => {
                    vscode.postMessage({
                        command: 'dataStorage-detail-page',
                        post_id: link.id
                    });
                });
            });
        }
    }



});