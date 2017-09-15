/**
 * UI to display output tracts from LiFE, with weighted color maps
 */

var LifeView = {
    
    /**
     * Inits the life viewer
     * 
     * @param {String} config.selector -> Query selector for the element that will contain the tractview control
     * @param {Number} config.num_tracts -> Number of tracts to be loaded
     * @param {Function} config.get_json_file -> Function that returns the path to the json file containing a tract, given the tract number
     * 
     * (Optional)
     * @param {String} config.preview_scene_path -> Path to the scene to use which portrays the orientation of the brain
     */
    init: function(config) {
        if (!config)
            throw "Error: No config provided";
        // set up for later
        config.tracts = {};
        config.num_fibers = 0;
        config.LRtractNames = {};
        
        if (typeof config.selector != 'string')
            throw "Error: config.selector not provided or not set to a string";
        if (typeof config.get_json_file != 'string')
            throw "Error: config.get_json_file not provided or not set to a string";
        
        var user_container = $(config.selector);
        if (user_container.length == 0)
            throw `Error: Selector '${selector}' did not match any elements`;
        
        populateHtml(user_container);
        
        var view = user_container.find("#viewer");
        
        init_viewer();
        
        function init_viewer() {
            var renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
            var scene = new THREE.Scene();
            
            //camera
            var camera = new THREE.PerspectiveCamera( 45, view.width() / view.height(), 1, 5000);
            
            //resize view
            function resized() {
                camera.aspect = view.width() / view.height();
                camera.updateProjectionMatrix();
                renderer.setSize(view.width(), view.height());
            }
            $(window).on('resize', resized);
            view.on('resize', resized);
            
            load_tract(config.get_json_file, function(err, mesh, res) {
                scene.add(mesh);
            });
            // for(var i = 1;i <= config.num_tracts;++i) {
            //     // load the tract
            //     load_tract(config.get_json_file(i), function(err, mesh, res) {
            //         scene.add(mesh);
                    
            //         config.num_fibers += res.coords.length;
                    
            //         config.tracts[res.name] = mesh;
                    
            //         // when all tracts are loaded, add the toggles to the side banner
            //         if (Object.keys(config.tracts).length == config.num_tracts)
            //             makeTractToggles();
            //     });
            // }
            
            renderer.autoClear = false;
            renderer.setSize(view.width(), view.height());
            view.append(renderer.domElement);

            //use OrbitControls and make camera light follow camera position
            var controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.autoRotate = true;
            controls.addEventListener('change', function() {
                //rotation changes
            });
            controls.addEventListener('start', function(){
                //use interacting with control
                controls.autoRotate = false;
            });
            function animate_viewer() {
                controls.update();
                
                renderer.clear();
                renderer.clearDepth();
                renderer.render( scene, camera );

                requestAnimationFrame( animate_viewer );
            }
            
            animate_viewer();
        }
        
        function load_tract(path, cb) {
            //console.log("loading tract "+path);
            //$scope.loading = true;
            $.get(path, res => {
                var name = res.name;
                var color = [1, 1, 1];//res.color;
                var bundle = res.coords;

                var threads_pos = [];
                //bundle = [bundle[0]];
                bundle.forEach(function(tract) {
                    if (tract[0] instanceof Array)
                        tract = tract[0];
                    var xs = tract[0];
                    var ys = tract[1];
                    var zs = tract[2];

                    for(var i = 1;i < xs.length;++i) {
                        threads_pos.push(xs[i-1]);
                        threads_pos.push(ys[i-1]);
                        threads_pos.push(zs[i-1]);
                        threads_pos.push(xs[i]);
                        threads_pos.push(ys[i]);
                        threads_pos.push(zs[i]);
                    }
                });

                //now show bundle
                var vertices = new Float32Array(threads_pos);
                var geometry = new THREE.BufferGeometry();
                geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3 ) );
                var material = new THREE.LineBasicMaterial( {
                    color: new THREE.Color(color[0], color[1], color[2]),
                    transparent: true,
                    opacity: 0.7,
                } );
                var mesh = new THREE.LineSegments( geometry, material );
                mesh.rotation.x = -Math.PI/2;
                //temporarly hack to fit fascicles inside
                //mesh.position.z = -20;
                //mesh.position.y = -20;

                cb(null, mesh, res);
            });
        }
        
        function populateHtml(element) {
            element.html(`
            <div class="container">
                <!-- Main Connectome View -->
                <div id="viewer" class="viewer"></div>
            </div>
            
            <style scoped>
                .container {
                    width: 100%;
                    height: 100%;
                    padding: 0px;
                }
                .viewer {
                    width:100%;
                    height: 100%;
                    background:black;
                }
            </style>
            `);
        }
    }
    
};
