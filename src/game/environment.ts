import * as THREE from 'three';

export class Environment {
  public scene: THREE.Scene;
  public dirLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public sunMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public stars: THREE.Points;

  // Day/Night cycle: 600 seconds (10 minutes) full cycle
  public dayDuration: number = 600;
  public time: number = 150; // starts mid-morning
  public timeSpeed: number = 1.0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // Directional sunlight with shadow mapping
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 150;
    const d = 40;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.001;
    this.scene.add(this.dirLight);

    // Atmospheric Fog
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    // Sun: Glowing 3D block in the sky
    const sunGeom = new THREE.BoxGeometry(12, 12, 12);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // Moon: Glowing pale block
    const moonGeom = new THREE.BoxGeometry(10, 10, 10);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e1dd });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);

    // Starfield for night sky
    const starGeom = new THREE.BufferGeometry();
    const starCount = 300;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 180;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10; // upper hemisphere
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, transparent: true, opacity: 0 });
    this.stars = new THREE.Points(starGeom, starMat);
    this.scene.add(this.stars);
  }

  // Update sun/moon positions, sky colors, lighting
  public update(dt: number, playerX: number, playerZ: number): { isNight: boolean; timeOfDay: string } {
    this.time = (this.time + dt * this.timeSpeed) % this.dayDuration;
    const progress = this.time / this.dayDuration; // 0.0 to 1.0

    // Sun angle in radians: 0 at sunrise, pi/2 at noon, pi at sunset, 3pi/2 at midnight
    const sunAngle = progress * Math.PI * 2 - Math.PI / 2;

    const sunDist = 120;
    const sunX = playerX + Math.cos(sunAngle) * sunDist;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunZ = playerZ + Math.sin(sunAngle * 0.3) * 30;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.moonMesh.position.set(
      playerX - Math.cos(sunAngle) * sunDist,
      -sunY,
      playerZ - Math.sin(sunAngle * 0.3) * 30
    );

    // Keep directional light following player
    this.dirLight.position.set(sunX, Math.max(10, sunY), sunZ);
    this.dirLight.target.position.set(playerX, 15, playerZ);
    this.dirLight.target.updateMatrixWorld();

    // Check if day or night
    const isDay = sunY > 0;
    const isNight = sunY <= -10;

    // Smooth color interpolations
    const dayColor = new THREE.Color(0x87ceeb); // Day blue
    const sunsetColor = new THREE.Color(0xf3722c); // Sunset orange
    const nightColor = new THREE.Color(0x0a0c16); // Midnight dark blue

    let currentSky = new THREE.Color();
    let ambientIntensity = 0.6;
    let dirIntensity = 1.2;
    let starOpacity = 0.0;

    if (sunY > 20) {
      // Full Day
      currentSky.copy(dayColor);
      ambientIntensity = 0.65;
      dirIntensity = 1.2;
      starOpacity = 0;
    } else if (sunY > -15) {
      // Sunset / Sunrise transition
      const t = (sunY + 15) / 35; // 0 to 1
      if (sunY >= 0) {
        currentSky.lerpColors(sunsetColor, dayColor, sunY / 20);
      } else {
        currentSky.lerpColors(nightColor, sunsetColor, (sunY + 15) / 15);
      }
      ambientIntensity = 0.25 + 0.4 * t;
      dirIntensity = 0.2 + 1.0 * t;
      starOpacity = (1 - t) * 0.85;
    } else {
      // Full Night
      currentSky.copy(nightColor);
      ambientIntensity = 0.18;
      dirIntensity = 0.15;
      starOpacity = 0.95;
    }

    this.scene.background = currentSky;
    if (this.scene.fog) {
      this.scene.fog.color.copy(currentSky);
    }

    this.ambientLight.intensity = ambientIntensity;
    this.dirLight.intensity = dirIntensity;
    (this.stars.material as THREE.PointsMaterial).opacity = starOpacity;
    this.stars.position.set(playerX, 0, playerZ);

    let timeOfDay = 'Day';
    if (progress < 0.2) timeOfDay = 'Morning';
    else if (progress < 0.5) timeOfDay = 'Noon';
    else if (progress < 0.6) timeOfDay = 'Sunset';
    else timeOfDay = 'Night';

    return { isNight, timeOfDay };
  }
}
