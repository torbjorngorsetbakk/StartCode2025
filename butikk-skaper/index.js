const express = require('express');
const app = express();
const static = express();

let mysql = require('mysql');

let con = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "backendBruker",
    password: "passord",
    database: "produkter"
});

//Rett fra W3
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

//Ber express parse json payloads
app.use(express.json());
static.use(express.static('public'));

//Fikser CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    console.log(req.headers);
    next();
});

static.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    console.log(req.headers);
    next();
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log("Server lytter på port: ", PORT)
});

static.listen(80, () => { });
//app.use(cors({origin: true, credentials: true}));

app.get("/", (request, response) => {
    const endpoints = {
        "Endpoints": {
            "1": "/",
            "2": "/navn"
        }
    }
    response.send(endpoints);
});

app.post("/navn", (request, response) => {
    //var navn = request.body.navn;
    /*{
        "navn": "brød"
    }

    */
    try {
        var navn = request.body.navn
    }
    catch (error) {
        console.log("Error")
        response.send(error);
        return;
    }

    let query = `SELECT name,description,productId FROM handleliste WHERE name LIKE '%${navn}%'`
    console.log(query);
    con.query(query, function (error, data) {
        var responsData = {
            "produkter": data
        };
        console.log(responsData);
        response.send(responsData);
    });

});


app.post("/butikkBygger/nyeHyller", (request, response) => {
    try {
        var antall = request.body.fra.length;
        var fra = request.body.fra;
        var til = request.body.til;
        var retning = request.body.retning;
        var butikk_id = request.body.butikk_id;
        for (var i = 0; i < antall; i++) {
            let query = `INSERT INTO hylle (butikk_id, fra_posisjon, til_posisjon, retning) VALUES (${butikk_id}, ${fra[i]}, ${til[i]}, ${retning[i]})`;
            console.log(query);
            con.query(query, function (error, data) {
                console.log(error);
                if (!error) {
                    response.send("200");
                } else {
                    response.send(error);
                }
            });
        }
    }
    catch (error) {
        console.log(error);
    }

});

app.post("/butikkBygger/nyButikk", (request, response) => {
    try {

        console.log("try");
        var rader = request.body.rader;
        var kolonner = request.body.kolonner;
        var navn = request.body.navn;



        query = `INSERT INTO butikker (rader, kolonner, navn) VALUES (${rader}, ${kolonner}, "${navn}")`;
        console.log(query);

        con.query(query, function (error, data) {
            console.log(data.insertId);
            response.send(parseInt(data.insertId));
        });

    }
    catch (error) {
        console.log("ERRROR");
        console.log(error);
        response.send(error);
    }
});

app.post("/butikkBygger/produktposisjon", (request, response) =>{
    try {
        var antall = request.body.fra.length;
        var fra = request.body.fra;
        var til = request.body.til;
        var retning = request.body.retning;
        var butikk_id = request.body.butikk_id;
        var produktHylle = request.body.produktHylle;

        console.log(antall);
        for (var i = 0; i < antall; i++) {
            let query = `INSERT INTO hylleposisjon (butikk_id, fra_posisjon, til_posisjon, retning, hylletype) VALUES (${butikk_id}, ${fra[i]}, ${til[i]}, ${retning[i]}, "${produktHylle[i]}")`;
            console.log(query);
            console.log("Iterasjon: "); console.log(i);
            con.query(query, function (error, data) {
                if (!error) {
                    console.log("Ingen error");
                    console.log(error);
                } else {
                    console.log("ERROR");
                    console.log(error);
                    return;
                }
            });
            
        }
        response.send("200");
    }
    catch (error) {
        console.log(error);
    }

});

app.get("/hentHandleliste", (request, response) =>{
    id = request.query.id;

    console.log("ID: ");console.log(id);

    let query = `SELECT vareID FROM handlelister WHERE id=${id}`;
    console.log(query);
    con.query(query, function(error, data){
        console.log("INGEN ERROR!");
        console.log(data);
        response.send(data);
    });
});


app.post("/settHandleliste", (request, response) =>{
    
});