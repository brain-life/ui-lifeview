/**
 * Display tracts from afq_output using the TractView UI
 */

'use strict';

$(function() {
    var config = {
        wf_api: '/api/wf',
        jwt: localStorage.getItem('jwt')
    };
    
    if (!config.jwt)
        throw "Error: jwt not set";
    
    // get the url and wrap it in a URL object, for getting GET params later
    var url = new URL(window.location.href),
        task_id = url.searchParams.get('afq'),
        subdir = url.searchParams.get('sdir');

    var task = null;
    
    if(config.debug) {
        task_id = "59b6b040478d350714613670";
        //subdir = "output";
        config.wf_api = "https://brainlife.duckdns.org/api/wf";
    }
    
    /*
    $.ajax({
        beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer '+config.jwt),
        url: config.wf_api+'/task',
        data: {
            find: JSON.stringify({ _id: task_id, })
        },
        success: data => {
            console.log(data);
            task = data.tasks[0];
            init_lifeview();
        },
    });*/
    init_lifeview();
    
    function init_lifeview() {
        //var base = task.instance_id;// + '/' + task._id;
        //if (subdir) base += '/' + subdir;
        
        LifeView.init({
            selector: '#lifeview',
            skip: 1,
            num_buckets: 10,
            get_json_file: "https://brainlife.duckdns.org/files/subsampledtracts.json"/*config.wf_api+"/resource/download?r="+
                           task.resource_id+"&p="+
                           encodeURIComponent(base+"/life_results.json")+
                           "&at="+config.jwt*/
        });
    }
});
