/**
 * Display tracts from afq_output using the TractView UI
 */

'use strict';

$(function() {
    var config = {
        wf_api: '/api/wf',
        jwt: localStorage.getItem('jwt'),
        debug: true
    };
    
    if (!config.jwt) throw "Error: jwt not set";
    
    // get the url and wrap it in a URL object, for getting GET params later
    var url = new URL(window.location.href);
    var task_id = url.searchParams.get('taskid');
    var subdir = url.searchParams.get('sdir');

    //for debugging
    if(url.hostname == "localhost") {
        task_id = "59b6b040478d350714613670";
        config.wf_api = "https://dev1.soichi.us/api/wf";
    }
    
    $.ajax({
        beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer '+config.jwt),
        url: config.wf_api+'/task',
        data: {
            find: JSON.stringify({ _id: task_id, })
        },
        success: data => {
            task = data.tasks[0];
        	var base = task.instance_id;// + '/' + task._id;
		    if (subdir) base += '/' + subdir;
		    LifeView.init({
                selector: '#lifeview',
                num_buckets: 10,
                url: config.wf_api+"/resource/download?r="+task.resource_id+"&p="+encodeURIComponent(base+"/life_results.json")+"&at="+config.jwt
            });
        },
    });
});
