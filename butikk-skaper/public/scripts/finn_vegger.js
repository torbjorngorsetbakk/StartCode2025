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

    console.log(kart);

    kartleggHylleposisjoner(kart, kolonner, rader, butikk_id);
}



async function kartleggHylleposisjoner(_kart, _kolonner, _rader, _butikk_id) {
    console.log("Starter med å kartlegge hylleposisjoner");

    kart = _kart;
    kolonner = _kolonner;
    rader = _rader;
    butikk_id = _butikk_id;

    var arrayIndeks = 0;

    var produktposisjon = {
        "fra": [],
        "til": [],
        "retning": [],
        "produktHylle": [],
        "butikk_id": butikk_id
    };

    var indeks = 0;

    while(indeks < rader * kolonner){
        console.log("Starter indeksering")
        //Loop gjennom hver indeks i kartet til alle produktgruppene er tatt høyde for 
        while(kart.ruter[indeks].length > 0){
            let produktHylle = kart.ruter[indeks][0];
            console.log(produktHylle);
            
            console.log("Stor while");
            console.log(indeks);

            produktposisjon.produktHylle[arrayIndeks] = produktHylle;
            produktposisjon.fra[arrayIndeks] = indeks;
            
            //Finn retning. Vi trenger ikke teste om det er et objekt under. Om det er en 1x1 plass vil den uansett se lik ut i databasen
            if (kart.ruter[indeks + 1].includes(produktHylle)) {
                produktposisjon.retning[arrayIndeks] = 0;
            } else {
                produktposisjon.retning[arrayIndeks] = 1;
            }

            //Switch case for bort eller ned
            switch (produktposisjon.retning[arrayIndeks]) {
                case 0:
                    let tempIndeks = indeks;

                    while (kart.ruter[tempIndeks].includes(produktHylle)) {
                        //Fjern det aktive elementet
                        kart.ruter[tempIndeks].splice(0, 1);
                        tempIndeks++;
                        if(tempIndeks > rader * kolonner){break;}
                        console.log("Case 0");
                    }

                    produktposisjon.til[arrayIndeks] = tempIndeks - 1;

                    break;

                case 1:

                    console.log(kart);
                    let tempVertikalIndeks = indeks;
                    while (kart.ruter[tempVertikalIndeks].includes(produktHylle)) {
                        kart.ruter[tempVertikalIndeks].splice(0, 1);
                        tempVertikalIndeks += kolonner;
                        if(tempVertikalIndeks > rader * kolonner){break;}
                        console.log("Case 1");
                    }

                    produktposisjon.til[arrayIndeks] = tempVertikalIndeks - kolonner;
                    break;

                    default:
                        console.log("Gikk i default");
                        return;
                        break;
                }
                

            arrayIndeks++;
        }
        console.log("INDEKS");

        indeks++;
    }

    console.log(produktposisjon);

    fetch("http://localhost:3000/butikkBygger/produktposisjon", {
        method: 'POST',
        body: JSON.stringify(produktposisjon),
        headers: {"Content-type": "application/json; charset=UTF-8"}
    });

}
