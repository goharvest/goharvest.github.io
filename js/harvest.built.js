/* Harvest v2.3 | (c) 2017 Brandon J. C. Fuller, All Rights Reserved | Requires jQuery 3.1.1 (jquery.org), jQuery UI 1.12.1 (jqueryui.com), and Velocity.js 1.3.1 (velocityjs.org) *//*	HARVEST 
	version 3

	(c) 2017 Brandon J. C. Fuller. All Rights Reserved.		
    
	
*/

(function($){

    /*
     * Set up a few things...
     */
    var H = {
        data : {},
        items : [],
        metrics : [],
        exclude : ['name', 'serving', 'unit', 'mass'],
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
            var el, parts = {};
            
            // Create row div
            el = document.createElement('div');
            el.className = 'entry';
            
            // Create input
            parts.input = document.createElement('input');
            parts.input.type = 'text';
            parts.input.className = 'item';
            parts.input.placeholder = 'Enter ingredient';
            el.appendChild(parts.input);
            
            // Create amount
            parts.amount = document.createElement('input');
            parts.amount.type = 'text';
            parts.amount.className = 'amount hidden';
            parts.amount.value = '1';
            el.appendChild(parts.amount);
            
            parts.units = document.createElement('select');
            parts.units.className = 'units hidden';
            el.appendChild(parts.units);
                        
            // Create remove control
            parts.remove = document.createElement('button');
            parts.remove.type = 'button';
            parts.remove.innerHTML = 'Remove';
            parts.remove.className = 'hidden';
            parts.remove.addEventListener('click', function() {
                this.parentNode.classList.add('removed');
            });
            el.appendChild(parts.remove);
            
            // Append div to form
            form.appendChild(el);
            
            // Initiate autocomplete
            $(parts.input).autocomplete({
                source: H.items,
                autoFocus: true, 
                delay: 0,
                select: function(event, ui){ 
                    parts.input.value = ui.item.value;
                    Helper.buildUnitList(parts);
                }
            });
            
            // Focus input
            parts.input.focus();
        }
        
        
        /*
         * Build the units select menu and display hidden parts
         * @param parts obj the entry's DOM parts
         */
        static buildUnitList(parts) {
            var ul, output = '';
            
            ul = Helper.getProperUnits(parts.input);
                                    
            for(var i=0; i<ul.length; i++) {
                output += '<option value="' + ul[i].replace(/\s/g, '') + '">' + ul[i] + '</option>';
            }
            parts.units.innerHTML = output;
            
            parts.units.value = H.data[parts.input.value.replace(/\s/g, '')].unit;
                        
            parts.units.classList.remove('hidden');
            parts.amount.classList.remove('hidden');
            parts.remove.classList.remove('hidden');
            
        }
        
        
        /*
         * Return the proper units for the selected item
         * @param input el the item input
         * @return arr an array with the available units
         */
        static getProperUnits(input) {           
            var item, unit;
            
            item = input.value.replace(/\s/g, '');
            unit = H.data[item].unit;
                                    
            if (H.units.w.indexOf(unit) > -1) {
                return H.units.w;
            } else if (H.units.v.indexOf(unit) > -1) {
                return H.units.v;
            } else {
                unit = [unit];
                return unit;
            }
            
        }
        
        
        static doConversion(S, item, conv) {
                        
            var data = {}, m, x, y;
            
            x = S.specs[item].unit;
            y = H.data[item].unit;
                        
            for (var i=0; i<H.metrics.length; i++) {
                m = H.metrics[i];
                data[m] = H.data[item][m].replace('%', '');
                
                // Convert original data to new units, but only if there's something to convert to
                if (H.units.w.indexOf(x) > -1 || H.units.v.indexOf(x) > -1) {
                    data[m] *= H.units.conv[x][y];
                }
                
                // Adjust for entered amount and servings
                data[m] = data[m] / H.data[item].serving * S.specs[item].amount / S.servings;
            }
            
            return data;
            
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
        var entries, entry, name, parsed = {};
        
        data = JSON.parse(data);
        entries = data.feed.entry;
                        
        for(var i=0; i<entries.length; i++) {
                     
            entry = {};
            
            for (var key in entries[i]) {
                if (key.includes('gsx$') && key != 'gsx$name') {
                    entry[key.replace('gsx$', '')] = entries[i][key].$t;
                    
                }
            }
                        
            name = entries[i].gsx$name.$t;
            H.items.push(name);
            parsed[name.replace(/\s/g, '')] = entry;
            
        }  
                
        for (var x in entry) {
            if (H.exclude.indexOf(x) == -1) {
                H.metrics.push(x);
            }
        }
                
        H.data = parsed;
        init();
        
    }
    
    
    /*
     * Initialize the page
     */
    function init() {
        
        console.log('H', H);
        
        var form = document.getElementById('form');
        
        // Add an initial input box to the page
        Helper.addInput(form);
        
        // Bind listener to Add Input button
        form.querySelector('#add').addEventListener('click', function(){
            Helper.addInput(form);
        }, false);
        
        // Bind listener to Submit button
        form.querySelector('#submit').addEventListener('click', function(){
            submit(form);
        }, false);
        

    }
    
    
    /*
     * Handle the submit
     * @param form el the submit form div
     */
    function submit(form) {
        
        console.log('submitted');
        
        var entries, name, amount, unit, key, totals = [], i, x;
        
        var S = {
                specs : {},
                servings : document.getElementById('servings').value,
                totals : {}
            };
        
        // Gather all entries and populate S with the information
        entries = form.querySelectorAll('div.entry:not(.removed)');

        for (i=0; i<entries.length; i++) {
            
            name = entries[i].querySelector('input.item').value;
            
            if (name) {
                
                amount = entries[i].querySelector('input.amount').value;
                unit = entries[i].querySelector('select.units').value;
                                
                key = name.replace(/\s/g, '');
                
                S.specs[key] = {
                    name : name,
                    amount : amount,
                    unit : unit
                };
                   
                // Send data out for unit/amount conversion
                S.specs[key].data = Helper.doConversion(S, key);
            }
        }
                    
        // Add metrics together across items
        for (x in S.specs) {
            totals.push(S.specs[x].data);
        }
                
        for (i=0; i<totals.length; i++) {
            for (x in totals[i]) {
                S.totals[x] = (S.totals[x] || 0) + totals[i][x];
            }
        }
        
        console.log('S', S);
        
        
    }     
    
    
    
    
})(jQuery);