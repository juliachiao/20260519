let videoElement, hands, camera, predictions = [];
let gameState = 'PLAYING'; 
let playerChoice = "等待手勢...";
let computerChoice = "";
let gameResult = "";

let actionTimer = 0;
let requiredTime = 45; 
let currentDetectedAction = "NONE"; 

const choices = ["石頭", "剪刀", "布"];

// 輕紫色系調色盤
const theme = {
    bg: [243, 229, 245, 180], // 淺紫半透明
    accent: '#9d81ba',        // 主色紫
    text: '#4a148c',          // 深紫文字
    white: '#ffffff',
    progressOk: '#81c784',    // 柔和綠
    progressQuit: '#e57373'   // 柔和紅
};

let btnRock, btnScissors, btnPaper, btnThumbUp, btnThumbDown;

function setup() {
    let canvasWidth = min(windowWidth - 40, 420);
    let canvasHeight = min(windowHeight - 200, 420);
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');
    
    videoElement = document.getElementById('webcam');

    // AI 初始化
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

    camera = new Camera(videoElement, {
        onFrame: async () => { await hands.send({ image: videoElement }); },
        width: 420, height: 420
    });
    camera.start();

    createModernButtons();
}

function draw() {
    // 繪製背景視訊（鏡像）
    push();
    translate(width, 0);
    scale(-1, 1);
    image(videoElement, 0, 0, width, height);
    pop();

    // 覆蓋現代感淺紫遮罩（營造高質感氛圍）
    noStroke();
    fill(theme.bg);
    rect(0, 0, width, height);

    if (gameState === 'PLAYING') {
        showBtns(btnRock, btnScissors, btnPaper);
        hideBtns(btnThumbUp, btnThumbDown);
        drawPlayingUI();
    } else if (gameState === 'RESULT') {
        hideBtns(btnRock, btnScissors, btnPaper);
        showBtns(btnThumbUp, btnThumbDown);
        drawResultUI();
        handleLogic(); 
    } else if (gameState === 'GAME_OVER') {
        hideBtns(btnRock, btnScissors, btnPaper, btnThumbUp, btnThumbDown);
        drawGameOverUI();
    }

    drawHandMarkers();
}

function onHandsResults(results) {
    predictions = results.multiHandLandmarks;
    if (predictions && predictions.length > 0) {
        let lm = predictions[0];
        if (gameState === 'PLAYING') detectRPS(lm);
        else if (gameState === 'RESULT') detectThumb(lm);
    }
}

// 辨識邏輯保持不變 (👍/👎 改良)
function detectRPS(lm) {
    let iO = lm[8].y < lm[6].y, mO = lm[12].y < lm[10].y, rO = lm[16].y < lm[14].y, pO = lm[20].y < lm[18].y;
    if (iO && mO && rO && pO) { playerChoice = "布"; execute(); }
    else if (iO && mO && !rO && !pO) { playerChoice = "剪刀"; execute(); }
    else if (!iO && !mO && !rO && !pO) { playerChoice = "石頭"; execute(); }
}

function detectThumb(lm) {
    let closed = lm[8].y > lm[6].y && lm[12].y > lm[10].y && lm[16].y > lm[14].y && lm[20].y > lm[18].y;
    if (closed) {
        if (lm[4].y < lm[2].y) currentDetectedAction = "CONTINUE";
        else if (lm[4].y > lm[2].y) currentDetectedAction = "QUIT";
    }
}

function handleLogic() {
    if (currentDetectedAction !== "NONE") {
        actionTimer++;
        if (actionTimer >= requiredTime) {
            if (currentDetectedAction === "CONTINUE") { gameState = 'PLAYING'; playerChoice = "等待出拳..."; }
            else { gameState = 'GAME_OVER'; }
            actionTimer = 0; currentDetectedAction = "NONE";
        }
    }
}

function execute() {
    computerChoice = random(choices);
    if (playerChoice === computerChoice) gameResult = "平手";
    else if ((playerChoice === "石頭" && computerChoice === "剪刀") || (playerChoice === "剪刀" && computerChoice === "布") || (playerChoice === "布" && computerChoice === "石頭")) gameResult = "你贏了 🎉";
    else gameResult = "你輸了 😢";
    gameState = 'RESULT'; actionTimer = 0; currentDetectedAction = "NONE";
}

// UI 渲染 (現代極簡美化)
function drawPlayingUI() {
    fill(theme.text);
    textStyle(BOLD);
    textSize(24);
    text("AI 猜拳挑戰", width / 2, 60);
    
    textStyle(NORMAL);
    textSize(14);
    fill(80);
    text("請對鏡頭比出 剪刀、石頭、布", width / 2, 95);
    
    fill(theme.accent);
    textSize(20);
    text(playerChoice, width / 2, height / 2);
}

function drawResultUI() {
    fill(80);
    textSize(16);
    text(`玩家: ${playerChoice}  /  電腦: ${computerChoice}`, width / 2, 60);
    
    textStyle(BOLD);
    textSize(36);
    fill(theme.text);
    text(gameResult, width / 2, 120);

    textStyle(NORMAL);
    textSize(15);
    fill(100);
    text("下一步？請比出 👍 或 👎", width / 2, 190);

    if (currentDetectedAction !== "NONE" && actionTimer > 0) {
        let p = map(actionTimer, 0, requiredTime, 0, 200);
        let c = currentDetectedAction === "CONTINUE" ? theme.progressOk : theme.progressQuit;
        
        fill(c);
        textSize(14);
        text(currentDetectedAction === "CONTINUE" ? "繼續遊戲..." : "退出中...", width / 2, 240);

        stroke(255);
        strokeWeight(3);
        fill(240);
        rect(width / 2 - 100, 260, 200, 10, 5);
        noStroke();
        fill(c);
        rect(width / 2 - 100, 260, p, 10, 5);
    }
}

function drawGameOverUI() {
    fill(theme.text);
    textSize(32);
    textStyle(BOLD);
    text("遊戲結束", width / 2, height / 2 - 20);
    textSize(14);
    textStyle(NORMAL);
    fill(100);
    text("手勢辨識改良成功 · 輕盈紫介面", width / 2, height / 2 + 25);
}

function drawHandMarkers() {
    if (predictions && predictions.length > 0) {
        let lm = predictions[0];
        for (let i = 0; i < lm.length; i++) {
            fill(255);
            stroke(theme.accent);
            strokeWeight(1);
            ellipse(lm[i].x * width, lm[i].y * height, 5, 5);
        }
    }
}

// 按鈕現代化樣式美化
function createModernButtons() {
    btnRock = createButton('✊ 石頭');
    btnScissors = createButton('✌️ 剪刀');
    btnPaper = createButton('✋ 布');
    btnThumbUp = createButton('👍 繼續');
    btnThumbDown = createButton('👎 結束');

    let btns = [btnRock, btnScissors, btnPaper, btnThumbUp, btnThumbDown];
    btns.forEach(b => {
        b.style('background-color', '#ffffff');
        b.style('color', '#5e35b1');
        b.style('border', 'none');
        b.style('border-radius', '50px');
        b.style('padding', '12px 20px');
        b.style('font-weight', '600');
        b.style('box-shadow', '0 4px 10px rgba(0,0,0,0.05)');
        b.hide();
    });

    btnRock.mousePressed(() => { playerChoice = "石頭"; execute(); });
    btnScissors.mousePressed(() => { playerChoice = "剪刀"; execute(); });
    btnPaper.mousePressed(() => { playerChoice = "布"; execute(); });
    btnThumbUp.mousePressed(() => { currentDetectedAction = "CONTINUE"; });
    btnThumbDown.mousePressed(() => { currentDetectedAction = "QUIT"; });

    posBtns();
}

function posBtns() {
    let r = document.getElementById('canvas-container').getBoundingClientRect();
    let y = r.bottom + 20;
    btnRock.position(r.left + (r.width * 0.05), y);
    btnScissors.position(r.left + (r.width * 0.38), y);
    btnPaper.position(r.left + (r.width * 0.72), y);
    btnThumbUp.position(r.left + (r.width * 0.15), y);
    btnThumbDown.position(r.left + (r.width * 0.55), y);
}

function showBtns(...bs) { bs.forEach(b => b.show()); }
function hideBtns(...bs) { bs.forEach(b => b.hide()); }

function mouseReleased() { if (gameState === 'RESULT') { currentDetectedAction = "NONE"; actionTimer = 0; } }

function windowResized() {
    let canvasWidth = min(windowWidth - 40, 420);
    let canvasHeight = min(windowHeight - 200, 420);
    resizeCanvas(canvasWidth, canvasHeight);
    posBtns();
}