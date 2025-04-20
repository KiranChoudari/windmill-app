# Windmill 3D Visualization

A 3D visualization of windmills with real-time wind effects and particle systems. This React application uses Three.js to create an interactive 3D environment where windmills respond to wind conditions.

## Features

- Real-time 3D windmill visualization
- Dynamic wind particle system
- Wind speed and direction controls
- Multiple windmills with individual orientations
- Real-time RPM calculations
- Skybox environment

## Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/windmill-app.git
cd windmill-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Build for production:
```bash
npm run build
```

## Project Structure

- `public/` - Static assets and models
  - `textures/skybox/` - Skybox images
  - `windmill.glb` - 3D windmill model
- `src/` - Source code
  - `App.js` - Main application component
  - `WindParticles.js` - Wind particle system
  - `index.js` - Application entry point

## Deployment

This project is configured for deployment on Vercel. The deployment process is automated through the Vercel platform.

## Technologies Used

- React
- Three.js
- Axios
- lil-gui
- React Scripts

## License

MIT
