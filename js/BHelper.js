
//-------------------------
// Helper for Bs
//-------------------------
var BHelper = (function () {

  var DomElement;

  var MouseInfo =
	{
		pos: {x:0, y:0},
		isDown: false,
		isClicked: false,
		isDragging: false,

	};

	var keyboard = {};
	keyboard.status = {};

	var specialKeys =
	{
		8: "backspace",  9: "tab",       13: "enter",    16: "shift",
		17: "ctrl",     18: "alt",       27: "esc",      32: "space",
		33: "pageup",   34: "pagedown",  35: "end",      36: "home",
		37: "left",     38: "up",        39: "right",    40: "down",
		45: "insert",   46: "delete",   186: ";",       187: "=",
		188: ",",      189: "-",        190: ".",       191: "/",
		219: "[",      220: "\\",       221: "]",       222: "'"
	}


	var isMouseClickOnce = 0;

	var initialize = function(domElement)
	{
		DomElement = domElement;
		registerInput();
	};

	var registerInput = function()
	{
		if(!DomElement) return;

		// Register Mouse Input
		DomElement.addEventListener('mousedown', function()
		{
			 updateMouseInfo();
			 MouseInfo.isClicked = true;
			 MouseInfo.isDown = true;
		});

		DomElement.addEventListener('mousemove', function()
		{
			updateMouseInfo();
			MouseInfo.isDragging = true;
		});

		DomElement.addEventListener('mouseup', function()
		{
			updateMouseInfo();
			MouseInfo.isDown = false;
			MouseInfo.isDragging = false;
			MouseInfo.isClicked = false;

			isMouseClickOnce = 0;
		});

		document.addEventListener('keydown', function(event){
			var key = getKeyName(event.which);
			if(!keyboard.status[key])
				keyboard.status[key] = { down: false, pressed: false, up: false, updatedPreviously: false };

		}, false);

		document.addEventListener('keyup', function(event){
			var key = getKeyName(event.which);
			if(keyboard.status[key])
				keyboard.status[key].pressed = false;

		},false);
	};

	keyboard.down = function(keyName)
	{
		return (keyboard.status[keyName] && keyboard.status[keyName].down);
	}

	keyboard.pressed = function(keyName)
	{
		return (keyboard.status[keyName] && keyboard.status[keyName].pressed);
	}

	keyboard.up = function(keyName)
	{
		return (keyboard.status[keyName] && keyboard.status[keyName].up);
	}

	function getKeyName(keycode)
	{
		return specialKeys[event.which]? specialKeys[event.which]: String.fromCharCode(event.which);
	}

  	var updateMouseInfo = function()
	{
		event.preventDefault();
		var rect = DomElement.getBoundingClientRect();
		MouseInfo.pos.x = ( ( event.clientX - rect.left ) / ( rect.right - rect.left ) ) * 2 - 1;
		MouseInfo.pos.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;
	};

	var convertScreenToWorld = function(camera, vector)
	{
		return new THREE.Vector3( vector.x, vector.y, vector.z ).unproject( camera );
	}

	var update = function(deltaTime)
	{
		//update mouse input
		if(MouseInfo.isClicked && isMouseClickOnce++ > 0)
		{
			MouseInfo.isClicked = false;
		}

		//update keyboard input
		for (var key in keyboard.status)
		{
			if ( !keyboard.status[key].updatedPreviously )
			{
				keyboard.status[key].down        		= true;
				keyboard.status[key].pressed     		= true;
				keyboard.status[key].updatedPreviously = true;
			}
			else // updated previously
			{
				keyboard.status[key].down = false;
			}

			if ( keyboard.status[key].up )
			{
				delete keyboard.status[key];
				continue; // move on to next key
			}

			if ( !keyboard.status[key].pressed ) // key released
				keyboard.status[key].up = true;
		}

		updateCoroutine(deltaTime);

	}

	//-- simple coroutine
	var coroutineList = [];
	var coroutineTimer = [];
	var coroutineEndTime = [];
	var coroutineDoneList = [];

	var startCoroutine = function(time, callback, doneCallback)
	{
		coroutineList.push(callback);
		coroutineEndTime.push(time);
		coroutineTimer.push(0);
		coroutineDoneList.push(doneCallback);

	}

	var updateCoroutine = function(deltaTime)
	{
		var terminateIndex = [];

		for(var i = 0; i < coroutineList.length; i++)
		{
			coroutineTimer[i] += deltaTime;
			var progress = coroutineTimer[i]/coroutineEndTime[i];

			if(progress > 1)
			{
				terminateIndex.push(i);
			}else
			{
				coroutineList[i](progress);
			}
		}

		for(var t = 0; t < terminateIndex.length; t++)
		{
			var deleteIndex = terminateIndex[t];

			if(coroutineDoneList[deleteIndex])
				coroutineDoneList[deleteIndex]();

			coroutineDoneList.splice(deleteIndex, 1);
			coroutineList.splice(deleteIndex, 1);
			coroutineTimer.splice(deleteIndex, 1);
			coroutineEndTime.splice(deleteIndex, 1);
		}
	}


    return {
	  initialize: initialize,
	  Input: {Mouse:MouseInfo, Key:keyboard},
	  update: update,
	  convertScreenToWorld: convertScreenToWorld,
	  startCoroutine:startCoroutine
    }
})();

//-------------------------
// Stage Base
//-------------------------
function BStage(name, scene, camera, startCallback, updateCallback, destroyCallback)
{
	this.scene = scene;
	this.name = name;
	this.camera = camera;

	this.startCallback = startCallback;
	this.updateCallback = updateCallback;
	this.destroyCallback = destroyCallback;

	this.startLevel = function()
	{
		if(this.startCallback)
			this.startCallback();
	}

	this.updateLevel =function(deltaTime)
	{
		if(this.updateCallback)
			this.updateCallback(deltaTime);
	}

	this.destroyLevel = function(callback)
	{
		if(this.destroyCallback)
			this.destroyCallback();

		var that = this;
		// Do transition effect
		BHelper.startCoroutine(0.5,
			function(tt){

				for(var index in that.scene.gameObjects)
				{
					that.scene.gameObjects[index].BeReadyToDestroy(tt);
				}
			},
			function()
			{
				for(var index in that.scene.gameObjects)
				{
					var tempItem = that.scene.gameObjects[index];
					tempItem.destroy();
					delete tempItem;
				}

				that.scene.gameObjects = {};

				callback();
			}
		)
	}
}

//Inheritance function overriding
Function.prototype.inheritsFrom = function( parentClassOrObject ){
	if ( parentClassOrObject.constructor == Function )
	{

		//Normal Inheritance
		this.prototype = new parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject.prototype;
	}
	else
	{
		//Pure Virtual Inheritance
		this.prototype = parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject;
	}
	return this;
}
//---------------------
// Base object
//---------------------
function BObject(scene, name, updateSelf)
{
	this.scene = scene;
	this.name = name;
	this.update_self = updateSelf;
}

BObject.prototype.update = function(deltaTime)
{
	if(this.update_self)
		this.update_self(this,deltaTime)
}

BObject.prototype.destroy = function()
{

}

BObject.prototype.BeReadyToDestroy = function(tt)
{
}
//-------------------------
// Particle Base
//-------------------------
function BParticle(scene, name, updateSelf)
{
	BObject.call(this,scene,name,updateSelf);
}

BParticle.inheritsFrom( BObject );

BParticle.prototype.destroy = function(){
	this.parent.destroy.call(this);
	this.scene.remove( this.particleSystem );
}

BParticle.prototype.BeReadyToDestroy = function(tt)
{
	this.particleSystem.scale.lerp(new THREE.Vector3(0,0,0), tt);
}

BParticle.prototype.create = function(count, texture, color, size, randBoundaryX, randBoundaryY,randBoundaryZ )
{
	var particleCount = count, // 100
    particles = new THREE.Geometry(),
    pMaterial = new THREE.ParticleBasicMaterial({
      color: color, //0x7F7FFF
      size: size, //0.03
	  blending: THREE.AdditiveBlending,
	  transparent: true
    });

	if(texture){
		pMaterial.map = texture;
		//pMaterial.blending=  THREE.NoBlending;
	}

	this.particleCount  = particleCount;

	for (var p = 0; p < particleCount; p++) {

  // create a particle with random
  // position values, -250 -> 250
	  var pX = Math.random() * randBoundaryX - randBoundaryX/2,
		  pY = Math.random() * randBoundaryY - randBoundaryY/2,
		  pZ = Math.random() * randBoundaryZ - randBoundaryZ/2,
		 particle = new THREE.Vector3(pX, pY, pZ)

		particle.velocity = new THREE.Vector3(
		  0,              // x
		  -Math.random(), // y: random vel
		  0);             // z


	  // add it to the geometry
	  particles.vertices.push(particle);
	}

	this.particles = particles;

	// create the particle system
	this.particleSystem = new THREE.ParticleSystem(
		particles,
		pMaterial);


	this.particleSystem.sortParticles = true;

	this.scene.add(this.particleSystem);

	this.scene.gameObjects[this.name] = this;
}
//-------------------------
// GameObject Base
//-------------------------
function BGameObject(scene, name, updateSelf)
{
	BObject.call(this,scene,name,updateSelf);

	this.excuteCrossFade = function( startAction, endAction, duration )
	{
		setWeight( endAction, 1 );
		endAction.time = 0;
		startAction.crossFadeTo( endAction, duration, true );
		endAction.play();
	}

	function setWeight( action, weight ) {
		action.enabled = true;
		action.setEffectiveTimeScale( 1 );
		action.setEffectiveWeight( weight );
	}
}
BGameObject.inheritsFrom( BObject );

BGameObject.prototype.setIntersectBoundary = function(radius){
	this.intersactRaidus = radius;
}

BGameObject.prototype.isIntersectsWith = function(target)
{
	if(!this.intersactRaidus || !target.intersactRaidus) return;

	var p1 = this.mesh.position;
	var p2 = target.mesh.position;

	var dist = p1.distanceTo(p2);

	return dist < (this.intersactRaidus + target.intersactRaidus);

}

BGameObject.prototype.update = function(deltaTime)
{
	if(this.aniMixer)
	{
		this.aniMixer.update(deltaTime);
	}
	this.parent.update.call(this, deltaTime);


};

BGameObject.prototype.boneLookAt = function(bone, position, forwardVector) {
	var target = new THREE.Vector3(
			position.x - bone.matrixWorld.elements[12],
			position.y - bone.matrixWorld.elements[13],
			position.z - bone.matrixWorld.elements[14]
	).normalize();
    var v = forwardVector;//new THREE.Vector3(0,0,1);
	var q = new THREE.Quaternion().setFromUnitVectors( v, target );
	var tmp = q.z;
	q.z = -q.y;
	q.y = tmp;
    bone.quaternion.copy(q);
}


BGameObject.prototype.isClicked = function(raycaster, camera, callback)
{
	raycaster.setFromCamera( BHelper.Input.Mouse.pos, camera );
	var result = raycaster.intersectObject(this.mesh, false);
	if(result.length > 0)
		return true;
	else
		return false;
}

BGameObject.prototype.destroy = function()
{
	this.parent.destroy.call(this);
	this.scene.remove( this.mesh );
}

BGameObject.prototype.BeReadyToDestroy = function(tt)
{
	this.mesh.scale.lerp(new THREE.Vector3(0,0,0), tt);
}


BGameObject.prototype.transitAnimation = function(clipName)
{
	if(!this.aniMixer) return;
	if(this.aniTable[clipName] == undefined) return;
	if(clipName == this.activeAniName )return;

	this.excuteCrossFade(this.aniTable[this.activeAniName], this.aniTable[clipName], 1);
	this.activeAniName = clipName;
}

BGameObject.prototype.create = function(kind, material, callback)
{
	var geometry;

	if(kind == 'box')
		geometry= new THREE.BoxGeometry( 1, 1, 1 );
	else if(kind == 'sphere')
		geometry= new THREE.SphereGeometry( 1, 4, 4 );

	var mat
	if(material)
		mat = material;
	else
		mat = new THREE.MeshLambertMaterial( { color: 0xff0000, wireframe: true });

	var mesh = new THREE.Mesh( geometry, mat )

	this.mesh = mesh;
	this.mesh.gameObject = this;
	this.scene.add( this.mesh );
	this.scene.gameObjects[this.name] = this;

	if(callback)
		callback(this);


}

BGameObject.loadMesh = function(jsonPath, isSkinnedMesh, texture, material, callback)
{
	var loader = new THREE.JSONLoader();
	loader.load(jsonPath , function(loadedObject, materials)
	{
		if(materials){
			materials.forEach(function(mat){
			if(isSkinnedMesh)
				mat.skinning = true;
			if(texture)
				mat.map = texture;
			mat.flatShading  = true;
			});
		}

		var mesh;
		if(isSkinnedMesh){
			mesh = new THREE.SkinnedMesh(loadedObject, materials);
		}
		else
		{
			if(materials)
			{

				mesh = new THREE.Mesh(loadedObject, materials);
			}
			else
			{
				var mat;
				if(material)
					mat = material;
				else
					mat = new THREE.MeshLambertMaterial( { color: 0xff0000, wireframe: true });

				if(texture)
					mat.map = texture;
				mesh = new THREE.Mesh(loadedObject, mat);
			}
		}

		callback(loadedObject, mesh);


	});
}

BGameObject.prototype.loadJson = function(jsonPath, isSkinnedMesh, idleAniIndex, texture, material, callback)
{
	var that = this;
	BGameObject.loadMesh(jsonPath, isSkinnedMesh, texture, material,
		function(loadedObject, mesh){

			if(mesh)
			{
				that.mesh = mesh;
				that.mesh.gameObject = that;
				that.scene.add( that.mesh );

				if(isSkinnedMesh)
				{
					if(loadedObject.animations.length > 0)
					{
						that.aniMixer = new THREE.AnimationMixer(mesh);
						that.aniTable = {};

						loadedObject.animations.forEach( function(aniClip)
						{
							that.aniTable[aniClip.name] = that.aniMixer.clipAction(aniClip);
							that.aniTable[aniClip.name].loop = THREE.LoopRepeat
						});



						var animClip =loadedObject.animations[idleAniIndex]
						var action = that.aniMixer.clipAction(animClip)
						action.loop = THREE.LoopRepeat
						action.play();

						that.activeAniName = animClip.name;
					}
				}
			}




			that.scene.gameObjects[that.name] = that;


			if(callback)
				callback(that);

		});
}
//-------------------------
// BColldie
//-------------------------



