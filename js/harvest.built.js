/* Harvest v2.3 | (c) 2017 Brandon J. C. Fuller, All Rights Reserved | Requires jQuery 3.1.1 (jquery.org), jQuery UI 1.12.1 (jqueryui.com), and Velocity.js 1.3.1 (velocityjs.org) *//*	HARVEST 
	version 3

	(c) 2017 Brandon J. C. Fuller. All Rights Reserved.		
    
    Requires awesomeplete.js (https://leaverou.github.io/awesomplete/)
	
*/

(function(){

    /*
     * Set up a few things...
     */
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
    
    
    /*
     * Helper functions
     */
    class Helper {
        
        /*
         * Add an input
         * @param form el the form to add the input to
         */
        static addInput(form) {
            var el, input, amount, unit, remove;
            
            // Create row div
            el = document.createElement('div');
            
            // Create input
            input = document.createElement('input');
            input.type = "text";
            input.className = "item";
            input.placeholder = "Enter ingredient";
            el.appendChild(input);
            
            // Create amount
            amount = document.createElement('input');
            amount.type = "text";
            amount.className = "amount";
            el.appendChild(amount);
            
            // Create
            
            // Create remove control
            remove = document.createElement('button');
            remove.type = "button";
            remove.innerHTML = "Remove";
            remove.addEventListener('click', function() {
                this.parentNode.classList.add('removed');
            });
            el.appendChild(remove);
            
            // Append div to form
            form.appendChild(el);
            
            // Initiate awesomplete on input
            new Awesomplete(input, {
                list: H.items,
                autoFirst: true
            });
            
            // Focus input
            input.focus();
        }
        
    }
    
    
    // Go get data once the page loads
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
    
    
    /*
     * Initialize the page
     */
    function init() {
        
        console.log(H);
        
        var form = document.getElementById('form');
        
        // Add an initial input box to the page
        Helper.addInput(form);
        
        // Bind listener to Add Input button
        form.querySelector('#add').addEventListener('click', function(){
            Helper.addInput(form)
        }, false);
        
        // Bind listener to Submit button
        form.querySelector('#submit').addEventListener('click', function(){
            submit(form);
        }, false);
        

    }
    
    
    /*
     * Handle submit
     * @param form el the submit form div
     */
    function submit(form) {
        
        console.log('submitted');
        
        var S = {
                data : {},
                items : []
            };
        
        var inputs, i, name, key;
        
        inputs = form.querySelectorAll('input.item');
        for (i=0; i<inputs.length; i++) {
            name = inputs[i].value;
            if (name) {
                key = name.replace(/\s/g, '');
                S.items.push(name);
                S.data[key] = H.data[key];
            }
        }
        
        console.log(S);
            
        
    }
    
    
    
})();