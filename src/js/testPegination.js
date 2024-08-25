$(document).ready(function(){

    // global variables. 
    var has_more = null;

    $('#searchForm').submit(searchFormSubmitHandler);

    async function searchFormSubmitHandler(event){
        event.preventDefault();

        var searchInputValut = $('#searchInput').val(); // validate later. trim and not empty.
        
        var jsonData = await getStackOverflowData(searchInputValut);
        has_more = jsonData.has_more;
        var items = jsonData.items; // this might increase later. > 100 items. 
        console.log(jsonData);

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
                addCopyButton();
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
            var qt = questionTemplate(items[i].title, items[i].body, dataTarget);
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


    function questionTemplate(title, text, dataTarget){
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
                                <a href="#" class="card-link">Card link</a>
                            </div>
                        </div>
    
                    </div>
                  </div>
                </div>
    `;
    }

});