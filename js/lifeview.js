'use strict';

(function() {
//

let debounce;

Vue.component('lifeview', {
    props: [ 'url', 'buckets' ],
    
    data() {
        return {
            scene: null,
            controls: null,
            camera: null,
            renderer: null,
            materials: [],
            hist: [],
            
            loading: true,
            status: null,
            minThreshold: 0,
            maxThreshold: 1,
            
            tinyBrainScene: null,
            tinyBrainCam: null,
            brainRenderer: null,
        };
    },
    
    mounted: function() {
        let vm = this;
        let viewbox = this.$refs.view.getBoundingClientRect();
        let tinybrainbox = this.$refs.tinybrain.getBoundingClientRect();
        
        this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        this.brainRenderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        
        this.scene = new THREE.Scene();
        
        //camera
        this.camera = new THREE.PerspectiveCamera( 45, viewbox.width / viewbox.height, 1, 5000);
        this.camera.position.z = 200;
        
        this.tinyBrainCam = new THREE.PerspectiveCamera(45, tinybrainbox.width / tinybrainbox.height, 1, 5000);
        
        //resize view
        
        window.addEventListener('resize', this.resized);
        this.$refs.view.addEventListener('resize', this.resized);
        
        this.load_tracts(mesh => vm.scene.add(mesh));
        this.load_tinybrain();
        
        this.renderer.autoClear = false;
        this.renderer.setSize(viewbox.width, viewbox.height);
        this.$refs.view.appendChild(this.renderer.domElement);
        
        this.brainRenderer.autoClear = false;
        this.brainRenderer.setSize(tinybrainbox.width, tinybrainbox.height);
        this.$refs.tinybrain.appendChild(this.brainRenderer.domElement);

        //use OrbitControls and make camera light follow camera position
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.autoRotate = true;
        
        this.controls.addEventListener('start', function(){
            vm.controls.autoRotate = false;
        });
        
        this.animate_viewer();
    },
    
    methods: {
        animate_viewer: function() {
            if (!this.loading) {
                this.controls.enableKeys = this.allowKeyControls();
                // update tiny brain
                if (this.tinyBrainScene) {
                    let pan = this.controls.getPanOffset();
                    let pos3 = new THREE.Vector3(
                        this.camera.position.x - pan.x,
                        this.camera.position.y - pan.y,
                        this.camera.position.z - pan.z
                    ).normalize();
                    this.tinyBrainCam.position.set(pos3.x * 10, pos3.y * 10, pos3.z * 10);
                    this.tinyBrainCam.rotation.copy(this.camera.rotation);
            
                    this.brainlight.position.copy(this.tinyBrainCam.position);
            
                    this.brainRenderer.clear();
                    this.brainRenderer.render(this.tinyBrainScene, this.tinyBrainCam);
                }
                
                this.controls.update();
                this.renderer.clear();
                this.renderer.clearDepth();
                this.renderer.render( this.scene, this.camera );
            }
            
            requestAnimationFrame( this.animate_viewer );
        },

        load_tinybrain: function() {
            new THREE.ObjectLoader()
            .load('models/brain.json', _scene => {
                this.tinyBrainScene = _scene;
                let brainMesh = this.tinyBrainScene.children[1],
                    unnecessaryDirectionalLight = this.tinyBrainScene.children[2];

                brainMesh.rotation.z += Math.PI / 2;
                brainMesh.material = new THREE.MeshLambertMaterial({ color: 0xffcc99 });

                this.tinyBrainScene.remove(unnecessaryDirectionalLight);
                this.tinyBrainScene.add(new THREE.AmbientLight(0x101010));

                this.brainlight = new THREE.PointLight(0xffffff, 1);
                this.brainlight.radius = 20;
                this.brainlight.position.copy(this.tinyBrainCam.position);
                this.tinyBrainScene.add(this.brainlight);
            });
        },

        load_tracts: function(cb) {
            let vm = this;
            fetch(this.url).then(res=>res.json()).then(res=>{
                //var name = res.name;
                //var color = [1, 1, 1];
                //var am = 0;
                //var col = new THREE.Color(.7, .7, .7);
                vm.loading = false;
                
                var num_buckets = this.buckets || 128;
                var verts = [];
                var lp01 = 0;

                console.log("loaded");
                console.dir(res);
                this.status = res.name+ " (" + res.coords.length + " tracts)";

                for (var i = 0; i < num_buckets; i++) {
                    //use opacity 
                    vm.materials.push(new THREE.LineBasicMaterial({
                        transparent: true,
                        color: new THREE.Color(1, 1, 1),
                        opacity: i.map(0, num_buckets, 0, 1)
                    }));
                    
                    vm.hist[i] = 0;
                }
                
                res.coords.forEach(function(tract, tidx) {
                    //if (tract[0] instanceof Array) tract = tract[0];
                    //var gidx = res.weights[tidx].map(0, .1, 0, vm.materials.length);
                    var w = res.weights[tidx];
                    var logw = Math.log(w);
                    var gidx = Math.round(logw.map(-10, 0, 0, vm.materials.length));
                    if(gidx >= vm.materials.length) gidx = vm.materials.length - 1;

                    if(gidx < 1) gidx = 0;

                    vm.hist[gidx]++;
                    
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
                console.dir(vm.hist);
                
                verts.forEach((threads, idx) => {
                    if (threads) {
                        var geometry = new THREE.BufferGeometry();
                        geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(threads), 3));
                        
                        var mesh = new THREE.LineSegments( geometry, vm.materials[idx] );
                        mesh.rotation.x = -Math.PI/2;
                        
                        cb(mesh);
                    }
                });

            }).catch(err => vm.$refs.view.innerHTML = err.toString() );
        },
        
        resized: function() {
            let viewbox = this.$refs.view.getBoundingClientRect();
            this.camera.aspect = viewbox.width / viewbox.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(viewbox.width, viewbox.height);
        },
        
        allowKeyControls: function() {
            let allow = true;
            Object.keys(this.$refs)
            .forEach(k => allow = allow && document.activeElement != this.$refs[k]);
            return allow;
        },
        
        thresholdBuckets: function() {
            let minRange = Math.round(this.materials.length * this.minThreshold);
            let maxRange = Math.round(this.materials.length * this.maxThreshold);
            
            this.materials.forEach((material, idx) => material.visible = idx >= minRange && idx<= maxRange);
        }
    },
    
    watch: {
        'minThreshold': function() {
            let vm = this;
            let key = setTimeout(function(){
                if (debounce == key) vm.thresholdBuckets();
            }, 500);
            debounce = key;
        },
        
        'maxThreshold': function() {
            let vm = this;
            let key = setTimeout(function(){
                if (debounce == key) vm.thresholdBuckets();
            }, 500);
            debounce = key;
        }
    },
    
    template:
    `<div class="container" style="position:relative;display:inline-block;width:100%;height:100%;">
        <div style="position:absolute;bottom:0;width:100px;height:100px;" ref="tinybrain"></div>
        <div style="position:absolute; color: white; opacity: .5; font-family:Arial; font-size:17px; padding: 25px;">
            <div v-if="loading">Loading...</div>
            <div v-if="!loading">
                <div v-if='status'>{{status}}</div>
                <table v-if="!loading">
                    <tr>
                        <td>Threshold:</td>
                        <td><input v-model='minThreshold' ref="minThreshold" type='number' min='0' :max='maxThreshold' step='.05' /></td>
                        <td><input v-model='maxThreshold' ref="maxThreshold" type='number' :min='minThreshold' max='1' step='.05' /></td>
                    </tr>
                </table>
                <div><input type='checkbox' v-model='controls.autoRotate' /> Rotate</div>
            </div>
        </div>
        <div style="display:inline-block;width:100%;height:100%;background:#36c;" ref="view"></div>
    </div>`
});

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

})();