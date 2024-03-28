populationPerLand = 1;
moneyPerLand = 100000;
reward = 100;
width = 50;
height = 50;
neighborRadius = 1;
policy = policyAdjust2;




class Land{
    constructor(population, money, reward, policy){
        this.population = population;
        this.money = money;
        this.reward = reward;
        this.policy = policy;
        this.numTransactions = 0;
        this.newPopulation = 0;
        this.newMoney = 0;
    }

    setNeighbors(neighbors){
        this.neighbors = neighbors;
    }

    sendPeople(){
        let highestReward = 0;
        let bestLands = [];
        for (let neighbor of this.neighbors) {
            if (neighbor.reward > highestReward) {
                highestReward = neighbor.reward;
                bestLands = [neighbor]; // 新しい最高報酬の土地を見つけたら、bestLands配列をリセットしてその土地だけを含める
            } else if (neighbor.reward === highestReward) {
                bestLands.push(neighbor); // 同じ最高報酬を提供する別の土地を見つけたら、その土地も配列に追加
            }
        }
        if (bestLands.length > 0) {
            const randomIndex = Math.floor(Math.random() * bestLands.length); // bestLands配列からランダムに選択するためのインデックス
            const bestLand = bestLands[randomIndex];
            bestLand.receivePeople(this.population);
            this.newMoney += highestReward;
        }
    }

    receivePeople(numPeople){
        this.numTransactions += 1;
        this.newPopulation += numPeople;
        this.newMoney -= this.reward;
    }

    update(){
        this.population = this.newPopulation;
        this.newPopulation = 0;
        this.money += this.newMoney;
        this.reward = policy(this.reward, this.numTransactions, this.money);
        this.numTransactions = 0;
        this.newMoney = 0;
    }

}

function policyAdjust1(reward, numTransactions){
    let increaseRate = 1.1
    let numOfNeighbors = 9
    for (let i = 1 ; i <= neighborRadius; i++){
        numOfNeighbors += 8 * i;
    }
    if (numTransactions > numOfNeighbors/2){
        reward /= increaseRate;
    }else{
        reward *= increaseRate;
    }
    return reward
}

function policyAdjust2(reward, numTransactions, money){
    let increaseRate = 1.1
    let numOfNeighbors = 1
    for (let i = 1 ; i <= neighborRadius; i++){
        numOfNeighbors += 8 * i;
    }

    if (numTransactions > numOfNeighbors/2){
        reward /= increaseRate;
    }else{
        reward *= increaseRate;
    }
    if (reward * numOfNeighbors >= money){
        reward = money / numOfNeighbors;
        reward = Math.floor(reward);
    }else{
        reward = Math.round(reward);
    }
    /*
    if (reward < 0){
        console.log('ok')
        while (true){
            console.log('whathappend');
        }
    }
    */
    return reward
}

function initializeGrid(width, height){
    let grid = [];
    for (let x = 0; x < width; x++){
        let column = [];
        for (let y = 0; y < height; y++){
            let land = new Land(populationPerLand, moneyPerLand, reward, policy)
            column.push(land)
        }
        grid.push(column);
    }

    for (let x= 0; x < width; x++){
        for (let y = 0; y < height; y++){
            let neighbors = [];
            for (let dx = -1; dx <= 1; dx++){
                for (let dy = -1; dy <= 1; dy++){
                    let nx = x + dx;
                    let ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        neighbors.push(grid[nx][ny]);
                    }
                }
            }
            grid[x][y].setNeighbors(neighbors);
        }
    }
    return grid;
}

function drawGrid(grid, ctx, maxPopulation, minPopulation, maxMoney, minMoney) {
    let width = grid.length;
    let height = grid[0].length;
    let cellWidth = ctx.canvas.width / width;
    let cellHeight = ctx.canvas.height / height;

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let land = grid[x][y];
            // 人口に基づいた赤色の強度を計算
            let colorValueRed = ((land.population - minPopulation) / (maxPopulation - minPopulation)) * 255;
            // お金に基づいた緑色の強度を計算
            let colorValueGreen = ((land.money - minMoney) / (maxMoney - minMoney)) * 255;
            ctx.fillStyle = `rgb(${Math.round(colorValueRed)}, ${Math.round(colorValueGreen)}, 0)`;
            ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
    }
}

async function simulate(grid, turns) {
    let ctx = document.getElementById('cityCanvas').getContext('2d');

    for (let turn = 0; turn < turns; turn++) {
        let maxPopulation = 0, minPopulation = Number.MAX_SAFE_INTEGER;
        let maxMoney = 0, minMoney = Number.MAX_SAFE_INTEGER;
        for (let column of grid) {
            for (let land of column) {
                land.sendPeople();
                if (land.population > maxPopulation) maxPopulation = land.population;
                if (land.population < minPopulation) minPopulation = land.population;
                if (land.money > maxMoney) maxMoney = land.money;
                if (land.money < minMoney) minMoney = land.money;
            }
        }
        let sum = 0;
        for (let column of grid) {
            for (let land of column) {
                land.update();
                sum += land.money;
            }
        }
        console.log(`landmoney: ${grid[4][4].money}`);
        //console.log(`landReward: ${grid[4][4].reward}`);
        //console.log(`Max Population: ${maxPopulation}, Min Population: ${minPopulation}`);
        //console.log(`Max Money: ${maxMoney}, Min Money: ${minMoney}`);
        drawGrid(grid, ctx, maxPopulation, minPopulation, maxMoney, minMoney);
        await new Promise(resolve => setTimeout(resolve, 10)); // 100ミリ秒の遅延
    }
}



let grid= initializeGrid(width, height);
simulate(grid, Infinity);