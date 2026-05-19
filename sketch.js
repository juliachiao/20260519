// ==========================================
// 全域變數定義
// ==========================================
let gameState = 'PLAYING'; 
let playerChoice = "等待出拳...";
let computerChoice = "";
let gameResult = "";

let actionTimer = 0;
let requiredTime = 40; 
let currentDetectedAction = "NONE"; 

const choices = ["石頭", "剪刀", "布"];

// Y2K 夢幻色調定義
const colorLavender = '#cdb4db';
const colorLightBlue = '#bde0fe';
const colorDarkBg = '#2a1b3d'; 

let btnRock, btnScissors, btnPaper;
let btnThumbUp, btnThumbDown;

// ==========================================
// p5.js 核心生命週期
// ==========================================
function setup() {
    // 依據手機螢幕動態調整畫布大小
    let canvasWidth = min(windowWidth - 30, 400); // 針對手機直式螢幕優化寬度
    let canvasHeight = min(windowHeight - 160, 400);
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');
    
    // 建立觸控按鈕
    createGameButtons();
    
    textSize(18);
    textAlign(CENTER, CENTER);
}

function draw() {
    background(colorDarkBg);

    // Y2K 復古未來感網格線
    stroke(205, 180, 219, 35);
    strokeWeight(1);
    for(let i = 0; i < width; i += 25) line(i, 0, i, height);
    for(let j = 0; j < height; j += 25) line(0, j, width, j);
    noStroke();

    if (gameState === 'PLAYING') {
        showButtons(btnRock, btnScissors, btnPaper);
        hideButtons(btnThumbUp, btnThumbDown);
        drawPlayingScreen();
    } else if (gameState === 'RESULT') {
        hideButtons(btnRock, btnScissors, btnPaper);
        showButtons(btnThumbUp, btnThumbDown);
        drawResultScreen();
        handleSimulatedTimer(); 
    } else if (gameState === 'GAME_OVER') {
        hideButtons(btnRock, btnScissors, btnPaper, btnThumbUp, btnThumbDown);
        drawGameOverScreen();
    }

    // 頁尾
    fill(205, 180, 219, 120);
    textSize(10);
    text("【夢幻 Y2K 環境模擬版】已解耦硬體相機", width / 2, height - 15);
}

// ==========================================
// 介面按鈕建立與自訂樣式
// ==========================================
function createGameButtons() {
    btnRock     = createButton('✊ 石頭').mousePressed(() => { playerChoice = "石頭"; executeRPS(); });
    btnScissors = createButton('✌️ 剪刀').mousePressed(() => { playerChoice = "剪刀"; executeRPS(); });
    btnPaper    = createButton('✋ 布').mousePressed(() => { playerChoice = "布"; executeRPS(); });
    
    // 長按模擬手勢
    btnThumbUp   = createButton('👍 繼續 (按住)').mousePressed(() => { currentDetectedAction = "CONTINUE"; });
    btnThumbDown = createButton('👎 結束 (按住)').mousePressed(() => { currentDetectedAction = "QUIT"; });

    let allButtons = [btnRock, btnScissors, btnPaper, btnThumbUp, btnThumbDown];
    allButtons.forEach(btn => {
        btn.style('background-color', colorLightBlue);
        btn.style('color', '#2a1b3d');
        btn.style('border', '2px solid #cdb4db');
        btn.style('border-radius', '12px');
        btn.style('padding', '8px 12px');
        btn.style('font-weight', 'bold');
        btn.style('font-size', '14px');
        btn.style('box-shadow', '2px 2px 0px #cdb4db');
        btn.hide(); 
    });

    positionButtons();
}

function positionButtons() {
    // 取得畫布在網頁上的絕對坐標，讓按鈕完美對齊在畫布下方
    let canvasEl = document.getElementById('canvas-container');
    let rect = canvasEl.getBoundingClientRect();
    
    let centerY = rect.bottom + 15;
    
    // 依據畫布寬度動態分配按鈕間距
    btnRock.position(rect.left + (rect.width * 0.1), centerY);
    btnScissors.position(rect.left + (rect.width * 0.4), centerY);
    btnPaper.position(rect.left + (rect.width * 0.7), centerY);
    
    btnThumbUp.position(rect.left + (rect.width * 0.15), centerY);
    btnThumbDown.position(rect.left + (rect.width * 0.55), centerY);
}

function showButtons(...btns) { btns.forEach(b => b.show()); }
function hideButtons(...btns) { btns.forEach(b => b.hide()); }

function mouseReleased() {
    if (gameState === 'RESULT') {
        currentDetectedAction = "NONE";
        actionTimer = 0;
    }
}

// ==========================================
// 核心邏輯
// ==========================================
function handleSimulatedTimer() {
    if (currentDetectedAction !== "NONE") {
        actionTimer++;
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
}

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
// 畫面繪製渲染
// ==========================================
function drawPlayingScreen() {
    fill(colorLavender);
    textSize(24);
    text("⭐ AI 猜拳小遊戲 ⭐", width / 2, 60);
    
    fill('#ffffff');
    textSize(14);
    text("請點擊下方按鈕進行出拳：", width / 2, 130);
    
    fill(colorLightBlue);
    textSize(20);
    text(playerChoice, width / 2, height / 2);
}

function drawResultScreen() {
    fill('#ffffff');
    textSize(15);
    text(`你出了: ${playerChoice}  vs  電腦: ${computerChoice}`, width / 2, 60);
    
    textSize(32);
    fill('#ffb703');
    text(gameResult, width / 2, 120);

    fill(colorLavender);
    textSize(16);
    text("【新手勢選單控制】", width / 2, 190);
    textSize(12);
    fill('#ffffff');
    text("請「長按住」下方按鈕模擬手勢：", width / 2, 220);

    if (currentDetectedAction !== "NONE" && actionTimer > 0) {
        let progress = map(actionTimer, 0, requiredTime, 0, 180);
        
        fill(currentDetectedAction === "CONTINUE" ? '#b5e2fa' : '#ffb3c1');
        textSize(14);
        text(currentDetectedAction === "CONTINUE" ? "偵測到 👍 大拇指朝上..." : "偵測到 👎 大拇指朝下...", width / 2, 270);

        noFill();
        stroke(colorLavender);
        strokeWeight(2);
        rect(width / 2 - 90, 295, 180, 14, 7);
        
        noStroke();
        fill(currentDetectedAction === "CONTINUE" ? '#b5e2fa' : '#ffb3c1');
        rect(width / 2 - 90, 295, progress, 14, 7);
    }
}

function drawGameOverScreen() {
    fill(colorLavender);
    textSize(32);
    text("遊戲結束", width / 2, height / 2 - 20);
    textSize(14);
    fill('#ffffff');
    text("精美 Y2K 介面優化與手勢改良成功！", width / 2, height / 2 + 30);
}

function windowResized() {
    let canvasWidth = min(windowWidth - 30, 400);
    let canvasHeight = min(windowHeight - 160, 400);
    resizeCanvas(canvasWidth, canvasHeight);
    positionButtons();
}