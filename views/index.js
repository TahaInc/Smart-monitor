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
      data = JSON.parse(this.responseText);

      document.getElementById("weather_text").innerHTML = data.weather;
      document.getElementById("weather_icon").setAttribute("src", "http://openweathermap.org/img/wn/" + data.weatherIcon + "@2x.png");
      document.getElementById("brightness").style.opacity = (1 - parseInt(data.brightness) / 100) * data.power;
    }
  };

  xhttp.open("GET", "/data", true);
  xhttp.send();
}

setInterval(refreshData, 1000);
