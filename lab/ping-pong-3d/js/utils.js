function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function loadSounds() {
    const hitSound = new Audio('/sounds/hit.mp3');
    // const scoreSound = new Audio('/sounds/score.mp3'); // Removed
    return { hitSound };
}
