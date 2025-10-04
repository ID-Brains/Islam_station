function getLocation() {
  const button = document.getElementById('location');
  
  if (!navigator.geolocation) {
    console.log("Geolocation is not supported by this browser.");
    if (button) {
      button.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        Not Supported
      `;
      button.classList.add('btn-disabled');
    }
    return;
  }
  
  // Update button to show loading state
  if (button) {
    button.innerHTML = `
      <span class="loading loading-spinner loading-sm"></span>
      Getting Location...
    `;
    button.classList.add('btn-disabled');
  }
  
  navigator.geolocation.getCurrentPosition(showPosition, showError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
}

function showPosition(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

  // Store location in localStorage for components to use
  const locationData = { lat: latitude, lng: longitude };
  localStorage.setItem('userLocation', JSON.stringify(locationData));
  
  // Update button to show success
  const button = document.getElementById('location');
  if (button) {
    button.innerHTML = `
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      Location Set!
    `;
    button.classList.remove('btn-disabled');
    button.classList.add('btn-success');
    
    // Trigger a custom event to notify React components
    window.dispatchEvent(new CustomEvent('locationUpdated', { 
      detail: { lat: latitude, lng: longitude } 
    }));
    
    // Reload the page after a short delay to update prayer times
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
}

function showError(error) {
  const button = document.getElementById('location');
  let errorMessage = "Error getting location";
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMessage = "Permission Denied";
      console.log("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage = "Location Unavailable";
      console.log("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      errorMessage = "Request Timed Out";
      console.log("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      errorMessage = "Unknown Error";
      console.log("An unknown error occurred.");
      break;
  }
  
  // Update button to show error
  if (button) {
    button.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      ${errorMessage}
    `;
    button.classList.remove('btn-disabled');
    button.classList.add('btn-error');
    
    // Reset button after a delay
    setTimeout(() => {
      button.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        Get Your Location
      `;
      button.classList.remove('btn-error');
    }, 3000);
  }
}
