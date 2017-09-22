/**
 * UI to display output tracts from LiFE, with weighted color maps
 */

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

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
            camera.position.z = 200;
            
            //resize view
            function resized() {
                camera.aspect = view.width() / view.height();
                camera.updateProjectionMatrix();
                renderer.setSize(view.width(), view.height());
            }
            $(window).on('resize', resized);
            view.on('resize', resized);
            
            load_tract(config, function(err, mesh, res) {
                scene.add(mesh);
            });
            
            renderer.autoClear = false;
            renderer.setSize(view.width(), view.height());
            view.append(renderer.domElement);
            renderer.domElement.style.background = "darkgreen";
            
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
        
        function load_tract(config, cb) {
            $.get(config.get_json_file, res => {
                var name = res.name;
                var color = [1, 1, 1];//res.color;
                var bundle = res.coords;
                var weights = (res.weights || []).filter(weight => weight[0] != 0);

                // var threads_pos = [];
                var am = 0;
                var col = new THREE.Color(.7, .7, .7);
                
                var buckets = [], num_buckets = config.num_buckets || 100, verts = [];
                
                var lp01 = 0;
                var hist = [];
                
                // create discrete buckets
                for (var i = 0; i < num_buckets; i++) {
                    
                    buckets.push(new THREE.LineBasicMaterial({
                        color: new THREE.Color(1, 1, 1),//new THREE.Color(i.map(0, num_buckets, 0, 1), 0, 0),
                        transparent: true,
                        opacity: i.map(0, num_buckets, 0, 1)
                    }));
                }
                
                //bundle = [bundle[0]];
                bundle.forEach(function(tract, tidx) {
                    if (tract[0] instanceof Array)
                        tract = tract[0];
                    
                    var gidx_c = weights[tidx][0].map(0, .15, 0, num_buckets);
                    var gidx = Math.min( Math.round(gidx_c), num_buckets - 1 );
                    
                    //|| 0, gidx = Math.floor(weight * num_buckets);
                    hist[gidx] = (hist[gidx] || 0) + 1;
                    
                    if (typeof verts[gidx] == 'undefined')
                        verts[gidx] = [];
                    
                    var xs = tract[0];
                    var ys = tract[1];
                    var zs = tract[2];
                    
                    for(var i = 1;i < xs.length;++i) {
                        verts[gidx].push(xs[i-1]);
                        verts[gidx].push(ys[i-1]);
                        verts[gidx].push(zs[i-1]);
                        
                        verts[gidx].push(xs[i]);
                        verts[gidx].push(ys[i]);
                        verts[gidx].push(zs[i]);
                    }
                    
                });
                // for (var i = 0; i < hist.length; i++) {
                //     if (i < 100 && hist[i] > 0) {
                //         console.log(i, i.map(0, num_buckets, .5, 1), hist[i]);
                //     }
                // }
                console.log("AMOUNT: " + bundle.length);
                
                verts.forEach((threads, idx) => {
                    if (threads) {
                        var geometry = new THREE.BufferGeometry();
                        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(threads), 3));
                        
                        var mesh = new THREE.LineSegments( geometry, buckets[idx] );
                        mesh.rotation.x = -Math.PI/2;
                        
                        cb(null, mesh, res);
                    }
                });
                
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
