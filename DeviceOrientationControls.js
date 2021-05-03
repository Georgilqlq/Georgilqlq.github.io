/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */
// import * as THREE from 'three';

function calcAngle(angle, offset = 0) {
    if (!!angle) {
        return THREE.Math.degToRad(angle) + offset;
    } else {
        return 0;
    }
}

export default class OrientationControls {
    constructor(camera) {
        this.object = camera;
        this.object.rotation.reorder("YXZ");

        this.enabled = false;

        this.deviceOrientation = {};
        this.screenOrientation = 0;

        this.alpha = 0;

        // Initial state is just identity rotations.
        this.lockedRot = new THREE.Quaternion(0, 0, 0, 1);
        this.unlockedRot = new THREE.Quaternion(0, 0, 0, 1);
        this.deviceToPercieved = new THREE.Quaternion(0, 0, 0, 1);

        this._info = {
            zee: new THREE.Vector3(0, 0, 1),
            euler: new THREE.Euler(),
            q0: new THREE.Quaternion(),
            q1: new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), // - PI/2 around the x-axis
        }

    }

    onScreenOrientationChangeEvent(orientation) {
        this.screenOrientation = orientation || 0;
    }

    onDeviceOrientationChangeEvent(event) {
        this.deviceOrientation = event;
    }

    getAngles() {
        let { alpha, beta, gamma } = this.deviceOrientation;
        alpha = calcAngle(alpha, this.alphaOffsetAngle); // Z
        beta = calcAngle(beta)                          // X'
        gamma = calcAngle(gamma)                         // Y''
        var orient = calcAngle(this.screenOrientation)

        return [alpha, beta, gamma, orient];
    }

    // Mutates the camera's quaternion
    setQuaternion(alpha, beta, gamma, orient, quaternion) {
        let { zee, euler, q0, q1 } = this._info;

        euler.set(beta, alpha, -gamma, 'YXZ'); // 'ZXY' for the device, but 'YXZ' for us

        // orient the device
        quaternion.setFromEuler(euler);

        // camera looks out the back of the device, not the top
        quaternion.multiply(q1);

        // adjust for screen orientation
        quaternion.multiply(q0.setFromAxisAngle(zee, -orient));

        return quaternion.normalize();
    };

    updateQuaternion(quaternion) {
        let [alpha, beta, gamma, orient] = this.getAngles();

        this.setQuaternion(alpha, beta, gamma, orient, quaternion);
    }

    // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z - X' - Y''
    update() {
        if (!this.enabled) return;

        let deviceOreintation = new THREE.Quaternion()
        this.updateQuaternion(deviceOreintation);

        // Multiply by the "relative" quaternion, to prevent 'jumps' when unlocking.
        this.object.quaternion.multiplyQuaternions(this.deviceToPercieved, deviceOreintation).normalize();
    };

    updateAlphaOffsetAngle(angle) {
        this.alphaOffsetAngle = angle;
        this.update();
    };

    connect() {
        this.enabled = true;
        this.onScreenOrientationChangeEvent();
    }

    disconnect() {
        this.enabled = false;
        this.lockedRot = this.object.quaternion.clone().normalize(); // Current "percieved" orientation;
    }

    reconnect() {
        this.updateQuaternion(this.unlockedRot); // Get the device orientation on unlock
        // Find the new transformation that will move us from the current, actual device orientation to the one they saw when they locked it.
        this.deviceToPercieved.multiplyQuaternions(this.unlockedRot.clone().conjugate(), this.lockedRot).normalize();

        this.connect();
    }
}