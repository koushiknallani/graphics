// ProgramObject.js (c) 2012 matsuda and kanda
// Vertex shader for single color drawing
var SOLID_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  vec3 lightDirection = vec3(0.0, 1.0, 1.0);\n' + // Light direction(World coordinate)
　'  vec4 color = vec4(1.0, 0.0, 0.0, 1.0);\n' +     // Face color
　'  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
  '  v_Color = vec4(color.rgb * nDotL, color.a);\n' +
  '}\n';

// Fragment shader for single color drawing
var SOLID_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Vertex shader for texture drawing
var TEXTURE_VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'varying float v_NdotL;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  vec3 lightDirection = vec3(0.0, 1.0, 1.0);\n' + // Light direction(World coordinate)
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_NdotL = max(dot(normal, lightDirection), 0.0);\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Fragment shader for texture drawing
var TEXTURE_FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying float v_NdotL;\n' +
  'void main() {\n' +
  '  vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
  '  gl_FragColor = vec4(color.rgb * v_NdotL, color.a);\n' +
  '}\n';
var pitchAngle = 0;
var minPitchAngle = -90;
var maxPitchAngle = 90;

var yawAngle = 0;
var minYawAngle = -90;
var maxYawAngle = 90;

var rollCamera = false;

var rollAngle = 0;
var minRollAngle = -180;
var maxRollAngle = 180; 

var trackLeftRight = 0;
var pushInPullOut = 0;
var craneUpDown = 0;

var step = 0.5;111111   

var fov = 30;
var fovMin = 10;
var fovMax = 160;

var animated = true;
function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  var solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
  var texProgram = createProgram(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);
  if (!solidProgram || !texProgram) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get storage locations of attribute and uniform variables in program object for single color drawing
  solidProgram.a_Position = gl.getAttribLocation(solidProgram, 'a_Position');
  solidProgram.a_Normal = gl.getAttribLocation(solidProgram, 'a_Normal');
  solidProgram.u_MvpMatrix = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
  solidProgram.u_NormalMatrix = gl.getUniformLocation(solidProgram, 'u_NormalMatrix');

  // Get storage locations of attribute and uniform variables in program object for texture drawing
  texProgram.a_Position = gl.getAttribLocation(texProgram, 'a_Position');
  texProgram.a_Normal = gl.getAttribLocation(texProgram, 'a_Normal');
  texProgram.a_TexCoord = gl.getAttribLocation(texProgram, 'a_TexCoord');
  texProgram.u_MvpMatrix = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
  texProgram.u_NormalMatrix = gl.getUniformLocation(texProgram, 'u_NormalMatrix');
  texProgram.u_Sampler = gl.getUniformLocation(texProgram, 'u_Sampler');

  if (solidProgram.a_Position < 0 || solidProgram.a_Normal < 0 || 
      !solidProgram.u_MvpMatrix || !solidProgram.u_NormalMatrix ||
      texProgram.a_Position < 0 || texProgram.a_Normal < 0 || texProgram.a_TexCoord < 0 ||
      !texProgram.u_MvpMatrix || !texProgram.u_NormalMatrix || !texProgram.u_Sampler) { 
    console.log('Failed to get the storage location of attribute or uniform variable'); 
    return;
  }

  // Set the vertex information
  var cube = initVertexBuffers(gl);
  if (!cube) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set texture
  var texture = initTextures(gl, texProgram);
  if (!texture) {
    console.log('Failed to intialize the texture.');
    return;
  }
  
  initMouseMotionCallback(canvas);
  initKeyboardCallback();

  // Set the clear color and enable the depth test
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Calculate the view projection matrix


  // Start drawing
  var angle = 0.0; // Current rotation angle (degrees)
  currentAngle=0.0;
   var vpMatrix = new Matrix4(); 
  

 
  var tick = function() {
   // currentAngle = animate(currentAngle);  // Update current rotation angle
   
   vpMatrix.setPerspective(fov, canvas.width/canvas.height, 1, 100);
   vpMatrix.translate(-trackLeftRight, 0, 0);
   vpMatrix.translate(0, -craneUpDown, 0);
   vpMatrix.translate(0, 0, pushInPullOut);
   vpMatrix.rotate(pitchAngle, 1, 0, 0);
   vpMatrix.rotate(yawAngle, 0, 1, 0);
   vpMatrix.rotate(rollAngle, 0, 0, 1);
   vpMatrix.lookAt(0, 0, 14, 0, 0, 0, 0, 1, 0);
   
    angle += 5.0;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffers
    // Draw a cube in single color
    drawSolidCube(gl, texProgram, cube, 0.0, angle, vpMatrix);
    // Draw a cube with texture
    drawTexCube(gl, texProgram, cube, texture, 3.0, angle, vpMatrix);
	
	draw2Cube(gl, texProgram, cube, texture, 3.0, angle, vpMatrix);

    window.requestAnimationFrame(tick, canvas);
  };
  
  tick();
}

function initVertexBuffers(gl) {
  

  var vertices = new Float32Array([   // Vertex coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,  // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,  // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,  // v0-v5-v6-v1 top 
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,  // v7-v4-v3-v2 bottom
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5   // v4-v7-v6-v5 back
  ]);

  var normals = new Float32Array([   // Normal
     0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,     // v0-v1-v2-v3 front
     1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,     // v0-v3-v4-v5 right
     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,     // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,     // v1-v6-v7-v2 left
     0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,     // v7-v4-v3-v2 down
     0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0      // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([   // Texture coordinates
     1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
     0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
     1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
     1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
     0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
     0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
  ]);

  var indices = new Uint8Array([        // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  var o = new Object(); // Utilize Object to to return multiple buffer objects together

  // Write vertex information to buffer object
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.normalBuffer = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.normalBuffer || !o.texCoordBuffer || !o.indexBuffer) return null; 

  o.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

function initTextures(gl, program) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return null;
  }

  var image = new Image();  // Create a image object
  if (!image) {
    console.log('Failed to create the image object');
    return null;
  }
  // Register the event handler to be called when image loading is completed
  image.onload = function() {
    // Write the image data to texture object
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Pass the texure unit 0 to u_Sampler
    gl.useProgram(program);
    gl.uniform1i(program.u_Sampler, 0);

    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind texture
  };

  // Tell the browser to load an Image
  image.src = 'abc.png';

  return texture;
}

function drawSolidCube(gl, program, o, x, angle, viewProjMatrix) {
  gl.useProgram(program);   // Tell that this program object is used

  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer); // Vertex coordinates
  initAttributeVariable(gl, program.a_Normal, o.normalBuffer);   // Normal
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);  // Bind indices

  drawCube(gl, program, o, x, angle, viewProjMatrix);   // Draw
}

function drawTexCube(gl, program, o, texture, x, angle, viewProjMatrix) {
  gl.useProgram(program);   // Tell that this program object is used

  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer);  // Vertex coordinates
  initAttributeVariable(gl, program.a_Normal, o.normalBuffer);    // Normal
  initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);// Texture coordinates
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer); // Bind indices

    // Bind texture object to texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  rotateCube(gl, program, o, x, angle, viewProjMatrix); // Draw
}

function draw2Cube(gl, program, o, texture, x, angle, viewProjMatrix) {
  gl.useProgram(program);   // Tell that this program object is used

  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer);  // Vertex coordinates
  initAttributeVariable(gl, program.a_Normal, o.normalBuffer);    // Normal
  initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);// Texture coordinates
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer); // Bind indices

    // Bind texture object to texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  rotate2Cube(gl, program, o, x, angle, viewProjMatrix); // Draw
}


// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

function drawCube(gl, program, o, x, angle, viewProjMatrix) {
  // Calculate a model matrix
  g_modelMatrix.setTranslate(x, 0.0, 0.0);
  g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
  g_modelMatrix.scale(1.0, 1.0, 1.0);

  // Calculate transformation matrix for normals and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

  // Calculate model view projection matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

  gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);   // Draw
}

function rotateCube(gl, program, o, x, angle, viewProjMatrix) {

  currentAngle = animate(currentAngle); 

  var radian = Math.PI * currentAngle / 180.0; // Convert to radians
  var cosB = Math.cos(radian), sinB = Math.sin(radian);
	
	
  // Calculate a model matrix
  g_modelMatrix.setTranslate(1.5*sinB,1.5*cosB, 0.0);
  g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
  g_modelMatrix.scale(0.5, 0.5, 0.5);

  // Calculate transformation matrix for normals and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

  // Calculate model view projection matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

  gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);   // Draw
}


function rotate2Cube(gl, program, o, x, angle, viewProjMatrix) {

  currentAngle = animate(currentAngle); 

  var radian = Math.PI * currentAngle / 180.0; // Convert to radians
  var cosB = Math.cos(-radian), sinB = Math.sin(-radian);
  g_modelMatrix.setTranslate(3*sinB,3*cosB, 0.0);
  g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(-angle, 0.0, 1.0, 0.0);
  g_modelMatrix.scale(0.75, 0.75, 0.75);

  // Calculate transformation matrix for normals and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

  // Calculate model view projection matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

  gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);   // Draw
}


function initArrayBufferForLaterUse(gl, data, num, type) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  buffer.num = num;
  buffer.type = type;
  return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
  var buffer = gl.createBuffer();　  // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  buffer.type = type;
  return buffer;
}

var ANGLE_STEP = 20;   // The increments of rotation angle (degrees)

var last = Date.now(); // Last time that this function was called

function animate(angle) {
  var now = Date.now();   // Calculate the elapsed time
  var elapsed = now - last;
  last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle % 360;
}

 function degToRad(d) {
    return d * Math.PI / 180;
  }

function up(value) {
  ANGLE_STEP= value+10 ;
  angle= value+10;  
}


// Register a keyboard callback function. 
function initKeyboardCallback() {
    document.onkeydown = function(event) {
        switch(event.keyCode) {
            case 82: // Use r or R to turn on/off camera rolling.  
                rollCamera = !rollCamera;
                break;
            case 35: // Use End to turn on/off animation. 
                trackLeftRight=0;
				pushInPullOut=0;
				CraneUpdown=0;
				fov=30;
                break;
            case 37: // Use left arrow to move the camera to the left.  
                trackLeftRight -= step; 
                break;
            case 73: // Use i or I to move the camera forward.  85 u
                 pushInPullOut += step;
                 break;
            case 39: // Use right arrow to move the camera to the right. 
                trackLeftRight += step;
                break; 
            case 79: // Use o or O to move the camera backward.  68 d
                pushInPullOut -= step;
                break;
            case 38: // Use u or U key to move the camera upward. 
                craneUpDown += step;
                break;
            case 40: // Use d or D key to move the camera downward. 
                craneUpDown -= step;
                break;
            
            default: return;
        }
    }
}

var lastX = 0, lastY = 0;
var dMouseX = 0, dMouseY = 0;
var trackingMouseMotion = false;

// Register mouse callback functions 
function initMouseMotionCallback(canvas) {
    
    // If a mouse button is pressed, save the current mouse location
    // and start tracking mouse motion.  
    canvas.onmousedown = function(event) {
        var x = event.clientX;
        var y = event.clientY;
        
        var rect = event.target.getBoundingClientRect();
        // Check if the mouse cursor is in canvas. 
        if (rect.left <= x && rect.right > x &&
            rect.top <= y && rect.bottom > y) {
            lastX = x; 
            lastY = y;
            trackingMouseMotion = true;    
        }
    }

    // If the mouse button is release, stop tracking mouse motion.     
    canvas.onmouseup = function(event) {
        trackingMouseMotion = false; 
    }
    
    // Calculate how far the mouse cusor has moved and convert the mouse motion 
    // to rotation angles. 
    canvas.onmousemove = function(event) {
        var x = event.clientX;
        var y = event.clientY;
                    
        if (trackingMouseMotion) {
            var scale = 1;
            // Calculate how much the mouse has moved along X and Y axis, and then
            // normalize them based on the canvas' width and height. 
            dMouseX = -(x - lastX)/canvas.width;
            dMouseY = -(y - lastY)/canvas.height;            
                
            if (!rollCamera) { 
                // For camera pitch and yaw motions
                scale = 30;
                // Add the mouse motion to the current rotation angle so that the rotation 
                // is added to the previous rotations. 
                // Use scale to control the speed of the rotation.    
                yawAngle += scale * dMouseX;
                // Impose the upper and lower limits to the rotation angle. 
                yawAngle = Math.max(Math.min(yawAngle, maxYawAngle), minYawAngle); 
                
                pitchAngle += scale * dMouseY;
                pitchAngle = Math.max(Math.min(pitchAngle, maxPitchAngle), minPitchAngle);
            } else {
                // For camera roll motion
                scale = 100; 
                
                // Add the mouse motion delta to the rotation angle, don't just replace it.
                // Use scale to control the speed of the rotation. 
                rollAngle += scale * dMouseX;
                rollAngle %= 360;
            }
        }
        
        // Save the current mouse location in order to calculate the next mouse motion. 
        lastX = x;
        lastY = y;
    }
}




