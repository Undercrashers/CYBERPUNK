import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap';

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

let model;
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
        model = gltf.scene; // Remove 'const' keyword here
        scene.add(model);
                    },
        undefined,
        function (error) {
            console.error(error);
        }
    );
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', (e) => {
    if (model){
        const rotationX = ( e.clientX / window.innerWidth - 0.5) * Math.PI;
        const rotationY = ( e.clientY / window.innerHeight - 0.5) * Math.PI;
        
        // Use GSAP to animate the rotation
        gsap.to(model.rotation, {
            x: rotationY,
            y: rotationX,
            duration: 0.9,
            ease: "power1.out"
        });
    }
});

function animate() {
    window.requestAnimationFrame(animate);
    composer.render();
    
}
animate();