const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
const format = require("date-fns/format");
var parseISO = require("date-fns/parseISO");
var isValid = require("date-fns/isValid");
let db = null;
let dbPath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server and DB Connection is established");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
initializeDB();

function validateDate(date) {
  let resultFlag = false;
  try {
    const result = isValid(new Date(date));
    resultFlag = result;
  } catch (error) {
    console.log(error.message);
  }
  return resultFlag;
}

function validateCategory(category) {
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    return true;
  } else {
    return false;
  }
}

function validateStatus(status) {
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    return true;
  } else {
    return false;
  }
}

function validatePriority(priority) {
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    return true;
  } else {
    return false;
  }
}

function checkTodo(todo) {
  return todo !== null;
}
function checkDueDate(date) {
  return date !== null;
}
function checkStatus(status) {
  return status !== null;
}

function checkPriority(priority) {
  return priority !== null;
}

function checkTodoKey(search_q) {
  return search_q !== null;
}
function checkCategory(category) {
  return category !== null;
}
app.get("/todos/", async (request, response) => {
  const {
    status = null,
    priority = null,
    search_q = null,
    category = null,
  } = request.query;

  let dbResponse = null;
  let sqlQuery = null;
  let responseArrayLength = 0;

  switch (true) {
    case checkCategory(category) && checkPriority(priority):
      sqlQuery = `SELECT id,todo,priority,category,status,due_date as dueDate FROM todo WHERE priority= '${priority}' AND category = '${category}';`;
      dbResponse = await db.all(sqlQuery);
      responseArrayLength = dbResponse.length;
      response.send(dbResponse);
      break;
    case checkCategory(category) && checkStatus(status):
      sqlQuery = `SELECT id,todo,priority,category,status,due_date as dueDate FROM todo WHERE status= '${status}' AND category = '${category}';`;
      dbResponse = await db.all(sqlQuery);
      responseArrayLength = dbResponse.length;
      response.send(dbResponse);
      break;
    case checkCategory(category):
      sqlQuery = `SELECT id,todo,priority,category,status,due_date as dueDate FROM todo WHERE category = '${category}';`;
      dbResponse = await db.all(sqlQuery);
      responseArrayLength = dbResponse.length;
      if (responseArrayLength > 0) {
        response.send(dbResponse);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case checkTodoKey(search_q):
      //get search keyword data
      sqlQuery = `SELECT id,todo,priority,category,status,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%';`;
      dbResponse = await db.all(sqlQuery);
      responseArrayLength = dbResponse.length;
      response.send(dbResponse);
      break;
    case checkPriority(priority) && checkStatus(status):
      //get both status and priority code
      sqlQuery = `SELECT id,todo,priority,category,status,due_date as dueDate FROM todo WHERE status= '${status}' AND priority = '${priority}';`;
      dbResponse = await db.all(sqlQuery);
      responseArrayLength = dbResponse.length;
      response.send(dbResponse);
      break;
    case checkPriority(priority):
      //get priority code
      sqlQuery = `SELECT id,todo,priority,category,status,due_date as dueDate FROM todo WHERE priority = '${priority}';`;
      dbResponse = await db.all(sqlQuery);
      responseArrayLength = dbResponse.length;
      if (responseArrayLength > 0) {
        response.send(dbResponse);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case checkStatus(status):
      //get status code
      sqlQuery = `SELECT id,todo,priority,category,status,due_date as dueDate FROM todo WHERE status = '${status}';`;
      dbResponse = await db.all(sqlQuery);
      responseArrayLength = dbResponse.length;
      if (responseArrayLength > 0) {
        response.send(dbResponse);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    default:
      break;
  }
});

//API-2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT id,todo,priority,category,status,due_date as dueDate FROM todo WHERE id = ${todoId};`;
  let dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});

//API-3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (validateDate(date)) {
    var resultDate = format(new Date(date), "yyyy-MM-dd");
    const getBasedOnDate = `SELECT id,todo,priority,category,status,due_date as dueDate FROM todo WHERE due_date = '${resultDate}';`;
    let dbResponse = await db.all(getBasedOnDate);
    response.status(200);
    response.send(dbResponse);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API-4
app.post("/todos/", async (request, response) => {
  const postDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = postDetails;
  if (validateCategory(category)) {
    if (validatePriority(priority)) {
      if (validateStatus(status)) {
        if (validateDate(dueDate)) {
          if (todo.length > 0) {
            let postQuery = `INSERT INTO todo(id,todo,category,priority,status,due_date) VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
            let dbResponse = await db.run(postQuery);
            response.status(200);
            response.send("Todo Successfully Added");
          } else {
            response.status(400);
            response.send("Invalid Todo");
          }
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
});

//API-5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let dbResponse = null;
  let putQuery = null;
  const {
    status = null,
    priority = null,
    dueDate = null,
    todo = null,
    category = null,
  } = request.body;

  switch (true) {
    case checkCategory(category):
      //put categoryCode
      if (validateCategory(category)) {
        putQuery = `UPDATE todo set category = '${category}' WHERE id=${todoId};`;
        dbResponse = await db.run(putQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case checkStatus(status):
      //put statusCode
      if (validateStatus(status)) {
        putQuery = `UPDATE todo set status = '${status}' WHERE id=${todoId};`;
        dbResponse = await db.run(putQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case checkPriority(priority):
      if (validatePriority(priority)) {
        putQuery = `UPDATE todo set priority = '${priority}' WHERE id=${todoId};`;
        dbResponse = await db.run(putQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case checkDueDate(dueDate):
      if (validateDate(dueDate)) {
        putQuery = `UPDATE todo set due_date = '${dueDate}' WHERE id=${todoId};`;
        dbResponse = await db.run(putQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    case checkTodo(todo):
      putQuery = `UPDATE todo set todo = '${todo}' WHERE id=${todoId};`;
      dbResponse = await db.run(putQuery);
      response.send("Todo Updated");
      break;
    default:
      break;
  }
});

//API-6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId}`;
  let dbResponse = await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
