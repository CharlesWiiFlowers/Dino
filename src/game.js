const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let dino = { x: 50, y: 190, width: 44, height: 47, dy: 0, jumping: false };
let obstacles = [];
let gravity = 1;
let gameSpeed = 6;
let score = 0;
let isPaused = false;
let questions = [];
let currentQuestion = null;
let awaitingAnswer = false;
let invincible = false;
let invincibleTimer = 0;
let lastPowerUpTime = 0;
let powerUpCooldown = 50; // frames
let flash = false;
let is_game_over = false;
let message = "";
let bgOffset = 0;

let dinoImg = new Image();
dinoImg.src = "dino.webp";
let dinoGoldImg = new Image();
dinoGoldImg.src = "dino_gold.png";
let cactusImg = new Image();
cactusImg.src = "cactus.png";
let bigCactusImg = new Image();
bigCactusImg.src = "cactus.png";
let bgImg = new Image();
bgImg.src = "bg.png"; // imagen de fondo

const restartBtn = document.getElementById("restartBtn");
const jumpSound = document.getElementById("jumpSound");
const powerLoadSound = document.getElementById("powerLoadSound");
const powerUpSound = document.getElementById("powerUpSound");
const bgMusic = document.getElementById("bgMusic");
bgMusic.volume = 0.5;

fetch("questions.json")
    .then(res => res.json())
    .then(data => {
        questions = data;
        startGame();
    })
    .catch(err => console.error("Error cargando preguntas:", err));

function startGame() {
    document.addEventListener("keydown", handleKeyDown);
    restartBtn.addEventListener("click", resetGame);
    spawnObstacle();
    setInterval(spawnObstacle, getIntervalObstacleTime());
    setInterval(spawnBigObstacle, getRandomInt(5000, 15000));
    requestAnimationFrame(update);
    bgMusic.play();
    bgMusic.volume = 0.5;
}

function resetGame() {
    obstacles = [];
    score = 0;
    gameSpeed = 6;
    isPaused = false;
    is_game_over = false;
    invincible = false;
    message = "";
    restartBtn.style.display = "none";
    bgMusic.currentTime = 0;
    bgMusic.play();
}

function handleKeyDown(e) {
    if (awaitingAnswer) {
        if (e.key === "ArrowUp") checkAnswer("yes");
        else if (e.key === "ArrowDown") checkAnswer("no");
        return;
    }

    if ((e.key === "ArrowUp" || e.key === " ") && !dino.jumping && !is_game_over) {
        jumpSound.play();
        dino.dy = -15;
        dino.jumping = true;
    }

    if (e.key === " " && !is_game_over) triggerQuestion();

    if (is_game_over && (e.key === "Enter" || e.key === " ")) {
        resetGame();
    }
}

function checkAnswer(answer) {
    if (answer === currentQuestion.answer) {
        if (score - lastPowerUpTime >= powerUpCooldown) {
            invincible = true;
            invincibleTimer = 100;
            lastPowerUpTime = score;
            powerUpSound.play();
            message = "Super Dino Activated!";
        } else {
            message = "You can't do it yet!";
        }
    } else {
        message = "Wrong answer!";
    }
    awaitingAnswer = false;
    isPaused = false;
}

function triggerQuestion() {
    if (questions.length > 0) {
        powerLoadSound.play();
        isPaused = true;
        awaitingAnswer = true;
        currentQuestion = questions[getRandomInt(0, questions.length)];
    }
}

function spawnObstacle() {
    if (!isPaused && !is_game_over) {
        obstacles.push({ x: canvas.width, y: 190, width: 50, height: 80, big: false });
    }
}

function spawnBigObstacle() {
    if (!isPaused && !is_game_over) {
        obstacles.push({ x: canvas.width, y: 190, width: 120, height: 150, big: true });
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(bgImg, -bgOffset, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, canvas.width - bgOffset, 0, canvas.width, canvas.height);
    if (!isPaused && !is_game_over) {
        bgOffset += gameSpeed;
        if (bgOffset > canvas.width) bgOffset = 0;
    }

    if (!isPaused && !is_game_over) {
        dino.y += dino.dy;
        if (dino.y < 190) dino.dy += gravity;
        else {
            dino.y = 190;
            dino.dy = 0;
            dino.jumping = false;
        }

        obstacles.forEach(o => { o.x -= gameSpeed; });

        if (!invincible) {
            obstacles.forEach(o => {
                if (dino.x < o.x + o.width && dino.x + dino.width > o.x &&
                    dino.y < o.y + o.height && dino.y + dino.height > o.y) {
                    is_game_over = true;
                    restartBtn.style.display = "block";
                }
            });
        }

        obstacles = obstacles.filter(o => o.x + o.width > 0);

        if (invincible) {
            invincibleTimer--;
            flash = !flash;
            if (invincibleTimer <= 0) invincible = false;
        } else {
            powerUpSound.pause();
            powerUpSound.currentTime = 0;
        }

        score++;
        if (score % 500 === 0) gameSpeed += 1;

        if (score - lastPowerUpTime >= powerUpCooldown) {
            message = "You can activate Super Dino!";
        } else {
            message = "";
        }

    }

    let dinoSprite = invincible ? dinoGoldImg : dinoImg;
    ctx.drawImage(dinoSprite, dino.x, dino.y - dino.height + 20, dino.width, dino.height);

    obstacles.forEach(o => {
        let img = o.big ? bigCactusImg : cactusImg;
        ctx.drawImage(img, o.x, o.y - o.height + 20, o.width, o.height);
    });

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Score: " + score, canvas.width - 10, 20);

    if (awaitingAnswer) {
        ctx.textAlign = "center";
        ctx.fillText(currentQuestion.question, canvas.width / 2, 100);
        ctx.fillText("↑ YES   ↓ NO", canvas.width / 2, 130);
    }

    if (message) {
        ctx.textAlign = "center";
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(message, canvas.width / 2, 50);
    }

    if (is_game_over) {
        ctx.textAlign = "center";
        ctx.font = "40px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(update);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getIntervalObstacleTime() {
    return getRandomInt(1500, 3000);
}
