const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios").default;
const express = require("express");
const e = require("express");
const schedule = require("node-schedule");
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

//https://site.api.espn.com/apis/site/v2/leagues/dropdown?sport=
const allLeagues = ["UEFA Champions League", "English Premier League", "Spanish LaLiga", "German Bundesliga", "Major League Soccer", "Italian Serie A", "French Ligue 1", "FIFA World Cup", "FIFA Women's World Cup", "International Friendly", "UEFA Europa League", "Africa Cup of Nations", "FIFA World Cup Qualifying - CONCACAF", "FIFA World Cup Qualifying - UEFA", "FIFA World Cup Qualifying - CONMEBOL", "FIFA World Cup Qualifying - CAF", "FIFA World Cup Qualifying - AFC", "FIFA World Cup Qualifying - OFC", "CONCACAF Gold Cup", "UEFA European Championship", "Copa America", "UEFA Super Cup", "Club Friendly", "Men's Olympic Tournament", "Women's Olympic Tournament", "National Football League", "Canadian Football League", "Major League Baseball", "Olympic Men's Baseball", "National Hockey League", "World Cup of Hockey", "Men's Ice Hockey", "National Basketball Association", "NCAA Men's Basketball", "Olympics Men's Basketball", "International Basketball Federation"];

const weatherAPI = fs.readFileSync("weatherAPI", "utf8");

let upload = multer({ storage: storage });

let info = JSON.parse(fs.readFileSync("settings.json"));
let countdownTimer = getCountdownSeconds();
let pictureInterval = countdownTimer;
let pictureCategory = info["wallpaperCategory"];
let pictureAutoCategory = info["wallpaperAutoCategory"];
let wallpaper = info["wallpaper"];

// Initializing functions
changeWallpaper();
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
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  res.json(info);
});

app.post("/data", (req, res) => {
  info[req.body.setting] = req.body.value;
  getWeather();
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

app.listen(3000, function () {
  console.log("Server listening on port 3000");
});

// Interval for function updates
setInterval(getWeather, 60000); // Every minute
setInterval(getSportsGames, 3000); // Every 3 seconds
setInterval(countdown, 1000); // Every second

// Turn off at midnight
schedule.scheduleJob("0 0 * * *", () => {
  info["power"] = 0;
  saveSettings();
});

// Turn on at 6 am
schedule.scheduleJob("0 6 * * *", () => {
  info["power"] = 1;
  saveSettings();
});

function saveSettings() {
  fs.writeFile("settings.json", JSON.stringify(info), "utf8", () => {});
}

function changeWallpaper() {
  let files;

  pictureCategory = info["wallpaperCategory"];
  pictureAutoCategory = info["wallpaperAutoCategory"];

  if (pictureCategory == "auto" && pictureAutoCategory != "all") {
    files = fs.readdirSync("views/data/" + pictureCategory + "/").filter((img) => img.includes(pictureAutoCategory) && !/(^|\/)\.[^\/\.]/g.test(img));
  } else {
    files = fs.readdirSync("views/data/" + pictureCategory + "/").filter((img) => !/(^|\/)\.[^\/\.]/g.test(img));
  }

  while (wallpaper == info["wallpaper"]) {
    if (files.length == 0) {
      wallpaper = "../empty.png";
      break;
    }

    wallpaper = files[Math.floor(Math.random() * files.length)];

    if (files.length == 1) break;
  }

  info["wallpaper"] = wallpaper;
  saveSettings();
}

function countdown() {
  newPictureInterval = getCountdownSeconds();

  if (pictureInterval != newPictureInterval) {
    countdownTimer = newPictureInterval + 1;
    pictureInterval = newPictureInterval;
  }

  if (pictureCategory != info["wallpaperCategory"] || pictureAutoCategory != info["wallpaperAutoCategory"] || info["wallpaper"] == "../empty.png") changeWallpaper();

  countdownTimer--;

  if (countdownTimer == 0) {
    changeWallpaper();
    countdownTimer = newPictureInterval;
  }
}

function getCountdownSeconds() {
  if (info["pictureInterval"] === "61") {
    return 3600;
  } else if (info["pictureInterval"] === "62") {
    return 86400;
  } else if (info["pictureInterval"] === "63") {
    return 9999999999;
  } else {
    return parseInt(info["pictureInterval"]);
  }
}

function getWeather() {
  let url = "https://api.openweathermap.org/data/2.5/weather?q=" + info.weatherLocation + "&appid=" + weatherAPI + "&units=" + info.weatherMeasurement;
  let weather;

  axios.get(url).then(function (response) {
    info["weather"] = parseInt(response["data"]["main"]["feels_like"]) + "°" + (info.weatherMeasurement === "metric" ? "C " : "F ") + response["data"]["weather"][0]["description"];
    info["weatherIcon"] = response["data"]["weather"][0]["icon"];
    saveSettings();
  });
}

function getSportsGames() {
  let favTeams = info["favTeams"];
  let oldGameId = Object.keys(info["allGames"]);

  let d = new Date();
  let date = d.getFullYear() + (d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1) : d.getMonth() + 1) + (d.getDate() < 10 ? "0" + d.getDate() : "" + d.getDate());

  Promise.all([axios.get("https://site.web.api.espn.com/apis/v2/scoreboard/header?dates=" + date + "&timestamp=" + new Date().getTime()), axios.get("https://site.web.api.espn.com/apis/v2/scoreboard/header?sport=baseball&dates=" + date + "&timestamp=" + new Date().getTime())])
    .then(function (response) {
      let results = [response[0]["data"]["sports"][0], response[0]["data"]["sports"][1], response[0]["data"]["sports"][2], response[0]["data"]["sports"][3], response[1]["data"]["sports"][0]];
      let gameId = [];

      for (let y = 0; y < results.length; y++) {
        let leagues = results[y]?.leagues ?? [];

        for (let x = 0; x < leagues.length; x++) {
          if (!allLeagues.includes(leagues[x]["name"])) continue;

          let events = leagues[x]?.events ?? [];

          for (let i = 0; i < events.length; i++) {
            gameId.push(events[i]["id"]);
            addToAllGames(events[i], oldGameId.includes(events[i]["id"]), results[y]["slug"], favTeams, leagues[x]["abbreviation"]);
          }
        }
      }

      oldGameId.forEach((id) => {
        if (!gameId.includes(id)) delete info["allGames"][id];
      });

      saveSettings();
    })
    .catch((error) => {
      console.log(error);
    });
}

function addToAllGames(data, oldData, sport, favTeams, league) {
  let date = new Date(Date.parse(data["date"]));
  let time = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  let selected = false;

  if (oldData) selected = info["allGames"][data["id"]]?.selected;

  if (data["summary"] == "Postponed" || data["summary"] == "Canceled") return;

  info["allGames"][data["id"]] = {};
  info["allGames"][data["id"]]["id"] = data["id"];
  info["allGames"][data["id"]]["sport"] = sport;
  info["allGames"][data["id"]]["league"] = league;
  info["allGames"][data["id"]]["shortNames"] = [data["competitors"][0]["abbreviation"], data["competitors"][1]["abbreviation"]];
  info["allGames"][data["id"]]["fullNames"] = [data["competitors"][0]["displayName"], data["competitors"][1]["displayName"]];
  info["allGames"][data["id"]]["logos"] = [data["competitors"][1]["logo"], data["competitors"][0]["logo"]];
  info["allGames"][data["id"]]["colors"] = [ajdustColor(tooDark(data["competitors"][1]["color"]) ? data["competitors"][1]["alternateColor"] : data["competitors"][1]["color"], -25), ajdustColor(tooDark(data["competitors"][0]["color"]) ? data["competitors"][0]["alternateColor"] : data["competitors"][0]["color"], -25)];
  info["allGames"][data["id"]]["scores"] = [data["competitors"][0]["score"] == "" ? "0" : data["competitors"][1]["score"], data["competitors"][1]["score"] == "" ? "0" : data["competitors"][0]["score"]];
  info["allGames"][data["id"]]["selected"] = selected;

  if (sport == "Football") info["allGames"][data["id"]]["possession"] = data["competitors"]?.possessionText == undefined ? undefined : data["competitors"]?.possessionText + " - " + data["competitors"]?.downDistanceText;

  if (data["summary"].includes(time)) {
    info["allGames"][data["id"]]["shortDetail"] = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: !info.militaryTime });
  } else {
    info["allGames"][data["id"]]["shortDetail"] = data["summary"] == "FT" ? "Final" : data["summary"] == "HT" ? "Half-time" : data["summary"];
  }

  favTeams.forEach((team) => {
    if (info["allGames"][data["id"]]["fullNames"].includes(team)) info["allGames"][data["id"]]["selected"] = true;
  });
}

function ajdustColor(color, amount) {
  if (color === undefined) return "#000";
  if (color == "000000") return "#bc2c45";
  return "#" + color.replace(/../g, (color) => ("0" + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

function tooDark(color) {
  const c_r = parseInt(color.substr(0, 2), 16);
  const c_g = parseInt(color.substr(2, 2), 16);
  const c_b = parseInt(color.substr(4, 2), 16);

  const brightness = (c_r * 299 + c_g * 587 + c_b * 114) / 1000;

  return brightness < 35;
}
