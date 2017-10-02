/*	HARVEST 
	version 3

	(c) 2017 Brandon J. C. Fuller. All Rights Reserved.		
	
*/

(function($){

    // Set up a few things...
    var H = {
        data : {},
        items : [],
        metrics : [],
        units : {
            v : ['ml','tsp','tbsp','fl oz', 'cup', 'pint', 'quart'],
			w : ['g','oz','lb'],
            conv : {
                ml:{ ml:1, tsp:0.2028, tbsp:0.0676, floz:0.0338, cup:0.0042, pint:0.0021, quart:0.0011 },
                tsp:{ ml:4.93, tsp:1, tbsp:0.3333, floz:0.1666, cup:0.0208, pint:0.0104, quart:0.0052 },
                tbsp:{ ml:14.79, tsp:3, tbsp:1, floz:0.5, cup:0.0625, pint:0.0312, quart:0.0156 },
                floz:{ ml:29.57, tsp:6, tbsp:2, floz:1, cup:0.125, pint:0.0624, quart:0.0312 },
                cup:{ ml:236.59, tsp:48, tbsp:16, floz:8, cup:1, pint:0.5, quart:0.25 },
                pint:{ ml:473.18, tsp:96, tbsp:32, floz:16, cup:2, pint:1, quart:0.5 },
                quart:{ ml:946.35, tsp:192, tbsp:64, floz:32, cup:4, pint:2, quart:1 },
                g:{ g:1, oz:0.0353, lb:0.0022 },
                oz:{ g:28.35, oz:1, lb:0.0625 },
                lb:{ g:453.59, oz:16, lb:1 }
            }
        }
    };

    window.addEventListener('load', getData(parse), false);
    

    /*
     * Get data from Google Spreadsheet JSON API
     * @param success func the callback function
     */
    function getData(success) {
        var spreadsheetID, url, xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == XMLHttpRequest.DONE && xmlhttp.status == 200) {
                success(xmlhttp.responseText);
            }
        };
        
        spreadsheetID  = "1mmewbLHeNnSd0ZPk7aWNspydF5b6ZTH1oAHWy2VnOAc";
        url = "https://spreadsheets.google.com/feeds/list/" + spreadsheetID + "/default/public/values?alt=json";

        xmlhttp.open('GET', url, true);
        xmlhttp.send();

    }
    
    
    /*
     * Parse JSON data into a more usable form
     * @param data obj the raw data
     */
    function parse(data) {
        var data, entries, name, parsed = {};
        
        data = JSON.parse(data);
        entries = data.feed.entry;
                        
        for(var i=0; i<entries.length; i++) {
                     
            var entry = {};
            
            for (var key in entries[i]) {
                if (key.includes('gsx$') && key != 'gsx$name' ) {
                    entry[key.replace('gsx$', '')] = entries[i][key].$t;
                }
            }
                        
            name = entries[i].gsx$name.$t;
            H.items.push(name);
            parsed[name.replace(/\s/g, '')] = entry;
            
        }  
        
        for (var x in entry) {
            H.metrics.push(x);
        }
                
        H.data = parsed;
        init();
        
    }
    
    class controls {
        
        /*
         * Add an input
         * @param form el the form to add the input to
         */
        static addInput(form) {
            var el = document.createElement('input');
            el.type = "text";
            el.placeholder = "Enter ingredient";
            $(el).autocomplete({
                source: H.items,
                autoFocus: true, 
                delay: 0 
            });
            form.appendChild(el);
            el.focus();
        }
        
    }
    
    
    /*
     * Initialize the page
     */
    function init() {
        
        console.log(H);
        
        var form = document.getElementById('input');
        
        // Add an initial input box to the page
        controls.addInput(form);
        
        // Bind listener to Add Input button
        form.querySelector('#add').addEventListener('click', function(){
            controls.addInput(form)
        }, false);
        

    }
    
    
    
})(jQuery);