/* global Ext */
/*
 * Copyright 2007-2009, Active Group, Inc.  All rights reserved.
 * ******************************************************************************
 * This file is distributed on an AS IS BASIS WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * ***********************************************************************************
 * @version 2.0 RC3
 * [For Ext 3.0 RC2.1 or higher only]
 *
 * License: ux.ManagedIFrame, ux.ManagedIFrame.Panel, ux.ManagedIFrame.Window  
 * are licensed under the terms of the Open Source GPL 3.0 license:
 * http://www.gnu.org/licenses/gpl.html
 *
 * Commercial use is prohibited without a Commercial Developement License. See
 * http://licensing.theactivegroup.com.
 *
 * Donations are welcomed: http://donate.theactivegroup.com
 *
 */
 
(function(){
    
    var El = Ext.Element, 
        ElFrame, 
        ELD = Ext.lib.Dom,
        EMPTYFN = function(){},
        OP = Object.prototype,
       addListener = function () {
            var handler;
            if (window.addEventListener) {
                handler = function F(el, eventName, fn, capture) {
                    el.addEventListener(eventName, fn, !!capture);
                };
            } else if (window.attachEvent) {
                handler = function F(el, eventName, fn, capture) {
                    el.attachEvent("on" + eventName, fn);
                };
            } else {
                handler = function F(){};
            }
            var F = null; //Gbg collect
            return handler;
        }(),
       removeListener = function() {
            var handler;
            if (window.removeEventListener) {
                handler = function F(el, eventName, fn, capture) {
                    el.removeEventListener(eventName, fn, (capture));
                };
            } else if (window.detachEvent) {
                handler = function F(el, eventName, fn) {
                    el.detachEvent("on" + eventName, fn);
                };
            } else {
                handler = function F(){};
            }
            var F = null; //Gbg collect
            return handler;
        }();
 
  //assert multidom support: REQUIRED for Ext 3 or higher!
  if(typeof ELD.getDocument != 'function'){
     throw "MIF 2.0 requires multidom support" ;
  }
  //assert Ext 3 SVN/RC2.1 or higher!
  if(Ext.version < 3 || typeof Ext.Element.data != 'function'){
     throw "MIF 2.0 requires Ext 3.0 SVN/RC2.1 or higher." ;
  }
  
  Ext.isDocument = function(obj , testOrigin){
            var test = OP.toString.apply(obj) == '[object HTMLDocument]' || (obj && obj.nodeType == 9);
            if(test && !!testOrigin){
                try{
                    test = test && !!obj.location;
                }
                catch(e){return false;}
            }
            return test;
        };

  Ext.ns('Ext.ux.ManagedIFrame', 'Ext.ux.plugin');
  
  var MIM, MIF = Ext.ux.ManagedIFrame, MIFC;
  var frameEvents = ['documentloaded',
                     'domready',
                     'focus',
                     'blur',
                     'resize',
                     'unload',
                     'exception', 
                     'message'];
                     
  var reSynthEvents = new RegExp('^('+frameEvents.join('|')+ ')', 'i');

    /**
     * @class Ext.ux.ManagedIFrame.Element
     * @extends Ext.Element
     * @version 2.0 RC2
     * @license <a href="http://www.gnu.org/licenses/gpl.html">GPL 3.0</a> 
     * @author Doug Hendricks. Forum ID: <a href="http://extjs.com/forum/member.php?u=8730">hendricd</a> 
     * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
     * @copyright 2007-2009, Active Group, Inc. All rights reserved.
     * @constructor Create a new Ext.ux.ManagedIFrame.Element directly. 
     * @param {String/HTMLElement} element
     * @param {Boolean} forceNew (optional) By default the constructor checks to see if there is already an instance of this element in the cache and if there is it returns the same instance. This will skip that check (useful for extending this class).
     * @param {DocumentElement} (optional) Document context uses to resolve an Element search by its id.
     */
     
    Ext.ux.ManagedIFrame.Element = Ext.extend(Ext.Element, {
             
            cls   :  'ux-mif',
             
            visibilityMode :  Ext.isIE ? El.DISPLAY : 3, //nosize class mode
             
           /**
		    * Visibility class - Designed to set an Elements width and height to zero (or other CSS rule)
		    * @property Ext.ux.ManagedIFrame.Element.visibilityCls
		    * @type String
		    */
	        visibilityCls : 'x-hide-nosize',   
             
            constructor : function(element, forceNew, doc ){
                var d = doc || document;
                var elCache  = ELD.resolveCache ? ELD.resolveCache(d)._elCache : El.cache ;
                var dom = typeof element == "string" ?
                            d.getElementById(element) : element.dom || element;
                if(!dom || !(/^(iframe|frame)/i).test(dom.tagName)) { // invalid id/element
                    return null;
                }
                var id = dom.id;
                if(forceNew !== true && id && elCache[id]){ // element object already exists
                    return elCache[id];
                } else {
                    if(id){ elCache[id] = this;}
                }
                /**
                 * The DOM element
                 * @type HTMLElement
                 */
                this.dom = dom;
                this.cls && this.addClass(this.cls);
                /**
                 * The DOM element ID
                 * @type String
                 */
                 this.id = id || Ext.id(dom);
                 this.dom.name || (this.dom.name = this.id);
                 this.dom.ownerCt = this;
                 MIM.register(this);

                 (this._observable = new Ext.util.Observable()).addEvents(
                    
                    /**
                     * Fires when the iFrame has reached a loaded/complete state.
                     * @event documentloaded
                     * @param {Ext.ux.MIF.Element} this
                     */
                    'documentloaded',
                    
                    /**
                     * Fires ONLY when an iFrame's Document(DOM) has reach a
                     * state where the DOM may be manipulated ('same origin' policy)
                     * Note: This event is only available when overwriting the iframe
                     * document using the update or load methods and "same-origin"
                     * documents. Returning false from the eventHandler stops further event
                     * (documentloaded) processing.
                     * @event domready 
                     * @param {Ext.ux.MIF.Element} this
                     */

                    'domready',
                    
                    /**
                     * Fires when the frame actions raise an error
                     * @event exception
                     * @param {Ext.ux.MIF.Element} this.iframe
                     * @param {Error/string} exception
                     */
                     'exception',
                     
                    /**
                     * Fires when the frame's window is resized.  This event, when raised from a "same-origin" frame,
                     * will send current height/width reports with the event.
                     * @event resize
                     * @param {Ext.ux.MIF.Element} this.iframe
                     * @param {Object} documentSize A height/width object signifying the new document size
                     * @param {Object} viewPortSize A height/width object signifying the size of the frame's viewport
                     * @param {Object} viewSize A height/width object signifying the size of the frame's view
                     */
                     'resize',
                     
                    /**
                     * Fires upon receipt of a message generated by window.sendMessage
                     * method of the embedded Iframe.window object
                     * @event message
                     * @param {Ext.ux.MIF} this.iframe
                     * @param {object}
                     *            message (members: type: {string} literal "message", data
                     *            {Mixed} [the message payload], domain [the document domain
                     *            from which the message originated ], uri {string} the
                     *            document URI of the message sender source (Object) the
                     *            window context of the message sender tag {string} optional
                     *            reference tag sent by the message sender
                     * <p>Alternate event handler syntax for message:tag filtering Fires upon
                     * receipt of a message generated by window.sendMessage method which
                     * includes a specific tag value of the embedded Iframe.window object
                     */
                    'message',

                    /**
                     * Fires when the frame is blurred (loses focus).
                     * @event blur
                     * @param {Ext.ux.MIF} this
                     * @param {Ext.Event}
                     *            Note: This event is only available when overwriting the
                     *            iframe document using the update method and to pages
                     *            retrieved from a "same domain". Returning false from the
                     *            eventHandler [MAY] NOT cancel the event, as this event is
                     *            NOT ALWAYS cancellable in all browsers.
                     */
                     'blur',

                    /**
                     * Fires when the frame gets focus. Note: This event is only available
                     * when overwriting the iframe document using the update method and to
                     * pages retrieved from a "same domain". Returning false from the
                     * eventHandler [MAY] NOT cancel the event, as this event is NOT ALWAYS
                     * cancellable in all browsers.
                     * @event focus
                     * @param {Ext.ux.MIF.Element} this
                     * @param {Ext.Event}
                     *
                    */
                    'focus',

                    /**
                     * Note: This event is only available when overwriting the iframe
                     * document using the update method and to pages retrieved from a "same-origin"
                     * domain. Note: Opera does not raise this event.
                     * @event unload * Fires when(if) the frames window object raises the unload event
                     * @param {Ext.ux.MIF.Element} this.
                     * @param {Ext.Event}
                     */
                     'unload'
                 );
                    //  Private internal document state events.
                 this._observable.addEvents('_docready','_docload');
                 
                 // Hook the Iframes loaded and error state handlers
                 this.dom[Ext.isIE?'onreadystatechange':'onload'] =
                    this.dom['onerror'] = this.loadHandler.createDelegate(this);
                
            },

            /** @private
             * Removes the MIFElement interface from the DOM FRAME Element.
             * It does NOT remove the managed FRAME from the DOM.  Use the {@link remove} method to perfom both functions.
             */
            destructor   :  function () {
                this.dom[Ext.isIE?'onreadystatechange':'onload'] = this.dom['onerror'] = EMPTYFN;
                MIM.deRegister(this);
                this.removeAllListeners();
                Ext.destroy(this.shim, this.DDM);
                this.hideMask(true);
                delete this.loadMask;
                this.reset(); 
                this.manager = null;
                this.dom.ownerCt = null;
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
                     deep && Ext.fly(n).cleanse(forceReclean, deep);
                     Ext.removeNode(n);
                     n = nx;
                }
                this.isCleansed = true;
                return this;
            },

            /** (read-only) The last known URI set programmatically by the Component
             * @property  
             * @type {String|Function}
             */
            src : null,

            /** (read-only) For "same-origin" frames only.  Provides a reference to
             * the Ext.util.CSS singleton to manipulate the style sheets of the frame's
             * embedded document.
             *
             * @property
             * @type Ext.util.CSS
             */
            CSS : null,

            /** Provides a reference to the managing Ext.ux.MIF.Manager instance.
             *
             * @property
             * @type Ext.ux.MIF.Manager
             */
             manager : null,
            /**
              * Enables/disables internal cross-frame messaging interface
              * @cfg {Boolean} disableMessaging False to enable cross-frame messaging API
              * Default = true
              *
              */
            disableMessaging         :  true,

             /**
              * Maximum number of domready event detection retries for IE.  IE does not provide
              * a native DOM event to signal when the frames DOM may be manipulated, so a polling process
              * is used to determine when the documents BODY is available. <p> Certain documents may not contain
              * a BODY tag:  eg. MHT(rfc/822), XML, or other non-HTML content. Detection polling will stop after this number of 2ms retries 
              * or when the documentloaded event is raised.</p>
              * @cfg {Integer} domReadyRetries 
              * @default 7500 (* 2 = 15 seconds) 
              */
            domReadyRetries   :  7500,
            
            /**
              * Enables/disables internal cross-frame messaging interface
              * @cfg {Boolean} disableMessaging False to enable cross-frame messaging API
              * Default = true
              *
              */

            eventsFollowFrameLinks   : true,

            /** @private */
            _domCache      : null,

            /**
             * Removes the FRAME from the DOM and deletes it from the cache
             */
            remove  : function(){
                this.destructor.apply(this,arguments);
                ElFrame.superclass.remove.apply(this,arguments);
            },
            
            /**
             * Return the ownerDocument property of the IFRAME Element.
             * (Note: This is not the document context of the FRAME's loaded document. 
             * See the getFrameDocument method for that.)
             */
            getDocument :  
                function(){ return this.dom ? this.dom.ownerDocument : document;},
            
            /**
	         * Loads the frame Element with the response from a form submit to the 
	         * specified URL with the ManagedIframe.Element as it's submit target.
	         *
	         * @param {Object} submitCfg A config object containing any of the following options:
	         * <pre><code>
	         *      mifPanel.submitAsTarget({
	         *         form : formPanel.form,  //optional Ext.FormPanel, Ext form element, or HTMLFormElement
	         *         url: &quot;your-url.php&quot;,
	         *         params: {param1: &quot;foo&quot;, param2: &quot;bar&quot;}, // or a URL encoded string
	         *         callback: yourFunction,  //optional, called with the signature (frame, responseContent)
	         *         scope: yourObject, // optional scope for the callback
	         *         method: 'POST', //optional form.action (default:'POST')
             *         encoding : "multipart/form-data" //optional, default = HTMLForm default  
	         *      });
	         *
	         * </code></pre>
	         *
	         */
            submitAsTarget : function(submitCfg){ //form, url, params, callback, scope){
                var opt = submitCfg || {}, D = this.getDocument();
		        //this.reset();
		        var form = opt.form || Ext.DomHelper.append(D.body, { tag: 'form', cls : 'x-hidden'});
		        form = Ext.getDom(form.form || form, D);
		
		        form.target = this.dom.name;
		        form.method = opt.method || 'POST';
		        opt.encoding && (form.enctype = form.encoding = String(opt.encoding));
		        opt.url && (form.action = opt.url);
		
		        var hiddens, hd;
		        if(opt.params){ // add any additional dynamic params
		            hiddens = [];
		            var ps = typeof opt.params == 'string'? Ext.urlDecode(params, false): opt.params;
		            for(var k in ps){
		                if(ps.hasOwnProperty(k)){
		                    hd = D.createElement('input');
		                    hd.type = 'hidden';
		                    hd.name = k;
		                    hd.value = ps[k];
		                    form.appendChild(hd);
		                    hiddens.push(hd);
		                }
		            }
		        }
		
		        opt.callback && 
                    this._observable.addListener('_docload',opt.callback, opt.scope,{single:true, delay : 200});
                     
                this._frameAction = true;
                this._targetURI = location.href;
		        this.showMask();
		        
		        //slight delay for masking
		        (function(){
		            form.submit();
                    // remove dynamic inputs
		            hiddens && Ext.each(hiddens, Ext.removeNode, Ext);

                    //Remove if dynamically generated.
		            Ext.fly(form,'_dynaForm').hasClass('x-hidden') && Ext.removeNode(form);
		            this.hideMask(true);
		        }).defer(100, this);
		    },

            /**
             * @cfg {String} resetUrl Frame document reset string for use with the {@link #Ext.ux.MIF-reset} method.
             * Defaults:<p> For IE on SSL domains - the current value of Ext.SSL_SECURE_URL<p> "about:blank" for all others.
             */
            resetUrl : (function(){
                return Ext.isIE && Ext.isSecure ? Ext.SSL_SECURE_URL : 'about:blank';
            })(),

            /**
             * Sets the embedded Iframe src property. Note: invoke the function with
             * no arguments to refresh the iframe based on the current src value.
             *
             * @param {String/Function} url (Optional) A string or reference to a Function that
             *            returns a URI string when called
             * @param {Boolean} discardUrl (Optional) If not passed as <tt>false</tt>
             *            the URL of this action becomes the default SRC attribute
             *            for this iframe, and will be subsequently used in future
             *            setSrc calls (emulates autoRefresh by calling setSrc
             *            without params).
             * @param {Function} callback (Optional) A callback function invoked when the
             *            frame document has been fully loaded.
             * @param {Object} scope (Optional) scope by which the callback function is
             *            invoked.
             */
            setSrc : function(url, discardUrl, callback, scope) {
                var src = url || this.src || this.resetUrl;
                var O = this._observable;
                this._unHook();
                Ext.isFunction(callback) && O.addListener('_docload', callback, scope||this, {single:true});
                this.showMask();
                (discardUrl !== true) && (this.src = src);
                var s = this._targetURI = (Ext.isFunction(src) ? src() || '' : src);
                try {
                    this._frameAction = true; // signal listening now
                    this.dom.src = s;
                    this.checkDOM();
                } catch (ex) {
                    O.fireEvent.call(O, 'exception', this, ex);
                }
                return this;
            },

            /**
             * Sets the embedded Iframe location using its replace method. Note: invoke the function with
             * no arguments to refresh the iframe based on the current src value.
             *
             * @param {String/Function} url (Optional) A string or reference to a Function that
             *            returns a URI string when called
             * @param {Boolean} discardUrl (Optional) If not passed as <tt>false</tt>
             *            the URL of this action becomes the default SRC attribute
             *            for this iframe, and will be subsequently used in future
             *            setSrc calls (emulates autoRefresh by calling setSrc
             *            without params).
             * @param {Function} callback (Optional) A callback function invoked when the
             *            frame document has been fully loaded.
             * @param {Object} scope (Optional) scope by which the callback function is
             *            invoked.
             *
             */
            setLocation : function(url, discardUrl, callback, scope) {

                var src = url || this.src || this.resetUrl;
                var O = this._observable;
                this._unHook();
                Ext.isFunction(callback) && O.addListener('_docload', callback, scope||this, {single:true});
                this.showMask();
                var s = this._targetURI = (Ext.isFunction(src) ? src() || '' : src);
                if (discardUrl !== true) {
                    this.src = src;
                }
                try {
                    this._frameAction = true; // signal listening now
                    this.getWindow().location.replace(s);
                    this.checkDOM();
                } catch (ex) {
                    O.fireEvent.call(O,'exception', this, ex);
                }
                return this;
            },

            /**
             * Resets the frame to a neutral (blank document) state without
             * loadMasking.
             *
             * @param {String}
             *            src (Optional) A specific reset string (eg. 'about:blank')
             *            to use for resetting the frame.
             * @param {Function}
             *            callback (Optional) A callback function invoked when the
             *            frame reset is complete.
             * @param {Object}
             *            scope (Optional) scope by which the callback function is
             *            invoked.
             */
            reset : function(src, callback, scope) {

                this._unHook();
                var loadMaskOff = false;
                if(this.loadMask){
                    loadMaskOff = this.loadMask.disabled;
                    this.loadMask.disabled = false;
                }
                this._observable.addListener('_docload',
                  function(frame) {
                    if(frame.loadMask){
                        frame.loadMask.disabled = loadMaskOff;
                    };
                    frame._isReset= false;
                    Ext.isFunction(callback) &&  callback.call(scope || this, frame);
                }, this, {single:true});

                this.hideMask(true);
                this._isReset= true;
                var s = src;
                Ext.isFunction(src) && ( s = src());
                s = this._targetURI = Ext.isEmpty(s, true)? this.resetUrl: s;
                this.getWindow().location.href = s;
                return this;
            },

           /**
            * @private
            * Regular Expression filter pattern for script tag removal.
            * @cfg {regexp} scriptRE script removal RegeXp
            * Default: "/(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/gi"
            */
            scriptRE : /(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/gi,

            /**
             * Write(replacing) string content into the IFrames document structure
             * @param {String} content The new content
             * @param {Boolean} loadScripts
             * (optional) true to also render and process embedded scripts
             * @param {Function} callback (Optional) A callback function invoked when the
             * frame document has been written and fully loaded. @param {Object}
             * scope (Optional) scope by which the callback function is invoked.
             */
            update : function(content, loadScripts, callback, scope) {
                loadScripts = loadScripts || this.getUpdater().loadScripts || false;
                content = Ext.DomHelper.markup(content || '');
                content = loadScripts === true ? content : content.replace(this.scriptRE, "");
                var doc;
                if ((doc = this.getFrameDocument()) && !!content.length) {
                    this._unHook();
                    this.src = null;
                    this.showMask();
                    Ext.isFunction(callback) &&
                        this._observable.addListener('_docload', callback, scope||this, {single:true});
                    this._targetURI = location.href;
                    doc.open();
                    this._frameAction = true;
                    doc.write(content);
                    doc.close();
                    this.checkDOM();
                } else {
                    this.hideMask(true);
                    Ext.isFunction(callback) && callback.call(scope, this);
                }
                return this;
            },
            
            /**
             * Executes a Midas command on the current document, current selection, or the given range.
             * @param {String} command The command string to execute in the frame's document context.
             * @param {Booloean} userInterface (optional) True to enable user interface (if supported by the command)
             * @param {Mixed} value (optional)
             * @param {Boolean} validate If true, the command is validated to ensure it's invocation is permitted.
             * @return {Boolean} indication whether command execution succeeded
             */
            execCommand : function(command, userInterface, value, validate){
               var doc, assert;
               if ((doc = this.getFrameDocument()) && !!command) {
                  try{
                      Ext.isIE && this.getWindow().focus();
	                  assert = validate && Ext.isFunction(doc.queryCommandEnabled) ? 
	                    doc.queryCommandEnabled(command) : true;
                  
                      return assert && doc.execCommand(command, !!userInterface, value);
                  }catch(eex){return false;}
               }
               return false;
                
            },

            /**
             * Sets the current DesignMode attribute of the Frame's document
             * @param {Boolean/String} active True (or "on"), to enable designMode
             * 
             */
            setDesignMode : function(active){
               var doc;
               (doc = this.getFrameDocument()) && 
                 (doc.designMode = (/on|true/i).test(String(active))?'on':'off');
            },
            
            /**
            * Gets this element's Updater
            * 
            * @return {Ext.ux.ManagedIFrame.Updater} The Updater
            */
            getUpdater : function(){
               return this.updateManager || 
                    (this.updateManager = new MIF.Updater(this));
                
            },

            /**
             * Method to retrieve frame's history object.
             * @return {object} or null if permission was denied
             */
            getHistory  : function(){
                var h=null;
                try{ h=this.getWindow().history; }catch(eh){}
                return h;
            },
            
            /**
             * Method to retrieve embedded frame Element objects. Uses simple
             * caching (per frame) to consistently return the same object.
             * Automatically fixes if an object was recreated with the same id via
             * AJAX or DOM.
             *
             * @param {Mixed}
             *            el The id of the node, a DOM Node or an existing Element.
             * @return {Element} The Element object (or null if no matching element
             *         was found)
             */
            get : function(el) {
                var doc = this.getFrameDocument();
                return doc? Ext.get(el, doc) : doc=null;
            },

            /**
             * Gets the globally shared flyweight Element for the frame, with the
             * passed node as the active element. Do not store a reference to this
             * element - the dom node can be overwritten by other code.
             *
             * @param {String/HTMLElement}
             *            el The dom node or id
             * @param {String}
             *            named (optional) Allows for creation of named reusable
             *            flyweights to prevent conflicts (e.g. internally Ext uses
             *            "_internal")
             * @return {Element} The shared Element object (or null if no matching
             *         element was found)
             */
            fly : function(el, named) {
                var doc = this.getFrameDocument();
                return doc ? Ext.fly(el,named, doc) : null;
            },

            /**
             * Return the dom node for the passed string (id), dom node, or
             * Ext.Element relative to the embedded frame document context.
             *
             * @param {Mixed} el
             * @return HTMLElement
             */
            getDom : function(el) {
                var d;
                if (!el || !(d = this.getFrameDocument())) {
                    return (d=null);
                }
                return Ext.getDom(el, d);
            },
            
            /**
             * Creates a {@link Ext.CompositeElement} for child nodes based on the
             * passed CSS selector (the selector should not contain an id).
             *
             * @param {String} selector The CSS selector
             * @param {Boolean} unique (optional) True to create a unique Ext.Element for
             *            each child (defaults to false, which creates a single
             *            shared flyweight object)
             * @return {Ext.CompositeElement/Ext.CompositeElementLite} The composite element
             */
            select : function(selector, unique) {
                var d; return (d = this.getFrameDocument()) ? Ext.Element.select(selector,unique, d) : d=null;
            },

            /**
             * Selects frame document child nodes based on the passed CSS selector
             * (the selector should not contain an id).
             *
             * @param {String} selector The CSS selector
             * @return {Array} An array of the matched nodes
             */
            query : function(selector) {
                var d; return (d = this.getFrameDocument()) ? Ext.DomQuery.select(selector, d): null;
            },
            
            /**
             * Removes a DOM Element from the embedded document
             * @param {Element/String} node The node id or node Element to remove
             */
            removeNode : function( node) {
                
                var dom = n ? n.dom || n : null;
		         if(dom && dom.parentNode && dom.tagName != 'BODY'){
                    
                    if(!dom.ownerDocument || dom.ownerDocument != this.getFrameDocument()){
                        throw 'Invalid document context exception';
                    }
		            var el, docCache = this._domCache;
		            if(docCache && (el = docCache._elCache[dom.id])){
		                //clear out any references from the El.cache(s)
		                el.dom && el.removeAllListeners();
		                delete docCache._elCache[dom.id];
		                delete docCache._dataCache[dom.id];
		                el.dom && (el.dom = null);
		                el = null;
		            }
		            var D;
                    if(this.domWritable()){
			            if(Ext.isIE && !Ext.isIE8){
			                var d = D.createElement('div');
			                d.appendChild(dom);
			                d.removeChild(dom);
			                d = null;  //just dump the scratch DIV reference here.
			            } else {
			                var p = dom.parentNode;
			                p.removeChild(dom);
			                p = null;
			            }
                    }
		          }
		          dom = null;  
            },

            /**
             * @private execScript sandbox and messaging interface
             */ 
            _renderHook : function() {
                this._windowContext = null;
                this.CSS = this.CSS ? this.CSS.destroy() : null;
                this._hooked = false;
                try {
                    if (this.writeScript('(function(){(window.hostMIF = parent.document.getElementById("'
                                    + this.id
                                    + '").ownerCt)._windowContext='
                                    + (Ext.isIE
                                            ? 'window'
                                            : '{eval:function(s){return eval(s);}}')
                                    + ';})()')) {
                        var w;
                        if(w = this.getWindow()){
                            this._frameProxy || (this._frameProxy = this._eventProxy.createDelegate(this));    
                            addListener(w, 'focus', this._frameProxy);
                            addListener(w, 'blur', this._frameProxy);
                            addListener(w, 'resize', this._frameProxy);
                            addListener(w, 'unload', this._frameProxy);
                        }
                        var D = this.getFrameDocument();
                        D && (this.CSS = new CSSInterface(D));
                       
                    }
                } catch (ex) { }
                return this.domWritable();
            },
            
             /** @private : clear all event listeners and Element cache */
            _unHook : function() {
                if (this._hooked) {
                    var id, el, c = this._domCache;
                    for ( id in c ) {
                        el = c[id];
                        el && el.removeAllListeners && el.removeAllListeners();
                        el && (c[id] = el = null);
                        delete c[id];
                    }
                    
                    this._windowContext && (this._windowContext.hostMIF = null);
                    this._windowContext = null;
                
                    var w;
                    if(this._frameProxy && (w = this.getWindow())){
                        removeListener(w, 'focus', this._frameProxy);
                        removeListener(w, 'blur', this._frameProxy);
                        removeListener(w, 'resize', this._frameProxy);
                        removeListener(w, 'unload', this._frameProxy);
                    }
                }
                MIM._flyweights = {};
                this._domCache = null;
                ELD.clearCache && ELD.clearCache(this.id);
                this.CSS = this.CSS ? this.CSS.destroy() : null;
                this._hooked = this._domReady = this._domFired = false;
                
            },
            
            /** @private */
            _windowContext : null,

            /**
             * If sufficient privilege exists, returns the frame's current document
             * as an HTMLElement.
             *
             * @return {HTMLElement} The frame document or false if access to document object was denied.
             */
            getFrameDocument : function() {
                var win = this.getWindow(), doc = null;
                try {
                    doc = (Ext.isIE && win ? win.document : null)
                            || this.dom.contentDocument
                            || window.frames[this.id].document || null;
                } catch (gdEx) {
                    this._domCache = null;
                    ELD.clearCache && ELD.clearCache(this.id);
                    return false; // signifies probable access restriction
                }
                doc = (doc && Ext.isFunction(ELD.getDocument)) ? ELD.getDocument(doc,true) : doc;                 
                if(doc){
                  this._domCache || (this._domCache = ELD.resolveCache ? 
                
                     ELD.resolveCache(doc, this.id) :   
                        {_elCache : {},
                       _dataCache : {},
                           '$_doc': Ext.get(doc,doc)
                    });
                }
                return doc;
            },

            /**
             * Returns the frame's current HTML document object as an
             * {@link Ext.Element}.
             * @return {Ext.Element} The document
             */
            getDoc : function() {
                var D = this.getFrameDocument();
                return Ext.get(D,D); 
            },
            
            /**
             * If sufficient privilege exists, returns the frame's current document
             * body as an HTMLElement.
             *
             * @return {HTMLElement} The frame document body or Null if access to
             *         document object was denied.
             */
            getBody : function() {
                var d;
                return (d = this.getFrameDocument()) ? this.get(d.body || d.documentElement) : null;
            },

            /**
             * Attempt to retrieve the frames current URI via frame's document object
             * @return {string} The frame document's current URI or the last know URI if permission was denied.
             */
            getDocumentURI : function() {
                var URI, d;
                try {
                    URI = this.src && (d = this.getFrameDocument()) ? d.location.href: null;
                } catch (ex) { // will fail on NON-same-origin domains
                }
                return URI || (Ext.isFunction(this.src) ? this.src() : this.src);
                // fallback to last known
            },

           /**
            * Attempt to retrieve the frames current URI via frame's Window object
            * @return {string} The frame document's current URI or the last know URI if permission was denied.
            */
            getWindowURI : function() {
                var URI, w;
                try {
                    URI = (w = this.getWindow()) ? w.location.href : null;
                } catch (ex) {
                } // will fail on NON-same-origin domains
                return URI || (Ext.isFunction(this.src) ? this.src() : this.src);
                // fallback to last known
            },

            /**
             * Returns the frame's current window object.
             *
             * @return {Window} The frame Window object.
             */
            getWindow : function() {
                var dom = this.dom, win = null;
                try {
                    win = dom.contentWindow || window.frames[dom.name] || null;
                } catch (gwEx) {
                }
                return win;
            },
            
            /**
             * Scrolls a frame document's child element into view within the passed container.
             * @param {Mixed} container (optional) The container element to scroll (defaults to the frame's document.body).  Should be a 
             * string (id), dom node, or Ext.Element.
             * @param {Boolean} hscroll (optional) False to disable horizontal scroll (defaults to true)
             * @return {Ext.ux.ManagedIFrame.Element} this 
             */ 
            scrollChildIntoView : function(child, container, hscroll){
                this.fly(child, '_scrollChildIntoView').scrollIntoView(this.getDom(container) || this.getBody().dom, hscroll);
                return this;
            },

            /**
             * Print the contents of the Iframes (if we own the document)
             * @return {Ext.ux.ManagedIFrame.Element} this 
             */
            print : function() {
                try {
                    var win;
                    if( win = this.getWindow()){
                        Ext.isIE && win.focus();
                        win.print();
                    }
                } catch (ex) {
                    throw 'print exception: ' + (ex.description || ex.message || ex);
                }
                return this;
            },

            /**
             * Returns the general DOM modification capability (same-origin status) of the frame. 
             * @return {Boolean} accessible If True, the frame's inner DOM can be manipulated, queried, and
             * Event Listeners set.
             */
            domWritable : function() {
                return !!Ext.isDocument(this.getFrameDocument(),true) //test access
                    && !!this._windowContext;
            },

            /**
             * eval a javascript code block(string) within the context of the
             * Iframes' window object.
             * @param {String} block A valid ('eval'able) script source block.
             * @param {Boolean} useDOM  if true, inserts the function
             * into a dynamic script tag, false does a simple eval on the function
             * definition. (useful for debugging) <p> Note: will only work after a
             * successful iframe.(Updater) update or after same-domain document has
             * been hooked, otherwise an exception is raised.
             * @return {Mixed}  
             */
            execScript : function(block, useDOM) {
                try {
                    if (this.domWritable()) {
                        if (useDOM) {
                            this.writeScript(block);
                        } else {
                            return this._windowContext.eval(block);
                        }
                    } else {
                        throw 'execScript:non-secure context'
                    }
                } catch (ex) {
                    this._observable.fireEvent.call(this._observable,'exception', this, ex);
                    return false;
                }
                return true;
            },

            /**
             * Write a script block into the iframe's document
             * @param {String} block A valid (executable) script source block.
             * @param {object} attributes Additional Script tag attributes to apply to the script
             * Element (for other language specs [vbscript, Javascript] etc.) <p>
             * Note: writeScript will only work after a successful iframe.(Updater)
             * update or after same-domain document has been hooked, otherwise an
             * exception is raised.
             */
            writeScript : function(block, attributes) {
                attributes = Ext.apply({}, attributes || {}, {
                            type : "text/javascript",
                            text : block
                        });
                try {
                    var head, script, doc = this.getFrameDocument();
                    if (doc && typeof doc.getElementsByTagName != 'undefined') {
                        if (!(head = doc.getElementsByTagName("head")[0])) {
                            // some browsers (Webkit, Safari) do not auto-create
                            // head elements during document.write
                            head = doc.createElement("head");
                            doc.getElementsByTagName("html")[0].appendChild(head);
                        }
                        if (head && (script = doc.createElement("script"))) {
                            for (var attrib in attributes) {
                                if (attributes.hasOwnProperty(attrib)
                                        && attrib in script) {
                                    script[attrib] = attributes[attrib];
                                }
                            }
                            return !!head.appendChild(script);
                        }
                    }
                } catch (ex) {
                    this._observable.fireEvent.call(this._observable, 'exception', this, ex);

                }finally{
                    script = head = null;
                }
                return false;
            },

            /**
             * Eval a function definition into the iframe window context.
             * @param {String/Object} fn Name of the function or function map
             * object: {name:'encodeHTML',fn:Ext.util.Format.htmlEncode}
             * @param {Boolean} useDOM  if true, inserts the fn into a dynamic script tag,
             * false does a simple eval on the function definition
             * @param {Boolean} invokeIt if true, the function specified is also executed in the
             * Window context of the frame. Function arguments are not supported.
             * @example <pre><code> var trim = function(s){ return s.replace(/^\s+|\s+$/g,''); }; 
             * iframe.loadFunction('trim');
             * iframe.loadFunction({name:'myTrim',fn:String.prototype.trim || trim});</code></pre>
             */
            loadFunction : function(fn, useDOM, invokeIt) {
                var name = fn.name || fn;
                var fnSrc = fn.fn || window[fn];
                name && fnSrc && this.execScript(name + '=' + fnSrc, useDOM); // fn.toString coercion
                invokeIt && this.execScript(name + '()'); // no args only
            },

            /**
             * @private
             * Evaluate the Iframes readyState/load event to determine its
             * 'load' state, and raise the 'domready/documentloaded' event when
             * applicable.
             */
            loadHandler : function(e, target) {
                var rstatus = (e && typeof e.type !== 'undefined' ? e.type: this.dom.readyState);
                if (this.eventsFollowFrameLinks || this._frameAction ) {
                    
	                switch (rstatus) {
	                    case 'domready' : // MIF
	                    case 'domfail' : // MIF
	                        this._onDocReady (rstatus);
	                        break;
	                    case 'load' : // Gecko, Opera, IE
	                    case 'complete' :
	                        this._onDocLoaded(rstatus);
	                        break;
	                    case 'error':
	                        this._observable.fireEvent.apply(this._observable,['exception', this].concat(arguments));
	                        break;
	                    default :
	                }
                }
                this.frameState = rstatus;
            },

            /**
             * @private
             * @param {String} eventName
             */
            _onDocReady  : function(eventName ){
                var w, obv = this._observable, D;
                //raise internal event regardless of state.
                obv.fireEvent.call( obv,"_docready", eventName , this._domReady , this._domFired);
                
                (D = this.getDoc()) && (D.isReady = true);
                if ( !this._domFired && !this._isReset &&
                     (this._domReady = this._hooked = this._renderHook())) {
                        // Only raise if sandBox injection succeeded (same origin)
                        this._domFired = true;
                        obv.fireEvent.call(obv, eventName, this);
                }
                this.hideMask();
            },

            /**
             * @private
             * @param {String} eventName
             */
            _onDocLoaded  : function(eventName ){
                var obv = this._observable, w;
                
                obv.fireEvent.defer(1, obv,["_docload", this]);
                if(!this._isReset){
                    this._domFired || this._onDocReady('domready');
                    Ext.isIE && (w = this.getWindow()) && w.focus();
                    obv.fireEvent("documentloaded", this);
                }
                this._domFired = this._frameAction =  false;
                this.hideMask(true);

            },

            /**
             * @private
             * Poll the Iframes document structure to determine DOM ready
             * state, and raise the 'domready' event when applicable.
             */
            checkDOM : function( win) {
                if (Ext.isOpera || Ext.isGecko ) { return; }
                // initialise the counter
                var n = 0, manager = this, domReady = false,
                    b, l, d, 
                    max = this.domReadyRetries || 2500, //default max 5 seconds 
                    polling = false,
                    startLocation = (this.getFrameDocument() || {location : {}}).location.href;
                (function() { // DOM polling for IE and others
                    d = manager.getFrameDocument() || {location : {}};
                    // wait for location.href transition
                    polling = (d.location.href !== startLocation || d.location.href === manager._targetURI);
                    if ( manager._domReady) { return;}
                    domReady = polling && ((b = manager.getBody()) && !!(b.dom.innerHTML || '').length) || false;
                    // null href is a 'same-origin' document access violation,
                    // so we assume the DOM is built when the browser updates it
                    if (d.location.href && !domReady && (++n < max)) {
                        setTimeout(arguments.callee, 2); // try again
                        return;
                    }
                    manager.loadHandler({ type : domReady ? 'domready' : 'domfail'});
                })();
            },
            
            /**
            * @private 
            */
            filterEventOptionsRe: /^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate)$/,

           /**
            * @private override to handle synthetic events vs DOM events
            */
            addListener : function(eventName, fn, scope, options){

                if(typeof eventName == "object"){
                    var o = eventName;
                    for(var e in o){
                        if(this.filterEventOptionsRe.test(e)){
                            continue;
                        }
                        if(typeof o[e] == "function"){
                            // shared options
                            this.addListener(e, o[e], o.scope,  o);
                        }else{
                            // individual options
                            this.addListener(e, o[e].fn, o[e].scope, o[e]);
                        }
                    }
                    return;
                }

                if(reSynthEvents.test(eventName)){
                    var O = this._observable; 
                    if(O){
                        O.events[eventName] || (O.addEvents(eventName)); 
                        O.addListener.call(O, eventName, fn, scope || this, options) ;}
                }else {
                    ElFrame.superclass.addListener.call(this, eventName,
                            fn, scope || this, options);
                }
                return this;
            },

            /**
             * @private override
             * Removes an event handler from this element.
             */
            removeListener : function(eventName, fn, scope){
                var O = this._observable;
                if(reSynthEvents.test(eventName)){
                    O && O.removeListener.call(O, eventName, fn, scope || this, options);
                }else {
                  ElFrame.superclass.removeListener.call(this, eventName, fn, scope || this);
              }
              return this;
            },

            /**
             * Removes all previous added listeners from this element
             * @private override
             */
            removeAllListeners : function(){
                Ext.EventManager.removeAll(this.dom);
                var O = this._observable;
                O && O.purgeListeners.call(this._observable);
                return this;
            },
            
            /**
             * Forcefully show the defined loadMask
             * @param {String} msg Mask text to display during the mask operation, defaults to previous defined
             * loadMask config value.
             * @param {String} msgCls The CSS class to apply to the loading message element (defaults to "x-mask-loading")
             * @param {String} maskCls The CSS class to apply to the mask element
             */
            showMask : function(msg, msgCls, maskCls) {
                var lmask = this.loadMask;
                if (lmask && !lmask.disabled && !this._mask){
                    this.mask(msg || lmask.msg, msgCls || lmask.msgCls, maskCls || lmask.maskCls);
                }
            },
            
            /**
             * Hide the defined loadMask 
             * @param {Boolean} forced True to hide the mask regardless of document ready/loaded state.
             */
            hideMask : function(forced) {
                var tlm = this.loadMask;
                if (tlm && !!this._mask){
                    if (forced || (tlm.hideOnReady && this._domReady)) {
                        this.unmask();
                    }
                }
            },
            /**
             * Puts a mask over the FRAME to disable user interaction. Requires core.css.
             * @param {String} msg (optional) A message to display in the mask
             * @param {String} msgCls (optional) A css class to apply to the msg element
             * @param {String} maskCls (optional) A css class to apply to the mask element
             * @return {Element} The mask element
             */
            mask : function(msg, msgCls, maskCls){
                this._mask && this.unmask();
                var p = this.parent('.'+this.cls+'-mask-target') || this.parent();
                if(p.getStyle("position") == "static" && 
                    !p.select('iframe,frame,object,embed').elements.length){
                        p.addClass("x-masked-relative");
                }
                
                p.addClass("x-masked");
                
                this._mask = Ext.DomHelper.append(p, {cls: maskCls || this.cls+"-el-mask"} , true);
                this._mask.setDisplayed(true);
                this._mask._agent = p;
                
                if(typeof msg == 'string'){
                     var delay = (this.loadMask ? this.loadMask.delay : 0) || 10;

                     this._maskMsg = Ext.DomHelper.append(p, {cls: msgCls || this.cls+"-el-mask-msg" , style: {visibility:'hidden'}, cn:{tag:'div', html:msg}}, true);
                     this._maskMsg.setVisibilityMode(Ext.Element.VISIBILITY);
                     (function(){
                       this._mask && 
                        this._maskMsg && 
                          this._maskMsg.center(p).setVisible(true);
                      }).defer(delay,this);
                }
                if(Ext.isIE && !(Ext.isIE7 && Ext.isStrict) && this.getStyle('height') == 'auto'){ // ie will not expand full height automatically
                    this._mask.setSize(undefined, this._mask.getHeight());
                }
                return this._mask;
            },

            /**
             * Removes a previously applied mask.
             */
            unmask : function(){
                
                var a;
                if(this._mask){
                    (a = this._mask._agent) && a.removeClass(["x-masked-relative","x-masked"]);
                    if(this._maskMsg){
                        this._maskMsg.remove();
                        delete this._maskMsg;
                    }
                    this._mask.remove();
                    delete this._mask;
                }
             },

             /**
              * Creates an (frontal) transparent shim agent for the frame.  Used primarily for masking the frame during drag operations.
              * @return {Ext.Element} The new shim element.
              * @param {String} imgUrl Optional Url of image source to use during shimming (defaults to Ext.BLANK_IMAGE_URL).
              * @param {String} shimCls Optional CSS style selector for the shimming agent. (defaults to 'ux-mif-shim' ).
              * @return (HTMLElement} the shim element
              */
             createShim : function(imgUrl, shimCls ){
                 this.shimCls = shimCls || this.shimCls || 'ux-mif-shim';
                 this.shim || (this.shim = this.next('.'+this.shimCls) ||  //already there ?
                  Ext.DomHelper.append(
                     this.dom.parentNode,{
                         tag : 'img',
                         src : imgUrl|| Ext.BLANK_IMAGE_URL,
                         cls : this.shimCls ,
                         galleryimg : "no"
                    }, true)) ;
                 this.shim && (this.shim.autoBoxAdjust = false); 
                 return this.shim;
             },
             
             /**
              * Toggles visibility of the (frontal) transparent shim agent for the frame.  Used primarily for masking the frame during drag operations.
              * @param {Boolean} show Optional True to activate the shim, false to hide the shim agent.
              */
             toggleShim : function(show){
                var shim = this.shim || this.createShim();
                var cls = this.shimCls + '-on';
                !show && shim.removeClass(cls);
                show && !shim.hasClass(cls) && shim.addClass(cls);
             },

            /**
             * Loads this panel's iframe immediately with content returned from an XHR call.
             * @param {Object/String/Function} config A config object containing any of the following options:
             * <pre><code>
             *      frame.load({
             *         url: &quot;your-url.php&quot;,
             *         params: {param1: &quot;foo&quot;, param2: &quot;bar&quot;}, // or encoded string
             *         callback: yourFunction,
             *         scope: yourObject, // optional scope for the callback
             *         discardUrl: false,
             *         nocache: false,
             *         text: &quot;Loading...&quot;,
             *         timeout: 30,
             *         scripts: false,
             *         //optional custom renderer
             *         renderer:{render:function(el, response, updater, callback){....}}  
             *      });
             * </code></pre>
             * The only required property is url. The optional properties
             *            nocache, text and scripts are shorthand for
             *            disableCaching, indicatorText and loadScripts and are used
             *            to set their associated property on this panel Updater
             *            instance.
             * @return {Ext.ManagedIFrame.Element} this
             */
            load : function(loadCfg) {
                var um;
                if (um = this.getUpdater()) {
                    if (loadCfg && loadCfg.renderer) {
                        um.setRenderer(loadCfg.renderer);
                        delete loadCfg.renderer;
                    }
                    um.update.apply(um, arguments);
                }
                return this;
            },

             /** @private
              * Frame document event proxy
              */
             _eventProxy : function(e) {
                 if (!e) return;
                 e = Ext.EventObject.setEvent(e);
                 var be = e.browserEvent || e, er, 
                     args = [e.type, this];
                 
                 if (!be['eventPhase']
                         || (be['eventPhase'] == (be['AT_TARGET'] || 2))) {
                            
                     if(e.type == 'resize'){
	                    var doc = this.getFrameDocument();
	                    doc && (args.push(
	                        { height: ELD.getDocumentHeight(doc), width : ELD.getDocumentWidth(doc) },
	                        { height: ELD.getViewportHeight(doc), width : ELD.getViewportWidth(doc) },
	                        { height: ELD.getViewHeight(false, doc), width : ELD.getViewWidth(false, doc) }
	                      ));  
	                 }
                     
                     er =  this._observable ? 
                           this._observable.fireEvent.apply(this._observable, args.concat(
                              Array.prototype.slice.call(arguments,0))) 
                           : null;
                 }
                 
                 
                 // same-domain unloads should clear ElCache for use with the
                 // next document rendering
                 else if (e.type == 'unload') {
                     this._unHook();
                 }
                 return er;
            },
            
            /**
	         * dispatch a message to the embedded frame-window context (same-origin frames only)
	         * @name sendMessage
	         * @param {Mixed} message The message payload.  The payload can be any supported JS type. 
	         * @param {String} tag Optional reference tag 
	         * @param {String} origin Optional domain designation of the sender (defaults
	         * to document.domain).
	         */
	        sendMessage : function(message, tag, origin) {
	          //(implemented by mifmsg.js )
	        },
            
            /**
	         * Dispatch a cross-document message (per HTML5 specification) if the browser supports it natively.
	         * @name postMessage
	         * @param {String} message Required message payload (String only)
	         * @param {Array} ports Optional array of ports/channels. 
	         * @param {String} origin Optional domain designation of the sender (defaults
	         * to document.domain). 
	         * <p>Notes:  on IE8, this action is synchronous.
	         */
	        postMessage : function(message ,ports ,origin ){
	            //(implemented by mifmsg.js )
	        }

   });
   
    ElFrame = Ext.Element.IFRAME = Ext.Element.FRAME = Ext.ux.ManagedIFrame.Element;
    
    /**
     * Visibility mode constant - Use a classname  to hide element
     * @property Ext.ux.ManagedIFrame.Element.NOSIZE
     * @default 3 (applies CSS rule x-hide-nosize to the Element when hidden)
     * @static
     * @type Number
     */
    ElFrame.NOSIZE = 3;
      
    var fp = ElFrame.prototype;
    /**
     * @ignore
     */
    Ext.override ( ElFrame , {
          
    /**
     * Appends an event handler (shorthand for {@link #addListener}).
     * @param {String} eventName The type of event to handle
     * @param {Function} fn The handler function the event invokes
     * @param {Object} scope (optional) The scope (this element) of the handler function
     * @param {Object} options (optional) An object containing standard {@link #addListener} options
     * @member Ext.Element
     * @method on
     */
        on :  fp.addListener,
        
    /**
     * Removes an event handler from this element (shorthand for {@link #removeListener}).
     * @param {String} eventName the type of event to remove
     * @param {Function} fn the method the event invokes
     * @return {MIF.Element} this
     * @member Ext.Element
     * @method un
     */
        un : fp.removeListener,
        
        getUpdateManager : fp.getUpdater
    });

  /**
   * @class Ext.ux.ManagedIFrame.ComponentAdapter
   * @version 2.0 RC2
   * @author Doug Hendricks. doug[always-At]theactivegroup.com
   * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
   * @copyright 2007-2009, Active Group, Inc.  All rights reserved.
   * @license <a href="http://www.gnu.org/licenses/gpl.html">GPL 3.0</a>
   * @constructor
   * @desc
   * Abstract class.  This class should not be instantiated.
   */
  
   Ext.ux.ManagedIFrame.ComponentAdapter = function(){}; 
   Ext.ux.ManagedIFrame.ComponentAdapter.prototype = {
       
        /** @property */
        version : 2.0,
        
        /**
         * @cfg {String} defaultSrc the default src property assigned to the Managed Frame when the component is rendered.
         * @default null
         */
        defaultSrc : null,
        
        /**
         * @cfg {String} unsupportedText Text to display when the IFRAMES/FRAMESETS are disabled by the browser.
         *
         */
        unsupportedText : 'Inline frames are NOT enabled\/supported by your browser.',
        
        hideMode   : !Ext.isIE ? 'nosize' : 'display',
        
        animCollapse  : Ext.isIE ,

        animFloat  : Ext.isIE ,
        
        /**
         * @cfg {object} frameConfig Frames DOM configuratio options
         *
         */
        frameConfig  : null,
        
        /**
         * @property {Object} frameEl An {@link Ext.ux.ManagedIFrame.Element} reference to rendered frame Element.
         */
        frameEl : null, 
  
        /**
         * @cfg {Boolean} useShim
         * True to use to create a transparent shimming agent for use in masking the frame during
         * drag operations.
         * @default false
         */
        useShim   : false,

        /**
         * @cfg {Boolean} autoScroll
         * True to use overflow:'auto' on the frame element and show scroll bars automatically when necessary,
         * false to clip any overflowing content (defaults to true).
         * @default true
         */
        autoScroll: true,
        
        /** @private */
        getId : function(){
             return this.id   || (this.id = "mif-comp-" + (++Ext.Component.AUTO_ID));
        },
        
        stateEvents : ['documentloaded'],
        
        stateful    : false,
        
        /**
         * Sets the autoScroll state for the frame.
         * @param {Boolean} auto True to set overflow:auto on the frame, false for overflow:hidden
         */
        setAutoScroll : function(auto){
            var scroll = Ext.value(auto,this.autoScroll===true);
            this.rendered && this.getFrame() &&  
                this.frameEl.setOverflow(scroll?'auto':'hidden');
        },
        
        /**
         * Returns the Ext.ux.ManagedIFrame.Element of the frame.
         * @return {Ext.ux.ManagedIFrame.Element} this.frameEl 
         */
        getFrame : function(){
             if(this.rendered){
                if(this.frameEl){ return this.frameEl;}
                var f = this.items && this.items.first ? this.items.first() : null;
                f && (this.frameEl = f.frameEl);
                return this.frameEl;
             }
             return null;
            },
        
        /**
         * Returns the frame's current window object.
         *
         * @return {Window} The frame Window object.
         */
        getFrameWindow : function() {
            return this.getFrame() ? this.frameEl.getWindow() : null;
        },

        /**
         * If sufficient privilege exists, returns the frame's current document
         * as an HTMLElement.
         *
         * @return {HTMLElement} The frame document or false if access to
         *         document object was denied.
         */
        getFrameDocument : function() {
            return this.getFrame() ? this.frameEl.getFrameDocument() : null;
        },

        /**
         * Get the embedded iframe's document as an Ext.Element.
         *
         * @return {Ext.Element object} or null if unavailable
         */
        getFrameDoc : function() {
            return this.getFrame() ? this.frameEl.getDoc() : null;
        },

        /**
         * If sufficient privilege exists, returns the frame's current document
         * body as an HTMLElement.
         *
         * @return {Ext.Element} The frame document body or Null if access to
         *         document object was denied.
         */
        getFrameBody : function() {
            return this.getFrame() ? this.frameEl.getBody() : null;
        },
        
        /**
         * Reset the embedded frame to a neutral domain state and clear its contents
          * @param {String}src (Optional) A specific reset string (eg. 'about:blank')
         *            to use for resetting the frame.
         * @param {Function} callback (Optional) A callback function invoked when the
         *            frame reset is complete.
         * @param {Object} scope (Optional) scope by which the callback function is
         *            invoked.
         * @return {Ext.ux.ManagedIFrame.Component} this
         */
        resetFrame : function() {
            this.getFrame() && this.frameEl.reset.apply(this.frameEl, arguments);
            return this;
        },
        
        /**
         * Loads the Components frame with the response from a form submit to the 
         * specified URL with the ManagedIframe.Element as it's submit target.
         * @param {Object} submitCfg A config object containing any of the following options:
         * <pre><code>
         *      mifPanel.submitAsTarget({
         *         form : formPanel.form,  //optional Ext.FormPanel, Ext form element, or HTMLFormElement
         *         url: &quot;your-url.php&quot;,
         *         params: {param1: &quot;foo&quot;, param2: &quot;bar&quot;}, // or a URL encoded string
         *         callback: yourFunction,  //optional
         *         scope: yourObject, // optional scope for the callback
         *         method: 'POST', //optional form.action (default:'POST')
         *         encoding : "multipart/form-data" //optional, default HTMLForm default
         *      });
         *
         * </code></pre>
         *
         * @return {Ext.ux.ManagedIFrame.Component]} this
         */
        submitAsTarget  : function(submitCfg){
            this.getFrame() && this.frameEl.submitAsTarget.apply(this.frameEl, arguments);
            return this;
        },
        
        /**
         * Loads this Components's frame immediately with content returned from an
         * XHR call.
         *
         * @param {Object/String/Function} loadCfg A config object containing any of the following
         *            options:
         *
         * <pre><code>
         *      mifPanel.load({
         *         url: &quot;your-url.php&quot;,
         *         params: {param1: &quot;foo&quot;, param2: &quot;bar&quot;}, // or a URL encoded string
         *         callback: yourFunction,
         *         scope: yourObject, // optional scope for the callback
         *         discardUrl: false,
         *         nocache: false,
         *         text: &quot;Loading...&quot;,
         *         timeout: 30,
         *         scripts: false,
         *         renderer:{render:function(el, response, updater, callback){....}}  //optional custom renderer
         *      });
         *
         * </code></pre>
         *
         * The only required property is url. The optional properties
         *            nocache, text and scripts are shorthand for
         *            disableCaching, indicatorText and loadScripts and are used
         *            to set their associated property on this panel Updater
         *            instance.
         * @return {Ext.ux.ManagedIFrame.Component]} this
         */
        load : function(loadCfg) {
            this.getFrame() && this.resetFrame(null, 
              this.frameEl.load.createDelegate(this.frameEl,arguments) );
            return this;
        },

        /** @private */
        doAutoLoad : function() {
            this.autoLoad && this.load(typeof this.autoLoad == 'object' ? 
                this.autoLoad : { url : this.autoLoad });
        },

        /**
         * Get the {@link Ext.Updater} for this panel's iframe. Enables
         * Ajax-based document replacement of this panel's iframe document.
         *
         * @return {Ext.ux.ManagedIFrame.Updater} The Updater
         */
        getUpdater : function() {
            return this.getFrame() ? this.frameEl.getUpdater() : null;
        },
        
        /**
         * Sets the embedded Iframe src property. Note: invoke the function with
         * no arguments to refresh the iframe based on the current src value.
         *
         * @param {String/Function} url (Optional) A string or reference to a Function that
         *            returns a URI string when called
         * @param {Boolean} discardUrl (Optional) If not passed as <tt>false</tt>
         *            the URL of this action becomes the default SRC attribute
         *            for this iframe, and will be subsequently used in future
         *            setSrc calls (emulates autoRefresh by calling setSrc
         *            without params).
         * @param {Function} callback (Optional) A callback function invoked when the
         *            frame document has been fully loaded.
         * @param {Object} scope (Optional) scope by which the callback function is
         *            invoked.
         */
        setSrc : function(url, discardUrl, callback, scope) {
            this.getFrame() && this.frameEl.setSrc.apply(this.frameEl, arguments);
            return this;
        },

        /**
         * Sets the embedded Iframe location using its replace method. Note: invoke the function with
         * no arguments to refresh the iframe based on the current src value.
         *
         * @param {String/Function} url (Optional) A string or reference to a Function that
         *            returns a URI string when called
         * @param {Boolean} discardUrl (Optional) If not passed as <tt>false</tt>
         *            the URL of this action becomes the default SRC attribute
         *            for this iframe, and will be subsequently used in future
         *            setSrc calls (emulates autoRefresh by calling setSrc
         *            without params).
         * @param {Function} callback (Optional) A callback function invoked when the
         *            frame document has been fully loaded.
         * @param {Object} scope (Optional) scope by which the callback function is
         *            invoked.
         */
        setLocation : function(url, discardUrl, callback, scope) {
           this.getFrame() && this.frameEl.setLocation.apply(this.frameEl, arguments);
           return this;
        },

        /**
         * @private //Make it state-aware
         */
        getState : function() {
            var URI = this.getFrame() ? this.frameEl.getDocumentURI() || null : null;
            var state = Ext.BoxComponent.superclass.getState.call(this);
            URI && (state = Ext.apply(state || {}, {defaultSrc : Ext.isFunction(URI) ? URI() : URI }));
            return state;
        },
        
        /**
         * @private
         */
        setMIFEvents : function(){
            
            this.addEvents(

                    /**
                     * Fires when the iFrame has reached a loaded/complete state.
                     * @event documentloaded
                     * @memberOf Ext.ux.ManagedIFrame.ComponentAdapter
                     * @param {Ext.ux.ManagedIFrame.Element} this.frameEl
                     */
                    'documentloaded',  
                      
                    /**
                     * Fires ONLY when an iFrame's Document(DOM) has reach a
                     * state where the DOM may be manipulated (ie same domain policy)
                     * Note: This event is only available when overwriting the iframe
                     * document using the update method and to pages retrieved from a "same
                     * domain". Returning false from the eventHandler stops further event
                     * (documentloaded) processing.
                     * @event domready 
                     * @memberOf Ext.ux.ManagedIFrame.ComponentAdapter
                     * @param {Ext.ux.ManagedIFrame.Element} this.frameEl
                     */
                    'domready',
                    /**
                     * Fires when the frame actions raise an error
                     * @event exception
                     * @memberOf Ext.ux.ManagedIFrame.ComponentAdapter
                     * @param {Ext.ux.MIF.Element} this.frameEl
                     * @param {Error/string} exception
                     */
                    'exception',

                    /**
                     * Fires upon receipt of a message generated by window.sendMessage
                     * method of the embedded Iframe.window object
                     * @event message
                     * @memberOf Ext.ux.ManagedIFrame.ComponentAdapter
                     * @param {Ext.ux.ManagedIFrame.Element} this.frameEl
                     * @param {object}
                     *            message (members: type: {string} literal "message", data
                     *            {Mixed} [the message payload], domain [the document domain
                     *            from which the message originated ], uri {string} the
                     *            document URI of the message sender source (Object) the
                     *            window context of the message sender tag {string} optional
                     *            reference tag sent by the message sender
                     * <p>Alternate event handler syntax for message:tag filtering Fires upon
                     * receipt of a message generated by window.sendMessage method which
                     * includes a specific tag value of the embedded Iframe.window object
                     *
                     */
                    'message',

                    /**
                     * Fires when the frame is blurred (loses focus).
                     * @event blur
                     * @memberOf Ext.ux.ManagedIFrame.ComponentAdapter
                     * @param {Ext.ux.ManagedIFrame.Element} this.frameEl
                     * @param {Ext.Event}
                     *            Note: This event is only available when overwriting the
                     *            iframe document using the update method and to pages
                     *            retrieved from a "same domain". Returning false from the
                     *            eventHandler [MAY] NOT cancel the event, as this event is
                     *            NOT ALWAYS cancellable in all browsers.
                     */
                    'blur',

                    /**
                     * Fires when the frame gets focus. Note: This event is only available
                     * when overwriting the iframe document using the update method and to
                     * pages retrieved from a "same domain". Returning false from the
                     * eventHandler [MAY] NOT cancel the event, as this event is NOT ALWAYS
                     * cancellable in all browsers.
                     * @event focus
                     * @memberOf Ext.ux.ManagedIFrame.ComponentAdapter
                     * @param {Ext.ux.ManagedIFrame.Element} this.frameEl
                     * @param {Ext.Event}
                     *
                    */
                    'focus',
                    
                    /**
                     * Fires when the frames window is resized. Note: This event is only available
                     * when overwriting the iframe document using the update method and to
                     * pages retrieved from a "same domain". 
                     * @event resize
                     * @memberOf Ext.ux.ManagedIFrame.ComponentAdapter
                     * @param {Ext.ux.ManagedIFrame.Element} this.frameEl
                     * @param {Ext.Event} e
                     * @param {Object} documentSize A height/width object signifying the new document size
                     * @param {Object} viewPortSize A height/width object signifying the size of the frame's viewport
                     * @param {Object} viewSize A height/width object signifying the size of the frame's view
                     *
                    */
                    'resize',
                    
                    /**
                     * Fires when(if) the frames window object raises the unload event
                     * Note: This event is only available when overwriting the iframe
                     * document using the update method and to pages retrieved from a "same-origin"
                     * domain. Note: Opera does not raise this event.
                     * @event unload 
                     * @memberOf Ext.ux.ManagedIFrame.ComponentAdapter
                     * @param {Ext.ux.ManagedIFrame.Element} this.frameEl
                     * @param {Ext.Event}
                     */
                    'unload'
                );
        },
        
        /**
         * dispatch a message to the embedded frame-window context (same-origin frames only)
         * @name sendMessage
         * @memberOf Ext.ux.ManagedIFrame.Element
         * @param {Mixed} message The message payload.  The payload can be any supported JS type. 
         * @param {String} tag Optional reference tag 
         * @param {String} origin Optional domain designation of the sender (defaults
         * to document.domain).
         */
        sendMessage : function(message, tag, origin) {
       
          //(implemented by mifmsg.js )
        }
   };
   
   /*
    * end Adapter
    */
   
  /**
   * @class Ext.ux.ManagedIFrame.Component
   * @extends Ext.BoxComponent
   * @version 2.0 RC2
   * @author Doug Hendricks. doug[always-At]theactivegroup.com
   * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
   * @copyright 2007-2009, Active Group, Inc.  All rights reserved.
   * @license <a href="http://www.gnu.org/licenses/gpl.html">GPL 3.0</a>
   * @constructor
   * @base Ext.ux.ManagedIFrame.ComponentAdapter
   * @param {Object} config The config object
   */
  Ext.ux.ManagedIFrame.Component = Ext.extend(Ext.BoxComponent , { 
            
            ctype     : "Ext.ux.ManagedIFrame.Component",
            
            //TODO: autoScroll :  true,
            
            /** @private */
            initComponent : function() {
                var C = {
	                monitorResize : this.monitorResize || (this.monitorResize = !!this.fitToParent),
	                plugins : (this.plugins ||[]).concat(
	                    this.hideMode === 'nosize' && Ext.ux.plugin.VisibilityMode ? 
		                    [new Ext.ux.plugin.VisibilityMode(
		                        {hideMode :'nosize',
		                         elements : ['bwrap']
		                        })] : [] )
                  };
                  
                MIF.Component.superclass.initComponent.call(
                  Ext.apply(this,
                    Ext.apply(this.initialConfig, C)
                    ));
                    
                this.setMIFEvents();
            },   

            /** @private */
            onRender : function(){
                //create a wrapper DIV if the component is not targeted
                this.el || (this.autoEl = {});
                MIF.Component.superclass.onRender.apply(this, arguments);
                var frCfg = this.frameCfg || this.frameConfig || {};
                 //backward compatability with MIF 1.x
                var frDOM = frCfg.autoCreate || frCfg;
                frDOM = Ext.apply({tag  : 'iframe', id: Ext.id()}, frDOM ,
                       Ext.isIE && Ext.isSecure ? {src : Ext.SSL_SECURE_URL} : false);
                var frame = this.el.child('iframe',true) || this.el.child('frame',true);
                frame || this.el.createChild([ 
                        Ext.apply({
                                name : frDOM.id,
                                frameborder : 0
                               }, frDOM ),
                         {tag: 'noframes', html : this.unsupportedText || null}
                        ]);
                frame || (frame = this.el.child('iframe',true) || this.el.child('frame',true));  
                var F;
                if( F = this.frameEl = (!!frame ? new MIF.Element(frame, true): null)){
                    
                    F.ownerCt = (this.relayTarget || this);
                    if ( this.loadMask) {
                            //resolve possible maskEl by Element name eg. 'body', 'bwrap', 'actionEl'
                            var mEl = this.loadMask.maskEl || 'x-panel-bwrap';
                            F.loadMask = Ext.apply({
                                        disabled : false,
                                        hideOnReady : false,
                                        msgCls : 'ext-el-mask-msg x-mask-loading',
                                        maskCls : 'ext-el-mask'
                                    },
                                    {
                                      maskEl : Ext.get( this[mEl] || F.parent('.' + mEl) || mEl || this.el) 
                                    },
                                    this.loadMask);
                                    
                            F.cls && F.loadMask.maskEl && F.loadMask.maskEl.addClass(F.cls + '-mask-target');
                    }
                    
                    F.disableMessaging = Ext.value(frCfg.disableMessaging, true);
                    
                    F._observable && 
                        (this.relayTarget || this).relayEvents(F._observable, frameEvents.concat(this._msgTagHandlers || []));
                        
                    
                    // Set the Visibility Mode for the iframe
                    // collapse/expands/hide/show
                    F.setVisibilityMode(
                        (this.hideMode ? El[this.hideMode.toUpperCase()] : null) 
                        || ElFrame.NOSIZE);

                    if(this.defaultSrc){
                        F.setSrc (this.defaultSrc);
                    } else if(this.html) {
                        var me= this;
                        F.reset(null, function(frame){
                            this.update(me.html);
                            delete me.html;
                        },F);
                    } else {
                        F.reset();
                    }
                 }
                 
            },
            
            /** @private */
            afterRender  : function(container) {
                MIF.Component.superclass.afterRender.apply(this,arguments);
                // only resize (to Parent) if the panel is NOT in a layout.
                // parentNode should have {style:overflow:hidden;} applied.
                if (this.fitToParent && !this.ownerCt) {
                    var pos = this.getPosition(), size = (Ext.get(this.fitToParent)
                            || this.getEl().parent()).getViewSize();
                    this.setSize(size.width - pos[0], size.height - pos[1]);
                }
                this.setAutoScroll();
               /* Enable auto-Shims if the Component participates in (nested?)
                * border layout.
                * Setup event handlers on the SplitBars and region panels to enable the frame
                * shims when needed
                */
                if(this.frameEl){
                    var ownerCt = this.ownerCt;
                    while (ownerCt) {
                        ownerCt.on('afterlayout', function(container, layout) {
                            Ext.each(['north', 'south', 'east', 'west'],
                                    function(region) {
                                        var reg;
                                        if ((reg = layout[region]) && reg.split && !reg._splitTrapped) {
                                            reg.split.on('beforeresize',MIM.showShims, MIM);
                                            reg.panel.on('resize', MIM.hideShims, MIM, {delay:1});
                                            reg._splitTrapped = MIM._splitTrapped = true;
                                        }
                            }, this);
                        }, this, { single : true}); // and discard
                        ownerCt = ownerCt.ownerCt; // nested layouts?
                    }
                    /*
                     * Create an img shim if the component participates in a layout or forced
                     */
                    if(!!this.ownerCt || this.useShim ){ this.shim = this.frameEl.createShim(); }
                    this.getUpdater().showLoadIndicator = this.showLoadIndicator || false;
                    this.doAutoLoad();
                }
            },
            
            /** @private */
            beforeDestroy : function() {
                this.rendered && Ext.each(['frameEl', 'shim'],
                           function(elName) {
                                if (this[elName]) {
                                    Ext.destroy(this[elName]);
                                    El.uncache(this[elName]);
                                    this[elName] = null;
                                    delete this[elName];
                                }
                }, this);
                MIF.Component.superclass.beforeDestroy.call(this);
            }
    });

    Ext.override(MIF.Component, MIF.ComponentAdapter.prototype);
    Ext.reg('mif', MIF.Component);
   
    /*
    * end Component
    */
    
  /**
   * @class Ext.ux.ManagedIFrame.Panel
   * @extends Ext.Panel
   * @version 2.0 RC2
   * @author Doug Hendricks. doug[always-At]theactivegroup.com
   * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
   * @copyright 2007-2009, Active Group, Inc.  All rights reserved.
   * @license <a href="http://www.gnu.org/licenses/gpl.html">GPL 3.0</a>
   * @constructor
   * @base Ext.ux.ManagedIFrame.ComponentAdapter
   * @param {Object} config The config object
   */

  Ext.ux.ManagedIFrame.Panel = Ext.extend( Ext.Panel , {
        ctype       : "Ext.ux.ManagedIFrame.Panel",
        constructor : function(config){
            config || (config={});
            config.layout = 'fit';
            config.items = {
                     xtype    : 'mif',
                    useShim   : true,
                   autoScroll : config.autoScroll || this.autoScroll,
                  defaultSrc  : config.defaultSrc || this.defaultSrc,
                        html  : config.html || this.html,
                    loadMask  : config.loadMask || this.loadMask,
                  frameConfig : config.frameConfig || config.frameCfg || this.frameConfig,
                  relayTarget : this  //direct relay of events to the parent component
                };
            delete config.html;                    
            MIF.Panel.superclass.constructor.call(this,config);
          },
          /** @private */
          initComponent : function() {
                MIF.Panel.superclass.initComponent.call(this);
                this.setMIFEvents();
          }   
  });
  
  Ext.override(MIF.Panel, MIF.ComponentAdapter.prototype);
  Ext.reg('iframepanel', MIF.Panel);
    /*
    * end Panel
    */

    /**
     * @class Ext.ux.ManagedIFrame.Portlet
     * @extends Ext.ux.ManagedIFrame.Panel
     * @version 2.0 RC2
     * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
     * @license <a href="http://www.gnu.org/licenses/gpl.html">GPL 3.0</a> 
     * @author Doug Hendricks. Forum ID: <a href="http://extjs.com/forum/member.php?u=8730">hendricd</a> 
     * @copyright 2007-2009, Active Group, Inc. All rights reserved.
     * @constructor Create a new Ext.ux.ManagedIFramePortlet 
     * @param {Object} config The config object
     */

    Ext.ux.ManagedIFrame.Portlet = Ext.extend(Ext.ux.ManagedIFrame.Panel, {
                ctype      : "Ext.ux.ManagedIFrame.Portlet",
                anchor     : '100%',
                frame      : true,
                collapseEl : 'bwrap',
                collapsible: true,
                draggable  : true,
                cls        : 'x-portlet'
            });
            
    Ext.reg('iframeportlet', MIF.Portlet);
   /*
    * end Portlet
    */
    
  /**
   * @class Ext.ux.ManagedIFrame.Window
   * @extends Ext.Window
   * @version 2.0 RC2
   * @author Doug Hendricks. 
   * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
   * @copyright 2007-2009, Active Group, Inc.  All rights reserved.
   * @license <a href="http://www.gnu.org/licenses/gpl.html">GPL 3.0</a>
   * @constructor
   * @base Ext.ux.ManagedIFrame.ComponentAdapter
   * @param {Object} config The config object
   */
    
  Ext.ux.ManagedIFrame.Window = Ext.extend( Ext.Window , 
       {
            ctype       : "Ext.ux.ManagedIFrame.Window",
            constructor : function(config){
			    config || (config={});
			    config.layout = 'fit';
			    config.items = {
			             xtype    : 'mif',
			            useShim   : true,
			          autoScroll  : config.autoScroll || this.autoScroll,
                      defaultSrc  : config.defaultSrc || this.defaultSrc,
                            html  : config.html || this.html,
                        loadMask  : config.loadMask || this.loadMask,
                      frameConfig : config.frameConfig || config.frameCfg || this.frameConfig,
			          relayTarget : this  //direct relay of events to the parent component
			        };
			    delete config.html;                    
			    MIF.Window.superclass.constructor.call(this,config);
            },
            initComponent : function() {
                Ext.ux.ManagedIFrame.Window.superclass.initComponent.call(this);
                this.setMIFEvents();
            }
    });
    Ext.override(MIF.Window, MIF.ComponentAdapter.prototype);
    Ext.reg('iframewindow', MIF.Window);
    
    /*
    * end Window
    */
    
    /**
     * @class Ext.ux.ManagedIFrame.Updater
     * @extends Ext.Updater
     * @constructor
     * @param {String/Object} el The element to bind the Updater instance to.
     */
    Ext.ux.ManagedIFrame.Updater = Ext.extend(Ext.Updater, {
    
       /**
         * Display the element's "loading" state. By default, the element is updated with {@link #indicatorText}. This
         * method may be overridden to perform a custom action while this Updater is actively updating its contents.
         */
        showLoading : function(){
            this.showLoadIndicator && this.el && this.el.mask(this.indicatorText);
            
        },
        
        /**
         * Hide the Frames masking agent.
         */
        hideLoading : function(){
            this.showLoadIndicator && this.el && this.el.unmask();
        },
        
        // private
        updateComplete : function(response){
            MIF.Updater.superclass.updateComplete.apply(this,arguments);
            this.hideLoading();
        },
    
        // private
        processFailure : function(response){
            MIF.Updater.superclass.processFailure.apply(this,arguments);
            this.hideLoading();
        }
        
    }); 
    
    /** @private
     * Stylesheet Frame interface object
     */
    var styleCamelRe = /(-[a-z])/gi;
    var styleCamelFn = function(m, a) {
        return a.charAt(1).toUpperCase();
    };
    /** @private */
    var CSSInterface = function(hostDocument) {
        var doc;
        if (hostDocument) {
            doc = hostDocument;
            return {
                rules : null,
                /** @private */
                destroy  :  function(){  return doc = null; },

                /**
                 * Creates a stylesheet from a text blob of rules. These rules
                 * will be wrapped in a STYLE tag and appended to the HEAD of
                 * the document.
                 *
                 * @param {String}
                 *            cssText The text containing the css rules
                 * @param {String}
                 *            id An id to add to the stylesheet for later
                 *            removal
                 * @return {StyleSheet}
                 */
                createStyleSheet : function(cssText, id) {
                    var ss;
                    if (!doc)return;
                    var head = doc.getElementsByTagName("head")[0];
                    var rules = doc.createElement("style");
                    rules.setAttribute("type", "text/css");
                    id && rules.setAttribute("id", id);

                    if (Ext.isIE) {
                        head.appendChild(rules);
                        ss = rules.styleSheet;
                        ss.cssText = cssText;
                    } else {
                        try {
                            rules.appendChild(doc.createTextNode(cssText));
                        } catch (e) {
                            rules.cssText = cssText;
                        }
                        head.appendChild(rules);
                        ss = rules.styleSheet
                                ? rules.styleSheet
                                : (rules.sheet || doc.styleSheets[doc.styleSheets.length - 1]);
                    }
                    this.cacheStyleSheet(ss);
                    return ss;
                },

                /**
                 * Removes a style or link tag by id
                 *
                 * @param {String}
                 *            id The id of the tag
                 */
                removeStyleSheet : function(id) {

                    if (!doc || !id)return;
                    var existing = doc.getElementById(id);
                    if (existing) {
                        existing.parentNode.removeChild(existing);
                    }
                },

                /**
                 * Dynamically swaps an existing stylesheet reference for a new
                 * one
                 *
                 * @param {String}
                 *            id The id of an existing link tag to remove
                 * @param {String}
                 *            url The href of the new stylesheet to include
                 */
                swapStyleSheet : function(id, url) {
                    if (!doc)return;
                    this.removeStyleSheet(id);
                    var ss = doc.createElement("link");
                    ss.setAttribute("rel", "stylesheet");
                    ss.setAttribute("type", "text/css");
                    Ext.isString(id) && ss.setAttribute("id", id);
                    ss.setAttribute("href", url);
                    doc.getElementsByTagName("head")[0].appendChild(ss);
                },

                /**
                 * Refresh the rule cache if you have dynamically added
                 * stylesheets
                 *
                 * @return {Object} An object (hash) of rules indexed by
                 *         selector
                 */
                refreshCache : function() {
                    return this.getRules(true);
                },

                // private
                cacheStyleSheet : function(ss) {
                    this.rules || (this.rules = {});
                    
                    try {// try catch for cross domain access issue
                        var ssRules = ss.cssRules || ss.rules;
                        for (var j = ssRules.length - 1; j >= 0; --j) {
                          ssRules[j].selectorText &&
                            (this.rules[ssRules[j].selectorText.toLowerCase()] = ssRules[j]);
                        }
                    } catch (e) {}
                },

                /**
                 * Gets all css rules for the document
                 *
                 * @param {Boolean}
                 *            refreshCache true to refresh the internal cache
                 * @return {Object} An object (hash) of rules indexed by
                 *         selector
                 */
                getRules : function(refreshCache) {
                    if (!this.rules || refreshCache) {
                        this.rules = {};
                        if (doc) {
                            var ds = doc.styleSheets;
                            for (var i = 0, len = ds.length; i < len; i++) {
                                try {
                                    this.cacheStyleSheet(ds[i]);
                                } catch (e) {}
                            }
                        }
                    }
                    return this.rules;
                },

                /**
                 * Gets an an individual CSS rule by selector(s)
                 *
                 * @param {String/Array}
                 *            selector The CSS selector or an array of selectors
                 *            to try. The first selector that is found is
                 *            returned.
                 * @param {Boolean}
                 *            refreshCache true to refresh the internal cache if
                 *            you have recently updated any rules or added
                 *            styles dynamically
                 * @return {CSSRule} The CSS rule or null if one is not found
                 */
                getRule : function(selector, refreshCache) {
                    var rs = this.getRules(refreshCache);
                    if (!Ext.isArray(selector)) {
                        return rs[selector.toLowerCase()];
                    }
                    for (var i = 0; i < selector.length; i++) {
                        if (rs[selector[i]]) {
                            return rs[selector[i].toLowerCase()];
                        }
                    }
                    return null;
                },

                /**
                 * Updates a rule property
                 *
                 * @param {String/Array}
                 *            selector If it's an array it tries each selector
                 *            until it finds one. Stops immediately once one is
                 *            found.
                 * @param {String}
                 *            property The css property
                 * @param {String}
                 *            value The new value for the property
                 * @return {Boolean} true If a rule was found and updated
                 */
                updateRule : function(selector, property, value) {
                    if (!Ext.isArray(selector)) {
                        var rule = this.getRule(selector);
                        if (rule) {
                            rule.style[property.replace(styleCamelRe, styleCamelFn)] = value;
                            return true;
                        }
                    } else {
                        for (var i = 0; i < selector.length; i++) {
                            if (this.updateRule(selector[i], property, value)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
            };
        }
    };

    /**
     * @class Ext.ux.ManagedIFrame.Manager
     * @version 2.0 RC1
	 * @author Doug Hendricks. doug[always-At]theactivegroup.com
	 * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
	 * @copyright 2007-2009, Active Group, Inc.  All rights reserved.
	 * @license <a href="http://www.gnu.org/licenses/gpl.html">GPL 3.0</a>
	 * @singleton
     */
    Ext.ux.ManagedIFrame.Manager = function() {
        var frames = {};
        var implementation = {
            // private DOMFrameContentLoaded handler for browsers (Gecko, Webkit) that support it.
            _GeckoFrameReadyHandler : function(e) {
                try {
                    var $frame ;
                    if ($frame = e.target.ownerCt){
                        $frame.loadHandler.call($frame,{type : 'domready'});
                    }

                } catch (rhEx) {} //nested iframes will throw when accessing target.id
            },
            /**
             * @cfg {String} shimCls
             * @default "ux-mif-shim"
             * The default CSS rule applied to MIF image shims to toggle their visibility.
             */
            shimCls : 'ux-mif-shim',

            /** @private */
            register : function(frame) {
                frame.manager = this;
                frames[frame.id] = frames[frame.name] = {ref : frame };
                return frame;
            },
            /** @private */
            deRegister : function(frame) {
                delete frames[frame.id];
                delete frames[frame.name];
                
            },
            /**
             * Toggles the built-in MIF shim off on all visible MIFs
             * @methodOf Ext.ux.MIF.Manager
             *
             */
            hideShims : function() {
                this.shimsApplied && Ext.select('.' + this.shimCls, true).removeClass(this.shimCls+ '-on');
                this.shimsApplied = false;
            },

            /**
             * Shim ALL MIFs (eg. when a region-layout.splitter is on the move or before start of a drag operation)
             * @methodOf Ext.ux.MIF.Manager
             */
            showShims : function() {
                !this.shimsApplied && Ext.select('.' + this.shimCls, true).addClass(this.shimCls+ '-on');
                this.shimsApplied = true;
            },

            /**
             * Retrieve a MIF instance by its DOM ID
             * @methodOf Ext.ux.MIF.Manager
             * @param {Ext.ux.MIF/string} id
             */
            getFrameById : function(id) {
                return typeof id == 'string' ? (frames[id] ? frames[id].ref
                        || null : null) : null;
            },

            /**
             * Retrieve a MIF instance by its DOM name
             * @methodOf Ext.ux.MIF.Manager
             * @param {Ext.ux.MIF/string} name
             */
            getFrameByName : function(name) {
                return this.getFrameById(name);
            },

            /** @private */
            // retrieve the internal frameCache object
            getFrameHash : function(frame) {
                return frames[frame.id] || frames[frame.id] || null;
            },

            /** @private */
            _flyweights : {},

            /** @private */
            destroy : function() {
                if (document.addEventListener) {
                      window.removeEventListener("DOMFrameContentLoaded", this._GeckoFrameReadyHandler , true);
                }
                delete this._flyweights;
            }
        };
        // for Gecko and Opera and any who might support it later 
        document.addEventListener && 
            window.addEventListener("DOMFrameContentLoaded", implementation._GeckoFrameReadyHandler , true);

        Ext.EventManager.on(window, 'beforeunload', implementation.destroy,implementation);
        return implementation;
    }();
    
    MIM = MIF.Manager;
    MIM.showDragMask = MIM.showShims;
    MIM.hideDragMask = MIM.hideShims;

    //Previous release compatibility
    Ext.ux.ManagedIFramePanel = MIF.Panel;
    Ext.ux.ManagedIFramePortlet = MIF.Portlet;
    Ext.ux.ManagedIframe = function(el,opt){
        
        var args = Array.prototype.slice.call(arguments, 0),
            el = Ext.get(args[0]),
            config = args[0];

        if (el && el.dom && el.dom.tagName == 'IFRAME') {
            config = args[1] || {};
        } else {
            config = args[0] || args[1] || {};

            el = config.autoCreate ? Ext.get(Ext.DomHelper.append(
                    config.autoCreate.parent || Ext.getBody(), Ext.apply({
                        tag : 'iframe',
                        frameborder : 0,
                        cls : MIF.Element.prototype.cls,
                        src : (Ext.isIE && Ext.isSecure)? Ext.SSL_SECURE_URL: 'about:blank'
                    }, config.autoCreate)))
                    : null;

            if(el && config.unsupportedText){
                Ext.DomHelper.append(el.dom.parentNode, {tag:'noframes',html: config.unsupportedText } );
            }
        }
        
        var mif = new MIF.Element(el,true);
        if(mif){
            Ext.apply(mif, {
                disableMessaging : Ext.value(config.disableMessaging , true),
                loadMask : !!config.loadMask ? Ext.apply({
                            msg : 'Loading..',
                            msgCls : 'x-mask-loading',
                            maskEl : null,
                            hideOnReady : false,
                            disabled : false
                        }, config.loadMask) : false,
                _windowContext : null,
                eventsFollowFrameLinks : Ext.value(config.eventsFollowFrameLinks ,true)
            });
            
            config.listeners && mif.on(config.listeners);
            
            if(!!config.html){
                mif.update(config.html);
            } else {
                !!config.src && mif.setSrc(config.src);
            }
        }
        
        return mif;   
    };

    
    
    /** @private */
     Ext.onReady(function() {
            // Generate CSS Rules but allow for overrides.
            var CSS = new CSSInterface(document), rules = [];

            CSS.getRule('.ux-mif')|| (rules.push('.ux-mif{height:100%;width:100%;}'));
            CSS.getRule('.ux-mif-mask-target')|| (rules.push('.ux-mif-mask-target{position:relative;zoom:1;}'));
            CSS.getRule('.ux-mif-el-mask')|| (rules.push(
              '.ux-mif-el-mask {z-index: 100;position: absolute;top:0;left:0;-moz-opacity: 0.5;opacity: .50;*filter: alpha(opacity=50);width: 100%;height: 100%;zoom: 1;} ',
              '.ux-mif-el-mask-msg {z-index: 1;position: absolute;top: 0;left: 0;border:1px solid;background:repeat-x 0 -16px;padding:2px;} ',
              '.ux-mif-el-mask-msg div {padding:5px 10px 5px 10px;border:1px solid;cursor:wait;} '
              ));

            if (!CSS.getRule('.ux-mif-shim')) {
                rules.push('.ux-mif-shim {z-index:8500;position:absolute;top:0px;left:0px;background:transparent!important;overflow:hidden;display:none;}');
                rules.push('.ux-mif-shim-on{width:100%;height:100%;display:block;zoom:1;}');
                rules.push('.ext-ie6 .ux-mif-shim{margin-left:5px;margin-top:3px;}');
            }

            if (!!rules.length) {
                CSS.createStyleSheet(rules.join(' '));
            }
        });

    /** @sourceURL=<mif.js> */
    Ext.provide && Ext.provide('mif');
})()