const p = document.getElementById('location');


function GetLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(GetPosition);
    } else {
        console.log("Geolocation is not supported by this browser.");
        p.innerHTML = "Geolocation is not supported by this browser.";
    }
}
function GetPosition(position){
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    p.innerHTML = "Latitude: " + lat +"<br>Longitude: " + lon;
    console.log("Latitude: " + lat + "\nLongitude: " + lon);
}