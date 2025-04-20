import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";
import WindParticles from './WindParticles';

const App = () => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [windSpeed, setWindSpeed] = useState(0);
  const windParticlesRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const sizes = { width: window.innerWidth, height: window.innerHeight };
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Load Skybox
    const loader = new THREE.CubeTextureLoader();
    loader.setPath('textures/skybox/');
    
    const skybox = loader.load([
      'px.png', // Right
      'nx.png', // Left
      'py.png', // Top
      'ny.png', // Bottom
      'pz.png', // Front
      'nz.png'  // Back
    ], 
    () => {
      console.log('Skybox loaded successfully');
      scene.background = skybox;
      scene.environment = skybox;
    },
    (progress) => {
      console.log('Loading skybox:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
      console.error('Error loading skybox:', error);
    });

    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3a5f0b,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    scene.add(ground);

    // Add some grass tufts
    const grassGeometry = new THREE.CylinderGeometry(0.1, 0.2, 0.5, 8);
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    
    for(let i = 0; i < 100; i++) {
      const grass = new THREE.Mesh(grassGeometry, grassMaterial);
      grass.position.x = (Math.random() - 0.5) * 180;
      grass.position.z = (Math.random() - 0.5) * 180;
      grass.position.y = -0.25;
      grass.scale.set(
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5
      );
      scene.add(grass);
    }

    // Add lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Orbit Controls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.enableZoom = true;

    // Load Windmill Model
    const loaderModel = new GLTFLoader();
    const modelUrl = new URL("windmill.glb", import.meta.url);
    let windmills = []; // Array to store all windmills

    loaderModel.load(
      modelUrl.href,
      (gltf) => {
        // Create 4 windmills at different positions and orientations
        const positions = [
          { x: 0, z: 0, rotation: 0 }, // Original windmill facing north
          { x: 20, z: 20, rotation: Math.PI/2 }, // Second windmill facing east
          { x: -20, z: 20, rotation: Math.PI/4 }, // Third windmill facing northeast
          { x: 0, z: -20, rotation: Math.PI*3/4 } // Fourth windmill facing northwest
        ];

        positions.forEach((pos, index) => {
          const windmill = gltf.scene.clone();
          windmill.position.set(pos.x, 0, pos.z);
          windmill.rotation.y = pos.rotation;
          scene.add(windmill);
          
          // Get the blades from the model
          const blades = windmill.getObjectByName("windmill_from");
          if (blades) {
            windmills.push({
              model: windmill,
              blades: blades,
              position: pos,
              lastWindComponent: 0
            });
          }
        });

        setLoading(false);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
      }
    );

    // Add GUI controls
    const gui = new GUI();
    const windControls = {
      windSpeed: 5,
      windDirection: 0,
      windmill1Speed: 0,
      windmill2Speed: 0,
      windmill3Speed: 0,
      windmill4Speed: 0,
      totalEnergyOutput: 0,
      individualEnergy: [0, 0, 0, 0],
      averageWindSpeed: 0 // Add average wind speed
    };

    const windFolder = gui.addFolder('Wind Controls');
    windFolder.add(windControls, 'windSpeed', 0, 30).name('Wind Speed (m/s)');
    windFolder.add(windControls, 'windDirection', 0, 360).name('Wind Direction (°)');
    windFolder.add(windControls, 'averageWindSpeed').name('Average Wind Speed (m/s)').listen();
    
    const energyFolder = gui.addFolder('Energy Output');
    energyFolder.add(windControls, 'totalEnergyOutput').name('Total Energy (kW)').listen();
    const individualEnergyFolder = energyFolder.addFolder('Individual Outputs');
    individualEnergyFolder.add(windControls.individualEnergy, '0').name('Windmill 1 (kW)').listen();
    individualEnergyFolder.add(windControls.individualEnergy, '1').name('Windmill 2 (kW)').listen();
    individualEnergyFolder.add(windControls.individualEnergy, '2').name('Windmill 3 (kW)').listen();
    individualEnergyFolder.add(windControls.individualEnergy, '3').name('Windmill 4 (kW)').listen();

    // Fetch Wind Speed and Direction Data
    const fetchWindData = async () => {
      try {
        console.log("Fetching wind data for Bangalore...");
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=12.9716&lon=77.5946&appid=bb2a45d39f5cc80b7c262506db614379&units=metric`
        );
        
        if (response.data && response.data.wind) {
          const windData = response.data.wind;
          console.log("Bangalore wind data received:", windData);
          setWindSpeed(windData.speed);
          windControls.windSpeed = windData.speed;
          windControls.windDirection = windData.deg;
        } else {
          console.error("Invalid response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching wind data:", error);
        setWindSpeed(5);
        windControls.windSpeed = 5;
        windControls.windDirection = 0;
      }
    };

    fetchWindData();
    const interval = setInterval(fetchWindData, 60000);

    // Initialize wind particles after scene is set up
    windParticlesRef.current = new WindParticles(scene, windControls.windSpeed, windControls.windDirection);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Calculate blade rotation speed based on wind speed and direction
      const TSR = 2; // Tip Speed Ratio
      const bladeRadius = 2.5; // meters
      const minWindSpeed = 3; // Minimum wind speed for rotation (m/s)
      const maxWindSpeed = 25; // Maximum wind speed for safety (m/s)
      const speedReductionFactor = 0.3; // Factor to reduce overall speed
      const airDensity = 1.225; // kg/m³
      const powerCoefficient = 0.4; // Typical value for wind turbines
      
      // Initialize vectors for wind calculations
      let windVector = new THREE.Vector3();
      
      // Get wind direction vector (wind is coming FROM this direction)
      const windDirectionRad = THREE.MathUtils.degToRad(windControls.windDirection);
      windVector.set(
        Math.sin(windDirectionRad),
        0,
        Math.cos(windDirectionRad)
      );

      // Calculate effective wind speed for each windmill
      let totalEffectiveWindSpeed = 0;
      let totalEnergyOutput = 0;
      windmills.forEach((windmill, index) => {
        // Get windmill's forward vector based on its orientation
        const windmillForward = new THREE.Vector3(0, 0, -1);
        const rotationMatrix = new THREE.Matrix4().makeRotationY(windmill.model.rotation.y);
        windmillForward.applyMatrix4(rotationMatrix);
        
        // Calculate dot product to get component of wind along forward vector
        const windComponent = windVector.dot(windmillForward);
        
        // Calculate effective wind speed
        const effectiveWindSpeed = windControls.windSpeed * Math.abs(windComponent);
        totalEffectiveWindSpeed += effectiveWindSpeed;

        // Calculate power output for this windmill
        let powerOutput = 0;
        if (effectiveWindSpeed >= minWindSpeed) {
          const sweptArea = Math.PI * Math.pow(bladeRadius, 2);
          powerOutput = 0.5 * airDensity * sweptArea * Math.pow(effectiveWindSpeed, 3) * powerCoefficient;
          // Convert to kW
          powerOutput /= 1000;
        }
        
        // Store individual energy output
        windControls.individualEnergy[index] = Math.round(powerOutput * 100) / 100;
        totalEnergyOutput += powerOutput;

        // Update individual windmill speed in GUI
        switch(index) {
          case 0:
            windControls.windmill1Speed = Math.round(effectiveWindSpeed * 100) / 100;
            break;
          case 1:
            windControls.windmill2Speed = Math.round(effectiveWindSpeed * 100) / 100;
            break;
          case 2:
            windControls.windmill3Speed = Math.round(effectiveWindSpeed * 100) / 100;
            break;
          case 3:
            windControls.windmill4Speed = Math.round(effectiveWindSpeed * 100) / 100;
            break;
          default:
            break;
        }

        // Calculate angular velocity based on effective wind speed
        let omega = 0;
        if (effectiveWindSpeed >= minWindSpeed) {
          const limitedWindSpeed = Math.min(effectiveWindSpeed, maxWindSpeed);
          omega = (TSR * limitedWindSpeed) / bladeRadius;
        }
        
        // Limit maximum rotation speed for safety
        const maxOmega = 1.0;
        const limitedOmega = Math.min(omega, maxOmega);

        // Calculate and update RPM
        const fps = 60;
        const baseRPM = (limitedOmega * fps * 60) / (2 * Math.PI);
        const scaledRPM = baseRPM * (effectiveWindSpeed / maxWindSpeed) * speedReductionFactor;

        // Rotate blades based on calculated RPM and wind component direction
        const rotationSpeed = (scaledRPM * 2 * Math.PI) / (60 * fps);
        windmill.blades.rotation.y += rotationSpeed * Math.sign(windComponent);
      });

      // Update average wind speed and total energy output in GUI
      windControls.averageWindSpeed = Math.round((totalEffectiveWindSpeed / windmills.length) * 100) / 100;
      windControls.totalEnergyOutput = Math.round(totalEnergyOutput * 100) / 100;

      // Update wind particles
      if (windParticlesRef.current) {
        windParticlesRef.current.update(windControls.windSpeed, windControls.windDirection);
      }

      orbitControls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handling
    const handleResize = () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
      gui.destroy();
      if (windParticlesRef.current) {
        windParticlesRef.current.dispose();
      }
    };
  }, []);

  return (
    <>
      {loading && <div className="loading">Loading...</div>}
      <p style={{ color: "white", fontSize: "20px", position: "absolute", top: "10px", left: "10px" }}>
        Wind Speed: {windSpeed} m/s
      </p>
      <canvas ref={canvasRef} className="webgl" />
    </>
  );
};

export default App;
