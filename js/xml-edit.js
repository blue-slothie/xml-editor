if (typeof require !== 'undefined')
  var fs = require('fs');

function init() {
  window.xmleditor = {};
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var form = document.createElement('div');
    var input = document.createElement('input');
    input.type = 'file';
    input.id = 'xml-file';
    input.addEventListener('change', onLoadFile);
    form.appendChild(input);

    input = document.createElement('button');
    input.setAttribute('role', 'button');
    var span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.classList.add('glyphicon');
    span.classList.add('glyphicon-open');
    input.appendChild(span);
    input.appendChild(document.createTextNode("Load XML-File"));
    input.addEventListener('click', function () {
      $("input#xml-file").val('');
      $("input#xml-file").click();
    });
    form.appendChild(input);

    $(form).appendTo('#menu');
  } else {
    alert("FileReader ist not supported. You won't be able to load XML-Files from local storage.");
  }

  $(window).bind('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
        case 's':
            event.preventDefault();
            //prepareSave(event);
            window.open(genDataURL(), '_blank');
            break;
      /*case 'f':
            event.preventDefault();
            alert('ctrl-f');
            break;
        case 'g':
            event.preventDefault();
            alert('ctrl-g');
            break;*/
        }
    }
});

  $('#btn-text, #btn-tree').click(function (event) {
    var $target = $(event.currentTarget);
    if ($target.hasClass('selected'))
      return;

    if ($target.attr('id') === 'btn-text') {
      xmleditor.text = genXML();
      xmleditor.editor.setValue(xmleditor.text);
      xmleditor.editor.getSession().getSelection().clearSelection();
      xmleditor.editor.resize();
    } else if ($target.attr('id') === 'btn-tree') {
      var xmltext = xmleditor.editor.getValue();
      var xmldoc = JXON.stringToXml(xmltext);
      if (isParseError(xmldoc)) {
        alert('Parser-Error! Check your XML-Syntax.');
        return;
      }
      if(xmltext !== xmleditor.text)
        loadXMLFile(xmldoc);
    }

    var $targettab = $('#' + $target.attr('data-tab'));
    $targettab.css('height',
      $('#tabcontainer').innerHeight() - $('.tab-buttons').outerHeight()
    );
    $targettab.css('display', 'block');
    $targettab.siblings().css('display', 'none');
    $target.addClass('selected');
    $target.siblings().removeClass('selected');
  });

  xmleditor.treedata = {
    label: 'root',
    attributes: [],
    children: [],
    selectable: false,
    id: 0
  };
  xmleditor.text = '<root>\n</root>';

  xmleditor.elmCounter = 0;


  xmleditor.nodecontextmenu = {
    selector: "div.jqtree-element",
    items: {
      "jc": {
        name: "Close Menu",
        callback: function () {}
      },
      "edit": {
        name: "Edit",
        //icon: "edit",
        callback: function (key, opt) {
          var renametarget = opt.$trigger.children('span.jqtree-title');
          renameStart(renametarget);
        }
      },
      "add-text": {
        name: "Add Text",
        disabled: function () {
          return $(this).hasClass('text-value');
        },
        callback: function (key, opt) {
          var nodeid = opt.$trigger.attr('data-id');
          var node = $('#xml-tree').tree('getNodeById', nodeid);
          xmleditor.elmCounter++;
          $('#xml-tree').tree(
            'appendNode', {
              label: 'newText',
              id: xmleditor.elmCounter,
              istext: true
            }, node);
          $('#xml-tree').tree('openNode', node);
        }
      },
      "add-node": {
        name: "Add Node",
        disabled: function () {
          return $(this).hasClass('text-value');
        },
        callback: function (key, opt) {
          var nodeid = opt.$trigger.attr('data-id');
          var node = $('#xml-tree').tree('getNodeById', nodeid);
          xmleditor.elmCounter++;
          $('#xml-tree').tree(
            'appendNode', {
              label: 'newNode',
              id: xmleditor.elmCounter,
              attributes: [],
              children: [],
              istext: false
            }, node);
          $('#xml-tree').tree('openNode', node);
        }
      },
      "add-attribute": {
        name: "Add Attribute",
        disabled: function () {
          return $(this).hasClass('text-value');
        },
        callback: function (key, opt) {
          var nodeid = opt.$trigger.attr('data-id'),
              $modalbody = $('#modal-editattribut > .xml-modal-body');
          var node = $('#xml-tree').tree('getNodeById', nodeid);
          var attrid = node.attributes.length || 0;
          $modalbody.attr('data-nodeid', nodeid);
          $modalbody.attr('data-attribute-index', attrid);
          $('#attr-name').val('');
          $('#attr-value').val('');
          showXMLModal('#modal-editattribut');
        }
      },
      "delete": {
        name: "Delete",
        //icon: "delete",
        callback: function (key, opt) {
          var nodeid = opt.$trigger.attr('data-id');
          var node = $('#xml-tree').tree('getNodeById', nodeid);
          $('#xml-tree').tree('removeNode', node);
        }
      }
    }
  };

  $.contextMenu(xmleditor.nodecontextmenu);

  xmleditor.treesettings = {
    data: [xmleditor.treedata],
    onCreateLi: createLi,
    onCanMove: canMove,
    onCanMoveTo: canMoveTo,
    dragAndDrop: true,
    autoOpen: 2,
    useContextMenu: false,
    selectable: false
  };
  
  $('#save-button').click(prepareSave);
  
  
  xmleditor.canvaspos = { "x": 20, "y": 20 };
  $('.print').click(renderImage);
  $('#imgview').click(function () {
    $(this).css('display', 'none');
  });
  $('#saveimg').click(function () {
    var dataurl = $('#image').attr('src');
    if (typeof fs === "undefined") {
      window.open(dataurl, "_blank");
    } else {
      $('#imgsave').click();
    }
  });

  if(typeof fs !== "undefined") {
    $('#save').change(function (event) {
      var file = $(this).val(),
          content = '';
      var selected_mode = $('#tabcontainer > .tab-buttons > div.selected').attr('id');
      if (selected_mode === 'btn-tree')
        content = genXML();
      else
        content = xmleditor.editor.getValue();

      fs.writeFile(file, content, function (err) {
        if (err)
          alert('Saving failed');
        else
          alert('Saved file to: ' + file);
      });
      $(this).val('');
    });
    
    $('#imgsave').change(function (event) {
      var file = $(this).val(),
          dataurl = $('#image').attr('src'),
          content;
      content = dataurl.replace(/data:\w+\/\w+;(base64,)?/, '');
      fs.writeFile(file, content, 'base64', function (err) {
        if (err)
          alert('Saving Image failed');
        else
          alert('Saved Image to: ' + file);
      });
      $(this).val('');
    });
  }
  
  $('#ch-attr-ok').click(onSubmitAttribut);
  $('#ch-attr-cancel').click(onCancelAttribut);

  loadTree();
  xmleditor.editor = ace.edit("xml-text");
  xmleditor.editor.$blockScrolling = Infinity;
  //xmleditor.editor.setTheme("ace/theme/monokai");
  xmleditor.editor.getSession().setMode("ace/mode/xml");
  xmleditor.editor.getSession().setValue(window.xmleditor.text);
  xmleditor.editor.getSession().setTabSize(2);
  xmleditor.editor.getSession().setUseSoftTabs(true);
}

function renderImage (event) {
  //get data
  var mode = $('#tabcontainer > .tab-buttons > div.selected').attr('id'),
      tree;
  if (mode === 'btn-text') {
    $('#btn-tree').click();
  }
  tree = $('#xml-tree').tree('getTree').children[0];
  
  //setup canvas
  $('#image').attr('src');
  var canvas = document.getElementById('print-canvas'),
      height = $('#xml-tree > ul div.jqtree-element').length * 23 + 20;
  canvas.height = height;
  canvas.width = 0;
  
  //paint
  var ctx = canvas.getContext("2d");
  ctx.fillStyle="#000";
  ctx.font="18px sans-serif";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "grey";
  ctx.globalAlpha = 1;
  
  xmleditor.canvaspos = { "x": 20, "y": 20 };
  paintBranch($('#xml-tree').tree('getTree').children[0], canvas, ctx, xmleditor.canvaspos.x, function(){
    var $imgview = $('#imgview');
    $imgview.css('display', 'block');
    $imgview.children('#image').attr('src', canvas.toDataURL());
  });
}

//recursive canvas rendering of xml-tree
function paintBranch (node, canvas, ctx, x, completed) {
  
  ctx.beginPath();
  ctx.moveTo(x - 19, xmleditor.canvaspos.y-7);
  ctx.lineTo(x - 6, xmleditor.canvaspos.y-7);
  ctx.stroke();
  var starty = xmleditor.canvaspos.y;
  
  if(node.istext) {
    ctx.font = 'italic 18px "Courier New"';
    resizeCanvas(node.name, x, $(canvas), ctx);
    ctx.fillText(node.name, x, xmleditor.canvaspos.y);
    ctx.font = "18px sans-serif";
    return;
  }
  
  resizeCanvas(node.name, x, $(canvas), ctx);
  ctx.fillText(node.name, x, xmleditor.canvaspos.y);
  
  var x2 = x+15,
      xattr = x+ctx.measureText(node.name).width+20,
      i,
      endy;
  
  ctx.font = "italic 16px serif";
  
  for ( i=0; i < node.attributes.length; i++ ) {
    var name = node.attributes[i].name,
        value = node.attributes[i].value;
    resizeCanvas(name+"="+value, xattr, $(canvas), ctx);
    ctx.fillText(name+"="+value, xattr, xmleditor.canvaspos.y);
    xattr += ctx.measureText(name+"="+value).width+20;
  }
  
  ctx.font = "18px sans-serif";
  
  for ( i=0; i < node.children.length; i++ ) {
    xmleditor.canvaspos.y += 23;
    if ( node.children.length-1 === i )
      endy = xmleditor.canvaspos.y;
    paintBranch(node.children[i], canvas, ctx, x2);
  }
  ctx.beginPath();
  ctx.moveTo(x - 3 , endy-7);
  ctx.lineTo(x - 3, starty);
  ctx.stroke();
  if(completed)
    completed();
}

//resizes canvas if text needs more space than available
function resizeCanvas (text, x, canvas, ctx) {
  var $canvas,
      oldwidth,
      oldheight,
      textwidth,
      newwidth;
  
  var oldprops = {
    fillStyle: ctx.fillStyle,
    font: ctx.font,
    lineWidth: ctx.lineWidth,
    strokeStyle: ctx.strokeStyle
  };
  
  if(canvas instanceof jQuery)
    $canvas=canvas;
  else
    $canvas=$(canvas);
  
  
  oldwidth = $canvas.attr('width');
  oldheight = $canvas.attr('height');
  textwidth = ctx.measureText(text).width;
  newwidth = Math.ceil(textwidth+x+20);
  
  if( oldwidth < newwidth ) {
    var bufcanvas = $('#buf-canvas')[0];
    bufcanvas.width = oldwidth;
    bufcanvas.height = oldheight;
    var bufctx = bufcanvas.getContext('2d');
    if (oldwidth > 0)
      bufctx.drawImage($canvas[0], 0, 0);
    $canvas.attr('width', newwidth);
    ctx.fillStyle="#FFF";
    ctx.fillRect(0, 0, newwidth, oldheight);
    if (oldwidth > 0)
      ctx.drawImage(bufcanvas, 0, 0);
    for (prop in oldprops)
      ctx[prop] = oldprops[prop];
  }
}

function genDataURL () {
  var content = '',
      selected_mode = $('#tabcontainer > .tab-buttons > div.selected').attr('id');
  
  if (selected_mode === 'btn-tree')
    content = genXML();
  else
    content = xmleditor.editor.getValue();

  return 'data:text/xml;base64,'+btoa(content);
}

function prepareSave (event) {
  event.stopPropagation();
  event.preventDefault();
  if(typeof fs === "undefined"){
    window.open(genDataURL(), "_blank");
  }else {
    $('#save').click();
  }
}

function isParseError(parsedDocument) {
  var parser = new DOMParser(),
    errorneousParse = parser.parseFromString('<', 'text/xml'),
    parsererrorNS = errorneousParse.getElementsByTagName("parsererror")[0].namespaceURI;

  /*if (parsererrorNS === 'http://www.w3.org/1999/xhtml') {
    return parsedDocument.getElementsByTagName("parsererror").length > 0;
  }*/

  return parsedDocument.getElementsByTagNameNS(parsererrorNS, 'parsererror').length > 0;
};

function onDoubleClick(event) {
  var node = event.node;
  if (node.istext) {
    event.preventDefault();
    event.stopPropagation();
  } else {
    $('#xml-tree').tree('toggle', node);
  }
}

function createLi(node, $li) {
  var $span = $li.find('div.jqtree-element > span.jqtree-title');
  var $div = $li.find('div.jqtree-element');
  $div.attr('data-id', node.id);
  $div.attr('data-level', node.getLevel());
  $span = createXMLListElement(node, $span);
  $span.addClass('noedit');
  if (node.istext) {
    $div.addClass('text-value');
    $span.dblclick(function (e) {
      renameStart(e.currentTarget);
    });
  } else {
    $span.find('span:not([class])').dblclick(function (event) {
      if(event.currentTarget !== event.target)
        return;
      var node = $('#xml-tree').tree('getNodeById', $(event.currentTarget).parent().parent().attr('data-id'));
      $('#xml-tree').tree('toggle', node);
    });
  }
}

function canMove() {
  return true;
}

function canMoveTo(mvnode, targetnode, pos) {
  if ( targetnode.istext )
    return false;
  if( mvnode.istext){
    var i;
    for ( i=0; i < targetnode.children.length; i++ ) {
      if ( targetnode.children[i].istext )
        return false;
    }
  }
  
  return true;
}

function onLoadFile(event) {
  //var form = event.target;
  var input = $('input#xml-file')[0];
  var reader = new FileReader();
  var mode = $('#tabcontainer > .tab-buttons > div.selected').attr('id');
  reader.onload = function () {
    var content = reader.result;
    loadXMLFile(JXON.stringToXml(content));
    if ( mode === 'btn-text' ) {
      xmleditor.text = genXML();
      xmleditor.editor.setValue(xmleditor.text);
      xmleditor.editor.getSession().getSelection().clearSelection();
      xmleditor.editor.resize();
    }
  };
  reader.readAsText(input.files[0]);
}

function loadXMLFile(xmldoc) {
  var xmlobj = JXON.build(xmldoc, 2);
  var treeobj = {};
  var tree = buildBranchData(xmlobj, []);
  //tree = [tree];
  window.xmleditor.treedata = tree;
  loadTree();
}

function loadTree() {
  if (!jQuery.isArray(xmleditor.treedata)) {
    xmleditor.treedata = [xmleditor.treedata];
  }
  var data = xmleditor.treedata;
  xmleditor.treesettings.data = data;
  var settings = xmleditor.treesettings;
  if ($('#xml-tree > ul').hasClass('jqtree-tree')) {
    $('#xml-tree').tree('loadData', data);
  } else {
    $('#xml-tree').tree(settings);
  }
}

var idcounter = 0;

function buildBranchData(xmlobj, branch) {
  idcounter++;
  var parent = "";
  for (parent in xmlobj) {
    if (parent.indexOf('@') === 0 || parent === 'keyValue')
      continue;

    if (!jQuery.isArray(xmlobj[parent]))
      xmlobj[parent] = [xmlobj[parent]];
    var i = 0;
    for (i = 0; i < xmlobj[parent].length; i++) {
      var sub = {
        label: parent,
        id: idcounter,
        istext: false
      };
      sub.attributes = getBranchAttributes(xmlobj[parent][i]);

      var children = buildBranchData(xmlobj[parent][i], []);
      if (children.length > 0) {
        sub.children = children;
      }

      if (xmlobj[parent][i]['keyValue']) {
        //idcounter++;
        var textsub = {
          label: xmlobj[parent][i]['keyValue'],
          id: idcounter,
          istext: true
        };
        if (sub.children)
          sub.children.unshift(textsub);
        else
          sub.children = [textsub];
        //sub.text = xmlobj[parent][i]['keyValue'];
      }
      idcounter++;
      branch.push(sub);
    }

  }
  return branch;
}

function getBranchAttributes(xmlbranch) {
  var parent = "";
  var attributes = [];
  for (parent in xmlbranch) {
    if (parent.indexOf('@') === 0) {
      var attrname = parent.substring(1);
      var attrvalue = xmlbranch[parent];
      attributes.push({
        name: '' + attrname,
        value: '' + attrvalue
      });
    }
  }
  return attributes;
}

function createXMLListElement(node, $span) {
  //Tag-Name and Textbox
  $span.empty();
  var span = document.createElement('span');
  var text = document.createTextNode(node.name);
  span.appendChild(text);

  var input = document.createElement('input');
  input.value = node.name;
  input.addEventListener('blur', renameRollback);
  input.addEventListener('keydown', onPressEnter);
  $(input).attr('data-id', node.id);
  
  $span.append(span);
  $span.append(input);
  
  //Attributes
  if(!node.istext){
    span = document.createElement('span');
    span.classList.add('attributes-list');

    var i;
    for ( i=0; i<node.attributes.length; i++ ) {
      var attrspan = document.createElement('span');
      attrspan.classList.add('attribute');
      attrspan.setAttribute('data-attribute-index', ''+i);

      var bufspan = document.createElement('span');
      bufspan.classList.add('attribute-name');
      bufspan.appendChild(document.createTextNode(node.attributes[i].name));
      attrspan.appendChild(bufspan);

      bufspan = document.createElement('span');
      bufspan.classList.add('attribute-value');
      bufspan.appendChild(document.createTextNode(node.attributes[i].value));
      attrspan.appendChild(bufspan);
      
      $(attrspan).dblclick(onDblClickAttribute);
      
      span.appendChild(attrspan);
    }

    $span.append(span);
  }
  return $span;
}

function onDblClickAttribute (event) {
  var $target    = $(event.currentTarget), 
      name       = $target.children(".attribute-name").html(),
      value      = $target.children(".attribute-value").html(),
      nodeid     = $target.parent().parent().parent().attr('data-id'),
      attrid     = $target.attr('data-attribute-index'),
      $modalbody = $('#modal-editattribut > .xml-modal-body');
  
  $('#attr-name').val(''+name);
  $('#attr-value').val(''+value);
  
  $modalbody.attr('data-nodeid', nodeid);
  $modalbody.attr('data-attribute-index', attrid);
  
  showXMLModal('#modal-editattribut');
}

function onSubmitAttribut (event) {
  var $modalbody = $('#modal-editattribut > .xml-modal-body');
  var $target = $(event.currentTarget),
      name = $('#attr-name').val(),
      value = $('#attr-value').val(),
      nodeid = $modalbody.attr('data-nodeid'),
      attrid = $modalbody.attr('data-attribute-index');
  
  var oldnode = $('#xml-tree').tree('getNodeById', nodeid);
  var newattributes = JSON.parse(JSON.stringify(oldnode.attributes));
  if(!newattributes[attrid])
    newattributes[attrid] = {};
  newattributes[attrid].name = name;
  newattributes[attrid].value = value;
  
  $('#xml-tree').tree('updateNode', oldnode, {attributes: newattributes});
  
  closeXMLModal('#modal-editattribut');
}

function onCancelAttribut (event) {
  $('#attr-name').val('');
  $('#attr-value').val('');
  closeXMLModal('#modal-editattribut');
}

function renameStart(target) {
  $(target).removeClass('noedit');
  $(target).addClass('editing');
  $(target).children('input')[0].focus();
}

function onPressEnter(event) {
  if (event.keyCode === 13) {
    renameCommit(event);
  }
}

function renameRollback (event) {
  var target = event.target;
  var $parent = $(target).parent();
  var nodeid = $parent.parent().attr('data-id');
  var node = $('#xml-tree').tree('getNodeById', nodeid);
  
  $parent.removeClass('editing');
  $parent.addClass('noedit');
  
  $(target).val(node.name);
}

function renameCommit(event) {
  var target = event.target;
  var $parent = $(target).parent();
  var newname = $(target).val().replace(/[<>&]/g, '');
  $parent.removeClass('editing');
  $parent.addClass('noedit');
  if ( newname.length < 1 )
    return;
  var nodeid = $parent.parent().attr('data-id');
  var node = $('#xml-tree').tree('getNodeById', nodeid);
  $('#xml-tree').tree('updateNode', node, newname);
}

function genXML() {
  //var json = $('#xml-tree').tree('toJson');
  //var tree = JSON.parse(json);
  var tree = $('#xml-tree').tree('getTree').children[0];
  xmleditor.treedata = tree;
  var xmltext = "<?xml version='1.0'?>\n";
  if (tree)
    xmltext += buildBranchXML(tree);
  else
    alert("Whatever you're doing, you're doing it wrong!");
  //xmltext = xmltext.replace(/([^<>])\n\s*/g, '$1');
  return vkbeautify.xml(xmltext, 2);
}

function repeatString(str, times) {
  return new Array(times + 1).join('  ');
}

function escapeForXML(str, opt) {
  if (!opt)
    opt = {};
  str = '' + str;
  return str.replace(/&/g, opt.amp || '&amp;')
    .replace(/</g, opt.lt || '&lt;')
    .replace(/>/g, opt.gt || '&gt;')
    .replace(/"/g, opt.qout || '&qout;')
    .replace(/'/g, opt.apos || '&apos;');
}

function buildBranchXML(node, tabs, wastext) {
  if (node.istext) {
    node.name = escapeForXML(node.name, {"qout": '"', "apos": "'"});
    xmleditor.__genxml_wastext = true;
    //return repeatString('  ', tabs) + node.name + '\n';
    return node.name;
  }
  node.name = escapeForXML(node.name, {
    amp: '',
    lt: '',
    gt: '',
    qout: '',
    apos: ''
  });
  if (!tabs)
    tabs = 0;
  var xmltext = '<' + node.name;
  var attrtext = nodeAttributesToXML(node);
  if (attrtext !== '')
    xmltext += ' ' + attrtext;
  xmltext += '>';
  var i,
      wastext=false;
  for (i = 0; i < node.children.length; i++) {
    var child = node.children[i];
    xmltext += buildBranchXML(child, tabs + 1, wastext);
  }
  xmltext += '</' + node.name + '>';
  return xmltext;
}

function nodeAttributesToXML(node) {
  if (!node)
    return '';
  var i,
    attr_texts = new Array();
  for (i = 0; i < node.attributes.length; i++) {
    var attr = node.attributes[i];
    if (attr.name)
      attr.name = attr.name.replace(/\&\>\<\"\'/g, '');
    if (attr.value)
      attr.value = attr.value.replace(/\"/g, '&quot;');
    if (!attr.value)
      attr.value = "";
    if (!attr.name)
      continue;
    var attrtext = attr.name + "=" + '"' + attr.value + '"';
    attr_texts.push(attrtext);
  }
  return attr_texts.join(' ');
}

function showXMLModal(selector) {
  if(!$(selector).hasClass('xml-modal'))
    return;
  var $overlay = $('<div class="xml-modal-overlay" style="opacity: 0;"></div>'),
      $target  = $(selector);
  $target.css("opacity", 0);
  $target.css("display", "block");
  $overlay.appendTo('body');
  
  $overlay.animate({
    opacity: 1
  }, 300);
  $target.animate({
    opacity: 1
  }, 400);
}

function closeXMLModal (selector) {
  var $overlay = $('body').children('div.xml-modal-overlay'),
      $target  = $(selector);
  
  $target.animate({
    opacity: 0
  }, 400, function () {
    $target.css("display", "none");
  });
  
  $overlay.animate({
    opacity: 0
  }, 300, function () {
    $overlay.remove();
  });
  
}