const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, PointLight, SpotLight, Vector2, Vector3, Clock, BufferGeometry, LineBasicMaterial, Line, ShadowMaterial, AudioListener, Audio, AudioLoader, PlaneGeometry, MeshStandardMaterial, Mesh, BoxGeometry, SphereGeometry } = THREE;

const BALL_INITIAL_VELOCITY = new Vector3(1, 6.0, 3.0); // Initial velocity towards the player with an angle
const GRAVITY = new Vector3(0, -9.8, 0); // Realistic gravity
const PADDLE_MOVE_SPEED = 0.1; // Reduced paddle move speed for better control
const WALL_BOUNDARY = 2.5;
const TABLE_BOUNDARY = 5;
const TABLE_HEIGHT = 0.2;
const NET_HEIGHT = 0.5; // Increased net height
const MIN_BOUNCE_VELOCITY = 1.5; // Minimum velocity for the bounce
const VELOCITY_INCREMENT_MIN = 1.1; // Minimum velocity increment
const VELOCITY_INCREMENT_MAX = 1.3; // Maximum velocity increment
const HEIGHT_INCREMENT_MIN = 1.0; // Minimum height increment
const HEIGHT_INCREMENT_MAX = 1.5; // Maximum height increment
const MAX_HEIGHT_VELOCITY = 5; // Maximum height velocity
const ANGLE_ADJUSTMENT_FACTOR = 2; // Adjusted factor for better gameplay
const MAX_BALL_SPEED = 15; // Maximum speed for the ball
const NORMAL_RETURN_SPEED_MIN = 6.2;
const NORMAL_RETURN_SPEED_MAX = 8.6;
const SMASH_RETURN_SPEED_MIN = 9.8;
const SMASH_RETURN_SPEED_MAX = 11.2;
const TABLE_BOUNCE_FORWARD_DECAY = 0.94;
const MAX_BALL_HEIGHT = 4; // Maximum height for the ball
const BALL_SPIN_CURVE_FACTOR = 0.95;
const BALL_TOPSPIN_DIP_FACTOR = 1.05;
const BALL_SPIN_DECAY_PER_FRAME = 0.985;
const BALL_BOUNCE_SPIN_TRANSFER = 0.16;
const PADDLE_VELOCITY_CLAMP = 18;

// Paddle boundaries
const PADDLE_BOUNDARY_Z_MIN = 2; // Player paddle cannot move closer than 2 units from the net
const PADDLE_BOUNDARY_Z_MAX = TABLE_BOUNDARY + 2.75; // Allow the paddle to move noticeably below the table edge for touch play
const COMPUTER_PADDLE_BOUNDARY_Z_MIN = -TABLE_BOUNDARY - 2.25; // Mirror the extra recovery space on the CPU side
const COMPUTER_PADDLE_BOUNDARY_Z_MAX = -4; // Computer paddle should stay further back from the net
const BALL_RADIUS = 0.2;
const PADDLE_HALF_DEPTH = 0.3;
const PLAYER_PADDLE_START_Z = 6.8;
const COMPUTER_PADDLE_START_Z = -6.2;
const SOUND_PREFERENCE_STORAGE_KEY = 'ping-pong-3d-sfx-enabled';
const DIFFICULTY_PREFERENCE_STORAGE_KEY = 'ping-pong-3d-difficulty';
const CAMERA_ZOOM_PREFERENCE_STORAGE_KEY = 'ping-pong-3d-camera-zoom';
const CAMERA_PERSPECTIVE_PREFERENCE_STORAGE_KEY = 'ping-pong-3d-camera-perspective';

const DIFFICULTY_SETTINGS = {
    easy: {
        label: 'Easy',
        trackLerpX: 0.068,
        trackLerpZ: 0.06,
        readyLerpX: 0.045,
        readyLerpZ: 0.04,
        anticipation: 0.58,
        maxErrorX: 0.65,
        maxErrorZ: 0.34,
        errorRefreshMs: 780,
        readyXBias: 0.18,
        readyZ: -4.8
    },
    normal: {
        label: 'Normal',
        trackLerpX: 0.1,
        trackLerpZ: 0.085,
        readyLerpX: 0.065,
        readyLerpZ: 0.055,
        anticipation: 0.82,
        maxErrorX: 0.28,
        maxErrorZ: 0.16,
        errorRefreshMs: 520,
        readyXBias: 0.3,
        readyZ: -5.15
    },
    hard: {
        label: 'Hard',
        trackLerpX: 0.14,
        trackLerpZ: 0.12,
        readyLerpX: 0.095,
        readyLerpZ: 0.08,
        anticipation: 1.05,
        maxErrorX: 0.08,
        maxErrorZ: 0.06,
        errorRefreshMs: 320,
        readyXBias: 0.48,
        readyZ: -5.5
    }
};

const CAMERA_ZOOM_SETTINGS = {
    tight: { label: 'Tight', positionY: -0.4, positionZ: -0.8, lookAtY: 0.06, lookAtZ: -0.16, fov: -3 },
    default: { label: 'Default', positionY: 0, positionZ: 0, lookAtY: 0, lookAtZ: 0, fov: 0 },
    wide: { label: 'Wide', positionY: 0.65, positionZ: 1.25, lookAtY: -0.04, lookAtZ: 0.16, fov: 4 }
};

const CAMERA_PERSPECTIVE_SETTINGS = {
    thirdPerson: { label: 'Third-Person' },
    topDown: { label: 'Top-Down' },
    pov: { label: 'POV' },
    isometric: { label: 'Isometric' }
};

class PingPongGame {
    constructor() {
        this.clock = new Clock();
        this.isGameStarted = false; // Flag to control game start
        this.powerUps = [];
        this.obstacles = [];
        this.isAnimating = true; // Start the animation initially
        this.isPaused = false; // Flag to control pause state
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.activeTouchId = null;
        this.soundEnabled = this.loadSoundPreference();
        this.difficulty = this.loadDifficultyPreference();
        this.cameraZoom = this.loadCameraZoomPreference();
        this.cameraPerspective = this.loadCameraPerspectivePreference();
        this.isPointAnnouncementActive = false;
        this.computerAimOffset = new Vector2(0, 0);
        this.nextComputerAimRefresh = 0;

        this.init();
        window.addEventListener('resize', () => this.onWindowResize());
        document.getElementById('startButton').addEventListener('click', () => this.startGame()); // Add click event for 'Start' button
        document.getElementById('restartButton').addEventListener('click', () => this.startGame()); // Add click event for 'Restart' button
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause()); // Add click event for 'Pause' button
        document.getElementById('soundButton').addEventListener('click', () => this.toggleSound());
        document.getElementById('pointAnnouncement').addEventListener('click', () => this.resumeAfterPointAnnouncement());
        document.getElementById('resumeButton').addEventListener('click', () => this.togglePause(false));
        document.getElementById('restartMatchButton').addEventListener('click', () => this.restartMatchFromPause());
        document.querySelectorAll('[data-setting="difficulty"]').forEach((button) => {
            button.addEventListener('click', () => this.setDifficulty(button.dataset.value));
        });
        document.querySelectorAll('[data-setting="cameraZoom"]').forEach((button) => {
            button.addEventListener('click', () => this.setCameraZoom(button.dataset.value));
        });
        document.querySelectorAll('[data-setting="cameraPerspective"]').forEach((button) => {
            button.addEventListener('click', () => this.setCameraPerspective(button.dataset.value));
        });
        document.querySelectorAll('[data-setting="sound"]').forEach((button) => {
            button.addEventListener('click', () => this.setSoundEnabled(button.dataset.value === 'on'));
        });
        
        this.animate();
    }

    togglePause(forceState = null) {
        if (!this.isGameStarted || this.isPointAnnouncementActive || this.isOverlayVisible(this.gameOverScreen) || this.isOverlayVisible(this.startScreen)) {
            return;
        }

        const shouldPause = forceState === null ? !this.isPaused : forceState;
        this.isPaused = shouldPause;
        this.setPauseButtonLabel();

        if (this.isPaused) {
            this.showPauseScreen();
        } else {
            this.hidePauseScreen();
            this.syncSimulationClock();
        }
    }

    toggleSound() {
        this.setSoundEnabled(!this.soundEnabled);
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        this.saveSoundPreference();
        this.setSoundButtonState();
        this.syncSettingsPanel();

        if (!this.soundEnabled && this.hitSound && this.hitSound.isPlaying) {
            this.hitSound.stop();
        }
    }

    loadSoundPreference() {
        try {
            const storedValue = window.localStorage.getItem(SOUND_PREFERENCE_STORAGE_KEY);
            return storedValue === null ? true : storedValue === 'true';
        } catch (error) {
            return true;
        }
    }

    saveSoundPreference() {
        try {
            window.localStorage.setItem(SOUND_PREFERENCE_STORAGE_KEY, String(this.soundEnabled));
        } catch (error) {
            // Ignore storage failures and keep the in-memory preference.
        }
    }

    loadDifficultyPreference() {
        try {
            const storedValue = window.localStorage.getItem(DIFFICULTY_PREFERENCE_STORAGE_KEY);
            return DIFFICULTY_SETTINGS[storedValue] ? storedValue : 'normal';
        } catch (error) {
            return 'normal';
        }
    }

    saveDifficultyPreference() {
        try {
            window.localStorage.setItem(DIFFICULTY_PREFERENCE_STORAGE_KEY, this.difficulty);
        } catch (error) {
            // Ignore storage failures and keep the in-memory preference.
        }
    }

    loadCameraZoomPreference() {
        try {
            const storedValue = window.localStorage.getItem(CAMERA_ZOOM_PREFERENCE_STORAGE_KEY);
            return CAMERA_ZOOM_SETTINGS[storedValue] ? storedValue : 'default';
        } catch (error) {
            return 'default';
        }
    }

    saveCameraZoomPreference() {
        try {
            window.localStorage.setItem(CAMERA_ZOOM_PREFERENCE_STORAGE_KEY, this.cameraZoom);
        } catch (error) {
            // Ignore storage failures and keep the in-memory preference.
        }
    }

    loadCameraPerspectivePreference() {
        try {
            const storedValue = window.localStorage.getItem(CAMERA_PERSPECTIVE_PREFERENCE_STORAGE_KEY);
            return CAMERA_PERSPECTIVE_SETTINGS[storedValue] ? storedValue : 'thirdPerson';
        } catch (error) {
            return 'thirdPerson';
        }
    }

    saveCameraPerspectivePreference() {
        try {
            window.localStorage.setItem(CAMERA_PERSPECTIVE_PREFERENCE_STORAGE_KEY, this.cameraPerspective);
        } catch (error) {
            // Ignore storage failures and keep the in-memory preference.
        }
    }

    startGame() {
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        console.log(`startScreen: ${startScreen}, gameOverScreen: ${gameOverScreen}`);

        // Resume AudioContext after user gesture
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        if (this.isOverlayVisible(startScreen) || this.isOverlayVisible(gameOverScreen)) {
            this.isGameStarted = true; // Set game as started
            this.isPaused = false;
            this.hidePointAnnouncement();
            this.hidePauseScreen();
            this.hideStartScreen();
            this.hideGameOverScreen();
            this.resetGame();
            this.isAnimating = false;
            this.refreshGameplayCamera(true);
            this.syncSimulationClock();
            this.setPauseButtonLabel();
            this.spawnPowerUp(); // Start spawning power-ups
            this.spawnObstacle(); // Start spawning obstacles
            console.log("Game started");
        }
    }

    onKeyDown(event) {
        if (this.isPointAnnouncementActive && (event.code === 'Enter' || event.code === 'Space')) {
            event.preventDefault();
            this.resumeAfterPointAnnouncement();
            return;
        }

        if (event.code === 'Escape' && this.isPaused) {
            event.preventDefault();
            this.togglePause(false);
            return;
        }

        this.keys[event.code] = true;

        if (event.code === 'Enter') {
            this.startGame(); // Call startGame when 'Enter' is pressed
        }
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
    }

    onTouchStart(event) {
        const touch = event.changedTouches[0];

        if (!touch) {
            return;
        }

        if (event.cancelable) {
            event.preventDefault();
        }

        this.activeTouchId = touch.identifier;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.setPaddlePositionFromPointer(touch.clientX, touch.clientY);
    }

    getActiveTouch(event) {
        if (this.activeTouchId === null) {
            return null;
        }

        return Array.from(event.touches).find((touch) => touch.identifier === this.activeTouchId) || null;
    }

    onTouchMove(event) {
        const touch = this.getActiveTouch(event);

        if (!touch) {
            return;
        }

        if (event.cancelable) {
            event.preventDefault();
        }

        this.setPaddlePositionFromPointer(touch.clientX, touch.clientY);
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }
    
    
    onTouchEnd(event) {
        const activeTouchEnded = Array.from(event.changedTouches).some((touch) => touch.identifier === this.activeTouchId);

        if (!activeTouchEnded) {
            return;
        }

        if (event.cancelable) {
            event.preventDefault();
        }

        this.activeTouchId = null;
        this.touchStartX = null;
        this.touchStartY = null;
    }

    init() {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.normalCameraPosition = new Vector3(0, 8, 11);
        this.normalCameraLookAt = new Vector3(0, 0.5, 0);
        this.cameraLookTarget = new Vector3(0, 0.5, 0);
        this.refreshGameplayCamera(true);
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true; // Enable shadow maps
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
        this.renderer.domElement.style.touchAction = 'none';
        document.body.appendChild(this.renderer.domElement);

        this.initLighting();
        this.initTable();
        this.initNet();
        this.initBoundaries();
        this.initEnvironment();

        const playerPaddle = new Paddle(0xff0000);
        this.paddle = playerPaddle.group;
        this.paddle.position.set(0, 0.4, PLAYER_PADDLE_START_Z);
        this.paddle.castShadow = true; // Ensure the paddle casts shadow
        this.playerPaddleSolidMeshes = [];
        this.paddle.traverse((child) => {
            if (child.isMesh) {
                this.playerPaddleSolidMeshes.push(child);
            }
        });
        this.playerPaddleGuide = this.createPlayerPaddleGuide(this.paddle);
        this.paddle.add(this.playerPaddleGuide);
        this.scene.add(this.paddle);

        const computerPaddle = new Paddle(0x0000ff);
        this.computerPaddle = computerPaddle.group;
        this.computerPaddle.position.set(0, 0.4, COMPUTER_PADDLE_START_Z);
        this.computerPaddle.castShadow = true; // Ensure the paddle casts shadow
        this.scene.add(this.computerPaddle);

        const ball = new Ball();
        this.ball = ball.mesh;
        this.ball.castShadow = true; // Ensure the ball casts shadow
        this.scene.add(this.ball);

        this.score = 0;
        this.computerScore = 0;
        this.pointer = new Vector2();
        this.raycaster = new THREE.Raycaster();
        this.dragPlane = new THREE.Plane(new Vector3(0, 1, 0), -0.4);
        this.dragIntersection = new Vector3();

        this.initTrail();
        this.initControls();
        this.initScoreboard();
        this.loadSounds();
        this.showStartScreen();

        this.ballVelocity = BALL_INITIAL_VELOCITY.clone(); // Initialize ball velocity
        this.ballSpin = new Vector2(0, 0);
        this.previousBallPosition = this.ball.position.clone();
        this.lastBounceTime = this.clock.getElapsedTime();
        this.playerPaddleBounceTime = -Infinity; // Initialize with a very old time
        this.computerPaddleBounceTime = -Infinity; // Initialize with a very old time
        this.playerPaddleVelocity = new Vector3();
        this.computerPaddleVelocity = new Vector3();
        this.previousPlayerPaddlePosition = this.paddle.position.clone();
        this.previousComputerPaddlePosition = this.computerPaddle.position.clone();
        this.ballOnPlayerSide = true;
        this.isDragging = false;
        this.tableCenter = new Vector3(0, 0, 0); // Ensure tableCenter is defined as a Vector3
        this.cameraDistance = 10; // Adjust camera distance for initial view
        this.cameraAngleX = 0;
        this.cameraAngleY = Math.PI / 3; // More realistic perspective

        this.isAnimating = true; // Start the animation initially

        this.spawnPowerUp();
        this.spawnObstacle();
    }

    initLighting() {
        this.scene.add(new AmbientLight(0x404040, 1.5)); // Stronger ambient light

        const pointLight = new PointLight(0xffffff, 1, 100);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        const spotLight = new SpotLight(0xffffff);
        spotLight.position.set(5, 10, 7.5);
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        spotLight.shadow.camera.near = 0.5;
        spotLight.shadow.camera.far = 50;
        this.scene.add(spotLight);
    }

    initTrail() {
        const trailLength = 42;
        const trailMaterial = new LineBasicMaterial({ color: 0xffef99, transparent: true, opacity: 0.38 });
        const trailGeometry = new BufferGeometry();
        const positions = new Float32Array(trailLength * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trail = new Line(trailGeometry, trailMaterial);
        this.trailPositions = positions;
        this.trailLength = trailLength;
        this.trailIndex = 0;
        this.scene.add(this.trail);
    }

    updateTrail() {
        this.trailPositions.copyWithin(3, 0, (this.trailLength - 1) * 3);
        this.trailPositions.set([this.ball.position.x, this.ball.position.y, this.ball.position.z], 0);
        this.trail.geometry.attributes.position.needsUpdate = true;
    }

    showStartScreen() {
        document.getElementById('startScreen').style.display = 'flex';
        this.startAnimation();
    }

    hideStartScreen() {
        document.getElementById('startScreen').style.display = 'none';
    }

    showPauseScreen() {
        this.pauseScreen.style.display = 'flex';
        this.syncSettingsPanel();
    }

    hidePauseScreen() {
        this.pauseScreen.style.display = 'none';
    }

    showGameOverScreen() {
        document.getElementById('finalScore').innerText = `${this.score} : ${this.computerScore}`;
        this.finalOutcome.innerText = this.score > this.computerScore
            ? 'You took the match. Queue another round and keep the pressure on.'
            : 'The CPU closed it out. Reset the table and answer back.';
        document.getElementById('gameOverScreen').style.display = 'flex';
        this.setPauseButtonLabel();
        this.startAnimation();
        this.stopSpawning(); // Stop spawning power-ups and obstacles
    }

    hideGameOverScreen() {
        document.getElementById('gameOverScreen').style.display = 'none';
    }

    restartMatchFromPause() {
        this.isPaused = false;
        this.hidePauseScreen();
        this.hidePointAnnouncement();
        this.isGameStarted = true;
        this.resetGame();
        this.isAnimating = false;
        this.refreshGameplayCamera(true);
        this.syncSimulationClock();
        this.setPauseButtonLabel();
    }

    resetPaddles() {
        this.paddle.position.set(0, 0.4, PLAYER_PADDLE_START_Z);
        this.computerPaddle.position.set(0, 0.4, COMPUTER_PADDLE_START_Z);
        this.playerPaddleVelocity.set(0, 0, 0);
        this.computerPaddleVelocity.set(0, 0, 0);
        this.previousPlayerPaddlePosition.copy(this.paddle.position);
        this.previousComputerPaddlePosition.copy(this.computerPaddle.position);
    }

    stopSpawning() {
        this.isGameStarted = false; // Reset game start flag
        console.log("Spawning stopped");
    }

    isOverlayVisible(element) {
        return window.getComputedStyle(element).display !== 'none';
    }

    showPointAnnouncement(side) {
        if (!this.pointAnnouncement) {
            return;
        }

        clearTimeout(this.pointAnnouncementTimeout);

        this.isPointAnnouncementActive = true;
        this.pointAnnouncement.dataset.side = side;
        this.pointAnnouncementTitle.textContent = side === 'player' ? 'You Scored' : 'CPU Scored';
        this.pointAnnouncement.classList.add('is-visible');
        this.pointAnnouncement.setAttribute('aria-hidden', 'false');

        this.pointAnnouncementTimeout = setTimeout(() => {
            this.resumeAfterPointAnnouncement();
        }, 1000);
    }

    hidePointAnnouncement() {
        clearTimeout(this.pointAnnouncementTimeout);
        this.isPointAnnouncementActive = false;

        if (!this.pointAnnouncement) {
            return;
        }

        this.pointAnnouncement.classList.remove('is-visible');
        this.pointAnnouncement.setAttribute('aria-hidden', 'true');
        delete this.pointAnnouncement.dataset.side;
    }

    syncSimulationClock() {
        this.clock.getDelta();
    }

    resumeAfterPointAnnouncement() {
        if (!this.isPointAnnouncementActive) {
            return;
        }

        this.hidePointAnnouncement();
        this.syncSimulationClock();
    }

    isMobileViewport() {
        return window.innerWidth <= 760 || window.matchMedia('(pointer: coarse)').matches;
    }

    refreshGameplayCamera(resetView = false) {
        const zoomConfig = CAMERA_ZOOM_SETTINGS[this.cameraZoom];
        const isMobile = this.isMobileViewport();

        this.camera.up.set(0, 1, 0);

        switch (this.cameraPerspective) {
            case 'topDown':
                this.normalCameraPosition.set(
                    0,
                    (isMobile ? 17.9 : 16.9) + zoomConfig.positionZ * 1.05 + zoomConfig.positionY * 0.5,
                    0.01
                );
                this.normalCameraLookAt.set(0, TABLE_HEIGHT, 0);
                this.camera.fov = (isMobile ? 44 : 40) + zoomConfig.fov * 0.55;
                this.camera.up.set(0, 0, -1);
                break;
            case 'pov': {
                const paddleX = this.paddle ? this.paddle.position.x : 0;
                const paddleBaseY = 0.42;
                const paddleZ = this.paddle ? this.paddle.position.z : PLAYER_PADDLE_START_Z;
                const ballX = this.ball ? this.ball.position.x : 0;
                const ballY = this.ball ? this.ball.position.y : 0.5;
                const ballZ = this.ball ? this.ball.position.z : 0;
                const forwardLookZ = Math.min(paddleZ - 5.6, paddleZ + (ballZ - paddleZ) * 0.68);
                let povZoomY = -0.1;
                let povZoomZ = -0.22;
                let povZoomFov = -2.25;

                if (this.cameraZoom === 'tight') {
                    povZoomY = -0.28;
                    povZoomZ = -0.52;
                    povZoomFov = -5.2;
                } else if (this.cameraZoom === 'wide') {
                    povZoomY = 0;
                    povZoomZ = 0;
                    povZoomFov = 0;
                }

                this.normalCameraPosition.set(
                    paddleX,
                    paddleBaseY + (isMobile ? 1.62 : 1.78) + povZoomY,
                    paddleZ + (isMobile ? 3.15 : 3.35) + povZoomZ
                );
                this.normalCameraLookAt.set(
                    paddleX + (ballX - paddleX) * 0.46,
                    Math.max(0.98, paddleBaseY + (ballY - paddleBaseY) * 0.5),
                    forwardLookZ
                );
                this.camera.fov = (isMobile ? 80 : 74) + povZoomFov;
                break;
            }
            case 'isometric':
                this.normalCameraPosition.set(
                    9.1 + zoomConfig.positionZ * 0.9,
                    (isMobile ? 11.7 : 10.8) + zoomConfig.positionY * 0.8,
                    11 + zoomConfig.positionZ * 0.85
                );
                this.normalCameraLookAt.set(0, 0.45 + zoomConfig.lookAtY * 0.5, 0.2 + zoomConfig.lookAtZ * 0.35);
                this.camera.fov = (isMobile ? 56 : 52) + zoomConfig.fov * 0.8;
                break;
            case 'thirdPerson':
            default:
                if (isMobile) {
                    this.normalCameraPosition.set(0, 9.5 + zoomConfig.positionY, 14.2 + zoomConfig.positionZ * 1.05);
                    this.normalCameraLookAt.set(0, 0.45 + zoomConfig.lookAtY, 0.3 + zoomConfig.lookAtZ);
                    this.camera.fov = 60 + zoomConfig.fov;
                } else {
                    this.normalCameraPosition.set(0, 8.55 + zoomConfig.positionY, 12.25 + zoomConfig.positionZ * 1.05);
                    this.normalCameraLookAt.set(0, 0.5 + zoomConfig.lookAtY, 0 + zoomConfig.lookAtZ);
                    this.camera.fov = 54 + zoomConfig.fov;
                }
                break;
        }

        this.updatePerspectivePresentation();
        this.camera.updateProjectionMatrix();

        if (this.cameraPerspective === 'pov' && !resetView && this.isGameStarted) {
            this.camera.position.lerp(this.normalCameraPosition, 0.18);
            this.cameraLookTarget.lerp(this.normalCameraLookAt, 0.22);
            this.camera.lookAt(this.cameraLookTarget);
        } else if (resetView) {
            this.camera.position.copy(this.normalCameraPosition);
            this.cameraLookTarget.copy(this.normalCameraLookAt);
            this.camera.lookAt(this.normalCameraLookAt);
        }
    }

    updatePerspectivePresentation() {
        const isPov = this.cameraPerspective === 'pov';

        if (this.playerPaddleSolidMeshes) {
            this.playerPaddleSolidMeshes.forEach((mesh) => {
                mesh.visible = !isPov;
                mesh.castShadow = !isPov;
            });
        }

        if (this.playerPaddleGuide) {
            this.playerPaddleGuide.visible = isPov;
        }

        if (this.netShadow && this.netShadow.material) {
            this.netShadow.material.opacity = this.cameraPerspective === 'topDown' ? 0.34 : 0.18;
            this.netShadow.material.needsUpdate = true;
        }
    }

    createPlayerPaddleGuide(sourceGroup) {
        const guide = new THREE.Group();
        sourceGroup.traverse((child) => {
            if (!child.isMesh) {
                return;
            }

            const edgeGeometry = new THREE.EdgesGeometry(child.geometry, 26);
            const edgeMaterial = new LineBasicMaterial({
                color: child.material.color ? child.material.color.getHex() : 0xffffff,
                transparent: true,
                opacity: child.material.color && child.material.color.getHex() === 0x8b4513 ? 0.82 : 0.92
            });
            const outline = new THREE.LineSegments(edgeGeometry, edgeMaterial);
            outline.position.copy(child.position);
            outline.rotation.copy(child.rotation);
            outline.scale.copy(child.scale);
            outline.renderOrder = 5;
            guide.add(outline);
        });

        guide.visible = false;
        return guide;
    }

    setPauseButtonLabel() {
        this.pauseButton.innerText = this.isPaused ? 'Resume' : 'Pause';
        this.pauseButton.setAttribute('aria-label', this.isPaused ? 'Resume match' : 'Pause match');
        this.pauseButton.dataset.state = this.isPaused ? 'resume' : 'pause';
    }

    setSoundButtonState() {
        this.soundButton.dataset.muted = this.soundEnabled ? 'false' : 'true';
        this.soundButton.setAttribute('aria-label', this.soundEnabled ? 'Mute sound effects' : 'Unmute sound effects');
        this.soundButton.setAttribute('aria-pressed', this.soundEnabled ? 'false' : 'true');
    }

    setDifficulty(difficulty) {
        if (!DIFFICULTY_SETTINGS[difficulty]) {
            return;
        }

        this.difficulty = difficulty;
        this.saveDifficultyPreference();
        this.refreshComputerAimOffset(true);
        this.syncSettingsPanel();
    }

    setCameraZoom(cameraZoom) {
        if (!CAMERA_ZOOM_SETTINGS[cameraZoom]) {
            return;
        }

        this.cameraZoom = cameraZoom;
        this.saveCameraZoomPreference();
        this.refreshGameplayCamera(true);
        this.syncSettingsPanel();
    }

    setCameraPerspective(cameraPerspective) {
        if (!CAMERA_PERSPECTIVE_SETTINGS[cameraPerspective]) {
            return;
        }

        this.cameraPerspective = cameraPerspective;
        this.saveCameraPerspectivePreference();
        this.refreshGameplayCamera(true);
        this.syncSettingsPanel();
    }

    syncSettingsPanel() {
        if (!this.pauseScreen) {
            return;
        }

        this.difficultyValue.textContent = DIFFICULTY_SETTINGS[this.difficulty].label;
        this.cameraPerspectiveValue.textContent = CAMERA_PERSPECTIVE_SETTINGS[this.cameraPerspective].label;
        this.cameraZoomValue.textContent = CAMERA_ZOOM_SETTINGS[this.cameraZoom].label;
        this.pauseSfxValue.textContent = this.soundEnabled ? 'On' : 'Off';

        this.difficultyButtons.forEach((button) => {
            button.classList.toggle('is-selected', button.dataset.value === this.difficulty);
            button.setAttribute('aria-pressed', button.dataset.value === this.difficulty ? 'true' : 'false');
        });

        this.cameraZoomButtons.forEach((button) => {
            button.classList.toggle('is-selected', button.dataset.value === this.cameraZoom);
            button.setAttribute('aria-pressed', button.dataset.value === this.cameraZoom ? 'true' : 'false');
        });

        this.cameraPerspectiveButtons.forEach((button) => {
            button.classList.toggle('is-selected', button.dataset.value === this.cameraPerspective);
            button.setAttribute('aria-pressed', button.dataset.value === this.cameraPerspective ? 'true' : 'false');
        });

        this.soundButtons.forEach((button) => {
            const shouldSelect = (button.dataset.value === 'on') === this.soundEnabled;
            button.classList.toggle('is-selected', shouldSelect);
            button.setAttribute('aria-pressed', shouldSelect ? 'true' : 'false');
        });
    }

    getDifficultyConfig() {
        return DIFFICULTY_SETTINGS[this.difficulty] || DIFFICULTY_SETTINGS.normal;
    }

    refreshComputerAimOffset(force = false) {
        const config = this.getDifficultyConfig();
        const now = performance.now();

        if (!force && now < this.nextComputerAimRefresh) {
            return;
        }

        this.computerAimOffset.set(
            (Math.random() * 2 - 1) * config.maxErrorX,
            (Math.random() * 2 - 1) * config.maxErrorZ
        );
        this.nextComputerAimRefresh = now + config.errorRefreshMs;
    }

    pulseScoreboard() {
        this.scoreboard.classList.remove('score-pop');
        void this.scoreboard.offsetWidth;
        this.scoreboard.classList.add('score-pop');

        clearTimeout(this.scoreboardPulseTimeout);
        this.scoreboardPulseTimeout = setTimeout(() => {
            this.scoreboard.classList.remove('score-pop');
        }, 220);
    }

    showFeedback(message, tone = 'good') {
        if (!this.feedbackToast) {
            return;
        }

        this.feedbackToast.textContent = message;
        this.feedbackToast.dataset.tone = tone;
        this.feedbackToast.classList.add('is-visible');

        clearTimeout(this.feedbackToastTimeout);
        this.feedbackToastTimeout = setTimeout(() => {
            this.feedbackToast.classList.remove('is-visible');
        }, 900);
    }

    pulsePaddle(paddle) {
        if (!paddle) {
            return;
        }

        const targetScale = {
            x: paddle.scale.x,
            y: paddle.scale.y,
            z: paddle.scale.z
        };

        if (paddle.pulseTween) {
            paddle.pulseTween.stop();
        }

        paddle.scale.set(targetScale.x * 1.06, targetScale.y * 1.06, targetScale.z * 1.06);
        paddle.pulseTween = new TWEEN.Tween(paddle.scale)
            .to(targetScale, 120)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
    }

    updatePaddleMotion(delta) {
        const safeDelta = Math.max(delta, 1 / 120);
        const maxSpeed = PADDLE_VELOCITY_CLAMP;

        this.playerPaddleVelocity
            .copy(this.paddle.position)
            .sub(this.previousPlayerPaddlePosition)
            .divideScalar(safeDelta);

        if (this.playerPaddleVelocity.length() > maxSpeed) {
            this.playerPaddleVelocity.setLength(maxSpeed);
        }

        this.computerPaddleVelocity
            .copy(this.computerPaddle.position)
            .sub(this.previousComputerPaddlePosition)
            .divideScalar(safeDelta);

        if (this.computerPaddleVelocity.length() > maxSpeed) {
            this.computerPaddleVelocity.setLength(maxSpeed);
        }

        this.previousPlayerPaddlePosition.copy(this.paddle.position);
        this.previousComputerPaddlePosition.copy(this.computerPaddle.position);
    }

    applyPaddleShot({ paddle, paddleVelocity, hitPosition, returnDirection, randomHeightIncrement, isPlayer }) {
        const clamp = THREE.MathUtils.clamp;
        const impactSpeed = paddleVelocity.length();
        const lateralMotion = paddleVelocity.x;
        const forwardMotion = paddleVelocity.z * returnDirection;
        const sideSpin = clamp(lateralMotion * (0.26 + impactSpeed * 0.015), -3.1, 3.1);
        const topspin = clamp(forwardMotion * 0.42, -2.4, 2.9);
        const speedBoost = clamp(impactSpeed * 0.09, 0, 1.45);
        const driveBoost = clamp(forwardMotion * 0.16, -0.25, 1.05);
        const loftBoost = clamp(-forwardMotion * 0.24, 0, 1.45);
        const smash = impactSpeed > 4.6 && forwardMotion > 2.2 && Math.abs(hitPosition) < 0.48;
        const currentForwardSpeed = Math.abs(this.ballVelocity.z);
        const normalTargetSpeed = clamp(
            6.4 + impactSpeed * 0.17 + Math.max(forwardMotion, 0) * 0.12 + Math.abs(hitPosition) * 0.12,
            NORMAL_RETURN_SPEED_MIN,
            NORMAL_RETURN_SPEED_MAX
        );
        const smashTargetSpeed = clamp(
            9.6 + impactSpeed * 0.12 + Math.max(forwardMotion, 0) * 0.1,
            SMASH_RETURN_SPEED_MIN,
            SMASH_RETURN_SPEED_MAX
        );
        const desiredForwardSpeed = smash ? smashTargetSpeed : normalTargetSpeed;
        const nextForwardSpeed = clamp(
            currentForwardSpeed * 0.18 + desiredForwardSpeed * 0.82,
            smash ? SMASH_RETURN_SPEED_MIN : NORMAL_RETURN_SPEED_MIN,
            smash ? SMASH_RETURN_SPEED_MAX : NORMAL_RETURN_SPEED_MAX
        );

        this.ballVelocity.z = returnDirection * nextForwardSpeed;
        this.ballVelocity.x += hitPosition * ANGLE_ADJUSTMENT_FACTOR + sideSpin * 0.3;

        const baseLift = Math.abs(this.ballVelocity.y) * randomHeightIncrement;
        let nextLift = baseLift + 0.35 + loftBoost - (speedBoost + Math.max(driveBoost, 0)) * 0.22;
        const speedLiftFloor = THREE.MathUtils.mapLinear(
            nextForwardSpeed,
            NORMAL_RETURN_SPEED_MIN,
            SMASH_RETURN_SPEED_MAX,
            2.15,
            3.35
        );

        if (smash) {
            nextLift *= 0.68;
        }

        this.ballVelocity.y = clamp(Math.max(nextLift, speedLiftFloor), MIN_BOUNCE_VELOCITY, MAX_HEIGHT_VELOCITY);
        this.ballSpin.set(sideSpin, topspin);

        if (isPlayer && smash) {
            this.showFeedback('Smash', 'good');
        }
    }

    getPowerUpFeedback(type) {
        switch (type) {
            case 'speed':
                return 'Speed Boost';
            case 'extend':
                return 'Paddle Extended';
            case 'slow':
                return 'Ball Slowed';
            case 'doublePoints':
                return 'Double Points';
            case 'shield':
                return 'Shield Ready';
            default:
                return 'Power-Up';
        }
    }

    getObstacleFeedback(type) {
        switch (type) {
            case 'barrier':
                return 'Barrier Hit';
            case 'paddle':
                return 'Deflection';
            case 'wall':
                return 'Wall Bounce';
            case 'bouncePad':
                return 'Bounce Pad';
            case 'shrinkZone':
                return 'Shrink Zone';
            default:
                return 'Obstacle';
        }
    }

    spawnPowerUp() {
        if (!this.isGameStarted) return; // Stop spawning if game is not started

        const powerUpTypes = ['speed', 'extend', 'slow', 'doublePoints', 'shield'];
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const position = new Vector3(Math.random() * 5 - 2.5, 0.5, Math.random() * 10 - 5);
        const powerUp = new PowerUp(type, position, this); // Pass the game object
        this.powerUps.push(powerUp);
        this.scene.add(powerUp.mesh);

        console.log("PowerUp spawned");

        // Set a duration for the power-up to disappear
        setTimeout(() => {
            this.scene.remove(powerUp.mesh);
            powerUp.removeLabel();
            this.powerUps = this.powerUps.filter(p => p !== powerUp);
        }, 10000); // Power-up lasts for 10 seconds

        // Spawn a new power-up every 30 seconds
        setTimeout(() => this.spawnPowerUp(), 30000);
    }

    spawnObstacle() {
        if (!this.isGameStarted) return; // Stop spawning if game is not started

        const obstacleTypes = ['barrier', 'paddle', 'wall', 'bouncePad', 'shrinkZone'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const position = new Vector3(Math.random() * 5 - 2.5, 0.5, Math.random() * 10 - 5);
        const obstacle = new Obstacle(type, position, this); // Pass the game object
        this.obstacles.push(obstacle);
        this.scene.add(obstacle.mesh);

        console.log("Obstacle spawned");

        // Set a duration for the obstacle to disappear
        setTimeout(() => {
            this.scene.remove(obstacle.mesh);
            obstacle.removeLabel();
            this.obstacles = this.obstacles.filter(o => o !== obstacle);
        }, 15000); // Obstacle lasts for 15 seconds

        // Spawn a new obstacle every 45 seconds
        setTimeout(() => this.spawnObstacle(), 45000);
    }

    initTable() {
        const tableTexture = new THREE.TextureLoader().load('img/pingpongtable1.webp'); // Load new table texture
        const tableGeometry = new PlaneGeometry(5, 10);
        const tableMaterial = new MeshStandardMaterial({
            map: tableTexture,
        });
        this.table = new Mesh(tableGeometry, tableMaterial);
        this.table.rotation.x = -Math.PI / 2;
        this.table.receiveShadow = true;
        this.scene.add(this.table);

        // Shadow plane to simulate shadow on the table
        const shadowMaterial = new ShadowMaterial({ opacity: 0.5 });
        const shadowPlane = new Mesh(tableGeometry, shadowMaterial);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.01; // Slightly below the table
        shadowPlane.receiveShadow = true;
        this.scene.add(shadowPlane);
    }

    initNet() {
        const netTexture = new THREE.TextureLoader().load('img/net.webp'); // Load the new net texture
        const netMaterial = new MeshStandardMaterial({ map: netTexture, transparent: true });
        const netGeometry = new PlaneGeometry(5, NET_HEIGHT); // Adjust net height
        this.net = new Mesh(netGeometry, netMaterial);
        this.net.position.y = NET_HEIGHT / 2; // Center net position vertically
        this.net.position.z = 0;
        this.net.castShadow = true;
        this.scene.add(this.net);

        const netShadowGeometry = new PlaneGeometry(5.08, 0.34);
        const netShadowMaterial = new MeshStandardMaterial({
            color: 0x081014,
            transparent: true,
            opacity: 0.18,
            depthWrite: false
        });
        this.netShadow = new Mesh(netShadowGeometry, netShadowMaterial);
        this.netShadow.rotation.x = -Math.PI / 2;
        this.netShadow.position.set(0, TABLE_HEIGHT + 0.004, 0);
        this.scene.add(this.netShadow);
    }

    initBoundaries() {
        const boundaryMaterial = new MeshStandardMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const boundaryHeight = 2.0; // Increased height
        const boundaryThickness = 0.1;

        const boundaries = [
            // Left
            { width: boundaryThickness, height: boundaryHeight, depth: 10, x: -2.5 - boundaryThickness / 2, y: boundaryHeight / 2, z: 0 },
            // Right
            { width: boundaryThickness, height: boundaryHeight, depth: 10, x: 2.5 + boundaryThickness / 2, y: boundaryHeight / 2, z: 0 },
        ];

        boundaries.forEach(boundary => {
            const boundaryGeometry = new BoxGeometry(boundary.width, boundary.height, boundary.depth);
            const boundaryMesh = new Mesh(boundaryGeometry, boundaryMaterial);
            boundaryMesh.position.set(boundary.x, boundary.y, boundary.z);
            this.scene.add(boundaryMesh);
        });
    }

    initEnvironment() {
        const bgTexture = new THREE.TextureLoader().load('img/arena.webp'); // Load stadium background texture
        const bgMaterial = new MeshStandardMaterial({ map: bgTexture, side: THREE.BackSide });
        const bgGeometry = new SphereGeometry(50, 32, 32);
        const background = new Mesh(bgGeometry, bgMaterial);
        this.scene.add(background);
    }

    initControls() {
        this.keys = {};

        window.addEventListener('wheel', (event) => this.onMouseWheel(event));
        this.renderer.domElement.addEventListener('mousedown', (event) => this.onMouseDown(event));
        this.renderer.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
        window.addEventListener('mouseup', (event) => this.onMouseUp(event));
        this.renderer.domElement.addEventListener('touchstart', (event) => this.onTouchStart(event), { passive: false });
        this.renderer.domElement.addEventListener('touchmove', (event) => this.onTouchMove(event), { passive: false });
        this.renderer.domElement.addEventListener('touchend', (event) => this.onTouchEnd(event), { passive: false });
        this.renderer.domElement.addEventListener('touchcancel', (event) => this.onTouchEnd(event), { passive: false });
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    initScoreboard() {
        this.scoreboard = document.getElementById('scoreboard');
        this.playerScore = document.getElementById('playerScore');
        this.computerScoreLabel = document.getElementById('computerScore');
        this.feedbackToast = document.getElementById('feedbackToast');
        this.pointAnnouncement = document.getElementById('pointAnnouncement');
        this.pointAnnouncementTitle = document.getElementById('pointAnnouncementTitle');
        this.pauseButton = document.getElementById('pauseButton');
        this.soundButton = document.getElementById('soundButton');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScore = document.getElementById('finalScore');
        this.finalOutcome = document.getElementById('finalOutcome');
        this.difficultyValue = document.getElementById('difficultyValue');
        this.cameraPerspectiveValue = document.getElementById('cameraPerspectiveValue');
        this.cameraZoomValue = document.getElementById('cameraZoomValue');
        this.pauseSfxValue = document.getElementById('pauseSfxValue');
        this.difficultyButtons = Array.from(document.querySelectorAll('[data-setting="difficulty"]'));
        this.cameraPerspectiveButtons = Array.from(document.querySelectorAll('[data-setting="cameraPerspective"]'));
        this.cameraZoomButtons = Array.from(document.querySelectorAll('[data-setting="cameraZoom"]'));
        this.soundButtons = Array.from(document.querySelectorAll('[data-setting="sound"]'));
        this.setPauseButtonLabel();
        this.setSoundButtonState();
        this.syncSettingsPanel();
        this.updateScore();
    }

    onMouseDown(event) {
        if (event.button !== 0) {
            return;
        }

        this.isDragging = true;
        this.setPaddlePositionFromPointer(event.clientX, event.clientY);
    }

    onMouseMove(event) {
        if (this.isDragging) {
            this.setPaddlePositionFromPointer(event.clientX, event.clientY);
        }
    }

    onMouseUp(event) {
        this.isDragging = false;
    }

    setPaddlePositionFromPointer(clientX, clientY) {
        if (!this.isGameStarted || this.isPaused || this.isPointAnnouncementActive) {
            return;
        }

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.pointer, this.camera);

        if (!this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
            return;
        }

        this.paddle.position.x = Math.max(Math.min(this.dragIntersection.x, WALL_BOUNDARY), -WALL_BOUNDARY);
        this.paddle.position.z = Math.max(Math.min(this.dragIntersection.z, PADDLE_BOUNDARY_Z_MAX), PADDLE_BOUNDARY_Z_MIN);
    }

    updateCameraPosition() {
        this.camera.position.x = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.sin(this.cameraAngleX);
        this.camera.position.y = this.cameraDistance * Math.cos(this.cameraAngleY);
        this.camera.position.z = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX);
        this.camera.lookAt(this.tableCenter);
    }

    movePaddle() {
        if (this.keys['ArrowLeft']) {
            this.paddle.position.x -= PADDLE_MOVE_SPEED;
        }
        if (this.keys['ArrowRight']) {
            this.paddle.position.x += PADDLE_MOVE_SPEED;
        }
        if (this.keys['ArrowUp']) {
            this.paddle.position.z -= PADDLE_MOVE_SPEED * 1.2;
        }
        if (this.keys['ArrowDown']) {
            this.paddle.position.z += PADDLE_MOVE_SPEED * 1.2;
        }

        // Enforce paddle boundaries
        this.paddle.position.z = Math.max(Math.min(this.paddle.position.z, PADDLE_BOUNDARY_Z_MAX), PADDLE_BOUNDARY_Z_MIN);

        this.paddle.position.y = this.ball.position.y; // Ensure the paddle follows the ball's height
    }

    moveComputerPaddle() {
        const config = this.getDifficultyConfig();
        const ballComingToComputer = this.ballVelocity.z < -0.05;

        this.refreshComputerAimOffset();

        let targetX;
        let targetZ;
        let lerpX;
        let lerpZ;

        if (ballComingToComputer) {
            const interceptZ = Math.max(Math.min(this.ball.position.z - 0.35, COMPUTER_PADDLE_BOUNDARY_Z_MAX), COMPUTER_PADDLE_BOUNDARY_Z_MIN);
            const timeToIntercept = Math.max(0, (interceptZ - this.ball.position.z) / this.ballVelocity.z);
            const predictedX = this.ball.position.x + this.ballVelocity.x * timeToIntercept * config.anticipation;

            targetX = predictedX + this.computerAimOffset.x;
            targetZ = interceptZ + this.computerAimOffset.y;
            lerpX = config.trackLerpX;
            lerpZ = config.trackLerpZ;
        } else {
            targetX = this.ball.position.x * config.readyXBias + this.computerAimOffset.x * 0.35;
            targetZ = config.readyZ;
            lerpX = config.readyLerpX;
            lerpZ = config.readyLerpZ;
        }

        targetX = Math.max(Math.min(targetX, WALL_BOUNDARY), -WALL_BOUNDARY);
        targetZ = Math.max(Math.min(targetZ, COMPUTER_PADDLE_BOUNDARY_Z_MAX), COMPUTER_PADDLE_BOUNDARY_Z_MIN);

        this.computerPaddle.position.x += (targetX - this.computerPaddle.position.x) * lerpX;
        this.computerPaddle.position.z += (targetZ - this.computerPaddle.position.z) * lerpZ;

        // Enforce computer paddle boundaries
        this.computerPaddle.position.z = Math.max(Math.min(this.computerPaddle.position.z, COMPUTER_PADDLE_BOUNDARY_Z_MAX), COMPUTER_PADDLE_BOUNDARY_Z_MIN);
        this.computerPaddle.position.x = Math.max(Math.min(this.computerPaddle.position.x, WALL_BOUNDARY), -WALL_BOUNDARY);

        this.computerPaddle.position.y = this.ball.position.y; // Ensure the computer paddle follows the ball's height
    }

    updateScore() {
        this.playerScore.innerText = this.score;
        this.computerScoreLabel.innerText = this.computerScore;
        this.finalScore.innerText = `${this.score} : ${this.computerScore}`;
        this.pulseScoreboard();
    }

    onWindowResize() {
        this.refreshGameplayCamera(true);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseWheel(event) {
        this.camera.fov += event.deltaY * 0.05;
        this.camera.updateProjectionMatrix();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.isPaused) {
            const delta = this.clock.getDelta();
            if (!this.isAnimating && this.isGameStarted && !this.isPointAnnouncementActive) {
                this.applyPhysics(delta);
                this.movePaddle();
                this.moveComputerPaddle();
                this.updatePaddleMotion(delta);
                this.checkCollisions();
                this.updateTrail();
                this.refreshGameplayCamera();
            }
            TWEEN.update(); // Update Tween animations
            this.renderer.render(this.scene, this.camera);
            if (this.isAnimating) {
                this.animateCamera();
            }
        }
    }

    applyPhysics(delta) {
        this.previousBallPosition.copy(this.ball.position);

        const spinDecay = Math.pow(BALL_SPIN_DECAY_PER_FRAME, delta * 60);
        this.ballVelocity.x += this.ballSpin.x * BALL_SPIN_CURVE_FACTOR * delta;
        this.ballVelocity.y -= this.ballSpin.y * BALL_TOPSPIN_DIP_FACTOR * delta;
        this.ballSpin.multiplyScalar(spinDecay);

        this.ballVelocity.add(GRAVITY.clone().multiplyScalar(delta));
        this.ball.position.add(this.ballVelocity.clone().multiplyScalar(delta));

        // Cap the ball speed
        if (this.ballVelocity.length() > MAX_BALL_SPEED) {
            this.ballVelocity.setLength(MAX_BALL_SPEED);
        }

        // Cap the ball height
        if (this.ball.position.y > MAX_BALL_HEIGHT) {
            this.ball.position.y = MAX_BALL_HEIGHT;
            this.ballVelocity.y = -Math.abs(this.ballVelocity.y); // Invert Y velocity to bounce down
        }

        // Check for table collision and bounce
        if (this.ball.position.y <= TABLE_HEIGHT && this.ballVelocity.y < 0) {
            const topspin = this.ballSpin.y;
            const bounceHeightFactor = topspin >= 0
                ? Math.max(0.72, 1 - topspin * 0.08)
                : Math.min(1.3, 1 + Math.abs(topspin) * 0.1);
            const forwardSpeedAfterBounce = Math.max(
                NORMAL_RETURN_SPEED_MIN,
                Math.abs(this.ballVelocity.z) * TABLE_BOUNCE_FORWARD_DECAY
            );

            this.ballVelocity.y = Math.max(-this.ballVelocity.y * bounceHeightFactor, MIN_BOUNCE_VELOCITY);
            this.ballVelocity.z = Math.sign(this.ballVelocity.z || 1) * forwardSpeedAfterBounce;
            this.ballVelocity.x += this.ballSpin.x * BALL_BOUNCE_SPIN_TRANSFER;
            this.ball.position.y = TABLE_HEIGHT; // Ensure the ball is placed correctly on the table
            this.ballSpin.x *= 0.9;
            this.ballSpin.y *= 0.82;
        }
    }

    checkCollisions() {
        this.checkWallCollisions();
        this.checkPaddleCollision();
        this.checkNetCollision();
        this.checkPowerUpCollision();
        this.checkObstacleCollision();
        this.checkGameOver();
    }

    checkWallCollisions() {
        if (this.ball.position.x <= -WALL_BOUNDARY) {
            this.ball.position.x = -WALL_BOUNDARY;
            this.ballVelocity.x = Math.abs(this.ballVelocity.x);
        } else if (this.ball.position.x >= WALL_BOUNDARY) {
            this.ball.position.x = WALL_BOUNDARY;
            this.ballVelocity.x = -Math.abs(this.ballVelocity.x);
        }
    }

    checkNetCollision() {
        if (this.ball.position.z >= -0.1 && this.ball.position.z <= 0.1) {
            if (this.ball.position.y <= NET_HEIGHT) { // Adjust net collision detection
                this.ballVelocity.z = -this.ballVelocity.z;
            }
        }
    }

    checkPaddleCollision() {
        const paddleWidth = 1; // Approximate width of the paddle
        const paddleHeight = 0.2; // Approximate height of the paddle
        const bounceDelay = 0.5; // Increased delay to prevent multiple detections

        const randomHeightIncrement = Math.random() * (HEIGHT_INCREMENT_MAX - HEIGHT_INCREMENT_MIN) + HEIGHT_INCREMENT_MIN;
        const playerWithinFace =
            this.ball.position.x >= this.paddle.position.x - paddleWidth / 2 &&
            this.ball.position.x <= this.paddle.position.x + paddleWidth / 2 &&
            this.ball.position.y >= this.paddle.position.y - paddleHeight / 2 &&
            this.ball.position.y <= this.paddle.position.y + paddleHeight / 2;

        const playerPaddleFrontZ = this.paddle.position.z - PADDLE_HALF_DEPTH - BALL_RADIUS;
        const playerCrossedFront =
            this.ballVelocity.z > 0 &&
            this.previousBallPosition.z <= playerPaddleFrontZ &&
            this.ball.position.z >= playerPaddleFrontZ &&
            playerWithinFace;
        const playerOverlapping =
            this.ball.position.z >= this.paddle.position.z - PADDLE_HALF_DEPTH &&
            this.ball.position.z <= this.paddle.position.z + PADDLE_HALF_DEPTH &&
            playerWithinFace;

        if (playerCrossedFront || playerOverlapping) {
            const currentTime = this.clock.getElapsedTime();
            if (currentTime - this.playerPaddleBounceTime > bounceDelay) {
                console.log('Player paddle hit');
                const hitPosition = (this.ball.position.x - this.paddle.position.x) / (paddleWidth / 2);
                this.applyPaddleShot({
                    paddle: this.paddle,
                    paddleVelocity: this.playerPaddleVelocity,
                    hitPosition,
                    returnDirection: -1,
                    randomHeightIncrement,
                    isPlayer: true
                });

                // Push the ball back in front of the paddle so it cannot be hit again from overlap.
                this.ball.position.z = this.paddle.position.z - PADDLE_HALF_DEPTH - BALL_RADIUS - 0.02;
                this.playerPaddleBounceTime = currentTime;

                this.pulsePaddle(this.paddle);
                this.playHitSound(); // Play sound when the paddle hits the ball
            }
        }

        const computerWithinFace =
            this.ball.position.x >= this.computerPaddle.position.x - paddleWidth / 2 &&
            this.ball.position.x <= this.computerPaddle.position.x + paddleWidth / 2 &&
            this.ball.position.y >= this.computerPaddle.position.y - paddleHeight / 2 &&
            this.ball.position.y <= this.computerPaddle.position.y + paddleHeight / 2;
        const computerPaddleFrontZ = this.computerPaddle.position.z + PADDLE_HALF_DEPTH + BALL_RADIUS;
        const computerCrossedFront =
            this.ballVelocity.z < 0 &&
            this.previousBallPosition.z >= computerPaddleFrontZ &&
            this.ball.position.z <= computerPaddleFrontZ &&
            computerWithinFace;
        const computerOverlapping =
            this.ball.position.z <= this.computerPaddle.position.z + PADDLE_HALF_DEPTH &&
            this.ball.position.z >= this.computerPaddle.position.z - PADDLE_HALF_DEPTH &&
            computerWithinFace;

        if (computerCrossedFront || computerOverlapping) {
            const currentTime = this.clock.getElapsedTime();
            if (currentTime - this.computerPaddleBounceTime > bounceDelay) {
                console.log('Computer paddle hit');
                const hitPosition = (this.ball.position.x - this.computerPaddle.position.x) / (paddleWidth / 2);
                this.applyPaddleShot({
                    paddle: this.computerPaddle,
                    paddleVelocity: this.computerPaddleVelocity,
                    hitPosition,
                    returnDirection: 1,
                    randomHeightIncrement,
                    isPlayer: false
                });

                this.ball.position.z = this.computerPaddle.position.z + PADDLE_HALF_DEPTH + BALL_RADIUS + 0.02;
                this.computerPaddleBounceTime = currentTime;

                this.pulsePaddle(this.computerPaddle);
                this.playHitSound(); // Play sound when the computer paddle hits the ball
            }
        }
    }

    checkPowerUpCollision() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.paddle.position.distanceTo(powerUp.position) < 0.5) {
                this.applyPowerUp(powerUp);
                this.scene.remove(powerUp.mesh);
                powerUp.removeLabel(); // Remove the label
                this.powerUps.splice(i, 1);
                this.showFeedback(this.getPowerUpFeedback(powerUp.type), 'good');
                this.playHitSound(); // Feedback for collecting power-up
            }
        }
    }

    applyPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'speed':
                // Increase paddle speed
                this.paddleSpeed *= 1.5;
                setTimeout(() => this.paddleSpeed /= 1.5, 10000);
                break;
            case 'extend':
                // Extend paddle width
                this.paddle.scale.x *= 1.5;
                setTimeout(() => this.paddle.scale.x /= 1.5, 15000);
                break;
            case 'slow':
                // Slow down the ball
                this.ballVelocity.multiplyScalar(0.5);
                setTimeout(() => this.ballVelocity.multiplyScalar(2), 10000);
                break;
            case 'doublePoints':
                // Double the points
                this.doublePoints = true;
                setTimeout(() => this.doublePoints = false, 20000);
                break;
            case 'shield':
                // Add a shield behind the paddle
                this.addShield();
                setTimeout(() => this.removeShield(), 10000);
                break;
        }
    }

    addShield() {
        const shieldGeometry = new PlaneGeometry(1, 1.5); // Increased shield height
        const shieldMaterial = new MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
        this.shield = new Mesh(shieldGeometry, shieldMaterial);
        this.shield.position.set(this.paddle.position.x, this.paddle.position.y + 0.75, this.paddle.position.z + 1); // Adjusted position for higher shield
        this.shield.castShadow = true; // Ensure the shield casts shadow
        this.scene.add(this.shield);
    }

    removeShield() {
        this.scene.remove(this.shield);
    }

    checkObstacleCollision() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (this.ball.position.distanceTo(obstacle.position) < 0.5) {
                this.applyObstacleEffect(obstacle);
                this.scene.remove(obstacle.mesh);
                obstacle.removeLabel(); // Remove the label
                this.obstacles.splice(i, 1);
                this.showFeedback(this.getObstacleFeedback(obstacle.type), 'warn');
                this.playHitSound(); // Feedback for hitting an obstacle
            }
        }
    }

    applyObstacleEffect(obstacle) {
        switch (obstacle.type) {
            case 'barrier':
                this.ballVelocity.z = -this.ballVelocity.z;
                break;
            case 'paddle':
                this.ballVelocity.z = -this.ballVelocity.z;
                break;
            case 'wall':
                this.ballVelocity.x = -this.ballVelocity.x;
                break;
            case 'bouncePad':
                this.ballVelocity.y *= 1.5;
                break;
            case 'shrinkZone':
                this.ball.scale.set(0.5, 0.5, 0.5);
                setTimeout(() => this.ball.scale.set(1, 1, 1), 5000);
                break;
        }
    }

    checkGameOver() {
        if (this.ball.position.z > PADDLE_BOUNDARY_Z_MAX) {
            this.awardPoint('computer');
        } else if (this.ball.position.z < COMPUTER_PADDLE_BOUNDARY_Z_MIN) {
            this.awardPoint('player');
        }
    }

    awardPoint(side) {
        if (side === 'computer') {
            this.computerScore += 1;
        } else {
            this.score += 1;
        }

        this.updateScore();

        const reachedGameOver = side === 'computer'
            ? this.computerScore >= 11
            : this.score >= 11;

        if (reachedGameOver) {
            this.hidePointAnnouncement();
            this.showGameOverScreen();
            this.isGameStarted = false; // Reset game start flag
            this.clearPowerUpsAndObstacles(); // Clear power-ups and obstacles
        } else {
            this.resetBall(); // Reset the ball for the next round
            this.showPointAnnouncement(side);
        }
    }

    resetBall() {
        this.ball.position.set(0, 0.4, 0); // Reset ball position to the center
        this.ballVelocity.copy(BALL_INITIAL_VELOCITY); // Reset ball velocity
        this.ballSpin.set(0, 0);
        this.previousBallPosition.copy(this.ball.position);
    }

    resetGame() {
        this.hidePointAnnouncement();
        this.score = 0;
        this.computerScore = 0;
        this.resetPaddles();
        this.updateScore();
        this.resetBall();
        this.clearPowerUpsAndObstacles(); // Clear power-ups and obstacles on reset
    }

    clearPowerUpsAndObstacles() {
        // Remove all power-ups
        this.powerUps.forEach(powerUp => {
            this.scene.remove(powerUp.mesh);
            powerUp.removeLabel();
        });
        this.powerUps = [];

        // Remove all obstacles
        this.obstacles.forEach(obstacle => {
            this.scene.remove(obstacle.mesh);
            obstacle.removeLabel();
        });
        this.obstacles = [];
    }

    startAnimation() {
        this.isAnimating = true; // Set flag to indicate animation is running
        this.animateCameraStartTime = this.clock.getElapsedTime();
    }

    animateCamera() {
        const elapsedTime = this.clock.getElapsedTime() - this.animateCameraStartTime;
        const duration = 10; // Duration of the animation in seconds
        const t = (elapsedTime % duration) / duration; // Loop the animation

        const angle = t * Math.PI * 2; // Full circle over the duration
        const radius = 20; // Radius of the circular path

        this.camera.position.x = radius * Math.cos(angle);
        this.camera.position.z = radius * Math.sin(angle);
        this.camera.position.y = 30; // Elevated view
        this.camera.lookAt(this.tableCenter);
    }

    loadSounds() {
        const listener = new AudioListener();
        this.camera.add(listener);

        this.audioContext = listener.context; // Store the AudioContext

        const sound = new Audio(listener);
        const audioLoader = new AudioLoader();
        audioLoader.load('sounds/hit.wav', function(buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.5);
        });

        this.hitSound = sound;
    }

    playHitSound() {
        if (!this.soundEnabled || !this.hitSound || !this.hitSound.buffer) {
            return;
        }

        if (this.hitSound.isPlaying) {
            this.hitSound.stop();
        }
        this.hitSound.play();
    }
}

function restartGame() {
    game.resetGame();
}

const game = new PingPongGame();
game.updateCameraPosition();
