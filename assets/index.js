var getIntersectionArray = function(){
    var i = 1, j = 0;
    var res = arguments[0].slice();
    res = removeArrayDuplicates(res);
    var tgt = [];
    while(i < arguments.length){
        tgt = arguments[i++].slice();
        j = 0;
        while(j < res.length){
            if(tgt.indexOf(res[j])>=0)
                j++;
            else
                res.splice(j, 1);
        }
    }
    return res;
};

var getUnionArray = function(){
    var i = 1, j = 0;
    var res = arguments[0].slice();
    res = removeArrayDuplicates(res);
    var tgt = [];
    while(i < arguments.length){
        tgt = arguments[i++].slice();
        j = 0;
        while(j < tgt.length){
            if(res.indexOf(tgt[j])>=0)
                j++;
            else
                res.push(tgt[j]);
        }
    }
    return res;
};

function calcBlokPos(i){ return (i - (i % 3)) / 3; }

function usedNumsInBlock(br, bc, nums){
    var used = [];
    for(let i = br * 3; i < br * 3 + 3; i++)
        for(let j = bc * 3; j < bc * 3 + 3; j++)
            if(nums[i][j] != 0) used.push(nums[i][j]);
    return used;
}

function usedNumsInRow(r, nums){
    var used = [];
    for(let i = 0; i < 9; i++)
        if(nums[r][i] != 0) used.push(nums[r][i]);
    return used;
}

function usedNumsInCol(c, nums){
    var used = [];
    for(let i = 0; i < 9; i++)
        if(nums[i][c] != 0) used.push(nums[i][c]);
    return used;
}

function blankCellsInBlock(br, bc, nums){
    var blankCells = [];
    for(let i = br * 3; i < br * 3 + 3; i++)
        for(let j = bc * 3; j < bc * 3 + 3; j++)
            if(isNaN(nums[i][j])) blankCells.push({r:i,c:j});
    return blankCells;
}

function removeCandidateFromCell(r, c, num, nums, msg, flag, status){
    if (Array.isArray(nums[r][c]) && (nums[r][c]).indexOf(num) != -1){
        (nums[r][c]).splice((nums[r][c]).indexOf(num), 1);
        flag.rerun = true;
        console.debug("Apply (" + r + "," + c + ") ≠ " + num + " by " + msg);
        if((nums[r][c]).length == 1){
            console.debug("Fill (" + r + "," + c + ") = " + nums[r][c][0] + " by " + msg);
            nums[r][c] = nums[r][c][0];
            status.unknowns--;
            return true;
        }
    }
    return false;
}

function checkCell(r, c, nums, flag){
    // ブロック内チェック
    var br = calcBlokPos(r);
    var bc = calcBlokPos(c);
    var used = usedNumsInBlock(br, bc, nums);
    // 横チェック
    usedNumsInRow(r, nums).forEach(function(num){
        if(used.indexOf(num) == -1) used.push(num);
    });
    // 縦チェック
    usedNumsInCol(c, nums).forEach(function(num){
        if(used.indexOf(num) == -1) used.push(num);
    });
    // 他の8つが使用済みなら確定
    var ret = [];
    (nums[r][c]).forEach(function(num){
        if(used.indexOf(num) == -1) ret.push(num);
    });
    if(ret.length != (nums[r][c]).length) flag.rerun = true;
    return ret.length == 1 ? ret[0] : ret;
}

function checkBlock(br, bc, nums, status){
    const used = usedNumsInBlock(br, bc, nums);
    const usedInRow = getUnionArray(usedNumsInBlock(br, 0, nums), usedNumsInBlock(br, 1, nums), usedNumsInBlock(br, 2, nums));
    const usedInCol = getUnionArray(usedNumsInBlock(0, bc, nums), usedNumsInBlock(1, bc, nums), usedNumsInBlock(2, bc, nums));

    // 空白セルを検索
    var blankCells = blankCellsInBlock(br, bc, nums);
    // 対象値を検索・処理
    for(let num = 1; num <= 9; num++){
        if(used.indexOf(num) == -1){
            var availableCells = [];
            blankCells.forEach(function(pos){
                if((nums[pos.r][pos.c]).indexOf(num) != -1)
                    availableCells.push(pos);
            });
            if(availableCells.length == 1){
                nums[availableCells[0].r][availableCells[0].c] = num;
                status.unknowns--;
                console.debug("Fill (" + availableCells[0].r + "," + availableCells[0].c + ") = " + num + " by checkBlock - One Possible Cell in block(" + br + "," + bc + ")");
                return true;
            }else{
                // ブロック内である数字の候補セルが1行/列に並んだ時に、他ブロックの同じ行/列からその数字を除く
                let rs = [], cs = [];
                availableCells.forEach(function(pos){
                    if(rs.indexOf(pos.r) == -1) rs.push(pos.r);
                    if(cs.indexOf(pos.c) == -1) cs.push(pos.c);
                });
                let flag = {rerun: false};
                if(rs.length == 1){
                    const msg = "checkBlock - Row Line Reserve (row: " + rs[0] + ", block: (" + br + "," + bc + "))";
                    for (let i = 0; i < 9; i++){
                        if (i < bc * 3 || (bc * 3) + 3 <= i)
                            removeCandidateFromCell(rs[0], i, num, nums, msg, flag, status);
                    }
                }
                if(flag.rerun) return true;
                if(cs.length == 1){
                    const msg = "checkBlock - Col Line Reserve (col: " + cs[0] + ", block: (" + br + "," + bc + "))";
                    for (let i = 0; i < 9; i++){
                        if (i < br * 3 || (br * 3) + 3 <= i)
                            removeCandidateFromCell(i, cs[0], num, nums, msg, flag, status);
                    }
                }
                if(flag.rerun) return true;

                // 行または列に並んだ他のブロックにより、ブロック内のある数字の取り得る行または列が制限されないか確認
                if(usedInRow.indexOf(num) == -1){
                    let ers = [];
                    for(let j = 0; j < 9; j++){
                        if (bc * 3 <= j && j < (bc * 3) + 3) continue;
                        for(let i = br * 3; i < br * 3 + 3; i++)
                            if(Array.isArray(nums[i][j]) && (nums[i][j]).indexOf(num) != -1 && ers.indexOf(i) == -1)
                                ers.push(i);
                    }
                    if(ers.length == 2){
                        const msg = "Blocks Line in Row (num: " + num + ", br: " + br + ", bc: " + bc + ", ers: " + String(ers) + ")";
                        for (let r = br * 3; r < br * 3 + 3; r++){
                            if (ers.indexOf(r) == -1) continue;
                            for (let c = bc * 3; c < bc * 3 + 3; c++)
                                removeCandidateFromCell(r, c, num, nums, msg, flag, status);
                        }
                        if(flag.rerun) return true;
                    }
                }
                if(usedInCol.indexOf(num) == -1){
                    let ecs = [];
                    for(let i = 0; i < 9; i++){
                        if (br * 3 <= i && i < (br * 3) + 3) continue;
                        for(let j = bc * 3; j < bc * 3 + 3; j++)
                            if(Array.isArray(nums[i][j]) && (nums[i][j]).indexOf(num) != -1 && ecs.indexOf(j) == -1)
                                ecs.push(j);
                    }
                    if(ecs.length == 2){
                        const msg = "Blocks Line in Col (num: " + num + ", br: " + br + ", bc: " + bc + ", ecs: " + String(ecs) + ")";
                        for (let c = bc * 3; c < bc * 3 + 3; c++){
                            if (ecs.indexOf(c) == -1) continue;
                            for (let r = br * 3; r < br * 3 + 3; r++)
                                removeCandidateFromCell(r, c, num, nums, msg, flag, status);
                        }
                        if(flag.rerun) return true;
                    }
                }
            }
        }
    }

    return false;
}

function checkRow(r, nums){
    var used = usedNumsInRow(r, nums);
    // 空白セルを検索
    var blankCellsCol = [];
    for(let i = 0; i < 9; i++)
        if(isNaN(nums[r][i])) blankCellsCol.push(i);
    // 対象値を検索・処理
    for(let num = 1; num <= 9; num++){
        if(used.indexOf(num) == -1){
            var availableCellsCol = [];
            blankCellsCol.forEach(function(c){
                if((nums[r][c]).indexOf(num) != -1)
                    availableCellsCol.push(c);
            });
            if(availableCellsCol.length == 1){
                nums[r][availableCellsCol[0]] = num;
                console.debug("Fill (" + r + "," + availableCellsCol[0] + ") = " + num + " by checkRow (row: " + r + ")");
                return true;
            }
        }
    }
    return false;
}

function checkCol(c, nums){
    var used = usedNumsInCol(c, nums);
    // 空白セルを検索
    var blankCellsRow = [];
    for(let i = 0; i < 9; i++)
        if(isNaN(nums[i][c])) blankCellsRow.push(i);
    // 対象値を検索・処理
    for(let num = 1; num <= 9; num++){
        if(used.indexOf(num) == -1){
            var availableCellsRow = [];
            blankCellsRow.forEach(function(r){
                if((nums[r][c]).indexOf(num) != -1)
                    availableCellsRow.push(r);
            });
            if(availableCellsRow.length == 1){
                nums[availableCellsRow[0]][c] = num;
                console.debug("Fill (" + availableCellsRow[0] + "," + c + ") = " + num + " by checkCol (col: " + c + ")");
                return true;
            }
        }
    }
    return false;
}

function removeArrayDuplicates(array) {
    return array.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    });
}

function availableCellsForNum(num, areaAddrs, nums){
    let addrs = [];
    areaAddrs.forEach(addr => {
        if(Array.isArray(nums[addr.r][addr.c]) && (nums[addr.r][addr.c]).indexOf(num) != -1)
            addrs.push(addr);
    });
    return addrs;
}

function searchReserve(bNum, bTargetNums, bIntAddrs, bUniAddrs, tree, areaAddrs, flag, areaAddrLen, nums, status){
    for (let num = bNum + 1; num <= 9; num++){
        let tgtNums = bTargetNums.slice();
        tgtNums.push(num);
        const numAddrs = availableCellsForNum(num, areaAddrs, nums);
        if(numAddrs.length == 0) continue;
        const intAddrs = getIntersectionArray(bIntAddrs, numAddrs);
        const uniAddrs = getUnionArray(bUniAddrs, numAddrs);
        let domAddrs = [];
        intAddrs.forEach(addr => {
            if ((nums[addr.r][addr.c]).length == tree) domAddrs.push(addr);
        });
        if(domAddrs.length == tree){
            const msg = "D-Reserve (Count: " + tree + ", Nums: [" + tgtNums.toString() + "], Addresses: " + flag.way + "[" + displayAddrs(domAddrs) + "])";
            let res = false;
            areaAddrs.some(addr => {
                if(domAddrs.indexOf(addr) != -1 || !Array.isArray(nums[addr.r][addr.c])) return false;
                res = tgtNums.some(tgtNum => {
                    if (removeCandidateFromCell(addr.r, addr.c, tgtNum, nums, msg, flag, status)) return true;
                }) ? true : res;
            });
            if(flag.rerun) return res;
        }else if(uniAddrs.length == tree){
            const msg = "U-Reserve (Count: " + tree + ", Nums: [" + tgtNums.toString() + "], Addresses: " + flag.way + "[" + displayAddrs(uniAddrs) + "])";
            let res = false;
            areaAddrs.some(addr => {
                if(uniAddrs.indexOf(addr) == -1) return false;
                res = (nums[addr.r][addr.c]).some(tnum => {
                    if(tgtNums.indexOf(tnum) == -1 && removeCandidateFromCell(addr.r, addr.c, tnum, nums, msg, flag, status)) return true;
                }) ? true : res;
            });
            if(flag.rerun) return res;
        }else if(tree + 1 < areaAddrLen){
            if (searchReserve(num, tgtNums, intAddrs, uniAddrs, tree + 1, areaAddrs, flag, areaAddrLen, nums, status)) return true;
        }
    }
    return false;
}

function checkReserveInNums(areaAddrs, flag, areaAddrsLen, nums, status){
    for (let num1 = 1; num1 <= 9; num1++){ // キーとなる数値
        const num1Addrs = availableCellsForNum(num1, areaAddrs, nums);
        if(num1Addrs.length == 0) continue;
        const tgtNums1 = [num1];
        if (searchReserve(num1, tgtNums1, num1Addrs, num1Addrs, 2, areaAddrs, flag, areaAddrsLen, nums, status)) return true;
    }
    return false;
}

function checkReserveInBlock(br, bc, nums, flag, status){
    let areaAddrs = [];
    let areaAddrsLen = 0;
    for(let i = br * 3; i < br * 3 + 3; i++){
        for(let j = bc * 3; j < bc * 3 + 3; j++){
            areaAddrs.push({r:i,c:j});
            if(isNaN(nums[i][j])) areaAddrsLen++;
        }
    }
    return areaAddrsLen > 2 ? checkReserveInNums(areaAddrs, flag, areaAddrsLen, nums, status) : false;
}

function checkReserveInRow(r, nums, flag, status){
    let areaAddrs = [];
    let areaAddrsLen = 0;
    for(let i = 0; i < 9; i++){
        areaAddrs.push({r:r,c:i});
        if(isNaN(nums[r][i])) areaAddrsLen++;
    }
    return areaAddrsLen > 2 ? checkReserveInNums(areaAddrs, flag, areaAddrsLen, nums, status) : false;
}

function checkReserveInCol(c, nums, flag, status){
    let areaAddrs = [];
    let areaAddrsLen = 0;
    for(let i = 0; i < 9; i++){
        areaAddrs.push({r:i,c:c});
        if(isNaN(nums[i][c])) areaAddrsLen++;
    }
    return areaAddrsLen > 2 ? checkReserveInNums(areaAddrs, flag, areaAddrsLen, nums, status) : false;
}

function checkXWing(num, nums, status){
    let rows = [], cols = [];
    for(let i = 0; i < 9; i++){
        rows[i] = [];
        cols[i] = [];
        for(let j = 0; j < 9; j++){
            if (Array.isArray(nums[i][j]) && (nums[i][j]).indexOf(num) != -1)
                (rows[i]).push(j);
            if (Array.isArray(nums[j][i]) && (nums[j][i]).indexOf(num) != -1)
                (cols[i]).push(j);
        }
    }
    for (let i = 2; i < 9; i++) // i の MAX で、X-Wing の深度を設定可能
        for (let j = 0; j < 9; j++)
            if (searchXwing(j, i, 1, [], rows, nums, num, true, status)
                || searchXwing(j, i, 1, [], cols, nums, num, false, status)) return true;
    return false;
}

function searchXwing(key, limits, tree, tgts, lines, nums, num, isRow, status){
    if ((lines[key]).length == 0) return false;
    let nTargets = tgts.slice();
    nTargets.push(key);
    let addrs = [];
    nTargets.forEach(function(i){
        addrs = getUnionArray(addrs, lines[i]);
    });
    if(tree == limits && addrs.length == limits){
        let res = false;
        const msg = "X-Wing (Num: " + num + ", Count: " + limits + ", Possibles: [" + addrs.toString() + "], Targets: " + (isRow ? "row" : "col") + "[" + nTargets.toString() + "])";
        for(let k = 0; k < 9; k++){
            if(nTargets.indexOf(k) != -1) continue; // X-Wing 対象行/列は除く
            for (let l = 0; l < addrs.length; l++){
                let flag = {rerun: false};
                if (isRow)
                    removeCandidateFromCell(k, addrs[l], num, nums, msg, flag, status);
                else
                    removeCandidateFromCell(addrs[l], k, num, nums, msg, flag, status);
                if (flag.rerun) res = true;
            }
        }
        return res;
    }else{
        for (let i = key + 1; i < 9; i++)
            if (searchXwing(i, limits, tree + 1, nTargets, lines, nums, num, isRow, status)) return true;
    }
    return false;
}

function humanSolve(nums, status, extFlag, tree){
    while(status.unknowns > 0){
        const prevunknowns = status.unknowns;
        // セル主体検索（最優先でこれを使う）
        let flag = {rerun: false};
        for(let i = 0; i < 9; i++){
            for(let j = 0; j < 9; j++){
                if(isNaN(nums[i][j])){
                    nums[i][j] = checkCell(i, j, nums, flag);
                    if(!Array.isArray(nums[i][j])){
                        console.debug("Fill ("+i+","+j+") = " + nums[i][j] + " by checkCell - One Possible Num in Cell");
                        status.unknowns--;
                    }else if((nums[i][j]).length == 0){
                        extFlag.hasNull = true;
                        console.error("Error! (" + i + "," + j + ")");
                        return false;
                    }
                }
            }
        }
        if(status.unknowns < prevunknowns || flag.rerun) continue;
        // ブロック主体検索（一つでもこれで埋めたら↑に戻って処理）
        flag = false;
        for(let i = 0; i < 3; i++){
            for(let j = 0; j < 3; j++){
                if (checkBlock(i, j, nums, status)){
                    flag = true;
                    break;
                }
            }
            if(flag) break;
        }
        if(flag) continue;
        // 行主体検索
        for(let i = 0; i < 9; i++)
            if(checkRow(i, nums)) status.unknowns--;
        if(status.unknowns < prevunknowns) continue;
        // 列主体検索
        for(let i = 0; i < 9; i++)
            if(checkCol(i, nums)) status.unknowns--;
        if(status.unknowns < prevunknowns) continue;
        // ブロック内予約検索
        if($('input[name="reserve"]').prop('checked')){
            flag = { rerun: false, way: 'block' };
            for(let i = 0; i < 3; i++){
                for(let j = 0; j < 3; j++){
                    flag.way = 'block' + i + j;
                    if (checkReserveInBlock(i, j, nums, flag, status)) break;
                }
                if(flag.rerun) break;
            }
            if(flag.rerun) continue;
            // 行内予約検索
            flag = { rerun: false, way: 'row' };
            for(let i = 0; i < 9; i++){
                flag.way = 'row' + i;
                if(checkReserveInRow(i, nums, flag, status)) break;
            }
            if(flag.rerun) continue;
            // 列内予約検索
            flag = { rerun: false, way: 'col' };
            for(let i = 0; i < 9; i++){
                flag.way = 'col' + i;
                if(checkReserveInCol(i, nums, flag, status)) break;
            }
            if(flag.rerun) continue;
        }
        // X-Wing検索
        if($('input[name="xwing"]').prop('checked')){
            flag = false;
            for(let i = 1; i <= 9; i++){
                if(checkXWing(i, nums, status)){
                    flag = true;
                    break;
                }
            }
            if(flag) continue;
        }

        if(status.unknowns == prevunknowns){
            console.warn("Couldn't Solve... (Unknowns:" + status.unknowns + ")");
            return false;
        }
    }
    console.info("Solved!");
    for(; tree > 0; tree--)
        console.groupEnd();
    return true;
}

function machineSolve(nums, status, tree){

    // 簡易処理
    let flag = {hasNull:false};
    humanSolve(nums, status, flag, tree);
    if(flag.hasNull) return false;
    if(status.unknowns == 0) return true;

    // 空きセル検索(ただし候補の少ないセル優先) & 埋めてみる
    for(let ct = 2; ct <= 9; ct++){
        for (let i = 0; i < 9; i++){
            for (let j = 0; j < 9; j++){
                if (!isNaN(nums[i][j]) || (nums[i][j]).length != ct) continue;
                for (let k = 0; k < (nums[i][j]).length; k++){
                    const assumeNum = nums[i][j][k];
                    let newNums = [];
                    console.group('Assume (' + i + ',' + j + ') = ' + assumeNum + ' in ' + ct + ' selections.');
                    for(let l = 0; l < 9; l++) // 多次元配列のコピー
                        newNums[l] = Array.from(nums[l]);
                    let newStatus = Object.assign({}, status);
                    newNums[i][j] = assumeNum;
                    newStatus.unknowns--;
                    const result = machineSolve(newNums, newStatus, tree+1);
                    if(result){
                        for(let l = 0; l < 9; l++) // 多次元配列のコピー
                            nums[l] = Array.from(newNums[l]);
                        status = Object.assign({}, newStatus);
                        return true;
                    }
                    console.groupEnd();
                }
                return false;
            }
        }
    }
    console.error('Error in ' + tree);
    return false;
}

// 入出力

function loadInputForm(){
    for(let i = 0; i < 9; i++){
        for(let j = 0; j < 9; j++){
            const group = calcBlokPos(i) + calcBlokPos(j);
            $("#input").append("<input type='text' class='r" + i +" c" + j +" g" + group +"' id='input" + i + j + "'>");
            if (j == 8) $("#input").append("<br>");
        }
    }
}

function showOutput(nums){
    $("#output").empty();
    for(let i = 0; i < 9; i++){
        for(let j = 0; j < 9; j++){
            const group = calcBlokPos(i) + calcBlokPos(j);
            $("#output").append("<div class='r" + i +" c" + j +" g" + group +"'>" + (isNaN(nums[i][j]) ? "　" : nums[i][j]) + "</div>");
            if (j == 8) $("#output").append("<br>");
        }
    }
}

function inputNumber(nums){
    let unknowns = 0;
    if($("#textInput").val() != ""){
        var allNums = $("#textInput").val().split("");
        for(let i = 0; i < 9; i++){
            nums[i] = [];
            for(let j = 0; j < 9; j++){
                nums[i][j] = Number(allNums[(i * 9) + j]);
                $("#input" + i + j).val(nums[i][j] == 0 ? "" : nums[i][j]);
                if(nums[i][j] == 0){
                    nums[i][j] = [1,2,3,4,5,6,7,8,9];
                    unknowns++;
                }
            }
        }
    }else{
        for(let i = 0; i < 9; i++){
            nums[i] = [];
            for(let j = 0; j < 9; j++){
                const tgt = "#input" + i + j;
                if($(tgt).val() == ""){
                    nums[i][j] = [1,2,3,4,5,6,7,8,9];
                    unknowns++;
                }else{
                    nums[i][j] = Number($(tgt).val());
                }
            }
        }
    }
    console.info("Total Unknown Cells: " + unknowns);
    return unknowns;
}

function run(){
    console.info('■■■■■■■■■■■■ Launch ■■■■■■■■■■■■');
    const startTime = new Date();
    let nums = [];
    let status = {
        unknowns: inputNumber(nums)
    };
    machineSolve(nums, status, 0);
    showOutput(nums);
    const endTime = new Date();
    console.info('■■■■■■■■■■■■ Finish ■■■■■■■■■■■■');
    console.table(nums);
    console.info('Elapsed Time：' + (endTime.getTime() - startTime.getTime()) + ' ms');
    $("#elapsed").html('Elapsed Time：' + (endTime.getTime() - startTime.getTime()) + ' ms');
    let output = "";
    nums.forEach(function(numss){
        numss.forEach(function(num){
            output += String(num);
        })
    })
    $("#textOutput").val(output);
}

function displayAddrs(addrs){
    let flag = false;
    let ret = "";
    addrs.forEach(addr => {
        if(flag) ret += ",";
        flag = true;
        ret += "(" + addr.r + "," + addr.c + ")";
    });
    return ret;
}
