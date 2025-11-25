export const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b8b8b" }] },

  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "off" }]
  },

  {
    featureType: "poi",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }]
  },

  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#272727" }]
  },

  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2c" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a1a" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#848484" }]
  },

  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2a2a2a" }]
  },

  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e0e0e" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4d4d4d" }]
  }
];
