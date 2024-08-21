var searchInput = document.getElementById('searchInput');
searchInput.focus();


var searchForm = document.getElementById('searchForm');

searchForm.addEventListener('submit', function(event){
    //clicking is really a pain with vscode, so don't submit.
    event.preventDefault();

    getStackOverflowData();
});


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


async function getStackOverflowData(){
    // might change this is vscode settings you implement later...
    const page = 1;
    const order = 'desc'; // desc, asc...
    const sort = 'relevance'; // relevance, activity, votes, creation...
    const pageSize = 100;
    ////////////////////////////////////////////////////////////////

    // filter using the question using quesiton id.
    /**
     * https://api.stackexchange.com/2.3/questions/15182496?order=desc&sort=activity&site=stackoverflow&filter=!*Mg4PjfgUgqOW6wX
     */

    toggleLoading(true);

    const searchAPI = 'https://api.stackexchange.com/2.3/search?page='+ page +'&pagesize='+ pageSize +'&order='+ 
                        order +'&sort='+ sort +'&intitle='+ searchInput.value +'&site=stackoverflow&filter=!*Mg4PjfgUgqOW6wX';
    let result = await fetch(searchAPI);
    let jsonData = await result.json();
    let items = jsonData.items;

    for(let i = 0; i < items.length; i++){
        console.log(items[i]);
        createResultHTML(items[i], i);
    }

    var codes = document.querySelectorAll('pre > code');
    for(let i = 0; i < codes.length; i++){
        codes[i].parentNode.after(getCopyButton()); // not working yet.
    }

    toggleLoading(false);

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
