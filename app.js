const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketTeam.db");

let db = null;

app.use(express.json());

const initDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("DB server connection established");
    });
  } catch (error) {
    console.log(error.message);
  }
};

initDB();

//api-1 Return list of all players

app.get("/players/", async (request, response) => {
  const query = `
    select player_id as playerId,
          player_name as playerName,
          jersey_number as jerseyNumber,
          role FROM cricket_team;
    `;
  const queryResult = await db.all(query);
  response.send(queryResult);
});

//api-2 creating new player

app.post("/players/", async (request, response) => {
  const playerDetails = request.body;
  const { player_name, jersey_number, role } = playerDetails;
  const postQuery = `INSERT INTO cricket_team (player_name,jersey_number,role) VALUES ('${player_name}',${jersey_number},'${role}')`;
  const dbResponse = await db.run(postQuery);
  response.send("Player Added to Team");
});

//api-3 Return a particular player details based on id

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;

  const getQuery = ` select player_id as playerId,
          player_name as playerName,
          jersey_number as jerseyNumber,
          role FROM cricket_team WHERE player_id = ${playerId};`;
  const dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});

//api-4 Update details of the player

app.put("/players/:playerId", async (request, response) => {
  const playerDetails = request.body;

  const { playerId } = request.params;

  const { playerName, jerseyNumber, role } = playerDetails;

  console.log(playerId);
  const updateQuery = `UPDATE cricket_team SET 
                        player_name = '${playerName}',
                        jersey_number = ${jerseyNumber},
                        role = '${role}'
                        WHERE player_id = ${playerId}`;
  const dbResponse = await db.run(updateQuery);
  response.send("Player Details Updated");
});

//API-5 Delete player with respect to ID

app.delete("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;

  const deleteQuery = `DELETE FROM cricket_team WHERE player_id = ${playerId}`;

  const dbResponse = await db.run(deleteQuery);

  response.send("Player Removed");
});

module.exports = app;
