import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Get the planet name from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const planetName = urlParams.get('planet') || 'earth'; // Default to 'earth' if no planet is specified

// Planet data with scaling factor included for optimization
const planetData = {

        mercury: {
            name: "Mercury",
            description: "Mercury is the closest planet to the Sun. It's small and rocky.",
            facts: ["Smallest planet", "No atmosphere", "Extreme temperatures"],
            scale: 3,
            texture: 'textures/mercury.jpg',
        },
        venus: {
            name: "Venus",
            description: "Venus is the second planet from the Sun and has a thick atmosphere.",
            facts: ["Hottest planet", "Thick atmosphere", "Similar size to Earth"],
            scale: 4,
            texture: 'textures/venus.jpg',
        },
        earth: {
            name: "Earth",
            description: "Earth is our home planet. It has liquid water and life.",
            facts: ["Only planet with life", "70% covered by water", "Has one moon"],
            scale: 5,
            texture: 'textures/earth.jpg',
        },
        mars: {
            name: "Mars",
            description: "Mars is the fourth planet from the Sun, known as the Red Planet.",
            facts: ["Red due to iron oxide", "Has two moons", "Tallest volcano in the solar system"],
            scale: 3.5,
            texture: 'textures/mars.jpg',
        },
        jupiter: {
            name: "Jupiter",
            description: "Jupiter is the largest planet in the Solar System, a gas giant.",
            facts: ["Largest planet", "Great Red Spot", "Mostly hydrogen and helium"],
            scale: 10,
            texture: 'textures/jupiter.jpg',
        },
        saturn: {
            name: "Saturn",
            description: "Saturn is famous for its stunning ring system, another gas giant.",
            facts: ["Prominent ring system", "Second largest planet", "Mostly hydrogen and helium"],
            scale: 9,
            texture: 'textures/saturn.jpg',
        },
        uranus: {
            name: "Uranus",
            description: "Uranus is an ice giant with a unique tilt that makes it rotate on its side.",
            facts: ["Rotates on its side", "Has faint rings", "Coldest planet in the Solar System"],
            scale: 6,
            texture: 'textures/uranus.jpg',
        },
        neptune: {
            name: "Neptune",
            description: "Neptune is the farthest planet from the Sun, another ice giant.",
            facts: ["Strongest winds", "Has faint rings", "Mostly hydrogen and helium"],
            scale: 6,
            texture: 'textures/neptune.jpg',
        },
        pluto: {
            name: "Pluto",
            description: "Pluto is a dwarf planet in the Kuiper Belt, once considered the ninth planet.",
            facts: ["Dwarf planet", "Five moons", "Icy surface"],
            scale: 2.5,
            texture: 'textures/pluto.jpg',
        },
        moon: {
            name: "Earth's Moon",
            description: "Pluto is a dwarf planet in the Kuiper Belt, once considered the ninth planet.",
            facts: ["Dwarf planet", "Five moons", "Icy surface"],
            scale: 1,
            texture: 'textures/moon.jpg',
        },// Add your planet data here (e.g., earth, mars, moon, etc.)
};

// Get the planet data
const planetInfo = planetData[planetName.toLowerCase()] || planetData['earth'];

// Update planet information in HTML (if you have planet info in the UI)
document.getElementById('planetName').textContent = planetInfo.name;
document.getElementById('planetDescription').textContent = planetInfo.description;
const factsList = document.getElementById('planetFacts');
factsList.innerHTML = ''; // Clear existing facts
planetInfo.facts.forEach(fact => {
    const li = document.createElement('li');
    li.textContent = fact;
    factsList.appendChild(li);
});

// THREE.js Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvasContainer').appendChild(renderer.domElement);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x404040, 10);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
pointLight.position.set(20, 20, 20);
scene.add(pointLight);

// Camera controls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
camera.position.z = 150;

// Raycaster for detecting clicks on the planet surface
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Load the planet model or fallback to texture
function loadPlanet() {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(`models/${planetName.toLowerCase()}.glb`, function (gltf) {
            const planetModel = gltf.scene;
            scene.add(planetModel);
            planetModel.scale.set(planetInfo.scale, planetInfo.scale, planetInfo.scale);
            planetModel.position.set(0, 0, 0);

            // If the planet is Saturn, add rings
            if (planetName.toLowerCase() === 'saturn') {
                addSaturnRings(planetModel);
            }

            resolve(planetModel);
        }, undefined, function (error) {
            // If model fails, use texture instead
            createTexturedSphere().then(resolve).catch(reject);
        });
    });
}

// Create a textured sphere for planets without GLB models
function createTexturedSphere() {
    return new Promise((resolve) => {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(planetInfo.texture, function (texture) {
            const material = new THREE.MeshStandardMaterial({ map: texture });
            const planetMesh = new THREE.Mesh(geometry, material);
            planetMesh.scale.set(planetInfo.scale, planetInfo.scale, planetInfo.scale);
            scene.add(planetMesh);
            resolve(planetMesh);
        });
    });
}

// Convert Cartesian coordinates (x, y, z) to Latitude and Longitude
function getLatLonFromPosition(position) {
    const { x, y, z } = position;
    const radius = Math.sqrt(x * x + y * y + z * z);

    const latitude = Math.asin(y / radius) * (180 / Math.PI); // Convert radians to degrees
    const longitude = Math.atan2(z, x) * (180 / Math.PI); // Convert radians to degrees

    return { latitude, longitude };
}

// Function to handle mouse clicks
function onMouseClick(event) {
    // Convert mouse position to normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Set raycaster based on the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check intersection with the planet model
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        const { latitude, longitude } = getLatLonFromPosition(intersectionPoint);

        console.log(`Latitude: ${latitude.toFixed(2)}, Longitude: ${longitude.toFixed(2)}`);
        alert(`Latitude: ${latitude.toFixed(2)}°, Longitude: ${longitude.toFixed(2)}°`);
    }
}


function latLonToCartesian(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);  // Convert latitude to radians
    const theta = (lon + 180) * (Math.PI / 180);  // Convert longitude to radians

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return { x, y, z };
}

// Function to add a marker at specified latitude and longitude
function addMarker(lat, lon, radius) {
    const markerGeometry = new THREE.SphereGeometry(0.5, 32, 32); // Adjusted size for better visibility
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red marker color
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);

    const position = latLonToCartesian(lat, lon, radius);
    markerMesh.position.set(position.x, position.y, position.z);

    scene.add(markerMesh);
}

// Define planet radius explicitly based on its scale
const planetRadius = 5; // Example: Assuming Earth's radius is scaled to 5 units

// Adding marker at approximately 69.3741°S latitude and 32.32°E longitude
const latitude = -69.3741;
const longitude = 32.32;
addMarker(latitude, longitude, planetRadius);
// Event listener for mouse clicks
window.addEventListener('click', onMouseClick);

// Function to add Saturn's rings
function addSaturnRings(planet) {
    const ringGeometry = new THREE.RingGeometry(1.3, 1.7, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xdddddd,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2; // Rotate ring to lie flat
    planet.add(ring);
}

// Animation loop
function animate(planet) {
    requestAnimationFrame(() => animate(planet));
    if (planet.rotation) {
        planet.rotation.y += 0.002; // Rotate the planet slowly
    }
    controls.update();
    renderer.render(scene, camera);
}

// Initialize the 3D scene
loadPlanet()
    .then(planet => {
        animate(planet);
    })
    .catch(error => {
        console.error(error);
        alert('Could not load planet model or texture.');
    });

// Resize handler for responsive canvas
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
