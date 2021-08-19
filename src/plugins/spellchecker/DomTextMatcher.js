var isContentEditableFalse = function (node) {
  return node && node.nodeType === 1 && node.contentEditable === 'false';
};

var DomTextMatcher = function (node, editor) {
  var m, matches = [];
  var dom = editor.dom;
  var blockElementsMap = editor.schema.getBlockElements();
  var hiddenTextElementsMap = editor.schema.getWhiteSpaceElements();
  var shortEndedElementsMap = editor.schema.getShortEndedElements();
  var createMatch = function (m, data) {
    if (!m[0]) {
      throw new Error('findAndReplaceDOMText cannot handle zero-length matches');
    }
    return {
      start: m.index,
      end: m.index + m[0].length,
      text: m[0],
      data: data
    };
  };
  var getText = function (node) {
    var txt;
    if (node.nodeType === 3) {
      return node.data;
    }
    if (hiddenTextElementsMap[node.nodeName] && !blockElementsMap[node.nodeName]) {
      return '';
    }
    if (isContentEditableFalse(node)) {
      return '\n';
    }
    txt = '';
    if (blockElementsMap[node.nodeName] || shortEndedElementsMap[node.nodeName]) {
      txt += '\n';
    }
    if (node = node.firstChild) {
      do {
        txt += getText(node);
      } while (node = node.nextSibling);
    }
    return txt;
  };
  var stepThroughMatches = function (node, matches, replaceFn) {
    var startNode, endNode, startNodeIndex, endNodeIndex, innerNodes = [], atIndex = 0, curNode = node, matchLocation, matchIndex = 0;
    matches = matches.slice(0);
    matches.sort(function (a, b) {
      return a.start - b.start;
    });
    matchLocation = matches.shift();
    out:
      while (true) {
        if (blockElementsMap[curNode.nodeName] || shortEndedElementsMap[curNode.nodeName] || isContentEditableFalse(curNode)) {
          atIndex++;
        }
        if (curNode.nodeType === 3) {
          if (!endNode && curNode.length + atIndex >= matchLocation.end) {
            endNode = curNode;
            endNodeIndex = matchLocation.end - atIndex;
          } else if (startNode) {
            innerNodes.push(curNode);
          }
          if (!startNode && curNode.length + atIndex > matchLocation.start) {
            startNode = curNode;
            startNodeIndex = matchLocation.start - atIndex;
          }
          atIndex += curNode.length;
        }
        if (startNode && endNode) {
          curNode = replaceFn({
            startNode: startNode,
            startNodeIndex: startNodeIndex,
            endNode: endNode,
            endNodeIndex: endNodeIndex,
            innerNodes: innerNodes,
            match: matchLocation.text,
            matchIndex: matchIndex
          });
          atIndex -= endNode.length - endNodeIndex;
          startNode = null;
          endNode = null;
          innerNodes = [];
          matchLocation = matches.shift();
          matchIndex++;
          if (!matchLocation) {
            break;
          }
        } else if ((!hiddenTextElementsMap[curNode.nodeName] || blockElementsMap[curNode.nodeName]) && curNode.firstChild) {
          if (!isContentEditableFalse(curNode)) {
            curNode = curNode.firstChild;
            continue;
          }
        } else if (curNode.nextSibling) {
          curNode = curNode.nextSibling;
          continue;
        }
        while (true) {
          if (curNode.nextSibling) {
            curNode = curNode.nextSibling;
            break;
          } else if (curNode.parentNode !== node) {
            curNode = curNode.parentNode;
          } else {
            break out;
          }
        }
      }
  };
  var genReplacer = function (callback) {
    var makeReplacementNode = function (fill, matchIndex) {
      var match = matches[matchIndex];
      if (!match.stencil) {
        match.stencil = callback(match);
      }
      var clone = match.stencil.cloneNode(false);
      clone.setAttribute('data-mce-index', matchIndex);
      if (fill) {
        clone.appendChild(dom.doc.createTextNode(fill));
      }
      return clone;
    };
    return function (range) {
      var before;
      var after;
      var parentNode;
      var startNode = range.startNode;
      var endNode = range.endNode;
      var matchIndex = range.matchIndex;
      var doc = dom.doc;
      if (startNode === endNode) {
        var node_1 = startNode;
        parentNode = node_1.parentNode;
        if (range.startNodeIndex > 0) {
          before = doc.createTextNode(node_1.data.substring(0, range.startNodeIndex));
          parentNode.insertBefore(before, node_1);
        }
        var el = makeReplacementNode(range.match, matchIndex);
        parentNode.insertBefore(el, node_1);
        if (range.endNodeIndex < node_1.length) {
          after = doc.createTextNode(node_1.data.substring(range.endNodeIndex));
          parentNode.insertBefore(after, node_1);
        }
        node_1.parentNode.removeChild(node_1);
        return el;
      }
      before = doc.createTextNode(startNode.data.substring(0, range.startNodeIndex));
      after = doc.createTextNode(endNode.data.substring(range.endNodeIndex));
      var elA = makeReplacementNode(startNode.data.substring(range.startNodeIndex), matchIndex);
      for (var i = 0, l = range.innerNodes.length; i < l; ++i) {
        var innerNode = range.innerNodes[i];
        var innerEl = makeReplacementNode(innerNode.data, matchIndex);
        innerNode.parentNode.replaceChild(innerEl, innerNode);
      }
      var elB = makeReplacementNode(endNode.data.substring(0, range.endNodeIndex), matchIndex);
      parentNode = startNode.parentNode;
      parentNode.insertBefore(before, startNode);
      parentNode.insertBefore(elA, startNode);
      parentNode.removeChild(startNode);
      parentNode = endNode.parentNode;
      parentNode.insertBefore(elB, endNode);
      parentNode.insertBefore(after, endNode);
      parentNode.removeChild(endNode);
      return elB;
    };
  };
  var unwrapElement = function (element) {
    var parentNode = element.parentNode;
    while (element.childNodes.length > 0) {
      parentNode.insertBefore(element.childNodes[0], element);
    }
    parentNode.removeChild(element);
  };
  var hasClass = function (elm) {
    return elm.className.indexOf('mce-spellchecker-word') !== -1;
  };
  var getWrappersByIndex = function (index) {
    var elements = node.getElementsByTagName('*'), wrappers = [];
    index = typeof index === 'number' ? '' + index : null;
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i], dataIndex = element.getAttribute('data-mce-index');
      if (dataIndex !== null && dataIndex.length && hasClass(element)) {
        if (dataIndex === index || index === null) {
          wrappers.push(element);
        }
      }
    }
    return wrappers;
  };
  var indexOf = function (match) {
    var i = matches.length;
    while (i--) {
      if (matches[i] === match) {
        return i;
      }
    }
    return -1;
  };
  function filter(callback) {
    var filteredMatches = [];
    each(function (match, i) {
      if (callback(match, i)) {
        filteredMatches.push(match);
      }
    });
    matches = filteredMatches;
    return this;
  }
  function each(callback) {
    for (var i = 0, l = matches.length; i < l; i++) {
      if (callback(matches[i], i) === false) {
        break;
      }
    }
    return this;
  }
  function wrap(callback) {
    if (matches.length) {
      stepThroughMatches(node, matches, genReplacer(callback));
    }
    return this;
  }
  function find(regex, data) {
    if (text && regex.global) {
      while (m = regex.exec(text)) {
        matches.push(createMatch(m, data));
      }
    }
    return this;
  }
  function unwrap(match) {
    var i;
    var elements = getWrappersByIndex(match ? indexOf(match) : null);
    i = elements.length;
    while (i--) {
      unwrapElement(elements[i]);
    }
    return this;
  }
  var matchFromElement = function (element) {
    return matches[element.getAttribute('data-mce-index')];
  };
  var elementFromMatch = function (match) {
    return getWrappersByIndex(indexOf(match))[0];
  };
  function add(start, length, data) {
    matches.push({
      start: start,
      end: start + length,
      text: text.substr(start, length),
      data: data
    });
    return this;
  }
  var rangeFromMatch = function (match) {
    var wrappers = getWrappersByIndex(indexOf(match));
    var rng = editor.dom.createRng();
    rng.setStartBefore(wrappers[0]);
    rng.setEndAfter(wrappers[wrappers.length - 1]);
    return rng;
  };
  var replace = function (match, text) {
    var rng = rangeFromMatch(match);
    rng.deleteContents();
    if (text.length > 0) {
      rng.insertNode(editor.dom.doc.createTextNode(text));
    }
    return rng;
  };
  function reset() {
    matches.splice(0, matches.length);
    unwrap();
    return this;
  }
  var text = getText(node);

  function setMatches(mat) {
    matches = mat
    return this
  }
  
  return {
    text: text,
    setMatches,
    each: each,
    filter: filter,
    reset: reset,
    matchFromElement: matchFromElement,
    elementFromMatch: elementFromMatch,
    find: find,
    add: add,
    wrap: wrap,
    unwrap: unwrap,
    replace: replace,
    rangeFromMatch: rangeFromMatch,
    indexOf: indexOf
  };
};

export default DomTextMatcher