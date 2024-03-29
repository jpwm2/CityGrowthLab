populationPerLand = 2;
baseWage = 100
moneyPerLand = 100000;
width = 50;
height = 50;
neighborRadius = 1;


class Person{
    constructor(wage, residence){
        this.wage = wage;
        this.residence = residence;
        this.workFlag = false;
    }

    work(){
        this.workFlag = true;
    }

    reset(){
        const rate = 1.1;
        if (this.workFlag){
            this.wage *= rate; 
            this.wage = Math.round(this.wage);
            this.workFlag = false;
        }else{
            this.wage /= rate;
            this.wage = Math.round(this.wage);
        }
    }
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]; // 要素の交換
    }
    return arr;
  }
  

class Land{
    moneyStopper = 0.5;
    constructor(money){
        this.money = money;
        this.newPeople = 0;
    }

    setPeople(people){
        this.people = people;
    }

    setNeighbors(neighbors){
        this.neighbors = neighbors;
    }

    sendPerson(person, transportationExpenses){
        this.money += person.wage * transportationExpenses;     
        person.work();
    }

    receivePeople(){
        let workers = new Set();
        const commuteDistance = new Map();
        let remainingAmount = this.money;
        while (true){
            let lowestPerson = null;
            let lowestWage = Number.MAX_SAFE_INTEGER;
            for (let [distance, land] of this.neighbors.entries()){
                land.people = shuffleArray(land.people);
                for (const person of land.people){
                    if (!person.workFlag && !workers.has(person) && person.wage * distance < lowestWage){
                        lowestPerson = person;
                        lowestWage = person.wage * distance;
                        commuteDistance.set(lowestPerson, distance);
                    }
                }
                
            }
            if (lowestPerson === null) break;

            remainingAmount -= lowestWage;
            if(remainingAmount - lowestWage < this.money * this.moneyStopper){
                break;
            }else{
                remainingAmount -= lowestWage;
                workers.add(lowestPerson);
            }
        }
        for (const worker of workers){
            worker.residence.sendPerson(worker,commuteDistance.get(worker));
            this.newPeople += 1;
        }
    }

    update(){
        this.people = shuffleArray(this.people);
        if (this.newPeople > this.people.length){
            let wageAverage = 0;
            for (const person of this.people){
                wageAverage += person.wage;
                person.reset();
            }
            wageAverage /= this.people.length;
            this.marketPrice = wageAverage;
            for (let i = 0; i < this.newPeople - this.people.length; i++){
                this.people.push(new Person(this.marketPrice, this));
            }
        }else{
            this.people.length = this.newPeople;
        }

    }

}

function initializeGrid(width, height){
    let grid = [];
    for (let x = 0; x < width; x++){
        let column = [];
        for (let y = 0; y < height; y++){
            let land = new Land(moneyPerLand)
            let people = [];
            for (let i = 0; i < populationPerLand; i++){
                people.push(new Person(baseWage, land));
            }
            land.setPeople(people);
            column.push(land);
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
            let colorValueRed = ((land.people.length - minPopulation) / (maxPopulation - minPopulation)) * 255;
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
        
        // 列のインデックスをランダムに並べ替える
        let columnsOrder = [...Array(grid.length).keys()].sort(() => Math.random() - 0.5);

        for (let columnIndex of columnsOrder) {
            let column = grid[columnIndex];
            // 各列の土地のインデックスをランダムに並べ替える
            let landsOrder = [...Array(column.length).keys()].sort(() => Math.random() - 0.5);

            for (let landIndex of landsOrder) {
                let land = column[landIndex];
                land.receivePeople();
                if (land.people.length > maxPopulation) maxPopulation = land.population;
                if (land.people.length < minPopulation) minPopulation = land.population;
                if (land.money > maxMoney) maxMoney = land.money;
                if (land.money < minMoney) minMoney = land.money;
            }
        }

        let sum = 0;
        for (let columnIndex of columnsOrder) {
            let column = grid[columnIndex];
            for (let landIndex of column.map((_, i) => i)) { // この部分はランダム化の必要がありません
                let land = column[landIndex];
                land.update();
                sum += land.money;
            }
        }

        console.log(`landmoney: ${grid[4][4].money}`);
        // 描画と遅延のロジックは変更されていません
        drawGrid(grid, ctx, maxPopulation, minPopulation, maxMoney, minMoney);
        await new Promise(resolve => setTimeout(resolve, 10)); // 100ミリ秒の遅延
    }
}




let grid= initializeGrid(width, height);
simulate(grid, Infinity);