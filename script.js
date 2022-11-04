const url = "./world/world-population.geo.json"
const map = L.map('map').setView([43.8794095, 10.5858792], 2);

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

function getColor(color) {
    switch (color) {
        case 'first': return "blue";
        case 'second':   return "red";
        case 'third': return "green";
        case 'forth':   return "darkOrange";
    }
}

function myStyle(feature) {
    return {
        fillColor: getColor(feature.properties.player),
        weight: 1.5,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function players(){
    const player = Math.ceil(Math.random() * 4)
    switch (player) {
        case 1 : return "first";
        case 2 : return "second";
        case 3 : return "third";
        case 4 : return "forth";
    }

}

const dataGeo = async function getData() {
    const response = await fetch(url)
    const data = await response.json()
    const arr = data.features
            arr.forEach(element => {
                element.properties.player = players()                
            })
    return data
}

let boundsContainer = [] //here the countries to be compared
let markersContainer = [] //countries icons selected

function reset(){
    markersContainer.forEach(function(marker){
        return map.removeLayer(marker);
    })
}

dataGeo()
    .then(data => {
        L.geoJSON(data, {
            style: myStyle,
            clickable: true,
            onEachFeature: (data, layer)=> (
                //The borders are derived from the bounds
                //more info: https://leafletjs.com/reference.html#bounds
                data.properties.bounds = layer.getBounds(),
                layer.addEventListener("click", function(e){
                    //The bounds representing Alaska are not contiguous to those onces
                    //representing the rest of country, overvaluing its final bound.
                    if(data.id === 198){
                        const usaNorthEast = L.latLng(48.951366470947725, -122.62939453125001)
                        const usaSouthWest = L.latLng(25.24469595130604, -80.44189453125001)
                        data.properties.bounds = L.latLngBounds(usaNorthEast,  usaSouthWest)
                    }           
                    const marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map)
                    markersContainer.push(marker)
                    boundsContainer.push( data )
                    if(boundsContainer.length === 2){ //selects pairs of countries at time
                        const intersection = boundsContainer[0].properties.bounds.intersects(boundsContainer[1].properties.bounds)
                        const equals = boundsContainer[0].properties.bounds.equals(boundsContainer[1].properties.bounds)
                        const  zone = boundsContainer[0].properties.player === boundsContainer[1].properties.player
                        if(equals){
                            L.tooltip()
                                .setLatLng(e.latlng)
                                .setContent("Hey! you are not crossing any bordes")
                                .addTo(map);
                            boundsContainer = []
                            }
                        else if(zone){
                            L.tooltip()
                            .setLatLng(e.latlng)
                            .setContent("This country is already under your control")
                            .addTo(map);
                        boundsContainer = []
                        }
                        else if(intersection){
                            data.properties.player = boundsContainer[0].properties.player
                            layer.setStyle(myStyle(data))
                            //console.log(boundsContainer)
                            boundsContainer = []
                        }
                        else {
                            L.tooltip()
                                .setLatLng(e.latlng)
                                .setContent(`${boundsContainer[1].properties.NAME} has no borders in common with ${boundsContainer[0].properties.NAME}`)
                                .addTo(map);
                            boundsContainer = []                         
                            }
                        setTimeout(reset, 500);    
                        }
                })
            )
        }).addTo(map);
    })



