# Ext.ux.ManagedIframe/Panel #

Ever try to use an Iframe element as a '''writable''' body to Ext.Panel?  Perhaps to render your own content in isolation from the rest of the host page, or just load another website in a tab panel.

Getting an IFRAME into the right place in the DOM isn't too difficult, but updating its contents with Ext.Elements' update method is a challenge.  Ext.Element assumes the element it's managing has a innerHTML property.  Well, IFRAMEs don't!  So to make ''writable'' IFRAMEs easier to use within Ext framework, this extension overrides the default update method of Ext.Element(for the designated IFRAME) to provide exactly that sort of thing.
Now, you can use:
```
  IFrameEl.update("<div>New content</div>");
```

meaning -- you can write any string content (replacing the entire document) directly to embedded document model of an IFrame.  When using the extensions' new ''update'' and existing load methods, your IFrame acts like any other updateable (like innerHTML) element.

Ext.ux.ManagedIframePanel extends the standard Ext.Panel class which leverages the cool layout management features of a Panel, but embeds a ManagedIframe into the body of the panel. This preserves the native header, footer, and toolbar support of a standard panel, but permits creation of complex body layouts surrounding an IFrame.

## Features available ##

  * UpdateManager.update and load support (to IFrames document).
  * advanced scripting support.
  * loadMask support.
  * Cross-frame messaging
  * frame Ext.Element support (ie. MIF.get, getDom, getDoc, fly ),
  * frame CSS selector queries (eg. MIF.select/query) ,
  * frame CSS.styleSheet interface (create, modify, remove frame-embedded style rules)
  * frame Ext.EventManager support to DOM elements embedded in a frames document. (Use the Element interface to query embedded DOM elements just like you would in the parent document; all **without** loading the Ext framework within the embedded page):

```
MIF.select('img',true).setOpacity(.5);
```
or
```
MIFPanel.getFrame().select('img',true).setOpacity(.5);
```

Set Event listeners on a frames DOM elements for handling with scripts hosted in the parent page:

```
 //Select all images in the frame document and set a 'click' event handler on
 //each using event delegation.
 MIF.getDoc().on('click',function(e){ alert('Image ' + e.getTarget().id + ' was Clicked.') },null, {delegate:'img'});
```

## Supported events ##
  * documentloaded
  * domready (fired when used with Updatemanager.update method, or when the document DOM reports ready)
  * message[: subject]
  * exception
  * blur (fired when the frame window loses focus)
  * focus (fired when the frame window receives focus)
  * resize (fired when the frame window receives focus)
  * unload (fired when the frame document is unloaded)

## Running the packaged Examples (MIF 1.x) ##
Extract the current source and demo files from miframe1\_2.zip directly into a new/existing: /examples/miframe directory of your standard 2.x Ext.distribution.

## Online Examples for ManagedIFrame 2.0 (for Ext 3.0 only) ##
  * Simple [MIF.Window](http://demos.theactivegroup.com/?demo=mif&script=mifsimple).
  * By popular demand: [A Westside Story](http://demos.theactivegroup.com/?demo=mif&script=treenav) (Ext.Treepanel-based URL Layout drives a MIF-filled TabPanel )
  * [PDFSubmit](http://demos.theactivegroup.com/?demo=mif&script=mifsubmit) (demonstrates MIF's ability to submit Forms/File-uploads using its new 'submitAsTarget' method)).
More MIF2 demos coming soon...