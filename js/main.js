/**
 * Display tracts from afq_output using the TractView UI
 */

'use strict';

$(function() {
    var config = {
        wf_api: '/api/wf',
        jwt: localStorage.getItem('jwt'),
        num_tracts: 20,
        
        // to be set later
        num_fibers: 0,
        tracts: {},     // toggle on/off fascicles
        debug: true,
    };
    
    if (!config.jwt)
        throw "Error: jwt not set";
    
    // get the url and wrap it in a URL object, for getting GET params later
    var url = new URL(window.location.href),
        task_id = url.searchParams.get('afq'),
        subdir = url.searchParams.get('sdir');

    var task = null;
    
    if(config.debug) {
        task_id = "593ed77da3d8892967678d74";
        //subdir = "output";
        config.wf_api = "https://brainlife.duckdns.org/api/wf";
    }
    
    $.ajax({
        beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer '+config.jwt),
        url: config.wf_api+'/task',
        data: {
            find: JSON.stringify({ _id: task_id, })
        },
        success: data => {
            task = data.tasks[0];
            init_lifeview();
        },
    });
    init_lifeview();
    
    function init_lifeview() {
        var base = task.instance_id + '/' + task._id;
        if (subdir) base += '/' + subdir;
        
        LifeView.init({
            selector: '#lifeview',
            get_json_file: config.wf_api+"/resource/download?r="+
                           task.resource_id+"&p="+
                           encodeURIComponent(base+"/subsampledtracts.json")+
                           "&at="+config.jwt
        });
    }
});
