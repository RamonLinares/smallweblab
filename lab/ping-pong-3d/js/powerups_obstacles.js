const { CylinderGeometry, TextGeometry, FontLoader, MeshBasicMaterial } = THREE;

function getPowerUpLabel(type) {
    switch (type) {
        case 'speed':
            return 'SPEED';
        case 'extend':
            return 'EXTEND';
        case 'slow':
            return 'SLOW';
        case 'doublePoints':
            return 'DOUBLE';
        case 'shield':
            return 'SHIELD';
        default:
            return 'ITEM';
    }
}

function getObstacleLabel(type) {
    switch (type) {
        case 'barrier':
            return 'BARRIER';
        case 'paddle':
            return 'BLOCK';
        case 'wall':
            return 'WALL';
        case 'bouncePad':
            return 'BOUNCE PAD';
        case 'shrinkZone':
            return 'SHRINK ZONE';
        default:
            return 'TRAP';
    }
}

class PowerUp {
    constructor(type, position, game) {
        this.type = type;
        this.position = position;
        this.game = game;
        this.mesh = this.createMesh();
        this.textMesh = null;
        this.addLabel();
        this.animateAppearance();
    }

    createMesh() {
        let geometry, material;
        switch (this.type) {
            case 'speed':
                geometry = new SphereGeometry(0.3, 16, 16);
                material = new MeshStandardMaterial({ color: 0xffa500 }); // Orange
                break;
            case 'extend':
                geometry = new SphereGeometry(0.3, 16, 16);
                material = new MeshStandardMaterial({ color: 0x00ff00 }); // Green
                break;
            case 'slow':
                geometry = new SphereGeometry(0.3, 16, 16);
                material = new MeshStandardMaterial({ color: 0x0000ff }); // Blue
                break;
            case 'doublePoints':
                geometry = new SphereGeometry(0.3, 16, 16);
                material = new MeshStandardMaterial({ color: 0xffff00 }); // Yellow
                break;
            case 'shield':
                geometry = new SphereGeometry(0.3, 16, 16);
                material = new MeshStandardMaterial({ color: 0xff00ff }); // Magenta
                break;
            default:
                geometry = new SphereGeometry(0.3, 16, 16);
                material = new MeshStandardMaterial({ color: 0xffffff }); // White
        }
        const mesh = new Mesh(geometry, material);
        mesh.position.copy(this.position);
        mesh.castShadow = true; // Enable casting shadows
        return mesh;
    }

    addLabel() {
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            const textGeometry = new TextGeometry(getPowerUpLabel(this.type), {
                font: font,
                size: 0.16,
                height: 0.04,
            });
            textGeometry.computeBoundingBox();
            const bbox = textGeometry.boundingBox;
            const textMaterial = new MeshBasicMaterial({ color: this.mesh.material.color.getHex() });
            const textMesh = new Mesh(textGeometry, textMaterial);
            textMesh.position.set(
                this.position.x - (bbox.max.x - bbox.min.x) / 2,
                this.position.y + 0.45,
                this.position.z
            );
            this.game.scene.add(textMesh);
            this.textMesh = textMesh;
        });
    }

    removeLabel() {
        if (this.textMesh) {
            this.game.scene.remove(this.textMesh);
        }
        return;
    }

    animateAppearance() {
        this.mesh.scale.set(0, 0, 0);
        new TWEEN.Tween(this.mesh.scale)
            .to({ x: 1, y: 1, z: 1 }, 1000)
            .easing(TWEEN.Easing.Elastic.Out)
            .start();
    }
}

class Obstacle {
    constructor(type, position, game) {
        this.type = type;
        this.position = position;
        this.game = game;
        this.mesh = this.createMesh();
        this.textMesh = null;
        this.addLabel();
        this.animateAppearance();
    }

    createMesh() {
        let geometry, material;
        switch (this.type) {
            case 'barrier':
                geometry = new BoxGeometry(0.1, 1, 1);
                material = new MeshStandardMaterial({ color: 0x808080, transparent: true, opacity: 0.5 }); // Grey
                break;
            case 'paddle':
                geometry = new BoxGeometry(0.2, 0.2, 1);
                material = new MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 }); // Red
                break;
            case 'wall':
                geometry = new BoxGeometry(1, 1, 0.1);
                material = new MeshStandardMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 }); // Blue
                break;
            case 'bouncePad':
                geometry = new CylinderGeometry(0.5, 0.5, 0.1, 16);
                material = new MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 }); // Green
                break;
            case 'shrinkZone':
                geometry = new PlaneGeometry(1, 1);
                material = new MeshStandardMaterial({ color: 0xff00ff, transparent: true, opacity: 0.3 }); // Magenta
                break;
            default:
                geometry = new BoxGeometry(0.5, 0.5, 0.5);
                material = new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }); // White
        }
        const mesh = new Mesh(geometry, material);
        mesh.position.copy(this.position);
        mesh.castShadow = true; // Enable casting shadows
        return mesh;
    }

    addLabel() {
        const loader = new FontLoader();
        loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            const textGeometry = new TextGeometry(getObstacleLabel(this.type), {
                font: font,
                size: 0.14,
                height: 0.04,
            });
            textGeometry.computeBoundingBox();
            const bbox = textGeometry.boundingBox;
            const textMaterial = new MeshBasicMaterial({ color: this.mesh.material.color.getHex() });
            const textMesh = new Mesh(textGeometry, textMaterial);
            textMesh.position.set(
                this.position.x - (bbox.max.x - bbox.min.x) / 2,
                this.position.y + 0.56,
                this.position.z
            );
            this.game.scene.add(textMesh);
            this.textMesh = textMesh;
        });
    }

    removeLabel() {
        if (this.textMesh) {
            this.game.scene.remove(this.textMesh);
        }
        return;
    }

    animateAppearance() {
        this.mesh.scale.set(0, 0, 0);
        new TWEEN.Tween(this.mesh.scale)
            .to({ x: 1, y: 1, z: 1 }, 1000)
            .easing(TWEEN.Easing.Elastic.Out)
            .start();
    }
}
