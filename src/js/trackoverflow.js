

// global variables. 
var has_more = null; // check if there are more elements before using fetch.

// global variables. 



var searchInput = document.getElementById('searchInput');
searchInput.focus();


var searchForm = document.getElementById('searchForm');

searchForm.addEventListener('submit', function(event){
    //clicking is really a pain with vscode, so don't submit.
    event.preventDefault();

    if(searchBoxNotEmpty()){
        getStackOverflowData();
    }
});

//validate functions and data.
function searchBoxNotEmpty(){
    if(!searchInput.value.trim().length){ 
        createErrorHTML('Empty Search Bar Not Allowed. Please Enter Text');
        return false;
    }
    
    clearErrorHTML();

    return true;
}

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
    // items might be on the list, so remove them.
    document.getElementById('accordionFlushDiv').innerHTML = '';
    document.getElementById('errorCointainer').innerHTML = '';
}


function toggleLoading(showLoading){
    if(showLoading){
        /**
         *  <div class="d-flex align-items-center">
                <strong role="status">Loading...</strong>
                <div class="spinner-border ms-auto" aria-hidden="true"></div>
            </div>
         */
        let loadingDiv = document.createElement('div');

        let loadingText = document.createElement('strong');
        let loadingLogo = document.createElement('div');

        loadingDiv.setAttribute('class', 'd-flex align-items-center');

        loadingText.setAttribute('role', 'status');
        loadingText.innerHTML = 'Loading...';

        loadingLogo.setAttribute('class', 'spinner-border ms-auto');
        loadingLogo.setAttribute('aria-hidden', 'true');
        
        // add elements to page.
        loadingDiv.appendChild(loadingText);
        loadingDiv.appendChild(loadingLogo);
        document.getElementById('loadingContainer').appendChild(loadingDiv);// add to doc
    }
    else{
        document.getElementById('loadingContainer').innerHTML = '';
    }
}


async function getStackOverflowData(page = 1){
    // if no elements, then inform user and exit.
    if(has_more === false){ // could be null, so i have to do this.
        
    }

    // might change this is vscode settings you implement later...
    const order = 'desc'; // desc, asc...
    const sort = 'relevance'; // relevance, activity, votes, creation...
    const pageSize = 10;
    ////////////////////////////////////////////////////////////////

    // set hash to default page, because it must always be set.
    location.hash = (page === 1) ? 1 : page;

    toggleLoading(true);

    const searchAPI = 'https://api.stackexchange.com/2.3/search?page='+ page +'&pagesize='+ pageSize +'&order='+ 
                        order +'&sort='+ sort +'&intitle='+ searchInput.value +'&site=stackoverflow&filter=!T3AudpgBenaj(RyF)D';
    let result = await fetch(searchAPI);
    let jsonData = await result.json();
    let items = jsonData.items;

    // set has more for next time.
    has_more = jsonData.has_more;

    console.log(jsonData);

    // clear old search value. double search might happend.
    document.getElementById('accordionFlushDiv').innerHTML = '';

    for(let i = 0; i < items.length; i++){
        createResultHTML(items[i], i);
    }

    if(!items.length){ // length == 0
        createErrorHTML('No Search results found for : "'+ searchInput.value + '"');
    }

    var codes = document.querySelectorAll('pre > code');
    for(let i = 0; i < codes.length; i++){
        codes[i].parentNode.after(getCopyButton()); // not working yet.
    }

    toggleLoading(false);

    createPaginationHTML(currentPage = page);// change this for page 2 to n.

}

function getCopyButton(){
    var button = document.createElement('button');
    button.setAttribute('class', 'btn btn-primary');
    button.innerHTML = 'Copy Code';

    return button;
}

function addCodeStyles(){
    var pre = document.querySelectorAll('pre');
    for(let i = 0; i < pre.length; i++){
        pre[i].style.backgroundColor = 'lightGrey';
    }

}

function createResultHTML(question, counter){

    var dataTarget = 'flush-collapse' + counter;
    var result = renderQuestionHTML(question.title, question.body, dataTarget);

    var accordionDiv = document.getElementById('accordionFlushDiv');

    var newDiv = document.createElement('div');
    newDiv.innerHTML = result;
    accordionDiv.appendChild(newDiv);

    addCodeStyles(); // add some styles.
}

function createPaginationHTML(currentPage, maxPages = 10){
    /**
     * pagination copied from boostrap 5 code examples, and recreated using code.
     */
    var ul = document.getElementById('paginationUL');
    ul.innerHTML = ''; // clear previous elements. 
    
    var pageCounter = 1;
    var linkClass = 'page-link fs-3';
    var liClass = null;
    
    for(pageCounter = 1; pageCounter <= maxPages; pageCounter++){
        //condition ? exprIfTrue : exprIfFalse
        liClass = (pageCounter === currentPage) ? 'page-item active' : 'page-item';
        
        createLI(ul, liClass, linkClass, pageCounter);

    }

    // nested function to create an li element.
    function createLI(pageUL, liClass, aClass, pageCounter, linkValue = null){
        var li = document.createElement('li');
        li.setAttribute('class', liClass);
        
        var a = document.createElement('a');
        a.setAttribute('class', aClass);

        if(linkValue === null){ //not empty. so fill value.
            a.innerHTML = pageCounter;
            a.setAttribute('href', '#' + pageCounter);
            a.addEventListener('click', function(){
                getStackOverflowData(pageCounter); // //must build a function that does this.
            });
        }
        else{// TODO: this is for 'Next' or 'Previous' buttons, for later.
            a.innerHTML = linkValue; 
        }
        
        li.appendChild(a);
        pageUL.appendChild(li);
    }
}

function renderQuestionHTML(title, text, dataTarget){
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
