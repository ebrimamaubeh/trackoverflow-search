function addHideButton(id){
    var hideButtonDiv = document.getElementById('hideButtonDiv');

    var hideButton = document.createElement('button');
    hideButton.setAttribute('class', 'btn btn-danger');
    hideButton.innerHTML = 'Hide Revisions';
    hideButtonDiv.appendChild(hideButton);

    hideButton.addEventListener('click', function(){
        vscode.postMessage({
            command: 'hide-button', 
            post_id: id
        });
    });
}