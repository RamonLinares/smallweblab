const { Group } = THREE;

class Paddle {
    constructor(color) {
        this.group = new Group();
        const bladeGeometry = new CylinderGeometry(0.5, 0.5, 0.05, 32); // Smaller blade
        const bladeMaterial = new MeshStandardMaterial({ color: color });
        const blade = new Mesh(bladeGeometry, bladeMaterial);
        blade.rotation.x = Math.PI / 2;
        blade.position.y = 0.0; // Set blade height to 0 to match the paddle's position
        blade.castShadow = true;
        blade.receiveShadow = true;
        this.group.add(blade);
        const handleGeometry = new BoxGeometry(0.2, 0.7, 0.2);
        const handleMaterial = new MeshStandardMaterial({ color: 0x8B4513 });
        const handle = new Mesh(handleGeometry, handleMaterial);
        handle.position.set(0.35, -0.35, 0); // Position handle to connect at a 45 degree angle
        handle.rotation.z = Math.PI / 4; // Rotate handle by 45 degrees
        handle.castShadow = true;
        handle.receiveShadow = true;
        this.group.add(handle);
    }
}

class Ball {
    constructor() {
        const ballGeometry = new SphereGeometry(0.2, 32, 32);
        const ballMaterial = new MeshStandardMaterial({ color: 0xffff00 });
        this.mesh = new Mesh(ballGeometry, ballMaterial);
        this.mesh.position.set(0, 0.4, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }
}
