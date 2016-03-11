## How do I force a refresh of the currently loaded page within MIF/MIFPanel ##
Calling the setSrc method of MIF or MIFP without specifying the first parameter, reloads the page with the last URL specified by the last setSrc method call or defaultSrc property.
```
yourMIF.setSrc(); //reload using the last-known URL.
```
To refresh the iframe based on the current documentURI of the frame use:
```
yourMIF.setSrc(yourMIF.getDocumentURI());  or
yourMIFP.setSrc(yourMIFP.getFrame().getDocumentURI());
```

_Note: "Same-origin" restrictions prevent access to current documentURI of the frame if was loaded from a foreign-domain.  In that case, getDocumentURI returns the last defaultSrc/setSrc value used._

## How can I determine when the contents of a MIF/MIFP are fully loaded ? ##
The 'documentloaded' event is raised when all scripts and images withing the frame have been fully loaded/initialized.  (If the embedded document is requested from a "same-origin" domain the 'domready' event is also raised, indicating that the embedded DOM is in a state where it may be manipulated before other assets (images) are fully loaded.)
```
 yourMIF.on('documentloaded', function(frame){ alert('Document is loaded');});
```
## How can I specify the 'id' and/or 'name' attributes for a dynamically created MIF or MIFPanel? ##
The 'id' and 'name' attributes may be specified for MIF in its autoCreate config option:
```
var MIF=new Ext.ux.ManagedIFrame({autoCreate:{id:'sales1', name:'salesframe', .....
```
For MIFP, use the frameConfig option:
```
 var MIFP=new Ext.ux.ManagedIframePanel({frameConfig:{autoCreate:{id:'sales1', name:'salesframe'}} );
```

## How can I make the iframe occupy 100% width and height of a Panels body using scroll bars only when necessary? ##
The defaults style rules for MIF/MIFPanel is 100% width/height and overflow:auto, thus when rendering in an MIFPanel, the autoScroll config option should not be used as this may render unnecessary scroll bars for the container.  If your MIFPanel is '''not''' participating in a managed layout ('border', etc) use the fitToParent:true config option to resize when the parent changes size.

## How can I invoke a function defined/hosted on the parent page from a script embedded in the page loaded into the IFRAME? ##
The frames Window object contains a reference to its parent page Window object or **parent**.  Use that object to reference the global namespace of the parent:
```
 parent.Ext.Msg.alert('Child Frame Says',"I'm alive");
```
Note: Anonymous Function declarations are not resolvable by the window object when called from a child frame.  Declare your global functions this way:
```
var fn = function(arg){ arg++; };
```

## Why do IFRAMEs appear to reload again after being hidden or resized with FireFox ? ##
FireFox, and several others (Except Internet Explorer), reload IFRAME content any time the IFRAME (or an upstream containing Element) is hidden using style:display:none or when its style:position attribute changes.  This is particularly evident when used within Ext.TabPanels as the default hide method for all Ext Components is display:none, which sets the Panel width and height to zero(0).  To avoid this behavior in releases prior to 1.05, change your Panels hideMode and position attributes to 'visibility'(or offsets) and 'absolute' respectively in your TabPanel item defaults:
```
 defaults:{
   style     :{position:!Ext.isIE?'absolute':'relative'}
  ,hideMode  :!Ext.isIE?'visibility':'display'
  ,closable  :true
   }
```
_Releases starting 1.05 and later use a new default hideMode:'nosize' and Panel visibility scheme that solves this problem._

## I cannot seem to drag anything over a MIF/MIFPanel body. The mouse cursor just stops at the edge of the frame. ##

IFRAMEs are embedded browser instances, and as such, each has their own unique DOM and seperate event system.  During a 'main-page' drag operation, the event listeners for the 'mousemove' event for example, only apply to the parent document.  Since the embedded document likely has no such listeners defined for these events, your mouse dutifully stops at the frame border.
To remedy this behaviour, ux.ManagedIframe.Manager has two methods which (de)activate a special transparent image mask that can be applied to MIF/MIFPanel(s) at the start of your drag operation.  To invoke the mask (now part of the parent pages' DOM) use this method:
```
Ext.ux.ManagedIFrame.Manager.showShims();
```
This masks **all** active MIF/MIFPanels on the parent page until you invoke  **hideShims** method (eg. when the drop is completed).  Note: MIFPanel already manages the drag shimming for you when the MIFP participates in an Ext border layout (eg. dragging the splitters to resize border layout regions).

## My Ext.Menu does not disappear when it overlays an Iframe and I click on the document contained in the Iframe. ##

See previous FAQ for more information.  This too is a simple remedy that works for local and foreign domain frames.  In your Ext.menu (or other component which relies on a parent document 'click' events for hiding) config, add the following event listeners (or equivalent):
```
 new Ext.menu({
 listeners:{
    beforeshow : Ext.ux.ManagedIFrame.Manager.showShims,
    beforehide   : Ext.ux.ManagedIFrame.Manager.hideShims,
    scope         : Ext.ux.ManagedIFrame.Manager
  },
  ...,
```
While the shims are active, mouse events are permitted to bubble up to the parent normally.

## How can I size an Ext.Window to an Iframe document? ##

Use MIF's domready event and iframe DOM interface to query the frame document for size geometry ("same-origin" frames only):
```
  Ext.onReady(function(){
       Ext.BLANK_IMAGE_URL = '../resources/images/default/s.gif';
        var MIF = new Ext.ux.ManagedIFramePanel({
                    border: false,
                    bodyBorder: false,
                    defaultSrc:'index.html',
                    listeners:{
                        domready : function(frame){
                              var fbody = frame.getBody();
                              var w = Ext.getCmp('myFrameWin');
                              if(w && fbody){
                                   //calc current offsets for Window body border and padding
                                  var bHeightAdj = w.body.getHeight() - w.body.getHeight(true);
                                  var bWidthAdj  = w.body.getWidth()  - w.body.getWidth(true);
                                  //Window is rendered (has size) but invisible
                                  w.setSize(Math.max(w.minWidth || 0, fbody.scrollWidth  +  w.getFrameWidth() + bWidthAdj) ,
                                            Math.max(w.minHeight || 0, fbody.scrollHeight +  w.getFrameHeight() + bHeightAdj) );
                                  //then show it sized to frame document
                                  w.show();
                              }
                        }
                    }
                });
        var windowFrame = new Ext.Window({
                    title: name,
                    width: 400,   //give it something to start with until the frame renders
                    height: 600,
                    hideMode:'visibility',
                    id:'myFrameWin',
                    hidden : true,   //wait till you know the size
                    title: 'Sized To Frame Document',
                    plain: true,
                    constrainHeader: true,
                    minimizable: true,
                    ddScroll: false,
                    border: false,
                    bodyBorder: false,
                    layout: 'fit',
                    plain:true,
                    maximizable: true,
                    buttonAlign:'center',
                    items:MIF
                });
        windowFrame.render(Ext.getBody());
    });
```