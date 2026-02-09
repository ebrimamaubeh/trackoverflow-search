
async function getXMLDoc(filename) {
    try {
        const response = await fetch(filename);
        const xmlString = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // const name = xmlDoc.querySelector('name').textContent;
        // console.log(name);

        return xmlDoc; // you can use querySelector('x') to get the items in the xml.
    } catch (error) {
        console.error('Error loading XML:', error);
    }
}

//TODO: try to run test in vscode ... I bookmarked the link for this. continue toms. Insha Allah.

async function displayXMLData() {
    xmlFile_ai = './dataDump/ai/Posts.xml';
    xmlDoc = await getXMLDoc(xmlFile_ai);

    rows = xmlDoc.getElementsByTagName('row');

    // print 10 items. 
    for (var i = 0; i < 10; i++) {
        console.log(rows[i]);
    }
}

