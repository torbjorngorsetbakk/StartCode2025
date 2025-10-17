var felt = document.getElementById('form');
var kategori = document.getElementById('kategori')

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
      felt.innerHTML = "";
}
    

function kategori(){
    
}