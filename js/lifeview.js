
Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

var LifeView = {
    
    /**
     * Inits the life viewer
     * 
     * @param {String} config.selector -> Query selector for the element that will contain the tractview control
     * @param {Number} config.num_tracts -> Number of tracts to be loaded
     * @param {Function} config.url -> path to the json file containing a tract, given the tract number
     * 
     * (Optional)
     * @param {String} config.preview_scene_path -> Path to the scene to use which portrays the orientation of the brain
     */
    init: function(config) {
        if (!config) throw "Error: No config provided";
        // set up for later
        config.tracts = {};
        config.num_fibers = 0;
        config.LRtractNames = {};
        
        if (typeof config.selector != 'string') throw "Error: config.selector not provided or not set to a string";
        if (typeof config.url != 'string') throw "Error: config.url not provided or not set to a string";
        
        var user_container = $(config.selector);
        if (user_container.length == 0) throw `Error: Selector '${selector}' did not match any elements`;
        
        populateHtml(user_container);
        
        var view = user_container.find("#viewer");
        var statusview = user_container.find("#status");
        statusview.html("<h2>Loading Data ...</h2>");
        
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
            
            //use OrbitControls and make camera light follow camera position
            var controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.autoRotate = true;
            /*
            controls.addEventListener('change', function() {
                //rotation changes
            });
            */
            controls.addEventListener('start', function(){
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
            fetch(config.url).then(res=>res.json()).then(res=>{
                //var name = res.name;
                //var color = [1, 1, 1];
                //var am = 0;
                //var col = new THREE.Color(.7, .7, .7);
                var materials = [];
                var num_buckets = config.num_buckets || 128;
                var verts = [];
                var lp01 = 0;
                var hist = [];

                console.log("loaded");
                console.dir(res);
                statusview.html(res.name+" ("+res.coords.length+" tracts)");
                
                for (var i = 0; i < num_buckets; i++) {
                    //use opacity 
                    materials.push(new THREE.LineBasicMaterial({
                        transparent: true,
                        color: new THREE.Color(1, 1, 1),
                        opacity: i.map(0, num_buckets, 0, 1)
                    }));

                    /*
                    //use color
                    var c = i.map(0, num_buckets, 0, 1);
                    materials.push(new THREE.LineBasicMaterial({
                        transparent: false,
                        color: new THREE.Color(c,c,c),
                    }));
                    */

                    hist[i] = 0;
                }
                
                res.coords.forEach(function(tract, tidx) {
                    //if (tract[0] instanceof Array) tract = tract[0];
                    //var gidx = res.weights[tidx].map(0, .1, 0, materials.length);
                    var w = res.weights[tidx];
                    var logw = Math.log(w);
                    var gidx = Math.round(logw.map(-10, 0, 0, materials.length));
                    if(gidx >= materials.length) gidx = materials.length - 1;

                    if(gidx < 1) gidx = 0;

                    hist[gidx]++;
                    
                    if (typeof verts[gidx] == 'undefined') verts[gidx] = []; //why does this happen?
                    
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
                console.dir(hist);
                //console.log("AMOUNT: " + res.coords.length);
                
                verts.forEach((threads, idx) => {
                    if (threads) {
                        var geometry = new THREE.BufferGeometry();
                        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(threads), 3));
                        
                        var mesh = new THREE.LineSegments( geometry, materials[idx] );
                        mesh.rotation.x = -Math.PI/2;
                        
                        cb(null, mesh, res);
                    }
                });

            }).catch(err=>{
                statusview.html(err.toString());
            });
        }
        
        function populateHtml(element) {
            element.html(`
            <div class="container">
                <div id="status"/>
                <div id="viewer"/>
            </div>
            
            <style scoped>
                .container {
                    width: 100%;
                    height: 100%;
                    padding: 0px;
                }
                #viewer {
                    width:100%;
                    height: 100%;
                }
                #status {
                    position: fixed;
                    top: 0px;
                    color: white;
                    padding: 25px;
                    font-family: Arial;
                    opacity: 0.5;
                }
            </style>
            `);
        }
    }
    
};
