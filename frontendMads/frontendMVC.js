const model = {
    products: [
        {
            "productId": "1001",
            "gtin": "7091234000013",
            "name": "Grovt brød 750 g",
            "description": "Nybakt, grovt brød med høy fiber.",
            "price": 44.18,
            "pricePerUnit": 58.91,
            "unit": "kg",
            "allergens": "hvete, gluten, melk",
            "carbonFootprintGram": 325,
            "organic": false
        },
        {
            "productId": "1002",
            "gtin": "7091234000020",
            "name": "Fint brød 750 g",
            "description": "Luftig hverdagsbrød.",
            "price": 29.19,
            "pricePerUnit": 38.92,
            "unit": "kg",
            "allergens": "hvete, gluten",
            "carbonFootprintGram": 404,
            "organic": false
        },
        {
            "productId": "1003",
            "gtin": "7091234000037",
            "name": "Surdeigsbrød 800 g",
            "description": "Langtidshevet med sprø skorpe.",
            "price": 25.95,
            "pricePerUnit": 32.44,
            "unit": "kg",
            "allergens": "hvete, gluten",
            "carbonFootprintGram": 395,
            "organic": false
        },
        {
            "productId": "1004",
            "gtin": "7091234000044",
            "name": "Rundstykker 600 g",
            "description": "6 stk grove rundstykker.",
            "price": 43.06,
            "pricePerUnit": 71.77,
            "unit": "kg",
            "allergens": "hvete, gluten, sesam",
            "carbonFootprintGram": 874,
            "organic": false
        },
            {
        "productId": "1012",
        "gtin": "7091234000129",
        "name": "Lettmelk 1 l",
        "description": "Lettmelk 1,0% fett.",
        "price": 46.71,
        "pricePerUnit": 46.71,
        "unit": "l",
        "allergens": "melk, laktose",
        "carbonFootprintGram": 593,
        "organic": false
    },
    {
        "productId": "1013",
        "gtin": "7091234000136",
        "name": "Skummet melk 1 l",
        "description": "Skummet melk.",
        "price": 28.02,
        "pricePerUnit": 28.02,
        "unit": "l",
        "allergens": "melk, laktose",
        "carbonFootprintGram": 663,
        "organic": false
    },
    {
        "productId": "1014",
        "gtin": "7091234000143",
        "name": "Yoghurt naturell 500 g",
        "description": "Naturell yoghurt.",
        "price": 32.11,
        "pricePerUnit": 64.22,
        "unit": "kg",
        "allergens": "melk, laktose",
        "carbonFootprintGram": 1428,
        "organic": false
    },
    ],
    inputs: {
        prodInput: '',
    }
}

const appElement = document.getElementById('app');

loadPage();
function loadPage() {
    document.getElementById('static').innerHTML = /*HTML*/`
    Pordukt: <input id="prodId" type="text"><br/>
    `;
    
    const input = document.getElementById('prodId'); 
    input.addEventListener('input', (e) => { model.inputs.prodInput = e.target.value; view(); });
}

view();
function view() {
    appElement.innerHTML = /*HTML*/`
   ${getProdListHTML()}
    `;
}

function getProdListHTML() {
    let LIST = /*HTML*/`
        <div>${getSearchID()}<div/>
    `;
    return LIST;
}

function getSearchID() {
  const q = (model.inputs.prodInput || '').trim();  
  if (!q) return 'nothing'; // nothing to show when input empty

  const ids = model.products
    .filter(prod => prod.name.toLowerCase().includes(q.toLowerCase()))
    .map(prod => prod.productId);

  return ids.length ? ids.join(', ') : 'No matches';
}
