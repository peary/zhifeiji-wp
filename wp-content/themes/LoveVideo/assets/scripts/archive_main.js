define("lib/plugins/search", ["jquery"],
function() {
    var search = function(opts) {
        var defs = {
            csses: {
                so_main: ".pps-so",
                so_panel: ".pps-so-panel",
                so_suggest: ".pps-so-suggest",
                so_suggest_list: ".suggest-list",
                so_suggest_list_item: ".item",
                so_suggest_list_item_select: "li.select",
                so_suggest_list_item_state: "select",
                so_suggest_list_1st_item: ".result",
                so_suggest_list_2st_item: ".update",
                suggest_list_item_key: ".key",
                so_input: ".input",
                so_submit_btn: ".button"
            },
            datas: {
                search_data_url: "http://suggest.video.qiyi.com/?if=pps",
                search_keywords_url: "v2.pps.tv" === location.host ? "http://v.pps.tv/ugc/ajax/ugc_inputword.php": "http://v.pps.tv/ugc/ajax/ugc_inputword.php",
                keyword_interval: 1e4
            }
        };
        this.opts = $.extend({},
        defs, opts);
        this.doms = {};
        this.datas = {};
        this.datas.send_cache = {};
        this.datas.link_info_cache = "";
        this.datas.resave_cache = {}
    };
    search.prototype = {
        constructor: search,
        init: function() {
            var csses = this.opts.csses;
            this.doms.so_main = $(csses.so_main);
            this.doms.so_suggest = this.doms.so_main.find(csses.so_suggest);
            this.doms.so_suggest_list = this.doms.so_suggest.find(csses.so_suggest_list);
            this.doms.so_input = this.doms.so_main.find(csses.so_input).attr({
                autocomplete: "off"
            }).val("找视频");
            this.bindEvent();
            this.getKeywordsData()
        },
        renderSuggest: function(data, key_value) {
            var html = "",
            i = null,
            len = null,
            key_value_re = new RegExp(key_value, "i");
            if (data && data.length > 0) {
                for (i = 0, len = data.length; len > i; i++) {
                    var href = (data[i].link || "http://so.iqiyi.com/pps/?q=" + encodeURIComponent(data[i].name)) + "#from_input_search";
                    html += '<li class="item"><a class="result" href="' + href + '" target="_blank"><span class="key">' + data[i].name.replace(key_value_re, "<b>" + key_value + "</b>") + "</span>" + (data[i].cname ? '<span class="type">(' + data[i].cname + ")</span>": "") + "</a></li>";
                    parseInt(data[i].update) && (html += 0 != parseInt(data[i].update) ? '<li class="item"><a class="update" href="' + (data[i].firstLink ? data[i].firstLink: data[i].recentLink) + '#from_input_search" target="_blank"><span class="ico-dot"></span>更新至第' + data[i].update + ("综艺" == data[i].cname ? "": "集") + "</a></li>": "")
                }
                return html
            }
            return ""
        },
        getKeywordsData: function() {
            var self = this,
            datas = this.opts.datas;
            self.datas.hasKeywords = !1;
            self.datas.keyword_index = 0;
            $.ajax({
                type: "get",
                dataType: "jsonp",
                jsonp: "callback",
                jsonpCallback: "so_tip_callback",
                cache: !0,
                url: datas.search_keywords_url,
                success: function(data) {
                    if (data && data.length > 0) {
                        self.datas.hasKeywords = !0;
                        self.datas.keywords = data;
                        self.initKeywords()
                    }
                }
            })
        },
        initKeywords: function() {
            this.showKeyword();
            this.startShowKeyword()
        },
        startShowKeyword: function() {
            var self = this,
            datas = this.opts.datas;
            this.datas.keyword_timer = setTimeout(function() {
                self.getNextKeyword();
                self.showKeyword();
                self.startShowKeyword()
            },
            datas.keyword_interval)
        },
        stopShowKeyword: function() {
            this.datas.keyword_timer && clearTimeout(this.datas.keyword_timer)
        },
        showKeyword: function() {
            var doms = this.doms,
            csses = this.opts.csses;
            doms.so_main.find(csses.so_input).val(this.datas.keywords[this.datas.keyword_index].title)
        },
        getNextKeyword: function() {
            var _keyword_len = this.datas.keywords.length;
            this.datas.keyword_index++>_keyword_len - 2 && (this.datas.keyword_index = 0)
        },
        isKeyword: function(keyword) {
            var keywords = "",
            len = 0;
            if ("" !== keyword && this.datas.hasKeywords) {
                keywords = this.datas.keywords;
                len = keywords.length;
                for (; len--;) if (keywords[len].title === keyword) return ! 0
            }
            return ! 1
        },
        getData: function(key_value) {
            var self = this,
            datas = this.opts.datas;
            if (!this.datas.send_cache[key_value]) {
                this.datas.send_cache[key_value] = !0;
                $.ajax({
                    type: "get",
                    dataType: "jsonp",
                    data: "key=" + encodeURIComponent(key_value),
                    jsonp: "jsonp",
                    scriptCharset: "UTF-8",
                    cache: !0,
                    url: datas.search_data_url,
                    success: function(data) {
                        "A00000" == data.code && self.resetSoData(data, key_value)
                    }
                })
            }
        },
        resetSoData: function(data, key_value) {
            var html = null,
            parse_data = null;
            this.opts.csses;
            if (data) {
                parse_data = data.data;
                if (parse_data) {
                    html = this.renderSuggest(parse_data, key_value);
                    if (html) {
                        this.datas.resave_cache[key_value] = html;
                        this.doms.so_suggest.show();
                        this.doms.so_suggest_list.html(html)
                    }
                } else {
                    this.doms.so_suggest.hide();
                    this.doms.so_suggest_list.empty()
                }
            }
        },
        beforeSend: function(key_value, keyCode) {
            var self = this,
            doms = this.doms,
            csses = this.opts.csses;
            if (key_value) {
                if (40 != keyCode && 39 != keyCode && 38 != keyCode && 37 != keyCode && 13 != keyCode) if (this.datas.resave_cache[key_value]) {
                    doms.so_suggest.show();
                    doms.so_suggest_list.html(this.datas.resave_cache[key_value])
                } else {
                    doms.so_suggest.hide();
                    doms.so_suggest_list.empty();
                    this.getData(key_value)
                } else if ("block" === doms.so_suggest.css("display")) {
                    var idx, cur_selected, select_txt, items = doms.so_suggest_list.children(csses.so_suggest_list_item),
                    items_len = items.length,
                    $select_item = doms.so_suggest_list.children(csses.so_suggest_list_item_select);
                    if (40 == keyCode || 38 == keyCode) {
                        idx = $select_item.size() ? 40 == keyCode ? items.eq($select_item.index() + 1).find(csses.so_suggest_list_2st_item).length > 0 ? $select_item.index() + 2 : $select_item.index() + 1 : items.eq($select_item.index() - 1).find(csses.so_suggest_list_2st_item).length > 0 ? $select_item.index() - 2 : $select_item.index() - 1 : 40 == keyCode ? 0 : items_len - 1;
                        idx > items_len - 1 && (idx = 0);
                        cur_selected = items.removeClass(csses.so_suggest_list_item_state).eq(idx).addClass(csses.so_suggest_list_item_state).find(csses.suggest_list_item_key);
                        select_txt = cur_selected.text();
                        if (select_txt) self.datas.link_info_cache = {
                            title: select_txt,
                            link: cur_selected.parent().attr("href")
                        };
                        else {
                            select_txt = items.eq(idx - 1).find(csses.suggest_list_item_key).text();
                            self.datas.link_info_cache = {
                                title: select_txt,
                                link: items.eq(idx).find(csses.so_suggest_list_1st_item).attr("href")
                            }
                        }
                        doms.so_input.val(select_txt)
                    } else if (13 == keyCode && $select_item.size()) {
                        doms.so_input.val($select_item.find(csses.suggest_list_item_key).text());
                        doms.so_suggest.hide()
                    } else 8 == keyCode && (self.datas.link_info_cache = null)
                }
            } else doms.so_suggest.hide()
        },
        bindEvent: function() {
            var self = this,
            doms = this.doms,
            csses = this.opts.csses,
            _hide_suggest_tag = !1;
            doms.so_main.on("focus", csses.so_input,
            function() {
                self.stopShowKeyword();
                self.isKeyword($(this).val()) ? $(this).val("") : self.beforeSend($(this).val());
                "找视频" === $(this).val() && $(this).val("")
            }).on("keyup", csses.so_input,
            function(event) {
                var keyCode = event.keyCode || event.which;
                self.beforeSend($(this).val(), keyCode)
            }).on("blur", csses.so_input,
            function() {
                if (!_hide_suggest_tag) {
                    "" === $(this).val() && $(this).val("找视频");
                    self.datas.hasKeywords && self.startShowKeyword();
                    doms.so_suggest.hide()
                }
            }).on("mouseenter", csses.so_suggest,
            function() {
                _hide_suggest_tag = !0
            }).on("mouseleave", csses.so_suggest,
            function() {
                _hide_suggest_tag = !1
            }).on("mouseenter", csses.so_suggest_list_item,
            function() {
                $(this).addClass("select")
            }).on("mouseleave", csses.so_suggest_list_item,
            function() {
                $(this).removeClass("select")
            }).on("click", "a",
            function() {
                doms.so_suggest.hide()
            }).on("click", csses.so_submit_btn,
            function() {
                self.datas.link_info_cache = null
            })
        }
    };
    return search
});
define("lib/cookie/cookie", [],
function() {
    return {
        set: function(sName, sValue, oExpires, sPath, sDomain, bSecure) {
            try {
                var sCookie = sName + "=" + encodeURIComponent(sValue);
                oExpires && (sCookie += "; expires=" + oExpires.toGMTString());
                sPath && (sCookie += "; path=" + (sPath || "/"));
                sDomain && (sCookie += "; domain=" + (sDomain || "pps.tv"));
                bSecure && (sCookie += "; secure");
                document.cookie = sCookie
            } catch(e) {
                throw new Error("Cookie设置失败！")
            }
        },
        get: function(check_name) {
            for (var a_all_cookies = document.cookie.split(";"), a_temp_cookie = "", cookie_name = "", cookie_value = "", b_cookie_found = !1, i = 0; i < a_all_cookies.length; i++) {
                a_temp_cookie = a_all_cookies[i].split("=");
                cookie_name = a_temp_cookie[0] && a_temp_cookie[0].replace(/^\s+|\s+$/g, "");
                if (cookie_name == check_name) {
                    b_cookie_found = !0;
                    a_temp_cookie.length > 1 && (cookie_value = decodeURIComponent(a_temp_cookie[1] && a_temp_cookie[1].replace(/^\s+|\s+$/g, "")));
                    return cookie_value
                }
                a_temp_cookie = null;
                cookie_name = ""
            }
            return b_cookie_found ? void 0 : null
        },
        clear: function(sName, sPath, sDomain) {
            sName && this.set(sName, "", new Date(0), sPath || "/", sDomain || "pps.tv")
        }
    }
});
define("lib/var/navigator", [],
function() {
    return navigator
});
define("lib/var/userAgent", ["./navigator"],
function(navigator) {
    return navigator.userAgent
});
define("lib/plugins/basicDialog", ["jquery", "lib/var/userAgent"],
function($, ua) {
    var dialog = function(opts) {
        var defs = {
            content: {
                tab_tit: ["注册", "登录"],
                tab_cont: ["cont1", "cont2"],
                width: 625,
                height: 800,
                tab_def_index: 0,
                anim_time: 600,
                zIndex: 800
            },
            csses: {
                dialog_close: ".dialog-close",
                tab: ".reg-tab-list",
                tab_item: ".item",
                tab_item_state: "select",
                dialog_bd: ".reg-bd",
                dialog_hd: ".reg-hd",
                dialog_item: ".dialog_item"
            },
            data: {},
            callback: {
                before: function() {},
                close: function() {}
            }
        };
        this.opts = $.extend({},
        defs, opts);
        this.datas = {};
        this.doms = {}
    };
    dialog.prototype = {
        constructor: dialog,
        init: function() {
            var content = this.opts.content;
            this.doms.dialog_main = $('<div class="dialog dialog-sya"><div class="dialog-bd"><div class="dialog-main"><div class="reg-sya"><div class="reg-hd"><ul class="reg-tab-list"><li class="item select">注册</li></ul></div><div class="reg-bd"></div></div></div></div><div class="dialog-close"><a href="#" title="关闭">关闭</a></div></div>');
            content.width && content.height && this.doms.dialog_main.css({
                width: content.width,
                height: content.height
            });
            this.renderMash();
            this.positionMash();
            this.renderDialog();
            this.positionDialog();
            this.doms.dialog_main.hide()
        },
        renderMash: function() {
            var _ua = ua.match(new RegExp("(MSIE) (\\d+)\\.(\\d+)"));
            this.doms.mask = _ua && _ua.length > 0 && "MSIE" === _ua[1] && parseInt(_ua[2]) < 8 ? jQuery('<iframe style="opacity:0.3;-moz-opacity:0.3;filter:alpha(opacity=30);background:#000;position:absolute;top:0;left:0z-index:800;display:none;"></iframe>') : jQuery('<div style="opacity:0.3;-moz-opacity:0.3;filter:alpha(opacity=30);background:#000;position:absolute;top:0;left:0;display:none"></div>')
        },
        renderDialog: function() {
            var opts = this.opts,
            csses = opts.csses,
            content = opts.content,
            _tit_cont = "",
            _bd_cont = "";
            content.tab_tit && $.each(content.tab_tit,
            function(index, data) {
                _tit_cont += '<li class="item ' + (index == content.tab_def_index ? "select": "") + '">' + data + "</li>"
            });
            content.tab_cont && $.each(content.tab_cont,
            function(index, data) {
                _bd_cont += '<div class="dialog_item" ' + (index == content.tab_def_index ? "": 'style="display:none;"') + ">" + data + "</div>"
            });
            this.doms.dialog_main.find(csses.tab).html(_tit_cont);
            this.doms.dialog_main.find(csses.dialog_bd).html(_bd_cont)
        },
        positionMash: function() {
            var _doc_pos = {
                height: $(document).height(),
                width: $(document).width(),
                zIndex: this.opts.content.zIndex
            };
            this.doms.mask.css(_doc_pos)
        },
        positionDialog: function() {
            var doms = this.doms,
            _win_pos = {},
            _dialog_pos = {};
            _dialog_pos.width = doms.dialog_main.width();
            _dialog_pos.height = doms.dialog_main.height();
            _win_pos.width = $(window).width();
            _win_pos.height = $(window).height();
            doms.dialog_main.css({
                left: (_win_pos.width - _dialog_pos.width) / 2,
                top: $(document).scrollTop() + (_win_pos.height - _dialog_pos.height) / 2,
                zIndex: this.opts.content.zIndex + 1
            })
        },
        render: function() {
            var callback = this.opts.callback;
            this.init();
            callback && callback.before && $.isFunction(callback.before) && callback.before(this.doms.dialog_main, this);
            $("body").append(this.doms.mask).append(this.doms.dialog_main);
            this.animDialog("init");
            this.bindEvent()
        },
        animDialog: function(str) {
            var self = this,
            opts = this.opts,
            content = (opts.csses, opts.content),
            doms = this.doms,
            _mash_opc = (this.datas, .4),
            _dl_opc = 1;
            if ("init" === str) {
                doms.mask.show().css({
                    opacity: 0
                });
                doms.dialog_main.show().css({
                    opacity: 0
                })
            } else {
                _mash_opc = 0;
                _dl_opc = 0
            }
            doms.mask.animate({
                opacity: _mash_opc
            },
            content.anim_time,
            function() {
                "init" !== str && self.destoryMash()
            });
            doms.dialog_main.animate({
                opacity: _dl_opc
            },
            content.anim_time,
            function() {
                "init" !== str && self.destoryDialog()
            })
        },
        destoryMash: function() {
            this.doms.mask.remove()
        },
        destoryDialog: function() {
            this.doms.dialog_main.remove();
            this.doms = null;
            this.datas = null;
            this.opts = null
        },
        destoryAll: function() {
            var callback = this.opts.callback;
            callback && callback.close && $.isFunction(callback.close) && callback.close(this.doms.dialog_main, this);
            this.animDialog()
        },
        initSwichTab: function() {
            var opts = this.opts,
            csses = opts.csses,
            doms = (opts.content, this.doms);
            doms.dialog_main.find(csses.dialog_hd).find(csses.tab_item).each(function(index) {
                $(this).data("index", index)
            });
            this.doms.dialog_Items = doms.dialog_main.find(csses.dialog_item)
        },
        dialogItemSwitch: function(index) {
            this.doms.dialog_Items.hide().eq(index).show()
        },
        bindEvent: function() {
            var self = this,
            opts = this.opts,
            csses = opts.csses,
            content = opts.content,
            doms = this.doms;
            if (content.tab_tit && content.tab_tit.length > 1) {
                self.initSwichTab();
                doms.dialog_main.find(csses.dialog_hd).on("click", csses.tab_item,
                function(event) {
                    event.preventDefault();
                    $(this).addClass(csses.tab_item_state).siblings().removeClass(csses.tab_item_state);
                    self.dialogItemSwitch($(this).data("index"))
                })
            }
            doms.dialog_main.on("click", csses.dialog_close,
            function(event) {
                event.preventDefault();
                self.destoryAll()
            });
            $(window).on("resize",
            function() {
                if (self.doms) {
                    self.positionDialog();
                    self.positionMash()
                }
            })
        }
    };
    return dialog
});
define("lib/flash/basic", [],
function() {
    return {
        getSwf: function(name) {
            var chartRef;
            chartRef = -1 == navigator.appName.indexOf("Microsoft Internet") ? document.embeds && document.embeds[name] ? navigator.userAgent.indexOf("Firefox") > 0 ? document.embeds[id] : window[name] : window.document[name] : window[name];
            return chartRef
        }
    }
});
define("lib/plugins/playerRecording", ["jquery", "lib/cookie/cookie", "lib/flash/basic", "swfobject"],
function($, cookie) {
    var playerRecording = {
        _datas: {
            unurl: "http://nl.rcd.iqiyi.com/apis/urc/",
            url: " http://l.rcd.iqiyi.com/apis/qiyirc/",
            routes: ["setrc", "getrc", "getdetail", "delrc", "delall"],
            playingTime: 0,
            video_width: null,
            video_dom_type: null,
            startTimer: null,
            init_recording: !1,
            _page_type: "hasPlayer",
            terminalId: {
                pc_web: 11,
                pc_app: 12,
                pad_h5: 21,
                pad_app: 22,
                ph_h5: 31,
                ph_app: 32
            },
            _try_time: 0,
            _try_max_times: 5
        },
        _doms: {
            video_dom: null,
            record_main_elem: null,
            panel_html: '<div class="drop-tips-sya"><div class="records-order"></div><div class="act act-syb"><a class="more" href="#">查看更多</a><a title="清空" class="dels" href="#">清空</a></div><div class="ico-tips-sya-arrow"> <b class="line">◆</b> <b class="arrow">◆</b> </div></div>'
        },
        _csses: {
            drop_panel: ".drop-panel",
            record_main_elem: ".play-records",
            more: ".more",
            dels: ".dels",
            player_flash: "#myDynamicContent",
            player_h5: "video",
            records_order: ".records-order",
            act: ".act",
            drop_list_item: ".dd",
            record_main_state: "drop-down-open",
            drop_down: ".drop-down",
            drop_list_item_state: "hover"
        },
        getJSONP: function(url, obj, callback) {
            var sc = document.createElement("script"),
            hd = document.getElementsByTagName("head")[0],
            str = "cb" + +new Date,
            cb = "",
            s = null;
            for (s in obj) cb += "&" + s + "=" + obj[s];
            cb = url + "?cb=" + str + cb;
            sc.type = "text/javascript";
            sc.src = cb;
            sc.async = !0;
            sc.onload = sc.onreadystatechange = function() {
                sc.onload = sc.onreadystatechange = null;
                setTimeout(function() {
                    callback && callback(window[str]);
                    hd.removeChild(sc)
                },
                1e3)
            };
            hd.appendChild(sc)
        },
        checkLogin: function() {
            return !! cookie.get("P00001")
        },
        checkPageType: function() {
            var _href = document.href,
            _v_page_re = /\/play_/i;
            this._datas._page_type = _v_page_re.test(_href) ? "hasPlayer": "defPage"
        },
        checkHasPlayer: function() {
            return "hasPlayer" === this._datas._page_type ? !0 : !1
        },
        playRecordingRefresh: function() {
            this._datas.init_recording = !1
        },
        playRecordingInit: function() {
            var _csses = this._csses;
            this.setSwf();
            if ($(_csses.record_main_elem).length > 0) {
                this._doms.record_main_elem = $(_csses.record_main_elem);
                this._doms.record_main_elem.find(_csses.drop_panel).html(this._doms.panel_html);
                this.bindDefEvent()
            }
            this.checkPageType();
            if (this.checkHasPlayer()) {
                this.getPlayerElem();
                this._datas.upload_id = "undefined" != typeof video && video.upload_id;
                this._datas.video_width = "undefined" != typeof video && Math.floor(video.time / 1e3) - 2;
                this._datas.new_title = "undefined" != typeof video && video.new_title;
                this._datas.sid = "undefined" != typeof video && video.sid || "";
                this.calcuRecordingInterval();
                this.bindHasPlayerEvent()
            }
        },
        initRecording: function() {
            this.renderLoading();
            this.checkLogin() ? this.initLogined() : this.initUnlogin()
        },
        getPlayerElem: function() {
            var self = this;
            this.tryGetVieoElem() || (this.datas._getVideoTimer = setTimeout(function() {
                if (this.tryGetVieoElem()) {
                    self.setRecord( - 1, !1);
                    self.startCheckPlay();
                    self.clearGetVideoElemTimer()
                } else self._datas._try_time++<self._datas._try_max_times && self.getPlayerElem()
            },
            1e3))
        },
        clearGetVideoElemTimer: function() {
            this.datas._getVideoTimer && clearTimeout(this.datas._getVideoTimer)
        },
        tryGetVieoElem: function() {
            var _csses = {
                player_flash: "#myDynamicContent",
                player_h5: "video"
            };
            if ($(_csses.player_flash).length > 0) {
                this._datas.video_dom_type = "flashPlayer";
                this._doms.video_dom = $(_csses.player_flash);
                return ! 0
            }
            if ($(_csses.player_h5).length > 0) {
                this._datas.video_dom_type = "h5Player";
                this._doms.video_dom = $(_csses.player_h5);
                return ! 0
            }
            return ! 1
        },
        initUnlogin: function() {
            "v2.pps.tv" !== location.host;
            this.renderLoading();
            this.getUnloginRecord()
        },
        calcuRecordingInterval: function() {
            var interTime = {
                shortVideo: 30,
                midVideo: 120,
                longVideo: 360
            },
            videoTime = this._datas.video_width / 1e3;
            this._datas.sendInterTime = 360;
            videoTime > interTime.shortVideo ? this._datas.sendInterTime = 30 : videoTime > interTime.midVideo ? this._datas.sendInterTime = 60 : videoTime > interTime.longVideo && (this._datas.sendInterTime = interTime.longVideo)
        },
        initLogined: function() {
            this.getRecord();
            this.mergeRecordData()
        },
        renderLoading: function() {
            var record_main_elem = this._doms.record_main_elem,
            _csses = this._csses,
            html = '<p class="loading">正在努力加载播放历史噢～</p>';
            this.removeLoading();
            this.removeNoData();
            this.removeRecordMore();
            this.removeClearAll();
            record_main_elem.find(_csses.more).attr({
                href: "http://i.pps.tv/index_new.php?act=userPlayRecord",
                target: "_blank"
            });
            record_main_elem.find(_csses.dels).data("commad", "clear_all");
            record_main_elem.find(_csses.drop_panel).prepend(html);
            record_main_elem.find(_csses.records_order).hide();
            this._doms.record_main_elem.find(this._csses.act).hide()
        },
        renderRecordMore: function() {
            this._doms.record_main_elem.find(this._csses.act).show().find(this._csses.more).show()
        },
        removeRecordMore: function() {
            this._doms.record_main_elem.find(this._csses.act).find(this._csses.more).hide()
        },
        renderClearAll: function() {
            this._doms.record_main_elem.find(this._csses.act).show().find(this._csses.dels).show()
        },
        removeClearAll: function() {
            this._doms.record_main_elem.find(this._csses.act).find(this._csses.dels).hide()
        },
        removeLoading: function() {
            this._doms.record_main_elem.find("p.loading").remove()
        },
        renderNoData: function() {
            var html = '<p class="empty">您暂时还没有播放历史</p>';
            this.removeNoData();
            this.removeRecordMore();
            this.removeClearAll();
            this._doms.record_main_elem.find(this._csses.act).hide();
            this._doms.record_main_elem.find(this._csses.records_order).hide().empty();
            this._doms.record_main_elem.find(this._csses.drop_panel).prepend(html)
        },
        removeNoData: function() {
            this._doms.record_main_elem.find(this._csses.drop_panel).find("p.empty").remove()
        },
        formatTime: function(seconds, guide) {
            guide = guide || seconds;
            var s = Math.floor(seconds % 60),
            m = Math.floor(seconds / 60 % 60),
            h = Math.floor(seconds / 3600),
            gm = Math.floor(guide / 60 % 60),
            gh = Math.floor(guide / 3600);
            h = h > 0 || gh > 0 ? h + ":": "";
            m = ((h || gm >= 10) && 10 > m ? "0" + m: m) + ":";
            s = 10 > s ? "0" + s: s;
            return h + m + s
        },
        bindDefEvent: function() {
            function clearTimer() {
                _record_timer && clearTimeout(_record_timer)
            }
            var self = this,
            _csses = {
                record_main_state: "drop-down-open",
                drop_down: ".drop-down"
            },
            _record_timer = null,
            _out_time = 200;
            this._doms.record_main_elem.on("click", "a",
            function(evt) {
                var commad = $(this).data("commad");
                if (commad) {
                    evt.preventDefault();
                    switch (commad) {
                    case "clear_one":
                        window.confirm("你确认要删除此播放记录吗？") && (self.checkLogin() ? self.delRecord($(this).data("tvid"), $(this).data("com"), $(this)) : self.delUnloginRecord($(this).data("tvid"), $(this)));
                        break;
                    case "clear_all":
                        window.confirm("你确认要删除所有播放记录吗？") && (self.checkLogin() ? self.delRecordAll($(this)) : self.delAllUnloginRecord($(this)))
                    }
                }
            }).on("mouseenter",
            function(event) {
                event.preventDefault();
                if (!self._datas.init_recording) {
                    self.initRecording();
                    self._datas.init_recording = !0
                }
                clearTimer();
                $(this).find(_csses.drop_down).addClass(_csses.record_main_state)
            }).on("mouseleave",
            function(event) {
                event.preventDefault();
                var $this = $(this);
                clearTimer();
                _record_timer = setTimeout(function() {
                    $this.find(_csses.drop_down).removeClass(_csses.record_main_state)
                },
                _out_time)
            }).on("mouseenter", _csses.drop_down,
            function(event) {
                event.preventDefault();
                clearTimer();
                $(this).addClass(_csses.record_main_state)
            }).on("mouseleave", _csses.drop_down,
            function(event) {
                event.preventDefault();
                var $this = $(this);
                clearTimer();
                _record_timer = setTimeout(function() {
                    $this.removeClass(_csses.record_main_state)
                },
                _out_time)
            }).on("mouseenter", this._csses.drop_list_item,
            function(event) {
                event.preventDefault();
                $(this).addClass(self._csses.drop_list_item_state);
                $(this).find("span.s1").stop().animate({
                    width: 135
                },
                200)
            }).on("mouseleave", this._csses.drop_list_item,
            function(event) {
                event.preventDefault();
                $(this).removeClass(self._csses.drop_list_item_state);
                $(this).find("span.s1").stop().animate({
                    width: 285
                },
                200)
            })
        },
        bindHasPlayerEvent: function() {
            var self = this;
            window.onunload = function() {
                var time = self._datas.playingTime;
                self.palyState.autoEnd ? self.setRecord(time, !0) : self.setRecord(time, !1)
            }
        },
        getPlayingTime: function() {
            return "flashPlayer" === this._datas.video_dom_type ? this._doms.video_dom[0].ppstime && this._doms.video_dom[0].ppstime() || 0 : this._doms.video_dom[0].currentTime
        },
        getVideoWidth: function() {
            return "flashPlayer" === this._datas.video_dom_type ? video.time: this._doms.video_dom[0].videoWidth
        },
        setRecord: function(time, is_end) {
            var data = {
                t: this._datas.new_title,
                uk: this._datas.url_key,
                vid: this._datas.upload_id,
                et: is_end ? 0 : time,
                ti: +new Date,
                ie: is_end,
                td: this._datas.terminalId.pc_web
            };
            this.checkLogin() ? this.saveRecord(data) : this.setUnloginRecord(time, is_end)
        },
        saveRecord: function(data) {
            var s_data = {
                auth: cookie.get("P00001"),
                tvId: data.vid,
                videoPlayTime: data.et,
                addtime: data.ti,
                terminalId: this._datas.terminalId.pc_web,
                vType: this._datas.sid ? 1 : 2,
                stid: "uint32_t",
                com: 2,
                lang: 0
            };
            this.getJSONP(this._datas.url + this._datas.routes[0], s_data,
            function() {})
        },
        mergeRecordData: function() {
            var data = this.getRecordCookie();
            for (var i in data) data[i].vid && this.saveRecord(data[i]);
            this.delAllRecordCookie()
        },
        renderInitRecord: function(data) {
            var today_html = '<dl class="order-dl J_hover_sya"><dt class="dt"><b class="ico-h-dot"></b><span class="ta">今日</span></dt>',
            past_html = '<dl class="order-dl J_hover_sya"><dt class="dt"><b class="ico-h-dot"></b><span class="tb">更早</span></dt>',
            _end_html = "</dl>",
            html = "",
            i = 0,
            len = 0,
            upload_id = this._datas.upload_id,
            url_key = null,
            time = null,
            _play_conti_txt = ["去IQIYI观看", "继续观看"],
            _replay_txt = ["去IQIYI观看", "重新观看"],
            video_href = "",
            conti_href = "",
            _end_time = parseInt( + (new Date).setHours(0).toString().slice(0, -3)),
            _has_today_data = !1,
            _has_past = !1;
            for (len = data.length; len > i; i++) {
                url_key = data[i].url_key || this.splitURL(data[i].videoUrl);
                time = -1 == data[i].videoPlayTime ? 0 : 0 == data[i].videoPlayTime ? data[i].videoDuration < 1e3 ? data[i].videoDuration: Math.floor(data[i].videoDuration / 1e3) : data[i].videoPlayTime;
                if (url_key) {
                    video_href = 1 == data[i].com ? data[i].videoUrl: "http://v.pps.tv/play_" + url_key + ".html#from_www";
                    conti_href = 1 == data[i].com ? data[i].videoUrl: "http://v.pps.tv/play_" + url_key + ".html?pt=" + time + "#from_www"
                } else {
                    video_href = data[i].videoUrl;
                    conti_href = data[i].videoUrl
                }
                html = '<dd class="dd"><span class="s1" style="width: 285px;"><a href="' + video_href + '" title="' + data[i].videoName + '" target="_blank">' + data[i].videoName + '</a></span><span class="s2">' + (data[i].tvId == upload_id ? "正在观看": 0 == data[i].videoPlayTime ? "已看完": "已看到 " + this.formatTime(time)) + '</span><span class="s3">' + (data[i].tvId != upload_id ? 0 == data[i].videoPlayTime ? '<a href="' + video_href + '" target="_blank">' + _replay_txt[parseInt(data[i].com) - 1] + "</a>": '<a href="' + conti_href + '" target="_blank">' + _play_conti_txt[parseInt(data[i].com) - 1] + "</a>": "") + '</span> <span class="s4">' + '<a href="#" class="del" data-commad="clear_one" data-tvid="' + data[i].tvId + '" data-com="' + data[i].com + '" title="删除">删除</a></span></dd>';
                if (parseInt(data[i].addtime) > _end_time) {
                    today_html += html;
                    _has_today_data = !0
                } else {
                    past_html += html;
                    _has_past = !0
                }
            }
            today_html = _has_today_data ? today_html += _end_html: "";
            past_html = _has_past ? past_html += _end_html: "";
            return today_html += past_html
        },
        splitURL: function(url) {
            var index = url.indexOf("play_") + 5;
            return - 1 != url.indexOf("play_") ? url.substr(index, 6) : null
        },
        getRecord: function() {
            var self = this,
            s_data = {
                auth: cookie.get("P00001"),
                dp: 3,
                terminalId: this._datas.terminalId.pc_web
            };
            self.renderLoading();
            this.getJSONP(this._datas.url + this._datas.routes[1], s_data,
            function(data) {
                var com_data;
                self.removeLoading();
                if (data && data.data && data.data.length > 0) {
                    com_data = data.data;
                    if (com_data.length > 0) {
                        self._doms.record_main_elem.find(self._csses.records_order).show().html(self.renderInitRecord(com_data.slice(0, 10)));
                        self.renderClearAll();
                        self.renderRecordMore()
                    } else self.renderNoData()
                } else self.renderNoData()
            })
        },
        getDataByCom: function(data, com) {
            com = com || 2;
            for (var i = 0,
            len = data.length,
            arr = []; len > i; i++) 2 == data[i].com && arr.push(data[i]);
            return arr
        },
        arrToObj: function(arr) {
            for (var obj = {},
            i = 0,
            len = arr.length; len > i; i++) obj[arr[i].vid] = arr[i];
            return obj
        },
        sortData: function(data) {
            var arr = [];
            for (var i in data) arr.push(data[i]);
            arr.sort(function(a, b) {
                return a.ti < b.ti ? 1 : 0
            });
            return arr
        },
        delRecord: function(vid, com, dom) {
            var self = this,
            s_data = {
                auth: cookie.get("P00001"),
                tvId: vid,
                com: com || 2
            };
            this.getJSONP(this._datas.url + this._datas.routes[3], s_data,
            function() {
                if (dom.parents("dd").siblings().length <= 1) {
                    dom.parents("dl").remove();
                    self.removeClearAll();
                    self.renderNoData();
                    self.removeRecordMore()
                } else dom.parents("dd").remove()
            })
        },
        delRecordAll: function() {
            var self = this,
            s_data = {
                auth: cookie.get("P00001")
            };
            this.getJSONP(this._datas.url + this._datas.routes[4], s_data,
            function() {
                self.renderNoData();
                self.removeClearAll();
                self.removeRecordMore()
            })
        },
        setUnloginRecord: function(time, is_end) {
            var data = {
                t: this._datas.new_title,
                uk: this._datas.url_key,
                vid: this._datas.upload_id,
                et: is_end ? 0 : -1 == time ? 0 : time,
                vt: is_end ? this.video_width: -1 == time ? 0 : time,
                ti: +new Date,
                ie: is_end,
                td: this._datas.terminalId.pc_web
            },
            re_data = this.getRecordCookie(); ({
                tvId: data.vid,
                videoPlayTime: data.et,
                addtime: data.ti,
                terminalId: this._datas.terminalId.pc_web,
                vType: this._datas.sid ? 1 : 2,
                stid: "uint32_t",
                com: 2,
                lang: 0
            });
            re_data = this.sortData(re_data).slice(0, 10);
            re_data = this.arrToObj(re_data);
            re_data[this._datas.upload_id] = data;
            this.setRecordCookie(re_data)
        },
        getUnloginRecord: function() { ({
                limit: 10,
                terminalId: this._datas.terminalId.pc_web
            });
            this.getUnLoginByQiyi()
        },
        getUnLoginByQiyi: function() {
            var self = this,
            url = this._datas.unurl + this._datas.routes[1],
            param = {
                limit: 10,
                dp: 3,
                t: new Date
            },
            cb = function(uuid) {
                param.ckuid = uuid;
                self.getJSONP(url, param,
                function(data) {
                    if (data) {
                        self.removeLoading();
                        if (data.data.length > 0) {
                            self._doms.record_main_elem.find(self._csses.records_order).show().html(self.renderInitRecord(data.data));
                            self.renderClearAll()
                        } else self.renderNoData()
                    } else self.renderNoData()
                })
            };
            this.byUnLogin(cb)
        },
        recordData2Def: function(re_data) {
            for (var _keys_data = {
                t: "videoName",
                uk: "url_key",
                vid: "tvId",
                et: "videoDuration",
                vt: "videoPlayTime",
                ti: "addtime",
                td: "terminalId"
            },
            i = 0, len = re_data.length, arr = [], key = null, tmp = {}; len > i; i++) {
                tmp = {
                    com: 2
                };
                for (key in re_data[i]) tmp[_keys_data[key]] = re_data[i][key];
                arr.push(tmp)
            }
            return arr
        },
        delUnloginRecord: function(id, dom) {
            this.delRecordByQiyi(id);
            if (dom.parent("li").siblings().length <= 0) {
                this.renderNoData();
                this.removeClearAll()
            } else dom.parent("li").remove()
        },
        delAllUnloginRecord: function() {
            this.delAllRecordByQiyi();
            this.removeClearAll();
            this.renderNoData()
        },
        getRecordCookie: function() {
            return cookie.get("__V_R") ? JSON.parse(cookie.get("__V_R")) : ""
        },
        delRecordCookie: function(vid) {
            var data = this.getRecordCookie();
            if (data && vid && data[vid]) {
                delete data[vid];
                this.setRecordCookie(data)
            }
        },
        delRecordByQiyi: function(id) {
            var self = this,
            param = {
                tvId: id,
                com: 2
            },
            cb = function(uuid) {
                param.ckuid = uuid;
                self.getJSONP("http://nl.rcd.iqiyi.com/apis/urc/delrc", param,
                function() {})
            };
            this.byUnLogin(cb)
        },
        delAllRecordCookie: function() {
            cookie.set("__V_R", null, new Date( - 1), "/", ".pps.tv")
        },
        delAllRecordByQiyi: function() {
            var self = this,
            param = {},
            cb = function(uuid) {
                param.ckuid = uuid;
                self.getJSONP("http://nl.rcd.iqiyi.com/apis/urc/delall", param,
                function() {})
            };
            this.byUnLogin(cb)
        },
        setRecordCookie: function(data) {
            var then = (new Date).getTime() + 6048e5;
            data && cookie.set("__V_R", JSON.stringify(data), new Date(then), "/", ".pps.tv")
        },
        palyState: {
            start: !0,
            second: !0,
            end: !0,
            autoEnd: !1
        },
        startCheckPlay: function() {
            var self = this,
            time = null;
            this._datas.startTimer = setTimeout(function() {
                time = self.getPlayingTime();
                self._datas.playingTime = time;
                1 === time && self.palyState.start && self.palyState.start && (self.palyState.start = !1);
                if (0 !== time && 0 === time % self._datas.sendInterTime && self.palyState.second) {
                    self.setRecord(time + 1, !1);
                    self.palyState.second && (self.palyState.second = !1)
                }
                if (time === self._datas.video_width && self.palyState.end) {
                    clearTimeout(self._datas.startTimer);
                    self.setRecord(time + 1, !0);
                    self.palyState.end && (self.palyState.end = !1);
                    self.palyState.autoEnd || (self.palyState.autoEnd = !0)
                }
                if (time !== self._datas.video_width) {
                    self.startCheckPlay();
                    self.palyState.second || (self.palyState.second = !0);
                    self.palyState.end || (self.palyState.end = !0)
                }
            },
            1e3)
        },
        setSwf: function() {
            var htmli = '<div style="height:0px;width: 0px;overflow: hidden;"><object name="myHistoryLog" width="1" height="1" id="myHistoryLog" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"><param name="allowScriptAccess" value="always"/><param name="wmode" value="transparent"/><param name="movie" value="http://www.iqiyi.com/player/20131204134452/PPSPageTools.swf"/></object></div>',
            htmlo = '<div style="height:0px;width: 0px;overflow: hidden;"><object id="myHistoryLog" width="1" height="1" type="application/x-shockwave-flash" name="myHistoryLog" data="http://www.iqiyi.com/player/20131204134452/PPSPageTools.swf"><param name="allowScriptAccess" value="always"/><param name="wmode" value="transparent"/><param name="AllowNetworking" value="all"/></object></div>'; - 1 != navigator.appName.indexOf("Microsoft") ? $("body").append(htmli) : $("body").append(htmlo)
        },
        getSwf: function(name) {
            var chartRef;
            chartRef = -1 == navigator.appName.indexOf("Microsoft Internet") ? document.embeds && document.embeds[name] ? navigator.userAgent.indexOf("Firefox") > 0 ? document.embeds[id] : window[name] : window.document[name] : window[name];
            return chartRef
        },
        byUnLogin: function(cb) {
            function getUid() {
                try {
                    var uuid = swf.getUUID();
                    cb(uuid)
                } catch(e) {
                    setTimeout(getUid, 500)
                }
            }
            var swf = this.getSwf("myHistoryLog");
            swf && getUid()
        }
    };
    return playerRecording
});
define("lib/deliver/basic", ["jquery", "lib/cookie/cookie"],
function($, cookie) {
    return {
        _deliver_url: {
            login: "http://stat.ppstream.com/web/login.html",
            view: "http://stat.ppstream.com/ugc/view.html",
            show: "http://stat.ppstream.com/ugc/show.html",
            click: "http://stat.ppstream.com/ugc/click.html",
            onClick: "http://stat.ppstream.com/onclick.html"
        },
        __LOC_HREF: escape(location.href.slice(0, location.href.indexOf("?"))),
        uniq: function(arr) {
            for (var j, _obj = {},
            len = arr.length; len--;) _obj[arr[len]] = "";
            arr = [];
            for (j in _obj) arr.push(j);
            return arr
        },
        getRefer: function() {
            var referrer = "";
            try {
                referrer = window.top.document.referrer
            } catch(e) {
                if (window.parent) try {
                    referrer = window.parent.document.referrer
                } catch(e2) {
                    referrer = ""
                }
            }
            "" === referrer && (referrer = document.referrer);
            return escape(referrer)
        },
        sendDataWithBase: function(data_obj) {
            var _base_data = [{
                name: "url",
                value: this.__LOC_HREF
            },
            {
                name: "ref",
                value: this.getRefer()
            }];
            data_obj && data_obj.type && data_obj.datas && this.createIMG(this._deliver_url[data_obj.type] + "?" + $.param(data_obj.datas) + "&" + $.param(_base_data) + (data_obj.other_param ? "&" + data_obj.other_param: ""))
        },
        sendData: function(data_obj) {
            data_obj && data_obj.type && data_obj.datas && this.createIMG(this._deliver_url[data_obj.type] + "?" + $.param(data_obj.datas) + (data_obj.other_param ? "&" + data_obj.other_param: ""))
        },
        createIMG: function(url) {
            var IMG;
            IMG = new Image;
            IMG.src = url;
            IMG.onload = function() {
                document.body.removeChild(IMG)
            };
            IMG.onerror = function() {
                document.body.removeChild(IMG)
            };
            document.body.appendChild(IMG)
        },
        pageView: function(page_value) {
            page_value = page_value || "home";
            this.sendData({
                type: "view",
                datas: [{
                    name: "clt",
                    value: page_value
                },
                {
                    name: "url",
                    value: this.__LOC_HREF
                },
                {
                    name: "ref",
                    value: this.getRefer()
                }]
            })
        },
        login: function() {
            this.sendData({
                type: "login",
                datas: [{
                    name: "usr_login",
                    value: "login"
                },
                {
                    name: "usr_id",
                    value: cookie.get("user_id")
                },
                {
                    name: "url",
                    value: this.__LOC_HREF
                },
                {
                    name: "ref",
                    value: this.getRefer()
                }]
            })
        },
        logout: function() {
            this.sendData({
                type: "login",
                datas: [{
                    name: "usr_login",
                    value: "logout"
                },
                {
                    name: "usr_id",
                    value: cookie.get("user_id")
                },
                {
                    name: "url",
                    value: this.__LOC_HREF
                },
                {
                    name: "ref",
                    value: this.getRefer()
                }]
            })
        }
    }
});
define("lib/login/basic", ["jquery", "lib/cookie/cookie", "lib/plugins/basicDialog", "lib/plugins/playerRecording", "lib/deliver/basic"],
function($, cookie, basicDialog, playerRecording, deliver) {
    var _handler_data = {},
    _handler_guid = 1,
    basicLogin = {
        _t: +new Date,
        launcher: null,
        __userLoginTag: !1,
        _iqiyi_user_info_url: "v2.pps.tv" === location.host ? "http://v2.pps.tv/ugc/ajax/baidulogin.php": "http://active.v.pps.tv/ugc/ajax/baidulogin.php",
        _baidu_user_info_url: "http://openapi.baidu.com/connect/2.0/getLoggedInUser",
        userLoginInit: function() {
            this.createActive();
            this.checkLogin() ? this.is_login() : this.baiduLogin();
            playerRecording.playRecordingInit()
        },
        checkClientLogin: function() {
            var client_info = this.GetLoginInfo(100);
            if (client_info && client_info[1]) {
                var then = (new Date).getTime() + 2592e6;
                cookie.set("P00001", client_info[1], new Date(then), "/", "pps.tv");
                this.is_login();
                return ! 0
            }
            return ! 1
        },
        getBaiduUserInfo: function(obj) {
            var self = this;
            $.ajax({
                url: this._iqiyi_user_info_url,
                data: obj,
                dataType: "jsonp",
                success: function(data) {
                    if (data && data.statusCode && "200" === data.statusCode && data.info) {
                        self.setUserInfoCookie(data.info);
                        self.is_login()
                    }
                }
            })
        },
        setUserInfoCookie: function(data) {
            var then = (new Date).getTime() + 2592e6;
            if (data) {
                cookie.set("P00001", data.P00001, new Date(then), "/", "pps.tv");
                cookie.set("nick_name", data.nick_name, new Date(then), "/", "pps.tv");
                cookie.set("user_id", data.user_id, new Date(then), "/", "pps.tv")
            }
        },
        baiduLogin: function() {
            var self = this;
            $.ajax({
                url: this._baidu_user_info_url,
                data: {
                    client_id: "VdUQE9922EiS7Qb5N7oFGX8s"
                },
                dataType: "jsonp",
                success: function(data) {
                    data.error_code || self.getBaiduUserInfo(data)
                }
            })
        },
        __PLUG_TYPE: "pps",
        createActive: function() {
            var div = document.createElement("div");
            div.id = "LauncherBox";
            document.getElementsByTagName("body")[0].appendChild(div);
            this.creatLauncher()
        },
        creatLauncher: function() {
            var _plugs_obj = {
                pps_ie: '<object id="LauncherID" classid="clsid:4E6A8DA1-5731-465B-B036-B9E16EF26CAC" width="0" height="0"></object>',
                pps_webkit: '<object id="LauncherID" TYPE="application/pps-activex" clsid="{4E6A8DA1-5731-465B-B036-B9E16EF26CAC}" width="0" height="0"></object>',
                qiyi_ie: '<object id="LauncherID" classid="clsid:5E6A8DA1-5731-465B-B036-B9E16EF26CAC" width="0" height="0"></object>',
                qiyi_webkit: '<object id="LauncherID" TYPE="application/client-activex" clsid="{5E6A8DA1-5731-465B-B036-B9E16EF26CAC}" width="0" height="0"></object>'
            };
            if (!this.launcher) if (window.ActiveXObject || navigator.userAgent.indexOf("Trident") > 0) {
                $("#LauncherBox").html(_plugs_obj.qiyi_ie);
                if (!this.checkPlugsCanUsed("qiyi")) {
                    $("#LauncherBox").html(_plugs_obj.pps_ie);
                    this.checkPlugsCanUsed("pps")
                }
                this.launcher = document.getElementById("LauncherID")
            } else {
                $("#LauncherBox").html(_plugs_obj.qiyi_webkit);
                if (!this.checkPlugsCanUsed("qiyi")) {
                    $("#LauncherBox").html(_plugs_obj.pps_webkit);
                    this.checkPlugsCanUsed("pps")
                }
                this.launcher = document.getElementById("LauncherID")
            }
        },
        checkPlugsCanUsed: function(type) {
            var obj = document.getElementById("LauncherID");
            if ("qiyi" === type) {
                if (obj && "undefined" != typeof obj.CallClientFunction) {
                    this.__PLUG_TYPE = "qiyi";
                    return "qiyi"
                }
            } else if ("pps" === type && obj && "undefined" != typeof obj.Launch) {
                this.__PLUG_TYPE = "pps";
                return "pps"
            }
            this.__PLUG_TYPE = "no";
            return ! 1
        },
        GetLoginInfo: function(id) {
            try {
                var strInfo = this.launcher.GetLoginInfo(id);
                return strInfo.split("|")
            } catch(e) {}
            return []
        },
        getPPStreamVersion: function() {
            var _ver = null;
            if (this.checkClientInstall()) try {
                "qiyi" === this.__PLUG_TYPE ? _ver = this.launcher.CallClientFunction('{"ID":1,"name":"GetPPSVersion","Parameter":""}') : "pps" === this.__PLUG_TYPE && (_ver = this.launcher.GetPPSVersion())
            } catch(e) {}
            return _ver
        },
        runPPStreamWithBack: function() {
            var _version = this.getPPStreamVersion();
            if (_version) {
                deliver.sendDataWithBase({
                    type: "onClick",
                    datas: [{
                        name: "clt",
                        value: "ppsrun_index"
                    },
                    {
                        name: "type",
                        value: "web"
                    },
                    {
                        name: "cid",
                        value: _version
                    }]
                });
                this.clientPlay("/web_startup_tray")
            } else deliver.sendDataWithBase({
                type: "onClick",
                datas: [{
                    name: "clt",
                    value: "unppstream_index"
                },
                {
                    name: "type",
                    value: "web"
                }]
            })
        },
        checkClientInstall: function() {
            try {
                if ("undefined" != typeof this.launcher.CallClientFunction || "undefined" != typeof this.launcher.Launch) return ! 0
            } catch(e) {}
            return ! 1
        },
        clientPlay: function(id) {
            if (id && this.checkClientInstall()) try {
                "qiyi" === this.__PLUG_TYPE ? this.launcher.CallClientFunction('{"ID":1,"name":"Launch","Parameter":"' + id + '"}') : "pps" === this.__PLUG_TYPE && this.launcher.Launch(id)
            } catch(e) {}
        },
        SetLoginInfo: function(id, user_id, cookie, islogin) {
            try {
                this.launcher.SetLoginInfo(id, user_id, cookie, islogin)
            } catch(e) {}
        },
        ClientSSOLogin: function() {
            var authcookie = cookie.get("P00001"),
            client_login_info = this.GetLoginInfo(100),
            web_login_info = this.GetLoginInfo(101);
            if (authcookie) {
                web_login_info.length && 0 != web_login_info[2] || this.SetLoginInfo(101, cookie.get("user_id"), authcookie, 1);
                if (web_login_info.length && client_login_info.length && web_login_info[1] == client_login_info[1] && 0 == client_login_info[2]) {
                    this.SetLoginInfo(101, web_login_info[0], web_login_info[1], 0);
                    web_login_info[2] = 0;
                    cookie.clear("P00001");
                    cookie.clear("P00002");
                    cookie.clear("P00003");
                    cookie.clear("P00004");
                    cookie.clear("P00010");
                    cookie.clear("P000email")
                }
            } else {
                if (web_login_info.length && client_login_info.length && web_login_info[1] == client_login_info[1] && 0 == client_login_info[2]) {
                    this.SetLoginInfo(101, web_login_info[0], web_login_info[1], 0);
                    web_login_info[2] = 0
                }
                var login_info = web_login_info.length && 1 == web_login_info[2] ? web_login_info: client_login_info;
                if (login_info.length && 1 == login_info[2]) {
                    var then = (new Date).getTime() + 2592e6;
                    this.SetLoginInfo(101, login_info[0], login_info[1], 1);
                    cookie.set("P00001", login_info[1], new Date(then), "/", "pps.tv")
                }
            }
        },
        checkLogin: function() {
            return null != cookie.get("P00001") ? !0 : !1
        },
        __get_logged_in_user: "http://openapi.baidu.com/connect/2.0/getLoggedInUser",
        _login_url: "v2.pps.tv" === location.host ? "http://v2.pps.tv/ugc/ajax/login.php": "http://active.v.pps.tv/ugc/ajax/login.php",
        _setGlobalInfo: function() {
            window.__user_info = {
                user_name: decodeURIComponent(cookie.get("nick_name")),
                user_id: cookie.get("user_id"),
                user_face: cookie.get("user_face" + cookie.get("user_id"))
            };
            this.__userLoginTag = !0
        },
        _delGlobalInfo: function() {
            window.__user_info = null;
            this.__userLoginTag = !1
        },
        getGlobalInfo: function() {
            return window.__user_info
        },
        is_login: function(callback) {
            callback = callback ||
            function() {};
            var self = this;
            $.ajax({
                type: "GET",
                url: this._login_url + "?t=" + +new Date,
                data: {
                    type: "auto",
                    v: "2.0"
                },
                dataType: "jsonp",
                jsonpCallback: "isLoginCallback",
                cache: !0,
                success: function(msg) {
                    if (200 == parseInt(msg.code)) {
                        self._autoLoginCallback(msg);
                        callback(!0, msg)
                    } else callback(!1)
                }
            })
        },
        _autoLoginCallback: function(data) {
            this._setGlobalInfo();
            this._renderUserInfo();
            this._checkUserIsVIP(data);
            this.iqiyiLogin();
            deliver.login();
            this.trigger("login");
            playerRecording.playRecordingRefresh()
        },
        login: function(form_str, callback) {
            callback = callback ||
            function() {};
            var self = this;
            $.ajax({
                type: "GET",
                url: this._login_url + "?" + form_str + "&type=control&v=2.0&t=" + +new Date,
                dataType: "jsonp",
                jsonpCallback: "loginCallback",
                cache: !0,
                success: function(data) {
                    if (data) {
                        callback(parseInt(data.code));
                        self._login_callback(data)
                    }
                }
            })
        },
        _renderUserInfo: function() {
            function clearTimer() {
                _user_layer_timer && clearTimeout(_user_layer_timer)
            }
            var self = this,
            _user_layer = '<div class="drop-down J_drop_down"><div class="drop-trigger"><span class="user-name"><i><b class="pps-user">default</b></i><b class="ico-h-arrow-sya"></b><b class="ico-h-warn" style="display:none;"></b></span></div><div class="drop-panel"><div class="drop-tips-sya"><div class="user-info-sya"><div class="user-info-bd"><span class="user-photo"><a data-elem-name="user_center" href="http://i.pps.tv/" target="_blank"><img width="16" height="16" src=""></a></span><a class="user-name" href="http://i.pps.tv/" data-elem-name="user_center" target="_blank"></a></div></div><div class="user-guide"><ul class="user-guide-list"><li class="item"><a href="http://i.pps.tv/" target="_blank" data-elem-name="user_center">个人中心</a></li><li class="item"><a href="http://my.ipd.pps.tv/my_videos.php" data-elem-name="user_my_upload" target="_blank">我的视频</a></li><li class="item"><a href="http://my.ipd.pps.tv/my_albums.php" data-elem-name="user_my_album" target="_blank">我的频道</a></li><li class="item"><a href="http://i.pps.tv/index_new.php?act=userPlayRecord" data-elem-name="user_play_record" target="_blank">播放历史</a></li><li class="item"><a href="http://vip.iqiyi.com/?platform=b61aebc0586abea7&fc=9068aec20fbc9ca8" data-elem-name="user_uploading" target="_blank">VIP会员专区</a></li><li class="item"><a href="http://i.pps.tv/index.php?act=userFollowInformRecord" data-elem-name="user_my_subscribe" target="_blank">追剧</a></li></ul></div><div class="act act-sya"><a href="http://i.pps.tv/index_new.php" target="_blank">设置</a><a class="pps-exit" href="#" data-commond="login_out">退出</a></div><div class="ico-tips-sya-arrow"> <b class="line">◆</b> <b class="arrow">◆</b></div></div></div>',
            _csses = {
                user_name: ".user-name .pps-user, .user-info-bd .user-name",
                user_photo: ".user-photo img",
                login_after: ".login-after",
                login_before: ".login-before",
                login_out_btn: ".pps-exit",
                drop_down: ".drop-down",
                drop_down_state: "drop-down-open",
                drop_panel: ".drop-panel"
            },
            _user_info = null,
            $_user_layer = null,
            _user_layer_timer = null,
            out_time = 200;
            $_user_layer = $(_user_layer);
            _user_info = this.getGlobalInfo();
            $(_csses.login_before).hide();
            $_user_layer.find(_csses.user_name).html(_user_info.user_name);
            $_user_layer.find(_csses.user_photo).attr("src", cookie.get("user_face" + cookie.get("user_id")));
            $(_csses.login_after).show().on("click", _csses.login_out_btn,
            function(event) {
                event.preventDefault();
                self._loginOutCallback()
            }).empty().append($_user_layer).parent().off("mouseenter mouseleave").on("mouseenter",
            function(event) {
                event.preventDefault();
                clearTimer();
                $(this).find(_csses.drop_down).addClass(_csses.drop_down_state)
            }).on("mouseenter", _csses.drop_panel,
            function(event) {
                event.preventDefault();
                clearTimer();
                $(this).parent().addClass(_csses.drop_down_state)
            }).on("mouseleave", _csses.drop_panel,
            function(event) {
                event.preventDefault();
                var $this = $(this);
                event.preventDefault();
                clearTimer();
                _user_layer_timer = setTimeout(function() {
                    $this.parent().removeClass(_csses.drop_down_state)
                },
                out_time)
            }).on("mouseleave",
            function(event) {
                var $this = $(this);
                event.preventDefault();
                clearTimer();
                _user_layer_timer = setTimeout(function() {
                    $this.find(_csses.drop_down).removeClass(_csses.drop_down_state)
                },
                out_time)
            })
        },
        _checkUserIsVIP: function(data) {
            var _top_vip, _info_vip, vipHtml, _html = ['<a href="###" class="user-status"><span class="ico-h-vip-isnt" title="您还不是VIP用户">您还不是VIP用户</span></a>', '<a href="###" class="user-status"><span class="ico-h-vip-gold" title="VIP黄金套餐用户">VIP黄金套餐用户</span></a>', '<a href="###" class="user-status"><span class="ico-h-vip-gold" title="VIP白银套餐用户">VIP白银套餐用户</span></a>'],
            _tit_html = ['<span class="ico-h-vip-isnt" title="您还不是VIP用户">您还不是VIP用户</span>', '<span class="ico-h-vip-gold" title="VIP黄金套餐用户">VIP黄金套餐用户</span>', '<span class="ico-h-vip-gold" title="VIP白银套餐用户">VIP白银套餐用户</span>'];
            if (data && data.vip_type) {
                switch (parseInt(data.vip_type)) {
                case 1:
                    _top_vip = _tit_html[1];
                    _info_vip = _html[1];
                    vipHtml = "续费VIP";
                    break;
                case 3:
                    _top_vip = _tit_html[2];
                    _info_vip = _html[2];
                    vipHtml = "升级VIP";
                    break;
                case 0:
                    _top_vip = _tit_html[0];
                    _info_vip = _html[0];
                    vipHtml = "开通VIP"
                }
                $(".apply-vip a").html(vipHtml);
                if (_html) {
                    $(".drop-trigger .user-name i").append(_top_vip);
                    $("div.user-info-bd").append(_info_vip)
                }
            }
        },
        _loginOutCallback: function() {
            var _csses = {
                user_name: ".user-name i, .user-name",
                user_photo: ".user-photo img",
                login_before: ".login-before",
                login_after: ".login-after",
                login_out_btn: ".pps-exit",
                drop_down: ".drop-down",
                drop_down_state: "drop_down_open"
            };
            $(_csses.login_before).show();
            $(_csses.login_after).empty().hide();
            $(".apply-vip").find("a").html("开通VIP");
            deliver.logout();
            this.iqiyiLogout();
            this._delGlobalInfo();
            this._clearLoginCookie();
            playerRecording.playRecordingRefresh()
        },
        _login_callback: function(data) {
            switch (parseInt(data.code)) {
            case 200:
                this._autoLoginCallback(data);
                break;
            case 202:
                alert("用户名或密码错误！");
                break;
            case 203:
                alert("用户不存在");
                break;
            case 204:
                alert("密码错误");
                break;
            case 205:
                alert("IP被封锁");
                break;
            case 501:
                alert("用户名或密码错误！");
                break;
            case 502:
                alert("验证码错误");
                break;
            default:
                alert("用户名或密码错误！")
            }
        },
        _iqiyi_setCookie_url: "http://passport.iqiyi.com/apis/user/setcookie.action?agenttype=39&authcookie=",
        _iqiyi_delCookie_url: "http://passport.iqiyi.com/apis/user/delcookie.action?agenttype=39&authcookie=",
        iqiyiLogin: function() {
            var _user_id = cookie.get("user_id"),
            _auth_cookie = cookie.get("P00001");
            this.SetLoginInfo(101, _user_id, _auth_cookie, 1);
            $.ajax({
                url: this._iqiyi_setCookie_url + _auth_cookie,
                dataType: "jsonp",
                success: function(data) {
                    data && "A00000" === data.code
                }
            })
        },
        iqiyiLogout: function() {
            var _user_id = cookie.get("user_id"),
            _auth_cookie = cookie.get("P00001");
            this.SetLoginInfo(101, _user_id, _auth_cookie, 0);
            $.ajax({
                url: this._iqiyi_delCookie_url + _auth_cookie,
                dataType: "jsonp",
                success: function(data) {
                    data && "A00000" === data.code
                }
            })
        },
        _clearLoginCookie: function(callback) {
            var callback = callback ||
            function() {};
            cookie.clear("pps_cryptnum");
            cookie.clear("user_name");
            cookie.clear("user_pass");
            cookie.clear("nick_name");
            cookie.clear("user_id");
            cookie.clear("P00001");
            cookie.clear("P00002");
            cookie.clear("P00003");
            cookie.clear("P00004");
            cookie.clear("P00010");
            cookie.clear("P000email");
            cookie.clear("pps_t_s");
            callback();
            this.trigger("logout")
        },
        on: function(type, fn) {
            _handler_data.handlers || (_handler_data.handlers = {});
            _handler_data.handlers[type] || (_handler_data.handlers[type] = []);
            fn.guid || (fn.guid = _handler_guid++);
            _handler_data.handlers[type].push(fn)
        },
        off: function(type, fn) {
            if (_handler_data.handlers) {
                type || delete _handler_data.handlers;
                if (_handler_data.handlers) if (fn) {
                    if (fn.guid) for (var n = 0,
                    len = _handler_data.handlers[type].length; len > n; n++) _handler_data.handlers[type][n].guid === fn.guid && _handler_data.handlers[type].splice(n--, 1)
                } else delete _handler_data.handlers[type]
            }
        },
        trigger: function(type, args) {
            if (type && _handler_data.handlers && _handler_data.handlers[type]) for (var i = 0,
            len = _handler_data.handlers[type].length; len > i; i++)"function" == typeof _handler_data.handlers[type][i] && _handler_data.handlers[type][i].call(_handler_data.handlers[type][i], args)
        },
        one: function(type, fn) {
            var self = this;
            this.on(type,
            function() {
                self.off(type, arguments.callee);
                fn.apply(this, arguments)
            })
        }
    };
    return basicLogin
});
define("lib/oauth/oauth2.0", ["../cookie/cookie"],
function(cookie) {
    window.PPS = window.PPS || {};
    window.PPS.OAuth = window.PPS.OAuth || {};
    var it = {};
    it.windowopener = "";
    it.open = function(oauth_type, url) {
        document.domain = "pps.tv";
        var oauth_config = {
            2 : {
                name: "新浪微博登录",
                width: 600,
                height: 400
            },
            3 : {
                name: "人人网登录",
                width: 600,
                height: 400
            },
            1 : {
                name: "百度登录",
                width: 600,
                height: 400
            },
            5 : {
                name: "支付宝登录",
                width: 900,
                height: 500
            },
            4 : {
                name: "QQ登录",
                width: 600,
                height: 400
            },
            6 : {
                name: "开心网登录",
                width: 600,
                height: 400
            }
        };
        it.windowopener = window.open("http://passport.iqiyi.com/oauth/login.php?type=" + oauth_type + "&isiframe=1&agenttype=39&url=" + encodeURIComponent(url), oauth_config[oauth_type].name, "location=yes,left=200,top=100,width=" + oauth_config[oauth_type].width + ",height=" + oauth_config[oauth_type].height + ",resizable=yes")
    };
    it.callback = function(authcookie) {
        var expiry_time = new Date;
        expiry_time.setTime(expiry_time.getTime() + 31536e6);
        it.windowopener.close();
        cookie.clear("pps_t_s");
        cookie.set("P00001", authcookie, expiry_time, "/", ".pps.tv");
        document.location.reload()
    };
    window.PPS.OAuth = it;
    return it
});
define("lib/login/loginDialog", ["lib/login/basic", "jquery", "lib/cookie/cookie", "lib/plugins/basicDialog", "lib/oauth/oauth2.0"],
function(basic, $, cookie, basicDialog, oauth2) {
    var loginDialog = function(opts) {
        var defs = {
            csses: {
                submit_btn: ".submit-dl",
                auth_btn: ".tb b",
                input_username: 'input[name="account"]',
                input_password: 'input[name="passwd"]',
                input_pass_code: 'input[name="pass_code"]',
                rzm_code_ref: ".yzm-link",
                rzm_code_img: ".yzm-img",
                login_input: 'input[name="account"], input[name="passwd"], input[name="pass_code"]',
                login_to_reg_btn: ".orange",
                vcode_item: "ul.reg-form-list:first li:last",
                input_reg_username: 'input[name="reg_account"]',
                input_reg_password: 'input[name="reg_passwd"]',
                input_reg_password_c: 'input[name="reg_passwd_c"]',
                input_reg_rck: 'input[name="reg_rck"]',
                submit_reg_btn: ".submit-zc",
                reg_input: 'input[name="reg_account"], input[name="reg_passwd"], input[name="reg_passwd_c"]'
            },
            data: {
                tab_def_index: 0
            },
            callback: {
                before: function() {},
                close: function() {},
                success: function() {},
                error: function() {}
            }
        };
        this.doms = {};
        this.doms.dialog = null;
        this.datas = {};
        this.datas.hasVCode = !1;
        this.datas.login_href = "v2.pps.tv" === location.host ? "http://v2.pps.tv/ugc/ajax/login.php": "http://active.v.pps.tv/ugc/ajax/login.php";
        this.datas.reg_href = "https://passport.iqiyi.com/apis/user/register.action";
        this.datas.vcode_src = "http://l.pps.tv/vcode/image.php";
        this.opts = $.extend({},
        defs, opts)
    };
    loginDialog.prototype = {
        constructor: loginDialog,
        init: function(box_index) {
            var self = this,
            _basic = {
                content: {
                    tab_tit: ["登录", "注册"],
                    tab_cont: ['<form action="http://i.pps.tv/login.php?act=loginDo" method="post"><ul class="reg-form-list"><li class="form-item"><label class="ft" for="user_id">用户名：</label><input type="text" id="user_id" name="account" autocomplete="off" placeholder="请输入PPS或IQIYI账号" class="input"></li><li class="form-item"><label class="ft" for="user_passwd">密&#12288;码：</label><input type="password" autocomplete="off" id="user_passwd" name="passwd" class="input" maxlength="16" placeholder="请输入密码"></li><li class="form-item" style="display: none;"><label class="ft" for="passcode">验证码：</label><input type="text" maxlength="4" id="passcode" autocomplete="off" class="input yzm-input" value="" name="pass_code" placeholder="请输入验证码"><img src="" class="yzm-img"><a href="#" class="yzm-link">看不清，换一张</a></li></ul><div class="form-act"><a class="submit-dl" href="#">登&#12288;录</a><span class="open-tips">还未开通？赶快免费<a href="http://i.pps.tv/kh_register.php" class="orange" target="_blank">注册</a>一个吧！</span><p class="forget-password"><a href="http://i.pps.tv/passwd_index.php" target="_blank">忘记密码</a></p></div></form><div class="other-login"><span class="h">使用合作网站帐号登录</span><span class="b"><a href="#" class="tb"><b class="ico-sina-32"></b></a><a href="#" class="tb"><b class="ico-qq-32"></b></a><a href="#" class="tb"><b class="ico-renren-32"></b></a></span><span class="tips">温馨提示：您在爱奇艺绑定的第三方账号会同步到PPS</span></div>', '<form><ul class="reg-form-list"><li class="form-item"><label class="ft" for="user_email">邮 箱：</label><input type="text" id="user_email" class="input" name="reg_account" placeholder="请输入常用邮箱"></li><li class="form-item"><label class="ft" for="user_passwd1">密 码：</label><input type="password" id="user_passwd1" class="input" name="reg_passwd" autocomplete="off" placeholder="请输入密码"></li><li class="form-item"><label class="ft" for="user_passwd2">确 认：</label><input type="password" id="user_passwd2" class="input" name="reg_passwd_c" autocomplete="off" maxlength="16" placeholder="请重复输入密码"></li></ul><div class="form-agree"><label><input type="checkbox" checked="checked" name="reg_rck" class="rck"><a target="_blank" href="http://i.pps.tv/register.php?act=policy">我已阅读并同意《PPS社区规范使用协议》</a></label></div><div class="form-act"><a class="submit-zc" href="#">同意并注册</a></div></form>'],
                    width: 625,
                    height: 350,
                    tab_def_index: box_index || this.opts.data.tab_def_index,
                    anim_time: 600,
                    zIndex: 800
                },
                csses: {
                    dialog_close: ".dialog-close",
                    tab: ".reg-tab-list",
                    tab_item: ".item",
                    tab_item_state: "select",
                    dialog_bd: ".reg-bd",
                    dialog_hd: ".reg-hd",
                    dialog_item: ".dialog_item"
                },
                data: {},
                callback: {
                    before: function(dialog, parent) {
                        self.beforeCallbak(dialog);
                        self.doms.dialog = dialog;
                        self.datas.parent = parent
                    },
                    close: function(dialog) {
                        self.closeCallback(dialog)
                    }
                }
            };
            new basicDialog(_basic).render()
        },
        checkAccountIsEmail: function(txt) {
            return /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test(txt) ? !0 : !1
        },
        checkPwdIsEQ: function(txt, txt2) {
            return txt === txt2 ? !0 : !1
        },
        checkPwdIsTxtLen: function(txt, len) {
            len = len || 6;
            return txt.length >= len ? !0 : !1
        },
        checkRegAll: function($INPUT) {
            var _val = $.trim($INPUT.val()),
            _c_val = "",
            _name = $INPUT.attr("name");
            this.removeHasTip($INPUT);
            switch (_name) {
            case "reg_account":
                if (!this.checkAccountIsEmail(_val)) {
                    this.appendTipWithParent($INPUT, this.renderTipWithText("请输入正确的邮箱地址！"));
                    return ! 1
                }
                this.appendTipWithParent($INPUT, this.renderTipWithText("邮箱地址正确！", "correct"));
                break;
            case "reg_passwd":
                _c_val = $.trim(this.doms.dialog.find(this.opts.csses.input_reg_password_c).val());
                if (!this.checkPwdIsTxtLen(_val)) {
                    this.appendTipWithParent($INPUT, this.renderTipWithText("密码须为6-16位字母或数字！"));
                    return ! 1
                }
                _c_val.length > 0 && this.checkRegAll(this.doms.dialog.find(this.opts.csses.input_reg_password_c));
                this.appendTipWithParent($INPUT, this.renderTipWithText("密码长度正确！", "correct"));
                break;
            case "reg_passwd_c":
                _c_val = $.trim(this.doms.dialog.find(this.opts.csses.input_reg_password).val());
                if (!this.checkPwdIsEQ(_val, _c_val)) {
                    this.appendTipWithParent($INPUT, this.renderTipWithText("输入的密码不一致！"));
                    return ! 1
                }
                this.appendTipWithParent($INPUT, this.renderTipWithText("密码一致！", "correct"))
            }
            return ! 0
        },
        removeHasTip: function($INPUT) {
            $INPUT.parents("li").find(".wrong, .correct").remove()
        },
        appendTipWithParent: function($INPUT, txt) {
            $INPUT.parents("li").append(txt)
        },
        renderTipWithText: function(txt, type) {
            type = type || "wrong";
            var _start_txt = '<span class="wrong"><b class="b"></b>',
            _end_txt = "</span>";
            switch (type) {
            case "wrong":
                break;
            case "correct":
                _start_txt = _start_txt.replace('class="wrong"', 'class="correct"')
            }
            return _start_txt + txt + _end_txt
        },
        getAndCheckRegInputs: function() {
            var self = this,
            csses = this.opts.csses,
            _tag = !1;
            this.doms.dialog.find(csses.reg_input).each(function() {
                var _result;
                if (!_tag) {
                    _result = self.checkRegAll($(this));
                    _tag = _result ? !1 : !0
                }
            });
            return _tag ? !1 : !0
        },
        getRegWithForm: function() {
            var $this, _data = {};
            this.doms.dialog.find(this.opts.csses.reg_input).each(function() {
                $this = $(this);
                _data[$this.attr("name")] = $.trim($this.val())
            });
            return _data
        },
        sendRegData: function() {
            var _data, self = this,
            _param = {};
            if (this.getAndCheckRegInputs()) {
                _data = this.getRegWithForm();
                _param.account = _data.reg_account;
                _param.passwd = _data.reg_passwd;
                _param.agenttype = "39";
                $.ajax({
                    url: this.datas.reg_href,
                    data: _param,
                    dataType: "jsonp",
                    success: function(data) {
                        data && data.code ? self.regCallback(data) : self.sendRegData()
                    }
                })
            }
        },
        regCallback: function(data) {
            var $input = "";
            switch (data.code) {
            case "P00105":
                $input = this.doms.dialog.find(this.opts.csses.input_reg_username);
                $input.focus();
                this.removeHasTip($input);
                this.appendTipWithParent($input, this.renderTipWithText("邮箱已注册！"));
                break;
            case "A00000":
                this.setUserInfoCookie(data);
                basic.is_login();
                this.destoryAll()
            }
        },
        setUserInfoCookie: function(data) {
            var then = (new Date).getTime() + 2592e6;
            if (data) {
                cookie.set("P00001", data.data.authcookie, new Date(then), "/", "pps.tv");
                cookie.set("nick_name", data.data.userinfo.nickname, new Date(then), "/", "pps.tv");
                cookie.set("user_id", data.data.userinfo.uid, new Date(then), "/", "pps.tv")
            }
        },
        beforeCallbak: function(dialog) {
            var self = this,
            csses = this.opts.csses,
            _cache_username = null,
            _cache_tiemer = null;
            dialog.on("click", csses.submit_btn,
            function(event) {
                event.preventDefault();
                self.getFormData(dialog)
            }).on("click", csses.input_reg_rck,
            function() {
                $(this).prop("checked") ? self.doms.dialog.find(csses.submit_reg_btn).show() : self.doms.dialog.find(csses.submit_reg_btn).hide()
            }).on("click", csses.submit_reg_btn,
            function(event) {
                event.preventDefault();
                self.sendRegData()
            }).on("blur", csses.reg_input,
            function() {
                self.checkRegAll($(this))
            }).on("keydown", csses.reg_input,
            function(event) {
                var _key_code = event.keyCode || event.which;
                if (13 === _key_code && dialog.find(csses.input_reg_rck).prop("checked")) {
                    event.preventDefault();
                    self.sendRegData()
                }
            }).on("click", csses.auth_btn,
            function(event) {
                var _class_type = $(this).attr("class");
                event.preventDefault();
                self.oauthLogin(_class_type)
            }).on("focus", csses.input_username,
            function() {
                var _username = $.trim($(this).val());
                "请输入PPS或IQIYI账号" === _username && $(this).val("")
            }).on("blur", csses.input_username,
            function(event) {
                var _username = $.trim($(this).val());
                _username || $(this).val("请输入PPS或IQIYI账号");
                event.preventDefault();
                if (_username.length > 0 && _cache_username !== _username) {
                    _cache_username = _username;
                    _cache_tiemer && clearTimeout(_cache_tiemer);
                    _cache_tiemer = setTimeout(function() {
                        _cache_username = null
                    },
                    4e3);
                    self.vCodeCheck(_username)
                }
            }).on("keydown", csses.login_input,
            function(event) {
                var _key_code = event.keyCode || event.which;
                if (13 === _key_code) {
                    event.preventDefault();
                    self.getFormData(dialog)
                }
            }).on("click", csses.auth_btn,
            function(event) {
                event.preventDefault()
            }).on("click", csses.rzm_code_ref + " " + csses.rzm_code_img,
            function(event) {
                event.preventDefault();
                self.refreshVCode()
            })
        },
        oauthLogin: function(_class_type) {
            var _type = "",
            oauth_type = {
                sina: 2,
                qq: 4,
                renren: 3
            };
            _type = _class_type.split("-")[1];
            oauth2.open(oauth_type[_type])
        },
        beforeRender: function() {},
        vCodeCheck: function(user_name) {
            var self = this;
            $.ajax({
                url: this.datas.login_href + "?type=check_username&username=" + user_name,
                dataType: "jsonp",
                success: function(data) {
                    if (data) switch (parseInt(data.code)) {
                    case 200:
                        self.hasVCode = !0;
                        self.refreshVCode(data.token);
                        break;
                    case 201:
                        self.hideVCode();
                        break;
                    case 202:
                        self.hideVCode()
                    }
                }
            })
        },
        refreshVCode: function(token) {
            var csses = this.opts.csses,
            doms = this.doms;
            token ? doms.dialog.find(csses.vcode_item).data("vcode", token) : token = doms.dialog.find(csses.vcode_item).data("vcode");
            doms.dialog.find(csses.vcode_item).show().find(csses.rzm_code_img).attr("src", this.datas.vcode_src + "?token=" + token + "&num=4&rn=" + (new Date).getTime())
        },
        hideVCode: function() {
            var csses = this.opts.csses;
            this.hasVCode = !1;
            this.doms.dialog.find(csses.vcode_item).hide().removeData("vcode")
        },
        getFormData: function(dialog) {
            var form_arr = null;
            form_arr = dialog.find("form").first().serializeArray();
            this.checkFillFullInfo(form_arr) && this.sendToLogin(this.resetFromKeys(form_arr))
        },
        resetFromKeys: function(data) {
            var _keys = {
                account: "username",
                passwd: "password",
                pass_code: "vcode",
                token: "token"
            },
            len = data.length,
            taken = {};
            taken.token = this.hasVCode && this.doms.dialog.find(this.opts.csses.vcode_item).data("vcode");
            for (; len--;) this.hasVCode || "pass_code" !== data[len].name ? data[len].name = _keys[data[len].name] : data.splice(len, 1);
            this.hasVCode && data.push(taken);
            return data
        },
        resetFormInput: function() {
            this.doms.dialog.find(this.opts.csses.login_input).each(function() {
                $(this).val("")
            })
        },
        sendToLogin: function(from_data) {
            var self = this;
            basic.login($.param(from_data),
            function(code, token) {
                switch (code) {
                case 200:
                    self.resetFormInput();
                    self.successCallback(code);
                    self.destoryAll();
                    break;
                case 202:
                    self.hasVCode && self.refreshVCode();
                    break;
                case 203:
                    break;
                case 204:
                    self.hasVCode && self.refreshVCode();
                    break;
                case 205:
                    break;
                case 501:
                    token && self.refreshVCode(token);
                    break;
                case 502:
                    self.refreshVCode();
                    break;
                default:
                    self.errorCallback(code)
                }
            })
        },
        checkFillFullInfo: function(form_arr) {
            var len, i = 0,
            form_type_info = {
                account: "用户名不能为空！",
                passwd: "密码不能为空！",
                pass_code: "验证码不能为空！"
            };
            if (form_arr) for (len = form_arr.length; len > i; i++) {
                if ("" === form_arr[i].value) {
                    if (!this.hasVCode && "pass_code" === form_arr[i].name) continue;
                    if ("" === form_arr[i].value) {
                        switch (form_arr[i].name) {
                        case "account":
                            this.focusUserName();
                            break;
                        case "passwd":
                            this.focusPassword();
                            break;
                        case "pass_code":
                            this.focusPassCode()
                        }
                        alert(form_type_info[form_arr[i].name]);
                        return ! 1
                    }
                }
                if ("请输入PPS或IQIYI账号" === form_arr[i].value) {
                    alert("请输入正确的用户名！");
                    this.focusUserName();
                    return ! 1
                }
            }
            return ! 0
        },
        focusUserName: function() {
            this.doms.dialog.find(this.opts.csses.input_username).focus()
        },
        focusPassword: function() {
            this.doms.dialog.find(this.opts.csses.input_password).focus()
        },
        focusPassCode: function() {
            this.doms.dialog.find(this.opts.csses.input_pass_code).focus()
        },
        destoryAll: function() {
            this.datas.parent.destoryAll();
            this.doms = null;
            this.datas = null
        },
        closeCallback: function() {},
        successCallback: function(txt) {
            this.opts.callback && $.isFunction(this.opts.callback.success) && this.opts.callback.success(txt)
        },
        errorCallback: function(txt) {
            this.opts.callback && $.isFunction(this.opts.callback.error) && this.opts.callback.error(txt)
        },
        render: function() {},
        bindEvent: function() {}
    };
    return loginDialog
});
define("lib/tools/fullScrenn2Std", ["jquery"],
function($) {
    var fullScreen2Std = {
        _max_screen: 1280,
        _body_min_css: "w960",
        init: function() {
            this.checkScreen();
            this.bindEvent()
        },
        getWinWidth: function() {
            return $(window).width()
        },
        checkScreen: function() {
            var _win_wd = this.getWinWidth(),
            _body = $("body");
            this._max_screen < _win_wd ? _body.hasClass(this._body_min_css) && _body.removeClass(this._body_min_css) : _body.hasClass(this._body_min_css) || _body.addClass(this._body_min_css)
        },
        bindEvent: function() {
            var self = this;
            $(window).on("resize",
            function() {
                self.checkScreen()
            })
        }
    };
    return fullScreen2Std
});
require(["jquery", "lib/plugins/search", "lib/login/loginDialog", "lib/login/basic", "lib/tools/fullScrenn2Std"],
function($, search, loginDialog, basic, fullScreen2Std) {
    $(function() { (new search).init();
        $(".pps-ucenter").on("click", "a.pps-login, a.pps-zc",
        function(event) {
            event.preventDefault();
            "注册" === $(this).text() ? (new loginDialog).init(1) : (new loginDialog).init()
        });
        $("div.drop-down-sya").on("mouseenter",
        function() {
            $(this).addClass("drop-down-open")
        }).on("mouseleave",
        function() {
            $(this).removeClass("drop-down-open")
        });
        basic.userLoginInit();
        fullScreen2Std.init()
    })
});
define("top_nav_com1/main",
function() {});