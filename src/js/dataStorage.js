$(document).ready(function(){
    /**
     * 1. Go back and store titles, when question is being copied, store title. 
     * 2. when the answer is being copied, query the question, and store title.
     * 3. then list the titles here. 
     * 4. after users click the titles, get revisions.
     */

    window.addEventListener('message', listCopiedCodeLinks);


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

    async function listCopiedCodeLinks(event){
        if(!event.data.has_items){
            return;
        }

        // const links = event.data.links;
        const posts_ids = event.data.posts_ids;
        const local_posts = event.data.local_posts;
        var updated_posts = event.data.updated_posts;

        console.log('event.data: ', event.data);

        console.log('updated_posts: ', updated_posts);
    
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
                    console.log(`Clicked link with ID: ${link.id}`);
                });
            });
        }


        // vscode.postMessage({
        //     command: 'dataStorage-html', 
        // });
    }
});