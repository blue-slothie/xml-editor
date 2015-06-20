# xml-editor
Easy XML-Editor for Firefox, Chrome or NW.js

Just clone it and open up _index.html_ in the browser

##How to use it
When editing the XML in tree view most of the things can be done by using the context menu. Attributes and text nodes can be edited by double clicking one. Since jqTree supports it you can move elements with drag and drop.

The editor view is just a ace editor instance with your recent XML-Code.

By clicking _Save_ you open up a new tab containing your XML (just hit ctrl+s to save ;-)) or if used in NW.js it will open a real save dialog.

_Print_ renders you the XML tree as PNG. After clicking the picture will show up and you can save it like mentioned above.

If your browser support FileReader you will be able to load XML-Files from local storage.
Just click _Load File_ and have fun with your XML.

##NW.js

If you like to use it as a desktop application download nodewebkit and start:
`nw xml-editor`

Want a single executable? Read the NW.js Github page for packaging desktop applications.

##Ingredients:
* [Ace Editor](http://ace.c9.io)
* [Twitter Bootstrap](http://getbootstrap.com/) (for [Glyphicons](http://glyphicons.com/))
* [jqContextMenu](https://github.com/medialize/jQuery-contextMenu)
* [jqTree](http://mbraak.github.io/jqTree/)
* [JXON](https://github.com/tyrasd/jxon)
* [vkbeautify](http://www.eslinstructor.net/vkbeautify/)
* [jQuery](https://jquery.com/)

##Bugs
* Very slow when you try to load big XML-Files
* Big XML-Files can't be rendered to PNG since the size limitations of canvas
* Tags automatically set to lower case
* Found one? Tell me :-)
