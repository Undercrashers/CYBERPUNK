import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';

// Create a scene
const scene = new THREE.Scene();

//camera
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3.5;

//renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#canvas'),
    antialias: true,
    alpha: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Postprocessing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0015;
composer.addPass(rgbShiftPass);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Load HDRI environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', 
    function (texture) {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();

        const loader = new GLTFLoader();
        loader.load('./DamagedHelmet.gltf', 
        function (gltf) {
        const model = gltf.scene;
        scene.add(model);
                    },
        undefined,
        function (error) {
            console.error(error);
        }
    );
});



// Handle window resize
window.addEventListener('resize', () => {
    // Update camera aspect ratio and projection matrix
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update composer size
    composer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    window.requestAnimationFrame(animate);
    composer.render();
    
}
animate();