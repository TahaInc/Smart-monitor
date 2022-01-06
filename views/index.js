const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let data = {};

function refreshData() {
  const xhttp = new XMLHttpRequest();
  const date = new Date();

  document.getElementById("time").innerHTML = date.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: !data.militaryTime }).slice(0, data.militaryTime ? 5 : -2);
  document.getElementById("date").innerHTML = day[date.getDay()] + ", " + month[date.getMonth()] + " " + date.getDate() + (date.getDate() == "1" ? "st" : date.getDate() == "2" ? "nd" : date.getDate() == "3" ? "rd" : "th") + " " + date.getFullYear();

  xhttp.onload = function () {
    if (this.status == 200) {
      let oldData = data;
      data = JSON.parse(this.responseText);

      document.getElementById("weather_text").innerHTML = data.weather;
      document.getElementById("weather_icon").setAttribute("src", "http://openweathermap.org/img/wn/" + data.weatherIcon + "@2x.png");
      document.getElementById("brightness").style.opacity = 1 - (parseInt(data.brightness) / 100) * data.power;

      let games = Object.values(data.allGames).filter((game) => game.selected);

      document.getElementById("side_info").innerHTML = "";

      if (oldData["wallpaper"] != data["wallpaper"]) {
        if (document.getElementById("wallpaper_front").style.opacity == 0) {
          document.getElementById("wallpaper_front").setAttribute("src", "data/" + data["wallpaperCategory"] + "/" + data["wallpaper"]);
          setTimeout(function () {
            document.getElementById("wallpaper_front").style.opacity = 1;
          }, 500);
        } else {
          document.getElementById("wallpaper_back").setAttribute("src", "data/" + data["wallpaperCategory"] + "/" + data["wallpaper"]);
          setTimeout(function () {
            document.getElementById("wallpaper_front").style.opacity = 0;
          }, 500);
        }
      }

      if (games.length <= 3) {
        document.getElementById("side_info").classList = "scoreboard_layout_1";
        document.querySelector("h3").classList.remove("become_small");
        document.querySelector(".scoreboard_logo").classList.remove("become_small");
      } else if (games.length <= 8) {
        document.getElementById("side_info").classList = "scoreboard_layout_2";
        document.querySelector("h3").classList.add("become_small");
        document.querySelector(".scoreboard_logo").classList.add("become_small");
      }

      let gamesCounter = 0;

      games.forEach((game) => {
        if (gamesCounter >= 8) return;
        gamesCounter++;
        let scoreboard = document.getElementsByClassName("scoreboard")[0].cloneNode(true);
        scoreboard.setAttribute("id", game.id);
        scoreboard.classList.remove("hidden");

        if (games.length <= 3) {
          scoreboard.childNodes[1].childNodes[3].innerHTML = game.shortNames[1];
          scoreboard.childNodes[1].childNodes[7].innerHTML = game.shortNames[0];
          scoreboard.childNodes[1].childNodes[5].childNodes[1].style.fontSize = "10px";
          scoreboard.childNodes[1].childNodes[1].style.height = "35px";
          scoreboard.childNodes[1].childNodes[9].style.height = "35px";
          scoreboard.childNodes[3].childNodes[1].style.transform = "translate(0, -10px)";
          scoreboard.classList.add("full");
        } else if (games.length <= 8) {
          scoreboard.childNodes[3].style.fontSize = "12px";
          scoreboard.childNodes[1].childNodes[1].style.height = "30px";
          scoreboard.childNodes[1].childNodes[9].style.height = "30px";
          scoreboard.childNodes[3].childNodes[1].style.transform = "translate(0, -12px) scale(0.8)";
          scoreboard.childNodes[1].childNodes[5].childNodes[1].style.fontSize = "7px";
          scoreboard.classList.remove("full");
        }

        scoreboard.childNodes[1].style.background = "linear-gradient(90deg, " + game.colors[0] + " 0%, black 40%,  black 60%, " + game.colors[1] + " 100%)";
        scoreboard.childNodes[1].childNodes[1].setAttribute("src", game.logos[0]);
        scoreboard.childNodes[1].childNodes[5].childNodes[1].innerHTML = game.league.toUpperCase();
        scoreboard.childNodes[1].childNodes[5].childNodes[3].innerHTML = game.scores[0] + " - " + game.scores[1];
        scoreboard.childNodes[1].childNodes[9].setAttribute("src", game.logos[1]);
        scoreboard.childNodes[3].childNodes[1].innerHTML = game.shortDetail;
        if (game.sport == "Football" && game.possession != undefined) scoreboard.childNodes[3].innerHTML += "<div class='sub_scoreboard'>" + game.possession + "</div>";

        document.getElementById("side_info").appendChild(scoreboard);
      });
    }
  };

  xhttp.open("GET", "/data", true);
  xhttp.send();
}

refreshData();
setInterval(refreshData, 1000);
