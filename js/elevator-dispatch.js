/*
    Author: Liu Ke
    StudentId: 1651573
    Date: 2019/4/24
 */

/*
    Define the basic variants
 */
const INTERVAL = 5; //The value is to balance the union operation in _operationArray
const STATUS_FREE = 0;  // This represents that the elevator is free
const STATUS_UP = 1;   // This represents that the elevator is for up-function
const STATUS_DOWN = 2; // This represents that the elevator is for down-function
const RUNNING_ON = 77;
const RUNNING_OFF = 33;


let _minFloor = 0; // The lowest floor
let _maxFloor = 20; // The max floor
let _elevatorNum = 5;  // Number of elevator
let _dispatchArray = []; // Queue for store instructions when all the elevator are occupied
let _timer = new Array(_elevatorNum); // timer for every elevator. The solution is one-versus-one.
let _running = new Array(_elevatorNum);
//let _choosing = -1;

function Elevator(){
    this._Cstatus = STATUS_FREE; //  It stands out the elevator's current direction
    this._Tstatus = STATUS_FREE; //  It stands out the elevator's target direction
    // This two variants is defined for this occasion.
    // e.g. A person dial tha down in 8th floor, and an elevator in 1st floor respond.
    // However the elevator have to upstairs first, I use it to prevent this elevator to respond other upstairs request.
    this._CFloor = 1;
    this._TFloor = 1;
    this._SLayer = new Set();
    this._CanOpen = false;   // control if can open the door
    this._Interupt = false;
}

function Operation(floor=0,status=STATUS_FREE){
    this._Floor = floor;
    this._status = status;
}

let _elevatorArray = new Array(_elevatorNum);
let _operationArray = [];

/*
    Initialization
 */
function init() {

    for(let i = 0;i < _elevatorArray.length;i++){
        _elevatorArray[i] = new Elevator();
        _timer[i] = initTimer(i);
        _running[i] = RUNNING_OFF;
    }
    // mock dispatcher thread
    setInterval(function () {
        processSequence()
    },1000);
}
$(document).ready(init);

function sortDesc(x,y){
    return y-x;
}

function sortAesc(x,y) {
    return x-y;
}

function openDoor(n,sign=false) {
    if(!_elevatorArray[n]._CanOpen){
        return ;
    }
    if(sign){
        _elevatorArray[n]._Interupt = true;
    }
    $("#E" + n + " .leftdoor").css("left","0%");
    $("#E" + n + " .rightdoor").css("left","45%");
    if(sign){
        if(_timer[n]){
            console.log("clear timer");
            clearInterval(_timer[n]);
        }
        setTimeout(function () {
            _elevatorArray[n]._Interupt = false;
            closeDoor(n);
            setTimeout(function () {
                if(!_elevatorArray[n]._Interupt){
                    _elevatorArray[n]._CanOpen = true;
                    initTimer(n);
                    console.log("init Timer!!!");
                }
            },2000)
        },2000)
    }
}

function closeDoor(n,sign=false) {
    $("#E" + n + " .leftdoor").css("left","15%");
    $("#E" + n + " .rightdoor").css("left","30%");
    if(sign){
        if(_timer[n]){
            console.log("clear timer");
            clearInterval(_timer[n]);

        }
        setTimeout(function () {
            if(!_elevatorArray[n]._Interupt){
                _elevatorArray[n]._CanOpen = true;
                initTimer(n);
                console.log("init Timer!!!");
            }
        },2000)
    }
}

$(".open").click(function () {
   let id = $(this)[0].id;
   openDoor(parseInt(id.substr(5)),true);
});

$(".close").click(function () {
    let id = $(this)[0].id;
    closeDoor(parseInt(id.substr(6)),true);
});

$(".call").click(function(){
    alert("正在呼救!!!");
});
$(".emergency").click(function(){
    alert("紧急情况!!!");
});

//click event on elevator dial panel
$(".dial .button").click(function () {
    let elevatorIndex = $(this).parent()[0].id;
    elevatorIndex = parseInt(elevatorIndex.substr(7));
    let floorIndex = $(this)[0].textContent;
    floorIndex = parseInt(floorIndex);
    let judge = false;
    if(_elevatorArray[elevatorIndex]._Tstatus == STATUS_FREE){
        judge = true;
    }
    if(_elevatorArray[elevatorIndex]._Cstatus != _elevatorArray[elevatorIndex]._Tstatus){
        return;
    }
    if(floorIndex > _elevatorArray[elevatorIndex]._CFloor && _elevatorArray[elevatorIndex]._Tstatus != STATUS_DOWN){
        $(this).addClass("pressed");
        addLayerToUp(elevatorIndex,floorIndex,judge);
        if(_elevatorArray[elevatorIndex]._Tstatus == STATUS_FREE){
            _elevatorArray[elevatorIndex]._Tstatus = _elevatorArray[elevatorIndex]._Cstatus = STATUS_UP;
        }
    }else if(floorIndex < _elevatorArray[elevatorIndex]._CFloor && _elevatorArray[elevatorIndex]._Tstatus != STATUS_UP){
        $(this).addClass("pressed");
        addLayerToDown(elevatorIndex,floorIndex,judge);
        if(_elevatorArray[elevatorIndex]._Tstatus == STATUS_FREE){
            _elevatorArray[elevatorIndex]._Tstatus = _elevatorArray[elevatorIndex]._Cstatus = STATUS_DOWN;
        }
    }else{
        return;
    }
    if(_running[elevatorIndex] == RUNNING_OFF){
        _running[elevatorIndex] = RUNNING_ON;
    }
});

//click event on outside panel
$(".up").off().on('click',function (e) {
    e.stopPropagation();
    let floorIndex = $(this).parent()[0].id.substr(5);
    if($(this).hasClass('on')){
        // if it has already dials the button;
        return;
    }
    floorIndex = parseInt(floorIndex);
    $(this).addClass('on');
    selectElevator(floorIndex,true);
    return false;
});

//click event on outside panel

$(".down").off().on("click",function (e) {
    e.stopPropagation();
    let floorIndex = $(this).parent()[0].id.substr(5);
    if($(this).hasClass('on')){
        return;
    }
    floorIndex = parseInt(floorIndex);
    $(this).addClass('on');
    selectElevator(floorIndex,false);
    return false;
});


function selectElevator(floorIndex,isUp) {
    let status = isUp?STATUS_UP:STATUS_DOWN;
    let n = -1;
   // let minD = 100;
    if(_operationArray.length != 0){
        pushSequence(floorIndex,status);
    }
    //first choice   a relaxed elevator is stopped at this floor
 /*   for(let i = 0;i < _elevatorNum;i++){
        if(_running[i] == RUNNING_OFF ){
            if(_elevatorArray[i]._CFloor == floorIndex){
                 moveElevator(i,floorIndex,isUp);
                 return;
            }else{
                let distance = computeDistance(floorIndex,_elevatorArray[i]._CFloor);
                if(distance < minD){
                    minD = distance;
                    n = i;
                }
            }
        }else if(status == _elevatorArray[i]._Tstatus && _elevatorArray[i]._Tstatus == _elevatorArray[i]._Cstatus){
            if(status == STATUS_DOWN && floorIndex < _elevatorArray[i]._CFloor){
                let distance = computeDistance(floorIndex,_elevatorArray[i]._CFloor);
                if(distance < minD){
                    minD = distance;
                    n = i;
                }
            }else if(status == STATUS_UP && floorIndex > _elevatorArray[i]._CFloor) {
                let distance = computeDistance(floorIndex, _elevatorArray[i]._CFloor);
                if (distance < minD) {
                    minD = distance;
                    n = i;
                }
            }
        }
    }*/
    if(n != -1){
        if(_running[n] == RUNNING_ON){
            if(status == STATUS_UP){
                addLayerToUp(n,floorIndex);
            }else{
                addLayerToDown(n,floorIndex);
            }
        }else{
            moveElevator(n,floorIndex,isUp) // To let free elevator to arrive to user's position
        }
    }else{
        pushSequence(floorIndex,status);
    }
}

function computeDistance(floor,CFloor){
    return Math.abs(floor - CFloor);
}

function addLayerToUp(n,floorIndex,sign=false){
    _elevatorArray[n]._SLayer.add(floorIndex);
    //If elevator is just on the way .i.s c_status != t_status, we cannot change the T_floor, and it will be changed when turn the direction
    let judge = _elevatorArray[n]._Cstatus == _elevatorArray[n]._Tstatus;
    if(sign || (judge && floorIndex > _elevatorArray[n]._TFloor)){
        _elevatorArray[n]._TFloor = floorIndex;
    }

}

function addLayerToDown(n,floorIndex,sign=false){
    _elevatorArray[n]._SLayer.add(floorIndex);
//    let judge = _elevatorArray[n]._Cstatus == _elevatorArray[n]._Tstatus;
    if(sign ||(floorIndex < _elevatorArray[n]._TFloor)){
        _elevatorArray[n]._TFloor = floorIndex;
    }
}

function checkExist(floorIndex,status) {
    for(let i = 0;i < _operationArray.length;i++){
        if(floorIndex == _operationArray[i]._Floor && status == _operationArray[i]._status){
            return i;
        }
    }
    return -1;
}

function initTimer(n) {
    return setInterval("run("+n+")",1000)
}

function clearTimer(n) {
    clearTimer(_timer[n]);
    _timer[n] = -1;
}

function pushSequence(floorIndex,status) {
    let result = checkExist(floorIndex,status);
    let process = false;
    if(result != -1){
        process = true;
    }

/*    for(let i = 0;i < _operationArray.length;i++){
        if(status == _operationArray[i]._status ){
            if(status == STATUS_DOWN){
                if(floorIndex < _operationArray[i]._Floor[0] && computeDistance(floorIndex,_operationArray[i]._Floor[0]) <= INTERVAL){
                    _operationArray[i]._Floor.push(floorIndex);
                    process = true;
                    break;
                }
            }else if(status == STATUS_UP){
                if(floorIndex > _operationArray[i]._Floor[0] && computeDistance(floorIndex,_operationArray[i]._Floor[0]) <= INTERVAL){
                    _operationArray[i]._Floor.push(floorIndex);
                    process = true;
                    break;
                }
            }
        }
    }*/

    if(!process){
        _operationArray.push(new Operation(floorIndex,status));
        console.log("push"+floorIndex+"   status"+status);
    }
}

function processSequence() {
    let tempArray = _operationArray;
    let length = tempArray.length;
    if(length <= 0 ){
        return;
    }
    console.log(tempArray.toString());
    // if elevator is stopping
    for(let i = 0; i < _elevatorNum;i++){
        if(length <= 0){
            return;
        }
        if(_elevatorArray[i]._Cstatus != _elevatorArray[i]._Tstatus || _elevatorArray[i]._CanOpen){
            continue;
        }
        if(_elevatorArray[i]._Tstatus == STATUS_FREE){
            let minD = 100;
            let chooseIndex = -1;
            console.log(length);
            for(let j = 0;j <length;j++){
                let len = computeDistance(tempArray[j]._Floor,_elevatorArray[i]._CFloor);
                console.log(tempArray[j]._status);
                if(len < minD){
                    minD = len;
                    chooseIndex = j;
                }
            }
            moveElevator(i,tempArray[chooseIndex]._Floor,tempArray[chooseIndex]._status == STATUS_UP);
            console.log("index"+i +"pick" + " "+tempArray[chooseIndex]._Floor + " "+ tempArray[chooseIndex]._status);
            deleteOperationArray(checkExist(tempArray[chooseIndex]._Floor,tempArray[chooseIndex]._status));
        //    tempArray.splice(chooseIndex,1);
            length--;
            if(length <= 0){
                return;
            }
        }else{
            for(let j = 0;j < length;){
                if((tempArray[j]._status == _elevatorArray[i]._Tstatus)){
                    let floor = tempArray[j]._Floor;
                    if(tempArray[j]._status == STATUS_UP && floor > _elevatorArray[i]._CFloor
                        && computeDistance(floor,_elevatorArray[i]._CFloor) < INTERVAL){
                        addLayerToUp(i,floor);
                        console.log("index"+i +"pick" + " "+floor+ " "+ tempArray[j]._status);
                        deleteOperationArray(checkExist(floor,tempArray[j]._status));
            //            tempArray.splice(j,1);
                        length--;
                        continue;
                    }
                    if(tempArray[j]._status == STATUS_DOWN && floor < _elevatorArray[i]._CFloor
                        && computeDistance(floor,_elevatorArray[i]._CFloor)< INTERVAL){
                        addLayerToDown(i,floor);
                        console.log("index"+i +"pick" + " "+floor+ " "+ tempArray[j]._status);
                        deleteOperationArray(checkExist(floor,tempArray[j]._status));
            //            tempArray.splice(j,1);
                        length--;
                        continue;
                    }
                }
                j++;
            }
        }
    }
}


function moveElevator(n,floorIndex,isUp){
    isUp = isUp?STATUS_UP:STATUS_DOWN; // choose status
    let CFloor = _elevatorArray[n]._CFloor;
    if(isUp == STATUS_UP){
        addLayerToUp(n,floorIndex,true);
    }else{
        addLayerToDown(n,floorIndex,true)
    }
    _elevatorArray[n]._Tstatus = isUp;
    if(CFloor < _elevatorArray[n]._TFloor){
        _elevatorArray[n]._Cstatus = STATUS_UP;
    }else if(CFloor > _elevatorArray[n]._TFloor){
        _elevatorArray[n]._Cstatus = STATUS_DOWN;
    }else{
        _elevatorArray[n]._Cstatus = isUp==STATUS_UP?STATUS_DOWN:STATUS_UP;
    }
    _running[n] = RUNNING_ON;
}

function arriveOperation(n,CFloor,sign=false) {
    let t_status = _elevatorArray[n]._Tstatus;
    _elevatorArray[n]._SLayer.delete(CFloor);
    console.log("index =" + n + "delete" + CFloor);
    arriveAnimate(n,CFloor,t_status,sign);
}

function arriveAnimate(n,CFloor,t_status,sign) {
    setTimeout(function () {
        _elevatorArray[n]._CanOpen = true;
        openDoor(n);
        if(sign){
            t_status = _elevatorArray[n]._Tstatus;
            _elevatorArray[n]._Cstatus = t_status;
            // turn direction
            turnLight(n,_elevatorArray[n]._Tstatus);
            let stopArray = Array.from(_elevatorArray[n]._SLayer);
            if(t_status == STATUS_UP){
                stopArray.sort(sortAesc);
            }else if(t_status == STATUS_DOWN){
                stopArray.sort(sortDesc);
            }
            if(stopArray.length != 0){
                _elevatorArray[n]._TFloor = stopArray[stopArray.length-1];
                console.log("turn index"+n+" TFloor to "+ stopArray[stopArray.length-1])
            }
        }
        setTimeout(function () {
            closeDoor(n);
            removeOutsideLight(n,CFloor,t_status);
            setTimeout(function () {
                // if the sequence is empty, then the elevator will still in CFloor
                if(_elevatorArray[n]._SLayer.size == 0){
                    _elevatorArray[n]._Cstatus = _elevatorArray[n]._Tstatus = STATUS_FREE;
                    _running[n] = RUNNING_OFF;
                    console.log("no stop floor so end..");
                    removeLight(n);
                }
                if(!_elevatorArray[n]._Interupt){
                    _elevatorArray[n]._CanOpen = false;
                    _timer[n] = initTimer(n);
                    console.log("init Timer!!!");
                }
            },2000);
        },2000);
    },2000);
}

function run(n) {
    let test = setInterval(function () {

    },1000);
    clearInterval(test);

    if(_running[n] == RUNNING_ON){

        let c_status = _elevatorArray[n]._Cstatus;
        let t_status = _elevatorArray[n]._Tstatus;
        let TFloor = _elevatorArray[n]._TFloor;
        let CFloor = _elevatorArray[n]._CFloor;
        if((CFloor == TFloor) || ((c_status == t_status) &&_elevatorArray[n]._SLayer.has(CFloor))){
            if(_timer[n]){
                console.log("clear Timer");
                clearInterval(_timer[n]);
            }
            if(CFloor == TFloor){
                if(c_status == t_status){
                    console.log(  "index =" + n + "arrive "+ TFloor + "and t==c  ");
                    arriveOperation(n,CFloor)
                }else{
                    console.log(  "index ="+ n + "arrive "+ TFloor + "and t!=c  ");
                    arriveOperation(n,CFloor,true)
                }
            }else{
                console.log("index =" + n +"arrive"+CFloor);
                arriveOperation(n,CFloor);
            }
        }
        else{
            if(c_status == STATUS_UP){
                moveUP(n);
            }else if(c_status == STATUS_DOWN) {
                moveDOWN(n);
            }
        }
    }
}

function moveUP(n){
    $("#uplight"+n).addClass("turnon");
    if(_elevatorArray[n]._CFloor < _maxFloor){
        _elevatorArray[n]._CFloor++;
    }
    let ElevatorMove = (_elevatorArray[n]._CFloor - 1) * 790 * 0.05 + 10 ;
    $("#E" + n + " .door").css("bottom", ElevatorMove+"px");
    $("#floorOnScreen" + n).text(""+_elevatorArray[n]._CFloor);
}

function moveDOWN(n) {
    $("#downlight"+n).addClass("turnon");
    if(_elevatorArray[n]._CFloor > _minFloor){
        _elevatorArray[n]._CFloor--;
    }
    let ElevatorMove = (_elevatorArray[n]._CFloor - 1) * 790 * 0.05;
    $("#E" + n + " .door").css("bottom", ElevatorMove+"px");
    $("#floorOnScreen" + n).text(""+_elevatorArray[n]._CFloor);
}

function removeLight(n) {
    $("#uplight"+n).removeClass("turnon");
    $("#downlight"+n).removeClass("turnon");
}

function removeOutsideLight(n,floorIndex,status){
    if(status == STATUS_UP){
        $("#floor"+floorIndex+" td.up.button").removeClass("on");
    }else{
        $("#floor"+floorIndex+" td.down.button").removeClass("on");
    }
    $("#dialpad"+n+" .button.dial"+floorIndex).removeClass("pressed");
}

function deleteOperationArray(index) {
    _operationArray.splice(index,1);
}

function turnLight(n,status) {
    if(status == STATUS_UP){
        $("#downlight"+n).removeClass("turnon");
        $("#uplight"+n).addClass("turnon");
    }else{
        $("#uplight"+n).removeClass("turnon");
        $("#downlight"+n).addClass("turnon");
    }
}

