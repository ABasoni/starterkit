String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find, 'g'), replace);
};

if (!String.prototype.encodeHTML) {
  String.prototype.encodeHTML = function () {
    return this.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
  };
}
if (!String.prototype.decodeHTML) {
  String.prototype.decodeHTML = function () {
    return this.replace(/&apos;/g, "'")
               .replace(/&quot;/g, '"')
               .replace(/&gt;/g, '>')
               .replace(/&lt;/g, '<')
               .replace(/&amp;/g, '&');
  };
}


var userUri = "http://ritmare.it/rdfdata/project#AlessandroOggioniIREA";
var virtuosoUrl = "http://sp7.irea.cnr.it:8890/sparql";
var currentLanguage = "it";
var cloneSuffix = "_XritX";
var edimlUrl = "ediml/";
var ediMl = "";
var debugToDiv = false;
var debugToConsole = false;
var ediUrl = "";
// var ediUrl = "http://sp7.irea.cnr.it/mdedit/proxy.php?url=http://10.0.1.254:8080/MDService/rest/";

var currentlyValidating = false;

function addValidation() {
    $(".dateRange").find("[id$=start]").change( function(event){
	debugToConsole = true;
	if ( currentlyValidating ) {
	    return;
	} else {
	    currentlyValidating = true;
	}
	doDebug("checking start");
	var counterPart = $(this).attr("id").replace("_start", "_end");
	if ( $(this).val() > $("#" + counterPart).val() ) {
	    var temp = $(this).val();
	    var temp2 = $("#" + counterPart).val();
	    $("#" + counterPart).addClass("dateRangeError");
	    // $("#" + counterPart).parent().datepicker("update");

	    $(this).addClass("dateRangeError");
	    // $(this).parent().datepicker("update");
	} else {
	    $("#" + counterPart).removeClass("dateRangeError");
	    // $("#" + counterPart).parent().datepicker("update");

	    $(this).removeClass("dateRangeError");
	    // $(this).parent().datepicker("update");
	}
	currentlyValidating = false;
	debugToConsole = false;
	event.preventDefault();
	return false;
    });
    $(".dateRange").find("[id$=end]").change( function(){
	var counterPart = $(this).attr("id").replace("_end", "_start");
	$("#" + counterPart).trigger("change");
	/*
	debugToConsole = true;
	if ( currentlyValidating ) {
	    return;
	} else {
	    currentlyValidating = true;
	}
	doDebug("checking end");
	var counterPart = $(this).attr("id").replace("_end", "_start");
	if ( $(this).val() < $("#" + counterPart).val() ) {
	    var temp = $(this).val();
	    $(this).val($("#" + counterPart).val());
	    $("#" + counterPart).val(temp);
	}
	currentlyValidating = false;
	debugToConsole = false;
	*/
    });
}

function setLanguage(language) {
    currentLanguage = lookupLanguage(language);
    $("select[languageselector='true']").val(currentLanguage);
}

function doDebug(args) {
    var i;
    for ( i = 0; i < arguments.length; i++ ) {
	if ( debugToDiv ) {
	    $("#debug").append("<p>" + arguments[i] + "</p>");	
	}
        if ( debugToConsole ) {
	    console.log(arguments[i]);
	}
    }
}

function isEmpty(element) {
    var i = 0;
    var items = element.items.item;
    var result = true;
    debugToConsole = true;
    
    doDebug("isEmpty()");
    doDebug(element);
    
    // checks whether all user-defined items in element are empty
    for ( i = 0; i < items.length; i++ ) {
	doDebug(items[i]);
	if ( (items[i].fixed == "false") && items[i].value && items[i].value.trim() != "" ) {
	    result = false;
	    doDebug("false");
	    debugToConsole = false;
	    return result;
	}
    }
    doDebug("true");
    debugToConsole = false;

    return result;
}

function Observation() {
	this.observerCollection = [];
	this.registerObserver = function(observer) {
		this.observerCollection.push(observer);
		// doDebug("registering " + observer);
	}
	this.unregisterObserver = function(observer) {
		// doDebug("unregistering " + observer);
		var index = this.observerCollection.indexOf(observer);
		if ( index > -1 ) {
			this.observerCollection.splice(index, 1);
		} else {
			// doDebug("observer " + observer + " not found");
		}
		doDebug("" + this.observerCollection.length + " observers left");
		if ( this.observerCollection.length == 1 ) {
			// doDebug("il bastardo ?????????????????? " + this.observerCollection[0]);
		}
		if ( this.observerCollection.length == 0 ) {
			this.callback();
		}
	}
	this.callback = function() {};
}

var addElement = function(element) {
	for ( i = 0; i < elements.length; i++ ) {
		if ( elements[i].id == element.id ) {
			return;
		}
	}
	elements.push(element);
};

var loadEDIML = function(edimlId, callback) {
    $.getJSON( edimlUrl + edimlId, { 
				
    }, function( data ) {
	callback(data);
    }); 
};

function prepareDependent(which) {
    var thisOne = which;
    doDebug(thisOne);
    
    var query = thisOne.attr("query");
    var regex = "";
    var principal = thisOne.attr("element_id") + "_" + query.match(/\$(.*)\$/i)[1];
    thisOne.attr("dependsOn", principal);
    
    doDebug("dependent item " + thisOne.attr("id") + "depending on " + principal + ", query: " + query);
    // doDebug("item " + $(this).attr("id") + " -> " + regex.test(query));
    doDebug("item " + "_" + thisOne.attr("id") + " -> " + thisOne.attr("element_id") + "_" + query.match(/\$(.*)\$/i)[1]);
    // $("#" + principal).unbind("change");
    $("#" + principal).live("change", function() {
	doDebug("scatta: " + thisOne.attr("id"));
	var originalQuery = query;
	var queryInstance = replaceAll(query, /\$(.*)\$/i, $("#" + principal + "_uri").val() );
	$.getJSON( virtuosoUrl, { 
			    query: queryInstance, 
			    format: 'application/sparql-results+json', 
			    save:'display', 
			    fname : undefined 
		    }, function( data ) {
			    dati = data.results.bindings;
			    thisOne.val(dati[0] ? dati[0].l.value : "");
		    }); 
	
    });
}

var prepareDependents = function() {
    doDebug("prepareDependents");
    $("*[datatype='dependent']").each(function() {
	prepareDependent($(this));
    });
}

var fillInEdiMl = function(ediMl) {
    var element;
    var item;
    elements = ediMl.elements;
    doDebug(elements);
    for ( i = 0; i < elements.length; i++ ) {
	element = elements[i];
	if ( element.id.indexOf(cloneSuffix) == -1 ) {
	    doDebug(element);
	    for ( j = 0; element.items && j < element.items.length; j++ ) {
		item = element.items[j];
		doDebug(item);
		if ( item.dataType == "code" || item.dataType == "query" ) {
		    $("#" + item.id).val(item.codeValue);
		} else {
		    $("#" + item.id).val(item.value);
		}
	    }
	} else {
	    duplicateElement(element.represents_element, element.id);
	    for ( j = 0; element.items && j < element.items.length; j++ ) {
		item = element.items[j];
		doDebug(item);
		if ( item.dataType == "code" || item.dataType == "query" ) {
		    $("#" + item.id).val(item.codeValue);
		} else {
		    $("#" + item.id).val(item.value);
		}
	    }
	}
    }
    $("select[languageselector='true']").trigger('change');
    // translateLabels();
    // translateHelpTexts();
};

var duplicateElement = function(element, as) {
    if ( !element ) {
	element = as.replaceAll(cloneSuffix, "");
    }
    doDebug("duplicating element " + element + " as " + as);
    var div = $("div[represents_element='" + element + "']:last");
    doDebug(div);
    var element_id = div.attr("id");
    var found = false;
    var i;

    // doDebug("duplicating " + element_id);
    var newDiv = div.clone();
    newDiv.html(newDiv.html().replaceAll("\"" + element_id, "\"" + as));
    newDiv.find('.duplicator').remove();
    newDiv.find('button[removes]').remove();
    // var label = newDiv.find('label[for="' + element_id + cloneSuffix + '"]').first();
    newDiv.find('a[for="' + as + '"]').remove();
    newDiv.attr("id", as);
    // $(this).attr("duplicates", div.attr("represents_element"));

    newDiv.find(".datepicker").datepicker({
				    format: "yyyy-mm-dd",
				    autoclose: true
			    }); /*.on('changeDate', function(ev) {
				    $(this).datepicker('hide');
				    // doDebug("data: " + ev.date.valueOf());
			    }); */
    var button = newDiv.prepend("<button removes='" + as + "' id='" + as + "_remover' type='button' class='btn btn-mini btn-danger'>X</button>").children("button[removes]");
    div.after(newDiv);

    newDiv.find("button[removes]").click(function() {
	    // alert('#' + $(this).attr("removes"));
	    var element_id = $(this).attr("removes");
	    var div = $('#' + $(this).attr("removes"));
	    div.remove();	
	    // find element in array
	    var found = false;
	    for ( i = 0; !found && i < elements.length; i++ ) {
		    if ( elements[i].id == element_id ) {
			    // doDebug("deleting " + elements[i].id);
			    elements.splice(i, 1);
			    found = true;
		    }
	    }
	    // doDebug(elements);
    });
    newDiv.find("[id$=_uri]").val("");
    newDiv.find("[id$=_urn]").val("");
    // $(this).detach().appendTo(newDiv);
    // find element in array
    // doDebug(elements);
    found = false;
    for ( i = 0; !found && i < elements.length; i++ ) {
	    if ( elements[i].id == element_id ) {
		    var existingElement = elements[i];
		    newElement = clone(existingElement);
		    newElement.id = as;
		    // doDebug("pushing " + newElement.id);
		    // doDebug(newElement);
		    addElement(newElement);
		    found = true;
	    }
    }
    // doDebug(elements);
};

var defaultPostErrorCallback = function() {
						var newWindow2 = window.open("data:text/xml," + encodeURIComponent(arguments.responseText),"_blank");
        					doDebug('Failed ' + JSON.stringify(arguments));
    					};

var defaultPostSuccessCallback = function(msg){
        					// $( "#debug" ).html( htmlEncode(msg) );
						// doDebug("Ricevuto: " + xmlToString(msg));
						var xmlString = xmlToString(msg);
						if ( xmlString.indexOf("sml:SensorML") >= 0 ) {
							$.ajax({
                                        			type     : "POST",
                                        			url      : "sos/registerSensor",
                                        			contentType: "application/xml",
                                        			processData: true,
                                        			data     : (xmlString),
                                        			success  : function(msg){
                                                			// $( "#debug" ).html( htmlEncode(msg) );
                                                			// doDebug("Ricevuto: " + xmlToString(msg));
                                                			var xmlString = xmlToString(msg);
                                                			var newWindow = window.open("data:text/xml," + encodeURIComponent(xmlString),"_blank");
									$.ajax({
                                                                		type     : "POST",
                                                                		url      : "http://sp7.irea.cnr.it/sigosos/SOS32/sos",
                                                                		contentType: "application/xml",
                                                                		processData: true,
                                                                		data     : (xmlString),
                                                                		success  : function(msg){
                                                                        		// $( "#debug" ).html( htmlEncode(msg) );
                                                                        		// doDebug("Ricevuto: " + xmlToString(msg));
                                                                        		var xmlString = xmlToString(msg);
                                                                        		var newWindow = window.open("data:text/xml," + encodeURIComponent(xmlString),"_blank");
                                                                        		/*
                                                                        		newWindow.document.open();
                                                                        		newWindow.document.write(xmlToString(msg));
                                                                        		newWindow.document.close();
                                                                        		*/
                                                                		},
                                                                		error    : function() {
                                                                        		var newWindow2 = window.open("data:text/xml," + encodeURIComponent(arguments.responseText),"_blank");
                                                                        		// doDebug('Failed ' + JSON.stringify(arguments));
                                                                		}
                                                        		});
                                                			/*
                                                			newWindow.document.open();
                                                			newWindow.document.write(xmlToString(msg));
                                                			newWindow.document.close();
                                                			*/
                                        			},
                                        			error    : function() {
                                                			var newWindow2 = window.open("data:text/xml," + encodeURIComponent(arguments.responseText),"_blank");
                                                			doDebug('Failed ' + JSON.stringify(arguments));
                                        			}
                                			});
						} else {
							// var newWindow = window.open("data:text/xml," + encodeURIComponent(xmlString),"_blank");
							/*
							xmlString = replaceAll(xmlString, "&", "&amp;");
							xmlString = replaceAll(xmlString, "<", "&lt;");
							xmlString = replaceAll(xmlString, ">", "&gt;");
							*/
							$("#mdcontent").prepend("<pre class='prettyprint lang-html'>" + xmlString.encodeHTML() + "</pre>");
							prettyPrint();
							// prettyPrintOne('<root><node1><root>', 'xml')
						}
						/*
						newWindow.document.open();
						newWindow.document.write(xmlToString(msg));
						newWindow.document.close();
						*/
    					};
var observation = new Observation();
var firstLoad = true;

function clone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
}
/*
var autoCompleteHandler = function() {
    for(var i=0; i<arguments.length; i++) {
	doDebug("Hi, " + arguments[i])
    }

			// doDebug('length: ' + $(this).val().length);
			if ( $(this).val().length < 3 ) {
			    return;
			}
			doDebug("keyup on " + $(this).attr("id"));
			if ( $(this).val().length <= 0 ) { 
				$('#' + id + '_uri').val(''); 
			} 
			doDebug('autocomp1 ' + $(this).val()); 
			query = $(this).attr('query'); 
			query = replaceAll(query, '$search_param', $(this).val()); 
			doDebug('launch query: ' + query); 
			
			$.getJSON( virtuosoUrl, { 
				query: query, 
				format: 'application/sparql-results+json', 
				save:'display', 
				fname : undefined 
			}, function( data ) {
				labels = new Array(); 
				dati = data.results.bindings; 
				// doDebug('autocomp2: ' + JSON.stringify(data)); 
				for ( i = 0; i < dati.length; i++ ) { 
					labels.push({ id: dati[i].c.value, value: (dati[i].a ? dati[i].a.value : dati[i].l.value) }); 
					doDebug({ id: dati[i].c.value, value: (dati[i].a ? dati[i].a.value : dati[i].l.value) }); 
				} 
				$( '#' + id ).autocomplete({ 
					source: labels,
					minLength: 3,
					select: function( event, ui ) {
						doDebug("autocomp: " + ui.item.id + " -> " + ui.item.value);
						$( '#' + id ).val( ui.item.value ); 
						$( '#' + id + '_uri' ).val( ui.item.id ); 
						return false; 
					} 
				}); 
			}); 
		};
*/		
function autoCompletionKeyUp(textbox) {
			var id = $(this).attr("id");
			// doDebug('length: ' + $(this).val().length);
			if ( $(this).val().length < 3 ) {
			    return;
			}
			doDebug("keyup on " + $(this).attr("id"));
			if ( $(this).val().length <= 0 ) { 
				$('#' + id + '_uri').val(''); 
			} 
			doDebug('autocomp1 ' + $(this).val()); 
			query = $(this).attr('query'); 
			query = replaceAll(query, '$search_param', $(this).val()); 
			doDebug('launch query: ' + query); 
			
			$( '#' + id + '_uri' ).val( "" );
			$( '#' + id + '_urn' ).val( "" ); 

			$.getJSON( virtuosoUrl, { 
				query: query, 
				format: 'application/sparql-results+json', 
				save:'display', 
				fname : undefined 
			}, function( data ) {
				labels = new Array(); 
				dati = data.results.bindings; 
				doDebug('autocomp2: ' + JSON.stringify(data)); 
				for ( i = 0; i < dati.length; i++ ) { 
					labels.push({ id: dati[i].c.value, value: (dati[i].a ? dati[i].a.value : dati[i].l.value) }); 
					doDebug({ id: dati[i].c.value, value: (dati[i].a ? dati[i].a.value : dati[i].l.value) }); 
				}
				doDebug(labels);
				$( '#' + id ).autocomplete({ 
					source: labels,
					// minLength: 3,
					select: function( event, ui ) {
						doDebug("autocomp: " + ui.item.id + " -> " + ui.item.value);
						$( '#' + id ).val( ui.item.value );
						$( '#' + id + '_uri' ).val( ui.item.id );
						$( '#' + id + '_urn' ).val( ui.item.urn ); 
						$( '#' + id ).trigger('change');
						return false; 
					} 
				}); 
			}); 
}

function setAutocompletions() {
	var acs = $('input[datatype="autoCompletion"]');
	doDebug("prima");
	doDebug($(this));
	doDebug("dopo");
	acs.each(function() {
		var textbox = $(this);
		doDebug($(this));
		var query = textbox.attr('query'); 
		var labels; 
		var id = $(this).attr("id");
		// doDebug('setto l\'evento'); 
		textbox.keyup(autoCompletionKeyUp);
	});
}

                        // $user_uri
			function lookupLanguage(code) {
				// doDebug("searching for " + code);
				for ( i = 0; i < iso639.length; i++ ) {
					// doDebug(iso639[i][1]);
					if ( iso639[i][1] == code ) {
						return iso639[i][3];
					}
				}
				return "en";
			}
			function translateHelpTexts() {
				var labels = $("a[data-toggle='popover']");
				labels.each(function() {
					var labelFor = $(this).attr("for");
					var arrayName;

					// doDebug("help for " + labelFor);

					if ( labelFor ) {
						arrayName = eval(labelFor + "_help");
						// doDebug("array is " + arrayName);

						if ( $.isArray( arrayName ) && arrayName.length > 1 ) {
							// doDebug("it is an array");
							var translationFound = false;
							for ( i = 0; !translationFound && i < arrayName.length; i++ ) {
								if ( arrayName[i].lang == currentLanguage ) {
									$(this).attr("data-content", arrayName[i].label);
									// doDebug($(this).data('popover').tip().find("popover-content"));
									$(this).data('popover', null).popover({ title: '', content: arrayName[i].label, placement: 'right', trigger: 'manual' });
									// $(this).popover({html:true,placement:'right',title:$(this).attr("data-original-title"),content:arrayName[i].label}).popover('hide');
/*
									alert($(this).data('popover').tip().find('.popover-content').html());
*/
									translationFound = true;
								}
							}
						}
					}
				});
				$('a[data-toggle=popover]').popover();
			}
			function translateLabels() {
				var labels = $("label[for],h2[for],span[for]");
				labels.each(function() {
					var labelFor = $(this).attr("for").replaceAll(cloneSuffix, "");
					var arrayName;

					// doDebug("label for " + labelFor);

					if ( labelFor ) {
						arrayName = eval(labelFor + "_labels");
						// doDebug("array is " + arrayName);

						if ( $.isArray( arrayName ) && arrayName.length > 1 ) {
							// doDebug("it is an array");
							var translationFound = false;
							for ( i = 0; !translationFound && i < arrayName.length; i++ ) {
								if ( arrayName[i].lang == currentLanguage ) {
									$(this).html(arrayName[i].label);
									$("button[duplicates='" + labelFor + "']").html(" + " + arrayName[i].label);
									translationFound = true;
								}
							}
						}
					}
				});
			}
						function htmlEncode(value){
						  //create a in-memory div, set it's inner text(which jQuery automatically encodes)
						  //then grab the encoded contents back out.  The div never exists on the page.
						  return $('<div/>').text(value).html();
						}
					
						function htmlDecode(value){
						  return $('<div/>').html(value).text();
						}
						function xmlToString(xmlData) { 
						
						    var xmlString;
						    //IE
						    if (window.ActiveXObject){
						        xmlString = xmlData.xml;
						    }
						    // code for Mozilla, Firefox, Opera, etc.
						    else{
						        xmlString = (new XMLSerializer()).serializeToString(xmlData);
						    }
						    return xmlString;
						}   
                        function replaceAll(str, find, replace) {
                            var re;
                            var retVal;
                            
                            retVal = str.replace(find, replace);
                            for ( i = 0; i < 100; i++ ) {
                                retVal = retVal.replace(find, replace);
                            }
                            // doDebug("retVal: " + retVal);
                            return retVal;
                        }
                        
                        function createXml() {
                            var xml = '<?xml version="1.0"?><root/>';
                            var doc = jQuery.parseXML(xml);
                            
                            
                            return doc;
                        }
                        
                        function querystring(key) {
			   if ( typeof queryStringValues != 'undefined' ) {
				if ( typeof queryStringValues[key] != 'undefined' ) {
					return queryStringValues[key];
				}
			   }
                           var re = new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
                           var r = [], m;
                           while ( (m=re.exec(document.location.search)) != null )
				r.push(m[1]);
                           return r;
                        }
                        
			function feedSelect(select, theArray) {
				var selectedValue = select.val();
				select.empty();
				for ( i = 0; i < theArray.length; i++ ) {
					var optionRecord = theArray[i];
					select.append("<option " + ( optionRecord.language_neutral == "" ? "" : " language_neutral='" + optionRecord.language_neutral ) + "' value='" + optionRecord.code + "'>" + optionRecord.text + "</option>");
	
				}
				if ( selectedValue ) {
					select.val(selectedValue);
				} else {
					select.val([]);
				}
			}

			function sleep(milliseconds) {
  			var start = new Date().getTime();
  			for (var i = 0; i < 1e7; i++) {
    			if ((new Date().getTime() - start) > milliseconds){
      			break;
    			}
  			}
			}

                        var cbfunc = function(results) {
                            $("#results").val(JSON.stringify(results));
                        };
                        var getSparqlQuery = function(uri) {
                            var sparql;
                            sparql =        "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
                                			"PREFIX dct:<http://purl.org/dc/terms/> " +
                                			"PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
                                			"PREFIX skos:<http://www.w3.org/2004/02/skos/core#> " +
                                			
                                			"SELECT DISTINCT <" + uri + "> AS ?uri ?c ?l ?a ?z " +
                                			"WHERE { " +
                                			"	{ " +
                                			"	  ?c rdf:type skos:Concept. " +
                                			"	  ?c skos:inScheme <" + uri + ">. " +
                                			"	  OPTIONAL { " +
                                			"	      ?c skos:prefLabel ?l. " +
                                			'	      FILTER ( LANG(?l) = "en" ) ' +
                                 			"	  } " +
                                   			"	} " +
                                				
                                			"	OPTIONAL { " +
                                			"	    ?c skos:prefLabel ?z. " + 
                                			'	    FILTER ( LANG(?z) = "zxx" ) ' +
                                			"	} " +
                                			"	OPTIONAL { " +
                                			"	    ?c skos:prefLabel ?a. " + 
                                			'	    FILTER ( LANG(?a) = "' + currentLanguage + '" ) ' +
                                			"	} " +
                                			"	" +
                                			"} " +
                                			"ORDER BY ASC(?a) ASC(?l)";
                                			// doDebug(sparql);
                                			return sparql;
                        };
                        
                        var addSelectOption = function (select, optionRecord) {
                            var alreadyThere = false;
                            $("select[lookup='" + select + "'] > option" ).each(function() {
                                // doDebug("confronto " + $(this).val() + " con " + optionRecord.code + " -> " + ($(this).val() == optionRecord.code));
                                if ( $(this).val() == optionRecord.code ) {
                                    // doDebug("" + select + " contiene gi?? " + optionRecord.text);
                                    // alreadyThere = true;
				    $(this).remove();
                                }
                            });
                            if ( !alreadyThere ) {
                                op = $("select[lookup='" + select + "']").append("<option " + ( optionRecord.language_neutral == "" ? "" : " language_neutral='" + optionRecord.language_neutral ) + "' value='" + optionRecord.code + "'>" + optionRecord.text + "</option>");
                            }
                            // doDebug("aggiungo " + optionRecord.text + " a " + select);
                            // op.prop("selected", false);
                        };
                        var addQuerySelectOption = function (select, optionRecord) {
                            var alreadyThere = false;
                            $("select[hook='" + select + "'] > option" ).each(function() {
                                // doDebug("guardo " + select);
                                if ( $(this).val() == optionRecord.code ) {
                                    // doDebug("" + select + " contiene gi?? " + optionRecord.text);
                                    alreadyThere = true;
                                }
                            });
                            // doDebug("aggiungo " + optionRecord.text + " a " + select);
                            // op.prop("selected", false);
                            if ( !alreadyThere ) {
                                op = $("select[hook='" + select + "']").append("<option value='" + optionRecord.code + "'>" + optionRecord.text + "</option>");
                            }
                        };
                        var lookups = new Array();
                        var queryLookups = new Array();
                        var queryBasedLookups = function() {
                            var selects = $("select[query]");
                            // alert(selects.length);
                            for ( i = 0; i < selects.length; i++ ) {
                                var select = $(selects[i]);
                                var query = select.attr("query");
                                
                                query = query.replace("$user_uri", userUri);
                                
                                     $.getJSON( virtuosoUrl, { query: query, format: "application/sparql-results+json", save:"display", fname : undefined}, function( data ) {
                                        // dati = JSON.parse(data);
                                        id = JSON.stringify(data);
                                        // $("#debug").append(id);
                                        dati = data.results.bindings;
                                        if ( dati.length > 0 ) {
                                            id = dati[0].id.value;
                                            // doDebug("success " + uri);
                                        } else {
                                            return;
                                        }
    
                                        /*
                                        for ( i = 0; i < queryLookups.length; i++ ) {
                                            if ( queryLookups.id == id ) {
                                                return;
                                            }
                                        }
                                        */
                                        theArray = new Array();
                                        for ( i = 0; i < dati.length; i++ ) {
                                            $("#results").append( "<p><b>" + dati[i].code.value + "</b>" + dati[i].label.value + "</p>");
                                            record = { code: dati[i].code.value, text: dati[i].label.value };
                                            theArray.push(record);
                                            // doDebug("adding " + record.text);
                                         }
                                        queryLookups.push( { id: id, data: theArray } );
                                        
                                        var selects = $("select[hook]");
                                            // alert(selects.length);
                                            
                                        for ( j = 0; j < selects.length; j++ ) {
                                            var select = $(selects[j]);
                                            // select.empty();
                                            var uri = select.attr("hook");
                                            // doDebug("candidate: " + uri + " " + queryLookups.length);
                                            for ( k = 0; k < queryLookups.length; k++ ) {
                                                // doDebug("comparing " + uri + " to " + queryLookups[k].id);
                                                if ( queryLookups[k].id == uri ) {
                                                    // $(select).append("<option name='" + record.code + "'>" + record.text + "</option>");
                                                    // doDebug("found " + uri);
                                                    // doDebug(" -> " + lookups[k].data);
                                                    for ( m = 0; m < queryLookups[k].data.length; m++ ) {
                                                        // doDebug(" -> " + queryLookups[k].data[m].code + " - " + queryLookups[k].data[m].text);
                                                        addQuerySelectOption(uri, queryLookups[k].data[m]);
                                                    }
                                                    break;
                                                }
                                            }
                                           // doDebug("mandatory: " + select.attr("mandatory"));
                                           // doDebug("querystring(context): " + querystring("context"));
                                           // doDebug("default value: '" + select.attr("defaultValue") +"'");
                                           if ( select.attr("defaultValue") != "" ) {
                                               select.val(select.attr("defaultValue"));
                                           } else if ( select.attr("mandatory") == "forAll" || select.attr("mandatory") == querystring("context") ) {
                                               // doDebug("set default to first option");
                                               select.eq(0).prop('selected', true);
                                           } else {
                                               select.val([]);
                                           }
                                               
                                        }
                                        
                                        $("#results").append( "<p><b>" + uri + "</b></p>");
                                        $("#results").append( JSON.stringify(dati) );
                                        // alert( "Load was performed." );
                                    });   
                            }
                        }
			var uriCallback = function() {
				allDone = true;
				// doDebug("observation callback " + firstLoad);
				if ( firstLoad ) {
					firstLoad = false;
					uriBasedLookups();
					translateLabels();
					translateHelpTexts();
				}
			    };
                        var uriBasedLookups = function() {
                            var selects = $("select[lookup]");
			    var allDone = false;
			    observation.callback = uriCallback;

                            // alert(selects.length);
                            for ( i = 0; i < selects.length; i++ ) {
                                var select = $(selects[i]);
                                var uri = select.attr("lookup");
                                
                                 sparqlUrl = getSparqlQuery(uri);
				 observation.registerObserver(uri);
                                 $.getJSON( virtuosoUrl, { query: sparqlUrl, format: "application/sparql-results+json", save:"display", fname : undefined}, function( data ) {
                                    // dati = JSON.parse(data);
                                    uri = JSON.stringify(data);
                                    dati = data.results.bindings;
                                    if ( dati.length > 0 ) {
                                        uri = dati[0].uri.value;
                                        // doDebug("success " + uri);
                                    } else {
                                        return;
                                    }
				    observation.unregisterObserver(uri);
                                    /*
                                    for ( i = 0; i < lookups.length; i++ ) {
                                        if ( lookups.uri == uri ) {
                                            return;
                                        }
                                    }
                                    */
                                    theArray = new Array();
                                    for ( i = 0; i < dati.length; i++ ) {
                                        $("#results").append( "<p><b>" + dati[i].c.value + "</b>" + ( !dati[i].a ? ( dati[i].l ? dati[i].l.value : dati[i].z.value ) : dati[i].a.value ) + "</p>");
                                        record = { code: dati[i].c.value, text: ( !dati[i].a ? ( dati[i].l ? dati[i].l.value : dati[i].z.value )  : dati[i].a.value ), language_neutral: ( !dati[i].z ? "" : dati[i].z.value ) };
                                        theArray.push(record);
                                        // doDebug("adding " + record.text);
                                    }
                                    lookups.push( { uri: uri, data: theArray } );
                                    
                                    var selects = $("select[lookup='" + uri + "']");
                                        // alert(selects.length);
                                        
                                    for ( j = 0; j < selects.length; j++ ) {
                                        var select = $(selects[j]);
					var backupValue = select.val();
/*
					var backupValue = select.val();
					// doDebug("select " + select.attr("id") + " -> " + select.val());
                                        // select.empty();
                                        var uri = select.attr("lookup");
                                        // doDebug("candidate: " + uri + " " + lookups.length);
                                        for ( k = 0; k < lookups.length; k++ ) {
                                            // doDebug("comparing " + uri + " to " + lookups[k].uri);
                                            if ( lookups[k].uri == uri ) {
                                                // $(select).append("<option name='" + record.code + "'>" + record.text + "</option>");
                                                // doDebug("found " + uri);
                                                // doDebug(" -> " + lookups[k].data);
                                                for ( m = 0; m < lookups[k].data.length; m++ ) {
                                                    // doDebug(" -> " + lookups[k].data[m]);
                                                    addSelectOption(uri, lookups[k].data[m]);
                                                }
                                                break;
                                            }
                                        }
                                        // doDebug("default value: " + select.attr("defaultValue"));
                                        if ( select.attr("defaultValue") != undefined ) {
                                            select.val(select.attr("defaultValue"));
                                        } else if ( select.attr("mandatory") == "forAll" || select.attr("mandatory") == querystring("context") ) {
                                               doDebug("set default to first option");
                                               select.eq(0).prop('selected', true);
                                        } else {
                                            select.val([]);
                                        }
					if ( backupValue ) {
						select.val(backupValue);
					}
*/
					
					var which = select.attr("lookup");
					var values = null;
					for ( k = 0; k < lookups.length; k++ ) {
						if ( lookups[k].uri == which ) {
							values = lookups[k].data;
						}
					}
					feedSelect(select, values);
					// doDebug("default value: " + select.attr("defaultValue"));
					// doDebug("backup value: " + backupValue);
                                        if ( typeof select.attr("defaultValue") != "undefined" ) {
                                            select.val(select.attr("defaultValue"));
                                        } else if ( select.attr("mandatory") == "forAll" || select.attr("mandatory") == querystring("context") ) {
                                               // doDebug("set default to first option");
                                               // select.eq(0).prop('selected', true);
					       select.val(select.find("option:first").val());
					} else {
                                            select.val([]);
                                        }

					if ( backupValue != null ) {
						select.val(backupValue);
					}
                                    }
                                    
                                    $("#results").append( "<p><b>" + uri + "</b></p>");
                                    $("#results").append( JSON.stringify(dati) );
                                    // alert( "Load was performed." );
                                }).error(function() {
					doDebug("error");
					observation.unregisterObserver(uri);
				}).complete(function() {
					// doDebug("complete");
					observation.unregisterObserver(uri);
				});   
                            }
                        }
			
                        $( document ).ready(function() {
			    if ( debugToDiv ) {
				$(".row").prepend("<div id='debug'></div>");
				$("#debug").css("display", "block");
				$("#debug").css("overflow", "scroll");
				$("#debug").css("border", "1px solid #ffcc00");
				$("#debug").css("height", "150px");
			    }
			    // doDebug(elements);
			    setAutocompletions();
                            uriBasedLookups();
                            queryBasedLookups();
/*			    
				Object.watch("elements", function() {
					doDebug("cambiato elements");
					doDebug(elements);
				});
*/

			    if ( querystring("edit") ) {
				loadEDIML(querystring("edit"), function(data) {
				    ediMl = data;
				    fillInEdiMl(ediMl);
				});	
			    }
			    $("*[represents_element]").each(function() {
				var element = {
				    id: $(this).attr("id"),
				    root: $(this).attr("hasroot"),
				    mandatory: $(this).attr("ismandatory"),
				    represents_element: $(this).attr("represents_element")
				}
				doDebug("element: " + element.id);
				doDebug(element);
				addElement(element);
			    });
			    
			    currentLanguage = lookupLanguage($("select[languageselector='true'] option:selected").attr("language_neutral"));
			    $("select[languageselector='true']").change(function() {
				// var selectedLanguage =  $("#" + $(this).attr("id") + " option:selected").attr("languageNeutral");
				var optionSelected = $(this).find("option:selected");
				var selectedLanguage =  optionSelected.attr("language_neutral");
				// doDebug("html: " + optionSelected.html());
				// doDebug("selected language is " + selectedLanguage);
				currentLanguage = lookupLanguage(selectedLanguage);
				// alert("changing language to " + currentLanguage);
				uriBasedLookups();
				translateLabels();
				translateHelpTexts();
			    });

			    // doDebug("language: " + currentLanguage);
			    // $("select[languageselector='true']").change();

                            $("label[ismandatory]").removeClass("mandatory");
                            $("label[ismandatory='forAll']").addClass("mandatory");
                            $("label[ismandatory='" + querystring("context") + "']").addClass("mandatory");
                            $(".datepicker").datepicker({
    								format: "yyyy-mm-dd"
							}).on('changeDate', function(ev) {
								
								// doDebug("data: " + ev.date.valueOf());
							});
			    // Fix strange bug
			    $("*[prova]").each(function() {
				$(this).val($(this).attr("prova"));
				if ( $(this).attr("defaultValue") ) {
					$(this).val($(this).attr("defaultValue"));
				}
			    });
			    // End of strange fix
			    var pars = decodeURIComponent(querystring("parameters"));
			    var par;
			    if ( pars && pars != "undefined" && pars != "" ) {
				pars = JSON.parse(pars);
			    	// doDebug(pars);
			    	// doDebug(pars.uid);
			    	$("*[querystringparameter!='']").each(function() {
					doDebug("evaluating " + ("pars." + $(this).attr("querystringparameter")));
					par = eval("pars." + $(this).attr("querystringparameter"));
					doDebug("input id='" + $(this).attr("id")  + " -> parametro '" + $(this).attr("querystringparameter") + "' = '" + par + "'");
					if ( par && par != "undefined" && par != "" ) {
						$(this).val(par);
					}
			    	});
			    }
			    $('input[validateas="real"]').attr("step", "any");
			    $('input[validateas="int"]').attr("step", "1");
			    // $('.btn-info').popover();
			    $('a[data-toggle=popover]').popover();

			    $('.duplicator').click(function() {
				var div = $("div[represents_element='" + $(this).attr("duplicates") + "']:last");
				var element_id = div.attr("id");
				var found = false;

				// doDebug("duplicating " + element_id);
				var newDiv = div.clone();
				newDiv.html(newDiv.html().replaceAll("\"" + element_id, "\"" + element_id + cloneSuffix));
				newDiv.find('.duplicator').remove();
				newDiv.find('button[removes]').remove();
				// var label = newDiv.find('label[for="' + element_id + cloneSuffix + '"]').first();
				newDiv.find('a[for="' + element_id + cloneSuffix + '"]').remove();
				newDiv.attr("id", element_id + cloneSuffix);
				$(this).attr("duplicates", div.attr("represents_element"));

				newDiv.find(".datepicker").datepicker({
    								format: "yyyy-mm-dd"
							}).on('changeDate', function(ev) {
								
								// doDebug("data: " + ev.date.valueOf());
							});
				
				newDiv.find("*[datatype='autoCompletion']").unbind();
				newDiv.find("*[datatype='autoCompletion']").keyup(autoCompletionKeyUp);
				newDiv.find("*[datatype='dependent']").each(function() {
				    doDebug("setting " + $(this) + " as dependent item");
				    prepareDependent($(this));
				});
				
				var button = newDiv.prepend("<button removes='" + element_id + cloneSuffix + "' id='" + element_id + cloneSuffix + "_remover' type='button' class='btn btn-mini btn-danger btn-remover'>X</button>").children("button[removes]");
// doDebug(button);
				div.after(newDiv);

				newDiv.find("button[removes]").click(function() {
					// alert('#' + $(this).attr("removes"));
					var element_id = $(this).attr("removes");
					var div = $('#' + $(this).attr("removes"));
					div.remove();	
					// find element in array
					var found = false;
					for ( i = 0; !found && i < elements.length; i++ ) {
						if ( elements[i].id == element_id ) {
							// doDebug("deleting " + elements[i].id);
							elements.splice(i, 1);
							found = true;
						}
					}
					// doDebug(elements);
				});
				
				// $(this).detach().appendTo(newDiv);
				// find element in array
				// doDebug(elements);
				found = false;
				for ( i = 0; !found && i < elements.length; i++ ) {
					if ( elements[i].id == element_id ) {
						var existingElement = elements[i];
						newElement = clone(existingElement);
						newElement.id = element_id + cloneSuffix;
						// doDebug("pushing " + newElement.id);
						// doDebug(newElement);
						addElement(newElement);
						found = true;
					}
				}
				// doDebug(elements);
			    });
			    
			    // Alternative values
			    $(".alternative").each(function() {
				// doDebug("alternative div:");
				$(this).find("*[fixed='false']").each(function() {
				    // doDebug("member: " + $(this).attr("id"));
				});
				$(this).find("*[path]").change(function() {
				    var selectedId=$(this).attr("id");
				    
				    $(this).parents(".alternative").find("*[fixed='false']").each(function() {
					if ( $(this).attr("id") != selectedId ) {
					    // doDebug("alternative member: " + $(this).attr("id"));
					    $(this).val([]);
					}
				    }); 
				});
			    });
			    
			    prepareDependents();
			    
			    addValidation();
			    
			    $("#mdcontent").prepend("<button id='en'>en</button><button id='it'>it</button>");
			    $("#en").click(function() {
				setLanguage('en');
			    });
				
			    $("#it").click(function() {
				setLanguage('it');
			    });
				
			    
                            $("#postButton").click(function() {
                            	var document = jQuery.parseXML("<ritmare></ritmare>");
				var version = querystring("version");
				if ( !version ) {
					version = "1.00";
				}
			// INIZIO
			    elements = [];
			    $("*[represents_element]").each(function() {
				var element = {
				    id: $(this).attr("id"),
				    root: $(this).attr("hasroot"),
				    mandatory: $(this).attr("ismandatory"),
				    represents_element: $(this).attr("represents_element")
				}
				doDebug("element: " + element.id);
				doDebug(element);
				addElement(element);
			    });
			    // content.elements.element = elements;
			// FINE
			    
                                var content = {
					elements: {
						version: version,
						template: querystring("template"),
						fileId: ediMl.id,
						fileUri: null,
						user: userUri,
						element: []
					}
				};
	
				var c = content.elements.element;
				var theElement;
                            	for ( i = 0; i < elements.length; i++ ) {
                            		var elementId = elements[i].id;
					elements[i].items = { 
								item: []
					};
					theElement = {};
                            		theElement.element = elements[i];
                            		
                            		$("*[element_id='" + elementId + "']").each(function() {
						var type = $(this).attr("datatype");
						if ( type == "code" || type == "query" ) {
							// doDebug($(this) + " is a select");
							// doDebug($(this).attr("id") + " option:selected");
							value = $("#" + $(this).attr("id") + " option:selected").text();
							codeValue = $(this).val();
							languageNeutralValue = $("#" + $(this).attr("id") + " option:selected").attr("language_neutral");
						} else if ( type == "autoCompletion" ) {
							value = $(this).val();
							codeValue = $("#" + $(this).attr("id") + "_uri").val();
							languageNeutralValue = codeValue;
							if ( $(this).attr("useCode") == "true" ) {
								value = codeValue;
							}
						} else if ( type == "boolean" ) {
							value = $(this).is(":checked");
							codeValue = value;
							languageNeutralValue = codeValue;
						} else {
							value = $(this).val();
							codeValue = "";
							languageNeutralValue = codeValue;
						}
						if ( type != "ref" && $(this).attr("isLanguageNeutral") != "undefined" && $(this).attr("isLanguageNeutral") != "" && $(this).attr("language_neutral") != "undefined" && $(this).attr("language_neutral") != "" ) {
							value = languageNeutralValue;
						}
						var item = {
                            						id: $(this).attr("id"),
                            						element_id: $(this).attr("element_id"),
                            						path: $(this).attr("path"),
									datatype: $(this).attr("datatype"),
									fixed: $(this).attr("fixed"),
                            						value: value,
									codeValue: codeValue,
									languageNeutral: languageNeutralValue,
									isLanguageNeutral :  ( $(this).attr("isLanguageNeutral") != "undefined" ?  $(this).attr("isLanguageNeutral") : "" )
                            			};
                            			theElement.element.items.item.push(item);
                            		});
					// if ( !isEmpty(theElement.element) ) {
					    c.push(theElement.element);
					// }
					
					// doDebug(content);
                            	}
                            	// $("#debug").append("elements: " + JSON.stringify(elements));

	    
				var postMetadata = function(data) {
				    doDebug(data);
				    doDebug("qui");
				    doDebug(content);
				    content.elements.fileId = data.id;
				    content.elements.fileUri = data.uri;
				    doDebug(content);
				    xml = '<?xml version="1.0" encoding="UTF-8"?>' + xml;
				    if ( typeof successCallback == 'undefined' ) {
					    successCallback = defaultPostSuccessCallback;
				    }
				    if ( typeof errorCallback == 'undefined' ) {
					    errorCallback = defaultPostErrorCallback;
				    }
				    
				    var x2js = new X2JS();
				    var xml = /* '<?xml version="1.0" encoding="UTF-8"?>' + */ (x2js.json2xml_str(content));
				    if ( querystring("debug") == "on" ) {
					//    var newWindow1 = window.open("data:text/xml," + encodeURIComponent(xml),"_blank");
					    $("#mdcontent").prepend("<pre class='prettyprint lang-json'>" + JSON.stringify(content) + "</pre>");
					    prettyPrint();
				    }
								    
				    
				    $.ajax({
					    type     : "POST",
					    url      : ediUrl + "postMetadata",
					    contentType: "application/xml",
					    processData: true,
					    data	 : (xml),
					    success  : successCallback,
					    error    : errorCallback
				    });
				}
				if ( ediMl.fileId /*querystring("edit")*/ ) {
				    postMetadata({ id: ediMl.fileId, uri: ediMl.fileUri });
				} else {
				    $.ajax({
					    type     : "GET",
					    url      : edimlUrl + "requestId",
					    contentType: "application/json",
					    processData: true,
					    success  : postMetadata,
					    error    : function() {
						alert("errore");
					    }
				    });
				}
//                            	doDebug(xmlToString(document));
				return false;
                            });
                        });
