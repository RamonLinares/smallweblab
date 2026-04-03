const { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, PointLight, SpotLight, Vector3, Clock, BufferGeometry, LineBasicMaterial, Line, ShadowMaterial, AudioListener, Audio, AudioLoader, PlaneGeometry, MeshStandardMaterial, Mesh, BoxGeometry, SphereGeometry } = THREE;

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
const MAX_BALL_HEIGHT = 4; // Maximum height for the ball
const SPIN_EFFECT_FACTOR = 0.5; // Spin effect factor

// Paddle boundaries
const PADDLE_BOUNDARY_Z_MIN = 2; // Player paddle cannot move closer than 2 units from the net
const PADDLE_BOUNDARY_Z_MAX = TABLE_BOUNDARY + 1; // Allow the paddle to move slightly beyond the table edge
const COMPUTER_PADDLE_BOUNDARY_Z_MIN = -TABLE_BOUNDARY - 1; // Allow the computer paddle to move slightly beyond the table edge
const COMPUTER_PADDLE_BOUNDARY_Z_MAX = -4; // Computer paddle should stay further back from the net

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

        this.init();
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('wheel', (event) => this.onMouseWheel(event));
        document.addEventListener('mousedown', (event) => this.onMouseDown(event));
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('mouseup', (event) => this.onMouseUp(event));
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.getElementById('startButton').addEventListener('click', () => this.startGame()); // Add click event for 'Start' button
        document.getElementById('restartButton').addEventListener('click', () => this.startGame()); // Add click event for 'Restart' button
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause()); // Add click event for 'Pause' button
        document.addEventListener('touchstart', (event) => this.onTouchStart(event));
        document.addEventListener('touchmove', (event) => this.onTouchMove(event));
        document.addEventListener('touchend', (event) => this.onTouchEnd(event));
        
        this.animate();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseButton').innerText = this.isPaused ? 'Resume' : 'Pause';
        if (!this.isPaused) {
            this.animate();
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

        if (startScreen.style.display === 'block' || gameOverScreen.style.display === 'block') {
            this.isGameStarted = true; // Set game as started
            this.hideStartScreen();
            this.hideGameOverScreen();
            this.resetGame();
            this.isAnimating = false;
            this.camera.position.copy(this.normalCameraPosition);
            this.camera.lookAt(this.normalCameraLookAt);
            this.spawnPowerUp(); // Start spawning power-ups
            this.spawnObstacle(); // Start spawning obstacles
            console.log("Game started");
        }
    }

    onKeyDown(event) {
        this.keys[event.code] = true;

        if (event.code === 'Enter') {
            this.startGame(); // Call startGame when 'Enter' is pressed
        }
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
    }

    onTouchStart(event) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }

    onTouchMove(event) {
        event.preventDefault(); // Prevent default behavior like scrolling
        const touch = event.touches[0];
    
        const deltaX = (touch.clientX - this.touchStartX) / window.innerWidth * PADDLE_MOVE_SPEED * 50;
        const deltaY = (touch.clientY - this.touchStartY) / window.innerHeight * PADDLE_MOVE_SPEED * 50;
    
        this.paddle.position.x += deltaX;
        this.paddle.position.z += deltaY; // Corrected direction for moving up and down
    
        // Enforce paddle boundaries
        this.paddle.position.x = Math.max(Math.min(this.paddle.position.x, WALL_BOUNDARY), -WALL_BOUNDARY);
        this.paddle.position.z = Math.max(Math.min(this.paddle.position.z, PADDLE_BOUNDARY_Z_MAX), PADDLE_BOUNDARY_Z_MIN);
    
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }
    
    
    onTouchEnd(event) {
        this.touchStartX = null;
        this.touchStartY = null;
    }

    init() {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.normalCameraPosition = new Vector3(0, 8, 11); // Adjusted normal camera position for higher view
        this.normalCameraLookAt = new Vector3(0, 0.5, 0);
        this.camera.position.copy(this.normalCameraPosition);
        this.camera.lookAt(this.normalCameraLookAt);
        this.camera.fov = 50; // Adjusted field of view for a more balanced perspective
        this.camera.updateProjectionMatrix();
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true; // Enable shadow maps
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows
        document.body.appendChild(this.renderer.domElement);

        this.initLighting();
        this.initTable();
        this.initNet();
        this.initBoundaries();
        this.initEnvironment();

        const playerPaddle = new Paddle(0xff0000);
        this.paddle = playerPaddle.group;
        this.paddle.position.set(0, 0.4, 6); // Initial position slightly outside the table
        this.paddle.castShadow = true; // Ensure the paddle casts shadow
        this.scene.add(this.paddle);

        const computerPaddle = new Paddle(0x0000ff);
        this.computerPaddle = computerPaddle.group;
        this.computerPaddle.position.set(0, 0.4, -6);
        this.computerPaddle.castShadow = true; // Ensure the paddle casts shadow
        this.scene.add(this.computerPaddle);

        const ball = new Ball();
        this.ball = ball.mesh;
        this.ball.castShadow = true; // Ensure the ball casts shadow
        this.scene.add(this.ball);

        this.initTrail();
        this.initControls();
        this.initScoreboard();
        this.loadSounds();
        this.showStartScreen();

        this.score = 0;
        this.computerScore = 0;
        this.ballVelocity = BALL_INITIAL_VELOCITY.clone(); // Initialize ball velocity
        this.lastBounceTime = this.clock.getElapsedTime();
        this.playerPaddleBounceTime = -Infinity; // Initialize with a very old time
        this.computerPaddleBounceTime = -Infinity; // Initialize with a very old time
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
        const trailLength = 50;
        const trailMaterial = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
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
        document.getElementById('startScreen').style.display = 'block';
        this.startAnimation();
    }

    hideStartScreen() {
        document.getElementById('startScreen').style.display = 'none';
    }

    showGameOverScreen() {
        document.getElementById('finalScore').innerText = `${this.score} - ${this.computerScore}`;
        document.getElementById('gameOverScreen').style.display = 'block';
        this.startAnimation();
        this.stopSpawning(); // Stop spawning power-ups and obstacles
    }

    hideGameOverScreen() {
        document.getElementById('gameOverScreen').style.display = 'none';
    }

    stopSpawning() {
        this.isGameStarted = false; // Reset game start flag
        console.log("Spawning stopped");
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
        const tableMaterial = new MeshStandardMaterial({ map: tableTexture });
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
        this.scene.add(this.net);
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
        document.addEventListener('touchstart', (event) => this.onTouchStart(event));
        document.addEventListener('touchmove', (event) => this.onTouchMove(event));
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        this.keys = {};
    }

    initScoreboard() {
        this.scoreboard = document.getElementById('scoreboard');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScore = document.getElementById('finalScore');
    }

    onMouseDown(event) {
        this.isDragging = true;
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    onMouseMove(event) {
        if (this.isDragging) {
            const deltaMove = {
                x: event.clientX - this.previousMousePosition.x,
                y: event.clientY - this.previousMousePosition.y
            };

            this.cameraAngleX += deltaMove.x * 0.01;
            this.cameraAngleY += deltaMove.y * 0.01;

            this.cameraAngleY = Math.max(Math.PI / 6, Math.min(Math.PI / 3, this.cameraAngleY)); // Clamp the vertical angle

            this.updateCameraPosition();

            this.previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    }

    onMouseUp(event) {
        this.isDragging = false;
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
        const targetX = this.ball.position.x;
        const directionX = targetX - this.computerPaddle.position.x;
        this.computerPaddle.position.x += directionX * 0.1;

        // Enforce computer paddle boundaries
        this.computerPaddle.position.z = Math.max(Math.min(this.computerPaddle.position.z, COMPUTER_PADDLE_BOUNDARY_Z_MAX), COMPUTER_PADDLE_BOUNDARY_Z_MIN);

        this.computerPaddle.position.y = this.ball.position.y; // Ensure the computer paddle follows the ball's height
    }

    updateScore() {
        this.scoreboard.innerText = `Player: ${this.score} - Computer: ${this.computerScore}`;
    }

    onWindowResize() {
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
            if (!this.isAnimating && this.isGameStarted) {
                this.applyPhysics(delta);
                this.movePaddle();
                this.moveComputerPaddle();
                this.checkCollisions();
                this.updateTrail();
            }
            TWEEN.update(); // Update Tween animations
            this.renderer.render(this.scene, this.camera);
            if (this.isAnimating) {
                this.animateCamera();
            }
        }
    }

    applyPhysics(delta) {
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
            this.ballVelocity.y = Math.max(-this.ballVelocity.y, MIN_BOUNCE_VELOCITY);
            this.ball.position.y = TABLE_HEIGHT; // Ensure the ball is placed correctly on the table
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
        if (this.ball.position.x <= -WALL_BOUNDARY || this.ball.position.x >= WALL_BOUNDARY) {
            this.ballVelocity.x = -this.ballVelocity.x;
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
        const randomVelocityIncrement = Math.random() * (VELOCITY_INCREMENT_MAX - VELOCITY_INCREMENT_MIN) + VELOCITY_INCREMENT_MIN;

        // Player paddle collision
        if (this.ball.position.z >= this.paddle.position.z - 0.3 &&
            this.ball.position.z <= this.paddle.position.z + 0.3 &&
            this.ball.position.x >= this.paddle.position.x - paddleWidth / 2 &&
            this.ball.position.x <= this.paddle.position.x + paddleWidth / 2 &&
            this.ball.position.y >= this.paddle.position.y - paddleHeight / 2 &&
            this.ball.position.y <= this.paddle.position.y + paddleHeight / 2) {
            const currentTime = this.clock.getElapsedTime();
            if (currentTime - this.playerPaddleBounceTime > bounceDelay) {
                console.log('Player paddle hit');
                const hitPosition = (this.ball.position.x - this.paddle.position.x) / (paddleWidth / 2);
                this.ballVelocity.z = -Math.abs(this.ballVelocity.z) * randomVelocityIncrement;
                this.ballVelocity.y = Math.abs(this.ballVelocity.y) * randomHeightIncrement; // Randomize height increment
                this.ballVelocity.x += hitPosition * ANGLE_ADJUSTMENT_FACTOR; // Adjust angle

                // Ensure the ball velocity in the y-direction does not exceed the maximum
                if (this.ballVelocity.y > MAX_HEIGHT_VELOCITY) {
                    this.ballVelocity.y = MAX_HEIGHT_VELOCITY;
                }

                // Apply spin effect based on paddle movement
                const paddleSpeed = this.paddle.position.x - (this.previousPaddlePosition ? this.previousPaddlePosition.x : this.paddle.position.x);
                this.ballVelocity.x += paddleSpeed * SPIN_EFFECT_FACTOR; // Apply spin effect

                this.playerPaddleBounceTime = currentTime;

                // Store current paddle position
                this.previousPaddlePosition = this.paddle.position.clone();

                this.playHitSound(); // Play sound when the paddle hits the ball
            }
        }

        // Computer paddle collision
        if (this.ball.position.z <= this.computerPaddle.position.z + 0.3 &&
            this.ball.position.z >= this.computerPaddle.position.z - 0.3 &&
            this.ball.position.x >= this.computerPaddle.position.x - paddleWidth / 2 &&
            this.ball.position.x <= this.computerPaddle.position.x + paddleWidth / 2 &&
            this.ball.position.y >= this.computerPaddle.position.y - paddleHeight / 2 &&
            this.ball.position.y <= this.computerPaddle.position.y + paddleHeight / 2) {
            const currentTime = this.clock.getElapsedTime();
            if (currentTime - this.computerPaddleBounceTime > bounceDelay) {
                console.log('Computer paddle hit');
                const hitPosition = (this.ball.position.x - this.computerPaddle.position.x) / (paddleWidth / 2);
                this.ballVelocity.z = Math.abs(this.ballVelocity.z) * randomVelocityIncrement;
                this.ballVelocity.y = Math.abs(this.ballVelocity.y) * randomHeightIncrement; // Randomize height increment
                this.ballVelocity.x += hitPosition * ANGLE_ADJUSTMENT_FACTOR; // Adjust angle

                // Ensure the ball velocity in the y-direction does not exceed the maximum
                if (this.ballVelocity.y > MAX_HEIGHT_VELOCITY) {
                    this.ballVelocity.y = MAX_HEIGHT_VELOCITY;
                }

                this.computerPaddleBounceTime = currentTime;

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
            // Computer scores
            this.computerScore += 1;
            this.updateScore();
            if (this.computerScore >= 11) {
                this.showGameOverScreen();
                this.isGameStarted = false; // Reset game start flag
                this.clearPowerUpsAndObstacles(); // Clear power-ups and obstacles
            } else {
                this.resetBall(); // Reset the ball for the next round
            }
        } else if (this.ball.position.z < COMPUTER_PADDLE_BOUNDARY_Z_MIN) {
            // Player scores
            this.score += 1;
            this.updateScore();
            if (this.score >= 11) {
                this.showGameOverScreen();
                this.isGameStarted = false; // Reset game start flag
                this.clearPowerUpsAndObstacles(); // Clear power-ups and obstacles
            } else {
                this.resetBall(); // Reset the ball for the next round
            }
        }
    }

    resetBall() {
        this.ball.position.set(0, 0.4, 0); // Reset ball position to the center
        this.ballVelocity.copy(BALL_INITIAL_VELOCITY); // Reset ball velocity
    }

    resetGame() {
        this.score = 0;
        this.computerScore = 0;
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
