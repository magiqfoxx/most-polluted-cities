//Setting the value of the field based on storage
if (sessionStorage.country) {
  document.getElementById("country").value = sessionStorage.country;
}

const loader =
  '<div class="lds-facebook"><div></div><div></div><div></div></div>';

async function getResults(countryFullName) {
  event.preventDefault();
  //getting the value of country from storage
  sessionStorage.setItem("country", countryFullName);
  let country;
  switch (countryFullName) {
    case "Poland":
      country = "PL";
      break;
    case "Germany":
      country = "DE";
      break;
    case "Spain":
      country = "ES";
      break;
    case "France":
      country = "FR";
      break;
    default:
      document.getElementById("results").innerHTML =
        "<h3>Please choose one of these four cities:</h3><ul><li>Poland</li><li>Germany</li><li>Spain</li><li>France</li></ul>";
  }
  if (!["Poland", "Germany", "Spain", "France"].includes(countryFullName)) {
    return;
  }
  //show Loader
  document.getElementById("results").innerHTML = loader;

  let limit = 10;
  let cities = await getPollutionData(country).catch(error => showError(error));
  while (!checkIf10Cities(cities)) {
    if (limit >= 100) {
      //considering the unpredictable nature of the data i'm choosing to request only a 100 results
      //limit could be changed to a bigger number but there is no guarantee that it would mean more variability in cities
      console.log(
        "Too many requests, not enough cities. Couldn't find at least 10 cities."
      );
      break;
    }
    cities = await getPollutionData(country, (limit = 100)).catch(error =>
      showError(error)
    );
  }
  noRepeatCities = removeRepeats(cities);
  let pollutedCities = [];

  const getExtracts = async () => {
    //running consecutively to avoid sorting by value again later
    for (const city of noRepeatCities) {
      const name = city.city;
      const value = city.value;
      const unit = city.unit;
      await getWikiData(name)
        .then(extract => {
          if (extract) {
            pollutedCities.push({ name, value, unit, extract });
          } else {
            pollutedCities.push({
              name,
              value,
              unit,
              extract: "Couldn't get data from wikipedia."
            });
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
    Promise.all(createHTMLList(pollutedCities));
  };
  getExtracts();
}

function showError(error) {
  console.log(error);
  document.getElementById(results).innerHTML =
    "Sorry. There was an error while fetching the data";
}

async function getPollutionData(country, limit = 10) {
  //I'm choosing to rank cities by the amount of pm25 as it's the most popular parameter when talking about pollution
  const response = await fetch(
    `https://api.openaq.org/v1/measurements?country=${country}&parameter=pm25&order_by=value&sort=desc&limit=${limit}`
  );
  const data = await response.json();
  const pollutedCities = await data.results;
  return pollutedCities;
}
function checkIf10Cities(results) {
  let cities = [];
  results.some(result => {
    if (!cities.includes(result.city)) {
      cities.push(result.city);
    }
  });
  return cities.length >= 10;
}
function removeRepeats(results) {
  let noRepeats = [];
  let cityList = [];
  results.forEach(result => {
    if (!cityList.includes(result.city)) {
      noRepeats.push(result);
      cityList.push(result.city);
    }
  });
  return noRepeats.slice(0, 10);
}
async function getWikiData(city) {
  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${city}`
  );
  const data = await response.json();
  return await data.extract;
}

async function createHTMLList(pollutedCities) {
  //resetting
  document.getElementById("results").innerHTML = "";

  let ol = document.createElement("ol");
  ol.classList.add("polluted-cities__list", "list-group");

  pollutedCities.forEach(city => {
    let li = makeLi(city);
    ol.appendChild(li);
  });
  document.getElementById("results").appendChild(ol);
  new Accordion(".accordion-container");
}
function makeLi(city) {
  let li = document.createElement("li");
  li.classList.add("polluted-cities__list-item", "ac", "list-group-item");
  let h3 = document.createElement("h3");
  h3.classList.add("polluted-cities__city-name", "ac-q");
  h3.tabIndex = 0;
  let span = document.createElement("span");
  span.classList.add("polluted-cities__list-value");
  span.innerHTML = city.value + city.unit;
  h3.innerHTML = city.name + " - ";
  h3.appendChild(span);
  let p = document.createElement("p");
  p.classList.add("polluted-cities__city-extract", "ac-a");
  p.innerHTML = city.extract;
  li.appendChild(h3);
  li.appendChild(p);
  return li;
}
