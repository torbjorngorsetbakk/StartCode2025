async function kartleggVegger(inndata) {
    kart = inndata[0];
    kolonner = parseInt(inndata[1]);
    rader = parseInt(inndata[2]);

    butikknavn = document.getElementById("butikknavn").value;

    console.log("Jaaa...");
    /*Tar inn butikkart i JSON format som input
    
    Objektet skal være en liste fra-til verdier med retning. 0 for horisontal, 1 for vertikal
    {
        "vegger":[
        {
            "fra": 7,
            "til": 13,
            "retning": 0
        },
        {
            "fra": 11,
            "til": 49,
            "retning": 1
        }
    }
    */
    var veggerObjekt = {
        "fra": [],
        "til": [],
        "retning": []
    };
    var indeks = 0;
    var veggIndeks = 0;


    while (indeks < (rader * kolonner)) {

        if (kart.ruter[indeks] == "hylle") {
            veggerObjekt.fra[veggIndeks] = indeks;

            console.log("jhoa");
            if (kart.ruter[indeks + 1] == "hylle") {
                veggerObjekt.retning[veggIndeks] = 0;
            } else {
                veggerObjekt.retning[veggIndeks] = 1;
            }

            switch (veggerObjekt.retning[veggIndeks]) {
                case 0:
                    while (kart.ruter[indeks] == "hylle") {
                        kart.ruter[indeks] = "";
                        indeks++;
                    }

                    veggerObjekt.til[veggIndeks] = indeks - 1;

                    break;

                case 1:
                    let tempVertikalIndeks = indeks;
                    while (kart.ruter[tempVertikalIndeks] == "hylle") {
                        kart.ruter[tempVertikalIndeks] = "";
                        console.log(indeks);
                        tempVertikalIndeks += kolonner;
                        console.log(indeks);
                    }

                    veggerObjekt.til[veggIndeks] = tempVertikalIndeks - kolonner;
                    break;

            }
            veggIndeks++;
        }
        
        indeks++;
    }

    var butikk_id_fetch = await fetch("http://localhost:3000/butikkBygger/nyButikk", {
        method: 'POST',
        body: JSON.stringify({
            "rader": rader,
            "kolonner": kolonner,
            "navn": butikknavn
        }),
        headers: {"Content-type": "application/json; charset=UTF-8"}
    });

    var butikk_id = await butikk_id_fetch.text();
    veggerObjekt.butikk_id = butikk_id;

    console.log(veggerObjekt);
    fetch("http://localhost:3000/butikkBygger/nyeHyller", {
        method: 'POST',
        body: JSON.stringify(veggerObjekt),
        headers: {"Content-type": "application/json; charset=UTF-8"}
    });
}



