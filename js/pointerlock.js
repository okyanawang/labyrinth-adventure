var PointerLock = function (args) {
  var scope = this;
  if (!args) args = {};
  this.sensitivity = args.sensitivity || 0.002;

  pointerLockActive = false;

  var onMouseMove = function (event) {
    if (pointerLockActive === false) return;
    console.log(event.movementX, event.movementY);
    var movementX = event.movementX || event.mozMovementX || 0; // sebagai movement mouse horizontal
    var movementY = event.movementY || event.mozMovementY || 0; // sebagai movement mouse vertical

    g.player.theta -= movementX * scope.sensitivity;
    g.player.phi -= movementY * scope.sensitivity;

    g.player.phi = Math.constrainRadius(g.player.phi, Math.TAU / 4);
  };

  document.addEventListener("mousemove", onMouseMove);
};

var hasBrowserPointerlock = function () {
  return "pointerLockElement" in document || "mozPointerLockElement" in document || "webkitPointerLockElement" in document;
};

var requestPointerLock = function () {
  var element = document.body;

  if (hasBrowserPointerlock()) {
    var pointerlockchange = function (event) {
      if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
        pointerLockActive = true;
      } else {
        pointerLockActive = false;
      }
    };

    var pointerlockerror = function (event) {
      console.warn("Mysterious pointerlock error! :(");
      console.log(event);
      pointerLockActive = false;
    };

    document.addEventListener("pointerlockchange", pointerlockchange);
    document.addEventListener("mozpointerlockchange", pointerlockchange);
    document.addEventListener("webkitpointerlockchange", pointerlockchange);

    document.addEventListener("pointerlockerror", pointerlockerror);
    document.addEventListener("mozpointerlockerror", pointerlockerror);
    document.addEventListener("webkitpointerlockerror", pointerlockerror);

    var requestPointerLock = function (event) {
      element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

      element.requestPointerLock();
    };

    element.addEventListener("click", requestPointerLock);
    return true;
  } else {
    console.log("Upgrade your browser! Please! I can't use pointerlock!");
    return false;
  }
};
