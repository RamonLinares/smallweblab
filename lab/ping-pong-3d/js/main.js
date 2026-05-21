const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, PointLight, SpotLight, Vector2, Vector3, Clock, BufferGeometry, LineBasicMaterial, Line, ShadowMaterial, AudioListener, Audio, AudioLoader, PlaneGeometry, MeshStandardMaterial, Mesh, BoxGeometry, SphereGeometry } = THREE;

const BALL_INITIAL_VELOCITY = new Vector3(1, 6.0, 3.0); // Initial velocity towards the player with an angle
const GRAVITY = new Vector3(0, -9.8, 0); // Realistic gravity
const PADDLE_MOVE_SPEED = 0.1; // Reduced paddle move speed for better control
const INPUT_FRAME_RATE = 60;
const MAX_INPUT_DELTA = 1 / 20;
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
const PADDLE_SURFACE_Y = 0.4;
const VAULT_WALL_BOUNDARY = 3.9;

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
const ARENA_SCENE_PREFERENCE_STORAGE_KEY = 'ping-pong-3d-arena-scene';

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

const ARENA_SCENE_SETTINGS = {
    classic: {
        label: 'Classic Arena',
        caption: 'Original stadium wrap and standard tournament table.',
        tag: 'Legacy'
    },
    vault: {
        label: 'Glass Vault',
        caption: 'An enclosed glass court with wider lanes and ceiling ricochets.',
        tag: 'Ricochet'
    },
    titan: {
        label: 'Titan Stage',
        caption: 'A larger championship platform on a heavy raised plinth.',
        tag: 'Grand'
    },
    flux: {
        label: 'Flux Foundry',
        caption: 'An asymmetrical experimental court with an irregular chassis.',
        tag: 'Wild'
    }
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
        this.arenaScene = this.loadArenaScenePreference();
        this.isPointAnnouncementActive = false;
        this.computerAimOffset = new Vector2(0, 0);
        this.nextComputerAimRefresh = 0;
        this.activeStartTab = 'play';
        this.paddleSpeed = 1;
        this.paddleSpeedTimeout = null;

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
        document.querySelectorAll('[data-setting="arenaScene"]').forEach((button) => {
            button.addEventListener('click', () => this.setArenaScene(button.dataset.value));
        });
        document.querySelectorAll('[data-setting="sound"]').forEach((button) => {
            button.addEventListener('click', () => this.setSoundEnabled(button.dataset.value === 'on'));
        });
        document.querySelectorAll('[data-start-tab]').forEach((button) => {
            button.addEventListener('click', () => this.setStartTab(button.dataset.startTab));
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

    loadArenaScenePreference() {
        try {
            const storedValue = window.localStorage.getItem(ARENA_SCENE_PREFERENCE_STORAGE_KEY);
            return ARENA_SCENE_SETTINGS[storedValue] ? storedValue : 'classic';
        } catch (error) {
            return 'classic';
        }
    }

    saveArenaScenePreference() {
        try {
            window.localStorage.setItem(ARENA_SCENE_PREFERENCE_STORAGE_KEY, this.arenaScene);
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
        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true; // Enable shadow maps
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
        this.renderer.domElement.style.touchAction = 'none';
        document.body.appendChild(this.renderer.domElement);

        this.initLighting();
        this.arenaRoot = new THREE.Group();
        this.scene.add(this.arenaRoot);
        this.buildArenaScene();

        const playerPaddle = new Paddle(0xff0000);
        this.paddle = playerPaddle.group;
        this.paddle.position.set(0, PADDLE_SURFACE_Y, PLAYER_PADDLE_START_Z);
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
        this.computerPaddle.position.set(0, PADDLE_SURFACE_Y, COMPUTER_PADDLE_START_Z);
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
        this.dragPlane = new THREE.Plane(new Vector3(0, 1, 0), -PADDLE_SURFACE_Y);
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
        this.ambientLight = new AmbientLight(0x404040, 1.5);
        this.scene.add(this.ambientLight); // Stronger ambient light

        this.pointLight = new PointLight(0xffffff, 1, 100);
        this.pointLight.position.set(10, 10, 10);
        this.scene.add(this.pointLight);

        this.spotLight = new SpotLight(0xffffff);
        this.spotLight.position.set(5, 10, 7.5);
        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = 1024;
        this.spotLight.shadow.mapSize.height = 1024;
        this.spotLight.shadow.camera.near = 0.5;
        this.spotLight.shadow.camera.far = 50;
        this.scene.add(this.spotLight);
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
        this.syncSettingsPanel();
        this.setStartTab(this.activeStartTab);
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
        this.paddle.position.set(0, PADDLE_SURFACE_Y, PLAYER_PADDLE_START_Z);
        this.computerPaddle.position.set(0, PADDLE_SURFACE_Y, COMPUTER_PADDLE_START_Z);
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
                if (this.arenaScene === 'vault') {
                    this.normalCameraPosition.set(
                        0,
                        (isMobile ? 28.4 : 26.2) + zoomConfig.positionZ * 1.85 + zoomConfig.positionY * 0.9,
                        0.01
                    );
                    this.normalCameraLookAt.set(0, TABLE_HEIGHT, 0);
                    this.camera.fov = (isMobile ? 60 : 54) + zoomConfig.fov;
                    this.camera.up.set(0, 0, -1);
                    break;
                }

                this.normalCameraPosition.set(
                    0,
                    (isMobile ? 22.6 : 20.8) + zoomConfig.positionZ * 1.5 + zoomConfig.positionY * 0.7,
                    0.01
                );
                this.normalCameraLookAt.set(0, TABLE_HEIGHT, 0);
                this.camera.fov = (isMobile ? 52 : 47) + zoomConfig.fov * 0.85;
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

        if (this.vaultCourtMirror) {
            this.vaultCourtMirror.visible = !(this.arenaScene === 'vault' && this.cameraPerspective === 'topDown');
        }

        if (this.vaultTopDownElements) {
            const hideForVaultTopDown = this.arenaScene === 'vault' && this.cameraPerspective === 'topDown';
            this.vaultTopDownElements.forEach((element) => {
                element.visible = !hideForVaultTopDown;
            });
        }

        if (this.vaultTopDownFillLights) {
            const isVaultTopDown = this.arenaScene === 'vault' && this.cameraPerspective === 'topDown';
            this.vaultTopDownFillLights.forEach((light) => {
                light.intensity = isVaultTopDown ? light.userData.topDownIntensity : 0;
            });
        }

        const isVaultTopDown = this.arenaScene === 'vault' && this.cameraPerspective === 'topDown';
        if (this.pointLight) {
            this.pointLight.intensity = isVaultTopDown ? 0.12 : 1;
        }
        if (this.spotLight) {
            this.spotLight.intensity = isVaultTopDown ? 0 : 1;
        }
    }

    createPlayerPaddleGuide(sourceGroup) {
        const guide = new THREE.Group();
        const neonEdgeColor = 0x8ff4ff;
        const neonGlowColor = 0x35d9ff;
        const silhouetteColor = 0x071a24;

        sourceGroup.traverse((child) => {
            if (!child.isMesh) {
                return;
            }

            const edgeGeometry = new THREE.EdgesGeometry(child.geometry, 26);
            const silhouette = new Mesh(
                child.geometry,
                new THREE.MeshBasicMaterial({
                    color: silhouetteColor,
                    transparent: true,
                    opacity: 0.045,
                    side: THREE.DoubleSide,
                    depthTest: false,
                    depthWrite: false
                })
            );
            const glowShells = [
                { scale: 1.02, opacity: 0.08 },
                { scale: 1.06, opacity: 0.035 }
            ].map(({ scale, opacity }) => {
                const glowShell = new Mesh(
                    child.geometry,
                    new THREE.MeshBasicMaterial({
                        color: neonGlowColor,
                        transparent: true,
                        opacity,
                        side: THREE.DoubleSide,
                        depthTest: false,
                        depthWrite: false,
                        blending: THREE.AdditiveBlending
                    })
                );
                glowShell.position.copy(child.position);
                glowShell.rotation.copy(child.rotation);
                glowShell.scale.copy(child.scale).multiplyScalar(scale);
                return glowShell;
            });
            const outlineLayers = [
                { scale: 1, opacity: 1 },
                { scale: 1.02, opacity: 0.72 },
                { scale: 1.045, opacity: 0.32 }
            ].map(({ scale, opacity }) => {
                const edgeMaterial = new LineBasicMaterial({
                    color: neonEdgeColor,
                    transparent: true,
                    opacity,
                    depthTest: false,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
                const outline = new THREE.LineSegments(edgeGeometry, edgeMaterial);
                outline.position.copy(child.position);
                outline.rotation.copy(child.rotation);
                outline.scale.copy(child.scale).multiplyScalar(scale);
                return outline;
            });
            silhouette.position.copy(child.position);
            silhouette.rotation.copy(child.rotation);
            silhouette.scale.copy(child.scale);
            silhouette.renderOrder = 3;
            glowShells.forEach((glowShell, index) => {
                glowShell.renderOrder = 4 + index;
                guide.add(glowShell);
            });
            guide.add(silhouette);
            outlineLayers.forEach((outline, index) => {
                outline.renderOrder = 7 + index;
                guide.add(outline);
            });
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

    setArenaScene(arenaScene) {
        if (!ARENA_SCENE_SETTINGS[arenaScene]) {
            return;
        }

        this.arenaScene = arenaScene;
        this.saveArenaScenePreference();
        this.buildArenaScene();
        this.syncSettingsPanel();
    }

    setStartTab(tabName) {
        this.activeStartTab = tabName;

        if (!this.startTabButtons || !this.startPanels) {
            return;
        }

        this.startTabButtons.forEach((button) => {
            const isActive = button.dataset.startTab === tabName;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        this.startPanels.forEach((panel) => {
            const isActive = panel.dataset.startPanel === tabName;
            panel.classList.toggle('is-active', isActive);
            panel.hidden = !isActive;
        });
    }

    syncSettingsPanel() {
        if (!this.pauseScreen) {
            return;
        }

        const difficultyLabel = DIFFICULTY_SETTINGS[this.difficulty].label;
        const perspectiveLabel = CAMERA_PERSPECTIVE_SETTINGS[this.cameraPerspective].label;
        const zoomLabel = CAMERA_ZOOM_SETTINGS[this.cameraZoom].label;
        const soundLabel = this.soundEnabled ? 'On' : 'Off';
        const arenaLabel = ARENA_SCENE_SETTINGS[this.arenaScene].label;
        const arenaCaption = ARENA_SCENE_SETTINGS[this.arenaScene].caption;
        const arenaTag = ARENA_SCENE_SETTINGS[this.arenaScene].tag;

        this.difficultyValueDisplays.forEach((element) => {
            element.textContent = difficultyLabel;
        });
        this.cameraPerspectiveValueDisplays.forEach((element) => {
            element.textContent = perspectiveLabel;
        });
        this.cameraZoomValueDisplays.forEach((element) => {
            element.textContent = zoomLabel;
        });
        this.soundValueDisplays.forEach((element) => {
            element.textContent = soundLabel;
        });
        this.arenaSceneValueDisplays.forEach((element) => {
            element.textContent = arenaLabel;
        });
        if (this.startArenaName) {
            this.startArenaName.textContent = arenaLabel;
        }
        if (this.startArenaCaption) {
            this.startArenaCaption.textContent = arenaCaption;
        }
        if (this.startArenaTag) {
            this.startArenaTag.textContent = arenaTag;
        }

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

        this.arenaSceneButtons.forEach((button) => {
            const shouldSelect = button.dataset.value === this.arenaScene;
            button.classList.toggle('is-selected', shouldSelect);
            button.setAttribute('aria-pressed', shouldSelect ? 'true' : 'false');
        });
    }

    getDifficultyConfig() {
        return DIFFICULTY_SETTINGS[this.difficulty] || DIFFICULTY_SETTINGS.normal;
    }

    getActiveWallBoundary() {
        return this.arenaScene === 'vault' ? VAULT_WALL_BOUNDARY : WALL_BOUNDARY;
    }

    getActiveCeilingHeight() {
        return this.arenaScene === 'vault' ? 4.6 : MAX_BALL_HEIGHT;
    }

    getArenaPaceMultiplier() {
        return this.arenaScene === 'vault' ? 1.18 : 1;
    }

    getSpawnPosition() {
        const halfWidth = this.getActiveWallBoundary() - 0.35;
        const halfDepth = this.arenaScene === 'vault' ? 6.4 : 5;
        return new Vector3(
            (Math.random() * 2 - 1) * halfWidth,
            0.5,
            (Math.random() * 2 - 1) * halfDepth
        );
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
        const paceMultiplier = this.getArenaPaceMultiplier();
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
            NORMAL_RETURN_SPEED_MIN * paceMultiplier,
            NORMAL_RETURN_SPEED_MAX * paceMultiplier
        );
        const smashTargetSpeed = clamp(
            9.6 + impactSpeed * 0.12 + Math.max(forwardMotion, 0) * 0.1,
            SMASH_RETURN_SPEED_MIN * paceMultiplier,
            SMASH_RETURN_SPEED_MAX * paceMultiplier
        );
        const desiredForwardSpeed = smash ? smashTargetSpeed : normalTargetSpeed;
        const nextForwardSpeed = clamp(
            currentForwardSpeed * 0.18 + desiredForwardSpeed * 0.82,
            (smash ? SMASH_RETURN_SPEED_MIN : NORMAL_RETURN_SPEED_MIN) * paceMultiplier,
            (smash ? SMASH_RETURN_SPEED_MAX : NORMAL_RETURN_SPEED_MAX) * paceMultiplier
        );

        this.ballVelocity.z = returnDirection * nextForwardSpeed;
        this.ballVelocity.x += hitPosition * ANGLE_ADJUSTMENT_FACTOR + sideSpin * 0.3;

        const baseLift = Math.abs(this.ballVelocity.y) * randomHeightIncrement;
        let nextLift = baseLift + 0.35 + loftBoost - (speedBoost + Math.max(driveBoost, 0)) * 0.22;
        const speedLiftFloor = THREE.MathUtils.mapLinear(
            nextForwardSpeed,
            NORMAL_RETURN_SPEED_MIN * paceMultiplier,
            SMASH_RETURN_SPEED_MAX * paceMultiplier,
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
        const position = this.getSpawnPosition();
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
        const position = this.getSpawnPosition();
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

    buildArenaScene() {
        if (!this.arenaRoot) {
            return;
        }

        this.clearArenaScene();

        switch (this.arenaScene) {
            case 'vault':
                this.buildVaultArena();
                break;
            case 'titan':
                this.buildTitanArena();
                break;
            case 'flux':
                this.buildFluxArena();
                break;
            case 'classic':
            default:
                this.buildClassicArena();
                break;
        }

        this.updatePerspectivePresentation();

        if (this.camera) {
            this.refreshGameplayCamera(true);
        }
    }

    clearArenaScene() {
        const disposeMaterial = (material) => {
            if (!material) {
                return;
            }

            if (Array.isArray(material)) {
                material.forEach(disposeMaterial);
                return;
            }

            if (material.map) {
                material.map.dispose();
            }
            material.dispose();
        };

        while (this.arenaRoot.children.length > 0) {
            const child = this.arenaRoot.children.pop();
            child.traverse((node) => {
                if (node.geometry) {
                    node.geometry.dispose();
                }
                if (node.material) {
                    disposeMaterial(node.material);
                }
            });
            this.arenaRoot.remove(child);
        }

        if (this.vaultTopDownFillLights) {
            this.vaultTopDownFillLights.forEach((light) => {
                this.scene.remove(light);
            });
        }

        this.table = null;
        this.net = null;
        this.netShadow = null;
        this.vaultCourtMirror = null;
        this.vaultTopDownElements = null;
        this.vaultTopDownFillLights = null;
    }

    addPlaySurfaceMarkings(group, y, width = 5, depth = 10, color = 0xf2fff8) {
        const lineThickness = 0.06;
        const inset = 0.12;
        const lineMaterial = new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.08 });

        const addStrip = (stripWidth, stripDepth, x, z) => {
            const strip = new Mesh(new PlaneGeometry(stripWidth, stripDepth), lineMaterial.clone());
            strip.rotation.x = -Math.PI / 2;
            strip.position.set(x, y, z);
            group.add(strip);
        };

        addStrip(width - inset * 2, lineThickness, 0, -depth / 2 + inset);
        addStrip(width - inset * 2, lineThickness, 0, depth / 2 - inset);
        addStrip(lineThickness, depth - inset * 2, -width / 2 + inset, 0);
        addStrip(lineThickness, depth - inset * 2, width / 2 - inset, 0);
        addStrip(lineThickness, depth - inset * 2, 0, 0);
        addStrip(width - inset * 2, lineThickness, 0, 0);
    }

    addVaultCourtMarkings(group, y, width, depth, color = 0xe6f5ff) {
        const lineMaterial = new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.24 });
        const lineThickness = 0.06;
        const outerInset = 0.18;
        const serviceDepth = depth * 0.26;

        const addStrip = (stripWidth, stripDepth, x, z) => {
            const strip = new Mesh(new PlaneGeometry(stripWidth, stripDepth), lineMaterial.clone());
            strip.rotation.x = -Math.PI / 2;
            strip.position.set(x, y, z);
            group.add(strip);
        };

        addStrip(width - outerInset * 2, lineThickness, 0, -depth / 2 + outerInset);
        addStrip(width - outerInset * 2, lineThickness, 0, depth / 2 - outerInset);
        addStrip(lineThickness, depth - outerInset * 2, -width / 2 + outerInset, 0);
        addStrip(lineThickness, depth - outerInset * 2, width / 2 - outerInset, 0);
        addStrip(width - outerInset * 2, lineThickness, 0, 0);
        addStrip(width - outerInset * 2, lineThickness, 0, -serviceDepth);
        addStrip(width - outerInset * 2, lineThickness, 0, serviceDepth);
        addStrip(lineThickness, serviceDepth * 2, 0, 0);
    }

    addSideBoundaries({ color = 0x67ebff, opacity = 0.34, height = 2.1, inset = 0.06, style = 'glass', halfWidth = WALL_BOUNDARY, depth = 10.4 } = {}) {
        const material = new MeshStandardMaterial({
            color,
            transparent: true,
            opacity,
            side: THREE.DoubleSide,
            emissive: style === 'glass' ? color : 0x000000,
            emissiveIntensity: style === 'glass' ? 0.08 : 0
        });

        [-1, 1].forEach((direction) => {
            const wall = new Mesh(new BoxGeometry(0.08, height, depth), material.clone());
            wall.position.set(direction * (halfWidth + inset), height / 2, 0);
            this.arenaRoot.add(wall);
        });
    }

    addNet({ frameColor = 0xf5f7ff, shadowOpacity = 0.18, width = 5 } = {}) {
        const netTexture = new THREE.TextureLoader().load('img/net.webp');
        const netMaterial = new MeshStandardMaterial({ map: netTexture, transparent: true });
        const netGeometry = new PlaneGeometry(width, NET_HEIGHT);
        this.net = new Mesh(netGeometry, netMaterial);
        this.net.position.y = NET_HEIGHT / 2;
        this.net.position.z = 0;
        this.net.castShadow = true;
        this.arenaRoot.add(this.net);

        const topTape = new Mesh(
            new BoxGeometry(width + 0.02, 0.04, 0.04),
            new MeshStandardMaterial({ color: frameColor, emissive: frameColor, emissiveIntensity: 0.06 })
        );
        topTape.position.set(0, NET_HEIGHT + 0.01, 0);
        this.arenaRoot.add(topTape);

        this.netShadow = new Mesh(
            new PlaneGeometry(width + 0.08, 0.34),
            new MeshStandardMaterial({
                color: 0x081014,
                transparent: true,
                opacity: shadowOpacity,
                depthWrite: false
            })
        );
        this.netShadow.rotation.x = -Math.PI / 2;
        this.netShadow.position.set(0, TABLE_HEIGHT + 0.004, 0);
        this.arenaRoot.add(this.netShadow);
    }

    buildClassicArena() {
        const tableTexture = new THREE.TextureLoader().load('img/pingpongtable1.webp');
        this.table = new Mesh(
            new PlaneGeometry(5, 10),
            new MeshStandardMaterial({ map: tableTexture })
        );
        this.table.rotation.x = -Math.PI / 2;
        this.table.receiveShadow = true;
        this.arenaRoot.add(this.table);

        const shadowPlane = new Mesh(new PlaneGeometry(5, 10), new ShadowMaterial({ opacity: 0.5 }));
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.01;
        shadowPlane.receiveShadow = true;
        this.arenaRoot.add(shadowPlane);

        this.addNet({ frameColor: 0xe9f7ff, shadowOpacity: 0.18 });
        this.addSideBoundaries({ color: 0x62eaff, opacity: 0.5, height: 2, inset: 0.05, style: 'glass' });

        const bgTexture = new THREE.TextureLoader().load('img/arena.webp');
        const background = new Mesh(
            new SphereGeometry(50, 32, 32),
            new MeshStandardMaterial({ map: bgTexture, side: THREE.BackSide })
        );
        this.arenaRoot.add(background);
    }

    buildVaultArena() {
        const wallBoundary = this.getActiveWallBoundary();
        const wallThickness = 0.06;
        const courtWidth = wallBoundary * 2;
        const courtDepth = 15.4;
        const enclosureWidth = courtWidth + wallThickness * 2;
        const enclosureDepth = courtDepth + 1.4;
        const ceilingHeight = this.getActiveCeilingHeight() + 0.16;

        const shell = new Mesh(
            new BoxGeometry(42, 18, 56),
            new MeshStandardMaterial({
                color: 0x101e27,
                side: THREE.BackSide,
                metalness: 0.2,
                roughness: 0.85
            })
        );
        shell.position.y = 6.5;
        this.arenaRoot.add(shell);

        const floor = new Mesh(
            new BoxGeometry(courtWidth + 0.34, 0.42, courtDepth + 0.42),
            new MeshStandardMaterial({ color: 0x0d1823, metalness: 0.28, roughness: 0.46 })
        );
        floor.position.y = -0.13;
        this.arenaRoot.add(floor);

        const court = new Mesh(
            new BoxGeometry(courtWidth, 0.16, courtDepth),
            new MeshStandardMaterial({
                color: 0x132744,
                emissive: 0x0b1730,
                emissiveIntensity: 0.42,
                metalness: 0.36,
                roughness: 0.18
            })
        );
        court.position.y = TABLE_HEIGHT - 0.08;
        court.receiveShadow = true;
        this.table = court;
        this.arenaRoot.add(court);

        const courtMirror = new Mesh(
            new PlaneGeometry(courtWidth + 0.12, courtDepth + 0.14),
            new MeshStandardMaterial({
                color: 0x0b1628,
                emissive: 0x102244,
                emissiveIntensity: 0.08,
                metalness: 0.22,
                roughness: 0.3
            })
        );
        courtMirror.rotation.x = -Math.PI / 2;
        courtMirror.position.y = TABLE_HEIGHT - 0.085;
        this.arenaRoot.add(courtMirror);
        this.vaultCourtMirror = courtMirror;

        const glassMaterial = new MeshStandardMaterial({
            color: 0xc9f4ff,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            emissive: 0x9edbff,
            emissiveIntensity: 0.08,
            metalness: 0.08,
            roughness: 0.1
        });

        const backWall = new Mesh(new BoxGeometry(enclosureWidth, ceilingHeight, 0.06), glassMaterial.clone());
        backWall.position.set(0, ceilingHeight / 2, -enclosureDepth / 2);
        this.arenaRoot.add(backWall);

        [-1, 1].forEach((direction) => {
            const sideWall = new Mesh(new BoxGeometry(wallThickness, ceilingHeight, enclosureDepth), glassMaterial.clone());
            sideWall.position.set(direction * (wallBoundary + wallThickness / 2), ceilingHeight / 2, 0);
            this.arenaRoot.add(sideWall);
        });

        const ceiling = new Mesh(
            new BoxGeometry(enclosureWidth, 0.06, enclosureDepth),
            new MeshStandardMaterial({
                color: 0xbfe9ff,
                transparent: true,
                opacity: 0.08,
                emissive: 0x9bd7ff,
                emissiveIntensity: 0.14,
                roughness: 0.08,
                metalness: 0.1
            })
        );
        ceiling.position.set(0, ceilingHeight, 0);
        this.arenaRoot.add(ceiling);

        const edgeLineMaterial = new MeshStandardMaterial({
            color: 0xe9f5ff,
            emissive: 0xd8f0ff,
            emissiveIntensity: 0.28,
            transparent: true,
            opacity: 0.82
        });
        const edgeBars = [
            [enclosureWidth, 0.05, 0.05, 0, ceilingHeight, -enclosureDepth / 2],
            [0.05, 0.05, enclosureDepth, -enclosureWidth / 2, ceilingHeight, 0],
            [0.05, 0.05, enclosureDepth, enclosureWidth / 2, ceilingHeight, 0],
            [0.05, ceilingHeight, 0.05, -enclosureWidth / 2, ceilingHeight / 2, -enclosureDepth / 2],
            [0.05, ceilingHeight, 0.05, enclosureWidth / 2, ceilingHeight / 2, -enclosureDepth / 2]
        ];
        this.vaultTopDownElements = [];
        edgeBars.forEach(([width, height, depth, x, y, z]) => {
            const bar = new Mesh(new BoxGeometry(width, height, depth), edgeLineMaterial.clone());
            bar.position.set(x, y, z);
            this.arenaRoot.add(bar);
            if (z > 0) {
                this.vaultTopDownElements.push(bar);
            }
        });

        this.vaultTopDownFillLights = [
            { color: 0xaee6ff, intensity: 0.92, position: [-(enclosureWidth / 2 + 3.6), 5.8, 4.8] },
            { color: 0xaee6ff, intensity: 0.86, position: [enclosureWidth / 2 + 3.4, 6.1, -3.6] },
            { color: 0x8fd8ff, intensity: 0.54, position: [0, 6.8, -(enclosureDepth / 2 + 4.2)] }
        ].map(({ color, intensity, position }) => {
            const light = new PointLight(color, 0, 55);
            light.position.set(...position);
            light.userData.topDownIntensity = intensity;
            this.scene.add(light);
            return light;
        });

        for (let i = 0; i < 16; i += 1) {
            const tower = new Mesh(
                new BoxGeometry(0.6 + (i % 3) * 0.2, 3.4 + (i % 5) * 0.75, 0.6 + (i % 4) * 0.15),
                new MeshStandardMaterial({
                    color: 0x122237,
                    emissive: 0x102030,
                    emissiveIntensity: 0.3,
                    roughness: 0.72
                })
            );
            const side = i % 2 === 0 ? -1 : 1;
            tower.position.set(side * (7.2 + (i % 3) * 1.2), tower.geometry.parameters.height / 2 - 0.1, -8 + (i % 8) * 2.3);
            this.arenaRoot.add(tower);
        }

        this.addVaultCourtMarkings(this.arenaRoot, TABLE_HEIGHT + 0.004, courtWidth, courtDepth, 0xeaf5ff);
        this.addNet({ frameColor: 0xf7fff9, shadowOpacity: 0.12, width: courtWidth - 0.08 });
    }

    buildTitanArena() {
        const floor = new Mesh(
            new CylinderGeometry(15, 17, 0.9, 48),
            new MeshStandardMaterial({ color: 0x12212c, metalness: 0.28, roughness: 0.72 })
        );
        floor.position.y = -0.55;
        this.arenaRoot.add(floor);

        for (let index = 0; index < 5; index += 1) {
            const beam = new Mesh(
                new BoxGeometry(18, 0.12, 0.2),
                new MeshStandardMaterial({ color: 0xffb15a, emissive: 0xffb15a, emissiveIntensity: 0.28 })
            );
            beam.position.set(0, 4.2 + index * 1.1, -12 + index * 6);
            this.arenaRoot.add(beam);
        }

        const leftGrandstand = new Mesh(
            new BoxGeometry(6, 4, 18),
            new MeshStandardMaterial({ color: 0x0e1a22, roughness: 0.82 })
        );
        leftGrandstand.position.set(-9.8, 1.2, 0);
        leftGrandstand.rotation.z = -0.26;
        this.arenaRoot.add(leftGrandstand);

        const rightGrandstand = leftGrandstand.clone();
        rightGrandstand.position.x = 9.8;
        rightGrandstand.rotation.z = 0.26;
        this.arenaRoot.add(rightGrandstand);

        const stage = new Mesh(
            new BoxGeometry(8.2, 0.8, 13.4),
            new MeshStandardMaterial({ color: 0x152938, metalness: 0.2, roughness: 0.58 })
        );
        stage.position.y = -0.28;
        this.arenaRoot.add(stage);

        const subStage = new Mesh(
            new BoxGeometry(3.2, 2.2, 6.2),
            new MeshStandardMaterial({ color: 0x10202b, roughness: 0.7 })
        );
        subStage.position.y = -1.28;
        this.arenaRoot.add(subStage);

        const apron = new Mesh(
            new BoxGeometry(6.8, 0.2, 12),
            new MeshStandardMaterial({ color: 0x2279a1, emissive: 0x1f5671, emissiveIntensity: 0.14, roughness: 0.36 })
        );
        apron.position.y = 0.04;
        this.arenaRoot.add(apron);

        this.table = new Mesh(
            new BoxGeometry(5.4, 0.16, 10.4),
            new MeshStandardMaterial({ color: 0x11c96a, roughness: 0.34, metalness: 0.08 })
        );
        this.table.position.y = TABLE_HEIGHT - 0.08;
        this.table.receiveShadow = true;
        this.arenaRoot.add(this.table);
        this.addPlaySurfaceMarkings(this.arenaRoot, TABLE_HEIGHT + 0.004, 5, 10, 0xf3fff8);
        this.addNet({ frameColor: 0xf8fbff, shadowOpacity: 0.2 });
        this.addSideBoundaries({ color: 0x7cd7ff, opacity: 0.2, height: 2.4, inset: 0.12, style: 'glass' });
    }

    buildFluxArena() {
        const shell = new Mesh(
            new BoxGeometry(38, 16, 48),
            new MeshStandardMaterial({
                color: 0x09161b,
                side: THREE.BackSide,
                roughness: 0.88,
                metalness: 0.1
            })
        );
        shell.position.y = 5.8;
        this.arenaRoot.add(shell);

        const frameMaterial = new MeshStandardMaterial({ color: 0x43d0ff, emissive: 0x43d0ff, emissiveIntensity: 0.22 });
        [
            [-7.4, 4.4, -10, 0.25],
            [7.2, 3.8, -5.5, -0.22],
            [-8.6, 5.2, 5, -0.18],
            [8.8, 4.6, 10.2, 0.2]
        ].forEach(([x, y, z, rotY]) => {
            const frame = new Mesh(new BoxGeometry(0.2, 7, 4), frameMaterial.clone());
            frame.position.set(x, y, z);
            frame.rotation.y = rotY;
            this.arenaRoot.add(frame);
        });

        const shape = new THREE.Shape();
        shape.moveTo(-3.5, -5.8);
        shape.lineTo(3.1, -5.5);
        shape.lineTo(3.9, -3.4);
        shape.lineTo(3.2, -0.4);
        shape.lineTo(4.1, 5.9);
        shape.lineTo(-2.7, 5.7);
        shape.lineTo(-3.8, 3.1);
        shape.lineTo(-3.2, -0.9);
        shape.lineTo(-3.5, -5.8);

        const body = new Mesh(
            new THREE.ExtrudeGeometry(shape, { depth: 0.72, bevelEnabled: false }),
            new MeshStandardMaterial({ color: 0x112731, roughness: 0.62, metalness: 0.24 })
        );
        body.rotation.x = -Math.PI / 2;
        body.rotation.z = Math.PI;
        body.position.set(0, -0.92, 0.6);
        this.arenaRoot.add(body);

        const accentPlate = new Mesh(
            new BoxGeometry(6.4, 0.14, 11.2),
            new MeshStandardMaterial({ color: 0x0f3d45, emissive: 0x3be1d6, emissiveIntensity: 0.16, roughness: 0.34 })
        );
        accentPlate.position.y = -0.12;
        this.arenaRoot.add(accentPlate);

        this.table = new Mesh(
            new BoxGeometry(5.15, 0.16, 10.15),
            new MeshStandardMaterial({ color: 0x17c87d, roughness: 0.36, metalness: 0.14 })
        );
        this.table.position.y = TABLE_HEIGHT - 0.08;
        this.table.receiveShadow = true;
        this.arenaRoot.add(this.table);
        this.addPlaySurfaceMarkings(this.arenaRoot, TABLE_HEIGHT + 0.004, 5, 10, 0xf4fff9);
        this.addNet({ frameColor: 0xeeffff, shadowOpacity: 0.22 });
        this.addSideBoundaries({ color: 0x4deaff, opacity: 0.18, height: 2.6, inset: 0.1, style: 'glass' });
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
        this.startArenaName = document.getElementById('startArenaName');
        this.startArenaCaption = document.getElementById('startArenaCaption');
        this.startArenaTag = document.getElementById('startArenaTag');
        this.difficultyValueDisplays = Array.from(document.querySelectorAll('[data-display="difficulty"]'));
        this.cameraPerspectiveValueDisplays = Array.from(document.querySelectorAll('[data-display="cameraPerspective"]'));
        this.cameraZoomValueDisplays = Array.from(document.querySelectorAll('[data-display="cameraZoom"]'));
        this.soundValueDisplays = Array.from(document.querySelectorAll('[data-display="sound"]'));
        this.arenaSceneValueDisplays = Array.from(document.querySelectorAll('[data-display="arenaScene"]'));
        this.difficultyButtons = Array.from(document.querySelectorAll('[data-setting="difficulty"]'));
        this.cameraPerspectiveButtons = Array.from(document.querySelectorAll('[data-setting="cameraPerspective"]'));
        this.cameraZoomButtons = Array.from(document.querySelectorAll('[data-setting="cameraZoom"]'));
        this.soundButtons = Array.from(document.querySelectorAll('[data-setting="sound"]'));
        this.arenaSceneButtons = Array.from(document.querySelectorAll('[data-setting="arenaScene"]'));
        this.startTabButtons = Array.from(document.querySelectorAll('[data-start-tab]'));
        this.startPanels = Array.from(document.querySelectorAll('[data-start-panel]'));
        this.setPauseButtonLabel();
        this.setSoundButtonState();
        this.syncSettingsPanel();
        this.setStartTab(this.activeStartTab);
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

        const wallBoundary = this.getActiveWallBoundary();
        this.paddle.position.x = Math.max(Math.min(this.dragIntersection.x, wallBoundary), -wallBoundary);
        this.paddle.position.z = Math.max(Math.min(this.dragIntersection.z, PADDLE_BOUNDARY_Z_MAX), PADDLE_BOUNDARY_Z_MIN);
    }

    updateCameraPosition() {
        this.camera.position.x = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.sin(this.cameraAngleX);
        this.camera.position.y = this.cameraDistance * Math.cos(this.cameraAngleY);
        this.camera.position.z = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX);
        this.camera.lookAt(this.tableCenter);
    }

    movePaddle(delta) {
        const frameScale = Math.min(delta, MAX_INPUT_DELTA) * INPUT_FRAME_RATE;
        const moveStep = PADDLE_MOVE_SPEED * frameScale * this.paddleSpeed;
        const wallBoundary = this.getActiveWallBoundary();

        if (this.keys['ArrowLeft']) {
            this.paddle.position.x -= moveStep;
        }
        if (this.keys['ArrowRight']) {
            this.paddle.position.x += moveStep;
        }
        if (this.keys['ArrowUp']) {
            this.paddle.position.z -= moveStep * 1.2;
        }
        if (this.keys['ArrowDown']) {
            this.paddle.position.z += moveStep * 1.2;
        }

        // Enforce paddle boundaries
        this.paddle.position.x = Math.max(Math.min(this.paddle.position.x, wallBoundary), -wallBoundary);
        this.paddle.position.z = Math.max(Math.min(this.paddle.position.z, PADDLE_BOUNDARY_Z_MAX), PADDLE_BOUNDARY_Z_MIN);

        this.paddle.position.y = Math.max(this.ball.position.y, PADDLE_SURFACE_Y);
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

        const wallBoundary = this.getActiveWallBoundary();
        targetX = Math.max(Math.min(targetX, wallBoundary), -wallBoundary);
        targetZ = Math.max(Math.min(targetZ, COMPUTER_PADDLE_BOUNDARY_Z_MAX), COMPUTER_PADDLE_BOUNDARY_Z_MIN);

        this.computerPaddle.position.x += (targetX - this.computerPaddle.position.x) * lerpX;
        this.computerPaddle.position.z += (targetZ - this.computerPaddle.position.z) * lerpZ;

        // Enforce computer paddle boundaries
        this.computerPaddle.position.z = Math.max(Math.min(this.computerPaddle.position.z, COMPUTER_PADDLE_BOUNDARY_Z_MAX), COMPUTER_PADDLE_BOUNDARY_Z_MIN);
        this.computerPaddle.position.x = Math.max(Math.min(this.computerPaddle.position.x, wallBoundary), -wallBoundary);

        this.computerPaddle.position.y = Math.max(this.ball.position.y, PADDLE_SURFACE_Y);
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
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
                this.movePaddle(delta);
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
        const activeCeilingHeight = this.getActiveCeilingHeight();
        if (this.ball.position.y > activeCeilingHeight) {
            this.ball.position.y = activeCeilingHeight;
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
        const wallBoundary = this.getActiveWallBoundary();
        if (this.ball.position.x <= -wallBoundary) {
            this.ball.position.x = -wallBoundary;
            this.ballVelocity.x = Math.abs(this.ballVelocity.x);
        } else if (this.ball.position.x >= wallBoundary) {
            this.ball.position.x = wallBoundary;
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
                this.paddleSpeed = 1.5;
                clearTimeout(this.paddleSpeedTimeout);
                this.paddleSpeedTimeout = setTimeout(() => {
                    this.paddleSpeed = 1;
                    this.paddleSpeedTimeout = null;
                }, 10000);
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
        const paceMultiplier = this.getArenaPaceMultiplier();
        this.ball.position.set(0, 0.4, 0); // Reset ball position to the center
        this.ballVelocity.copy(BALL_INITIAL_VELOCITY);
        this.ballVelocity.x *= paceMultiplier;
        this.ballVelocity.z *= paceMultiplier;
        this.ballSpin.set(0, 0);
        this.previousBallPosition.copy(this.ball.position);
    }

    resetGame() {
        this.hidePointAnnouncement();
        this.score = 0;
        this.computerScore = 0;
        this.paddleSpeed = 1;
        clearTimeout(this.paddleSpeedTimeout);
        this.paddleSpeedTimeout = null;
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
