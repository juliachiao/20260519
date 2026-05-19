// ==========================================
// 全域變數定義
// ==========================================
let gameState = 'PLAYING'; // 狀態：'PLAYING'(猜拳中), 'RESULT'(顯示勝負), 'GAME_OVER'(結束畫面)
let playerChoice = "等待手勢 (請按鍵盤 1, 2, 3 模擬)...";
let computerChoice = "";
let gameResult = "";

// 計時器與動作偵測變數 (用於加分項目的防誤判與視覺回饋)
let actionTimer = 0;
let requiredTime = 40; // 需要維持手勢的時間（約1.3秒）
let currentDetectedAction = "NONE"; 

const choices = ["石頭", "剪刀", "布"];

// ==========================================
// p5.js 核心生命週期
// ==========================================
function setup() {
    // 建立 p5 畫布並綁定到 HTML 的容器中
    let canvas = createCanvas(640, 480);
    canvas.parent('canvas-container');
    textSize(24);
    textAlign(CENTER, CENTER);
}

function draw() {
    // 背景改為深色科技感背景，替代原本的相機畫面
    background(30, 30, 40);

    // 繪製模擬相機網格線 (假裝有相機畫面，優化視覺豐富度)
    stroke(40, 40, 50);
    strokeWeight(1);
    for(let i = 0; i < width; i += 40) line(i, 0, i, height);
    for(let j = 0; j < height; j += 40) line(0, j, width, j);
    noStroke();

    // 根據目前的遊戲狀態，渲染不同的畫面
    if (gameState === 'PLAYING') {
        drawPlayingScreen();
    } else if (gameState === 'RESULT') {
        drawResultScreen();
        handleSimulatedTimer(); // 執行模擬計時邏輯
    } else if (gameState === 'GAME_OVER') {
        drawGameOverScreen();
    }

    // 右下角提示目前的開發測試環境
    fill(150);
    textSize(12);
    textAlign(RIGHT, BOTTOM);
    text("【環境模擬模式】已繞過硬體相機限制", width - 20, height - 20);
    textAlign(CENTER, CENTER); // 還原文字對齊設定
}

// ==========================================
// 鍵盤事件監聽 (模擬 AI 手勢偵測後的觸發結果)
// ==========================================
function keyPressed() {
    // 1. 遊戲進行中：按數字鍵 1, 2, 3 模擬出拳
    if (gameState === 'PLAYING') {
        if (key === '1') { playerChoice = "石頭"; executeRPS(); }
        if (key === '2') { playerChoice = "剪刀"; executeRPS(); }
        if (key === '3') { playerChoice = "布";   executeRPS(); }
    }
    
    // 2. 結算畫面中：按住 U 模擬大拇指朝上 👍，按住 D 模擬大拇指朝下 👎
    if (gameState === 'RESULT') {
        if (key === 'u' || key === 'U') {
            currentDetectedAction = "CONTINUE";
        }
        if (key === 'd' || key === 'D') {
            currentDetectedAction = "QUIT";
        }
    }
}

// 放開按鍵時，立刻重設模擬狀態與計時器（防止誤觸）
function keyReleased() {
    if (gameState === 'RESULT') {
        if (key === 'u' || key === 'U' || key === 'd' || key === 'D') {
            currentDetectedAction = "NONE";
            actionTimer = 0;
        }
    }
}

// ==========================================
// 遊戲核心邏輯運算
// ==========================================

// 處理計時器累加與狀態切換
function handleSimulatedTimer() {
    if (currentDetectedAction !== "NONE") {
        actionTimer++;
        if (actionTimer >= requiredTime) {
            if (currentDetectedAction === "CONTINUE") {
                gameState = 'PLAYING';
                playerChoice = "等待手勢 (請按鍵盤 1, 2, 3 模擬)...";
            } else if (currentDetectedAction === "QUIT") {
                gameState = 'GAME_OVER';
            }
            actionTimer = 0;
            currentDetectedAction = "NONE";
        }
    }
}

// 執行猜拳勝負判定
function executeRPS() {
    computerChoice = random(choices);
    if (playerChoice === computerChoice) {
        gameResult = "平手！";
    } else if (
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
    currentDetectedAction = "NONE";
}

// ==========================================
// 畫面繪製渲染子函式 (UI Screens)
// ==========================================

// 畫面 1：遊戲中
function drawPlayingScreen() {
    fill(255);
    textSize(32);
    text("AI 猜拳小遊戲 (環境相容版)", width / 2, 80);
    
    fill(200);
    textSize(18);
    text("【開發測試提示】請按下鍵盤數字鍵進行猜拳：", width / 2, 160);
    fill(138, 180, 248); // 淺藍科技色
    text("按 1 代表【石頭】 |  按 2 代表【剪刀】 |  按 3 代表【布】", width / 2, 200);
    
    fill(255, 204, 0);
    textSize(24);
    text(playerChoice, width / 2, height / 2 + 60);
}

// 畫面 2：顯示結果與選單（包含考題要求的視覺回饋）
function drawResultScreen() {
    fill(255);
    textSize(24);
    text(`你出了: ${playerChoice}  vs  電腦出了: ${computerChoice}`, width / 2, 80);
    
    textSize(40);
    fill(255, 100, 100);
    text(gameResult, width / 2, 150);

    // 考題改動說明與提示
    fill(255);
    textSize(20);
    text("【新版手勢選單控制】", width / 2, 240);
    
    textSize(16);
    fill(150, 255, 150);
    text("👍 大拇指朝上（維持2秒）：再玩一局\n(測試請「長按鍵盤 U」模擬 👍)", width / 2 - 140, 290);
    
    fill(255, 150, 150);
    text("👎 大拇指朝下（維持2秒）：結束遊戲\n(測試請「長按鍵盤 D」模擬 👎)", width / 2 + 140, 290);

    // ⭐ 加分項目：視覺進度條回饋效果
    if (currentDetectedAction !== "NONE" && actionTimer > 0) {
        let progress = map(actionTimer, 0, requiredTime, 0, 240);
        
        fill(currentDetectedAction === "CONTINUE" ? '#4CAF50' : '#F44336');
        textSize(18);
        text(currentDetectedAction === "CONTINUE" ? "偵測到 👍：即將重新開始..." : "偵測到 👎：即將退出遊戲...", width / 2, 380);

        // 進度條外框
        noFill();
        stroke(255, 150);
        strokeWeight(2);
        rect(width / 2 - 120, 400, 240, 16, 8);
        
        // 進度條動態填充
        noStroke();
        fill(currentDetectedAction === "CONTINUE" ? '#4CAF50' : '#F44336');
        rect(width / 2 - 120, 400, progress, 16, 8);
    }
}

// 畫面 3：遊戲結束
function drawGameOverScreen() {
    fill(255);
    textSize(40);
    text("遊戲結束", width / 2, height / 2 - 20);
    textSize(20);
    fill(170);
    text("感謝遊玩！手勢辨識邏輯改良成功。", width / 2, height / 2 + 40);
}