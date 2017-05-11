/*	HARVEST 
	version 2.3

	(c) 2017 Brandon J. C. Fuller. All Rights Reserved.
	
	Minimum requirements:
	
	- jQuery 3.1.1 (jquery.org)
	- jQuery UI 1.12.1 custom build: Autocomplete, Selectmenu, and all required associated components (jqueryui.com)
	- Velocity.js 1.3.1 (velocityjs.org)
	
	--- Change Log since 2.2 ---
	
	
*/


/* ------------------------------------------------------------- */
// PREFERENCES

var dbPath = 'data/database2.csv', // Set path to database relative to HTML
    headerRows = 2; // Specify number of header rows in database; if no headers, set to 0
		
		
/* ------------------------------------------------------------- */
// DEFINE VARIABLES
// Append if database is augmented with new columns.

var	types = ['cal', 'fat', 'sat', 'pufa', 'mufa', 'na', 'pot', 'carbs', 'fiber', 'sugar', 'protein', 'vita', 'vitc', 'ca', 'fe', 'vitd', 'vite', 'vitk', 'b1', 'b2', 'b3', 'b6', 'b9', 'b12', 'cu', 'iod', 'mg', 'mn', 'pho', 'se', 'zn', 'omega3', 'solfib'],
    labelunits = ['', 'g', 'g', 'g', 'g', 'mg', 'mg', 'g', 'g', 'g', 'g', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', '%', 'mg', 'g'],
    labels = ['Calories', 'Total Fat', 'Saturated Fat', 'Polyunsaturated Fat', 'Monounsaturated Fat', 'Sodium', 'Potassium', 'Total Carbohydrates', 'Dietary Fiber', 'Sugar', 'Protein', 'Vitamin A', 'Vitamin C', 'Calcium', 'Iron'],
    detailsHtmlVol = '<input type="text" class="amount" value="1"><select class="units-list"><option value="ml">ml</option><option value="tsp">tsp</option><option value="tbsp">tbsp</option><option value="fl oz">fl oz</option><option value="cup">cup</option><option value="pint">pint</option><option value="quart">quart</option></select>',
    detailsHtmlWt = '<input type="text" class="amount" value="1"><select class="units-list"><option value="g">g</option><option value="oz">oz</option><option value="lb">lb</option></select>';


/* ------------------------------------------------------------- */
// LOAD DATA

// Determine User Data Presence
if (localStorage.getItem('useritemsindex') === null) {
	localStorage.setItem('useritemsindex', '');
}

var useritemsindex = localStorage.getItem('useritemsindex').split(',');

if (useritemsindex.length === 1 && useritemsindex[0] === '') {
	var numuseritems = 0;
} else {
	var numuseritems = useritemsindex.length;
}

// Parse CSV File
var db = [];
$.get(dbPath, function (csv) {
	var cols = types.length + 4,
        dbcsv = csv.split(",").slice(headerRows * cols),
        numEntries = (dbcsv.length - 1) / (cols),
        thisRow = [],
        i = 0;
	for (var a=0; a<numEntries; a++) {
		thisRow = [];
		for (var b=0; b<cols; b++) {
			thisRow.push(dbcsv[i].trim());
			i++;
		} 
		db.push(thisRow);
	}
	pushUserData(db);
});

// Function To Add User Recipes To Database
function pushUserData(db) {
	for (i=0;i<numuseritems;i++) {
		db.push(localStorage.getItem('useritem'+useritemsindex[i]).split(','));
	}
	harvest(db);
}
	

/* ------------------------------------------------------------- */
// INITIALIZE HARVEST

function harvest(db) {

	var 	dbL = db.length,
			labelsL = labels.length,
			dbitems = [],
			vols = ['ml','tsp','tbsp','fl oz', 'cup', 'pint', 'quart'],
			wts = ['g','oz','lb'],
			lastRank = {},
			lastRankTotals = {},
            specWidths = {},
			undo = [],
			u = 0,
            c = 0, 
            lastRankL = 0,
			i,j,n,x;

	var conv =	{
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
		};
		
	// Build ingredient list
	for(i=0; i<dbL; i++) { 
		dbitems.push(db[i][0]);
	}
		
	// Rounding function
	function round(l,m) { return Math.round(l/m)*m; }
	
	
	/* ------------------------------------------------------------- */
	// CONTROLS
	
	// Bind enter key
	$(document).keypress(function(e) { 
		if (e.which == 13) {
			if ($('#save-name').is(':focus') || $('#save-amount').is(':focus') || $('#save-units').is(':focus')) {
				$('#save').click();
			} else if (document.activeElement.className == 'recipe-name') {
				document.activeElement.blur();
			} else {
				$('#submit').click();
			}
		}
	});
	
	// Add New Item
	function add(animate) { 
		var newentry = $('#cloner div.entry').clone();
		newentry.children('input.item').autocomplete({
			source: dbitems,
			autoFocus: true, 
			delay: 0 
		});
		if (animate) {
			newentry.appendTo('#entries').velocity("slideDown", { 
				duration: 	300,
				complete: 	function () {
									$(this).removeClass('clone').children('input.item').focus();
								}
			});
		} else {
			newentry.appendTo('#entries').removeClass('clone').children('input.item').focus();
		}
	}
	add(false); // Add initial item
		
	// Add Item Event Handler
	$('#add').on('click', function () { add(true); });
	
	// Remove Item
	$('#entries').on('click', 'span.remove', function () { 
		$(this).parent().velocity("slideUp", { 
			duration: 	300,
			complete: 	function () { 
								u++;
								$(this).attr('data-undo-level',u);
								undo.unshift(u);
								$('#undo').addClass('active');
							}
		});
	});
	
	// Undo Last Remove
	$('#undo').on('click', function () {
		if(undo.length == 1) { $('#undo').removeClass('active'); }
		$('#entries').find('[data-undo-level="'+undo[0]+'"]').velocity('slideDown', {
			duration: 	300,
			complete: 	function () {
								$(this).removeAttr('data-undo-level');
								undo.shift();
							}
		});
	});
	
	// Display Item Info
	$('#entries').on('click', 'span.info', function () { 
		var dataDiv = $(this).parent().children('div.infodata');
		var dataToggle = (dataDiv.css('display') == 'none' ? 'slideDown' : 'slideUp'); 
		dataDiv.velocity(dataToggle, { duration: 800, easing: [0.075, 0.82, 0.165, 1] });
		$(this).toggleClass('opened');
	});
	
	// Help Control
	$('.popup-control.help').click(function () { 
		$('#help').slideToggle('fast'); 
	});
	
	// Recipe Rebound Control
	$('#recipe-banner').click(function () {
		$('#table').velocity("scroll", { duration: 800, easing: "ease-in-out", offset: -40 });
	});
	
	// Item Selection Control
	$('#entries').on('autocompleteclose', '.item', function () {
		var details = $(this).parent().children('span.details');
		for(i=0;i<dbL;i++){
			if (db[i][0] == $(this).val()) {
				
				// Details
				if ($.inArray(db[i][2],vols) != -1) {
					details.html(detailsHtmlVol);
					details.children('.units-list')
						.val(db[i][2])
						.selectmenu();
				} else if ($.inArray(db[i][2],wts) != -1) {
					details.html(detailsHtmlWt);
					details.children('.units-list')
						.val(db[i][2])
						.selectmenu();
				} else {
					var units = db[i][2];
					details.html('<input type="text" class="amount" value="1"><span class="units">'+units+'</span>');
				} 
				
				// Item Info
				$(this).parent().children('span.info').css('display','inline-block');
				var infoData =  '<ul><li>Amounts per ' + db[i][1] + ' ' + db[i][2] + ':</li>';
				for (j=0;j<labelsL;j++) {
					infoData += '<li>' + labels[j] + ' ' + Number(db[i][j+4].replace('%','')) + labelunits[j] + '</li>';
				}
				$(this).parent().children('div.infodata').html(infoData + '</ul>');
				return;
			}
		}
	}).change();
	
	// Itemized Table Highlighting Control
	$('#full-details-list').on('mouseover', 'li', function () {
		$(this).parent().children('li').eq(0).addClass('highlight');
		$('#extras .header li').eq($(this).index()).addClass('highlight');
	});
	$('#full-details-list').on('mouseout', 'li', function () {
		$('#extras li').removeClass('highlight');
	});
	
	// Diet Picker
	$('#diet-picker li').click(function () {
		var diet = $(this).attr('id');
		$('#diet-picker').attr('class',diet);
		$('#cr-colchart').attr('class',diet);
	});
	
	// Delta View Control
	$('#delta-view-control li').click(function () {
		var deltaView = $(this).attr('id');
		$('#delta-view-control').attr('class',deltaView);
		$('#blocks').attr('class',deltaView);
	});
	
	
	/* ------------------------------------------------------------- */
	// SAVING

	var		saveThis = '',
			useritems = '';
			
	// Save Units Selectmenu
	$('#save-units').selectmenu();
			
	// Display My Recipes Count
	$('#my-recipe-count').html(numuseritems);
	
	// Toggle My Recipes Count Class
	function myRecipeClass() {
		if (numuseritems>0) { 
			$('#my-recipe-count').addClass('full');
		} else {
			$('#my-recipe-count').removeClass('full');
			$('#recipe-drawer').slideUp();
		}
	}
	myRecipeClass();
	
	// My Recipes List View Control
	$('#my-recipes').on('click', '#my-recipe-count.full', function () {
		$('#recipe-drawer').toggle();
	});
	
	// Populate My Recipes View
	var		myRecipesList = '',
			thisUserRecipe = [],
			thisUserRecipeDate = new Date();
	
	for (i=numuseritems;i--;) {
		thisUserRecipe = localStorage.getItem('useritem'+useritemsindex[i]).split(',');
		thisUserRecipeDate = new Date(Number(useritemsindex[i]));
		thisUserRecipeDate = thisUserRecipeDate.getMonth() + 1 + '/' + thisUserRecipeDate.getDay() + '/' + thisUserRecipeDate.getFullYear();
		myRecipesList += '<li class="useritem" data-useritem-id="' + useritemsindex[i] + '"><input class="recipe-name" type="text" value="' + thisUserRecipe[0] + '"><span class="remove-recipe"></span><span class="recipe-date">' + thisUserRecipeDate + '</span></li>';
	}
	$('#my-recipes-list').html(myRecipesList);
	
	// Error Handing
	function saveErrorCheck(errorName,errorAmount) {
		if (errorName === '') { alert("Please enter a name for your recipe."); return true; }
		if (errorName.search(',') !== -1) { alert("Sorry, but your recipe's name can't include commas."); return true; }
		if (errorAmount === '' || isNaN(eval(errorAmount))) { alert("Please enter a valid amount for your recipe."); return true; }
		for (i=0; i<numuseritems; i++) {
			var checkThis = new RegExp("^"+localStorage.getItem('useritem'+useritemsindex[i]).split(',')[0]+"$",'i');
			if (checkThis.test(errorName)) {
				alert("You already have a saved recipe with that name.");
				return true;
			}
		}
	}
	
	// Change Name Control
	var oldRecipeName = '';
	$("#my-recipes-list").on('focus','input.recipe-name', function () {
		oldRecipeName = $(this).val();
	});
	
	$("#my-recipes-list").on('change','input.recipe-name', function () {
		var newRecipeName = $(this).val();
		if (saveErrorCheck(newRecipeName, 1)) { $(this).val(oldRecipeName); return; } // Error handling
		var thisRecipeID = $(this).parent().attr('data-useritem-id');
		var recipeToChange = localStorage.getItem('useritem'+thisRecipeID).split(',');
		recipeToChange[0] = newRecipeName;
		localStorage.setItem('useritem'+thisRecipeID,recipeToChange);
		dbitems[dbitems.indexOf(oldRecipeName)] = newRecipeName;
	});
	
	// Save Recipe
	$('#save').click(function () {
		
		var saveThisName = $('#save-name').val();
		var saveThisAmount = $('#save-amount').val();
		if (saveErrorCheck(saveThisName, saveThisAmount)) { return; } // Error handling
		
		saveThis = saveThisName + ',' + saveThisAmount + ',' + $('#save-units').val() + ',' + 0 + ',' + saveThis;

		thisDateStamp = new Date().getTime();
		thisDateStamp = Number(thisDateStamp);
		if (useritemsindex[0] === '') {
			useritemsindex[0] = thisDateStamp;
		} else {
			useritemsindex.push(thisDateStamp);
		}
		numuseritems = useritemsindex.length;
		
		localStorage.setItem('useritem'+thisDateStamp, saveThis); // set item
		localStorage.setItem('useritemsindex',useritemsindex); // update index
		
		db.push(saveThis.split(',')); // Push to Database
		dbitems.push(saveThisName); // Push to ingredient list
		dbL++; // Increment Database length
		
		thisUserRecipeDate = new Date(thisDateStamp);
		thisUserRecipeDate = thisUserRecipeDate.getMonth() + 1 + '/' + thisUserRecipeDate.getDay() + '/' + thisUserRecipeDate.getFullYear();
		
		$('#save-container').hide();
		$('#save-after').show();
		$('#my-recipe-count').html(numuseritems); // Update My Recipes count
		$('#my-recipes-list').prepend('<li class="useritem" data-useritem-id="' + thisDateStamp + '"><input class="recipe-name" type="text" value="' + saveThisName + '"><span class="remove-recipe"></span><span class="recipe-date">' + thisUserRecipeDate + '</span></li>');
		$('#save-name').val('');
		document.activeElement.blur();
		myRecipeClass();
	});
	
	// Confirm Delete Handler
	function confirmDelete(deleteSyntax) {
		if ($('#confirm-delete').is(':checked')) {
			return confirm("Are you sure you want to permanently delete " + deleteSyntax + "? You won't be able to undo this.");
		} else { 
			return true;
		}
	}
	
	// Remove Recipe
	$('#my-recipes-list').on('click', 'span.remove-recipe', function () { 
		if (confirmDelete('this recipe')) {
			$(this).parent().velocity("slideUp", { 
				duration: 	300,
				complete: 	function () { 
									var deleteThis = $(this).attr('data-useritem-id');
									var deleteThisName = localStorage.getItem('useritem'+deleteThis).split(',')[0];
									
									useritemsindex.splice(useritemsindex.indexOf(deleteThis),1);
									dbitems.splice(dbitems.indexOf(deleteThisName),1);
	
									localStorage.removeItem('useritem'+deleteThis);
									localStorage.setItem('useritemsindex',useritemsindex);
									
									numuseritems = useritemsindex.length;
									$('#my-recipe-count').html(numuseritems);
									$(this).remove();
									myRecipeClass();
								}
			});
		}
	});
	
	// Remove All Recipes
	$('#delete-all').click(function () {
		if (confirmDelete('all recipes')) {
			$('li.useritem').velocity("slideUp", { 
				duration: 	300,
				complete:		function () {
									$(this).remove();
								}
			});
			for (i=0; i<numuseritems; i++) {
				var deleteThisName = localStorage.getItem('useritem'+useritemsindex[i]).split(',')[0];
				dbitems.splice(dbitems.indexOf(deleteThisName),1);
				localStorage.removeItem('useritem'+useritemsindex[i]);
			}
			localStorage.setItem('useritemsindex','');
			useritemsindex = [];
			numuseritems = 0;
			$('#my-recipe-count').html(numuseritems);
			myRecipeClass();
		}
	});


	/* ------------------------------------------------------------- */
	// DO CALCULATION AND DISPLAY

	$('#submit').click(function submit() {
		var t0 = performance.now(); // *** START PERFORMANCE ***
		c++;
		// reset
		var	 	facts = [],
				recipe = [],
				tFact = 0,
				tFactAdj = 0,
				error = false;
		for (x in types) { 
			facts.push(0);
		}
        var contSpecWidth = $('#spectrum').width();
        if ($(window).width()<736) {
            var rankSize = $('#rank-cal').width(),
            specWidths = {
                container : contSpecWidth,
                sat : contSpecWidth,
                mufa : contSpecWidth,
                pufa : contSpecWidth,
                ofat : contSpecWidth,
                na : contSpecWidth,
                k : contSpecWidth,
                fiber : contSpecWidth,
                sugar : contSpecWidth,
                ocarbs : contSpecWidth,
                protein : contSpecWidth
            };
        } else {
            var rankSize = $('#rank-cal').width() * 0.75,
            specWidths = {
                container : contSpecWidth,
                sat : $('#spectrum-sat-label').width(),
                mufa : $('#spectrum-mufa-label').width(),
                pufa : $('#spectrum-pufa-label').width(),
                ofat : $('#spectrum-ofat-label').width(),
                na : $('#spectrum-na-label').width(),
                k : $('#spectrum-k-label').width(),
                fiber : $('#spectrum-fiber-label').width(),
                sugar : $('#spectrum-sugar-label').width(),
                ocarbs : $('#spectrum-ocarbs-label').width(),
                protein : $('#spectrum-protein-label').width()
            };
        }
		var 	factsL = facts.length,
				serv = $('#servings').val(),
				items = $('#entries div.entry').not('[data-undo-level]').find('input.item'),
				specSize = $('#spectrum-wrapper').width(),
                specMax = specSize,
				crSize = $('#cr-colchart').height(),
				rank = { cal:[], fat:[], carbs:[], protein:[] },
				rankMisc = {
					totals : {},
					tWidths : { cal:rankSize, fat:rankSize, carbs:rankSize, protein:rankSize },
					names : { cal:'Calories', fat:'Fat', carbs:'Carbs', protein:'Protein' },
					units : { cal:'', fat:'g', carbs:'g', protein:'g' },
					widths : { cal:[], fat:[], carbs:[], protein:[] },
					html : {}
				};
		items.splice(0,1); // remove cloner
		items.each(function () {
			var 	tVal = $(this).val(),
					d = $(this).parent().children('span.details'),
					uList = d.children('select.units-list'),
					amount = d.children('input.amount').val(),
					builder = [];
			// loop through database
			for(i=0;i<dbL;i++){
				if (db[i][0]==tVal) {
					builder.push(tVal);
					// loop through row columns
					for (j=0;j<factsL;j++) { 
						tFact = Number(db[i][j+4].replace('%',''));
						// do unit conv
						if (uList.length) { 
							tFact *= conv[uList.val().replace(/\s+/g,'')][db[i][2].replace(/\s+/g,'')];
						}
						// error control for blank/NaN values
						if (amount === '' || isNaN(eval(amount))) {
							alert('Please enter a valid amount for all ingredients.');
							error = true; 
							break;
						}
						if (serv === '' || isNaN(eval(serv))) { 
							alert('Please enter a valid servings amount.');
							error = true;
							break;
						}
						// adjust for amounts & servings
						tFactAdj = (tFact / db[i][1] * eval(amount)) / serv;
						facts[j] += tFactAdj;
						tFactAdj = round(tFactAdj,0.5);
						// push fact to recipe builder
						builder.push(tFactAdj);
						if (j+4 == 4) {
							rank.cal.push([tFactAdj, tVal]);
						}
						if (j+4 == 5) {
							rank.fat.push([tFactAdj, tVal]);
						}		
						if (j+4 == 11) {
							rank.carbs.push([tFactAdj, tVal]);
						}
						if (j+4 == 14) {
							rank.protein.push([tFactAdj, tVal]);
						}
					}
					recipe.push(builder); // push ingredient facts to recipe
					break;
				}
			}
		}); 
		if (error) { 
			return;
		}
		var recipeL = recipe.length;
		
	// RANKINGS
		rankMisc.totals.cal = round(facts[0],0.5);
		rankMisc.totals.fat = round(facts[1],0.5);
		rankMisc.totals.carbs = round(facts[7],0.5);
		rankMisc.totals.protein = round(facts[10],0.5);
		
		if (c == 1) {
			lastRank = rank;
			lastRankTotals = rankMisc.totals;
			lastRankL = recipeL;
		}
		
		var 	delta = 0,
                deltaP = 0,
                deltaTAmount = 0;
				
		for (x in rank) {
			rank[x].sort(function(a, b) {
				return a[0]-b[0];
			}).reverse();
			
			// Deltas
			for (i=0;i<lastRankL;i++) {
				for (j=0;j<recipeL;j++) {
					rank[x][j].push('none', 0);
					if (lastRank[x][i][1] == rank[x][j][1]) {
						delta = rank[x][j][0] - lastRank[x][i][0];
						rank[x][j][3] = Math.abs(delta);
						if (delta > 0) {
							rank[x][j][2] = 'positive';
						} else if (delta < 0) {
							rank[x][j][2] = 'negative';
						}
					}
				}
			}
			
			delta = rankMisc.totals[x] - lastRankTotals[x];
			deltaTAmount = Math.abs(delta);
			deltaTAmountP = Math.round(deltaTAmount / lastRankTotals[x] * 100);
			deltaTAmountM = Number(Math.round(rankMisc.totals[x] / lastRankTotals[x] +'e1')+'e-1');
			if (isFinite(deltaTAmountP) !== true) { deltaTAmountP = "&#8734"; }
			if (isFinite(deltaTAmountM) !== true) { deltaTAmountM = "&#8734"; }
			var deltaTClass = (delta > 0) ? 'positive' : (delta < 0) ? 'negative' : 'none';
			
			// Build Ranks
			if (rankMisc.totals[x] === 0) {
				rankMisc.tWidths[x] = 0;
			}
			rankMisc.html[x] = '<li class="rank-entry total"><div class="hbar-background" style="width: '+rankSize+'px"><span class="hbar"></span></div><span class="hbar-label"><label>'+rankMisc.totals[x]+'</label>'+rankMisc.units[x]+'</span><div class="delta '+deltaTClass+'"><span class="delta-v">'+deltaTAmount+rankMisc.units[x]+'</span><span class="delta-p">'+deltaTAmountP+'%</span><span class="delta-m">'+deltaTAmountM+'x</span></div><span class="name">Total '+rankMisc.names[x]+'</span></li>';
			rankMisc.widths[x].push(rankMisc.tWidths[x]);
			for (i=0;i<recipeL;i++) {
				rankMisc.html[x] += '<li class="rank-entry"><div class="hbar-background" style="width: '+rankSize+'px"><span class="hbar"></span></div><span class="hbar-label"><label>'+rank[x][i][0]+'</label>'+rankMisc.units[x]+'</span><span class="delta '+rank[x][i][2]+'">'+rank[x][i][3]+rankMisc.units[x]+'</span><span class="name">'+rank[x][i][1]+'</span></li>';
				rankMisc.widths[x].push(rank[x][i][0]/rankMisc.totals[x]*rankSize);
			}
		}
		
		lastRank = rank;
		lastRankTotals = rankMisc.totals;
		lastRankL = recipeL;
		
	// SPECTRUM
		var 	mass = facts[1] + facts[5]/1000 + facts[6]/1000 + facts[7] + facts[10];
		var 	spec = {};
		function specStore() {
			spec.sat = facts[2]/mass*specMax;
			spec.pufa = facts[3]/mass*specMax;
			spec.mufa = facts[4]/mass*specMax;
			spec.ofat = (facts[1]-facts[2]-facts[3]-facts[4])/mass*specMax;
			spec.na = facts[5]/1000/mass*specMax;
			spec.k = facts[6]/1000/mass*specMax;
			spec.fiber = facts[8]/mass*specMax;
			spec.sugar = facts[9]/mass*specMax;
			spec.ocarbs = (facts[7]-facts[8]-facts[9])/mass*specMax;
			spec.protein = facts[10]/mass*specMax;
		}
        specStore();

		var specOverflow = 0;
		for (x in spec) {
			specOverflow += Math.max(0,spec[x]-specWidths[x]);
		}
		specMax = (specMax-specWidths.container)+(specMax-specOverflow);
		specStore();
		
	// ROUNDING		
		if (facts[0]<5) { // Round calories
			facts[0]=0;
		} else if (facts[0]<50) {
			facts[0]=round(facts[0],5);
		} else {
			facts[0]=round(facts[0],10);
		}		
		var fatcal = facts[1]*9; // Round calories from fat
		if (fatcal<5) {
			fatcal=0;
		} else if (fatcal<50) {
			fatcal=round(fatcal,5);
		} else {
			fatcal=round(fatcal,10);
		}		
		for (i=1;i<5;i++) { // Round fat
			if (facts[i]<0.5) {
				facts[i]=0;
			} else if (facts[i]<5) {
				facts[i]=round(facts[i],0.5);
			} else {
				facts[i]=round(facts[i],1);
			}
		}
		for (i=5;i<7;i++) { // Round Na and K
			if (facts[i]<5) {
				facts[i]=0;
			} else if (facts[i]<=140) {
				facts[i]=round(facts[i],5);
			} else {
				facts[i]=round(facts[i],10);
			}
		}	
		for (i=7;i<11;i++) { // Round carbs and protein
			if (facts[i]<0.5) {
				facts[i]=0;
			} else if (facts[i]<1) {
				facts[i]='<1';
			} else {
				facts[i]=round(facts[i],1);
			}
		}	
		for (i=11;i<31;i++) { // Round vitamins and minerals
			if (facts[i]<1) {
				facts[i]=0;
			} else if (facts[i]<2) {
				facts[i]=2;
			} else if (facts[i]<10) {
				facts[i]=round(facts[i],2);
			} else if (facts[i]<50) {
				facts[i]=round(facts[i],5);
			} else {
				facts[i]=round(facts[i],10);
			}
		}

		// Round omega-3 and sol fiber
		facts[31]=round(facts[31],1);
		facts[32]=round(facts[32],0.5);
		
	// CALORIC RATIO
		
		var		caloricratio = {},
			 	carbs = facts[7],
				protein = facts[10];
		if (carbs == '<1') {
			carbs = 0;
		}
		if (protein == '<1') {
			protein = 0;
		}	
		var calories = facts[1]*9 + carbs*4 + protein*4;
		if (calories === 0) { 
			caloricratio.fat = caloricratio.carbs = caloricratio.protein = 0;
		} else {
			caloricratio.fat = Math.round(facts[1]*9/calories*100);
			caloricratio.carbs = Math.round(carbs*4/calories*100);
			caloricratio.protein = Math.round(protein*4/calories*100);
		}
		
		var t1 = performance.now();console.log(t1-t0); // *** PRINT PERFORMANCE ***
		
		saveThis = facts.toString();
		
	// DISPLAY
	
		// Display recipe banner
		var recipeBanner = '';
		for (i=0; i<recipeL; i++) {
			recipeBanner += '<span>'+recipe[i][0]+'</span>';
		}
		$("#recipe").html(recipeBanner);
		
		// Display glances
		$('#glances').removeClass('animated'); // Reset animation
		$('#gl-cal h1').html('<label>'+facts[0]+'</label>');
		$('#gl-satfat h1').html('<label>'+facts[2]+'</label><sub>g</sub>');
		$('#gl-fiber h1').html('<label>'+facts[8]+'</label><sub>g</sub>');
		$('#gl-sugar h1').html('<label>'+facts[9]+'</label><sub>g</sub>');
		$('#gl-protein h1').html('<label>'+facts[10]+'</label><sub>g</sub>');
	
		// Display panels
		var panelItem;
		for(i=0; i<factsL; i++){
			panelItem = $('#'+types[i]);
			panelItem.text(facts[i]+labelunits[i]);
			if (facts[i]>=20 && i>14 && i<31) { 
				panelItem.parent()
					.removeClass('present')
					.addClass('significant');
			} else if (facts[i]>0 && i>14 && i<31) {
				panelItem.parent()
					.removeClass('significant')
					.addClass('present');
			} else { 
				panelItem.parent()
					.removeClass('present significant');
			}
		}
		$('#fatcal').text(fatcal);
		
		// Display rankings
		for (x in rank) {
			$('#rank-'+x).html(rankMisc.html[x]);
		}
		var rankAnimated = false;
		if (c>1) { $('#delta-view-control').show(); }
		
		// Display itemized list
		var 	itemizedHtml = '';
		for (i=0; i<recipeL; i++) {
			itemizedHtml += '<ul><li>'+recipe[i][0]+'</li>';
			for (j=1; j<16; j++) {
				itemizedHtml += '<li>'+recipe[i][j]+labelunits[j-1]+'</li>';
			}
			itemizedHtml += '</ul>';
		}
		$('#full-details-list').html(itemizedHtml);
		
		// Display plain text
		var 	plaintext = '<p><b>Ingredients:</b> ';
		for (i=0; i<recipeL; i++) {
			plaintext += recipe[i][0];
			if (i<recipeL-1) { plaintext += ', '; }
		}
		plaintext += '</p><p><b>Amount per serving:</b> ';
		for (i=0; i<labelsL; i++) {
			plaintext += labels[i]+' '+facts[i]+labelunits[i];
			if (i<labelsL-1) { plaintext += ', '; }
		}
		$('#plaintext-container').html(plaintext + '</p>');
		
		// Show save option
		$('#save-after').hide();
		$('#save-container').show();
		
		// Reveal Output
		$('#output').addClass('revealed');
		$('#footer').addClass('revealed');
		
		// Scroll
		$('#glances-container').velocity("scroll", { duration: 500, easing: "ease-in-out", offset: -40 });

	// ANNIMATED DISPLAYS - Keep Last:
		
		// Glances
		$('#glances').addClass('animated');
		$('#glances h1 label').each(function () {
			if ($(this).text() != '<1') {
				var thisText = $(this).text();
				$(this).velocity({ tween: 0 }, {
					duration: 1000,
					progress: 	function(el, perc, rem, st) {
										$(this).text(Math.round(thisText*perc));
									},
					complete:		function () { 
										$(this).text(thisText);
									}
				});
			}
		});
		
		// Initialize animation variables
		var 	specAnimated = false,
				crAnimated = false,
				windowH = window.innerHeight,
				windowW = window.innerWidth,
				specOffset = (windowH - $('#spectrum-container').height() / 2) / 1.3,
				crOffset = (windowH - $('#cr').height() / 2) / 2,
				rankOffset = (windowH - ($('#rankings').height()) / 2) / 1.3;
		
		// Animation Control
		$(window).scroll(function () {

			// Recipe Banner
			if ($(document).scrollTop() >= $('#abovefold').height() + 80 && windowW > 735) { 
				$("#recipe-banner").attr('class','visible');
			} else { 
				$("#recipe-banner").attr('class','hidden');
			}
			
			// Spectrum
			if ($(document).scrollTop() > $('#spectrum-container').offset().top - specOffset && specAnimated === false) { 
				for (x in spec) {
					$('#spectrum-'+x).velocity({
						width:spec[x]
					}, {
						duration: 1500,
						easing: [0.075, 0.82, 0.165, 1]
					});
				}
				specAnimated = true;
			}
			
			// Caloric ratio
			if ($(document).scrollTop() > $('#cr').offset().top - crOffset && crAnimated === false) { 			
				for (x in caloricratio) {
					$('#cr-'+x+'.vbar-label').html('<label>'+caloricratio[x]+'</label><sup>%</sup>');
					$('#cr-'+x+'-vbar-mask').velocity({
						height:crSize-(caloricratio[x]/100*crSize)
					}, {
						duration: 800,
						easing: [0.075, 0.82, 0.165, 1]
					});
				}
				$('#cr-colchart-labels .vbar-label label').each(function () {
				   var thisText = $(this).text();
					$(this).velocity({ tween: 0 }, {
						duration: 1000,
						progress: 	function(el, perc, rem, st) {
											$(this).text(Math.round(thisText*perc));
										},
						complete:		function () { 
											$(this).text(thisText);
										}
					});
				});
				crAnimated = true;
			}
			
			// Rankings
			if ($(document).scrollTop() > $('#rankings').offset().top - rankOffset && rankAnimated === false) { 			
				for (x in rank) {
					for (i=0; i<recipeL+1; i++) {
						$('#rank-'+x).find('.hbar').eq(i).velocity({
							width:rankMisc.widths[x][i]
						}, {
							duration: 1000,
							easing: [0.075, 0.82, 0.165, 1]
						});
					}
				}
				rankAnimated = true;
			}
		
		});

	});
}