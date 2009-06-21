/* global Ext El ElFrame ELD*/    
/*
 * ******************************************************************************
 * This file is distributed on an AS IS BASIS WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * ***********************************************************************************
 * License: multidom.js is offered under an MIT License.
 * Donations are welcomed: http://donate.theactivegroup.com
 */

 /**
  * @class multidom
  * @version 1.0
  * @license MIT 
  * @author Doug Hendricks. Forum ID: <a href="http://extjs.com/forum/member.php?u=8730">hendricd</a> 
  * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
  * @copyright 2007-2009, Active Group, Inc. All rights reserved.
  * @description [Designed For Ext Core and ExtJs Frameworks (using ext-base adapter only) 3.0 or higher ONLY]
  * The multidom library extends (overloads) Ext Core DOM methods and functions to 
  * provide document-targeted access to the documents loaded in external (FRAME/IFRAME) 
  * documents. 
  * <p>It maintains seperate DOM Element caches (and more) for each document instance encountered by the 
  * framework, permitting safe access to DOM Elements across document instances that may share 
  * the same Element id or name.  In essence, multidom extends the functionality provided by Ext Core
  * into any child document without having to load the Core library into the frame's global context.
  * <h3>Custom Element classes.</h3>
  * The Ext.get method is enhanced to support resolution of the custom Ext.Element implementations.
  * (The ux.ManagedIFrame 2.0 Element class is an example of such a class.) 
  * <p>For example: If you were retrieving the Ext.Element instance for an IFRAME and the class
  * Ext.Element.IFRAME were defined:
  * <pre><code>Ext.get('myFrame')</pre></code>
  * would return an instance of Ext.Element.IFRAME for 'myFrame' if it were found. 
  * @example
   // return the Ext.Element with an id 'someDiv' located in external document hosted by 'iframe'
   var iframe = Ext.get('myFrame');
   var div = Ext.get('someDiv', iframe.getFrameDocument()); //Firefox example
   if(div){
     div.center();
    }
   Note: ux.ManagedIFrame provides an equivalent 'get' method of it's own to access embedded DOM Elements
   for the document it manages.
   <pre><code>iframe.get('someDiv').center();</pre></code>
   
   Likewise, you can retrieve the raw Element of another document with:
   var el = Ext.getDom('myDiv', iframe.getFrameDocument());
 */
 
 (function(){   
    
    
    /*
     * Ext.Element and Ext.lib.DOM enhancements.
     * Primarily provides the ability to interact with any document context
     * (not just the one Ext was loaded into).
     */
   var El = Ext.Element, ElFrame, ELD = Ext.lib.Dom, A = Ext.lib.Anim;
      
   /**
    * @private
    */
   var _documents= {
        $_top : {_elCache : El.cache,
                 _dataCache : El.dataCache 
                 }
    };
    /**
    * @private
    */                          
    var resolveCache = ELD.resolveCache = function(doc, cacheId){
        doc = ELD.getDocument(doc);

        //Use Ext.Element.cache for top-level document
        var c = (doc == document? '$_top' : cacheId);
        
        var cache = _documents[c] || null, d, win;
         //see if the document instance is managed by FRAME
        if(!cache && doc && (win = doc.parentWindow || doc.defaultView)){  //Is it a frame document
              if(d = win.frameElement){
                    c = d.id || d.name;  //the id of the frame is the cacheKey
                }
         }
         return cache || 
            _documents[c] || 
            (c ? _documents[c] = {_elCache : {} ,_dataCache : {} }: null);
     };
     
     var clearCache = ELD.clearCache = function(cacheId){
       delete  _documents[cacheId];
     };
     
   El.addMethods || ( El.addMethods = function(ov){ Ext.apply(El.prototype, ov||{}); }); 
     
   Ext.removeNode =  function(n){
         var dom = n ? n.dom || n : null;
         if(dom && dom.parentNode && dom.tagName != 'BODY'){
            var el, docCache = resolveCache(dom);
            if(el = docCache._elCache[dom.id]){
                
                //clear out any references from the El.cache(s)
                el.dom && el.removeAllListeners();
                delete docCache._elCache[dom.id];
                delete docCache._dataCache[dom.id];
                el.dom && (el.dom = null);
                el = null;
            }
            
            if(Ext.isIE && !Ext.isIE8){
                var d = ELD.getDocument(dom).createElement('div');
                d.appendChild(dom);
                //d.innerHTML = '';  //either works equally well
                d.removeChild(dom);
                d = null;  //just dump the scratch DIV reference here.
            } else {
                var p = dom.parentNode;
                p.removeChild(dom);
                p = null;
            }
	      }
	      dom = null;  
    };
        
     var overload = function(pfn, fn ){
           var f = typeof pfn === 'function' ? pfn : function t(){};
           var ov = f._ovl; //call signature hash
           if(!ov){
               ov = { base: f};
               ov[f.length|| 0] = f;
               f= function t(){  //the proxy stub
                  var o = arguments.callee._ovl;
                  var fn = o[arguments.length] || o.base;
                  //recursion safety
                  return fn && fn != arguments.callee ? fn.apply(this,arguments): undefined;
               };
           }
           var fnA = [].concat(fn);
           for(var i=0,l=fnA.length; i<l; i++){
             //ensures no duplicate call signatures, but last in rules!
             ov[fnA[i].length] = fnA[i];
           }
           f._ovl= ov;
           var t = null;
           return f;
       };  
     
    Ext.applyIf( Ext, {
        overload : overload( overload,
           [
             function(fn){ return overload(null, fn);},
             function(obj, mname, fn){
                 return obj[mname] = overload(obj[mname],fn);}
          ]),
          
        isArray : function(v){
           return Object.prototype.toString.apply(v) == '[object Array]';
        },
        
        isObject:function(obj){
            return (obj !== null) && typeof obj == 'object';
        },
        
        /**
         * HTMLDocument assertion with optional accessibility testing
         */
        isDocument : function(obj, testOrigin){
             var test = Object.prototype.toString.apply(obj) == '[object HTMLDocument]' || (obj && obj.nodeType == 9);
            if(test && !!testOrigin){
                try{
                    test = test && !!obj.location;
                }
                catch(e){return false;}
            }
            return test;
        },
        
        isElement : function(obj){
            return obj && Ext.type(obj)== 'element';
        },
        
        isEvent : function(obj){
            return Object.prototype.toString.apply(obj) == '[object Event]' || (Ext.isObject(obj) && !Ext.type(o.constructor) && (window.event && o.clientX && o.clientX == window.event.clientX));
        },

        isFunction: function(obj){
            return !!obj && typeof obj == 'function';
        },
        
        isEventSupported : (function(){
            var TAGNAMES = {
              'select':'input','change':'input',
              'submit':'form','reset':'form',
              'error':'img','load':'img','abort':'img'
            };
            //Cached results
            var cache = {};
            //Get a tokenized string unique to the node and event type
            var getKey = function(type, el){
                return (el ? 
                           (Ext.isElement(el) || Ext.isDocument(el, true) ? 
                                el.nodeName.toLowerCase() : el.id || Ext.type(el)) 
                       : 'div') + ':' + type;
            };
    
            return function (evName, testEl) {
              var key = getKey(evName, testEl);
              if(key in cache){
                //Use a previously cached result if available
                return cache[key];
              }
              var el, isSupported = String(evName).toUpperCase() in window.Event;
             
              if(!isSupported){
                var eventName = 'on' + evName;
                el = testEl || document.createElement(TAGNAMES[eventName] || 'div');
                isSupported = (eventName in el);
              }
              if (!isSupported && el) {
                el.setAttribute && el.setAttribute(eventName, 'return;');
                isSupported = Ext.isFunction(el[eventName]);
              }
              //save the cached result for future tests
              cache[getKey(evName, el)] = isSupported;
              el = null;
              return isSupported;
            };
        })()
    });
       
   
    /**
     * @private
     * Determine Ext.Element[tagName] or Ext.Element (default)
     */
    var assertClass = function(el){
        
        return El[(el.tagName || '-').toUpperCase()] || El;
        
      };

    var libFlyweight;
    function fly(el, doc) {
        if (!libFlyweight) {
            libFlyweight = new Ext.Element.Flyweight();
        }
        libFlyweight.dom = doc ? Ext.getDom(el, doc) : Ext.getDom(el);
        return libFlyweight;
    }
   
     
    Ext.apply(Ext, {
    /*
     * Overload Ext.get to permit Ext.Element access to other document objects
     * This implementation maintains safe element caches for each document queried.
     *
     */

      get : Ext.overload([
        Ext.get,
        function(el, doc, elcache){  //named-cache optimized
            try{doc = doc?doc.dom||doc:null;}catch(docErr){doc = null;}
            //resolve from named cache first
            return el && doc ? resolveCache(doc,elcache)._elCache[el.id] || this.get(el, doc) : null ;
        },
        function(el, doc){         //document targeted
            if(!el || !doc ){ return null; }
            
            if(!Ext.isDocument(doc)) {
                return this.get(el); //a bad get signature
             }
            var ex, elm, id, cache = resolveCache(doc);
            if(Ext.isDocument(el)){
                if(!Ext.isDocument(el, true)){ return false; }  //is it accessible
                // create a bogus element object representing the document object
                if(el == self.document){ return this.get(el); }
                if(cache._elCache['$_doc']){
                    return cache._elCache['$_doc'];
                }
                var f = function(){};
                f.prototype = El.prototype;
                var docEl = new f();
                docEl.dom = el;
                return cache._elCache['$_doc'] = docEl;
             }
             
             cache = cache._elCache;
             
             if(typeof el == "string"){ // element id
                elm = Ext.getDom(el,doc);
                if(!elm) return null;
                
                if(ex = cache[el]){
                    ex.dom = elm;
                }else{
                    ex = cache[el] = new (assertClass(elm))(elm, null, doc);
                }
                return ex;
             }else if(el.tagName){ // dom element
                if(!(id = el.id)){
                    id = Ext.id(el);
                }
                if(ex = cache[id]){
                    ex.dom = el;
                }else{
                    ex = cache[id] = new (assertClass(el))(el, null, doc);
                }
                return ex;
            }else if(el instanceof El || el instanceof El['IFRAME']){
                
                el.dom = doc.getElementById(el.id) || el.dom; // refresh dom element in case no longer valid,
                                                              // catch case where it hasn't been appended
                el.dom && (cache[el.id] = el); // in case it was created directly with Element(), let's cache it
                
                return el.dom ? el : null;
            }else if(el.isComposite){
                return el;

            }else if(Ext.isArray(el)){
                return Ext.get(doc,doc).select(el);
            }
           return null;

    }]),
     
     /**
      * Ext.getDom to support targeted document contexts
      */
     getDom : function(el, doc){
            if(!el){ return null;}
            return el.dom ? el.dom : (typeof el === 'string' ? (doc ||document).getElementById(el) : el);
        },
     /**
     * Returns the current/specified document body as an {@link Ext.Element}.
     * @param {HTMLDocument} doc (optional)
     * @return Ext.Element The document's body
     */
     getBody : Ext.overload([
        
        Ext.getBody,
        
        function(doc){
            var D = ELD.getDocument(doc) || {};
            return Ext.get(D.body || D.documentElement);
        }
       ])
   });      


    var propCache = {},
        camelRe = /(-[a-z])/gi,
        camelFn = function(m, a){ return a.charAt(1).toUpperCase(); },
        view = document.defaultView,
        VISMODE = 'visibilityMode',
        ELDISPLAY = El.DISPLAY,
        data = El.data,
        CSS = Ext.util.CSS;  //Not available in Ext Core.
    
    /**
     * Visibility mode constant - Use a static className to hide element
     * @static
     */
    El.NOSIZE  = 3; //Compat for previous Ext releases  
    El.ASCLASS = 3;
    
    if(CSS){
      Ext.onReady(function(){
	        CSS.getRule('.x-hide-nosize') || //already defined?
	            CSS.createStyleSheet('.x-hide-nosize{height:0px!important;width:0px!important;border:none!important;zoom:1;}.x-hide-nosize * {height:0px!important;width:0px!important;border:none!important;zoom:1;}');
	        CSS.refreshCache();
      });
    }
      
   /**
    * Visibility class - Designed to set an Elements width and height to zero (or other CSS rule)
    * This important rule solves many of the <object/iframe>.reInit issues encountered
    * when setting display:none on an upstream(parent) element.
    * This default rule enables the new Component hideMode:'asclass'. The rule is designed to
    * set height/width to 0 (or other strategy) cia CSS if hidden or collapsed.
    * Additional selectors also hide nested DOM Elements within layouts to prevent
    * container and <object, img, iframe> bleed-thru.
    * 
    * Notes: Ext Core does not have the Ext.util.CSS singleton (as the full Ext framework does). 
    * An equivalent style Rule must be added to an Ext Core page similar to:
    * <pre><code>.x-hide-nosize, .x-hide-nosize * {height:0px!important;width:0px!important;border:none!important;zoom:1;}
    * </code></pre>
    * which matched the visibilityCls property set on the Element Class or instance.
    * (Or you can define a strategy of your own).
    * @static
    * @type String
    * @default 'x-hide-nosize'
    */
    El.visibilityCls = 'x-hide-nosize';

    El.addMethods({
        /**
         * Resolves the current document context of this Element
         */
        getDocument : function(){
           return ELD.getDocument(this);  
        },
        
       /**
        * Gets the element's visibility mode. 
        * @return {Number} Ext.Element[VISIBILITY, DISPLAY, ASCLASS]
        */
        getVisibilityMode :  function(){  
                
                var dom = this.dom, 
                    mode = Ext.isFunction(data) ? data(dom,VISMODE) : this[VISMODE];
                if(mode === undefined){
                   mode = 1;
                   Ext.isFunction(data) ? data(dom, VISMODE, mode) : (this[VISMODE] = mode);
                }
                return mode;
           },
                  
        setVisible : function(visible, animate){
            var me = this,
                dom = me.dom,
                visMode = me.getVisibilityMode();
                
            if(!animate || !A){
                if(visMode === El.DISPLAY){
                    me.setDisplayed(visible);
                }else if(visMode === El.VISIBILITY){
                    me.fixDisplay();
                    dom.style.visibility = visible ? "visible" : "hidden";
                }else if(visMode === El.ASCLASS){
                    me[visible?'removeClass':'addClass'](me.visibilityCls || El.visibilityCls);
                }

            }else{
               
                if(visible){
                    me.setOpacity(.01);
                    me.setVisible(true);
                }
                me.anim({opacity: { to: (visible?1:0) }},
                      me.preanim(arguments, 1),
                      null, .35, 'easeIn', function(){
                         if(!visible){
                             if(visMode === El.DISPLAY){
                                 dom.style.display = "none";
                             }else if(visMode === El.VISIBILITY){
                                 dom.style.visibility = "hidden";
                             }else if(visMode === El.ASCLASS){
                                 me.addClass(me.visibilityCls || El.visibilityCls);
                             }
                             me.setOpacity(1);
                         }
                     });
            }
            return me;
        },

        /**
         * Checks whether the element is currently visible using both visibility, display, and nosize class properties.
         * @param {Boolean} deep (optional) True to walk the dom and see if parent elements are hidden (defaults to false)
         * @return {Boolean} True if the element is currently visible, else false
         */
        isVisible : function(deep) {
            var vis = !( this.getStyle("visibility") === "hidden" || 
                         this.getStyle("display") === "none" || 
                         this.hasClass(this.visibilityCls || El.visibilityCls));
            if(deep && vis){
                var p = this.dom.parentNode;
                while(p && p.tagName.toLowerCase() !== "body"){
                    if(!Ext.fly(p, '_isVisible').isVisible()){
                        vis = false;
                        break;
                    }
                    p = p.parentNode;
                }
                delete El._flyweights['_isVisible']; //orphan reference cleanup
            }
            return vis;
        },
        
        /**
	  * Removes this element from the DOM and deletes it from the cache
	  * @param {Boolean} cleanse (optional) Perform a cleanse of immediate childNodes as well.
	  * @param {Boolean} deep (optional) Perform a deep cleanse of all nested childNodes as well.
	  */
	
	    remove : function(cleanse, deep){
	      if(this.dom){
	        this._mask && this.unmask(true); 
	        this._mask = null;
	        cleanse && this.cleanse(true, deep);
	        Ext.removeNode(this);
	        this.dom = null;  //clear ANY DOM references
	        delete this.dom;
	      }
	    },
	
	    /**
	     * Deep cleansing childNode Removal
	     * @param {Boolean} forceReclean (optional) By default the element
	     * keeps track if it has been cleansed already so
	     * you can call this over and over. However, if you update the element and
	     * need to force a reclean, you can pass true.
	     * @param {Boolean} deep (optional) Perform a deep cleanse of all childNodes as well.
	     */
	    cleanse : function(forceReclean, deep){
	        if(this.isCleansed && forceReclean !== true){
	            return this;
	        }
	        var d = this.dom, n = d.firstChild, nx;
	         while(d && n){
	             nx = n.nextSibling;
	             deep && Ext.fly(n, '_cleanser').cleanse(forceReclean, deep);
	             Ext.removeNode(n);
	             n = nx;
	         }
             delete Ext.Element._flyweights['_cleanser']; //orphan reference cleanup
	         this.isCleansed = true;
	         return this;
	     },
	     
	     scrollIntoView : function(container, hscroll){
                var d = this.getDocument();
	            var c = Ext.getDom(container, d) || Ext.getBody(d).dom;
	            var el = this.dom;
	            var o = this.getOffsetsTo(c),
	                s = this.getScroll(),
	                l = o[0] + s.left,
	                t = o[1] + s.top,
	                b = t + el.offsetHeight,
	                r = l + el.offsetWidth;
	            var ch = c.clientHeight;
	            var ct = parseInt(c.scrollTop, 10);
	            var cl = parseInt(c.scrollLeft, 10);
	            var cb = ct + ch;
	            var cr = cl + c.clientWidth;
	            if(el.offsetHeight > ch || t < ct){
	                c.scrollTop = t;
	            }else if(b > cb){
	                c.scrollTop = b-ch;
	            }
	            c.scrollTop = c.scrollTop; // corrects IE, other browsers will ignore
	            if(hscroll !== false){
	                if(el.offsetWidth > c.clientWidth || l < cl){
	                    c.scrollLeft = l;
	                }else if(r > cr){
	                    c.scrollLeft = r-c.clientWidth;
	                }
	                c.scrollLeft = c.scrollLeft;
	            }
	            return this;
        },
        
        /**
         * Returns the current scroll position of the element.
         * @return {Object} An object containing the scroll position in the format {left: (scrollLeft), top: (scrollTop)}
         */
        getScroll : function(){
            var d = this.dom, 
            doc = this.getDocument(),
            body = doc.body,
            docElement = doc.documentElement,
            l,
            t,
            ret;
            
            if(Ext.isDocument(d) || d == body){            
                if(Ext.isIE && ELD.docIsStrict(doc)){
                    l = docElement.scrollLeft; 
                    t = docElement.scrollTop;
                }else{
                    l = window.pageXOffset;
                    t = window.pageYOffset;
                }            
                ret = {left: l || (body ? body.scrollLeft : 0), top: t || (body ? body.scrollTop : 0)};
            }else{
                ret = {left: d.scrollLeft, top: d.scrollTop};
            }
            return ret;
        },
        /**
         * Normalizes currentStyle and computedStyle.
         * @param {String} property The style property whose value is returned.
         * @return {String} The current value of the style property for this element.
         */
        getStyle : function(){
            var gs = 
             view && view.getComputedStyle ?
                function GS(prop){
                    var el = this.dom, v, cs, camel;
                    if(prop == 'float'){
                        prop = "cssFloat";
                    }
                    
                    if(v = el.style[prop]){
                        return v;
                    }
                    var D = this.getDocument();
                    if(D && (cs = D.defaultView.getComputedStyle(el, ""))){
                        if(!(camel = propCache[prop])){
                            camel = propCache[prop] = prop.replace(camelRe, camelFn);
                        }
                        return cs[camel];
                    }
                    return null;
                } :
                function GS(prop){
                    var el = this.dom, v, cs, camel;
                    if(prop == 'opacity'){
                        if(typeof el.style.filter == 'string'){
                            var m = el.style.filter.match(/alpha\(opacity=(.*)\)/i);
                            if(m){
                                var fv = parseFloat(m[1]);
                                if(!isNaN(fv)){
                                    return fv ? fv / 100 : 0;
                                }
                            }
                        }
                        return 1;
                    }else if(prop == 'float'){
                        prop = "styleFloat";
                    }
                    if(!(camel = propCache[prop])){
                        camel = propCache[prop] = prop.replace(camelRe, camelFn);
                    }
                    if(v = el.style[camel]){
                        return v;
                    }
                    if(cs = el.currentStyle){
                        return cs[camel];
                    }
                    return null;
                };
                var GS = null;
                return gs;
        }(),
        /**
         * Wrapper for setting style properties, also takes single object parameter of multiple styles.
         * @param {String/Object} property The style property to be set, or an object of multiple styles.
         * @param {String} value (optional) The value to apply to the given property, or null if an object was passed.
         * @return {Ext.Element} this
         */
        setStyle : function(prop, value){
            if(typeof prop == "string"){
                var camel;
                if(!(camel = propCache[prop])){
                    camel = propCache[prop] = prop.replace(camelRe, camelFn);
                }
                if(camel == 'opacity') {
                    this.setOpacity(value);
                }else{
                    this.dom.style[camel] = value;
                }
            }else{
                for(var style in prop){
                    if(typeof prop[style] != "function"){
                       this.setStyle(style, prop[style]);
                    }
                }
            }
            return this;
        },
        /**
	    * Centers the Element in either the viewport, or another Element.
	    * @param {Mixed} centerIn (optional) The element in which to center the element.
	    */
	    center : function(centerIn){
	        return this.alignTo(centerIn || this.getDocument(), 'c-c');        
	    },
        
        /**
	    * Calculates the x, y to center this element on the screen
	    * @return {Array} The x, y values [x, y]
	    */
	    getCenterXY : function(){
	        return this.getAlignToXY(this.getDocument(), 'c-c');
	    },
        /**
	     * Gets the x,y coordinates specified by the anchor position on the element.
	     * @param {String} anchor (optional) The specified anchor position (defaults to "c").  See {@link #alignTo}
	     * for details on supported anchor positions.
	     * @param {Boolean} local (optional) True to get the local (element top/left-relative) anchor position instead
	     * of page coordinates
	     * @param {Object} size (optional) An object containing the size to use for calculating anchor position
	     * {width: (target width), height: (target height)} (defaults to the element's current size)
	     * @return {Array} [x, y] An array containing the element's x and y coordinates
	     */
	    getAnchorXY : function(anchor, local, s){
	        //Passing a different size is useful for pre-calculating anchors,
	        //especially for anchored animations that change the el size.
	        anchor = (anchor || "tl").toLowerCase();
	        s = s || {};
	        
	        var me = this,  doc = this.getDocument(),      
	            vp = me.dom == doc.body || me.dom == doc,
	            w = s.width || vp ? Ext.lib.Dom.getViewWidth(false,doc) : me.getWidth(),
	            h = s.height || vp ? Ext.lib.Dom.getViewHeight(false,doc) : me.getHeight(),                      
	            xy,         
	            r = Math.round,
	            o = me.getXY(),
	            scroll = me.getScroll(),
	            extraX = vp ? scroll.left : !local ? o[0] : 0,
	            extraY = vp ? scroll.top : !local ? o[1] : 0,
	            hash = {
	                c  : [r(w * .5), r(h * .5)],
	                t  : [r(w * .5), 0],
	                l  : [0, r(h * .5)],
	                r  : [w, r(h * .5)],
	                b  : [r(w * .5), h],
	                tl : [0, 0],    
	                bl : [0, h],
	                br : [w, h],
	                tr : [w, 0]
	            };
	        
	        xy = hash[anchor];  
	        return [xy[0] + extraX, xy[1] + extraY]; 
	    },
	
	    /**
	     * Anchors an element to another element and realigns it when the window is resized.
	     * @param {Mixed} element The element to align to.
	     * @param {String} position The position to align to.
	     * @param {Array} offsets (optional) Offset the positioning by [x, y]
	     * @param {Boolean/Object} animate (optional) True for the default animation or a standard Element animation config object
	     * @param {Boolean/Number} monitorScroll (optional) True to monitor body scroll and reposition. If this parameter
	     * is a number, it is used as the buffer delay (defaults to 50ms).
	     * @param {Function} callback The function to call after the animation finishes
	     * @return {Ext.Element} this
	     */
	    anchorTo : function(el, alignment, offsets, animate, monitorScroll, callback){        
	        var me = this,
	            dom = me.dom;
	        
	        function action(){
	            fly(dom).alignTo(el, alignment, offsets, animate);
	            Ext.callback(callback, fly(dom));
	        };
	        
	        Ext.EventManager.onWindowResize(action, me);
	        
	        if(!Ext.isEmpty(monitorScroll)){
	            Ext.EventManager.on(window, 'scroll', action, me,
	                {buffer: !isNaN(monitorScroll) ? monitorScroll : 50});
	        }
	        action.call(me); // align immediately
	        return me;
	    },
        
        /**
	     * Returns the current scroll position of the element.
	     * @return {Object} An object containing the scroll position in the format {left: (scrollLeft), top: (scrollTop)}
	     */
	    getScroll : function(){
	        var d = this.dom, 
	            doc = this.getDocument(),
	            body = doc.body,
	            docElement = doc.documentElement,
	            l,
	            t,
	            ret;
	            
	        if(d == doc || d == body){            
	            if(Ext.isIE && ELD.docIsStrict(doc)){
	                l = docElement.scrollLeft; 
	                t = docElement.scrollTop;
	            }else{
	                l = window.pageXOffset;
	                t = window.pageYOffset;
	            }            
	            ret = {left: l || (body ? body.scrollLeft : 0), top: t || (body ? body.scrollTop : 0)};
	        }else{
	            ret = {left: d.scrollLeft, top: d.scrollTop};
	        }
	        return ret;
	    },
	
	    /**
	     * Gets the x,y coordinates to align this element with another element. See {@link #alignTo} for more info on the
	     * supported position values.
	     * @param {Mixed} element The element to align to.
	     * @param {String} position The position to align to.
	     * @param {Array} offsets (optional) Offset the positioning by [x, y]
	     * @return {Array} [x, y]
	     */
	    getAlignToXY : function(el, p, o){    
            var doc;
	        el = Ext.get(el, doc = this.getDocument());
	        
	        if(!el || !el.dom){
	            throw "Element.getAlignToXY with an element that doesn't exist";
	        }
	        
	        o = o || [0,0];
	        p = (p == "?" ? "tl-bl?" : (!/-/.test(p) && p != "" ? "tl-" + p : p || "tl-bl")).toLowerCase();       
	                
	        var me = this,
	            d = me.dom,
	            a1,
	            a2,
	            x,
	            y,
	            //constrain the aligned el to viewport if necessary
	            w,
	            h,
	            r,
	            dw = Ext.lib.Dom.getViewWidth(false,doc) -10, // 10px of margin for ie
	            dh = Ext.lib.Dom.getViewHeight(false,doc)-10, // 10px of margin for ie
	            p1y,
	            p1x,            
	            p2y,
	            p2x,
	            swapY,
	            swapX,
	            docElement = doc.documentElement,
	            docBody = doc.body,
	            scrollX = (docElement.scrollLeft || docBody.scrollLeft || 0)+5,
	            scrollY = (docElement.scrollTop || docBody.scrollTop || 0)+5,
	            c = false, //constrain to viewport
	            p1 = "", 
	            p2 = "",
	            m = p.match(/^([a-z]+)-([a-z]+)(\?)?$/);
	        
	        if(!m){
	           throw "Element.getAlignToXY with an invalid alignment " + p;
	        }
	        
	        p1 = m[1]; 
	        p2 = m[2]; 
	        c = !!m[3];
	
	        //Subtract the aligned el's internal xy from the target's offset xy
	        //plus custom offset to get the aligned el's new offset xy
	        a1 = me.getAnchorXY(p1, true);
	        a2 = el.getAnchorXY(p2, false);
	
	        x = a2[0] - a1[0] + o[0];
	        y = a2[1] - a1[1] + o[1];
	
	        if(c){    
	           w = me.getWidth();
	           h = me.getHeight();
	           r = el.getRegion();       
	           //If we are at a viewport boundary and the aligned el is anchored on a target border that is
	           //perpendicular to the vp border, allow the aligned el to slide on that border,
	           //otherwise swap the aligned el to the opposite border of the target.
	           p1y = p1.charAt(0);
	           p1x = p1.charAt(p1.length-1);
	           p2y = p2.charAt(0);
	           p2x = p2.charAt(p2.length-1);
	           swapY = ((p1y=="t" && p2y=="b") || (p1y=="b" && p2y=="t"));
	           swapX = ((p1x=="r" && p2x=="l") || (p1x=="l" && p2x=="r"));          
	           
	
	           if (x + w > dw + scrollX) {
	                x = swapX ? r.left-w : dw+scrollX-w;
	           }
	           if (x < scrollX) {
	               x = swapX ? r.right : scrollX;
	           }
	           if (y + h > dh + scrollY) {
	                y = swapY ? r.top-h : dh+scrollY-h;
	            }
	           if (y < scrollY){
	               y = swapY ? r.bottom : scrollY;
	           }
	        }
            
	        return [x,y];
	    },
            // private ==>  used outside of core
	    adjustForConstraints : function(xy, parent, offsets){
	        return this.getConstrainToXY(parent || this.getDocument(), false, offsets, xy) ||  xy;
	    },
	
	    // private ==>  used outside of core
	    getConstrainToXY : function(el, local, offsets, proposedXY){   
	        var os = {top:0, left:0, bottom:0, right: 0};
	
	        return function(el, local, offsets, proposedXY){
	            var doc = this.getDocument();
                el = Ext.get(el, doc);
	            offsets = offsets ? Ext.applyIf(offsets, os) : os;
	
	            var vw, vh, vx = 0, vy = 0;
	            if(el.dom == doc.body || el.dom == doc){
	                vw = Ext.lib.Dom.getViewWidth(false,doc);
	                vh = Ext.lib.Dom.getViewHeight(false,doc);
	            }else{
	                vw = el.dom.clientWidth;
	                vh = el.dom.clientHeight;
	                if(!local){
	                    var vxy = el.getXY();
	                    vx = vxy[0];
	                    vy = vxy[1];
	                }
	            }
	
	            var s = el.getScroll();
	
	            vx += offsets.left + s.left;
	            vy += offsets.top + s.top;
	
	            vw -= offsets.right;
	            vh -= offsets.bottom;
	
	            var vr = vx+vw;
	            var vb = vy+vh;
	
	            var xy = proposedXY || (!local ? this.getXY() : [this.getLeft(true), this.getTop(true)]);
	            var x = xy[0], y = xy[1];
	            var w = this.dom.offsetWidth, h = this.dom.offsetHeight;
	
	            // only move it if it needs it
	            var moved = false;
	
	            // first validate right/bottom
	            if((x + w) > vr){
	                x = vr - w;
	                moved = true;
	            }
	            if((y + h) > vb){
	                y = vb - h;
	                moved = true;
	            }
	            // then make sure top/left isn't negative
	            if(x < vx){
	                x = vx;
	                moved = true;
	            }
	            if(y < vy){
	                y = vy;
	                moved = true;
	            }
	            return moved ? [x, y] : false;
	        };
	    }(),
        /**
	    * Calculates the x, y to center this element on the screen
	    * @return {Array} The x, y values [x, y]
	    */
	    getCenterXY : function(){
	        return this.getAlignToXY(Ext.getBody(this.getDocument()), 'c-c');
	    },
        
        /**
         * Returns the offset height of the element
         * @param {Boolean} contentHeight (optional) true to get the height minus borders and padding
         * @return {Number} The element's height
         */
        getHeight : function(contentHeight){
            var h = Math.max(this.dom.offsetHeight, this.dom.clientHeight) || 0;
            h = !contentHeight ? h : h - this.getBorderWidth("tb") - this.getPadding("tb");
            return h < 0 ? 0 : h;
        },
	
        /**
         * Returns the offset width of the element
         * @param {Boolean} contentWidth (optional) true to get the width minus borders and padding
         * @return {Number} The element's width
         */
        getWidth : function(contentWidth){
            var w = Math.max(this.dom.offsetWidth, this.dom.clientWidth) || 0;
            w = !contentWidth ? w : w - this.getBorderWidth("lr") - this.getPadding("lr");
            return w < 0 ? 0 : w;
        },
        
	    /**
	    * Centers the Element in either the viewport, or another Element.
	    * @param {Mixed} centerIn (optional) The element in which to center the element.
	    */
	    center : function(centerIn){
	        return this.alignTo(centerIn || Ext.getBody(this.getDocument()), 'c-c');        
	    }  
    });
            
   
    
    Ext.apply(ELD , {
        /**
         * Resolve the current document context of the passed Element
         */
        getDocument : function(el, accessTest){
          var dom= null;
          try{
            dom = Ext.getDom(el, null); //will fail if El.dom is non "same-origin" document
          }catch(ex){}

          var isDoc = Ext.isDocument(dom);
          if(isDoc){
            if(accessTest){
                return Ext.isDocument(dom, accessTest) ? dom : null;
            }
            return dom;
          }
          return dom ? 
                dom.ownerDocument ||  //Element 
                dom.document //Window
                : null; 
        },
        
        /**
         * Return the Compatability Mode of the passed document or Element
         */
        docIsStrict : function(doc){
            return (Ext.isDocument(doc) ? doc : this.getDocument(doc)).compatMode == "CSS1Compat";
        },
        
        getViewWidth : Ext.overload ([
           ELD.getViewWidth,
            function() { return this.getViewWidth(false);},
            function(full, doc) {
                return full ? this.getDocumentWidth(doc) : this.getViewportWidth(doc);
            }]
         ),

        getViewHeight : Ext.overload ([
            ELD.getViewHeight,
            function() { return this.getViewHeight(false);},
	        function(full, doc) {
	            return full ? this.getDocumentHeight(doc) : this.getViewportHeight(doc);
	        }]),
        
        getDocumentHeight: Ext.overload([
           ELD.getDocumentHeight, 
           function(doc) {
            if(doc=this.getDocument(doc)){
              return Math.max(
                 !this.docIsStrict(doc) ? doc.body.scrollHeight : doc.documentElement.scrollHeight
                 , this.getViewportHeight(doc)
                 );
            }
            return undefined;
           }
         ]),

        getDocumentWidth: Ext.overload([
           ELD.getDocumentWidth,
           function(doc) {
              if(doc=this.getDocument(doc)){
                return Math.max(
                 !this.docIsStrict(doc) ? doc.body.scrollWidth : doc.documentElement.scrollWidth
                 , this.getViewportWidth(doc)
                 );
              }
              return undefined;
            }
        ]),

        getViewportHeight: Ext.overload([
           ELD.getViewportHeight,
           function(doc){
             if(doc=this.getDocument(doc)){
                if(Ext.isIE){
                    return this.docIsStrict(doc) ? doc.documentElement.clientHeight : doc.body.clientHeight;
                }else{
                    return doc.defaultView.innerHeight;
                }
             }
             return undefined;
           }
        ]),

        getViewportWidth: Ext.overload([
           ELD.getViewportWidth,
           function(doc) {
              if(doc=this.getDocument(doc)){
                return !this.docIsStrict(doc) && !Ext.isOpera ? doc.body.clientWidth :
                   Ext.isIE ? doc.documentElement.clientWidth : doc.defaultView.innerWidth;
              }
              return undefined;
            }
        ]),
               
        getXY : Ext.overload([ 
	        ELD.getXY,
	        function(el, doc) {
                
                el = Ext.getDom(el, doc);    
	            var D= this.getDocument(el);
                var p, pe, b, scroll;
	            var bd = D ? (D.body || D.documentElement): null;
	            
	            if(!el || !bd || el == bd){ return [0, 0]; }
	
	            if (el.getBoundingClientRect) {
	                b = el.getBoundingClientRect();
	                scroll = fly(D).getScroll();
	                return [b.left + scroll.left, b.top + scroll.top];
	            }
	            var x = 0, y = 0;
	
	            p = el;
	
	            var hasAbsolute = fly(el).getStyle("position") == "absolute";
	
	            while (p) {
	
	                x += p.offsetLeft;
	                y += p.offsetTop;
	
	                if (!hasAbsolute && fly(p).getStyle("position") == "absolute") {
	                    hasAbsolute = true;
	                }
	
	                if (Ext.isGecko) {
	                    pe = fly(p);
	
	                    var bt = parseInt(pe.getStyle("borderTopWidth"), 10) || 0;
	                    var bl = parseInt(pe.getStyle("borderLeftWidth"), 10) || 0;
	
	
	                    x += bl;
	                    y += bt;
	
	
	                    if (p != el && pe.getStyle('overflow') != 'visible') {
	                        x += bl;
	                        y += bt;
	                    }
	                }
	                p = p.offsetParent;
	            }
	
	            if (Ext.isSafari && hasAbsolute) {
	                x -= bd.offsetLeft;
	                y -= bd.offsetTop;
	            }
	
	            if (Ext.isGecko && !hasAbsolute) {
	                var dbd = fly(bd);
	                x += parseInt(dbd.getStyle("borderLeftWidth"), 10) || 0;
	                y += parseInt(dbd.getStyle("borderTopWidth"), 10) || 0;
	            }
	
	            p = el.parentNode;
	            while (p && p != bd) {
	                if (!Ext.isOpera || (p.tagName != 'TR' && fly(p).getStyle("display") != "inline")) {
	                    x -= p.scrollLeft;
	                    y -= p.scrollTop;
	                }
	                p = p.parentNode;
	            }
	            return [x, y];
	        }])
    });
    
    /**
     * @private
     * Overload Ext.fly to support targeted document contexts
     */
    Ext.fly = Ext.overload([
        Ext.fly,  // existing 2 arg form
        function(el){
            return this.fly(el, null);
        },
        function(el,named,doc){
            return this.fly(Ext.getDom(el, doc), named);
        }
    ]);
    
    /** @sourceURL=<multidom.js> */
    Ext.provide && Ext.provide('multidom');
 })();