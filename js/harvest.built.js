/* Harvest v3 | (c) 2017 Brandon J. C. Fuller, All Rights Reserved | Requires jQuery and jQuery UI *//*	HARVEST 
	version 3

	(c) 2017 Brandon J. C. Fuller. All Rights Reserved.		
    
	
*/

(function($){

    /*
     * Set up a few things...
     */
    var H = {
        gid : '1mmewbLHeNnSd0ZPk7aWNspydF5b6ZTH1oAHWy2VnOAc',
        data : {},
        items : [],
        metrics : [],
        exclude : ['name', 'serving', 'unit', 'mass'],
        undo : [],
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
     * Autocomplete
     */
    var AC = {
        
        init: function(el) {
            
            var e = {
                el : el,
                parent : el.parentNode,
                ul : document.createElement('ul')
            };
            
            e.ul.className = 'autocomplete';
            e.parent.insertBefore(e.ul, e.el);
            
            e.el.addEventListener('input', function() {
                AC.call(e);
            });
            
        },
        
        call: function(e) {
            
            var val, list, re, i, li;
            
            val = e.el.value;
            list = [];
            re = new RegExp(val, 'i');
                        
            for (i in H.items) {
                if (re.test(H.items[i])) {
                    list.push(H.items[i]);
                }
            }
                        
            e.ul.innerHTML = '';
            
            for (i in list) {
                li = document.createElement('li');
                li.innerHTML = list[i];
                e.ul.appendChild(li);    
            }
            
            
        }
        
    };
    
    
    /*
     * Helper functions
     */
    var Helpers = {
        
        /*
         * Add an input
         * @param form el the form to add the input to
         */
        addInput: function(form) {
            
            var el, parts = {};
            
            // Create row div
            el = document.createElement('div');
            var d = new Date();
            el.id = d.getTime(); // assign unique identifier
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
                H.undo.push(this.parentNode.id);
                this.parentNode.classList.add('removed');
                console.log('user removed item (id: ' + this.parentNode.id + ')');
            });
            el.appendChild(parts.remove);
            
            // Append div to form
            form.appendChild(el);
            
            /* Initiate autocomplete
            $(parts.input).autocomplete({
                source: H.items,
                autoFocus: true, 
                delay: 0,
                select: function(event, ui){ 
                    parts.input.value = ui.item.value;
                    Helpers.buildUnitList(parts);
                    console.log('user chose item "' + parts.input.value + '"');
                }
            }); */
            
            // Focus input
            parts.input.focus();
            
            // Initate autocomplete
            AC.init(parts.input);
            
            
            
            console.log('user added an input');
            
        },
        
        
        /*
         * Build the units select menu and display hidden parts
         * @param parts obj the entry's DOM parts
         */
         buildUnitList: function(parts) {
            var ul, output = '';
            
            ul = Helpers.getProperUnits(parts.input);
                                    
            for(var i=0; i<ul.length; i++) {
                output += '<option value="' + ul[i].replace(/\s/g, '') + '">' + ul[i] + '</option>';
            }
            parts.units.innerHTML = output;
            
            parts.units.value = H.data[parts.input.value.replace(/\s/g, '')].unit;
                        
            parts.units.classList.remove('hidden');
            parts.amount.classList.remove('hidden');
            parts.remove.classList.remove('hidden');
            
        },
        
        
        /*
         * Return the proper units for the selected item
         * @param input el the item input
         * @return arr an array with the available units
         */
        getProperUnits: function(input) {           
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
            
        },
        
        doConversion: function(S, item) {
                        
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
            
        },
        
        undo: function() {
            
            if (H.undo.length > 0) {
                var id = H.undo.pop();
                document.getElementById(id).classList.remove('removed');
                console.log('user undid removal (id: ' + id + ')');
            }
            
        },
        
        round: function(q,r) {
            return Math.round(q/r)*r;
        }
        
    };
    
    
    // Go get data once the page loads
    window.addEventListener('load', getData(parse), false);
    

    /*
     * Get data from Google Spreadsheet JSON API
     * @param success func the callback function
     */
    function getData(success) {
        var url, req = new XMLHttpRequest();
        
       console.log('trying to retrieve data...');

        req.onreadystatechange = function() {
            if (req.readyState == XMLHttpRequest.DONE && req.status == 200) {
                success(req.responseText);
            } else if (req.status !== 0 && req.status != 200) {
                console.log('unable to retrieve data (Error ' + req.status + ')');
            }
        };
        
        url = "https://spreadsheets.google.com/feeds/list/" + H.gid + "/default/public/values?alt=json";
        
        req.open('GET', url, true);
        req.send();

    }
    
    
    /*
     * Parse JSON data into a more usable form
     * @param data obj the raw data
     */
    function parse(data) {
        var entries, entry, name, parsed = {};
        
        console.log('data retrieved, attempting to parse...');
        
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
        
        console.log('H', H);
        console.log('done parsing, continuing on to init');
        
        init();
        
    }
    
    
    /*
     * Initialize the page
     */
    function init() {
        
        console.log('init...');
        
        var form = document.getElementById('form'),
            controls = document.getElementById('controls');
        
        // Add an initial input box to the page
        Helpers.addInput(form);
        
        // Bind listener to Add Input button
        controls.querySelector('#add').addEventListener('click', function(){
            Helpers.addInput(form);
        }, false);
        
        // Bind listener to Submit button
        controls.querySelector('#submit').addEventListener('click', function(){
            submit(form);
        }, false);
        
        // Bind listener to Undo button
        controls.querySelector('#undo').addEventListener('click', function(){
            Helpers.undo();
        }, false);
        
        console.log('done initializing, waiting for user input');
        
    }
    
    
    /*
     * Handle the submit
     * @param form el the submit form div
     */
    function submit(form) {
        
        console.log('user submitted, attempting to parse input...');
        
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
                S.specs[key].data = Helpers.doConversion(S, key);
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
        
        console.log('done parsing user input, continuing on');
                
        doRounding(S);
        displayGlances(S);
        
    }   
    
    
    /*
     * Round everything appropriately
     * @param S obj the parsed submitted data
     */
    function doRounding(S) {
        
        console.log('doing rounding...');
        
        var r = {}, t = S.totals, x;
        
        // Define rounding groupings
        var fats = ['fat', 'sat', 'mufa', 'pufa'],
            elcts = ['na', 'k'],
            cp = ['carb', 'fiber', 'sugar', 'protein'],
            vm = ['vita', 'vitc', 'vitd', 'vite', 'vitk', 'b1', 'b2', 'b3', 'b6', 'b9', 'b12', 'ca', 'cu', 'fe', 'iod', 'mg', 'mn', 'phos', 'se', 'zn'];            
            
        // Calories
        r.cal = t.cal<5 ? 0 : t.cal<50 ? Helpers.round(t.cal,5) : Helpers.round(t.cal,10);
        
        // Calories from fat
        r.fatcal = t.fat * 9;
        r.fatcal = r.fatcal<5 ? 0 : r.fatcal<50 ? Helpers.round(r.fatcal,5) : Helpers.round(r.fatcal,10);
        
        // Fats
        for (x in fats) {
            r[fats[x]] = t[fats[x]]<0.5 ? 0 : t[fats[x]]<5 ? Helpers.round(t[fats[x]],0.5) : Helpers.round(t[fats[x]],1);  
        }
        
        // Electrolytes
        for (x in elcts) {
            r[elcts[x]] = t[elcts[x]]<5 ? 0 : t[elcts[x]]<=140 ? Helpers.round(t[elcts[x]],5) : Helpers.round(t[elcts[x]],10);
        }
        
        // Carbs and protein
        for (x in cp) {
            r[cp[x]] = t[cp[x]]<0.5 ? 0 : t[cp[x]]<1 ? '<1' : Helpers.round(t[cp[x]],1);
        }
        
        // Vitamins and minerals
        for (x in vm) {
            r[vm[x]] = t[vm[x]]<1 ? 0 : t[vm[x]]<2 ? 2 : t[vm[x]]<10 ? Helpers.round(t[vm[x]],2) : t[vm[x]]<50 ? Helpers.round(t[vm[x]],5) : Helpers.round(t[vm[x]],10);
        }
        
        // Other
        r.solfib = Helpers.round(t.solfib,1);
        r.omega3 = Helpers.round(t.omega3,0.5);
        
        
        S.adj = r;
        
        console.log('S', S);
        console.log('done with rounding');
        
    }
    
    
    /*
     * Display glances
     * @param S obj the parsed submitted data
     */
    function displayGlances(S) {
        
        console.log('displaying glances...');
        
        var glances, ul, x, li, div, p, el;
        
        glances = {
            'Calories' : S.adj.cal,
            'Saturated Fat' : S.adj.sat,
            'Fiber' : S.adj.fiber,
            'Sugar' : S.adj.sugar,
            'Protein' : S.adj.protein
        };
        
        ul = document.createElement('ul');
        
        for (x in glances) {
            
            li = document.createElement('li');
            
            div = document.createElement('div');
            div.className = 'glances-value';
            div.innerHTML = glances[x];
            li.appendChild(div);
            
            p = document.createElement('p');
            p.className = 'glances-caption';
            p.innerHTML = x;
            li.appendChild(p);
            
            ul.appendChild(li);
            
        }
        
        el = document.getElementById('glances');
        el.innerHTML = '';
        el.appendChild(ul);
        
        console.log('done displaying glances');
        
    }
    
    
})(jQuery);