// jshint esversion: 6
( function() {
    
    /*
     * Autocomplete
     */
    class AC {
        
        static init( parent, parts ) {
            
            var e = {
                parts: parts,
                el: parts.input,
                parent: parent,
                ul: document.createElement( 'ul' )
            };
            
            e.ul.className = 'autocomplete';
            e.parent.insertBefore( e.ul, e.el );
            
            e.el.addEventListener( 'input', function() {
                AC.call( e );
            });
            
        }
        
        static call( e ) {
            
            var val, list, re, i, li;
            
            val = e.el.value;
            list = [];
            re = new RegExp( val, 'i' );
                        
            for ( i in H.items ) {
                if ( re.test( H.items[i] ) ) {
                    list.push( H.items[i] );
                }
            }
                        
            e.ul.innerHTML = '';
            
            for ( i in list ) {
                
                li = document.createElement( 'li' );
                li.innerHTML = list[i];
                li.addEventListener( 'mouseover', AC.eventHandlerMouseover.bind( null, li, e ) );
                li.addEventListener( 'click', AC.eventHandlerClick.bind( null, li, e ) );
                
                e.ul.appendChild( li );
                
            }
            
            if ( list.length ) {
                e.ul.firstChild.className = 'active';
                e.ul.classList.add( 'active' );
            }
            
        }
        
        static eventHandlerMouseover( li, e ) {
            AC.hover( li, e );
        }
        
        static eventHandlerClick( li, e ) {
            AC.click( li, e );
        }
        
        static hover( li, e ) {            
            var lis, i;
            
            lis = e.ul.querySelectorAll( 'li' );
            for ( i = 0; i < lis.length; i++ ) {
                lis[i].className = '';
            }
            
            li.className = 'active';
            
        }
        
        static click( li, e ) {
            e.el.value = li.innerHTML;
            e.ul.classList.remove( 'active' );
            e.ul.innerHTML = '';
            
            Helpers.displayItemOptions( e.parts );
        }
        
    }
    
    
    /*
     * Helper functions
     */
    class Helpers {
        
        /*
         * Add an input
         * @param form el the form to add the input to
         */
        static addInput( form ) {
            
            var el, d, parts = {};
            
            // Create row div
            el = document.createElement( 'div' );
            d = new Date();
            el.id = d.getTime(); // assign unique identifier
            el.className = 'entry';
            
            // Create input
            parts.input = document.createElement( 'input' );
            parts.input.type = 'text';
            parts.input.className = 'item';
            parts.input.placeholder = 'Enter ingredient';
            el.appendChild( parts.input );
            
            // Create amount
            parts.amount = document.createElement( 'input' );
            parts.amount.type = 'text';
            parts.amount.className = 'amount hidden';
            parts.amount.value = '1';
            el.appendChild( parts.amount );
            
            parts.units = document.createElement( 'select' );
            parts.units.className = 'units hidden';
            el.appendChild( parts.units );
                        
            // Create remove control
            parts.remove = document.createElement( 'button' );
            parts.remove.type = 'button';
            parts.remove.innerHTML = 'Remove';
            parts.remove.className = 'hidden';
            parts.remove.addEventListener( 'click', function() {
                H.undo.push( this.parentNode.id );
                this.parentNode.classList.add( 'removed' );
                console.log( 'user removed item (id: ' + this.parentNode.id + ')' );
            });
            el.appendChild( parts.remove );
            
            // Append div to form
            form.appendChild( el );
            
            // Focus input
            parts.input.focus();
            
            // Initate autocomplete
            AC.init( el, parts );
            
            
            
            console.log( 'user added an input' );
            
        }
        
        
        /*
         * Build the units select menu and display hidden parts
         * @param parts obj the entry's DOM parts
         */
         static displayItemOptions( parts ) {
            var ul, i, output = '';
            
            ul = Helpers.getProperUnits( parts.input );
                                    
            for( i = 0; i < ul.length; i++ ) {
                output += '<option value="' + ul[i].replace( /\s/g, '' ) + '">' + ul[i] + '</option>';
            }
            parts.units.innerHTML = output;
            
            parts.units.value = H.data[parts.input.value.replace( /\s/g, '' )].unit;
                        
            parts.units.classList.remove( 'hidden' );
            parts.amount.classList.remove( 'hidden' );
            parts.remove.classList.remove( 'hidden' );
            
        }
        
        
        /*
         * Return the proper units for the selected item
         * @param input el the item input
         * @return arr an array with the available units
         */
        static getProperUnits( input ) {           
            var item, unit;
            
            item = input.value.replace( /\s/g, '' );
            unit = H.data[item].unit;
                                    
            if ( H.units.w.indexOf( unit ) > -1 ) {
                return H.units.w;
            } else if ( H.units.v.indexOf( unit ) > -1 ) {
                return H.units.v;
            } else {
                unit = [unit];
                return unit;
            }
            
        }
        
        static doConversion( S, item ) {
                        
            var data = {}, m, x, y, i;
            
            x = S.specs[item].unit;
            y = H.data[item].unit;
                        
            for ( i = 0; i < H.metrics.length; i++ ) {
                m = H.metrics[i];
                data[m] = H.data[item][m].replace( '%', '' );
                
                // Convert original data to new units, but only if there's something to convert to
                if ( H.units.w.indexOf( x ) > -1 || H.units.v.indexOf( x ) > -1 ) {
                    data[m] *= H.units.conv[x][y];
                }
                
                // Adjust for entered amount and servings
                data[m] = data[m] / H.data[item].serving * S.specs[item].amount / S.servings;
            }
            
            return data;
            
        }
        
        static undo() {
			var id;
            
            if ( H.undo.length > 0 ) {
                id = H.undo.pop();
                document.getElementById( id ).classList.remove( 'removed' );
                console.log( 'user undid removal (id: ' + id + ')' );
            }
        }
        
        static round( q, r ) {
            return Math.round( q / r ) * r;
        }
        
    }
    
    
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
	
	
    // Go get data once the page loads
    window.addEventListener( 'load', getData( parse ), false );
    

    /*
     * Get data from Google Spreadsheet JSON API
     * @param success func the callback function
     */
    function getData( success ) {
        var url, req = new XMLHttpRequest();
        
       console.log( 'trying to retrieve data...' );

        req.onreadystatechange = function() {
            if ( req.readyState == XMLHttpRequest.DONE && req.status == 200 ) {
                success( req.responseText );
            } else if ( req.status !== 0 && req.status != 200 ) {
                console.log( 'unable to retrieve data (Error ' + req.status + ')' );
            }
        };
        
        url = "https://spreadsheets.google.com/feeds/list/" + H.gid + "/default/public/values?alt=json";
        
        req.open( 'GET', url, true );
        req.send();

    }
    
    
    /*
     * Parse JSON data into a more usable form
     * @param data obj the raw data
     */
    function parse( data ) {
        var entries, entry, i, key, name, parsed, x;
        
        console.log( 'data retrieved, attempting to parse...' );
        
        data = JSON.parse( data );
        entries = data.feed.entry;
		parsed = {};
                        
        for( i = 0; i < entries.length; i++ ) {
                     
            entry = {};
            
            for ( key in entries[i] ) {
                if ( key.includes( 'gsx$' ) && key != 'gsx$name' ) {
                    entry[key.replace( 'gsx$', '' )] = entries[i][key].$t; 
                }
            }
                        
            name = entries[i].gsx$name.$t;
            H.items.push( name );
            parsed[name.replace( /\s/g, '' )] = entry;
            
        }  
                
        for ( x in entry ) {
            if ( H.exclude.indexOf( x ) == -1 ) {
                H.metrics.push( x );
            }
        }
                
        H.data = parsed;
        
        console.log( 'H', H );
        console.log( 'done parsing, continuing on to init' );
        
        init();
        
    }
    
    
    /*
     * Initialize the page
     */
    function init() {
        
		var form, controls;
		
        console.log( 'init...' );
        
        form = document.getElementById('form');
        controls = document.getElementById('controls');
        
        // Add an initial input box to the page
        Helpers.addInput( form );
        
        // Bind listener to Add Input button
        controls.querySelector( '#add' ).addEventListener( 'click', function(){
            Helpers.addInput( form );
        }, false );
        
        // Bind listener to Submit button
        controls.querySelector( '#submit' ).addEventListener( 'click', function(){
            submit( form );
        }, false );
        
        // Bind listener to Undo button
        controls.querySelector( '#undo' ).addEventListener( 'click', function(){
            Helpers.undo();
        }, false );
        
        console.log( 'done initializing, waiting for user input' );
        
    }
    
    
    /*
     * Handle the submit
     * @param form el the submit form div
     */
    function submit( form ) {
        
		var S, entries, name, amount, unit, key, totals, i, x;
        
		console.log( 'user submitted, attempting to parse input...' );
        
        S = {
			specs: {},
			servings: document.getElementById( 'servings' ).value,
			totals: {}
		};
        
        // Gather all entries and populate S with the information
        entries = form.querySelectorAll( 'div.entry:not(.removed)' );

        for ( i = 0; i < entries.length; i++ ) {
            
            name = entries[i].querySelector( 'input.item' ).value;
            
            if ( name ) {
                
                amount = entries[i].querySelector( 'input.amount' ).value;
                unit = entries[i].querySelector( 'select.units' ).value;
                                
                key = name.replace( /\s/g, '' );
                
                S.specs[key] = {
                    name: name,
                    amount: amount,
                    unit: unit
                };
                   
                // Send data out for unit/amount conversion
                S.specs[key].data = Helpers.doConversion( S, key );
            }
        }
		
		totals = [];
                    
        // Add metrics together across items
        for ( x in S.specs ) {
            totals.push( S.specs[x].data );
        }
                
        for ( i = 0; i < totals.length; i++ ) {
            for ( x in totals[i] ) {
                S.totals[x] = ( S.totals[x] || 0 ) + totals[i][x];
            }
        }
        
        console.log( 'done parsing user input, continuing on' );
                
        doRounding(S);
        displayGlances(S);
        
    }   
    
    
    /*
     * Round everything appropriately
     * @param S obj the parsed submitted data
     */
    function doRounding( S ) {
        
		var fats, elcts, cp, vm, r, t, x;

        console.log('doing rounding...');

        // Define rounding groupings
       	fats = ['fat', 'sat', 'mufa', 'pufa'];
        elcts = ['na', 'k'];
        cp = ['carb', 'fiber', 'sugar', 'protein'];
        vm = ['vita', 'vitc', 'vitd', 'vite', 'vitk', 'b1', 'b2', 'b3', 'b6', 'b9', 'b12', 'ca', 'cu', 'fe', 'iod', 'mg', 'mn', 'phos', 'se', 'zn'];            
           
		r = {};
		t = S.totals;
		
        // Calories
        r.cal = t.cal < 5 ? 0 : t.cal < 50 ? Helpers.round( t.cal, 5 ) : Helpers.round( t.cal, 10 );
        
        // Calories from fat
        r.fatcal = t.fat * 9;
        r.fatcal = r.fatcal < 5 ? 0 : r.fatcal < 50 ? Helpers.round( r.fatcal, 5 ) : Helpers.round( r.fatcal, 10 );
        
        // Fats
        for ( x in fats ) {
            r[fats[x]] = t[fats[x]] < 0.5 ? 0 : t[fats[x]] < 5 ? Helpers.round( t[fats[x]], 0.5 ) : Helpers.round( t[fats[x]], 1 );  
        }
        
        // Electrolytes
        for ( x in elcts ) {
            r[elcts[x]] = t[elcts[x]] < 5 ? 0 : t[elcts[x]] <= 140 ? Helpers.round( t[elcts[x]], 5 ) : Helpers.round( t[elcts[x]], 10 );
        }
        
        // Carbs and protein
        for ( x in cp ) {
            r[cp[x]] = t[cp[x]] < 0.5 ? 0 : t[cp[x]] < 1 ? '<1' : Helpers.round( t[cp[x]], 1 );
        }
        
        // Vitamins and minerals
        for ( x in vm ) {
            r[vm[x]] = t[vm[x]] < 1 ? 0 : t[vm[x]] < 2 ? 2 : t[vm[x]] < 10 ? Helpers.round( t[vm[x]], 2 ) : t[vm[x]] < 50 ? Helpers.round( t[vm[x]], 5 ) : Helpers.round( t[vm[x]], 10 );
        }
        
        // Other
        r.solfib = Helpers.round( t.solfib, 1 );
        r.omega3 = Helpers.round( t.omega3, 0.5 );
        
        
        S.adj = r;
        
        console.log( 'S', S );
        console.log( 'done with rounding' );
        
    }
    
    
    /*
     * Display glances
     * @param S obj the parsed submitted data
     */
    function displayGlances( S ) {

        var glances, ul, x, li, spanValue, spanCaption, el;

        console.log( 'displaying glances...' );

        glances = {
            'Calories': S.adj.cal,
            'Saturated Fat': S.adj.sat,
            'Fiber': S.adj.fiber,
            'Sugar': S.adj.sugar,
            'Protein': S.adj.protein
        };
        
        ul = document.createElement( 'ul' );
        
        for ( x in glances ) {
            
            li = document.createElement( 'li' );
            
            spanValue = document.createElement( 'span' );
            spanValue.className = 'glances-value';
            spanValue.innerHTML = glances[x];
            li.appendChild( spanValue );
            
            spanCaption = document.createElement( 'span' );
            spanCaption.className = 'glances-caption';
            spanCaption.innerHTML = x;
            li.appendChild( spanCaption );
            
            ul.appendChild( li );
            
        }
        
        el = document.getElementById( 'glances' );
        el.innerHTML = '';
        el.appendChild( ul );
        
        console.log( 'done displaying glances' );
        
    }
    
    
})();