USE employeesDB;

INSERT INTO employee (id, first_name, last_name, role_id, manager_id)
VALUES 
(1, "Steve", "Byers", 1, 1), 
(2, "Robert", "Hoffman", 2, 1), 
(3, "Michael", "Fearnley", 2, 1), 
(4, "Travis", "Nevins", 8, 2), 
(5, "Eric", "DiMare", 8, 3), 
(6, "Letty", "Bedard", 3, 2),
(7, "Danielle", "Daley", 3, 3),
(8, "Hannah", "Yudkin", 5 , 9),
(9, "Emily", "Lalliere", 4, 7),
(10, "Walter", "Hoerman", 4, 6),
(11, "Sam", "Delay", 5 , 10),
(12, "Brian", "Lispett", 6, 11),
(13, "Tania", "Moore", 7, 11),
(14, "Ryan", "Durso", 7 , 8),
(15, "Abigail", "Hoerman", 7, 8)

INSERT INTO role (id, title, salary, department_id)
VALUES 
(1, "CEO", 120000, 1), 
(2, "Regional Manager", 90000, 2), 
(3, "District Manager", 80000, 2),
(4, "Store Manager", 70000, 3),
(5, "Assistant Manager", 45000, 3),
(6, "Manager in Training", 30000, 3),
(7, "Associate", 20000, 4),
(8, "Tech Support Specialist", 5)

INSERT INTO department (id, name)
VALUES 
(1, "Corporate"),
(2, "Upper Management"), 
(3, "Store Management"), 
(4, "Sales"), 
(5, "IT");