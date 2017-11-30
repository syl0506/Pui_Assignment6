//Controls elements like lighting/scene/camera

(function () {

	var scene,
	    camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
		renderer , raycaster, clock, debugCube;

		var control; //= new THREE.TrackballControls(camera);

		//Create Scene

	function createScene()
	{
		scene = new THREE.Scene();
		scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
		scene.gameObjects = {};

		HEIGHT = 500;
		WIDTH = 500;

		aspectRatio = WIDTH / HEIGHT;
		fieldOfView = 60;
		nearPlane = 1;
		farPlane = 10000;
		camera = new THREE.PerspectiveCamera(
			fieldOfView,
			aspectRatio,
			nearPlane,
			farPlane
			);

		camera.position.z = 5;
		camera.position.y = 1.4;

		raycaster = new THREE.Raycaster();

		//append canvas to DOM

		var container = document.getElementById('canvas') //$("#landing_Animation");


		renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		renderer.setSize(500, 500);


		container.appendChild(renderer.domElement);


		BHelper.initialize(container);


		container.addEventListener('resize', handleWindowResize, false);

		clock  = new THREE.Clock();

		BStageManager.initialize(scene, camera, raycaster);


	}

	function handleWindowResize() {
		// update height and width of the renderer and the camera\
		HEIGHT = $("#canvas").height;
		WIDTH = $("#canvas").width;
		renderer.setSize(WIDTH, HEIGHT);
		camera.aspect = WIDTH / HEIGHT;
		camera.updateProjectionMatrix();
	}

	function createLight()
	{
		//Light -------------
		var ambientLight = new THREE.AmbientLight( 0xcccccc, 1.5 );

		scene.add( ambientLight );

		var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0.25 );
		scene.add( light );

	}

	var update = function () {
		requestAnimationFrame( update );

		var delta = clock.getDelta();
		var theta = clock.getElapsedTime();

		BHelper.update(delta);

		debugCube.position.set(BHelper.Input.Mouse.pos.x, BHelper.Input.Mouse.pos.y, 1)

		BStageManager.update(delta);

		for(var index in scene.gameObjects)
		{
			scene.gameObjects[index].update(delta);
		}

		if(control)
			control.update(delta);

		renderer.render(scene, camera);
	};

	createScene();
	createLight();

	var geometry = new THREE.BoxBufferGeometry( 0.1, 0.1, 0.1 );
	var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
	debugCube = new THREE.Mesh( geometry, material );
	//scene.add( debugCube );

	update();


}());
