const visibleHeightAtZDepth = (depth, camera) => {
    const cameraOffset = camera.position.z;
    if (depth < cameraOffset) depth -= cameraOffset;
    else depth += cameraOffset;

    const vFOV = camera.fov * Math.PI / 180;

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
const background_color = {
    color: "#ffff00",
};
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

    scene.background = new THREE.Color(background_color.color);

    clock = new THREE.Clock(true);

    camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
    camera.position.set(0, 0, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

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

function createGUI() {
    var gui = new dat.GUI();
    const color_gui = gui.addFolder("Pointer");
    color_gui.addColor(mesh_params, "color").onChange((color) => {
        mat_pointer.color = hexToRgbThreeJs(color);
    });
    color_gui.add(mesh_params, 'metalness', 0.1, 1).onChange((val) => {
        mat_pointer.metalness = val;
    });
    color_gui.add(mesh_params, 'roughness', 0.1, 1).onChange((val) => {
        mat_pointer.roughness = val;
    });

    const background_gui = gui.addFolder("Background");
    background_gui.addColor(background_color, "color").onChange((color) => {
        scene.background = new THREE.Color(color);
    })
}

function createShadowLight() {
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1, 100);
    directionalLight.castShadow = true;
    directionalLight.position.set(0, box_size_height * 2, 30);
    directionalLight.shadow.camera.left = -visible_width / 2;
    directionalLight.shadow.camera.right = visible_height / 2;
    directionalLight.shadow.camera.top = visible_height / 2;
    directionalLight.shadow.camera.bottom = -visible_height / 2;

    scene.add(directionalLight);
}


window.addEventListener("deviceorientation", handleOrientation, true);
function handleOrientation(event) {
    var beta = event.beta;
    var gamma = event.gamma;

    const width_max = visible_width / 2 - box_size_width / 2;
    const height_max = visible_height / 2 - box_size_height / 2;
    const width_min = -visible_width / 2 + box_size_width / 2;
    const height_min = - visible_height / 2 + box_size_height / 2;

    pointer.position.x += event.gamma / 30;
    pointer.position.y -= event.beta / 30;

    if (pointer.position.x > width_max) {
        pointer.position.x = width_max;
    }

    if (pointer.position.y > height_max) {
        pointer.position.y = height_max;
    }


    if (pointer.position.x < width_min) {
        pointer.position.x = width_min;
    }

    if (pointer.position.y < height_min) {
        pointer.position.y = height_min;
    }
}

function animate() {
    pointer.position.z = 7 + 2 * Math.sin(t * 2);
    control.update();

}





