//-------------------------
// DESC: The class contains all the stage in the scene.
//-------------------------
var BStageManager = (function(){

	var stages = {}; // stage table
	var activeStage; // focused stage

	// Start stage
	//<param = string> stage's key
	var startStage = function(name)
	{
		if(stages[name] == undefined) return;

		if(activeStage) //if the active Stage exsists, destroy the the current one for the new one
		{
			activeStage.destroyLevel(function(){
				activeStage = stages[name];
				activeStage.startLevel();
			});
		}else{
			activeStage = stages[name];
			activeStage.startLevel();
		}

	}

	// Update stage
	//<param = float> delta time
	var update = function(deltaTime)
	{
		//if pressed 'A' on keyboard
		if(BHelper.Input.Key.up('A') )
		{
			startStage("rainy");
		}

		//updates the current stage
		if(activeStage)
			activeStage.updateLevel(deltaTime)
	}

	// Initialize the manager
	//<param = THREE.Scene>
	//<param = THREE.Camera>
	//<param = THREE.Raycaster>
	var initialize = function(scene, camera, raycaster)
	{
		//stage template--------------------------------------------
		var tempStage = new BStage("example", scene, camera,
			function() //Start logic
			{},
			function(deltaTime) //update logic
			{},
			function() //destroy logic
			{}
		);
		stages[tempStage.name] = tempStage;
		//------------------------------------------------------------

		//[Rain] stage
		tempStage = new BStage("rainy", scene, camera,
			function() //Start logic
			{
				// Spawn background object
				var plate = new BGameObject(scene, 'plate');
				plate.loadJson('docs/assets/scene_rain.js', false,-1, new THREE.TextureLoader().load( 'docs/assets/bus_stop_tex_dark.png' ), null,
					function(item) /* Load complete callback*/
					{
						//Set scale and position of the bg object
						item.mesh.scale.set(1.5,1.5,1.5)
						item.mesh.position.set(0,-0.1,-1)
					});

				// Spawn particle for the rain
				var particle = new BParticle(scene, 'paritcle',
					function(gameObject, deltaTime) /* the particle object's update loop */
					{
						gameObject.particleSystem.rotation.y += 0.01;

						var pCount = gameObject.particleCount;
					    while (pCount--) {
							// Get the particle
							var particle = gameObject.particles.vertices[pCount];

						    // Check if we need to reset
							if (particle.y < 0) {

							  particle.y = Math.random() * 2.2;
							  particle.velocity.y = 0;
							}

							// Update the velocity and the position
							particle.velocity.y -= Math.random() * .005;
							particle.y += particle.velocity.y;
						 }
						  gameObject.particleSystem.geometry.verticesNeedUpdate = true;
					});

				// Create the mesh for the partcle object
				particle.create(100, null, 0x0060d3, 0.03, 1.5,3,3);

				// spawn the character
				var character = new BGameObject(scene, 'character');

				// Load the character
				character.loadJson('docs/assets/PANDAP.json', true, 10, null, null,
					function() /* Load complete callback*/
					{
						// spawn the umblerra object
						var item = new BGameObject(scene, 'umblerra',
							function(gameObject, deltaTime){ /* the umbrella object's update loop */

								if( BHelper.Input.Mouse.isDown ) // when mouse down
								{
									if(BHelper.Input.Mouse.isClicked) // when mouse clicked once (first down call)
									{
										// raycast from the mouse point
										raycaster.setFromCamera( BHelper.Input.Mouse.pos, camera );

										var result = raycaster.intersectObject(gameObject.mesh, false);
										if(result.length > 0) // if hit
										{
											// make a new value for the last grabbed position
											gameObject.grabLastPos = {x:BHelper.Input.Mouse.pos.x, y:BHelper.Input.Mouse.pos.y}
											gameObject.grabZ = result[0].point.clone();

											gameObject.isDetached = true;
										}
									}
									else // when mouse hold
									{
										if(gameObject.grabZ) //when the object is hit by ray
										{
											if(gameObject.isDetached){
												character.transitAnimation("Hold_Item"); //transit animation to
												gameObject.isDetached = null; //clear the value for the initialization

												scene.add(gameObject.mesh)  // detach the object from the bone
												// Change the size and rotation for the original values
												gameObject.mesh.setRotationFromEuler(new THREE.Euler(0,0,0, 'XYZ'));
												gameObject.mesh.scale.set(1,1,1);
											}

											// get mouse drag delta value
											var deltaX =  (gameObject.grabLastPos.x -BHelper.Input.Mouse.pos.x);
											var deltaY =  (gameObject.grabLastPos.y -BHelper.Input.Mouse.pos.y);


											gameObject.grabLastPos.x = BHelper.Input.Mouse.pos.x;
											gameObject.grabLastPos.y = BHelper.Input.Mouse.pos.y;

											// rotate the umblerra by the mouse delta values
											gameObject.mesh.rotateZ(THREE.Math.radToDeg(  deltaX * deltaTime ));
											gameObject.mesh.rotateX(THREE.Math.radToDeg( deltaY* deltaTime ));

											// make keep following the character's hand position
											var worldPos = character.mesh.skeleton.bones[15].getWorldPosition();
											gameObject.mesh.position.set(worldPos.x, worldPos.y, worldPos.z)

											// Rotate the character to face with mouse pointer
											character.mesh.lookAt(BHelper.Input.Mouse.pos.x, 0, 0.5);
										}
									}
								}
								else
								{
									if(gameObject.grabZ != null) //when it got grabbed by mouse, the object need to be reset
									{
										// attach to the character's bone
										character.mesh.skeleton.bones[16].add(gameObject.mesh)
										gameObject.mesh.position.set(0,0,0)

										//Smooth Reset for Umbrella
										var currRot_umb = gameObject.mesh.quaternion.clone();
										var currRot_character = character.mesh.quaternion.clone();

										var targetRot = new THREE.Quaternion();
										targetRot.setFromEuler(  new THREE.Euler(0,0,0,'XYZ') );

										var targetRot_umb = new THREE.Quaternion();
										targetRot_umb.setFromEuler(  new THREE.Euler(THREE.Math.degToRad(-90),0,0,'XYZ') );

										var qm_umb = new THREE.Quaternion();
										var qm_char = new THREE.Quaternion();

										// Start coroutine for 0.3 seconds
										BHelper.startCoroutine(0.3, function(tt)
										{
											 THREE.Quaternion.slerp(currRot_umb, targetRot_umb, qm_umb, tt);
											 gameObject.mesh.quaternion.copy(qm_umb);

											 THREE.Quaternion.slerp(currRot_character, targetRot, qm_char, tt);
											 character.mesh.quaternion.copy(qm_char);
										},
										function()
										{
											gameObject.mesh.setRotationFromEuler(new THREE.Euler(THREE.Math.degToRad(-90),0,0, 'XYZ'));
										})

										gameObject.mesh.scale.set(11,11,11)
										//back to original animation
										character.transitAnimation("Stand_with_Umb");
									}

									gameObject.isDetached = null;
									gameObject.grabZ = null;
								}
							}
						 )

						// load the umbrella mesh
						item.loadJson('docs/assets/unbrella.json', false, -1, null, null,
							function(item) /* Load complete callback*/
							{
								character.mesh.skeleton.bones[16].add(item.mesh);
								item.mesh.setRotationFromEuler(new THREE.Euler(THREE.Math.degToRad(-90),0,0, 'XYZ'));
								item.mesh.scale.set(11,11,11)
							}
						);

					});
			},
			null,null
		);
		// register the stage by key
		stages[tempStage.name] = tempStage;

		//[Snow] stage
		var tempStage = new BStage("snowy", scene, camera,
			function() //Start logic
			{
				// Spawn background object
				var plate = new BGameObject(scene, 'plate');
				plate.loadJson('docs/assets/scene_snow.js', false,-1, new THREE.TextureLoader().load( 'docs/assets/scene_2_tex.png' ), null,
					function(item)
					{
						item.mesh.scale.set(1.5,1.5,1.5)
						item.mesh.position.set(0,-0.1,-1)
					});

				// spawn the character
				var character = new BGameObject(scene, 'character');
				// load the character's mesh
				character.loadJson('docs/assets/PANDAP.json', true, 4, new THREE.TextureLoader().load( 'docs/assets/PANDAP_uv_winter.png' ), null,
					function(loaded){  /* Load complete callback*/

						//create "hat" item
						var item = new BGameObject(scene, 'hat',
							function(gameObject, deltaTime)  /* the hat object's update loop */
							{
								if( BHelper.Input.Mouse.isDown ) // when mouse down
								{
									if(BHelper.Input.Mouse.isClicked) // when mouse clicked once
									{
										if(gameObject.isClicked(raycaster, camera)) //when intersect with the mouse ray
										{
											//detach the hat from the character's bone and rescale
											scene.add(gameObject.mesh)
											gameObject.mesh.scale.set(0.5,0.5,0.5);

											var headPos = character.mesh.skeleton.bones[10].getWorldPosition().clone();
											gameObject.mesh.position.set(headPos.x, headPos.y, headPos.z);

											gameObject.mesh.setRotationFromEuler(new THREE.Euler(THREE.Math.degToRad(90),0,0, 'XYZ'));

											// make variables for verfiying the hat was intersected with mouse
											gameObject.originalPos = gameObject.mesh.position.clone(); //deep copy
											gameObject.grabLastPos = {x:BHelper.Input.Mouse.pos.x, y:BHelper.Input.Mouse.pos.y}

											//transit to event animation
											character.transitAnimation("LookForItem");
										}
									}else
									{
										if(gameObject.originalPos) // when the hat was intered
										{
											// calculate mouse delta
											var deltaX =  (gameObject.grabLastPos.x -BHelper.Input.Mouse.pos.x);
											var deltaY =  (gameObject.grabLastPos.y -BHelper.Input.Mouse.pos.y);

											gameObject.grabLastPos.x = BHelper.Input.Mouse.pos.x;
											gameObject.grabLastPos.y = BHelper.Input.Mouse.pos.y;

											// apply delta for moving hat
											gameObject.mesh.translateX(deltaX * -1 * 3);
											gameObject.mesh.translateZ(deltaY  * 2);

											// make the character's rotation to follow the hat direction
											character.mesh.lookAt(BHelper.Input.Mouse.pos.x, 0, 0.5);
										}
									}
								}
								else
								{
									// return to the original position
									if(gameObject.originalPos)
									{
										character.mesh.skeleton.bones[10].add(gameObject.mesh)
										gameObject.mesh.scale.set(3,3,3)

										character.transitAnimation("Idle");
										var orgPos = character.mesh.skeleton.bones[10].getWorldPosition().clone();
										//var orgRot = character.mesh.skeleton.bones[10].getWorldRotation().clone();

										var orgRot = new THREE.Quaternion();
										orgRot.setFromEuler(  new THREE.Euler(0,0,0,'XYZ') );

										var orgRot_character = new THREE.Quaternion();
										orgRot.setFromEuler(  new THREE.Euler(0,0,0,'XYZ') );

										var currRot_hat = gameObject.mesh.quaternion.clone();
										var currRot_character = character.mesh.quaternion.clone();

										var qm_hat = new THREE.Quaternion();
										var qm_character =new THREE.Quaternion();

										BHelper.startCoroutine(0.3, function(tt){
											gameObject.mesh.position.lerp(orgPos, tt);


											THREE.Quaternion.slerp(currRot_hat, orgRot, qm_hat, tt);
											gameObject.mesh.quaternion.copy(qm_hat);

											THREE.Quaternion.slerp(currRot_character, orgRot_character, qm_character, tt);
											character.mesh.quaternion.copy(qm_character);
										},
										function()
										{
											//character.mesh.skeleton.bones[10].add(gameObject.mesh)
											gameObject.mesh.position.set(0,0,0);
											gameObject.mesh.setRotationFromEuler(new THREE.Euler(0,0,0, 'XYZ'));
											//gameObject.mesh.scale.set(8,8,8)
										});
									}
									gameObject.originalPos = null;
								}
							})

						// load the hat's mesh
						item.loadJson('docs/assets/winter_hat.js', false, -1, new THREE.TextureLoader().load( 'docs/assets/SantaHat.png' ), null,
						function(item) /* Load complete callback*/
						{
							// attach to the character's bone
							character.mesh.skeleton.bones[10].add(item.mesh);
							item.mesh.scale.set(3,3,3)

							// create the snow particle
							var particle = new BParticle(scene, 'paritcle',
							function(gameObject, deltaTime) /* the snow particle's update loop */
							{
								gameObject.particleSystem.rotation.y += 0.01;

								var pCount = gameObject.particleCount;
							    while (pCount--) {
									// get the particle
									var particle = gameObject.particles.vertices[pCount];

								    // check if we need to reset
									if (particle.y < 0) {

									  particle.y = Math.random() * 2.2;

									  particle.velocity.y = 0;
									}

									// update the velocity
									particle.velocity.y -= Math.random() * .001;
									// and the position
									particle.y += particle.velocity.y;
								 }
								  gameObject.particleSystem.geometry.verticesNeedUpdate = true;
							});

							//create particle mesh
							particle.create( 40, new THREE.TextureLoader().load( 'docs/assets/snow.png' ), 0x919191, 0.25, 1.5,3,3);

						});


					});



			},
			null, null
		);
		stages[tempStage.name] = tempStage;

		//[SUNNY] stage
		var tempStage = new BStage("sunny", scene, camera,
			function() //Start logic
			{
				// Load bg object
				var plate = new BGameObject(scene, 'plate');
				plate.loadJson('docs/assets/scene_sun.js', false,-1, new THREE.TextureLoader().load( 'docs/assets/scene_3_tex.png' ), null,
					function(item) /* Load complete callback*/
					{
						item.mesh.scale.set(1.5,1.5,1.5)
						item.mesh.position.set(0,-0.1,-1)
					});

				// spawn the character
				var character = new BGameObject(scene, 'character');
				character.loadJson('docs/assets/PANDAP.json', true, 7, new THREE.TextureLoader().load( 'docs/assets/PANDAP_uv.png' ), null,
					function(loaded){  /* Load complete callback*/

						//create tree item
						var item = new BGameObject(scene, 'tree',
							function(gameObject, deltaTime) /* the tree object's update loop */
							{
								if( BHelper.Input.Mouse.isDown ) //when the mouse down
								{
									if(BHelper.Input.Mouse.isClicked) // when the mouse clicked
									{
										if(gameObject.isClicked(raycaster, camera)) // check the intersection
										{
											scene.add(gameObject.mesh);
											gameObject.originalPos = gameObject.mesh.position.clone();
											character.transitAnimation("SeatShine");
										}
									}else
									{
										if(gameObject.originalPos)
										{
											var x = gameObject.originalPos.x;
											var y = gameObject.originalPos.y;
											var z = gameObject.originalPos.z;
											gameObject.mesh.position.set(x + BHelper.Input.Mouse.pos.x, y, z);
										}
									}
								}
								else
								{
									if(gameObject.originalPos)
		                            {
		                                var orgPos = gameObject.originalPos;
		                                character.transitAnimation("Seat");

		                                BHelper.startCoroutine(0.3, function(tt){
		                                    gameObject.mesh.position.lerp(orgPos, tt);
		                                });
		                            }
		                            gameObject.originalPos = null;
								}
							}
						);

						item.loadJson('docs/assets/tree.js', false, -1, new THREE.TextureLoader().load( 'docs/assets/scene_3_tex.png' ), null,
						function(item) /* the hat object's update loop */
						{


						});
					});
				}
				,

			null, null
		);
		stages[tempStage.name] = tempStage;


		//[CLOUDY] stage
		var tempStage = new BStage("cloudy", scene, camera,
			function() //Start logic
			{
				//spawn background object
				var plate = new BGameObject(scene, 'plate');
				// load bg mesh
				plate.loadJson('docs/assets/scene_cloudy.js', false,-1, new THREE.TextureLoader().load( 'docs/assets/scene_4_tex.png' ), null,
					function(item)  /* Load complete callback*/
					{
						item.mesh.scale.set(1.5,1.5,1.5)
						item.mesh.position.set(0,-0.1,-1)
					});

				// spawn the character
				var character = new BGameObject(scene, 'character');

				// load the character mesh
				character.loadJson('docs/assets/PANDAP.json', true, 9, new THREE.TextureLoader().load( 'docs/assets/PANDAP_uv.png' ), null,
					function(loaded){ /* Load complete callback*/
						character.mesh.position.set(0,1.2,0);
						var itemList = [];

						// main cloud
						var item_Char = new BGameObject(scene, 'cloud_char',
							function(gameObject, deltaTime) /* the clud object's update loop */
							{
								if( BHelper.Input.Mouse.isDown ) // when mouse down
								{
									if(BHelper.Input.Mouse.isClicked) // when clicked
									{
										if(gameObject.isClicked(raycaster, camera)) //when intersect
										{
											scene.add(gameObject.mesh);
											gameObject.originalPos = gameObject.mesh.position.clone();
											character.transitAnimation("HelloTree");
										}
									}else
									{
										if(gameObject.originalPos)
										{
											//follow the mouse
											var x = gameObject.originalPos.x;
											var y = gameObject.originalPos.y;
											var z = gameObject.originalPos.z;
											gameObject.mesh.position.set(x + BHelper.Input.Mouse.pos.x, y, z);
										}
									}
								}
								else
								{
									if(gameObject.originalPos)
		                            {
										//reset to origin
		                                var orgPos = gameObject.originalPos;
		                                character.transitAnimation("SitTree");

		                                BHelper.startCoroutine(0.3, function(tt){
		                                    gameObject.mesh.position.lerp(orgPos, tt);
		                                });
		                            }
		                            gameObject.originalPos = null;
								}

							}
						);

						itemList.push(item_Char);

						//  cloud
						for (var i = 0 ; i < 4; i++){

							//spawn each cloud
							// this cloud is similar with the main cloud but this will not trigger the character's reaction
							var item = new BGameObject(scene, 'cloud_'+i,
								function(gameObject, deltaTime)
								{
									if( BHelper.Input.Mouse.isDown )
									{
										if(BHelper.Input.Mouse.isClicked)
										{
											if(gameObject.isClicked(raycaster, camera))
											{
												scene.add(gameObject.mesh);
												gameObject.originalPos = gameObject.mesh.position.clone();


											}
										}else
										{
											if(gameObject.originalPos)
											{
												var x = gameObject.originalPos.x;
												var y = gameObject.originalPos.y;
												var z = gameObject.originalPos.z;
												gameObject.mesh.position.set(x + BHelper.Input.Mouse.pos.x, y, z);
											}
										}
									}
									else
									{
										if(gameObject.originalPos)
										{
											var orgPos = gameObject.originalPos;

											BHelper.startCoroutine(0.3, function(tt){
												gameObject.mesh.position.lerp(orgPos, tt);
											});
										}
										gameObject.originalPos = null;
									}

								}
							);
							itemList.push(item);
						}

						//Load each cloud
						for (var i =0; i<itemList.length; i++){
							itemList[i].loadJson('docs/assets/cloud_'+i+'.js', false, -1, new THREE.TextureLoader().load( 'docs/assets/scene_4_tex.png' ), null,
						function(item)
						{
						});

						}



					});
				},
			null, null
		);
		stages[tempStage.name] = tempStage;

	}

	return {
		initialize: initialize,
		startStage:startStage,
		activeStage:activeStage,
		update:update,

	}


})();