var g;

var camera, scene, renderer, timer;

var init = function () {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.01, 10000);
  scene.add(camera);

  timer = new THREE.Clock();

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize);
};

var onWindowResize = function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

var start = function () {
  timer.start();
};

var animate = function () {
  requestAnimationFrame(animate);

  var delta = timer.getDelta();
  //   console.log(delta);
  g.update(delta);

  if (g.mustRender()) {
    renderer.render(scene, camera);
  }
};

init();
g = new Game({ width: 8, height: 8 });
start();
animate();
