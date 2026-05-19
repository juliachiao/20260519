// ==========================================
// 全域變數與 MediaPipe 設定
// ==========================================
let videoElement;
let hands;
let camera;
let predictions = [];

let gameState = 'PLAYING'; // 'PLAYING', 'RESULT', 'GAME_OVER'
let playerChoice = "等待出拳...";
let computerChoice = "";
let gameResult = "";

// 防誤判計時器（加分項目）
let actionTimer = 0;
let requiredTime = 45; // 穩定維持手勢約 1.5 秒
let currentDetectedAction = "NONE"; 

const choices = ["石頭", "剪刀", "布"];

// Y2K 夢幻美學色彩
const colorLavender = '#cdb4db';
const colorLightBlue = '#bde0fe';

function setup() {
    // 建立最適合手機與電腦網頁的畫布比例
    let canvasWidth = min(windowWidth - 20, 640);
    let canvasHeight = min(windowHeight - 40, 480);
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');

    videoElement = document.getElementById('webcam');

    // 初始化 MediaPipe Hands 辨識核心
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.75, // 提高信心度，幾乎不誤判 (加分項)
        minTrackingConfidence: 0.6
    });

    hands.onResults(onHandsResults);

    // 啟動實體相機串流
    camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480
    });
    camera.start();

    textSize(20);
    textAlign(CENTER, CENTER);
}

function draw() {
    // 1. 鏡像繪製相機視訊，讓手機操作更直覺
    translate(width, 0);
    scale(-1, 1);
    image(videoElement, 0, 0, width, height);
    translate(width, 0);
    scale(-1, 1);

    // 2. 疊加 Y2K 半透明薰衣草紫微光遮罩，優化文字可讀性
    background(42, 27, 61, 180);

    // 3. 繪製 Y2K 霓虹網格線
    stroke(205, 180, 219, 30);
    strokeWeight(1);
    for(let i = 0; i < width; i += 30) line(i, 0, i, height);
    for(let j = 0; j < height; j += 30) line(0, j, width, j);
    noStroke();

    // 根據狀態渲染 UI
    if (gameState === 'PLAYING') {
        drawPlayingScreen();
    } else if (gameState === 'RESULT') {
        drawResultScreen();
    } else if (gameState === 'GAME_OVER') {
        drawGameOverScreen();
    }

    // 繪製手部關節點 (視覺回饋，讓老師看見科技感)
    drawHandLandmarks();
}

// ==========================================
// MediaPipe 實體手勢偵測邏輯
// ==========================================
function onHandsResults(results) {
    predictions = results.multiHandLandmarks;

    if (predictions && predictions.length > 0) {
        let landmarks = predictions[0];

        if (gameState === 'PLAYING') {
            detectRealRPS(landmarks);
        } else if (gameState === 'RESULT') {
            detectRealThumbAction(landmarks);
        }
    } else {
        currentDetectedAction = "NONE";
        actionTimer = 0;
    }
}

// 實體辨識：剪刀石頭布
function detectRealRPS(landmarks) {
    let indexOpen  = landmarks[8].y < landmarks[6].y;
    let middleOpen = landmarks[12].y < landmarks[10].y;
    let ringOpen   = landmarks[16].y < landmarks[14].y;
    let pinkyOpen  = landmarks[20].y < landmarks[18].y;

    if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
        playerChoice = "布";
        executeRPS();
    } else if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
        playerChoice = "剪刀";
        executeRPS();
    } else if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        playerChoice = "石頭";
        executeRPS();
    }
}

// 【考題核心方案 A】實體辨識：大拇指朝上/朝下
function detectRealThumbAction(landmarks) {
    let indexClosed  = landmarks[8].y > landmarks[6].y;
    let middleClosed = landmarks[12].y > landmarks[10].y;
    let ringClosed   = landmarks[16].y > landmarks[14].y;
    let pinkyClosed  = landmarks[20].y > landmarks[18].y;

    // 四指握拳狀態下
    if (indexClosed && middleClosed && ringClosed && pinkyClosed) {
        if (landmarks[4].y < landmarks[2].y) { // 👍 大拇指朝上
            if (currentDetectedAction === "CONTINUE") actionTimer++;
            else { currentDetectedAction = "CONTINUE"; actionTimer = 0; }
        } else if (landmarks[4].y > landmarks[2].y) { // 👎 大拇指朝下
            if (currentDetectedAction === "QUIT") actionTimer++;
            else { currentDetectedAction = "QUIT"; actionTimer = 0; }
        }
    } else {
        currentDetectedAction = "NONE";
        actionTimer = 0;
    }

    // 滿足計時，觸發狀態切換
    if (actionTimer >= requiredTime) {
        if (currentDetectedAction === "CONTINUE") {
            gameState = 'PLAYING';
            playerChoice = "等待出拳...";
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
// 介面優化與畫布內部排版 (往上移優化)
// ==========================================
function drawPlayingScreen() {
    fill(colorLavender);
    textSize(24);
    text("⭐ AI 猜拳小遊戲 (實體手勢版) ⭐", width / 2, 50);
    
    // 把原本左下角的提示直接渲染到畫布上半部 (優化排版)
    fill(255);
    textSize(14);
    text("請對鏡頭比出： ✊ 石頭 | ✌️ 剪刀 | ✋ 布", width / 2, 110);
    
    // 渲染三個精美裝飾框取代外部按鈕
    drawY2KBadge("✊ 石頭", width/2 - 100, 150);
    drawY2KBadge("✌️ 剪刀", width/2, 150);
    drawY2KBadge("✋ 布", width/2 + 100, 150);

    fill(colorLightBlue);
    textSize(22);
    text(`偵測狀態: ${playerChoice}`, width / 2, height / 2 + 60);
}

function drawResultScreen() {
    fill('#ffffff');
    textSize(16);
    text(`你出了: ${playerChoice}  vs  電腦: ${computerChoice}`, width / 2, 50);
    
    textSize(34);
    fill('#ffb703');
    text(gameResult, width / 2, 110);

    fill(colorLavender);
    textSize(16);
    text("【方案 A 選單控制】", width / 2, 180);
    
    // 提示手勢圖示移到上方
    drawY2KBadge("👍 繼續下一局", width/2 - 90, 230);
    drawY2KBadge("👎 結束遊戲", width/2 + 90, 230);

    // ⭐ 加分項目：動態進度條
    if (currentDetectedAction !== "NONE" && actionTimer > 0) {
        let progress = map(actionTimer, 0, requiredTime, 0, 220);
        fill(currentDetectedAction === "CONTINUE" ? '#b5e2fa' : '#ffb3c1');
        textSize(14);
        text(currentDetectedAction === "CONTINUE" ? "👍 偵測到大拇指朝上..." : "👎 偵測到大拇指朝下...", width / 2, 300);

        noFill();
        stroke(colorLavender);
        strokeWeight(2);
        rect(width / 2 - 110, 330, 220, 14, 7);
        
        noStroke();
        fill(currentDetectedAction === "CONTINUE" ? '#b5e2fa' : '#ffb3c1');
        rect(width / 2 - 110, 330, progress, 14, 7);
    }
}

function drawGameOverScreen() {
    fill(colorLavender);
    textSize(36);
    text("遊戲結束", width / 2, height / 2 - 20);
    textSize(15);
    fill('#ffffff');
    text("方案 A 實體手勢改良成功！請關閉網頁。", width / 2, height / 2 + 30);
}

// 繪製 Y2K 風格的精美裝飾框 (置中上移優化)
function drawY2KBadge(txt, x, y) {
    push();
    rectMode(CENTER);
    fill(189, 224, 254, 220); // colorLightBlue
    stroke('#cdb4db');
    strokeWeight(1.5);
    rect(x, y, 85, 32, 8);
    
    noStroke();
    fill('#2a1b3d');
    textSize(12);
    text(txt, x, y);
    pop();
}

function drawHandLandmarks() {
    if (predictions && predictions.length > 0) {
        let landmarks = predictions[0];
        noStroke();
        fill(colorLightBlue);
        for (let i = 0; i < landmarks.length; i++) {
            let x = landmarks[i].x * width;
            let y = landmarks[i].y * height;
            ellipse(x, y, 6, 6); // 繪製骨架點
        }
    }
}

function windowResized() {
    let canvasWidth = min(windowWidth - 20, 640);
    let canvasHeight = min(windowHeight - 40, 480);
    resizeCanvas(canvasWidth, canvasHeight);
}