const express = require('express');
const app = express();

let mysql = require('mysql');

let con = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "backendBruker",
  password: "passord",
  database: "produkter"
});

//Rett fra W3
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

//Ber express parse json payloads
app.use(express.json());

const PORT = 3000;

app.listen(PORT, ()=> {
    console.log("Server lytter på port: ", PORT)
});

app.get("/", (request, response) => {
    const endpoints = {
        "Endpoints":{
            "1": "/",
            "2": "/navn"
        }
    }
    response.send(endpoints);
});

app.post("/navn", (request, response) => {
    //var navn = request.body.navn;

    try{
        var navn = request.body.navn
    }
    catch(error){
        console.log("Error")
        request.send(error);
    }

    let query = `SELECT name,description,productId FROM handleliste WHERE name LIKE '%${navn}%'`
    console.log(query);
    con.query(query, function (error, data){
        console.log(JSON.stringify(data));
        response.send(JSON.stringify(data));
    });

});