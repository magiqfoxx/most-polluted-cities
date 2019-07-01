function getWikiData(city) {
  return fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${city}`)
    .then(response => {
      return response.json();
    })
    .then(data => data.extract);
}
function getResults(country) {
  event.preventDefault();
  let polutedCities = [];
  fetch(
    `https://api.openaq.org/v1/measurements?country=${country}&parameter=pm25&order_by=value&sort=desc&limit=10`
  )
    .then(response => {
      return response.json();
    })
    .then(data => {
      const results = data.results;
      results.map(async city => {
        let name = city.city;
        let value = city.value;
        let unit = city.unit;
        let extract = await getWikiData(name);
        console.log(extract);
        polutedCities.push({ name, value, unit, extract });
      });
      makeCityList(polutedCities);
    });
}

function makeCityList(polutedCities) {
  let ol = document.createElement("ol");
  polutedCities.forEach(city => {
    console.log("hello");
    let li = makeLi(city);
    console.log(li);
    ol.appendChild(li);
  });
  document.getElementById("results").appendChild(ol);
}
function makeLi(city) {
  let li = document.createElement("li");
  let h3 = document.createElement("h3");
  h3.innerHTML = city.name + " - " + city.value + city.unit;
  let p = document.createElement("p");
  p.innerHTML = city.extract;
  li.appendChild(h3);
  li.appendChild(p);
  return li;
}
/*
<div id="results">
  <ol>
    <li>
      <h3>city.name</h3>
      <p>city.extract</p>
    </li>
  </ol>
</div>;*/
