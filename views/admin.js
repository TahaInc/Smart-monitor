let data = { power: 1, brightness: 100, wallpaperCategory: "auto", wallpaperAutoCategory: "all", pictureInterval: 3, weatherLocation: "Ottawa", weatherMeasurement: "metric", weather: "", customPictures: [], favTeams: {} };

let brightnessSlider = document.getElementById("brightness_slider");
let intervalSlider = document.getElementById("interval_slider");
let pauseSync = false;

brightnessSlider.oninput = function () {
  pauseSync = true;
  document.getElementById("brightness_text").innerHTML = brightnessSlider.value + "%";
};

intervalSlider.oninput = function () {
  pauseSync = true;
  setIntervalText();
};

function setIntervalText() {
  if (intervalSlider.value === "61") {
    document.getElementById("interval_text").innerHTML = "Every hour";
  } else if (intervalSlider.value === "62") {
    document.getElementById("interval_text").innerHTML = "Every day";
  } else {
    document.getElementById("interval_text").innerHTML = intervalSlider.value + "s";
  }
}

function selectWallpaperCategory(button) {
  let category = button.getAttribute("id").split("_").slice(-1)[0];
  pauseSync = true;
  document.getElementsByClassName("wallpaper_selected")[0]?.classList.remove("wallpaper_selected");
  button.className = "wallpaper_selected";
  expandWallpaperCategory(category);
  pushSettings("wallpaperCategory", category);
}

function expandWallpaperCategory(category) {
  let container = wallpaper_setting_container;
  if (category === "auto") {
    container.style.height = "255px";
    document.getElementById("wallpaper_auto_menu").classList.add("fadeIn");
    document.getElementById("wallpaper_custom_menu").classList.remove("fadeIn");
  } else if (category === "custom") {
    container.style.height = "385px";
    document.getElementById("wallpaper_auto_menu").classList.remove("fadeIn");
    document.getElementById("wallpaper_custom_menu").classList.add("fadeIn");
  }
}

function selectWallpaperAutoCategory(select) {
  pauseSync = true;
  pushSettings("wallpaperAutoCategory", select.value);
}

function selectWeatherCategory(button) {
  pauseSync = true;
  document.getElementsByClassName("weather_selected")[0]?.classList.remove("weather_selected");
  button.className = "weather_selected";
  pushSettings("weatherMeasurement", button.getAttribute("id"));
}

function togglePower() {
  pauseSync = true;
  if (data.power === 1) {
    data.power = 0;
    document.getElementById("power_text").innerHTML = "Off";
    pushSettings("power", 0);
  } else {
    data.power = 1;
    document.getElementById("power_text").innerHTML = "On";
    pushSettings("power", 1);
  }
}

function deleteCustomImage(filename) {
  pauseSync = false;

  document.getElementById(filename).classList.add("delete_warning");

  setTimeout(function () {
    let alert = confirm("Are you sure you want to delete this picture?");

    if (alert == true) {
      const xhttp = new XMLHttpRequest();
      xhttp.onload = function () {
        if (this.status == 200) {
          pauseSync = false;
        }
      };
      xhttp.open("DELETE", "/pictures", true);
      xhttp.setRequestHeader("Content-Type", "application/json");
      xhttp.send(JSON.stringify({ picture: filename }));
    } else {
      document.getElementById(filename).classList.remove("delete_warning");
    }
  }, 1);
}

function addFavoriteTeam(team = document.getElementById("team_input").value, serverFetch = false) {
  let teams = Object.keys(allTeams);

  if (!(team in data["favTeams"])) {
    if (teams.includes(team)) {
      pauseSync = true;
      document.getElementById("fav_team_list").innerHTML += '<div id="fav_team"> <h3>' + team + '</h3> <button class="remove_team_button" id="' + team + '" onclick="removeFavoriteTeam(\'' + team + "')\">&times;</button> </div>";
      document.getElementById("team_input").value = "";
      data["favTeams"][team] = allTeams[team];
      pushSettings("favTeams", data["favTeams"]);
    } else {
      alert("Invalid team");
    }
  } else if (serverFetch) {
    document.getElementById("fav_team_list").innerHTML += '<div id="fav_team"> <h3>' + team + '</h3> <button class="remove_team_button" id="' + team + '" onclick="removeFavoriteTeam(\'' + team + "')\">&times;</button> </div>";
  } else {
    alert("Team is already favorited");
    document.getElementById("team_input").value = "";
  }
}

function removeFavoriteTeam(team, serverFetch = false) {
  if (!serverFetch) {
    pauseSync = true;
    delete data["favTeams"][team];
    pushSettings("favTeams", data["favTeams"]);
  }
  document.getElementById(team).closest("#fav_team").remove();
}

function selectTimeFormat(time) {
  pauseSync = true;
  document.getElementsByClassName("time_selected")[0]?.classList.remove("time_selected");
  if (time == 12) {
    document.getElementById("12hrs").className = "time_selected";
    pushSettings("militaryTime", false);
  } else if (time == 24) {
    document.getElementById("24hrs").className = "time_selected";
    pushSettings("militaryTime", true);
  }
}

function addPinnedGame(id) {
  pauseSync = true;
  let element = document.getElementById(id);
  if (element.classList.contains("selected")) {
    element.classList.remove("selected");
    data["allGames"][id]["selected"] = false;
  } else {
    element.classList.add("selected");
    data["allGames"][id]["selected"] = true;
  }
  pushSettings("allGames", data["allGames"]);
}

function pushSettings(setting, value) {
  const xhttp = new XMLHttpRequest();
  xhttp.onload = function () {
    if (this.status == 200) {
      pauseSync = false;
    }
  };
  xhttp.open("POST", "/data", true);
  xhttp.setRequestHeader("Content-Type", "application/json");
  xhttp.send(JSON.stringify({ setting: setting, value: value }));
}

function fetchSettings() {
  if (!pauseSync) {
    const xhttp = new XMLHttpRequest();
    let oldData = data;

    xhttp.onload = function () {
      if (this.status == 200) {
        data = JSON.parse(this.responseText);
        document.getElementById("power_text").innerHTML = data["power"] === 1 ? "On" : "Off";

        brightnessSlider.value = data["brightness"];
        document.getElementById("brightness_text").innerHTML = data["brightness"] + "%";

        intervalSlider.value = data["pictureInterval"];
        setIntervalText();

        document.getElementById("weather").value = data["weatherLocation"];
        document.getElementsByClassName("weather_selected")[0]?.classList.remove("weather_selected");
        document.getElementById(data["weatherMeasurement"]).className = "weather_selected";

        document.getElementById(data["militaryTime"] ? "24hrs" : "12hrs").className = "time_selected";

        document.getElementsByClassName("wallpaper_selected")[0]?.classList.remove("wallpaper_selected");
        document.getElementById("wallpaper_" + data["wallpaperCategory"]).className = "wallpaper_selected";
        expandWallpaperCategory(data["wallpaperCategory"]);
        document.getElementById("wallpaper_category_selection").value = data["wallpaperAutoCategory"];

        document.getElementById("all_games_wrapper").innerHTML = "";

        Object.values(data.allGames).forEach(function (game) {
          document.getElementById("all_games_wrapper").innerHTML +=
            "<div onclick='addPinnedGame(" +
            game.id +
            ")' id='" +
            game.id +
            "' class='all_games " +
            (game.selected ? "selected" : "") +
            "'><div class='team_1'><img class='team_1' src='" +
            game.team1Logo +
            "'><h6>" +
            game.shortNames[1] +
            "</h6></div><h3>vs</h3><div class='team_2'><img class='team_2' src='" +
            game.team2Logo +
            "'><h6>" +
            game.shortNames[0] +
            "</h6></div></div>";
        });

        if (JSON.stringify(oldData.favTeams) !== JSON.stringify(data.favTeams)) {
          Object.keys(data["favTeams"]).forEach(function (team) {
            if (!Object.keys(oldData["favTeams"]).includes(team)) {
              addFavoriteTeam(team, true);
            }
          });

          Object.keys(oldData["favTeams"]).forEach(function (team) {
            if (!Object.keys(data["favTeams"]).includes(team)) {
              removeFavoriteTeam(team, true);
            }
          });
        }

        if (JSON.stringify(oldData.customPictures) !== JSON.stringify(data.customPictures)) {
          oldData.customPictures.forEach((picture) => {
            if (!data.customPictures.includes(picture)) {
              document.getElementById(picture).remove();
            }
          });
          data.customPictures.forEach((picture) => {
            if (!oldData.customPictures.includes(picture)) {
              document.getElementById("custom_wallpaper_view").innerHTML =
                "<div id='" + picture + "' onclick='deleteCustomImage(\"" + picture + "\")'><img id='" + picture + "' class='custom_picture' src='data/custom/" + picture + "'></div>" + document.getElementById("custom_wallpaper_view").innerHTML;
            }
          });
        }
      }
    };
    xhttp.open("GET", "/data", true);
    xhttp.send();
  }
}

$("#team_input").autocomplete({
  source: Object.keys(allTeams),
});

fetchSettings();
setInterval(fetchSettings, 1000);
