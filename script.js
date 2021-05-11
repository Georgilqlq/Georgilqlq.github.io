

const visibleHeightAtZDepth = (depth, camera) => {
    // compensate for cameras not positioned at z=0
    const cameraOffset = camera.position.z;
    if (depth < cameraOffset) depth -= cameraOffset;
    else depth += cameraOffset;

    // vertical fov in radians
    const vFOV = camera.fov * Math.PI / 180;

    // Math.abs to ensure the result is always positive
    return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
};

const visibleWidthAtZDepth = (depth, camera) => {
    const height = visibleHeightAtZDepth(depth, camera);
    return height * camera.aspect;
};

const hexToRgbThreeJs = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        }
        : null;
};

var boxes;

function createBoxes() {
    boxes = new Array(16);
    for (var i = 0; i < 15; i++) {
        boxes[i] = [];
        for (var j = 0; j < 25; j++) {

            var geometry = new THREE.BoxGeometry(box_size_width, box_size_height, 1);
            var material = new THREE.MeshStandardMaterial({ color: 'green' });
            var box = new THREE.Mesh(geometry, material);
            box.castShadow = true;
            box.receiveShadow = true;

            var geo = new THREE.EdgesGeometry(box.geometry);
            var mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
            var wireframe = new THREE.LineSegments(geo, mat);
            wireframe.renderOrder = 1;
            box.add(wireframe);

            box.position.set(i * box_size_width - visibleWidthAtZDepth(0, camera) / 2 + box_size_width / 2, j * box_size_height - visibleHeightAtZDepth(0, camera) / 2 + box_size_height / 2, 0);
            boxes[i][j] = box;
            scene.add(boxes[i][j]);
        }
    }

}
var interaction, geo_pointer, mat_pointer, pointer;
const mesh_params = {
    color: "#ff0000",
    metalness: 0.41,
    emissive: "#000000",
    roughness: 0
};
function createInteraction() {
    interaction = new THREE.Interaction(renderer, scene, camera);

    geo_pointer = new THREE.CylinderGeometry(0.1, box_size_width / 2, 6, 50);
    mat_pointer = new THREE.MeshStandardMaterial(mesh_params);
    pointer = new THREE.Mesh(geo_pointer, mat_pointer);

    pointer.rotation.set(-Math.PI / 2, 0, 0);
    pointer.position.set(boxes[7][12].position.x, boxes[7][12].position.y, 7);
    pointer.cursor = 'pointer';
    pointer.name = 'pointer';
    pointer.castShadow = true;
    scene.add(pointer);


    pointer.on('click', function (ev) {
        for (var i = 0; i < 15; i++) {
            for (var j = 0; j < 25; j++) {
                if (boxes[i][j].position.x == pointer.position.x
                    && boxes[i][j].position.y == pointer.position.y) {
                    boxes[i][j].material.color.setRGB(mat_pointer.color.r, mat_pointer.color.g, mat_pointer.color.b);
                }
            }
        }
    });
    pointer.on('pointerup', function (ev) {
        for (var i = 0; i < 15; i++) {
            for (var j = 0; j < 25; j++) {
                if (boxes[i][j].position.x + box_size_width / 2 >= pointer.position.x
                    && boxes[i][j].position.x - box_size_width / 2 <= pointer.position.x
                    && boxes[i][j].position.y + box_size_height / 2 >= pointer.position.y
                    && boxes[i][j].position.y - box_size_height / 2 <= pointer.position.y) {
                    boxes[i][j].material.color.setRGB(mat_pointer.color.r, mat_pointer.color.g, mat_pointer.color.b);
                }
            }
        }
    });
}

var control;
function createOrbitControls() {
    control = new THREE.OrbitControls(camera, renderer.domElement);
    control.minDistance = 5;
    control.maxDistance = 500;
    control.minPolarAngle = 0;
    control.maxPolarAngle = 2;
    control.rotateSpeed = 0.3;
    control.enableDamping = true;
    control.dampingFactor = 0.1;
    control.enablePan = true;
}

var renderer, scene, camera, light, stats, clock, t, dT, animate, perspective = true;

function Init() {
    if (!THREE.WEBGL.isWebGLAvailable())
        alert(THREE.WEBGL.getWebGLErrorMessage());

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    document.body.style.margin = 0;
    document.body.style.overflow = 'hidden';

    if (typeof Stats !== 'undefined') {
        stats = new Stats();
        document.body.appendChild(stats.dom);
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color('yellow');

    clock = new THREE.Clock(true);

    camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
    camera.position.set(0, 0, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));


    // light = new THREE.PointLight();
    light = new THREE.AmbientLight('white', 1);
    light.position.set(0, 150, 300);
    scene.add(light);

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    renderer.setAnimationLoop(frame);
}



function onWindowResize(event) {
    if (perspective) camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight, true);


}



function frame() {
    dT = clock.getDelta();
    t = clock.getElapsedTime();

    if (animate) animate();

    if (stats) stats.update();

    renderer.render(scene, camera);
}






