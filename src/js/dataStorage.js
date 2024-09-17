$(document).ready(function(){
    /**
     * 1. Go back and store titles, when question is being copied, store title. 
     * 2. when the answer is being copied, query the question, and store title.
     * 3. then list the titles here. 
     * 4. after users click the titles, get revisions.
     */

    window.addEventListener('message', listCopiedCodeLinks);


    function template(links){
        console.log(links);
        //TODO: add links to click.
        if(links.length > 0){
            var html = '<ul class="list-group">';
            for(var i = 0; i < links.length; i++){
                html += '<li class="list-group-item"> <a href="/"> '+ links[i] +' </a></li>';
            }
            html += '</ul>';

            return html;
        }
        
        return '<p> No Data To Display </p>';
    }

    async function listCopiedCodeLinks(event){
        const links = event.data.links;

        let container = $('#pagination');
        container.pagination({
            pageSize: 10, 
            showGoInput: true,
            showGoButton: true,
            dataSource: links,
            callback: function (data) {
                var html = template(data);
                $("#linksDiv").html(html);

                $('#loadingContainer').html(''); 
            }
        });

        // vscode.postMessage({
        //     command: 'dataStorage-html', 
        // });
    }
});