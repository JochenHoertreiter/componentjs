/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2012 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  debugger window  */
_cs.dbg = null;

/*  debugger update state  */
_cs.dbg_state_invalid = {
    components: false,
    states:     false,
    requests:   false,
    console:    false
};
_cs.dbg_state_invalidate = function (name) {
    _cs.dbg_state_invalid[name] = true;
};

/*  debugger console log  */
_cs.dbg_logline = 0;
_cs.dbg_logbook = "";

/*  log message to debugger console  */
_cs.dbg_log = function (msg) {
    if (_cs.dbg === null)
        return;
    msg = msg
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br/>");
    _cs.dbg_logline++;
    _cs.dbg_logbook +=
        "<table class=\"line\">" +
            "<tr>" +
                "<td class=\"num\">" + _cs.dbg_logline++ + ".</td>" +
                "<td class=\"msg\">" + msg + "</td>" +
            "</tr>" +
        "</table>";
    _cs.dbg_state_invalidate("console");
    _cs.dbg_update();
};

/*  debugger canvas: natural tree direction flag  */
_cs.dbg_natural = false;

/*  debugger API entry point  */
$cs.debugger = function () {
    /*  determine parameters  */
    var params = $cs.params("debugger", arguments, {
        enable:    { pos: 0, def: null  },
        autoclose: { pos: 1, def: false },
        name:      { pos: 2, def: null  },
        width:     {         def: 800   },
        height:    {         def: 600   },
        natural:   {         def: false }
    });

    /*  dispatch according to requested operation  */
    if (params.enable === null)
        /*  determine debugger state  */
        return (_cs.dbg !== null);
    else if (params.enable) {
        /*  remember natural rendering flag  */
        _cs.dbg_natural = params.natural;

        /*  enable debugger  */
        if (_cs.dbg === null) {
            /*  determine (potentially application specific) title  */
            var title = "ComponentJS Debugger";
            if (typeof params.name !== null)
                title += " (" + params.name + ")";

            /*  create external debugger window  */
            _cs.dbg = window.open("", title,
                "width=" + params.width + ",height=" + params.height + "," +
                "location=no,replace=yes,scrollbars=no,toolbars=no,menubar=no,status=no"
            );

            /*  initialize the window content (deferred to avoid problems)  */
            setTimeout(function () {
                _cs.jq(_cs.dbg.document).ready(function () {
                    /*  optionally automatically close debugger window with application window  */
                    if (params.autoclose) {
                        _cs.jq(GLOBAL.window).bind("beforeunload", function () {
                            if (_cs.dbg !== null)
                                _cs.dbg.close();
                        });
                    }

                    /*  create markup  */
                    _cs.jq("html", _cs.dbg.document).html(
                        "<html>" +
                        "    <head>" +
                        "        <title>" + title + "</title>" +
                        "        <style type=\"text/css\">" +
                        "            html, body {" +
                        "                margin: 0px;" +
                        "                padding: 0px;" +
                        "            }" +
                        "            .dbg {" +
                        "                width: 100%;" +
                        "                height: 100%;" +
                        "                font-family: Helvetica, Arial, sans-serif;" +
                        "                background-color: #e0e0e0;" +
                        "                overflow: hidden;" +
                        "                font-size: 9pt;" +
                        "            }" +
                        "            .dbg .header {" +
                        "                width: 100%;" +
                        "                height: 30px;" +
                        "                background-color: #000000;" +
                        "                text-align: center;" +
                        "                position: relative;" +
                        "            }" +
                        "            .dbg .header .text {" +
                        "                position: relative;" +
                        "                top: 6px;" +
                        "                color: #ffffff;" +
                        "                font-size: 12pt;" +
                        "                font-weight: bold;" +
                        "            }" +
                        "            .dbg .viewer {" +
                        "                width: 100%;" +
                        "                height: 50%;" +
                        "                background-color: #d0d0d0;" +
                        "                overflow: hidden;" +
                        "            }" +
                        "            .dbg .viewer canvas {" +
                        "                position: relative;" +
                        "                top: 10px;" +
                        "                left: 10px;" +
                        "                width: 100%;" +
                        "                height: 100%;" +
                        "            }" +
                        "            .dbg .status {" +
                        "                width: 100%;" +
                        "                height: 20px;" +
                        "                background-color: #666666;" +
                        "                color: #f0f0f0;" +
                        "                text-align: center;" +
                        "            }" +
                        "            .dbg .status .text {" +
                        "                position: relative;" +
                        "                top: 3px;" +
                        "                color: #ffffff;" +
                        "                font-size: 9pt;" +
                        "            }" +
                        "            .dbg .console {" +
                        "                width: 100%;" +
                        "                height: 50%;" +
                        "                background-color: #ffffff;" +
                        "                color: #000000;" +
                        "                overflow: scroll;" +
                        "                font-size: 9pt;" +
                        "            }" +
                        "            .dbg .console .text {" +
                        "                width: 100%;" +
                        "                height: auto;" +
                        "            }" +
                        "            .dbg .console .text .line {" +
                        "                border-collapse: collapse;" +
                        "                width: 100%;" +
                        "                border-bottom: 1px solid #d0d0d0;" +
                        "                font-size: 9pt;" +
                        "            }" +
                        "            .dbg .console .text .num {" +
                        "                width: 40px;" +
                        "                background-color: #f0f0f0;" +
                        "                text-align: right;" +
                        "            }" +
                        "            .dbg .console .text .msg {" +
                        "                padding-left: 10px;" +
                        "            }" +
                        "        </style>" +
                        "    </head>" +
                        "    <body>" +
                        "        <div class=\"dbg\">" +
                        "            <div class=\"header\"><div class=\"text\">" + title + "</div></div>" +
                        "            <div class=\"viewer\"><canvas></canvas></div>" +
                        "            <div class=\"status\"><div class=\"text\"></div></div>" +
                        "            <div class=\"console\"><div class=\"text\"></div></div>" +
                        "        </div>" +
                        "    </body>" +
                        "</html>"
                    )
                    _cs.dbg_refresh();
                    _cs.jq(_cs.dbg).bind("resize", function () {
                        _cs.dbg_refresh();
                    });
                });
            }, 500);
        }
        $cs.debug(3, "debugger enabled");
    }
    else {
        /*  disable debugger  */
        if (_cs.dbg !== null) {
            $cs.debug(3, "debugger disabled");
            _cs.dbg.close();
            _cs.dbg = null;
        }
    }
};

/*  refresh the browser rendering  */
_cs.dbg_refresh = function () {
    /*  expand to viewport width/height  */
    var vw = _cs.jq(_cs.dbg).width();
    var vh = _cs.jq(_cs.dbg).height();
    _cs.jq("dbg", _cs.dbg.document).width(vw);
    _cs.jq("dbg", _cs.dbg.document).height(vh);

    /*  expand viewer and console to half of the viewport height  */
    var h = vh - (
        _cs.jq(".dbg .header", _cs.dbg.document).height() +
        _cs.jq(".dbg .status", _cs.dbg.document).height()
    );
    var h1 = Math.ceil(h / 2);
    var h2 = Math.floor(h / 2);
    _cs.jq(".dbg .viewer",  _cs.dbg.document).height(h1);
    _cs.jq(".dbg .console", _cs.dbg.document).height(h2);

    /*  explicitly set the canvas size of the viewer  */
    _cs.jq(".dbg .viewer canvas", _cs.dbg.document).height(h1 - 20);
    _cs.jq(".dbg .viewer canvas", _cs.dbg.document).attr("height", h1 - 20);
    _cs.jq(".dbg .viewer canvas", _cs.dbg.document).width(vw - 20);
    _cs.jq(".dbg .viewer canvas", _cs.dbg.document).attr("width", vw - 20);

    /*  trigger an initial update  */
    _cs.dbg_update();
};

/*  update the debugger rendering  */
_cs.dbg_timer = null;
_cs.dbg_update = function () {
    if (_cs.dbg === null)
        return;
    if (_cs.dbg_timer === null) {
        _cs.dbg_timer = setTimeout(function () {
            _cs.dbg_update_once();
            _cs.dbg_timer = null;
        }, 250);
    }
};

/*  update the debugger rendering  */
_cs.dbg_update_once = function () {
    /*  update console information  */
    if (_cs.dbg_state_invalid.console) {
        _cs.jq(".dbg .console .text", _cs.dbg.document).html(_cs.dbg_logbook);
        _cs.jq(".dbg .console", _cs.dbg.document).scrollTop(
            _cs.jq(".dbg .console .text", _cs.dbg.document).height() 
        );
        _cs.dbg_state_invalid.console = true;
    }

    /*  update component information  */
    if (   _cs.dbg_state_invalid.components
        || _cs.dbg_state_invalid.requests
        || _cs.dbg_state_invalid.states    ) {

        /*  walk the component tree to determine information about components  */
        var D, W, T;
        if (_cs.dbg_state_invalid.components || _cs.dbg_state_invalid.states) {
            D = _cs.root.walk_down(function (level, comp, D, depth_first) {
                if (!depth_first) {
                    /*  on downward walking, annotate component with its depth level
                        and calculcate the maximum depth level at all  */
                    _cs.annotation(comp, "debugger_depth", level);
                    D = (level > D ? level : D);
                }
                else {
                    /*  on upward walking, aggregate the width and total counts  */
                    var width = 0;
                    var total = 0;
                    var children = comp.children();
                    for (var i = 0; i < children.length; i++) {
                        width += _cs.annotation(children[i], "debugger_width");
                        total += _cs.annotation(children[i], "debugger_total");
                    }
                    if (total == 0)
                        width++;
                    total++;
                    _cs.annotation(comp, "debugger_width", width);
                    _cs.annotation(comp, "debugger_total", total);
                }
                return D;
            }, 1);
            W = _cs.annotation(_cs.root, "debugger_width");
            T = _cs.annotation(_cs.root, "debugger_total");
        }

        /*  status update  */
        if (_cs.dbg_state_invalid.components || _cs.dbg_state_invalid.requests) {

            /*  determine pending state transition requests  */
            var reqs = 0;
            for (var cid in _cs.state_requests) {
                if (!_cs.isown(_cs.state_requests, cid))
                    continue;
                reqs++;
            }

            /*  update status line  */
            _cs.jq(".dbg .status .text", _cs.dbg.document).html(
                "Created Components: <b>" + T + "</b>, " +
                "Pending Transition Requests: <b>" + reqs + "</b>"
            );

            _cs.dbg_state_invalid.requests = true;
        }

        /*  viewer update  */
        if (_cs.dbg_state_invalid.components || _cs.dbg_state_invalid.states) {

            /*  ensure the canvas (already) exists  */
            var ctx = _cs.jq(".dbg .viewer canvas", _cs.dbg.document).get(0)
            if (typeof ctx === "undefined")
                return;
            ctx = ctx.getContext("2d");

            /*  determine canvas width/height and calculate grid width/height and offset width/height  */
            var ch = _cs.jq(".dbg .viewer canvas", _cs.dbg.document).height();
            var cw = _cs.jq(".dbg .viewer canvas", _cs.dbg.document).width();
            var gw = Math.floor(cw / (W+1));
            var gh = Math.floor(ch / (D+1));
            var ow = Math.floor(gw / 8);
            var oh = Math.floor(gh / 3);

            /*  clear the canvas as we redraw everything  */
            ctx.clearRect(0, 0, cw, ch);

            /*  walk the component tree to draw each component (on upward steps only)  */
            _cs.root.walk_down(function (level, comp, X, depth_first) {
                if (depth_first) {
                    /*  grab previously calculated information  */
                    var d = _cs.annotation(comp, "debugger_depth");
                    var w = _cs.annotation(comp, "debugger_width");
                    var t = _cs.annotation(comp, "debugger_total");
                    var my_x, my_y, my_w, my_h;

                    if (t == 1) {
                        /*  CASE 1: leaf node  */
                        my_x = gw * X++;
                        if (_cs.dbg_natural)
                            my_y = ch - gh * d - gh;
                        else
                            my_y = gh * d;
                        my_w = gw - ow;
                        my_h = gh - oh;
                    }
                    else {
                        /*  CASE 2: intermediate node  */
                        var children = comp.children();

                        /*  determine boundaries for x position  */
                        var minx = _cs.annotation(children[0], "debugger_x");
                        var miny = _cs.annotation(children[0], "debugger_y");
                        var maxx = minx;
                        var maxy = miny;
                        if (children.length > 1) {
                            maxx = _cs.annotation(children[children.length - 1], "debugger_x");
                            maxy = _cs.annotation(children[children.length - 1], "debugger_y");
                        }

                        /*  calculate our information  */
                        my_x = minx + Math.ceil((maxx - minx) / 2);
                        if (_cs.dbg_natural)
                            my_y = ch - gh * d - gh;
                        else
                            my_y = gh * d;
                        my_w = gw - ow;
                        my_h = gh - oh;

                        /*  draw line from component to each child component  */
                        for (var i = 0; i < children.length; i++) {
                            var child_x = _cs.annotation(children[i], "debugger_x");
                            var child_y = _cs.annotation(children[i], "debugger_y");
                            var child_w = _cs.annotation(children[i], "debugger_w");
                            var child_h = _cs.annotation(children[i], "debugger_h");
                            ctx.strokeStyle = "#999999";
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            if (_cs.dbg_natural) {
                                ctx.moveTo(my_x + Math.ceil(my_w / 2), my_y);
                                ctx.lineTo(my_x + Math.ceil(my_w / 2), my_y - Math.ceil(oh / 2));
                                ctx.lineTo(child_x + Math.ceil(child_w / 2), my_y - Math.ceil(oh / 2));
                                ctx.lineTo(child_x + Math.ceil(child_w / 2), child_y + my_h);
                            }
                            else {
                                ctx.moveTo(my_x + Math.ceil(my_w / 2), my_y + my_h);
                                ctx.lineTo(my_x + Math.ceil(my_w / 2), my_y + my_h + Math.ceil(oh / 2));
                                ctx.lineTo(child_x + Math.ceil(child_w / 2), my_y + my_h + Math.ceil(oh / 2));
                                ctx.lineTo(child_x + Math.ceil(child_w / 2), child_y);
                            }
                            ctx.stroke();
                        }
                    }

                    /*  draw component background  */
                    if (_cs.marked(comp.obj(), "generic"))
                        ctx.fillStyle = "#003366";
                    else
                        ctx.fillStyle = "#333333";
                    ctx.fillRect(my_x, my_y, my_w, my_h);
                    if (_cs.marked(comp.obj(), "generic"))
                        ctx.fillStyle = "#336699";
                    else
                        ctx.fillStyle = "#666666";
                    ctx.fillRect(my_x, my_y + my_h / 2, my_w, my_h / 2);

                    /*  draw component state indicator bulp  */
                    ctx.fillStyle = _cs.states[comp.__state].color;
                    ctx.beginPath();
                    ctx.arc(my_x + my_w - (my_h / 4) - 1, my_y + 3 * (my_h / 4), (my_h / 4) - 3, 0, 2 * Math.PI, true); 
                    ctx.closePath();
                    ctx.fill();

                    /*  common text rendering  */
                    var renderText = function (text, color, x, y, width) {
                        ctx.fillStyle = color;
                        var metric = ctx.measureText(text);
                        if (metric.width > width) {
                            while (text !== "") {
                                metric = ctx.measureText(text + "...");
                                if (metric.width <= width) {
                                    text += "...";
                                    break;
                                }
                                text = text.substr(0, text.length - 1);
                            }
                        }
                        ctx.fillText(text, x, y, width);
                    }

                    /*  draw component type indicators  */
                    var type = "";
                    if (_cs.marked(comp.obj(), "view"))       type += "V";
                    if (_cs.marked(comp.obj(), "model"))      type += "M";
                    if (_cs.marked(comp.obj(), "controller")) type += "C";
                    if (_cs.marked(comp.obj(), "cross"))      type += "X";
                    if (_cs.marked(comp.obj(), "service"))    type += "S";
                    var width = 0;
                    if (type !== "") {
                        ctx.font = "bold " + ((my_h / 2) * 0.7) + "px Helvetica, Arial, sans-serif";
                        ctx.textBaseline = "top";
                        var color = _cs.marked(comp.obj(), "generic") ? "#99ccff" : "#cccccc";
                        var metric = ctx.measureText(type);
                        renderText(type, color, my_x + my_w - metric.width - 4, my_y + 2, metric.width);
                        width = metric.width;
                    }

                    /*  draw component information (name and state)  */
                    ctx.font = ((my_h / 2) * 0.7) + "px Helvetica, Arial, sans-serif";
                    ctx.textBaseline = "top";
                    renderText(comp.name(),  "#ffffff", my_x + 4, my_y + 2, my_w - width - 8);
                    var color = _cs.marked(comp.obj(), "generic") ? "#ccccff" : "#cccccc";
                    renderText(comp.state(), color, my_x + 4, my_y + (my_h / 2) + 2, my_w - (my_h / 2) - 8);

                    /*  provide our information to the parent component  */
                    _cs.annotation(comp, "debugger_x", my_x);
                    _cs.annotation(comp, "debugger_y", my_y);
                    _cs.annotation(comp, "debugger_w", my_w);
                    _cs.annotation(comp, "debugger_h", my_h);
                }

                /*  pass-through the global X position  */
                return X;
            }, 0);
        }

        _cs.dbg_state_invalid.components = true;
        _cs.dbg_state_invalid.states     = true;
    }
};
