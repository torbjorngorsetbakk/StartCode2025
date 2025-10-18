let prodInput = '';
let qResponse = {produkter: []};
let firstLoad = true;
let shopLists = [
    {
        "shopListId": "12",
        "wares": [1001, 1002, 1003, 1005],
    },
    {
        "shopListId": "13",
        "wares": [1031, 1054, 1012, 1080],
    },
];


view();
async function view() {
    if (firstLoad) {
        document.getElementById('app').innerHTML = /*HTML*/`
            <div class="static">Pordukt: <input id="prodId" type="text"></div>
            <div id="shopList"></div>
        `;
        shopListElement = document.getElementById('shopList');
        const input = document.getElementById('prodId');
        input.addEventListener('input', (e) => { prodInput = e.target.value; view(); });
        firstLoad = false;
    }

    shopListElement.innerHTML = /*HTML*/`
   ${await getProdListHTML()}
    `;
}

async function getProdListHTML() {
    await getSearchData();

    let LIST = /*HTML*/`<div class="container">`; // products flex container

    // Check if qResponse has data
    if (qResponse && qResponse.produkter.length > 0) {
        // console.log("Goes into if in getProdListHTML")
        for (let i = 0; i < qResponse.produkter.length; i++) {
            LIST += /*HTML*/`
                <div class="box">
                    <div class="boxL">
                        <div class="item prodName">${qResponse.produkter[i].name}</div>
                        <div class="item prodDesc">${qResponse.produkter[i].description}</div>
                    </div>
                     <div class="item checkboxbox"><input type="checkbox" class="big"></div>
                </div>
            `;
            // console.log(LIST);
        }
        LIST += /*HTML*/`</div>`;
    } 
    else {
        LIST = /*HTML*/ `<div>No results found</div>`;
    }

    return LIST;
}

async function getSearchData() {
    const q = (prodInput || '').trim();
    if (!q) { console.log("Nothing in field"); return; }
    qResponse = await getDataByName(q);

    // ids might be an array or an object with a 'produkter' array
    const arr = Array.isArray(qResponse) ? qResponse : (qResponse && Array.isArray(qResponse.produkter) ? qResponse.produkter : []);
    if (!arr.length) { console.log("Response arary empty"); return; }
}

async function getDataByName(navn) {
    const url = "http://10.10.30.176:3000/navn";
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ navn }),
            headers: { "Content-Type": "application/json; charset=UTF-8" }
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);
        return result;
    } catch (error) {
        console.error(error.message);
        return 'Error fetching data';
    }
}
 
async function getShopListById(id = int) {
    const url = `http://10.10.30.176:3000/hentHandleliste?id=${id}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);
        return result;
    } catch (error) {
        console.error(error.message);
        return 'Error fetching data';
    }
}

function createShopList (items = []) {
    const arr = [{shopListId: "12",items}];
    shopLists.push(...arr);
}