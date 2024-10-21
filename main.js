import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.lookAt(0, 0, 0);
camera.position.set(4, .8, 4);
scene.add(camera);

// fog
scene.fog = new THREE.FogExp2(0xffffff, 0.02);

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.querySelector('#draw'), alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .8;

// responsive
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight("white", 90, 10, Math.PI / 8, .01, 0.5);
spotLight.position.set(0, 6, 5);
spotLight.castShadow = true;

const directionalLight = new THREE.DirectionalLight("white", 7);
directionalLight.position.set(0, 3, 5);
directionalLight.castShadow = true;

const spotLightHelper = new THREE.SpotLightHelper(spotLight);
const lightHelper = new THREE.DirectionalLightHelper(directionalLight);

scene.add(spotLight, directionalLight);
// scene.add(spotLightHelper, lightHelper);

const pmremGeneretor = new THREE.PMREMGenerator(renderer);
pmremGeneretor.compileEquirectangularShader();

// 3D object
new RGBELoader()
    .load('./bg2.hdr', function (texture) {
        const evpMap = pmremGeneretor.fromEquirectangular(texture).texture;
        // scene.background = evpMap; // with help of the this we set the background
        // scene.environment = evpMap; // with the help of this background can effect the color of the objects
        texture.dispose();
        pmremGeneretor.dispose();

        const loader = new GLTFLoader();
        loader.load('./2022/scene.gltf', function (gltf) {

            const model = gltf.scene;
            model.position.set(0, -.5, 0);
            scene.add(model);
            model.traverse(function (object) {
                if (object.isMesh) object.castShadow = true;
            })

            const planeGeometry = new THREE.CircleGeometry(5, 50);
            const planeMaterial = new THREE.MeshPhysicalMaterial({
                color: "gray",
                metalness: .8,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.receiveShadow = true;
            plane.position.set(0, -.5, 0);
            plane.rotation.x = -Math.PI / 2;
            scene.add(plane);

            function modelRotate() {
                requestAnimationFrame(modelRotate);
                model.rotation.y += -0.001;
                renderer.render(scene, camera);
            }
            modelRotate();

        }, undefined, function (error) {
            console.error(error);
        });

        // const gridHelper = new THREE.GridHelper(30, 30,);
        // gridHelper.position.set(0, -.5, 0);
        // scene.add(gridHelper);
    });

// OrbiitControls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.04;
orbitControls.autoRotateSpeed = 1;
orbitControls.autoRotate = false;
orbitControls.enableZoom = false;

// animation
function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}
animate();
