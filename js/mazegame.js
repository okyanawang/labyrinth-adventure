var Game = function (args) {
  this.hacks = !!args.hacks || false;
  this.player = { position: new THREE.Vector3(-1.5, 0.1, 1), theta: Math.PI * 1.5, phi: 0 };

  Asset.init();

  var light = new THREE.AmbientLight(0x909090);
  scene.add(light);

  THREEx.FullScreen.bindKey({ charCode: "f".charCodeAt(0) });

  if (requestPointerLock()) {
    new PointerLock();
  }

  this.player.light = new THREE.PointLight(0xf5d576, 0.5, 1.5899);
  scene.add(this.player.light);

  camera.rotation.order = "ZYX";
  this.player.update = function () {
    this.light.position.copy(this.position);
    camera.position.copy(this.position);

    camera.rotation.y = this.theta;
    camera.rotation.x = this.phi;
  };

  this.player.update();

  var maze = generateMaze(args.width, args.height);
  var mazeWalls = [];

  var torchBuilder = new TorchBuilder();

  var walls = [];
  for (var x = 0; x < maze.width * 2 + 1; x++) {
    walls[x] = [];
    if (x % 2 === 0) {
      for (var y = 0; y < maze.height * 2 + 1; y++) {
        walls[x].push(y % 2 === 0 || !(x > 0 && maze.vertical[x / 2 - 1][Math.floor(y / 2)]));
      }
    } else {
      for (var y = 0; y < maze.height * 2 + 1; y++) {
        walls[x].push(y % 2 === 0 && !(y > 0 && maze.horizontal[(x - 1) / 2][y / 2 - 1]));
      }
    }
  }

  walls[0][1] = false;
  walls[maze.width * 2 - 1][maze.height * 2] = false;

  var actualMazeWidth = walls.length;
  var actualMazeHeight = walls[0].length;

  console.log(walls);

  var xw = [];
  var zw = [];

  for (var x = 0; x < actualMazeWidth + 1; x++) {
    xw.push([]);
    for (var z = 0; z < actualMazeHeight + 1 + 1; z++) {
      xw[x].push(false);
    }
  }
  for (var z = 0; z < actualMazeHeight + 1; z++) {
    zw.push([]);
    for (var x = 0; x < actualMazeWidth + 1 + 1; x++) {
      zw[z].push(false);
    }
  }

  for (var x = 0; x < actualMazeWidth; x++) {
    for (var z = 0; z < actualMazeHeight; z++) {
      if (walls[z][x]) {
        if (z <= 0 || !walls[z - 1][x]) {
          xw[x][z] = { flipped: 1 };
        }
        if (z >= actualMazeHeight - 1 || !walls[z + 1][x]) {
          xw[x][z + 1] = { flipped: 0 };
        }
        if (x <= 0 || !walls[z][x - 1]) {
          zw[z][x] = { flipped: 1 };
        }
        if (x >= actualMazeWidth - 1 || !walls[z][x + 1]) {
          zw[z][x + 1] = { flipped: 0 };
        }
      }
    }
  }

  console.log(xw);
  console.log(zw);

  var matrix = new THREE.Matrix4();
  var tmpgeom = new THREE.Geometry();

  var SingleWallGeom = new THREE.PlaneBufferGeometry(1, 1);
  var SingleWallGeomX = new THREE.Geometry().fromBufferGeometry(SingleWallGeom.clone().rotateY(Math.TAU / 4));
  var SingleWallGeoms = {
    x: [new THREE.Geometry().fromBufferGeometry(SingleWallGeom.clone().rotateY(Math.TAU / 4)), new THREE.Geometry().fromBufferGeometry(SingleWallGeom.clone().rotateY((Math.TAU * 3) / 4))],
    z: [new THREE.Geometry().fromBufferGeometry(SingleWallGeom), new THREE.Geometry().fromBufferGeometry(SingleWallGeom.clone().rotateY(Math.PI))],
  };

  var SingleWallGeomZ = new THREE.Geometry().fromBufferGeometry(SingleWallGeom);

  for (var z = 0; z < xw[0].length; z++) {
    for (var x = 0; x < xw.length; x++) {
      var wall = xw[x][z];
      if (wall) {
        matrix.makeTranslation(z - 1 / 2, 0, x);

        tmpgeom.merge(SingleWallGeoms.x[wall.flipped], matrix);
      }
    }
  }

  for (var x = 0; x < zw[0].length; x++) {
    for (var z = 0; z < zw.length; z++) {
      var wall = zw[z][x];
      if (wall) {
        matrix.makeTranslation(z, 0, x - 1 / 2);

        tmpgeom.merge(SingleWallGeoms.z[wall.flipped], matrix);
      }
    }
  }

  var mazeGeom = new THREE.BufferGeometry().fromGeometry(tmpgeom);
  mazeGeom.computeBoundingSphere();

  var CubeBumpMap = Asset.texture("bump.png");
  CubeBumpMap.wrapT = CubeBumpMap.wrapS = THREE.RepeatWrapping;
  CubeBumpMap.offset.set(0, 0);
  CubeBumpMap.repeat.set(1, 1);

  var CubeMaterial = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    bumpMap: CubeBumpMap,
    bumpScale: 0.55,
    shininess: 12,
    side: THREE.DoubleSide,
  });
  CubeMaterial.displacementMap = CubeBumpMap;
  CubeMaterial.displacementScale = 23;

  var mazeMesh = new THREE.Mesh(mazeGeom, CubeMaterial);
  scene.add(mazeMesh);

  for (var x = 0; x < walls.length; x++) {
    for (var y = 0; y < walls[x].length; y++) {
      if (!walls[x][y] && rnd(20) === 0) {
        var options = [];

        if (x > 0 && walls[x - 1][y]) options.push(Direction.West);
        if (x < walls.length - 1 && walls[x + 1][y]) options.push(Direction.East);

        if (y > 0 && walls[x][y - 1]) options.push(Direction.South);
        if (y < walls[x].length - 1 && walls[x][y + 1]) options.push(Direction.North);

        torchBuilder.addTorch(new THREE.Vector3(x, 0, y), DirectionToAngle(options.randomElement()));
      }
    }
  }

  torchBuilder.addTorch(new THREE.Vector3(-1, 0, 0), DirectionToAngle(Direction.East));

  torchBuilder.finish();

  mazeWalls.push(mazeMesh);
  this.walls = mazeWalls;

  var MazePlane = new THREE.PlaneGeometry(actualMazeWidth, actualMazeHeight);

  var CeilingBumpMap = Asset.texture("ceiling_bump.png");
  CeilingBumpMap.wrapT = CeilingBumpMap.wrapS = THREE.RepeatWrapping;
  CeilingBumpMap.repeat.set(actualMazeWidth, actualMazeHeight);

  var CeilingMaterial = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    bumpMap: CeilingBumpMap,
    bumpScale: 0.4,
    shininess: 11,
  });

  var Ceiling = new THREE.Mesh(MazePlane, CeilingMaterial);
  Ceiling.position.set(maze.width, 1 / 2, maze.height);
  Ceiling.rotation.x = Math.TAU / 4;
  scene.add(Ceiling);

  var FloorBumpMap = Asset.texture("floor_bump.png");
  FloorBumpMap.wrapT = FloorBumpMap.wrapS = THREE.RepeatWrapping;
  FloorBumpMap.repeat.set(actualMazeWidth, actualMazeHeight);

  var FloorMaterial = new THREE.MeshPhongMaterial({
    color: 0xb0b0b0,
    bumpMap: FloorBumpMap,
    bumpScale: 0.64,
    shininess: 10,
  });

  var Floor = new THREE.Mesh(MazePlane, FloorMaterial);
  Floor.position.set(maze.width, -1 / 2, maze.height);
  Floor.rotation.x = (Math.TAU * 3) / 4;
  scene.add(Floor);
};

Game.prototype.playerCollides = function (dir, amount) {
  var ray = new THREE.Raycaster(this.player.position, dir, 0, amount + 0.14);

  var colliders = ray.intersectObjects(this.walls, false);

  return colliders.length > 0 && colliders[0].distance - 0.5 < amount;
};

Game.prototype.update = function (delta) {
  var MoveSpeed = 3 * delta;
  var KeyRotateSpeed = 1.4 * delta;

  if (InputManager.isKeyPressed(113)) {
    this.hacks ^= true;
  }

  if (this.hacks) {
    if (InputManager.isKeyDown(16)) {
      MoveSpeed *= 4;
    }

    if (InputManager.isKeyDown(32)) {
      this.player.position.y += MoveSpeed;
    } else if (InputManager.isKeyDown(17)) {
      this.player.position.y -= MoveSpeed;
    }
  }

  if (InputManager.isKeyDown(81)) {
    this.player.theta += KeyRotateSpeed;
  } else if (InputManager.isKeyDown(69)) {
    this.player.theta -= KeyRotateSpeed;
  }

  this.player.theta = rotclamp(this.player.theta);

  var cTheta = Math.cos(this.player.theta);
  var sTheta = Math.sin(this.player.theta);

  var dir = new THREE.Vector3(-1.0 * sTheta, 0, -1.0 * cTheta);

  if ((InputManager.isKeyDown(87) || InputManager.isKeyDown(38)) && !this.playerCollides(dir, MoveSpeed)) {
    this.player.position.x += dir.x * MoveSpeed;
    this.player.position.z += dir.z * MoveSpeed;
  } else if ((InputManager.isKeyDown(83) || InputManager.isKeyDown(40)) && !this.playerCollides(new THREE.Vector3(-dir.x, -dir.y, -dir.z), MoveSpeed)) {
    this.player.position.x -= dir.x * MoveSpeed;
    this.player.position.z -= dir.z * MoveSpeed;
  }

  var xProd = new THREE.Vector3();
  xProd.crossVectors(dir, new THREE.Vector3(0, 1.0, 0));

  if ((InputManager.isKeyDown(65) || InputManager.isKeyDown(37)) && !this.playerCollides(new THREE.Vector3(-xProd.x, -xProd.y, -xProd.z), MoveSpeed)) {
    this.player.position.x -= xProd.x * MoveSpeed;
    this.player.position.z -= xProd.z * MoveSpeed;
  } else if ((InputManager.isKeyDown(68) || InputManager.isKeyDown(39)) && !this.playerCollides(xProd, MoveSpeed)) {
    this.player.position.x += xProd.x * MoveSpeed;
    this.player.position.z += xProd.z * MoveSpeed;
  }

  this.player.update();

  InputManager.update();
};

Game.prototype.mustRender = function () {
  return true;
};
