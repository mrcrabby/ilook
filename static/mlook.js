Mlook = new Object();
Mlook.errdetail = ['', '未知错误', '文件过大', '信息不全', '域名错误', '分类错误', '用户错误', '权限不足', '没有文件', '保存文件错误', '不支持的文件格式', '超时', '文件格式有误', '', '添加文件出错', '已经达到容量上限', '不存在的相册', '删除失败']
notice = ['正在删除，请稍候...', //0
'服务器忙，删除失败...', //1
'请先登录...', //2
'正在提交...', //3
'服务器发生错误,请稍候再试...', //4
'内容不能够为空...', //5
'标题不能为空', //6
'没有权限，操作失败...'];
var trace = function (o) {
    if (1) {
        if (window.console && window.console.info) {
            $(arguments).each(function () {
                console.info(this)
            });
        }
    }
}
var report = function (s) {
    $.get('/report?e=' + s)
}
Mlook.EventMonitor = function () {
    this.listeners = new Object();
}
Mlook.EventMonitor.prototype.broadcast = function (widgetObj, msg, data) {
    var lst = this.listeners[msg];
    if (lst != null) {
        for (var o in lst) {
            lst[o](widgetObj, data);
        }
    }
}
Mlook.EventMonitor.prototype.subscribe = function (msg, callback) {
    var lst = this.listeners[msg];
    if (lst) {
        lst.push(callback);
    } else {
        this.listeners[msg] = [callback];
    }
}
Mlook.EventMonitor.prototype.unsubscribe = function (msg, callback) {
    var lst = this.listener[msg];
    if (lst != null) {
        lst = lst.filter(function (ele, index, arr) {
            return ele != callback;
        });
    }
}

// Page scope event-monitor obj.
var event_monitor = new Mlook.EventMonitor();

function load_event_monitor(root) {
    var re = /a_(\w+)/;
    var fns = {};
    $(".j", root).each(function (i) {
        var m = re.exec(this.className);
        if (m) {
            var f = fns[m[1]];
            if (!f) {
                f = eval("Mlook.init_" + m[1]);
                fns[m[1]] = f;
            }
            f && f(this);
        }
    });
}

$(function () {
    load_event_monitor(document);
});
Mlook.prettify_form = function (form) {
    $('input:submit', form).each(function (i) {
        var btn = $('<a href="#" class="butt"></a>').text($(this).val());
        btn.click(function () {
            cleanTip();
            form.submit();
            return false;
        });
        $(this).hide().after(btn);
    });
}
var get_form_fields = function (form) {
    var param = {};
    $(':input', form).each(function (i) {
        var name = this.name;

        if (this.type == 'radio') {
            if (this.checked) param[name] = this.value;
        } else if (this.type == 'checkbox') {
            if (this.checked) param[name] = this.value;
        } else if (this.type == 'submit') {
            if (/selected/.test(this.className)) param[name] = this.value;
        } else {
            if (name) param[name] = this.value;
        }
        if (/notnull/.test(this.className) && this.value == '') {
            $(this).prev().addClass('errnotnull');
            param['err'] = 'notnull';
        }
    });

    return param;
}

var remote_submit_json = function (form, func, disable, action) {
    var fvalue = get_form_fields(form);
    if (fvalue['err'] != undefined) return;
    $(':submit,:input', form).attr('disabled', disable == false ? 0 : 1);
    var act = action || form.action;
    $.post(act, fvalue, function (ret) {
        var json = eval('(' + ret + ')');
        // alert(ret);
        func(json);
    });
}

/* entry vote button */
Mlook.init_evb = function (o) {
    var eid = $(o).attr("id").split("-")[1];
    $(o).submit(function () {
        var url = "/j/entry/" + eid + "/vote";
        $.post(url, function (ret) {
            var r = eval("(" + ret + ")");
            event_monitor.broadcast(this, "entry_" + eid + "_voted", r);
            $(o).text("你的投票已经提交，谢谢。")
            $("#nf-" + eid).hide();
            $("#nf_s-" + eid).hide();
        });
        return false;
    });
}

/* entry vote count */
Mlook.init_evc = function (o) {
    var eid = $(o).attr("id").split("-")[1];
    event_monitor.subscribe("entry_" + eid + "_voted", function (caller, data) {
        var count = data.rec_count;
        if (count) {
            $(o).text("" + count + "人推荐").removeClass("hidden");
        }
    });
}

/* entry nointerest button */
Mlook.init_enb = function (o) {
    var eid = $(o).attr("id").split("-")[1];
    $(o).submit(function () {
        var url = "/j/entry/" + eid + "/nointerest";
        $.post(url, function (ret) {
            $(o).text("你的投票已经提交，谢谢。");
            $("#a_evb-" + eid + ",#evb_s-" + eid).hide();
        });
        return false;
    });
}

var voteuse_act = function (useful, id, type) {
    if (useful) {
        url = "/j/" + type + "/" + id + "/useful";
    } else {
        url = "/j/" + type + "/" + id + "/useless";
    }
    $.post(url, {}, function (sjson) {
        var ret = eval('(' + sjson + ')');
        if (ret.result) {
            $('#voteuse_' + id).html('<span class="m gtleft">你的投票已经提交，谢谢。</span>');
            $('#userate_' + id).html('<p id="userate_%s" class="pl">' + ret.usecount + '/' + ret.totalcount + '的人觉得此评论有用:</p>');
        }
        return false;
    });
}

var voteuseful = function (id) {
    var _ = id.split('-');
    var type = (_[0] == 'd') ? "doulist" : "review";
    return voteuse_act(true, _[1], type);
}
var voteuseless = function (id) {
    var _ = id.split('-');
    var type = (_[0] == 'd') ? "doulist" : "review";
    return voteuse_act(false, _[1], type);
}

/* blog entry folding */
Mlook.init_bef = function (o) {
    var eid = $(o).attr('id').split('entry-')[1],
        unfolder = $('.unfolder', o),
        folder = $('.folder', o),
        s = $('.entry-summary', o),
        f = $('.entry-full', o);
    unfolder.click(function () {
        if (f.text() == "") {
            var loadtip = $('<div class="loadtip">正在载入...</div>');
            var loadhl = setTimeout(function () {
                $('.source', o).before(loadtip);
            }, 200);
            var url = '/j/entry/' + eid + '/';
            $.getJSON(url, function (j) {
                clearTimeout(loadhl);
                loadtip.hide();
                $.post(url + 'view', {});
                f.html(j.content).find('a').attr('target', '_blank');
                f.show();
                s.hide();
            });
        } else {
            f.show();
            s.hide();
        }
        unfolder.hide();
        folder.show();
        return false;
    }).hover_fold('unfolder');

    folder.click(function () {
        s.show();
        f.hide();
        folder.hide();
        unfolder.show();
    }).hover_fold('folder');
}

Mlook.init_unfolder_n = function (o) {
    $(o).click(function () {
        var rid = $(o).attr('id').split('-')[1];
        var url = '/j/note/' + rid + '/full';
        $.getJSON(url, function (r) {
            $('#note_' + rid + '_short').hide();
            $('#note_' + rid + '_full').html(r.html);
            $('#note_' + rid + '_full').show();
            $('#note_' + rid + '_footer').show();
            $('#naf-' + rid).hide();
            $('#nau-' + rid).show();
            load_event_monitor($('#note_' + rid + '_full'));
        });
        return false;
    }).hover_fold('unfolder');
}

Mlook.init_folder_n = function (o) {
    $(o).click(function () {
        var rid = $(o).attr('id').split('-')[1];
        $('#note_' + rid + '_full').hide();
        $('#note_' + rid + '_short').show();
        $('#note_' + rid + '_footer').hide();
        $(o).hide();
        $('#naf-' + rid).show();
    }).hover_fold('folder');
}

Mlook.init_unfolder = function (o) {
    $(o).click(function () {
        var rid = $(o).attr('id').split('-')[1];
        var url = '/j/review/' + rid + '/fullinfo';
        $.getJSON(url, function (r) {
            $('#review_' + rid + '_short').hide();
            $('#review_' + rid + '_full').html(r.html);
            $('#review_' + rid + '_full').show();
            $('#af-' + rid).hide();
            $('#au-' + rid).show();
            load_event_monitor($('#review_' + rid + '_full'));
        });
        return false;
    }).hover_fold('unfolder');
}

Mlook.init_folder = function (o) {
    $(o).click(function () {
        var rid = $(o).attr('id').split('-')[1];
        $('#review_' + rid + '_full').hide();
        $('#review_' + rid + '_short').show();
        $(o).hide();
        $('#af-' + rid).show();
    }).hover_fold('folder');
}

/* blog entry voters folding */
Mlook.init_bevf = function (o) {
    var eid = $(o).attr('id').split('bevs-')[1];
    var h = $('.voters_header', o);
    if (!h.length) return;
    h.hover(function () {
        $(this).addClass('clickable_title');
    }, function () {
        $(this).removeClass('clickable_title');
    });
    var v = $('#vsl', o);
    var l = $('.link', o);
    var m = $('#more_voters', o);

    var fn = function (e) {
        var f = $(".mv", o);
        if (f.length) {
            var d = f.toggle().css('display');
            l.text(d == 'none' ? "更多推荐者" : "隐藏");
            if (m.length) m.toggle().css('display');
        } else {
            t = $('<li>正在装载...</li>');
            if (v.length) {
                v.append(t);
            } else {
                h.after(v = $('<ul id="vsl" class="user-list pl indent"></ul>'));
                v.append(t);
            }
            var url = '/j/entry/' + eid + '/voters?start=8';
            $.getJSON(url, function (j) {
                t.css('display', 'none');
                t.before($(j.html));
                if (m.length) {
                    m.css('display', 'none');
                }
            });
            $('.link', o).text("隐藏");
        }
        return false;
    }
    h.click(fn);
    l.click(fn);
};

Mlook.init_guidelink = function (o) {
    $(o).click(function () {
        window.open('/help/guide1', '', 'width=640,height=400');
        return false;
    });
};

Mlook.init_closelink = function (o) {
    $('<a href="#">关闭</a>').appendTo($(o)).click(function () {
        window.close();
        return false;
    });
};

function ext_links() {
    es = $('.entry-summary');
    es.each(function (i) {
        var a = $(es[i]).find('a');
        a.each(function (j) {
            a[j].target = '_blank';
        });
    });
}
/////////////////////////////////video
// 添加url
Mlook.init_video_addurl = function (o) {
    $(o).click(function () {
        pop_win("加载中,请稍等...");
        var vid = $(o).attr('name');
        var url = '/video/addurl?vid=' + vid;

        return pop_win.load('/video/addurl?vid=' + vid);
    });
}

Mlook.init_collectsong_form = function (form) {
    form.onsubmit = function () {
        remote_submit_json(this, function (data) {
            if (data > 0) {
                $('#dialog').html('<div class="loadpop m">收藏成功！</div>');
                set_overlay();
            } else {
                if (data == "-1") {
                    $('#dialog').html('<div class="loadpop m">已经收藏！</div>');
                    set_overlay();
                } else {
                    $('#dialog').html('<div class="loadpop m">' + notice[6] + '</div>');
                    set_overlay();
                }
            }
            $('#rec_url_text').attr('value', 'http://');
            setTimeout(function () {
                $('#dialog, #overlay').fadeOut(close_dialog);
                if ($('input[name=type]', form).val() == "I") {
                    document.location.reload();
                }
            }, 400);
        });
        return false;
    }
    $(form).set_len_limit(2000);
}

//评价subject
Mlook.init_subject_collect = function (o) {
    $(o).click(function () {
        date = new Date();
        pop_win("加载中,请稍等...");
        var _ = $(this).attr('name').split('-');
        var btn_type = _[0],
            sid = _[1],
            pid = _[2],
            minerating = rating = _[3],
            title = _[4];
        var url = '/collect/add/?' + (sid ? 'sid=' + sid : '') + (pid ? '&pid=' + pid : '') + (rating ? '&rating=' + rating : '');
        $.getJSON(url, function (r) {
            if (r.state == 1) {
                show_dialog('<div class="loadpop m">评价成功...</div>');
                set_overlay();
                setTimeout(function () {
                    $('#dialog, #overlay').fadeOut(close_dialog);
                }, 400);
                rating = (r.rating * 1).toFixed(1);
                //
                starsnum_deal = (r.rating / 2).toFixed(1);
                starsnumarray = starsnum_deal.split('.');
                starsnum_float = (starsnumarray[1] > 4) ? 5 : 0;
                stars_add = "" + starsnumarray[0] + starsnum_float;
                $("#starsshow").removeClass();
                $('#starsshow').addClass("ll bigstar" + stars_add);
                //
                $('#starsnum').text(rating);
                $('#comnum').text(r.comnum);
                $('#n_rating').val(minerating);
                pop_win.close();
            }
            if (r.state == 0) {
                show_dialog('<div class="loadpop m">评价失败...</div>');
                set_overlay();
            } else {
                show_dialog(r.html);
                set_overlay();
                pop_win.close();
            }
        });
        return false;
    });
}

Mlook.init_video_del_comment = function (o) {
    var _ = $(o).attr('name').split('-');
    $(o).click(function () {
        var text = o.title;
        if (confirm("真的要" + text + "?") == true) {
            $.getJSON("/j/video/del_comment", {
                comment_id: _[1],
                video_id: _[2]
            }, function (r) {
                var insert_point = $('#c-' + _[1]);
                $(insert_point).html("");
            });
        }
        return false;
    })
}

////////////////////////////////////enc video
Mlook.init_song_interest = function (o) {
    var _ = $(o).attr('name').split('-');
    var songstr = $(o).attr("id").split("*")[1];
    var sid = $(o).attr("id").split("*")[2];
    var date = new Date();
    var url = '/songlike/?time=' + date;
    var rdialog = 'rdialog-' + _[1] + '-' + _[2];
    var uid;
    $(o).click(function () {
        $(o).toggleClass("interest");
        var hascss = $(o).hasClass("interest");
        if (hascss) {
            $(o).children().attr({
                src: "/static/pics/red-heart.gif",
                title: "取消'我喜欢'",
                alt: "取消'我喜欢'"
            });

        } else {

            $(o).children().attr({
                src: "/static/pics/gray-heart.gif",
                title: "我喜欢",
                alt: "我喜欢"
            });
        }
    });
    var f = function () {
        pop_win("加载中,请稍等...");
        uid = ((_[1] == 'I') && (_[2] == undefined)) ? $('input', $(o).parent())[0].value : _[2];
        rec = (_[3] == undefined) ? '' : _[3]
        var fcs = function (type) {
            if (type == 'I') {
                var s = $('.text', '#dialog');
                if (s.length) {
                    if (s[0].value.length) {
                        s[1].focus();
                    } else {
                        s[0].focus();
                    }
                }
            } else {
                $('#dialog').find(':submit').focus();
            }
        }
        $.getJSON(url, {
            song: songstr,
            sid: sid
        }, function (r) {
            pop_win.close();
            show_dialog(r.html);
            if (_[1] != 'I') {
                var rechtml = $('<div id="' + rdialog + '"></div>');
                rechtml.html(r.html).appendTo('body').hide();
            }
            load_event_monitor('#dialog');
            fcs(_[1]);
        });
        return false;
    }
    $(o).click(f);
    if (_[1] == 'I') {
        $(o).parent().parent().submit(f);
    }
}
////////////////////////////////////add to list
Mlook.init_list_add = function (o) {
    var _ = $(o).attr('name').split('-');
    var date = new Date();
    var url = '/subjectlist/add?time=2';
    var rdialog = 'rdialog-' + _[1] + '-' + _[2];
    var uid;
    var sid = _[1];
    var pid = _[2];
    var title = _[3];
    var f = function () {
        pop_win("加载中,请稍等...");
        uid = ((_[1] == 'I') && (_[2] == undefined)) ? $('input', $(o).parent())[0].value : _[2];
        rec = (_[3] == undefined) ? '' : _[3]
        var fcs = function (type) {
            if (type == 'I') {
                var s = $('.text', '#dialog');
                if (s.length) {
                    if (s[0].value.length) {
                        s[1].focus();
                    } else {
                        s[0].focus();
                    }
                }
            } else {
                $('#dialog').find(':submit').focus();
            }
        }
        $.getJSON(url, {
            sid: sid,
            pid: pid,
            title: title
        }, function (r) {
            pop_win.close();
            show_dialog(r.html);
            if (_[1] != 'I') {
                var rechtml = $('<div id="' + rdialog + '"></div>');
                rechtml.html(r.html).appendTo('body').hide();
            }
            load_event_monitor('#dialog');
            fcs(_[1]);
        });
        return false;
    }
    $(o).click(f);
    if (_[1] == 'I') {
        $(o).parent().parent().submit(f);
    }
}
Mlook.init_goods_join = function (o) {
    var _ = $(o).attr('name').split('-');
    var goodsid = $(o).attr("id").split("-")[1];
    var date = new Date();
    var url = '/goods/joins?time=' + date;
    var rdialog = 'rdialog-' + _[1] + '-' + _[2];
    var uid;
    var f = function () {
        uid = ((_[1] == 'I') && (_[2] == undefined)) ? $('input', $(o).parent())[0].value : _[2];
        rec = (_[3] == undefined) ? '' : _[3]
        var fcs = function (type) {
            if (type == 'I') {
                var s = $('.text', '#dialog');
                if (s.length) {
                    if (s[0].value.length) {
                        s[1].focus();
                    } else {
                        s[0].focus();
                    }
                }
            } else {
                $('#dialog').find(':submit').focus();
            }
        }
        $.getJSON(url, {
            goodsid: goodsid
        }, function (r) {
            show_dialog(r.html);
            if (_[1] != 'I') {
                var rechtml = $('<div id="' + rdialog + '"></div>');
                rechtml.html(r.html).appendTo('body').hide();
            }
            load_event_monitor('#dialog');
            fcs(_[1]);
        });
        return false;
    }
    $(o).click(f);
    if (_[1] == 'I') {
        $(o).parent().parent().submit(f);
    }
}
Mlook.init_follow_btn = function (o) {
    $(o).click(function () {

        date = new Date();
        var _ = $(this).attr('name').split('-');
        var btn_type = _[0],
            uid = _[1],
            follow = _[2];
        if (follow == 1) {
            show_dialog('<div class="loadpop m">正在提交...</div>');
            set_overlay();
        } else {
            show_dialog('<div class="loadpop m">正在删除...</div>');
            set_overlay();
        }
        $(o).toggleClass("interest");
        var hascss = $(o).hasClass("interest");
        if (hascss) {
            $(o).children().attr({
                src: "",
                title: "取消关注'",
                alt: "取消关注"
            });

        } else {

            $(o).children().attr({
                src: "/pics/add_contact1.gif",
                title: "关注此人",
                alt: "关注此人"
            });
        }
        var url = '/follows/add?' + (uid ? 'uid=' + uid : '');
        $.getJSON(url, function (r) {
            close_dialog();
        });

        return false;
    });
}
Mlook.init_friend_agree = function (o) {
    $(o).click(function () {
        date = new Date();
        var _ = $(this).attr('name').split('-');
        var uid = _[1],
            touid = _[2];
        show_dialog('<div class="loadpop m">正在提交...</div>');
        set_overlay();
        var url = '/friends/agree?' + (uid ? 'uid=' + uid : '') + (touid ? '&touid=' + touid : '');
        $.getJSON(url, function (r) {
            close_dialog();
        });
        return false;
    });
}
Mlook.init_friend_disagree = function (o) {
    $(o).click(function () {
        date = new Date();
        var _ = $(this).attr('name').split('-');
        var uid = _[1],
            touid = _[2];
        show_dialog('<div class="loadpop m">正在提交...</div>');
        set_overlay();
        var url = '/friends/disagree?' + (uid ? 'uid=' + uid : '') + (touid ? '&touid=' + touid : '');
        $.getJSON(url, function (r) {
            close_dialog();
        });
        return false;
    });
}
Mlook.init_friend_btn = function (o) {
    var _ = $(o).attr('name').split('-');
    var id = _[1];
    var date = new Date();
    var url = '/friends/add?time=' + date;
    var rdialog = 'rdialog-' + _[1];
    var f = function () {
        var fcs = function (type) {
            if (type == 'I') {
                var s = $('.text', '#dialog');
                if (s.length) {
                    if (s[0].value.length) {
                        s[1].focus();
                    } else {
                        s[0].focus();
                    }
                }
            } else {
                $('#dialog').find(':submit').focus();
            }
        };
        $.getJSON(url, {
            id: id
        }, function (r) {
            show_dialog(r.html);
            if (_[1] != 'I') {
                var rechtml = $('<div id="' + rdialog + '"></div>');
                rechtml.html(r.html).appendTo('body').hide();
            }
            load_event_monitor('#dialog');
            fcs(_[1]);
        });
        return false;
    };
    $(o).click(f);
    if (_[1] == 'I') {
        $(o).parent().parent().submit(f);
    }
}
Mlook.init_confirm_link = function (o) {
    if (!o.name) {
        //alert(o.name);
        $(o).click(function () {
            var text = o.title || $(o).text();
            return confirm("真的" + text + "?");
        });
    } else {
        var _ = o.name.split('-');
        var url = '/commend/delsong';
        $(o).click(function () {
            var bln = confirm("真的要删除?");
            if (bln) {
                //alert(_[2]);
                $.getJSON(url, {
                    id: _[0]
                }, function (j) {
                    if (j.html == "1") {
                        $(o).parent().parent().empty();
                    }
                    if (j.html == "-1") {
                        show_dialog('<div class="loadpop m">' + notice[2] + '</div>');
                        set_overlay();
                    }
                    if (j.html == "-2") {
                        show_dialog('<div class="loadpop m">' + notice[4] + '</div>');
                        set_overlay();
                    }
                })
            }
            return false;
        })
    }
}


var populate_tag_btns = function (title, div, tags, hash) {
    if (tags.length) {
        var p = $('<div style="line-height:180%" class="pl">' + title + '<br/></div>');
        $.each(tags, function (i, tag) {
            var btn = $('<span class="tagbtn"/>').addClass(hash[tag.toLowerCase()] ? 'rdact' : 'gract').text(tag);
            p.append(btn).append('   ');
        });
        div.append(p);
    }
}

Mlook.init_interest_form = function (form) {
    $(form).submit(function () {
        var sid = 1;
        remote_submit_json(this, function (data) {
            $("#collect_form_" + sid).html('')
            if (data.ok) {
                document.location.reload();
            } else {
                close_dialog();
            }
        });
        $('input', '#submits').hide();
        $('td', '#submits').append('<span class="m">正在保存...</span>');
        return false;
    });
    $(form.cancel).click(function () {
        var sid = 1;
        $("#collect_form_" + sid).html('');
    });
}

Mlook.init_stars = function (o) {
    var ratewords = {
        1: '很差',
        2: '较差',
        3: '还行',
        4: '推荐',
        5: '力挺'
    };
    var lighten_stars = function (i) {
        var rating = $(':hidden', o).attr('value') || 0;
        $('#rating #stars img', o).each(function (j) {
            var gif = this.src.replace(/\w*\.gif$/, ((j < i) ? 'sth' : ((j < rating) ? 'st' : 'nst')) + '.gif');
            this.src = gif;
        });
        if (i != 0) {
            $('#rating #rateword', o).text(ratewords[i]);
        } else {
            $('#rating #rateword', o).text(rating ? ratewords[rating] : '');
        }
    }

    lighten_stars(0);
    $('#rating img', o).mouseover(function () {
        lighten_stars(this.id.charAt(4));
    });
    if ($(':hidden', o).attr('name') == 'rating') {
        $('#rating img', o).click(function () {
            var rating = this.id.charAt(4);
            $(':hidden', o).attr('value', rating);
            lighten_stars(rating);
        });
    }
    $('#rating #stars', o).mouseout(function () {
        lighten_stars(0);
    });
}
Mlook.init_gstars = function (o) {
    var ratewords = {
        1: '-2',
        2: '-1',
        3: '0',
        4: '+1',
        5: '+2'
    };
    var lighten_stars = function (i) {
        var rating = $(':hidden', o).attr('value') || 0;
        $('#rating #stars img', o).each(function (j) {
            var gif = this.src.replace(/\w*\.gif$/, ((j < i) ? 'sth' : ((j < rating) ? 'st' : 'nst')) + '.gif');
            this.src = gif;
        });
        if (i != 0) {
            $('#rating #rateword', o).text(ratewords[i]);
        } else {
            $('#rating #rateword', o).text(rating ? ratewords[rating] : '');
        }
    }

    lighten_stars(0);
    $('#rating img', o).mouseover(function () {
        lighten_stars(this.id.charAt(4));
    });
    if ($(':hidden', o).attr('name') == 'rating') {
        $('#rating img', o).click(function () {
            var rating = this.id.charAt(4);
            $(':hidden', o).attr('value', rating);
            lighten_stars(rating);
        });
    }
    $('#rating #stars', o).mouseout(function () {
        lighten_stars(0);
    });
}
Mlook.init_show_add_friend = function (o) {
    var uid = $(o).attr('id').split('showaf_')[1];
    $(o).click(function () {
        url = "/j/people/" + uid + "/friendform";
        $.get(url, {}, function (ret) {
            friend_form_update(ret, uid);
        });
        return false;
    });
}

Mlook.init_tries_to_listen = function (o) {
    var m = $(o).attr('name');
    $(o).click(function () {
        var isFF = !document.all;
        if (m != '') {
            var _ = m.split('-')
            var w = _[0];
            var h = _[1];
        } else {
            var w = 384;
            var h = 450;
        }
        var left = (screen.width - w) / 2;
        var top = isFF ? (screen.height - h) / 2 : 50;
        window.open($(o).attr('href'), '', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left + ',scrollbars=0,resizable=0,status=1');
        return false;
    });
}

Mlook.init_discover = function (o) {
    $(o).submit(function (form) {
        var cat = "";
        cat = $(":radio:checked")[0].value;
        if (cat == "event") {
            $("#discover_s").attr("action", "searcha.php");
        } else if (cat == "group") {
            $("#discover_s").attr("action", "/group/search?m=" + $("#discover_text").value);
        } else {
            $("#discover_s").attr("action", "searcha.php");
        }
    });
}

var friend_form_update = function (data, uid) {
    $("#divac").html(data);
    $("#submitac").submit(function () {
        this.action = "/j/people/" + uid + "/friend";
        remote_submit_json(this, function (r) {
            $("#divac").parent().html(r['html']);
            $("#tip_wait").yellow_fade();
            load_event_monitor($(data));
        });
        return false;
    });
    $("#cancelac").click(function () {
        $("#divac").html("");
    });
}

Mlook.init_review_full = function (o) {
    var i = $(o).attr('id').split('_');
    var rid = i[1];
    var stype = i[2];
    $('.link', o).click(function () {
        var url = '/j/review/' + rid + '/' + stype;
        $.getJSON(url, function (r) {
            $(o).html(r.html);
            load_event_monitor($(o));
        });
        return false;
    });
}

Mlook.init_show_login = function (o) {
    $(o).click(function () {				 
		var url='/sign/min';
		$.getJSON(url, {}, function (r) {
        	show_dialog(r.html);
        });
		return false;
    });
}
Mlook.init_review_btn = function (o) {
    $(o).click(function () {
        if ($('#hiddendialog').length) {
            show_dialog($('#hiddendialog').html());
            load_event_monitor($('#dialog'));
        } else {

            var _ = $(o).attr('name').split('-');
            var date = new Date();
            var seconds = date.getSeconds();
            var url = 'review.php';
            var rdialog = 'rdialog-' + _[1] + '-' + _[2];
            var uid;
            var f = function () {
                sid = ((_[1] == 'I') && (_[2] == undefined)) ? $('input', $(o).parent())[0].value : _[2];
                rec = (_[3] == undefined) ? '' : _[3]
                var fcs = function (type) {
                    if (type == 'I') {
                        var s = $('.text', '#dialog');
                        if (s.length) {
                            if (s[0].value.length) {
                                s[1].focus();
                            } else {
                                s[0].focus();
                            }
                        }
                    } else {
                        $('#dialog').find(':submit').focus();
                    }
                }
                if ($('#' + rdialog).length) {
                    show_dialog($('#' + rdialog).html());
                    load_event_monitor('#dialog');
                    fcs(_[1]);
                } else {
                    $.getJSON(url, {
                        type: _[1],
                        sid: sid,
                        rec: rec,
                        time: seconds
                    }, function (r) {
                        show_dialog(r.html);
                        if (_[1] != 'I') {
                            var rechtml = $('<div id="' + rdialog + '"></div>');
                            rechtml.html(r.html).appendTo('body').hide();
                        }
                        load_event_monitor('#dialog');
                        fcs(_[1]);
                    });
                }
                return false;
            }
            $(o).click(f);
            if (_[1] == 'I') {
                $(o).parent().parent().submit(f);
            }
        }
        return false;
    });
}

var set_cookie = function (dict, days) {
    days = days || 30;
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = "; expires=" + date.toGMTString();
    for (var i in dict) {
        document.cookie = i + "=" + dict[i] + expires + "; path=/";
    }
}

function get_cookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
Mlook.init_hideme = function (o) {
    $(o).click(function () {
        $(this).parent().parent().parent().hide();
    });
}

Mlook.init_more = function (o) {
    $(o).click(function () {
        lastObj = $(this).prev().find("input");
        ids = /(.*_)(\d+)$/.exec(lastObj.attr("id"));
        id = ids[1] + (parseInt(ids[2]) + 1);
        a = lastObj.clone();
        a.attr("value", "");
        $(this).before('<br/>').before(a);
        a.attr('id', id).attr('name', id).wrap('<span></span>');
    })
}

Mlook.init_search_text = function (o) {
    if (!o.value || o.value == o.title) {
        $(o).addClass("greyinput");
        o.value = o.title;
    }
    $(o).focus(function () {
        $(o).removeClass("greyinput");
        if (o.value == o.title) o.value = "";
    });
    $(o).blur(function () {
        if (!o.value) {
            $(o).addClass("greyinput");
            o.value = o.title;
        }
    });
}

Mlook.init_checkreg = function (o) {
    $(o).find('.butt').click(function () {
        var check = true;
        $(o).find('input').each(function () {
            if (this.type != 'submit' && this.type != 'button') {
                if (this.value == '') {
                    $(this).next().css('display', 'inline');
                    check = false;
                } else {
                    $(this).next().css('display', 'none');
                }
            }
        });
        return check;
    });
}

Mlook.init_click_tip = function (o) {
    var tip = $(o).next('.blocktip');
    $(o).click(function () {
        tip.show().blur_hide();
        m = tip.width() + tip.pos().x - $.viewport_size()[0] > 0 ? -tip.width() : 0;
        tip.css('margin-left', m);
    })
    $('.hideme', tip).click(function () {
        tip.hide();
    })
}

function cleanTip() {
    if ($("#search_auto")[0].title == $("#search_auto")[0].value) {
        $("#search_auto")[0].value = '';
    }
}
Mlook.init_submit_link = function (o) {
    $(o).click(function () {
        $(o).parent().submit();
    });
}

var nowmenu = null;
var hidemenu = function (a) {
    a.find('.down').css('display', 'inline');
    a.find('.up').hide();
    a.next().hide();
    nowmenu = null;
    $('body').unbind('mousedown');
}
var openmenu = function (a) {
    if (nowmenu != null) {
        hidemenu(nowmenu);
    }
    a.find('.up').css('display', 'inline');
    a.find('.down').hide();
    a.next().show();
    nowmenu = a;
    $('body').mousedown(function () {
        if (a.parent().attr('rel') != 'on') {
            hidemenu(a);
        }
    });
}
$(function () {
    $("a", "#dsearch").each(function () {
        $(this).click(function () {
            urls = $(this).attr("href").split("?cat=");
            $("#ssform").attr("action", urls[0]);
            if (urls[1] != undefined) {
                $('<input type="hidden" name="cat" value="' + urls[1] + '" />').appendTo($("#ssform"));
            }
            cleanTip();
            $("#ssform").submit();
            return false;
        });
    });
    $('.arrow').click(function () {
        if ($(this).find('.up').is(':hidden')) {
            openmenu($(this));
        } else {
            hidemenu($(this));
        }
        this.blur();
    });

    $('.arrow').parent().hover(function () {
        $(this).attr('rel', 'on');
    }, function () {
        $(this).attr('rel', 'off');
    })
    if ($.suggest) $('#search_auto').suggest('/suggest/', {
        onSelect: function () {
            $(this).parents('form').append('<span><input name="add" value="1" type="hidden"/></span>').submit();

        }
    })

    $(document.links).click(function () {
        for (var i = 0, t = $(this); i < 10 && t[0] != document; t = t.parent(), i++) {
            if (t[0].id) {
                set_cookie({
                    f: t[0].id
                });
                break;
            }
        }
    })
})

var show_dialog = function (c, title,b) {
    if ($("#dialog").length) {
        return
    }
	title = (title==undefined)?'':title;
    //$("body").prepend('<div id="overlay"></div><div id="dialog" style="width:"'+(b||550)+'px;"></div>');
    $("body").prepend('<div id="overlay"></div><div id="dialog" style="width:auto"></div>');
	
    if (c != null) {
		if(b==true){
			c = '<div style="visibility: visible; top: 68px; left: 320px; width: 350px;"><span class="gact rr"><a onClick="close_dialog()" href="javascript:;" class="pop_win_close">X</a></span><div class="rectitle" style="background-color: #EBF5EB;"><h2>'+title+'</h2></div></div>' + c;
		}
        $("#dialog").html(c)
    } else {
        $("#dialog").html('<a onclick="close_dialog()" href="javascript:;" class="pop_win_close">X</a>'+"<div class='loadpop'>正在载入，请稍候...</div>")
    }

    if ($("#dialog").width() < 300) {

        $("#dialog").width(300);
    }

    if ($("#dialog").height() < 100) {

        $("#dialog").height(100);
    }
    set_overlay()
};
var set_overlay = function () {
    var d = ($.browser.msie ? -2 : 16),
        c = $("#dialog")[0],
        b = c.offsetWidth,
        e = (document.body.offsetWidth - b) / 2;
    $("#overlay").css({
        height: c.offsetHeight + d,
        width: b + 16,
        left: e + 5 + "px"
    });
    c.style.left = e + "px"
};
var close_dialog = function () {
    $("#overlay").unbind("click");
    $("#dialog,#overlay,.bgi").remove();
    if (typeof document.body.style.maxHeight == "undefined") {
        $("body", "html").css({
            height: "auto",
            width: "auto"
        });
        $("html").css("overflow", "")
    }
    document.onkeydown = "";
    return false
};
var refine_dialog = function () {
    if (!$("#dialog").length) {
        return
    }
    var b = navigator.userAgent.toLowerCase();
    var c = 0.5 * ($.viewport_size()[1] - $("#dialog")[0].offsetHeight) + 140;
    $("#dialog,#overlay").css("top", c);
    set_overlay()
};
Mlook.init_show_full = function (b) {
    $(b).click(function () {
        $(b).parents(".short").hide();
        $(b).parents(".short").next().show()
    })
};
Mlook.init_show_short = function (b) {
    $(b).click(function () {
        $(b).parents(".all").hide();
        $(b).parents(".all").prev().show()
    })
};


Mlook.init_collect_btn = function (o) {
    $(o).click(function () {


        date = new Date();
        var _ = $(this).attr('name').split('-');
        var btn_type = _[0],
            sid = _[1],
            interest = _[2],
            rating = _[3];
        if (rating > 0) {
            show_dialog('<div class="loadpop m">正在提交...</div>');
            set_overlay();
        } else {
            show_dialog('<div class="loadpop m">正在删除...</div>');
            set_overlay();
        }
        var url = 'songdo.php?do=12&' + (sid ? 'sid=' + sid : '') + (rating ? '&rating=' + rating : '');
        $.getJSON(url, function (r) {
            close_dialog();
            document.location.reload();
        });

        return false;
    });
}
//评价专辑
Mlook.init_album_rec = function (o) {
    $(o).click(function () {
        date = new Date();
        pop_win("加载中,请稍等...");
        var _ = $(this).attr('name').split('-');
        var btn_type = _[0],
            albumid = _[1],
            rating = _[3];
        var url = '/album/rating/?' + (albumid ? 'id=' + albumid : '') + (rating ? '&rating=' + rating : '');
        $.getJSON(url, function (r) {
            if (r.state == 1) {
                show_dialog('<div class="loadpop">评价成功...</div>');
                set_overlay();
                setTimeout(function () {
                    $('#dialog, #overlay').fadeOut(close_dialog);
                }, 400);
                rating = (r.rating * 1).toFixed(1);
                //
                starsnum_deal = (r.html * 1).toFixed(1);
                starsnumarray = starsnum_deal.split('.');
                starsnum_float = (starsnumarray[1] > 4) ? 5 : 0;
                stars_add = "" + starsnumarray[0] + starsnum_float;
                $("#starsshow").removeClass();
                $('#starsshow').addClass("ll bigstar" + stars_add);
                //
                $('#starsnum').text(rating);
                $('#comnum').text(r.numraters);
                pop_win.close();
            }
            if (r.state == 0) {
                show_dialog('<div class="loadpop">评价失败...</div>');
                set_overlay();
            } else {
                show_dialog(r.html);
                set_overlay();
                pop_win.close();
            }
        });
        return false;
    });
}
//收藏专辑
Mlook.init_albumcollect_btn = function (o) {
    $(o).click(function () {
        date = new Date();
        var _ = $(this).attr('name').split('-');
        var id = _[0],
            Do = _[1];

        if (Do == 111) {
            show_dialog('<div class="loadpop m">正在提交...</div>');
            set_overlay();
        } else {
            show_dialog('<div class="loadpop m">正在删除...</div>');
            set_overlay();
        }
        var url = 'albumdo.php?' + (id ? 'albumid=' + id : '') + (Do ? '&do=' + Do : '');
        $.getJSON(url, function (r) {

            close_dialog();
            document.location.reload();
        });

        return false;
    });
}
//专辑删除音乐
Mlook.init_albumdelsong_link = function (o) {
    if (!o.name) {
        //alert(o.name);
        $(o).click(function () {
            var text = o.title || $(o).text();
            return confirm("真的" + text + "?");
        });
    } else {
        var _ = o.name.split('-');
        var url = '/album/delsong';
        $(o).click(function () {
            var bln = confirm("真的要删除?");
            if (bln) {
                //alert(_[2]);
                $.getJSON(url, {
                    albumid: _[0],
                    songid: _[1]
                }, function (j) {
                    if (j.html == "1") {
                        $(o).parent().parent().remove();
                    }
                    if (j.html == "-1") {
                        show_dialog('<div class="loadpop m">' + notice[2] + '</div>');
                        set_overlay();
                    }
                    if (j.html == "-2") {
                        show_dialog('<div class="loadpop m">' + notice[4] + '</div>');
                        set_overlay();
                    }
                })
            }
            return false;
        })
    }
}
//评价音乐
Mlook.init_song_rec = function (o) {
    $(o).click(function () {
        date = new Date();
        pop_win("加载中,请稍等...");
        var _ = $(this).attr('name').split('-');
        var btn_type = _[0],
            songid = _[1],
            rating = _[3];
        var url = '/rec/songrating/?' + (songid ? 'id=' + songid : '') + (rating ? '&rating=' + rating : '');
        $.getJSON(url, function (r) {
            if (r.state == 1) {
                show_dialog('<div class="loadpop m">评价成功...</div>');
                set_overlay();
                setTimeout(function () {
                    $('#dialog, #overlay').fadeOut(close_dialog);
                }, 400);
                rating = (r.html * 2).toFixed(1);
                //
                starsnum_deal = (r.html * 1).toFixed(1);
                starsnumarray = starsnum_deal.split('.');
                starsnum_float = (starsnumarray[1] > 4) ? 5 : 0;
                stars_add = "" + starsnumarray[0] + starsnum_float;
                $("#starsshow").removeClass();
                $('#starsshow').addClass("ll bigstar" + stars_add);
                //
                $('#starsnum').text(rating);
                $('#comnum').text(r.comnum);
                pop_win.close();
            }
            if (r.state == 0) {
                show_dialog('<div class="loadpop m">评价失败...</div>');
                set_overlay();
            } else {
                show_dialog(r.html);
                set_overlay();
                pop_win.close();
            }
        });
        return false;
    });
}
//add list 
Mlook.init_listaddsubject_form = function (form) {
    form.onsubmit = function () {
        remote_submit_json(this, function (data) {
            if (data > 0) {
                $('#dialog').html('<div class="loadpop m">添加成功！</div>');
                set_overlay();
            } else {
                if (data == "-1") {
                    $('#dialog').html('<div class="loadpop m">已经添加！</div>');
                    set_overlay();
                } else {
                    $('#dialog').html('<div class="loadpop m">' + notice[4] + '</div>');
                    set_overlay();
                }
            }
            $('#rec_url_text').attr('value', 'http://');
            setTimeout(function () {
                $('#dialog, #overlay').fadeOut(close_dialog);
                if ($('input[name=type]', form).val() == "I") {
                    document.location.reload();
                }
            }, 400);
        });
        return false;
    }
    $(form).set_len_limit(2000);
}
Mlook.init_listcollect_btn = function (o) {
    $(o).click(function () {


        date = new Date();
        var _ = $(this).attr('name').split('-');
        var id = _[0],
            Do = _[1];

        if (Do == 111) {
            show_dialog('<div class="loadpop m">正在提交...</div>');
            set_overlay();
        } else {
            show_dialog('<div class="loadpop m">正在删除...</div>');
            set_overlay();
        }
        var url = 'listdo.php?' + (id ? 'listid=' + id : '') + (Do ? '&do=' + Do : '');
        $.getJSON(url, function (r) {

            close_dialog();
            document.location.reload();
        });

        return false;
    });
}

Mlook.init_nine_collect_btn = function (o) {
    $(o).click(function () {
        var _ = $(this).attr('name').split('-');
        var btn_type = _[0],
            sid = _[1],
            interest = _[2];
        var url = '/j/subject/' + sid + '/interest';
        $.getJSON(url, interest && {
            interest: interest
        }, function (r) {
            var html = $('<div></div>').html(r.html);
            var tags = r.tags;
            var content = tags.join(' ');
            $('input[@name=tags]', html).val((content.length > 1) ? content + ' ' : content);
            var hash = {};
            $.each(tags, function (i, tag) {
                hash[tag.toLowerCase()] = true;
            });
            populate_tag_btns('我的标签(点击添加):', $('#mytags', html), r.my_tags, hash);
            populate_tag_btns("Mlook成员常用的标签(点击添加):", $('#populartags', html), r.popular_tags, hash);
            if (btn_type == 'pbtn') $('form', html).append('<div id="src_pbtn"></div>');
            $("#collect_form_" + sid).html("").append('<p class="ul"></p>').append(html);
            load_event_monitor($("#collect_form_" + sid));
        });
        return false;
    });
}
//talk about song
Mlook.init_rec_btn = function (o) {
    var _ = $(o).attr('name').split('-');
    var date = new Date();
    var url = '/rec/songrec/?time=' + date.getSeconds();
    var rdialog = 'rdialog-' + _[1] + '-' + _[2];
    var uid;
    var f = function () {
        uid = ((_[1] == 'I') && (_[2] == undefined)) ? $('input', $(o).parent())[0].value : _[2];
        rec = (_[3] == undefined) ? '' : _[3]
        var fcs = function (type) {
            if (type == 'I') {
                var s = $('.text', '#dialog');
                if (s.length) {
                    if (s[0].value.length) {
                        s[1].focus();
                    } else {
                        s[0].focus();
                    }
                }
            } else {
                $('#dialog').find(':submit').focus();
            }
        }
        if ($('#' + rdialog).length) {
            show_dialog($('#' + rdialog).html());
            load_event_monitor('#dialog');
            fcs(_[1]);
        } else {
            $.getJSON(url, {
                sid: _[2],
                rating: 4,
                song: _[3]
            }, function (r) {
                show_dialog(r.html);
                load_event_monitor('#dialog');
            });
        }
        return false;
    }
    $(o).click(f);
    if (_[1] == 'I') {
        $(o).parent().parent().submit(f);
    }
}
Mlook.init_rec_form = function (form) {
    form.onsubmit = function () {
        remote_submit_json(this, function (data) {
            $('#dialog').html('<div class="loadpop m">提交成功</div>');
            set_overlay();
            $('#rec_url_text').attr('value', 'http://');
            setTimeout(function () {
                $('#dialog, #overlay').fadeOut(close_dialog);
                if ($('input[name=type]', form).val() == "I") {
                    document.location.reload();
                }
            }, 400);
        });
        return false;
    }
    $(form).set_len_limit(2000);
}
Mlook.init_goods_rec = function (o) {
    var _ = $(o).attr('name').split('-');
    var date = new Date();
    var url = '/rec/goodsrec';
    var rdialog = 'rdialog-' + _[1] + '-' + _[2];
    var uid;
    var f = function () {
        uid = ((_[1] == 'I') && (_[2] == undefined)) ? $('input', $(o).parent())[0].value : _[2];
        rec = (_[3] == undefined) ? '' : _[3]
        var fcs = function (type) {
            if (type == 'I') {
                var s = $('.text', '#dialog');
                if (s.length) {
                    if (s[0].value.length) {
                        s[1].focus();
                    } else {
                        s[0].focus();
                    }
                }
            } else {
                $('#dialog').find(':submit').focus();
            }
        }
        if ($('#' + rdialog).length) {
            show_dialog($('#' + rdialog).html());
            load_event_monitor('#dialog');
            fcs(_[1]);
        } else {
            $.getJSON(url, {
                orderid: _[1],
                goodsid: _[2],
                rating: _[3]
            }, function (r) {
                show_dialog(r.html);
                if (_[1] != 'I') {
                    var rechtml = $('<div id="' + rdialog + '"></div>');
                    rechtml.html(r.html).appendTo('body').hide();
                }
                load_event_monitor('#dialog');
                fcs(_[1]);
            });
        }
        return false;
    }
    $(o).click(f);
    if (_[1] == 'I') {
        $(o).parent().parent().submit(f);
    }
}
Mlook.init_rec_reply = function (o) {
    var _ = o.name.split('-');
    var url = '/j/rec_comment';
    if (!o.rev) {
        $(o).attr('rev', 'unfold');
    }
    $(o).click(function () {
        if (o.rev != 'unfold') {
            $(o).parent().parent().next().remove();
            $(o).html($(o).attr('rev'));
            o.rev = 'unfold';
        } else if (o.rel != "polling") {
            o.rel = "polling"
            $.getJSON(url, {
                rid: _[2],
                type: _[3],
                n: _[4],
                ni: _[5]
            }, function (r) {
                $('<div class="recreplylst"></div>').insertAfter($(o).parent().parent()).html(r.html);
                load_event_monitor($(o).parent().parent().next());
                $(o).attr('rev', $(o).html()).text('隐藏回应');
                o.rel = ""
            })
        }
        return false;
    })
}

Mlook.init_reply_form = function (form) {
    $(form).attr('action', $(form).attr('rev'));
    var n = $(form).attr('name');
    $(form).submit(function () {
        remote_submit_json(this, function (r) {
            var replst = $(form).parent();
            $(replst).html(r.html);
            load_event_monitor(replst);
            if (n == 'n') {
                var a = $('<span><a href="javascript:void(0)">添加回应</a></span>');
            } else {
                var a = $('<span style="margin-left:53px"><a href="javascript:void(0)">添加回应</a></span>');
            }
            $('form', replst).hide().after(a);
            a.click(function () {
                $(this).prev().show();
                $(this).remove();
            })
        });
        $(':submit', form).attr('disabled', 1);
        return false;
    })
    $(form).set_len_limit(140);
}

Mlook.init_video_comment = function (form) {
    $(form).submit(function () {
        remote_submit_json(this, function (r) {
            var insert_point = $('#comments');
            $(insert_point).html(r.html);
            load_event_monitor(insert_point);
            $(':submit', form).attr('disabled', 0);
            $('textarea', form).attr('disabled', 0);
            $('textarea', form).attr('value', '');
        }, true, '/j/video/add_comment');
        return false;
    })
}

Mlook.init_noti_form = function (form) {
    $(":submit", form).click(function () {
        $(this).addClass('selected');
    });
    $(form).attr('action', '/j/request/');
    $(form).submit(function () {
        action_ext = "?nid=" + form.nid.value + "&extra=" + form.extra.value;
        form.confirm.disabled = true;
        if (/selected/.test(form.confirm.className)) {
            action_ext = action_ext + "&confirm=y";
        }
        form.ignore.disabled = true;
        if (/selected/.test(form.ignore.className)) {
            action_ext = action_ext + "&ignore=y";
        }
        form.action = form.action + action_ext;
        remote_submit_json(this, function (r) {
            $(form).parent().html(r.html);
        });
        return false;
    });
}

Mlook.init_editable = function (o) {
    var disp = $('#display', o),
        form = $('form', o)[0],
        a = $('a', '#edi');
    var show = function (t) {
        if (t != undefined) {
            disp.text(t);
            if (disp.text() == '') {
                a.text('点击添加描述').addClass('album_photo');
            } else {
                a.text('修改').removeClass('album_photo');
            }
        }
        disp.show();
        $(form).hide();
        $('#edi').show();
    }
    show(disp.text());
    if (form.name) $(form).set_len_limit(form.name);
    $(form).submit(function () {
        remote_submit_json(form, function (r) {
            show(r.desc);
        })
        $('textarea', form)[0].value = "正在保存...";
        return false;
    })
    $('.cancel', form).click(function () {
        show()
    });
    $('#edi', o).click(function () {
        $('#display,#edi').hide();
        $('input,textarea', 'form').attr('disabled', 0);
        $('textarea', o)[0].value = disp.text();
        $(form).show();
        $('textarea', o).focus();
        return false;
    })
}

Mlook.init_show_video = function (o) {
    var eid = paras($(o).attr('href'))['from'];
    $(o).css('position', 'relative').attr('href', 'javascript:void(0)').attr('target', '');
    var overlay = $('<div></div>').addClass('video_overlay');
    $('div', o).append(overlay);
    var fhtml = $('img', o).attr('name');
    $(o).click(function () {
        var closebtn = $('<a href="javascript:void(0)">缩进</a>');
        if (eid != undefined) $.get("/j/recommend?from=" + eid);
        closebtn.click(function () {
            $(o).show();
            $(this).prev().remove();
            $(this).remove();
        })

        $(o).after(closebtn).after($('<em>' + fhtml + '</em>'));
        $(o).hide();
    })
}

Mlook.init_morerec = function (o) {
    $(o).click(function () {
        var n = $(o).parent().next();
        if (n.is(':hidden')) {
            n.show()
        } else {
            n.next().show()
        }
        $(o).remove();
    })
}

Mlook.init_search_result = function (o) {
    $('#sinput').suggest('/j/subject_suggest', {
        resultsClass: 'rc_results',
        onSelect: function () {
            $(o).append('<span><input name="add" value="1" type="hidden"/></span>').submit();
        }
    });
}

Mlook.init_prompt_link = function (o) {
    $(o).click(function () {
        var val = prompt(o.title || '请输入');
        if (val) {
            location.href = o.href + (o.href.indexOf('?') == -1 ? '?' : '&') + o.name + '=' + encodeURIComponent(val);
        }
        return false;
    })
}

$.viewport_size = function () {
    var size = [0, 0];
    if (typeof window.innerWidth != 'undefined') {
        size = [window.innerWidth, window.innerHeight];
    } else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
        size = [document.documentElement.clientWidth, document.documentElement.clientHeight];
    } else {
        size = [document.body.clientWidth, document.body.clientHeight];
    }
    return size;
}

jQuery.fn.extend({
    pos: function () {
        var o = this[0];
        if (o.offsetParent) {
            for (var posX = 0, posY = 0; o.offsetParent; o = o.offsetParent) {
                posX += o.offsetLeft;
                posY += o.offsetTop;
            }
            return {
                x: posX,
                y: posY
            };
        } else return {
            x: o.x,
            y: o.y
        };
    },

    set_len_limit: function (limit) {
        var s = this.find(':submit:first');
        var oldv = s.attr('value');
        var check = function () {
            if (this.value && this.value.length > limit) {
                s.attr('disabled', 1).attr('value', '字数不能超过' + limit + '字');
            } else {
                s.attr('disabled', 0).attr('value', oldv);
            }
        }
        $('textarea', this).focus(check).blur(check).keydown(check).keyup(check);
    },

    set_caret: function () {
        if (!$.browser.msie) return;
        var initSetCaret = function () {
            this.p = document.selection.createRange().duplicate()
        };
        this.click(initSetCaret).select(initSetCaret).keyup(initSetCaret);
    },

    insert_caret: function (t) {
        var o = this[0];
        if (document.all && o.createTextRange && o.p) {
            var p = o.p;
            p.text = p.text.charAt(p.text.length - 1) == '' ? t + '' : t;
        } else if (o.setSelectionRange) {
            var s = o.selectionStart;
            var e = o.selectionEnd;
            var t1 = o.value.substring(0, s);
            var t2 = o.value.substring(e);
            o.value = t1 + t + t2;
            o.focus();
            var len = t.length;
            o.setSelectionRange(s + len, s + len);
            o.blur();
        } else {
            o.value += t;
        }
    },

    get_sel: function () {
        var o = this[0];
        return document.all && o.createTextRange && o.p ? o.p.text : o.setSelectionRange ? o.value.substring(o.selectionStart, o.selectionEnd) : '';
    },
    blur_hide: function () {
        var s = this,
            h = function () {
                return false
            };
        s.mousedown(h)
        $().mousedown(function () {
            s.hide().unbind('mousedown', h)
            $().unbind('mousedown', arguments.callee);
        })
        return this;
    },
    yellow_fade: function () {
        var m = 0,
            setp = 1,
            self = this;

        function _yellow_fade() {
            self.css({
                backgroundColor: "rgb(100%,100%," + m + "%)"
            })
            m += setp;
            setp += .5;
            if (m <= 100) {
                setTimeout(_yellow_fade, 35)
            } else {
                self.css({
                    backgroundColor: ""
                })
            }
        };
        _yellow_fade();
        return this;
    },
    hover_fold: function (type) {
        var i = {
            folder: [1, 3],
            unfolder: [0, 2]
        },
            s = function (o, n) {
                return function () {
                    $('img', o).attr("src", "pics/arrow" + n + ".gif");
                }
            }
            return this.hover(s(this, i[type][0]), s(this, i[type][1]));
    }
})

var check_form = function (form) {
    var _re = true;
    $(':input', form).each(function () {
        if ((/notnull/.test(this.className) && this.value == '') || (/most/.test(this.className) && this.value && this.value.length > /most(\d*)/.exec(this.className)[1])) {
            $(this).next().show();
            _re = false;
        } else {
            if (/attn/.test($(this).next().attr('className'))) $(this).next().hide();
        }
    })
    return _re;
}
var paras = function (s) {
    var o = {};
    if (s.indexOf('?') == -1) return {};
    var vs = s.split('?')[1].split('&');
    for (var i = 0; i < vs.length; i++) {
        if (vs[i].indexOf('=') != -1) {
            var k = vs[i].split('=');
            eval('o.' + k[0] + '="' + k[1] + '"');
        }
    }
    return o;
}

function delete_reply_notify(id) {
    if (!delete_reply_notify.id) {
        delete_reply_notify.id = id
        show_dialog($("#confirm_delete").html())
        $('#overlay').css('z-index', 100); // workaround for ff2 bug
    }
    return false;
};

function close_delete(is_delete) {
    if (is_delete) {
        var id = delete_reply_notify.id;
        $.get("/j/remove_notify?id=" + id)
        $("#reply_notify_" + id).fadeOut();
    }
    delete_reply_notify.id = null
    close_dialog()
}

function moreurl(self, dict) {
    var href = self.href,
        more = [];
    for (var i in dict) more.push(i + '=' + dict[i]);
    self.href += (href.indexOf('?') == -1 ? '?' : '&') + more.join('&');
}

function tip_win(e) {
    $(e).next(".blocktip").show().blur_hide();
}

tip_win.hide = function (e) {
    $(e).parents(".blocktip").hide()
}

function js_parser(htm) {
    var tag = "script>",
        begin = "<" + tag,
        end = "</" + tag,
        pos = pos_pre = 0,
        result = script = "";
    while ((pos = htm.indexOf(begin, pos)) + 1) {
        result += htm.substring(pos_pre, pos);
        pos += 8;
        pos_pre = htm.indexOf(end, pos);
        if (pos_pre < 0) {
            break;
        }
        script += htm.substring(pos, pos_pre) + ";";
        pos_pre += 9;
    }
    result += htm.substring(pos_pre, htm.length);

    return {
        htm: result,
        js: function () {
            eval(script)
        }
    };
}


function center(elem) {
    return {
        left: (document.documentElement.offsetWidth - elem.offsetWidth) / 2 + 'px',
        top: (document.documentElement.clientHeight - elem.offsetHeight) * .45 + 'px'
    }
}

function pop_win(htm) {
    if (!window.__pop_win) { //alert(window.__pop_win);
        var pop_win_bg = document.createElement("div");
        pop_win_bg.className = "pop_win_bg"
        pop_win_bg.classID = "pop_win_bg"
        document.body.appendChild(pop_win_bg)
        var pop_win_body = document.createElement("div");
        pop_win_body.className = "pop_win";
        document.body.appendChild(pop_win_body)
        __pop_win = {
            bg: pop_win_bg,
            body: pop_win_body,
            body_j: $(pop_win_body),
            bg_j: $(pop_win_bg)
        };
    }
    var b = __pop_win.body,
        body_j = __pop_win.body_j,
        dom = js_parser(htm);
    if (htm == '加载中,请稍等...') {

        b.innerHTML = '<div style="visibility: visible; top: 68px; left: 320px; width: 350px;"><span class="gact rr"><a onClick="pop_win.close()" href="javascript:;" class="pop_win_close">X</a></span><div class="rectitle" style="background-color: #EBF5EB;"><h2>加载  · · · · · ·</h2></div><div align="center"><img src="/pics/spinner.gif"/> 加载中,请稍等...</div></div>';
    } else {
        b.innerHTML = '<a onclick="pop_win.close()" href="javascript:;" class="pop_win_close">X</a>' + dom.htm;
    }
    body_j.css({
        display: "block"
    }).css(center(b)).css({
        visibility: "visible",
        zIndex: 101
    });
    dom.js();
    __pop_win.bg_j.css({
        height: b.offsetHeight + 20 + "px",
        width: b.offsetWidth + 20 + "px",
        left: b.offsetLeft - 10 + "px",
        top: b.offsetTop - 10 + "px",
        zIndex: 100
    }).show()

    if (!window.XMLHttpRequest) {
        __pop_win.bg.style.top = ""
    }
}
pop_win.close = function () {
    __pop_win.bg.style.display = "none";
    __pop_win.body.innerHTML = "";
    __pop_win.body.style.display = "none";
}

pop_win.load = function (url, cache) {
    pop_win("加载中,请稍等...");
    $.ajax({
        url: url,
        success: pop_win,
        cache: cache || false,
        dataType: "html"
    })
    return false
}

function RunTime(RateDT) { //RateDT=new Date(RateDT);
    BTarray = RateDT.split("-");
    // alert(BTarray[0]);
    Now = new Date();
    DiffYear = (Now.getFullYear() - BTarray[0]);
    if (DiffYear) return DiffTime = DiffYear + "年";
    else {
        DiffMonth = (Now.getMonth() + 1 - BTarray[1]);
        if (DiffMonth) return DiffTime = DiffMonth + "月";
        else {
            DiffDay = (Now.getDay() - BTarray[2]);
            if (DiffDay) return DiffTime = DiffDay + "天";
            else {
                DiffHour = (Now.getHours() + 8 - BTarray[3]);
                if (DiffHour) return DiffTime = DiffHour + "小时";
                else {
                    DiffMinute = (Now.getMinutes() - BTarray[4]);
                    if (DiffMinute) return DiffTime = DiffMinute + "分";
                    else {
                        DiffSeconds = (Now.getSeconds() - BTarray[5]);
                        return DiffTime = DiffSeconds + "秒";
                    }
                }
            }
        }
    }
}
function show(url,title) {
    pop_win("加载中,请稍等...");
    $.get(url, {}, function (r) {
        pop_win.close();
        show_dialog(r,title,true);
    });
    return false;
}
/*
$(function () {
    $("#header .site-nav-logo a").mouseover(function (a) {
        $(a.currentTarget).addClass("on")
    }).mouseout(function (a) {
        $(a.currentTarget).removeClass("on")
    })
});
                */