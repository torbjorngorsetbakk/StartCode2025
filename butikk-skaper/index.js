const express = require('express');
const app = express();

let mysql = require('mysql');

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Test1234",
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
            "name": "/"
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
        request.send(error);
    }

    let query = `SELECT name,description,productId FROM handleliste WHERE name LIKE '%${navn}%'`
    con.query(query, function (error, data){
        console.log(data);
    });

});