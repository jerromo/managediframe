    /**
     * @class multidomc
     * @version 1.0
     * @license GPL 3.0 
     * @author Doug Hendricks. Forum ID: <a href="http://extjs.com/forum/member.php?u=8730">hendricd</a> 
     * @donate <a target="tag_donate" href="http://donate.theactivegroup.com"><img border="0" src="http://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" border="0" alt="Make a donation to support ongoing development"></a>
     * @copyright 2007-2009, Active Group, Inc. All rights reserved.
     * @description [Designed For Ext Core and ExtJs Frameworks (using ext-base adapter only) 3.0 or higher ONLY]
     * The multidomc library extends multidom support to Ext Components to 
     * provide document-targeted access to the documents loaded in external (FRAME/IFRAME) 
     * documents. 
     */
    
    Ext.override (Ext.Component, {
        // private
        // default function is not really useful
        onRender : function(ct, position){
            var doc = this.documentElement || (this.documentElement= ct.getDocument());
            if(!this.el && this.autoEl){
                if(typeof this.autoEl == 'string'){
                    this.el = doc.createElement(this.autoEl);
                }else{
                    var div = doc.createElement('div');
                    Ext.DomHelper.overwrite(div, this.autoEl);
                    this.el = div.firstChild;
                }
                if (!this.el.id) {
                    this.el.id = this.getId();
                }
            }
            if(this.el){
                this.el = Ext.get(this.el, doc); //target the containers document context
                if(this.allowDomMove !== false){
                    ct.dom.insertBefore(this.el.dom, position);
                }
            }
        },
        
        onDestroy  : function(){
            this.documentElement = this.container = null;
        }
   });
   
   Ext.override( Ext.Panel,{
    // private
        createElement : function(name, pnode){
            if(this[name]){
                pnode.appendChild(this[name].dom);
                return;
            }
            var doc = this.documentElement;
    
            if(name === 'bwrap' || this.elements.indexOf(name) != -1){
                if(this[name+'Cfg']){
                    this[name] = Ext.fly(pnode).createChild(this[name+'Cfg']);
                }else{
                    var el = doc.createElement('div');
                    el.className = this[name+'Cls'];
                    this[name] = Ext.get(pnode.appendChild(el), doc);
                }
                if(this[name+'CssClass']){
                    this[name].addClass(this[name+'CssClass']);
                }
                if(this[name+'Style']){
                    this[name].applyStyles(this[name+'Style']);
                }
            }
        }
   });
   
   /** @sourceURL=<multidomc.js> */
   Ext.provide && Ext.provide('multidomc');