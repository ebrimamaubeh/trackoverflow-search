$(document).ready(function(){

    // global variables. 
    var has_more = null;

    $('#searchForm').submit(searchFormSubmitHandler);
    

    async function searchFormSubmitHandler(event){
        event.preventDefault();

        var searchInputValut = $('#searchInput').val(); // fix no search result.

        //////////////  Handle empty search box error  ///////////////
        if(searchInputValut.trim().length === 0){
            createErrorHTML('Error: Search Box Cannot Be Empty!');
            return;
        }
        clearErrorHTML();
        //////////////  Handle empty search box error  ///////////////
        
        var jsonData = await getStackOverflowData(searchInputValut);
        has_more = jsonData.has_more;
        var items = jsonData.items; // this might increase later. > 100 items. 
        console.log(jsonData);

        //////////////  Handle empty search box error  ///////////////
        if(items.length === 0){
            var message = '<h1>Error: No Search Results Found For Input: "'+ searchInputValut + '"</h1>';
            createErrorHTML(message);
            return;
        }
        clearErrorHTML();
        //////////////  Handle empty search box error  ///////////////

        let container = $('#pagination');
        container.pagination({
            pageSize: 10,
            showGoInput: true,
            showGoButton: true,
            dataSource: items,
            callback: function (data, pagination) {
                var html = template(data);
                $("#accordionFlushDiv").html(html);
                
                // call more functions.
                addCodeStyles(); 
                addCopyButton();// add onclick on all buttons later.    
            }, 
            beforePaging: function(value){
                //TODO; later, use this if you want more that 10 results. 
                //alert(value); // working...
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

    function template(items){
        var html = '';
        for(var i = 0; i < items.length; i++){
            var dataTarget = 'flush-collapse' + i;
            var qt = questionTemplate(items[i].title, items[i].body, dataTarget, items[i].link);
            html += qt;
        }
        
        return html;
    }

    function addCodeStyles(){
        var pre = document.querySelectorAll('pre');
        for(let i = 0; i < pre.length; i++){
            pre[i].style.backgroundColor = 'lightGrey';
            pre.appe
        }
    }

    function addCopyButton(){
        var codes = document.querySelectorAll('pre > code');
        for(let i = 0; i < codes.length; i++){
            var button = document.createElement('button');
            button.setAttribute('class', 'btn btn-primary');
            button.innerHTML = 'Copy Code';
            codes[i].parentNode.after(button); // not working yet.
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
        const errorCointainer = document.getElementById('errorCointainer');
        errorCointainer.innerHTML = '';
    }


    function questionTemplate(title, text, dataTarget, link){
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
                            <div class="card-body">
                                <h5 class="card-title">`+ title +`</h5>
                                <p class="card-text">
                                    `+ text +`
                                </p>
                                <a href="`+ link +`" class="card-link" target='_blank'>
                                    View Original Question On StackOverflow.
                                </a>
                            </div>
                        </div>
    
                    </div>
                  </div>
                </div>
    `;
    }

});