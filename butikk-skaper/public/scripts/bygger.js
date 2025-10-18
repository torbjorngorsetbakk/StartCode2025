var felt = document.getElementById('form');
var kategori = document.getElementById('kategori')

var kategoriObjekt = {}


var valgtRute = NaN;
var sisteRute = NaN;
var ruteIndeks = NaN;
let ruteElement;


function klikk(element, rad, kol, indeks){
    element.style = "border:solid red 2px;"
    valgtRute = element;


    if(valgtRute != sisteRute){
        sisteRute.style = "";
        sisteRute = valgtRute;

    }
    ruteIndeks = indeks;
    ruteElement = element;

    document.getElementById("kategorierTekst").innerHTML = kategoriObjekt.ruter[indeks];
}

//Skamløst stjålet fra Phrogz - https://stackoverflow.com/questions/9140101/creating-a-clickable-grid-in-a-web-browser
function clickableGrid( rows, cols, callback ){
    var i=0;
    var grid = document.createElement('table');
    grid.className = 'grid';
    for (var r=0;r<rows;++r){
        var tr = grid.appendChild(document.createElement('tr'));
        for (var c=0;c<cols;++c){
            var cell = tr.appendChild(document.createElement('td'));
            cell.innerHTML = ++i;
            cell.className = "kloss";
            cell.addEventListener('click',(function(el,r,c,i){
                return function(){
                    callback(el,r,c,i);
                }
            })(cell,r,c,i),false);
        }
    }
    return grid;
}

function skapKnapper(){
    var rader = document.getElementById('rader').value;
    var kolonner = document.getElementById('kolonner').value;
    
    document.body.append(clickableGrid(rader, kolonner, klikk));
    felt.style = "display: none;";


    //Lager et skjelett for JSON objektet som holder alle kategoriene
    kategoriObjekt.ruter = [];
    for(var i = 0; i < (rader * kolonner); i++){
        kategoriObjekt.ruter[i] = [];
    }

}
    

function settKategori(){
    if(isNaN(ruteIndeks)){
        return;
    }

    //Hvis en rute er en hylle er den ikke noe annet enn en hylle 
    if(kategori.value == "hylle"){
        kategoriObjekt.ruter[ruteIndeks] = ["hylle"];
        document.getElementById("kategorierTekst").innerHTML = kategoriObjekt.ruter[ruteIndeks];

        //Oppdater farge
        ruteElement.className = "hylle kloss";
        return;
    }

    //Sjekk om "Hylle" ligger i arrayen og fjern den hvis vi legger til en annen verdi
    if(kategoriObjekt.ruter[ruteIndeks] == ["hylle"]){
        kategoriObjekt.ruter[ruteIndeks] = [];
    } 

    kategoriObjekt.ruter[ruteIndeks].push(kategori.value);

    //Skriv tekst
    document.getElementById("kategorierTekst").innerHTML = kategoriObjekt.ruter[ruteIndeks];

    //Oppdater farge
    ruteElement.className = "fylt kloss";

    return;
}

function eksporterKartKolonner(){
    return [kategoriObjekt, document.getElementById('kolonner').value, document.getElementById('rader').value];
}

