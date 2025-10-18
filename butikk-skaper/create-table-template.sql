CREATE TABLE handleliste(
id INT PRIMARY KEY AUTO_INCREMENT,
productId INT,
gtin LONG,
name  VARCHAR(50),
description VARCHAR(50),
price DECIMAL(10,2),
pricePerUnit DECIMAL(10,2),
unit VARCHAR(50),
allergens VARCHAR(50),
carbonFootprintGram INT,
organic VARCHAR(50)
);

DROP TABLE handleliste;


LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/data.csv' INTO TABLE handleliste
FIELDS TERMINATED BY ';'
IGNORE 1 LINES
(productId,gtin,name,description,price,pricePerUnit,unit,allergens,carbonFootprintGram,organic);

SHOW VARIABLES LIKE "secure_file_priv"


SELECT * FROM handleliste LIMIT 5;


SELECT * FROM mysql.user;
DROP USER 'backend'@'localhost';
CREATE USER 'backendBruker'@'localhost' IDENTIFIED WITH mysql_native_password BY 'passord';
GRANT ALL PRIVILEGES ON produkter.* TO 'backendBruker'@'localhost';
FLUSH PRIVILEGES

SHOW GRANTS FOR 'backend'@'localhost'

SELECT name,description,productId FROM handleliste WHERE name LIKE "%brød%"





CREATE TABLE butikker{
    butikk_id INT PRIMARY AUTO_INCREMENT,
    rader INT,
    kolonner INT

}

CREATE TABLE hylle{
    hylle_id INT PRIMARY AUTO_INCREMENT,
    butikk_id INT,
    fra_posisjon INT,
    til_posisjon INT
}


SELECT name,carbonFootprintGram FROM handleliste ORDER BY carbonFootprintGram DESC;