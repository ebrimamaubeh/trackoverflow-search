$(document).ready(function(){

    const vscode = acquireVsCodeApi();

    window.addEventListener('message', mainDataStorage);


    function template(posts){
        if(posts.length > 0){
            var html = '<ul class="list-group">';
            for(var i = 0; i < posts.length; i++){
                html += '<li class="list-group-item"> <a href="#" class="posts-list" '+
                           'id="'+ posts[i].id +'"> '+ posts[i].link
                        + '</a></li>';
            }
            html += '</ul>';

            return html;
        }
        
        return '<p> No Data To Display </p>';
    }

    async function mainDataStorage(event){

        var command = event.data.command;

        if(command === 'list-posts'){
            clearDetailPageContent();

            setLoadingDiv('Loading Links');
            listCopiedLinks(event);
            clearLoadingDiv();
            clearBackButton();

        }
        else if(command === 'detail-post'){
            clearLinksPageContent();

            setLoadingDiv('Loading Detail Page');
            getDetailPageHTML(event);
            clearLoadingDiv();

            addBackButton();

            //send a post message to indicate message is seen.
            updatePostSeen(event.data.post);
        }

    }

    function updatePostSeen(post){
        vscode.postMessage({
            command: 'update-seen', 
            post: post
        });
    }

    function getDetailPageHTML(event){
        const post = event.data.post;

        var contentDiv = document.getElementById('detailPageContent');

        const url = 'https://api.stackexchange.com/2.3/posts/'+ post.id +'/revisions?fromdate='+ 
                        post.dateCopied +'&site=stackoverflow&filter=!nNPvSNH9Kx';

        fetch(url)
        .then(response => {
          if (!response.ok) {throw new Error(`Failed to fetch data: ${response.status}`);}
          return response.json();
        }).then(data => {
            const revisions = data.items;

            var revisionHTML = '<div class="accordion" id="accordionRevision">';
            for(var i = 0; i < revisions.length; i++){
                var body = revisions[i].body;
                var comment = revisions[i].comment;
                if(body && body.length > 0){// not null or undefined.
                    comment = comment ? comment: 'see code changes below';
                    revisionHTML += getAccordionItem(comment, body, i);
                }
            }
            revisionHTML += '</div>';

            contentDiv.innerHTML = revisionHTML;
        }).catch(error => { console.error('Error:', error); });
        
    }

    function addBackButton(){
        var backButtonDiv = document.getElementById('backButtonDiv');
        
        var backButton = document.createElement('button');
        backButton.setAttribute('class', 'btn btn-primary');
        backButton.innerHTML = 'Back To Posts';
        
        backButtonDiv.appendChild(backButton);

        backButton.addEventListener('click', function(){
            vscode.postMessage({
                command: 'back-button'
            });
        });

        // backButtonDiv.innerHTML = `<button type="button" class="btn btn-primary"> Back To Updated Posts </button>`;
    }

    function clearLinksPageContent(){
        document.getElementById('linksDiv').innerHTML = '';
        document.getElementById('pagination').innerHTML = '';
    }

    function setLoadingDiv(message){
        var loadingDiv = document.getElementById('loadingContainer');
        loadingDiv.innerHTML = '<p class="display-1 text-center">'+ message +'</p>';
    }
    function clearLoadingDiv(){
        document.getElementById('loadingContainer').innerHTML = '';
    }

    function clearDetailPageContent(){
        document.getElementById('detailPageContent').innerHTML = '';
    }

    function clearBackButton(){
        document.getElementById('backButtonDiv').innerHTML = '';
    }

    function getAccordionItem(comment, body = '', counter){
        return `<div class="accordion-item">
                    <h2 class="accordion-header" id="heading`+ counter +`">
                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse`+ counter +`" aria-expanded="true" aria-controls="collapse`+ counter +`">
                        `+ comment +`
                    </button>
                    </h2>
                    <div id="collapse`+ counter +`" class="accordion-collapse collapse show" aria-labelledby="heading`+ counter +`" data-bs-parent="#accordionRevision">
                    <div class="accordion-body">
                        `+ body +`
                    </div>
                    </div>
                </div>`;
    }

    function listCopiedLinks(event){
        var updated_posts = event.data.updated_posts;
        let container = $('#pagination');
        container.pagination({
            pageSize: 10, 
            showGoInput: true,
            showGoButton: true,
            dataSource: updated_posts,
            callback: function (data) {
                var html = template(data);
                $("#linksDiv").html(html);

                $('#loadingContainer').html('');

                // add onclick on first button
                addOnClickToPostLinks();
            }
        });

        function addOnClickToPostLinks(){
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