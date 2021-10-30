const multer = require("multer");
const path = require("path");
const fs = require("fs");
const request = require("request");
const express = require("express");
const app = express();

app.set("view-engine", "ejs");
app.use(express.static("views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "views/data/custom/");
  },

  filename: function (req, file, cb) {
    let fileName = Date.now() + path.extname(file.originalname);
    info.customPictures.push(fileName);
    cb(null, fileName);
  },
});

let upload = multer({ storage: storage });
let info = JSON.parse(fs.readFileSync("settings.json"));
let weatherAPI = fs.readFileSync("weatherAPI", "utf8");

// Initializing functions
getWeather();
getSportsGames(true);

// API
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/admin", (req, res) => {
  res.render("admin.ejs");
});

app.get("/data", (req, res) => {
  res.json(info);
});

app.post("/data", (req, res) => {
  info[req.body.setting] = req.body.value;
  res.sendStatus(200);
  saveSettings();
});

app.post("/pictures", upload.array("multi-files"), (req, res) => {
  res.redirect("/admin");
  saveSettings();
});

app.delete("/pictures", (req, res) => {
  info.customPictures.splice(info.customPictures.indexOf(req.body.picture), 1);
  if (fs.existsSync("views/data/custom/" + req.body.picture)) {
    fs.unlink("views/data/custom/" + req.body.picture, () => {});
  }
  res.sendStatus(200);
  saveSettings();
});

app.listen(3000);

// Interval for function updates
setInterval(getWeather, 60000); // Every minute
setInterval(getSportsGames, 3600000, true); // Every hour
// setInterval(getSportsGames, 1000); // Every second

// Functions
function saveSettings() {
  fs.writeFile("settings.json", JSON.stringify(info), "utf8", () => {});
}

function getWeather() {
  let url = "https://api.openweathermap.org/data/2.5/weather?q=" + info.weatherLocation + "&appid=" + weatherAPI + "&units=" + info.weatherMeasurement;
  let weather;

  request(url, function (error, response, body) {
    weather = JSON.parse(body);
    info["weather"] = parseInt(weather["main"]["feels_like"]) + "°" + (info.weatherMeasurement === "metric" ? "C " : "F ") + weather["weather"][0]["description"];
    info["weatherIcon"] = weather["weather"][0]["icon"];
    saveSettings();
  });
}

function getSportsGames(getAll = false) {
  let favLeagues = Object.values(info["favTeams"]);
  let pinLeagues;

  let oldData = Object.keys(info.allGames);

  let nba, nhl, nfl, mlb, soccer;

  if (getAll) {
    info.allGames = {};
  }

  if (favLeagues.includes("Basketball") || favLeagues.includes("Basketball") || getAll) {
    request("http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard", function (error, response, body) {
      nba = JSON.parse(body);

      for (let i = 0; i < nba["events"].length; i++) {
        addToAllGames(nba["events"][i], oldData, "Basketball");
      }
      saveSettings();
    });
  }

  if (favLeagues.includes("Hockey") || getAll) {
    request("http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard", function (error, response, body) {
      nhl = JSON.parse(body);

      for (let i = 0; i < nhl["events"].length; i++) {
        addToAllGames(nhl["events"][i], oldData, "Hockey");
      }
      saveSettings();
    });
  }

  if (favLeagues.includes("Football") || getAll) {
    request("http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard", function (error, response, body) {
      nfl = JSON.parse(body);

      for (let i = 0; i < nfl["events"].length; i++) {
        let date = new Date(Date.parse(nfl["events"][i]["date"]));
        let today = new Date();

        if (date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear()) {
          addToAllGames(nfl["events"][i], oldData, "Football");
        }
      }
      saveSettings();
    });
  }

  if (favLeagues.includes("Baseball") || getAll) {
    request("http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard", function (error, response, body) {
      mlb = JSON.parse(body);

      for (let i = 0; i < mlb["events"].length; i++) {
        addToAllGames(mlb["events"][i], oldData, "Baseball");
      }
      saveSettings();
    });
  }
}

function addToAllGames(data, oldData, sport) {
  let date = new Date(Date.parse(data["date"]));
  let time = date.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: !info.militaryTime });

  info.allGames[data["id"]] = {};
  info.allGames[data["id"]]["id"] = data["id"];
  info.allGames[data["id"]]["sport"] = sport;
  info.allGames[data["id"]]["shortNames"] = data["shortName"].split(" @ ");
  info.allGames[data["id"]]["time"] = time;
  info.allGames[data["id"]]["team1"] = data["name"].split(" at ")[0];
  info.allGames[data["id"]]["team2"] = data["name"].split(" at ")[0];
  info.allGames[data["id"]]["team1Logo"] = data["competitions"][0]["competitors"][0]["team"]["logo"];
  info.allGames[data["id"]]["team2Logo"] = data["competitions"][0]["competitors"][1]["team"]["logo"];
  info.allGames[data["id"]]["displayClock"] = data["status"]["displayClock"];
  info.allGames[data["id"]]["period"] = data["status"]["period"];
  info.allGames[data["id"]]["shortDetail"] = data["status"]["shortDetail"];

  if (!(data["id"] in oldData)) {
    info.allGames[data["id"]]["selected"] = false;
  }
}
