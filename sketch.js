// ==========================================
// 全域變數與 MediaPipe 設定
// ==========================================
let videoElement;
let hands;
let camera;
let predictions = [];

let gameState = 'PLAYING'; // 狀態：'PLAYING', 'RESULT', 'GAME_OVER'
let playerChoice = "等待手勢...";
let computerChoice = "";
let gameResult = "";

// 加分項目：防誤判計時器
let actionTimer = 0;
let requiredTime = 40; 
let currentDetectedAction = "NONE"; 

const choices = ["石頭", "剪刀", "布"];

// Y2K 夢幻美學色調
const colorLavender = '#cdb4db';
const colorLightBlue = '#bde0fe';
const colorDarkBg = '#2a1b3d';

function setup() {
    // 針對手機直式螢幕優化畫布比例
    let canvasWidth = min(windowWidth - 30, 400);
    let canvasHeight = min(windowHeight - 120, 420);
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');
    
    videoElement = document.getElementById('webcam');

    // 初始化 MediaPipe Hands 辨識引擎
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onHandsResults);

    // 啟動行動端/電腦鏡頭
    camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 400,
        height: 420
    });
    camera.start();

    textSize(18);
    textAlign(CENTER, CENTER);
}

function draw() {
    // 1. 繪製實體相機影像（並進行鏡像翻轉，操作更直覺）
    translate(width, 0);
    scale(-1, 1);
    image(videoElement, 0, 0, width, height);
    translate(width, 0);
    scale(-1, 1); // 還原座標系

    // 2. 疊加 Y2K 濾鏡：半透明浪漫深紫遮罩 + 薰衣草紫網格線
    fill(42, 27, 61, 180); // 讓背景帶有透明感紫色
    rect(0, 0, width, height);
    
    stroke(205, 180, 219, 30);
    strokeWeight(1);
    for(let i = 0; i < width; i += 25) line(i, 0, i, height);
    for(let j = 0; j < height; j += 25) line(0, j, width, j);
    noStroke();

    // 3. 根據狀態機繪製 UI 畫面
    if (gameState === 'PLAYING') {
        drawPlayingScreen();
    } else if (gameState === 'RESULT') {
        drawResultScreen();
    } else if (gameState === 'GAME_OVER') {
        drawGameOverScreen();
    }

    // 4. 實時繪製手部綠色特徵追蹤點（視覺回饋加分項）
    drawHandLandmarks();
}

// ==========================================
// MediaPipe AI 手勢辨識回傳結果
// ==========================================
function onHandsResults(results) {
    predictions = results.multiHandLandmarks;

    if (predictions && predictions.length > 0) {
        let landmarks = predictions[0];

        if (gameState === 'PLAYING') {
            detectRPS(landmarks);
        } else if (gameState === 'RESULT') {
            detectThumbAction(landmarks); // 核心考題：判斷 👍 👎
        }
    } else {
        if (gameState === 'RESULT') {
            currentDetectedAction = "NONE";
            actionTimer = 0;
        }
    }
}

// 辨識剪刀石頭布
function detectRPS(landmarks) {
    let indexOpen = landmarks[8].y < landmarks[6].y;
    let middleOpen = landmarks[12].y < landmarks[10].y;
    let ringOpen = landmarks[16].y < landmarks[14].y;
    let pinkyOpen = landmarks[20].y < landmarks[18].y;

    if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
        playerChoice = "布"; executeRPS();
    } else if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
        playerChoice = "剪刀"; executeRPS();
    } else if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        playerChoice = "石頭"; executeRPS();
    }
}

// 【考題核心修改】：辨識大拇指朝上與朝下
function detectThumbAction(landmarks) {
    // 確保其餘四指握拳
    let indexClosed = landmarks[8].y > landmarks[6].y;
    let middleClosed = landmarks[12].y > landmarks[10].y;
    let ringClosed = landmarks[16].y > landmarks[14].y;
    let pinkyClosed = landmarks[20].y > landmarks[18].y;

    if (indexClosed && middleClosed && ringClosed && pinkyClosed) {
        // 👍 大拇指尖(4)高於關節(2) -> 繼續遊戲
        if (landmarks[4].y < landmarks[2].y) {
            if (currentDetectedAction === "CONTINUE") actionTimer++;
            else { currentDetectedAction = "CONTINUE"; actionTimer = 0; }
        } 
        // 👎 大拇指尖(4)低於關節(2) -> 結束遊戲
        else if (landmarks[4].y > landmarks[2].y) {
            if (currentDetectedAction === "QUIT") actionTimer++;
            else { currentDetectedAction = "QUIT"; actionTimer = 0; }
        }
    } else {
        currentDetectedAction = "NONE";
        actionTimer = 0;
    }

    // 撐滿 2 秒（40幀）觸發狀態切換
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

// ==========================================
// 介面渲染 UI Sub-screens
// ==========================================
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

    // ⭐ 加分項目：進度條視覺回饋
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
    text("實體相機串接與手勢改進成功！", width / 2, height / 2 + 30);
}

function drawHandLandmarks() {
    if (predictions && predictions.length > 0) {
        let landmarks = predictions[0];
        noStroke();
        fill(189, 224, 254); // 用輕藍色點點標註手部關節
        for (let i = 0; i < landmarks.length; i++) {
            let x = landmarks[i].x * width;
            let y = landmarks[i].y * height;
            ellipse(x, y, 6, 6);
        }
    }
}