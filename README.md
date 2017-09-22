# ui-lifeview

UI to visualize the output from [app-life](https://github.com/brain-life/app-life)

## Install

Install for general purpose use

```
npm install ui-lifeview
```

Include script dependencies in your index.html file:

```
<!-- Dep Scripts -->
<script type="text/javascript" src="node_modules/jquery/dist/jquery.min.js"></script>
<script type="text/javascript" src="node_modules/three/build/three.min.js"></script>
<script type="text/javascript" src="node_modules/panning-orbit-controls/dist/panning-orbit-controls.js">

<!-- Main Scripts -->
<script type="text/javascript" src="node_modules/ui-lifeview/js/lifeview.js"></script>

<!-- Dep Styles -->
<link rel="stylesheet" type="text/css" href="node_modules/bootstrap/dist/css/bootstrap.min.css" />
```

Include your main.js file inside index.html:

`<script type="text/javascript" src="js/main.js"></script>`

Create an element to append lifeview controls to:

`<div id='lifeview' style='position:relative; width:100vw; height: 100vh;'></div>`

An explicit width/height for this element is **not** required, notice that above we just set it to the full window width/height.

Inside main.js, on window load, init the life viewer:

```
$(function(){
    LifeView.init({
        selector: '#lifeview',
        num_buckets: 10,
        url: 'path/to/json/file'
    });
});
```

`selector` represents the query selector for the element that will contain the life viewer.

`num_buckets` is the number of buckets to aggregate tracts into as to determine their relative 

`url` represents the url which links to the json file containing your tracts and weights. The json file should have the following format:

```
{
    "name": "subsampled (x10) pos. weighted life output",
    "coords": [                             // list of tracts
        [
            [-21.69491386, -21.64446831, -21.4675293, ...],  // list of x coordinates
            [43.13895035, 42.14380264, 41.15979385, ...],    // list of y coordinates
            [1.224040627, 1.165375113, 1.165637732, ...]     // list of z coordinates
        ],
        [
            ...
        ],
        ...
    ],
    "weights": [
        [0.00373989572],
		[0.002710784088],
        [0.02659222749],
		[0.01242249065],
        ...
    ]
    ...
}
```
