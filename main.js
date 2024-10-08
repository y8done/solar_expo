import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Raycaster, Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// Create the SolarScene, camera, and renderer
const SolarScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
const canvas = document.querySelector('#threeCanvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// OrbitControls for camera movement
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.01;
controls.enableZoom = true;
controls.enablePan = false;

// Set the initial camera position
camera.position.set(0, 50, 150);
camera.lookAt(0, 0, 0);

// Create the Sun
const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
const sunTexture = new THREE.TextureLoader().load('8k_sun.jpg');
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
SolarScene.add(sun);

// Create Raycaster for detecting clicks
const raycaster = new Raycaster();
const mouse = new Vector2();

// Function to convert degrees to radians
function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Function to create a planet and its orbit
function createPlanet(texture, radius, semiMajorAxis, eccentricity, inclination, orbitalPeriod, rotationPeriod) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const planetTexture = new THREE.TextureLoader().load(texture);
  const material = new THREE.MeshBasicMaterial({ map: planetTexture });
  const planet = new THREE.Mesh(geometry, material);

  // Create orbit line using BufferGeometry
  const orbitPoints = [];
  for (let i = 0; i <= 360; i++) {
    const meanAnomaly = (i / 360) * 2 * Math.PI;
    let E = meanAnomaly; // Initial guess for Eccentric Anomaly
    for (let j = 0; j < 10; j++) {
      E = E - (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
    }
    const trueAnomaly = 2 * Math.atan(Math.sqrt((1 + eccentricity) / (1 - eccentricity)) * Math.tan(E / 2));
    const r = semiMajorAxis * (1 - eccentricity * Math.cos(E));
    const x = r * Math.cos(trueAnomaly);
    const y = r * Math.sin(trueAnomaly);
    const z = y * Math.sin(degToRad(inclination));
    const adjustedY = y * Math.cos(degToRad(inclination));

    orbitPoints.push(new THREE.Vector3(x, adjustedY, z));
  }

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);

    SolarScene.add(orbitLine);
  SolarScene.add(planet);

  return { planet,radius,semiMajorAxis, orbitalPeriod, rotationPeriod, inclination, eccentricity,orbitLine};
}
const particleCount = 10000; // Increased particle count for a denser background
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const radius = 10000; // Radius of the sphere

for (let i = 0; i < particleCount; i++) {
    // Generate random spherical coordinates
    const phi = Math.random() * Math.PI * 2; // azimuthal angle
    const theta = Math.acos(Math.random() * 2 - 1); // polar angle
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
}

particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, opacity: 0.8, transparent: true });
const particleSystem = new THREE.Points(particles, particleMaterial);
SolarScene.add(particleSystem);

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(SolarScene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass();
bloomPass.threshold = 0.2;
bloomPass.strength = 1.5; // Increase for a stronger bloom effect
bloomPass.radius = 0.5;
composer.addPass(bloomPass);

const scaleFactor = 25; // Adjust this factor as needed for visibility
const mercuryData = createPlanet('8k_mercury.jpg', 0.2, 0.387 * scaleFactor, 0.20563, 7.0, 88.0, 58.646);
const venusData = createPlanet('8k_venus_surface.jpg', 0.4, 0.723 * scaleFactor, 0.006772, 3.86, 224.701, 243.022);
const earthData = createPlanet('8k_earth_daymap.jpg', 0.5, 1 * scaleFactor, 0.016708, 7.155, 365.25638, 1.0);
const marsData = createPlanet('8k_mars.jpg', 0.3, 1.524 * scaleFactor, 0.0934, 5.65, 686.971, 1.025);
const jupiterData = createPlanet('8k_jupiter.jpg', 0.7, 5.204 * scaleFactor, 0.0489, 6.09, 4332.59, 0.415);
const saturnData = createPlanet('8k_saturn.jpg', 0.6, 9.582 * scaleFactor, 0.0565, 5.51, 10759.22, 0.444);
const uranusData = createPlanet('2k_uranus.jpg', 0.5, 19.218 * scaleFactor, 0.046381, 6.48, 30688.5, 0.718);
const neptuneData = createPlanet('2k_neptune.jpg', 0.4, 30.070 * scaleFactor, 0.009456, 6.43, 60182.0, 0.671);
const plutoData   = createPlanet('8k_pluto.jpg', 0.2, 39.48 * scaleFactor, 0.2488, 11.88, 90560.0, 0.67); // Pluto

const planets = [
  mercuryData,
  venusData,
  earthData,
  marsData,
  jupiterData,
  saturnData,
  uranusData,
  neptuneData,
  plutoData,
];


// Create planets with accurate orbital parameters

const descriptions = {
  sun:{
    intro: "The Sun is the center of our solar system and provides heat and light to all the planets.",
    mass: "1.989 x 10^30 kg",
    radius: "696,340 km",
    rotation: "25 days",
    atmosphere: "Hydrogen and Helium",
    moon: 0
  },
  mercury:{
    intro: "Mercury is the closest planet to the Sun and has a surface temperature that varies greatly between day and night.",
    mass: "3.30 x 10^23 kg",
    radius: "2,440 km",
    rotation: "58.6 days",
    atmosphere: "Thin",
    moon: 0
  },
  venus:{
    intro: "Venus is the second planet from the Sun and is similar in structure to Earth, but it has a thick, toxic atmosphere.",
    mass: "4.87 x 10^24 kg",
    radius: "6,052 km",
    rotation: "243 days",
    atmosphere: "Carbon dioxide, Nitrogen, and Argon",
    moon: 0
  },
  earth:{
    intro: "Earth is the third planet from the Sun and the only known planet to support life.",
    mass: "5.97 x 10^24 kg",
    radius: "6,371 km",
    rotation: "24 hours",
    atmosphere: "Nitrogen, Oxygen, and Argon",
    moon: 1
  },
  mars:{
    intro: "Mars is the fourth planet from the Sun and is known for its reddish color due to iron oxide on its surface.",
    mass: "6.42 x 10^23 kg",
    radius: "3,390 km",
    rotation: "24.6 hours",
    atmosphere: "Carbon dioxide, Nitrogen, and Argon",
    moon: 2
  },
  jupiter:{
    intro: "Jupiter is the largest planet in our solar system, known for its Great Red Spot and many moons.",
    mass: "1.90 x 10^27 kg",
    radius: "69,911 km",
    rotation: "9.9 hours",
    atmosphere: "Hydrogen and Helium",
    moon: 80
  },
  saturn:{
    intro: "Saturn is famous for its stunning ring system, composed of ice and rock particles.",
    mass: "5.68 x 10^26 kg",
    radius: "58,232 km",
    rotation: "10.7 hours",
    atmosphere: "Hydrogen and Helium",
    moon: 83
  },
  uranus:{
    intro: "Uranus is the seventh planet from the Sun and has a unique blue color due to methane in its atmosphere.",
    mass: "8.68 x 10^25 kg",
    radius: "25,362 km",
    rotation: "17.2 hours",
    atmosphere: "Hydrogen and Helium",
    moon: 27
  },
  neptune:{
    intro: "Neptune is the eighth planet from the Sun and is known for its strong winds and dark blue color.",
    mass: "1.02 x 10^26 kg",
    radius: "24,622 km",
    rotation: "16.1 hours",
    atmosphere: "Hydrogen and Helium",
    moon: 14
  },
  pluto:{
    intro: "Pluto, now classified as a dwarf planet, was once considered the ninth planet in our solar system.",
    mass: "1.31 x 10^22 kg",
    radius: "1,188 km",
    rotation: "6.39 days",
    atmosphere: "Nitrogen and Methane",
    moon: 5
  }
};

// Show description function
function showDescription(planetName) {
  const descriptionBox = document.getElementById('descriptionBox');
  const descriptionTitle = document.getElementById('descriptionTitle');
  const descriptionText = document.getElementById('descriptionText');
  const intro = document.getElementById('intro');
  const mass = document.getElementById('mass');
  const radius = document.getElementById('radius');
  const rotation = document.getElementById('rotation');
  const atmosphere = document.getElementById('atmosphere');

  descriptionTitle.innerText = planetName.charAt(0).toUpperCase() + planetName.slice(1);
  intro.innerText = descriptions[planetName.toLowerCase()].intro;
  mass.innerText = "Mass: "+descriptions[planetName.toLowerCase()].mass;
  radius.innerText = "Radius: "+descriptions[planetName.toLowerCase()].radius;
  rotation.innerText = "Rotation: "+descriptions[planetName.toLowerCase()].rotation;
  atmosphere.innerText = "Atmosphere: "+descriptions[planetName.toLowerCase()].atmosphere;
  moon.innerText = "Moons: "+descriptions[planetName.toLowerCase()].moon;
  descriptionBox.style.display = 'block'; // Show the description box
}
let pointer = null; // Variable to hold the pointer
let selectedPlanet = null; // Track the selected planet
let time = 0;
// Hide description function
function hideDescription() {
  const descriptionBox = document.getElementById('descriptionBox');
  descriptionBox.style.display = 'none'; // Hide the description box
}
function resetSolarScene() {
  // Remove pointer if it exists
  if (pointer) {
      SolarSolarScene.remove(pointer);
      pointer = null; // Reset pointer variable
  }


  // Hide the description box
  hideDescription();

  // Move camera back to default view
  moveToDefaultView();
  selectedPlanet = null;
}
let orbitsVisible = true;

// Function to toggle orbits visibility
function toggleOrbits() {
  orbitsVisible = !orbitsVisible; // Toggle the boolean value
  planets.forEach(data => {
      const orbitLine = data.orbitLine; // Assuming orbitLine is part of planet data
      if (orbitLine) {
          orbitLine.visible = orbitsVisible; // Set visibility based on the toggle
      }
  });
}
// Event listeners for buttons
document.getElementById('toggleOrbitsBtn').addEventListener('click', toggleOrbits);
document.getElementById('refreshBtn').addEventListener('click', resetSolarScene);
document.getElementById('sunBtn').addEventListener('click', () => {
  showDescription('sun');
});
document.getElementById('mercuryBtn').addEventListener('click', () => {
  showDescription('mercury');
});
document.getElementById('venusBtn').addEventListener('click', () => {
  showDescription('venus');
});
document.getElementById('earthBtn').addEventListener('click', () => {
  showDescription('earth');
});
document.getElementById('marsBtn').addEventListener('click', () => {
  showDescription('mars');
});
document.getElementById('jupiterBtn').addEventListener('click', () => {
  showDescription('jupiter');
});
document.getElementById('saturnBtn').addEventListener('click', () => {
  showDescription('saturn');
});
document.getElementById('uranusBtn').addEventListener('click', () => {
  showDescription('uranus');
});
document.getElementById('neptuneBtn').addEventListener('click', () => {
  showDescription('neptune');
});
document.getElementById('plutoBtn').addEventListener('click', () => {
  showDescription('pluto');
});


// Optional: Hide description on canvas click
document.getElementById('threeCanvas').addEventListener('click', hideDescription);

// Function to move to the planet and display its description
document.getElementById('mercury3DBtn').addEventListener('click', () => {
  moveToPlanet3D('mercury');
});
document.getElementById('venus3DBtn').addEventListener('click', () => {
  moveToPlanet3D('venus');
});
document.getElementById('earth3DBtn').addEventListener('click', () => {
  moveToPlanet3D('earth');
});
document.getElementById('mars3DBtn').addEventListener('click', () => {
  moveToPlanet3D('mars');
});
document.getElementById('jupiter3DBtn').addEventListener('click', () => {
  moveToPlanet3D('jupiter');
});
document.getElementById('saturn3DBtn').addEventListener('click', () => {
  moveToPlanet3D('saturn');
});
document.getElementById('uranus3DBtn').addEventListener('click', () => {
  moveToPlanet3D('uranus');
});
document.getElementById('neptune3DBtn').addEventListener('click', () => {
  moveToPlanet3D('neptune');
});
document.getElementById('pluto3DBtn').addEventListener('click', () => {
  moveToPlanet3D('pluto');
});
document.getElementById('earthmoon3DBtn').addEventListener('click', () => {
  moveToPlanet3D('moon');
});

// Placeholder function to handle moving to 3D model
function moveToPlanet3D(planetName) {
  console.log(`Moving to ${planetName}'s 3D model`);
    // Redirect to the 3D model page with the planet name as a query parameter
    window.location.href = `3dmodel.html?planet=${planetName}`;

}
// Function to set up planet buttons
function setupPlanetButtons() {
  document.getElementById('mercuryBtn').onclick = () => moveToPlanet(mercuryData.planet,mercuryData.radius, 'Mercury');
  document.getElementById('venusBtn').onclick = () => moveToPlanet(venusData.planet,venusData.radius,'Venus');
  document.getElementById('earthBtn').onclick = () => moveToPlanet(earthData.planet,earthData.radius,'Earth');
  document.getElementById('marsBtn').onclick = () => moveToPlanet(marsData.planet,marsData.radius,'Mars');
  document.getElementById('jupiterBtn').onclick = () => moveToPlanet(jupiterData.planet,jupiterData.radius, 'Jupiter');
  document.getElementById('saturnBtn').onclick = () => moveToPlanet(saturnData.planet,saturnData.radius, 'Saturn');
  document.getElementById('uranusBtn').onclick = () => moveToPlanet(uranusData.planet,uranusData.radius, 'Uranus');
  document.getElementById('neptuneBtn').onclick = () => moveToPlanet(neptuneData.planet,neptuneData.radius, 'Neptune');
  document.getElementById('plutoBtn').onclick = () => moveToPlanet(plutoData.planet,plutoData.radius, 'Pluto');
}

// Function to move to the planet and display its descripti
setupPlanetButtons();


let followingPlanet = null; // Planet that is currently being followed

// Function to handle planet clicks
// Add event listener for detecting clicks on the planets and the Sun
// Add event listener for detecting clicks on the planets and the Sun
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.planet));

  if (intersects.length > 0) {
      const clickedPlanet = intersects[0].object;
      const planetData = planets.find(p => p.planet === clickedPlanet);
      if (planetData) {
          moveToPlanet(planetData.planet, clickedPlanet.name);
      }
  }
});

let followingObject = null; // Object being followed (planet or Sun)
const defaultCameraPosition = new THREE.Vector3(0, 50, 150); // Default camera position

function moveToObject(target,radius) {
  const followOffset = new THREE.Vector3(0,30,30); // Camera offset from the object
  const followPosition = target.position.clone().add(followOffset);
  
  camera.position.lerp(followPosition, 0.1); // Smooth following movement with lerp
  camera.lookAt(target.position.clone()); // Camera always looks at the target
}

function updateCamera() {
  if (selectedPlanet) {
      const planetPosition = selectedPlanet.position.clone(); // Get the planet's position
      const distance = 100; // Distance from the planet to the camera
      camera.position.set(planetPosition.x, planetPosition.y + distance, planetPosition.z + distance);
      camera.lookAt(planetPosition); // Ensure the camera looks at the planet
  }
}
 // Variable to track the selected planet


function createHighlightRing(radius) {
  const ringGeometry = new THREE.RingGeometry(radius, radius + 0.5, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, opacity: 0.7, transparent: true });
  const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
  ringMesh.rotation.x = Math.PI / 2; // Rotate to make it horizontal
  return ringMesh;
}
// Function to move to the planet and display its description
function moveToPlanet(planet,radius,planetName) {
  selectedPlanet = planet; // Set the selected planet
  moveToObject(planet,radius); // Move to the planet with a smooth transition
  showDescription(planetName); // Show planet description

}

// Call updateCamera in your animation loop


function moveToDefaultView() {
    const startPosition = camera.position.clone();
    const duration = 1.5;
    let startTime = null;

    function animateCamera(time) {
        if (!startTime) startTime = time;
        const elapsed = (time - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);

        camera.position.lerpVectors(startPosition, defaultCameraPosition, t);
        camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the center (where the Sun is)

        if (t < 1) {
            requestAnimationFrame(animateCamera);
        } else {
            controls.target.set(0, 0, 0); // Reset the controls target to the origin (center of the SolarScene)
            followingObject = null; // Stop following any object
        }
    }

    requestAnimationFrame(animateCamera);
}
function animate() {
  requestAnimationFrame(animate);

  // Update each planet's position in its orbit
  planets.forEach(data => {
      const { planet, semiMajorAxis, orbitalPeriod, rotationPeriod, eccentricity, inclination } = data;

      // Calculate the position of the planet in orbit
      const meanAnomaly = (2 * Math.PI * time) / orbitalPeriod;
      let E = meanAnomaly; 
      for (let j = 0; j < 10; j++) {
          E = E - (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
      }
      const trueAnomaly = 2 * Math.atan(Math.sqrt((1 + eccentricity) / (1 - eccentricity)) * Math.tan(E / 2));
      const r = semiMajorAxis * (1 - eccentricity * Math.cos(E));
      const x = r * Math.cos(trueAnomaly);
      const y = r * Math.sin(trueAnomaly);
      const z = y * Math.sin(degToRad(inclination));
      const adjustedY = y * Math.cos(degToRad(inclination));

      planet.position.set(x, adjustedY, z);
      planet.rotation.y += (Math.PI / 180) * (360 / rotationPeriod);

      // Update pointer position if it exists
      if (pointer) {
          pointer.position.copy(planet.position);
          pointer.position.y += 2; // Keep it above the planet
      }
  });

  // Update the camera to follow the selected planet if applicable
  if (selectedPlanet) {
      moveToObject(selectedPlanet,selectedPlanet.radius);
  }

  controls.update();
  composer.render(); // Use composer for post-processing effects
  time += 0.5; // Time increment for planet orbits
}

// Resize the canvas on window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// Start the animation loop
animate();
