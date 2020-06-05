const mysql = require('mysql');
const chalk = require('chalk');
const table = require('console.table');
const inquirer = require('inquirer');
const ascii_text_generator = require('ascii-text-generator');

const input_text = "employee tracker";
const ascii_text =ascii_text_generator(input_text,"2");
 
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "employeesdb"
  });


  function init(){
    connection.connect(function(err) {
      if (err) {
        console.error("error connecting: " + err.stack);
        return;
      }
      console.log("connected as id " + connection.threadId);

      clear();
      console.log(ascii_text)
      initialPrompt();
      
  });

}
console.log(ascii_text);

function initialPrompt(){
    inquirer
        .prompt({
            type: "list",
            name: "initialOption",
            message: "Make a selection:",
            choices: ["View All Employees", "View Employees by Department", "View All Employees by Manager", "View Roles", "View Departments", "Add Employee", "Add Roles", "Add Departments", "Remove Employee", "Remove Role", "Remove Department", "Update Employee Role", "Update Employee Manager", "View Total Utilized Budget By Department", chalk.red("Exit Program")]
          })
        .then(answer => {
            switch(answer.initialOption){
                case "View All Employees":
                queryEmployeesAll();
                break;

                case "View Employees by Department":
                queryDepartments();
                break;

                case "View Employees by Manager":
                queryManagers();
                break;

                case "View Roles":
                queryRolesOnly();
                break;

                case "View Departments":
                queryDepartmentsOnly();
                break;

                case "Add Employee":
                addEmployee();
                break;

                case "Add Roles":
                addRole();
                break;

                case "Add Departments":
                addDepartment();
                break;

                case "Remove Employee":
                removeEmployee();
                break;

                case "Remove Role":
                removeRole();
                break;

                case "Remove Department":
                removeDepartment();
                break;

                case "Update Employee Role":
                updateEmployeeRole();
                break;

                case "Update Employee Manager":
                updateEmployeeManager();
                break;

                case "View Total Utilized Budget By Department":
                viewTotalBudgetByDepartment();
                break;

                case "Exit":
                clear();
                process.exit();                
            }             
        });
}

function departmentsPrompt(departments){
  inquirer
      .prompt({
          type: "list",
          name: "departmentOption",
          message: "Select Department:",
          choices: departments
        })
      .then(answer => {
          queryEmployeesByDepartment(answer.departmentOption);            
      });
}

function promptManagers(managers){
  inquirer
      .prompt({
          type: "list",
          name: "promptChoice",
          message: "Select Manager:",
          choices: managers
        })
      .then(answer => {
          queryEmployeesByManager(answer.promptChoice);            
      });
}

function addEmployee(){

  const newEmployee = {
      firstName: "",
      lastName: "", 
      roleID: 0, 
      managerID: 0
  };
  inquirer
  .prompt([{
      name: "firstName",
      message: "Enter first name: ",
      validate: async(input) => {
          if(!input.match(/^[A-Za-z]+/i)) {
              return "Sorry, the employee's first name can only contain letters"; 
          }
              return true;
      }
      }, {
      name: "lastName",
      message: "Enter last name: ",
      validate: async(input) => {
          if(!input.match(/^[A-Za-z]+/i)) {
              return "Sorry, the employee's last name can only contain letters"; 
          }
              return true;
      }
    }])
    .then(answers => {
        
        newEmployee.firstName = answers.firstName;
        newEmployee.lastName = answers.lastName;
        
        const query = `SELECT role.title, role.id FROM role;`;
        connection.query(query, (err, res) => {
            if (err) throw err;
            
            const roles = [];
            const roleTitles = [];
            for (let i = 0; i < res.length; i++) {
                roles.push({
                    id: res[i].id,
                    title: res[i].title
                });
                roleTitles.push(res[i].title);
            }
            
            inquirer
            .prompt({
                type: "list",
                name: "rolePrompt",
                message: "Select Role:",
                choices: rolesTitles
              })
            .then(answer => {
                //get id of selected role
                const selectedRole = answer.rolePrompt;
                let selectedRoleID;
                for (let i = 0; i < roles.length; i++) {
                    if (roles[i].title === selectedRole){
                        selectedRoleID = roles[i].id;
                    }
                }
                
                newEmployee.roleID = selectedRoleID;
                
                //somerghing off here
                const query = `
                SELECT DISTINCT concat(manager.first_name, " ", manager.last_name) AS full_name, manager.id
                FROM employee
                RIGHT JOIN employee AS manager ON manager.id = employee.manager_id;`;
                   connection.query(query, (err, res) => {
                    if (err) throw err;
                    
                    const managers = [];
                    const managersNames = [];
                    for (let i = 0; i < res.length; i++) {
                        managersNames.push(res[i].full_name);
                        managers.push({
                            id: res[i].id,
                            fullName: res[i].full_name
                        });
                    }
                    
                    inquirer
                    .prompt({
                        type: "list",
                        name: "managerPrompt",
                        message: "Select Manager:",
                        choices: managersNames
                      })
                    .then(answer => {
                       
                        const selectedManager = answer.managerPrompt;   
                        let selectedManagerID;
                        for (let i = 0; i < managers.length; i++) {
                            if (managers[i].fullName === selectedManager){
                                selectedManagerID = managers[i].id;
                                break;
                            }
                        }
                        
                        newEmployee.managerID = selectedManagerID;
                        
                        const query = "INSERT INTO employee SET ?";
                        connection.query(query, {
                            first_name: newEmployee.firstName,
                            last_name: newEmployee.lastName,
                            role_id: newEmployee.roleID || 0,
                            manager_id: newEmployee.managerID || 0
                            }, (err, res) => {
                            if (err) throw err;
                            
                            setTimeout(queryEmployeesAll, 500);
                        });                            
                    });
                });
            });
        });            
    });
}

init();