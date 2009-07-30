     
 Ext.namespace('Ext.ux.plugin');
 Ext.onReady(function(){
    
    /* This important rule solves many of the <object/iframe>.reInit issues encountered
    * when setting display:none on an upstream(parent) element (on all Browsers except IE).
    * This default rule enables the new Panel:hideMode 'nosize'. The rule is designed to
    * set height/width to 0 cia CSS if hidden or collapsed.
    * Additional selectors also hide 'x-panel-body's within layouts to prevent
    * container and <object, img, iframe> bleed-thru.
    */
    var CSS = Ext.util.CSS;
    if(CSS){ 
        CSS.getRule('.x-hide-nosize') || //already defined?
            CSS.createStyleSheet('.x-hide-nosize{height:0px!important;width:0px!important;border:none!important;zoom:1;}.x-hide-nosize * {height:0px!important;width:0px!important;border:none!important;zoom:1;}');
        CSS.refreshCache();
    }
    
});

(function(){

      var El = Ext.Element, A = Ext.lib.Anim,
      VISMODE = 'visibilityMode',
      ELDISPLAY = El.DISPLAY,
      data = El.data; // > Ext 3 RC2 only
      
      if(!El.ASCLASS){
	      /**
	  	   * Visibility mode constant - Use a static className to hide element
		   * @static
		   * @type Number
		   */
	      
	      El.NOSIZE = 3;
	      El.ASCLASS = 3;
	      
	      
	      /**
	       * Visibility class - Designed to set an Elements width and height to zero (or other CSS rule)
	       * @static
	       * @type String
	       * @default 'x-hide-nosize'
	       */
	      El.visibilityCls = 'x-hide-nosize';
	      
	      Ext.override(El, {
	        
		     /**
		      * Gets the element's visibility mode. 
		      * @return {Number} Ext.Element[VISIBILITY, DISPLAY, NOSIZE]
	          */
		      getVisibilityMode :  function(){  
	                
		            var dom = this.dom, 
	                    mode = (dom && Ext.type(data)=='function') ? data(dom,VISMODE) : this[VISMODE];
	                if(mode === undefined){
	                   mode = 1;
	                   mode = (dom && Ext.type(data)=='function') ? data(dom, VISMODE, mode) : (this[VISMODE] = mode);
	                }
	                return mode;
	           },
	                  
	          setVisible : function(visible, animate){
	            var me = this,
	                dom = me.dom,
	                visMode = me.getVisibilityMode();
                    
	            if(!dom)return me;    
	            if(!animate || !A){
	                if(visMode === El.DISPLAY){
	                    me.setDisplayed(visible);
	                }else if(visMode === El.VISIBILITY){
	                    me.fixDisplay();
	                    dom.style.visibility = visible ? "visible" : "hidden";
	                }else {
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
	                             }else {
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
	            if(this.dom && deep && vis){
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
	        }
	    });
      }
    
})();

     /**
      * @class Ext.ux.plugin.VisibilityMode
      * @version 1.2
      * @author Doug Hendricks. doug[always-At]theactivegroup.com
      * @copyright 2007-2009, Active Group, Inc.  All rights reserved.
      * @license <a href="http://www.gnu.org/licenses/gpl.html">GPL 3.0</a>
      * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
      * @singleton
      * @static
      * @desc This plugin provides an alternate visibility mode to Ext.Elements and a new hideMode for Ext.Components.<br />
      * <p>It is generally designed for use with all browsers <b>except</b> Internet Explorer, but may used on that Browser as well.
      * <p>If included in a Component as a plugin, it sets it's hideMode to 'nosize' and provides a new supported
      * CSS rule that sets the height and width of an element and all child elements to 0px (rather than
      * 'display:none', which causes DOM reflow to occur and re-initializes nested OBJECT, EMBED, and IFRAMES elements)
      * <p>For Elements, a new visibilityMode value (3) is implemented for fine-grain control over show/hide behavior</p>
      * @example 
       var div = Ext.get('container');
       div.setVisibilityMode(Ext.Element.NOSIZE);
       //You can override the Element (instance) visibilityCls to any className you wish 
       div.visibilityCls = 'my-hide-class';
       div.hide();
      
       someContainer.add({
         xtype:'flashpanel',
         plugins: [new Ext.ux.plugin.VisibilityMode({hideMode:'nosize'}) ],
         ...
        });
    
       //or, Fix a specific Container only and all of it's child items:
    
        var V = new Ext.ux.plugin.VisibilityMode({hideMode:'nosize'}) ;
        new Ext.TabPanel({
         plugins     : V,
         defaults    :{ plugins: V },
         items       :[....]
        });
     */
 Ext.ux.plugin.VisibilityMode = function(opt) {

    Ext.apply(this, opt||{});
    
    var CSS = Ext.util.CSS;

    if(CSS && !Ext.isIE && this.fixMaximizedWindow !== false && !Ext.ux.plugin.VisibilityMode.MaxWinFixed){
        //Prevent overflow:hidden (reflow) transitions when an Ext.Window is maximize.
        CSS.updateRule ( '.x-window-maximized-ct', 'overflow', '');
        Ext.ux.plugin.VisibilityMode.MaxWinFixed = true;  //only updates the CSS Rule once.
    }
    
   };


  Ext.extend(Ext.ux.plugin.VisibilityMode , Object, {

       /**
        * @cfg {Boolean} bubble If true, the VisibilityMode fixes are also applied to parent Containers which may also impact DOM reflow.
        * @default true
        */
      bubble              :  true,

      /**
      * @cfg {Boolean} fixMaximizedWindow If not false, the ext-all.css style rule 'x-window-maximized-ct' is disabled to <b>prevent</b> reflow
      * after overflow:hidden is applied to the document.body.
      * @default true
      */
      fixMaximizedWindow  :  true,

      /**
       *
       * @cfg {array} elements (optional) A list of additional named component members to also adjust visibility for.
       * <br />By default, the plugin handles most scenarios automatically.
       * @default null
       * @example ['bwrap','toptoolbar']
       */

      elements       :  null,

      /**
       * @cfg {String} visibilityCls A specific CSS classname to apply to Component element when hidden/made visible.
       * @default 'x-hide-nosize'
       */

      visibilityCls   : 'x-hide-nosize',

      /**
       * @cfg {String} hideMode A specific hideMode value to assign to affected Components.
       * @default 'nosize'
       */
      hideMode  :   'nosize' ,

     /**
      * Component plugin initialization method.
      * @param {Ext.Component} c The Ext.Component (or subclass) for which to apply visibilityMode treatment
      */
     init : function(c) {

        var El = Ext.Element;

        var hideMode = this.hideMode || c.hideMode;
        var visMode = El[hideMode.toUpperCase()] || El.VISIBILITY;
        var plugin = this;

        var changeVis = function(){

            var els = [this.collapseEl, 
                      //ignore floating Layers, otherwise the el. 
                      this.floating? null: this.actionMode
                      ].concat(plugin.elements||[]);

            Ext.each(els, function(el){
	            var e = el ? this[el] : el;
	            if(e){ 
                 e.setVisibilityMode(visMode);
                 e.visibilityCls = plugin.visibilityCls;
                }
                   
            },this);

            var cfg = {
	            animCollapse : false,
	            hideMode  : hideMode,
	            animFloat : false,
	            defaults  : this.defaults || {}
            };

            cfg.defaults.hideMode = hideMode;
            
            Ext.apply(this, cfg);
            Ext.apply(this.initialConfig || {}, cfg);
            
         };

         var bubble = Ext.Container.prototype.bubble;

         c.on('render', function(){

            // Bubble up the layout and set the new
            // visibility mode on parent containers
            // which might also cause DOM reflow when
            // hidden or collapsed.
            if(plugin.bubble !== false && this.ownerCt){

               bubble.call(this.ownerCt, function(){

               if(this.hideMode !== hideMode){ //already applied?
                  this.hideMode = hideMode ;

                  this.on('afterlayout', changeVis, this, {single:true} );
                }

              });
             }

             changeVis.call(this);

          }, c, {single:true});

     }

  });

