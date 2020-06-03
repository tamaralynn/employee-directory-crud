const mysql = require('mysql');
const chalk = require('chalk');
const table = require('console.table');
const inquirer = require('inquirer');
const ascii_text_generator = require('ascii-text-generator');


const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "employeesdb"
  });

let input_text = "employee tracker";
let ascii_text =ascii_text_generator(input_text,"2");
 
console.log(ascii_text);