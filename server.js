const mysql = require('mysql');
const chalk = require('chalk');
const table = require('console.table');
const inquirer = require('inquirer');
const ascii_text_generator = require('ascii-text-generator');
const clear = require('console-clear');

const input_text = "employee tracker";
const ascii_text =ascii_text_generator(input_text,"2");
 
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
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

function renderTable(tableTitle, tableData){
    clear();

    console.log(chalk.inverse.bold(tableTitle));
   
    console.table(tableData);
    
    initialPrompt();
}

function initialPrompt(){
    inquirer
        .prompt({
            type: "list",
            name: "initialOption",
            message: "Make a selection:",
            choices: ["View All Employees", /*"View Employees by Department", "View All Employees by Manager",*/ "View Roles", "View Departments", "Add Employee", "Add Roles", "Add Departments", /*"Remove Employee", "Remove Role", "Remove Department", "Update Employee Role", "Update Employee Manager", "View Total Utilized Budget By Department",*/ chalk.red("Exit Program")]
          })
        .then(answer => {
            switch(answer.initialOption){
                case "View All Employees":
                queryEmployeesAll();
                break;

                // case "View Employees by Department":
                // queryDepartments();
                //  break;

                // case "View Employees by Manager":
                // queryManagers();
                // break;

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

                // case "Remove Employee":
                // removeEmployee();
                // break;

                // case "Remove Role":
                // removeRole();
                // break;

                // case "Remove Department":
                // removeDepartment();
                // break;

                // case "Update Employee Role":
                // updateEmployeeRole();
                // break;

                // case "Update Employee Manager":
                // updateEmployeeManager();
                // break;

                case "View Total Utilized Budget By Department":
                viewDepartmentBudget();
                break;

                case "Exit":
                clear();
                process.exit();                
            }             
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
            
            const roles = ['tech support'];
            const roleTitles = ['IT'];
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
                choices: roleTitles
              })
            .then(answer => {
                
                const selectedRole = answer.rolePrompt;
                let selectedRoleID;
                for (let i = 0; i < roles.length; i++) {
                    if (roles[i].title === selectedRole){
                        selectedRoleID = roles[i].id;
                    }
                }
                
                newEmployee.roleID = selectedRoleID;
                
                //fixxed?
                const query = `
                SELECT DISTINCT concat(manager.first_name, " ", manager.last_name) AS full_name, manager.id
                FROM employee
                LEFT JOIN employee AS manager ON manager.id = employee.manager_id;`;
                   connection.query(query, (err, res) => {
                    if (err) throw err;
                    
                    const managers = ["vitts"];
                    const managersNames = ["butts"];
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

function addDepartment() {
    inquirer
      .prompt([
        {
          name: "deptName",
          type: "input",
          message: "Enter new Department title:",
          validate: async function confirmStringInput(input) {
            if (input.trim() != "" && input.trim().length <= 15) {
              return true;
            }
            return "Please limit your input to 15 characters.";
          },
        },
      ])
      .then((answer) => {
        const query = `INSERT INTO department (name) VALUES (?);`;
        connection.query(query, [answer.deptName], (err, res) => {
            if (err) throw err;
            console.log("  Department added successfully!")
            queryDepartmentCallBack(function(departments) {
                renderTable("departments", departments);
            } )
        })
        
    });
}

function queryDepartmentCallBack(callback){
    const query = `SELECT department.name FROM department;`;
    connection.query(query, (err, res) => {
        if (err) throw err;

        const departments = [];
        for (let i = 0; i < res.length; i++) {
            departments.push(res[i].name);
        }

       callback(departments)
    });
}

function addRole() {
   
   const departments = [];
   const departmentsName = [];
   
   const query = `SELECT id, name FROM department`;
   connection.query(query, (err, res) => {
       if (err) throw err;
       for (let i=0;i<res.length;i++) {
           departments.push({
              id:res[i].id,
              name:res[i].name});
           departmentsName.push(res[i].name);   
       }
   inquirer
       .prompt([
           {
           name: "roleName",
           type: "input",
           message: "Enter new role title:",
           validate: async function confirmStringInput(input) {
               if (input.trim() != "" && input.trim().length <= 20) {
               return true;
               }
               return "Please limit your input to 20 characters.";
           },
           },
           {
           name: "salary",
           type: "input",
           message: "Enter role salary:",
           validate: (input) => {
               if(!input.match(/^[0-9]+$/)) {
                   return "Please enter a number";
               }
               return true;
               }  
           },
           {
           type: "list",
           name: "roleDept",
           message: "Select department:",
           choices: departmentsName
           },
       ])
       .then((answer) => {
       
           let deptID = departments.find((obj) => obj.name === answer.roleDept).id;
           connection.query("INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)",
           [answer.roleName, answer.salary, deptID], (err, res) => {
               if (err) throw err; 
               console.log(
                   `${answer.roleName} was added to the ${answer.roleDept} department.`);
                   queryRolesOnly();
           });
          
       });
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
            name: "managerChoice",
            message: "Select Manager:",
            choices: managers
          })
        .then(answer => {
            queryEmployeesByManager(answer.managerChoice);            
        });
  }

function queryEmployeesAll(){

    const query = `
    SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, department.name AS department_name, concat(manager.first_name, " ", manager.last_name) AS manager_full_name
    FROM employee 
    LEFT JOIN role ON employee.role_id = role.id
    LEFT JOIN department ON department.id = role.department_id
	LEFT JOIN employee as manager ON employee.manager_id = manager.id;`;
    connection.query(query, (err, res) => {
        if (err) throw err;

        const tableData = [];
        for (let i = 0; i < res.length; i++) {
            tableData.push({ 
                "ID": res[i].id, 
                "First Name": res[i].first_name,
                "Last Name": res[i].last_name,
                "Role": res[i].title,
                "Salary": res[i].salary, 
                "Department": res[i].department_name,
                "Manager": res[i].manager_full_name
            });
        }
        
        renderTable("All Employees", tableData);
    });
}

function queryRolesOnly() {
    const query = `SELECT id, title FROM employeesdb.role;`;

    connection.query(query, (err, res) => {
        if (err) throw err;
        const tableData = [];
        for (let i = 0; i < res.length; i++) {
            tableData.push({ 
                "ID": res[i].id,
                "Roles": res[i].title
            });
        }

        renderTable("All Roles", tableData);
    });   
}

function queryDepartmentsOnly(){
    const query = `SELECT id, department.name FROM department;`;
    connection.query(query, (err, res) => {
        if (err) throw err;

        const  tableData = [];
        for (let i = 0; i < res.length; i++) {
            tableData.push({
                "ID": res[i].id,
                "Departments": res[i].name
            });
        }

        renderTable(`All Departments`, tableData);
    });
}

function viewDepartmentBudget() {
    const query = 
    `select d.name "Department", SUM(r.salary) "BudgetUtilized" 
    from role r
    JOIN department d 
    JOIN employee e 
    where r.id = e.role_id and r.id = d.id group by r.id;`
    connection.query(query, (err, res) => {
        if (err) throw err;
      
       const tableData = [];      
       for (let i = 0; i < res.length; i++) {
           tableData.push({
               "Department": res[i].Department,
               "Budget Utilized": res[i].BudgetUtilized
           });
        }
        renderTable("Total Budget by Department", tableData);
    });
}

function updateEmployeeRole(){
    
    const updatedEmployee = {
        id: 0,
        roleID: 0, 
    };

    const query = `
    SELECT id, concat(employee.first_name, " ", employee.last_name) AS employee_full_name
    FROM employee ;`;
    connection.query(query, (err, res) => {
        if (err) throw err;
        
        let employees = [];
        let employeesNames = [];
        for (let i=0;i<res.length;i++){
            employees.push({
                id: res[i].id,
                fullName: res[i].employee_full_name});
            employeesNames.push(res[i].employee_full_name);
        }
        
        inquirer
        .prompt({
            type: "list",
            name: "employeeSelrcted",
            message: "Select employee to update:",
            choices: employeesNames
          })
        .then(answer => {

            const selectedEmployee = answer.employeeSelrcted;
            let selectedEmployeeID;
            for (let i = 0; i < employees.length; i++) {
              if (employees[i].fullName === selectedEmployee) {
                selectedEmployeeID = employees[i].id;
                break;
              }
            }
            
            updatedEmployee.id = selectedEmployeeID;
            
            const query = `SELECT role.title, role.id FROM role;`;
            connection.query(query, (err, res) => {
                if (err) throw err;
                
                const roles = [];
                const rolesNames = [];
                for (let i = 0; i < res.length; i++) {
                    roles.push({
                        id: res[i].id,
                        title: res[i].title
                    });
                    rolesNames.push(res[i].title);
                }
                inquirer
                .prompt({
                    type: "list",
                    name: "selectedRole",
                    message: "Select Role:",
                    choices: rolesNames
                })
                .then(answer => {
                    
                    const chosenRole = answer.selectedRole;
                    let chosenRoleID;
                    for (let i = 0; i < roles.length; i++) {
                        if (roles[i].title === chosenRole){
                            chosenRoleID = roles[i].id;
                        }
                    }
                    
                    updatedEmployee.roleID = chosenRoleID;
                    
                    const query = `UPDATE employee SET ? WHERE ?`;
                    connection.query(query, [
                        {
                          role_id: updatedEmployee.roleID
                        },
                        {
                          id: updatedEmployee.id
                        }
                        ], (err, res) => {
                        if (err) throw err;
                        console.log("Employee Role Updated");
                       
                        setTimeout(queryEmployeesAll, 500);
                    });
                });
            });            
        });
    });
}

init();
