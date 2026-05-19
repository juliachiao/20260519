let capture;
let handpose;
let predictions = [];

let gameState = 'PLAYING'; // 'PLAYING', 'RESULT', 'GAME_OVER'
let playerChoice = "模型載入中，請稍候...";
let computerChoice = "";
let gameResult = "";

// 考題加分項：防誤判計時器與進度條
let actionTimer = 0;
let requiredTime = 30; 
let currentDetectedAction = "NONE"; 

const choices = ["石頭", "剪刀", "布"];

// Y2K 浪漫美學配色
const colorLavender = '#cdb4db';
const colorLightBlue = '#bde0fe';

function setup() {
    let canvasWidth = min(windowWidth - 30, 400);
    let canvasHeight = min(windowHeight - 120, 420);
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');

    // 啟動 p5 原生相機並針對手機優化
    capture = createCapture(VIDEO);
    capture.size(width, height);
    capture.hide();

    // 🌟 核心修正：初始化 ml5 的 handpose 模型
    handpose = ml5.handpose(capture, () => {
        playerChoice = "等待手勢..."; // 模型載入完成提示
        console.log("ml5 Handpose Model Loaded!");
    });

    // 監聽偵測結果
    handpose.on('predict', results => {
        predictions = results;
    });

    textSize(18);
    textAlign(CENTER, CENTER);
}

function draw() {
    // 繪製相機鏡像
    translate(width, 0);
    scale(-1, 1);
    image(capture, 0, 0, width, height);
    translate(width, 0);
    scale(-1, 1); 

    // Y2K 半透明紫色濾鏡與網格
    fill(42, 27, 61, 190); 
    rect(0, 0, width, height);
    
    stroke(205, 180, 219, 35);
    strokeWeight(1);
    for(let i = 0; i < width; i += 25) line(i, 0, i, height);
    for(let j = 0; j < height; j += 25) line(0, j, width, j);
    noStroke();

    // 執行手勢辨識邏輯 (ml5 格式)
    if (predictions.length > 0) {
        let landmarks = predictions[0].landmarks; // 取得 21 個特徵點座標 [x, y, z]

        if (gameState === 'PLAYING') {
            detectRPS(landmarks);
        } else if (gameState === 'RESULT') {
            detectThumbAction(landmarks); // 核心考題：👍 👎 改良
        }
    } else {
        if (gameState === 'RESULT') {
            currentDetectedAction = "NONE";
            actionTimer = 0;
        }
    }

    // 狀態畫面渲染
    if (gameState === 'PLAYING') {
        drawPlayingScreen();
    } else if (gameState === 'RESULT') {
        drawResultScreen();
        handleTimer();
    } else if (gameState === 'GAME_OVER') {
        drawGameOverScreen();
    }

    // 畫出 ml5 的特徵點
    drawHandLandmarks();
}

// 辨識剪刀石頭布 (ml5 座標系統中，Index 0是X, 1是Y)
function detectRPS(landmarks) {
    let indexOpen  = landmarks[8][1] < landmarks[6][1];
    let middleOpen = landmarks[12][1] < landmarks[10][1];
    let ringOpen   = landmarks[16][1] < landmarks[14][1];
    let pinkyOpen  = landmarks[20][1] < landmarks[18][1];

    if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
        playerChoice = "布"; executeRPS();
    } else if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
        playerChoice = "剪刀"; executeRPS();
    } else if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        playerChoice = "石頭"; executeRPS();
    }
}

// 🎯【實作考題核心】：大拇指朝上 👍 / 朝下 👎 觸發機制
function detectThumbAction(landmarks) {
    let indexClosed  = landmarks[8][1] > landmarks[6][1];
    let middleClosed = landmarks[12][1] > landmarks[10][1];
    let ringClosed   = landmarks[16][1] > landmarks[14][1];
    let pinkyClosed  = landmarks[20][1] > landmarks[18][1];

    if (indexClosed && middleClosed && ringClosed && pinkyClosed) {
        // 大拇指尖 landmarks[4] 比 關節 landmarks[2] 高 (Y軸越小越高)
        if (landmarks[4][1] < landmarks[2][1]) {
            if (currentDetectedAction === "CONTINUE") actionTimer++;
            else { currentDetectedAction = "CONTINUE"; actionTimer = 0; }
        } 
        // 大拇指尖低於關節 -> 結束
        else if (landmarks[4][1] > landmarks[2][1]) {
            if (currentDetectedAction === "QUIT") actionTimer++;
            else { currentDetectedAction = "QUIT"; actionTimer = 0; }
        }
    } else {
        currentDetectedAction = "NONE";
        actionTimer = 0;
    }
}

function handleTimer() {
    if (actionTimer >= requiredTime) {
        if (currentDetectedAction === "CONTINUE") {
            gameState = 'PLAYING';
            playerChoice = "等待手勢...";
        } else if (currentDetectedAction === "QUIT") {
            gameState = 'GAME_OVER';
        }
        actionTimer = 0;
        currentDetectedAction = "NONE";
    }
}

function executeRPS() {
    computerChoice = random(choices);
    if (playerChoice === computerChoice) gameResult = "平手！";
    else if (
        (playerChoice === "石頭" && computerChoice === "剪刀") ||
        (playerChoice === "剪刀" && computerChoice === "布") ||
        (playerChoice === "布" && computerChoice === "石頭")
    ) {
        gameResult = "你贏了！🎉";
    } else {
        gameResult = "你輸了...😢";
    }
    gameState = 'RESULT';
    actionTimer = 0;
}

// UI 畫面繪製
function drawPlayingScreen() {
    fill(colorLavender);
    textSize(24);
    text("⭐ AI 猜拳小遊戲 ⭐", width / 2, 50);
    fill('#ffffff');
    textSize(14);
    text("請對著鏡頭比出：剪刀、石頭 或 布", width / 2, 100);
    fill(colorLightBlue);
    textSize(22);
    text(playerChoice, width / 2, height / 2);
}

function drawResultScreen() {
    fill('#ffffff');
    textSize(14);
    text(`你出了: ${playerChoice}  vs  電腦: ${computerChoice}`, width / 2, 50);
    textSize(32);
    fill('#ffb703');
    text(gameResult, width / 2, 110);

    fill(colorLavender);
    textSize(16);
    text("【新版手勢選單控制】", width / 2, 180);
    textSize(13);
    fill('#ffffff');
    text("👍 大拇指朝上：再玩一局\n👎 大拇指朝下：結束遊戲", width / 2, 215);

    if (currentDetectedAction !== "NONE" && actionTimer > 0) {
        let progress = map(actionTimer, 0, requiredTime, 0, 180);
        fill(currentDetectedAction === "CONTINUE" ? '#b5e2fa' : '#ffb3c1');
        textSize(14);
        text(currentDetectedAction === "CONTINUE" ? "👍 偵測到大拇指朝上..." : "👎 偵測到大拇指朝下...", width / 2, 280);

        noFill();
        stroke(colorLavender);
        strokeWeight(2);
        rect(width / 2 - 90, 310, 180, 14, 7);
        noStroke();
        fill(currentDetectedAction === "CONTINUE" ? '#b5e2fa' : '#ffb3c1');
        rect(width / 2 - 90, 310, progress, 14, 7);
    }
}

function drawGameOverScreen() {
    fill(colorLavender);
    textSize(32);
    text("遊戲結束", width / 2, height / 2 - 20);
    textSize(14);
    fill('#ffffff');
    text("ml5.js 影像辨識與手勢改進成功！", width / 2, height / 2 + 30);
}

function drawHandLandmarks() {
    if (predictions.length > 0) {
        let landmarks = predictions[0].landmarks;
        noStroke();
        fill(189, 224, 254); 
        for (let i = 0; i < landmarks.length; i++) {
            ellipse(landmarks[i][0], landmarks[i][1], 6, 6); // ml5 的 x, y
        }
    }
}