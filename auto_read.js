/*

2022-02-28 
http://www.wx-read.com?ch=tenread 
或 
http://www.wx-read.com?ch=jysz
或 
http://www.wx-read.com?ch=sixread
http://www.wx-read.com?ch=sixread&idx=1

# 设置云扫码倒计时秒数
http://www.read-mock.com/mock/read?ch=ysm&setDelay=0
*/

const $ = new Env(`阅读倒计时`);
// 随机倒计时秒数
$.min = 10
$.max = 10
$.chArr = {
  "ysm": 2, // 云扫码：提交页面会等够时长
  "tfb": -3, // 推粉宝
  "jxayd": -5, // 精选爱悦读
  "fqkk": 4, // 番茄看看
  "lbread": 6, // 萝卜阅读
  "tenread": -5, // 10秒读书
  "sixread": -5, // 66联盟
  "llb": -6, // 懒立帮(每批2次检测)
  "jyyy": 6, // 加油鸭鸭
  "kkj": -8, // 看看集
  "jysz": -8, // 金银手指
  "yqzh": 10, // 悦趣赚
  ...$.getjson('rchTimes', {}) // boxjs中设置的时长
}
$.chMap = {
  'lb1223': 'ysm',
  'zg01': 'tfb',
  'bwjl02': 'tenread',
  'lb01': 'lbread'
}
$.specBack = `['tfb','jyyy','jxayd','kkj','sixread']` // mac端返回两层的渠道
$.tfbInfo = $.getjson('tfbInfo', {}) // 记录的日期 day='yyyy-MM-dd'、检测篇数 nos=[]
$.fqHiddenDiv = $.getval('fqHiddenDiv')
$.parseParams = (url, params = {}) => {
  url.replace(/([^?&=]+)=([^?&=]*)/g, (rs, $1, $2) => {
    params[decodeURIComponent($1)] = decodeURIComponent($2);
    return rs;
  })
  return params
}
$.surgeTag = !($.getval('surgeTag') || 0)
$.wxHd = {'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) MicroMessenger/6.8.0(0x16080000) MacWechat/3.2.1(0x13020111) NetType/WIFI WindowsWechat MicroMessenger/6.8.0(0x16080000) MacWechat/3.2.1(0x13020111) Chrome/39.0.2171.95 Safari/537.36 NetType/WIFI WindowsWechat`}

!(async () => {
  if (typeof $request !== "undefined" && $request.method != 'OPTIONS') {
    let url = $request.url
    // 先判断是否响应处理: 添加mock/read请求url判断是由于Loon 2.1.13(338)商店版有个bug
    if (typeof $response !== "undefined" && url.indexOf('/mock/read') == -1) {
      let body = $response.body
      if (url.indexOf('nbadApi/info?') > 0) {
        // 悦趣赚、新动力
        let obj = $.toObj(body, {})
        if (obj.type!='auth' && obj.articleUrl) {
          obj.articleUrl = `http://www.read-mock.com/mock/read?ch=yqzh`
          $.done({body: $.toStr(obj)})
        }
      } else if (url.match(/^https?:\/\/.+\/read\/(\?|user\?|user\/tasks)/)) {
        // 精选爱悦读
        body = body.replace('window.location.href = link;', `window.location.href = (taskList[0].doneread || '1')-0?'http://www.read-mock.com/mock/read?ch=jxayd':link;`)
        $.done({body})
      } else if (url.match(/^https?:\/\/.+\/t555\/index\.html\?/)) {
        // 看看集
        body = body.replace('window.location.href = ret.data.url;', `window.location.href = 'http://www.read-mock.com/mock/read?ch=kkj';`)
          .replace('window.location.href = url;', `window.location.href = 'http://www.read-mock.com/mock/read?ch=kkj';`)
          .replace('sessionStorage.setItem("udata", JSON.stringify(ret.data));', `getTask();`)
        $.done({body})
      } else if (url.match(/^https?:\/\/.+\/user1\//)) {
        // 66联盟
        body = body.replace('window.location.href = link;', `window.location.href = (link.match(/^https?:\\/\\/mp\\.weixin\\.qq\\.com\\/s\\?.+/) && 'http://www.read-mock.com/mock/read?ch=sixread') || link;`)
          .replace(`} else if (res.code == '100003') {`, `} else if (res.code == '100003') {window.location.reload();`)
          // 新账号不自动阅读处理
          .replace(`$('.read-mask').show();`,`
          if(taskList[0].url && taskList[0].url.match(/^https?:\\/\\/mp\\.weixin\\.qq\\.com\\/s\\?.+/)){
            openArticle(1);
          } else {
            $('.read-mask').show();
          }
          `).replace(`setTimeout(function(){location.reload();}, 1000)`,'').replace(`// autoRead();`,`autoRead();`)
        $.done({body})
      } else if (!!~url.indexOf('/v4/user/get_user_task?uid=')) {
        // 66联盟提示
        let obj = $.toObj(body, {})
        if (obj.data && obj.data.task && obj.data.task.length > 0 && !obj.data.task[0].url.match(/^https?\:\/\/mp\.weixin\.qq\.com\/s\?.+/)) {
          $.log(`文章地址:${obj.data.task[0].url}`)
          $.msg($.name, '66联盟', '需滑动页面避免受限')
        }
      } else if (url.indexOf('/api/wx/read') > 0) {
        // 加油鸭鸭
        let obj = $.toObj(body, {})
        if (obj.data) {
          if (!obj.data.readUrl.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+#rd$/)) {
            obj.data.readUrl = `http://www.read-mock.com/mock/read?ch=jyyy`
            $.done({body: $.toStr(obj)})
          } else {
            $.msg($.name, '加油鸭鸭', JSON.stringify(obj, null, 2))
          }
        }
      } else if (url.indexOf('/getReadTasks') > 0) {
        // 懒立帮 100001-阅读时间不足5-10秒、100002｜100003-需检测阅读、
        let obj = $.toObj(body, {})
        if (['000000', '100001'].includes(obj.code+'') && obj.data.url.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/)) {
          obj.data.url = `http://www.read-mock.com/mock/read?ch=llb`
          $.done({body: $.toStr(obj)})
        } else if (obj.data && obj.data.url.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/)) {
          $.msg($.name, '懒立帮', '需滑动页面避免受限')
        }
      } else if (url.indexOf('/api/user/startRead') > 0) {
        // 花花
        let obj = $.toObj(body, {})
        if (['000000', '100001'].includes(obj.code+'') && obj.data.url.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/)) {
          obj.data.url = `http://www.read-mock.com/mock/read?ch=llb`
          $.done({body: $.toStr(obj)})
        } else if (obj.data && obj.data.url.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/)) {
          $.msg($.name, '懒立帮', '需滑动页面避免受限')
        }
      } else if (url.indexOf('task/fetchTask?') > 0) {
        // 金银手指
        let obj = $.toObj(body, {})
        if (obj.data && obj.data.taskUrl) {
          let params = $.parseParams(obj.data.taskUrl, {redirect_uri:''})
          if (params.redirect_uri) {
            params = $.parseParams(decodeURIComponent(params.redirect_uri), params)
            if (obj.data.testLink) {
              $.msg($.name, `金银手指:${obj.data.testLink}`, '需滑动页面避免受限')
              $.setval(`${Date.now()}`, params.sn)
            }
          }
        }
      } else if (url.indexOf('/read_channel/do_read') > 0) {
        // 10秒阅读 chksm
        let obj = $.toObj(body, {})
        let jumpUrl = obj.url || ''
        if (jumpUrl.match('task/read')) {
          // ignore it
        } else if (jumpUrl.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/) && jumpUrl.indexOf('&chksm=') > 0) {
          $.msg($.name, '10秒读书', '需滑动页面避免受限')
        } else if ((!jumpUrl && obj.jkey) || jumpUrl.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/)) {
          if (!jumpUrl && obj.jkey) {
            $.msg($.name, '10秒读书:⚠️没有跳转地址', JSON.stringify(obj, null, 2))
          } else {
            $.log(JSON.stringify(obj, null, 2))
          }
          obj.url = `http://www.read-mock.com/mock/read?ch=tenread&minDelay=6`
          $.done({body: $.toStr(obj)})
        }
      } else if (url.indexOf('/static/js/r.js') > 0) {
        if (body) {
          $.done({body: body.replace('window\["\\x61\\x6c\\x65\\x72\\x74"\]\(s18\["\\x6d\\x73\\x67"\]\);', 'window.location.reload();')})
        }
      } else if (url.indexOf('/fast_reada/do_read') > 0) {
        // 番茄看看(极速) chksm
        let obj = $.toObj(body, {})
        let jumpUrl = obj.url || ''
        if (jumpUrl.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/) && jumpUrl.indexOf('&chksm=') > 0) {
          $.msg($.name, '番茄看看', '需滑动页面避免受限')
        } else if ((!jumpUrl && obj.jkey) || jumpUrl.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/)) {
          if (!jumpUrl && obj.jkey) {
            $.msg($.name, '番茄看看:⚠️没有跳转地址', JSON.stringify(obj, null, 2))
          } else {
            $.log(JSON.stringify(obj, null, 2))
          }
          obj.url = `http://www.read-mock.com/mock/read?ch=fqkk`
          $.done({body: $.toStr(obj)})
        }
      } else if (url.indexOf('/t/show.html?ch=') > 0 && body) {
        body = body.replace(`sessionStorage.getItem('wx_times');`, `sessionStorage.getItem('wx_times_miss');`)
        $.done({body})
      } else if (url.match(/\/finishTask$/)) {
        // 番茄看看：标识当前批剩余阅读数
        let obj = $.toObj(body, {})
        if (obj.data && obj.data.infoView && (obj.data.infoView.num || obj.data.infoView.rest)) {
          obj.data.infoView['num'] = `${obj.data.infoView.num} | ${obj.data.infoView.rest}`
          if (obj.data.infoView.rest != 1 && (obj.url || '').match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/)) {
            obj.url = `http://www.read-mock.com/mock/read?ch=fqkk`
          }
          $.done({body: $.toStr(obj)})
        }
      } else if (url.match(/\/(reada|fast_reada)(\?|\/$|$)/)) {
        // 番茄看看首页响应处理
        if (body && $.fqHiddenDiv) {
            body = body.replace(`<div class="box">`, `<div class="box" style="display: none;">`)
            // .replace('></script>', `></script>
            // <script src="https://unpkg.com/vconsole/dist/vconsole.min.js"></script>
            // <script>
            //   var vConsole = new window.VConsole();
            //   localStorage.setItem('vConsole_switch_y', '18');
            // </script>`)
            $.done({body})
        }
      } else if (url.match(/\/yunonline\/v\d+\/redirect\/.+/)) {
        // 云扫码：限制提交阅读等待时长
        if (body) {
          body = body
          // .replace('></script>', `></script>
          //   <script src="https://unpkg.com/vconsole/dist/vconsole.min.js"></script>
          //   <script>
          //     var vConsole = new window.VConsole();
          //     localStorage.setItem('vConsole_switch_y', ${flag?'168':'18'});
          //   </script>`)
          .replace(`if(prize_data.type == 'read'){`, `
            if (prize_data.type == 'read') {
              var art_start_time = Date.parse(new Date()) / 1000;
              localStorage.setItem('art_start_time', art_start_time);
              location.href = prize_data.link + '?/';
            } else if (1 == 2) {`)
          .replace(`if(art_end_time - art_start_time>=3 && art_start_time){`, `
            if (art_start_time && art_end_time - art_start_time < 3) {
              setTimeout(function () {
                getGold(4);
              }, Math.min(3000, Math.max(0, (art_start_time - art_end_time + 4) * 1010)));
              art_start_time = art_end_time - 4;
            } else if (art_end_time - art_start_time >= 3 && art_start_time) {`)
          $.done({body})
        }
      } else if (url.match('https?://open\.weixin\.qq\.com/connect/oauth2/authorize\?.+(redirect\.php|redirect_uri=)')) {
        body = body.replace('自动登录中', '~加速跳转~').replace(/{window.location=window.authUrl},2e3/g, `{window.location=window.authUrl},2e1`).replace(/localStorage/g, 'sessionStorage')
        $.done({body})
      } else if (url.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/) && body) {
        // 微信文章页面注入返回/关闭按钮 ^https?://mp\.weixin\.qq\.com/s.+ url script-response-body auto_read.js
        let iBody = `<div class="tool_bars"><div id="innerBackJS" class="tool_bar">🔙</div><div id="closePG" class="tool_bar">⎋</div></div></body>`
        let iHead = `
        <style>
        .tool_bars{position: fixed; top: 69%; right: 0; z-index: 999; transform: translateY(-50%); width: 100px; height: 25px;}
        .tool_bar{float: left; width: 25%; height: 100%; background: #f7bb10; color: #fff; border-radius: 50%; text-align: center; margin: 5px; padding: 5px;}
        </style>
        </head>`
        let iScript = `
          setTimeout(() => {
            const innerBackJS_btn = document.querySelector("#innerBackJS");
            if (innerBackJS_btn) {
              innerBackJS_btn.addEventListener('click', function () {
                window.history.back();
              });
            }
            const closePG_btn = document.querySelector("#closePG");
            if (closePG_btn) {
              closePG_btn.addEventListener('click', function () {
                WeixinJSBridge.call('closeWindow');
              });
            }
          }, 6000);
        </script>`
        body = body.replace('</head>', iHead).replace('</script>', iScript).replace('</body>', iBody)
        $.done({body})
      } else if (url.indexOf('/read/finish') > 0) {
        let rtObj = $.toObj(body, {"code":-1,"message":"","data":{"check":false,"gain":0,"gold":0,"read":666,"remain":0}})
        if (rtObj.code == 0 && rtObj.data) {
          let today = $.time('yyyy-MM-dd')
          let yesterday = $.time('yyyy-MM-dd', new Date().getTime()-24*60*60*1000)
          let checkNos = $.tfbInfo[today] || []
          let oldNos = $.tfbInfo[yesterday] || []
          let defaultNos = $.tfbInfo['default'] || []
          let names = $.tfbInfo['names'] || []
          if (rtObj.data.check) {
            // 提交阅读为检测文章，需判断是否记录
            if (!checkNos.includes(rtObj.data.read - 0) && !checkNos.includes(rtObj.data.read - 1) && !checkNos.includes(rtObj.data.read - 2)) {
              if (checkNos.length == 0) {
                $.tfbInfo = {}
                $.tfbInfo[yesterday] = oldNos
                $.tfbInfo['default'] = defaultNos
                $.tfbInfo['names'] = names
              }
              checkNos.push(rtObj.data.read - 0)
              checkNos.sort((a, b) => a - b)
              $.tfbInfo[today] = checkNos
              $.setjson($.tfbInfo, 'tfbInfo')
            }
            $.msg($.name, `推粉宝:${rtObj.data.read}:${rtObj.data.check}`, '⚠️检测性文章')
          } else if (checkNos.includes(rtObj.data.read - 0 + 1) || oldNos.includes(rtObj.data.read - 0 + 1) || defaultNos.includes(rtObj.data.read - 0 + 1)) {
            rtObj.code = -1
            rtObj.message = '⚠️下篇检测，请手动阅读'
            $.msg($.name, `推粉宝:${rtObj.data.read}:${rtObj.data.check}`, '下篇是今日收集的检测文章，请手动续读')
            $.done({body:$.toStr(rtObj)})
          }
        }
      } else if (url.indexOf('/r/get?v=') > 0) {
        // 阅读赚 chksm
        let obj = $.toObj(body, {})
        let jumpUrl = (obj.data && obj.data.url) || ''
        if (jumpUrl.match(/https?:\/\/mp\.weixin\.qq\.com\/s.+/) || jumpUrl.match(/https?:\/\/cpu\.baidu\.com\//)) {
          if (jumpUrl.indexOf('chksm=') > 0) {
            $.msg($.name, '阅读赚', '需滑动页面避免受限')
          } else {
            obj.data.url = `http://www.read-mock.com/mock/read?ch=ydz`
            $.done({body: $.toStr(obj)})
          }
        }
      }  else {
        let params = $.parseParams(url, {})
        // 如果重定向的是微信文章，改写重定向地址
        let url302 = ($response.headers && $response.headers['Location']) || ''
        if (url302.match(/https?:\/\/mp\.weixin\.qq\.com\/s/)) {
          let mock = 0
          let param = ''
          if (url.match(/\/(reada|fast_reada)\/\w+\?/) || url.indexOf('task/read?ch=fq') > 0) {
            mock = 1 // mock倒计时页面 reada/toRead、reada/fast_reada/j、fast_reada/oiejr
            param=`?ch=fqkk`
            if (url.indexOf('reada/toRead?') > 0) {
              mock = url302.indexOf('&chksm=') == -1 ? 1 : 0
            }
          } else if (url.indexOf('/api/user/startRead') > 0) {
            mock = 1 // 花花mock倒计时页面
            if (params.ch) {
              param = `?ch=${$.chMap[params.ch]||params.ch}`
            }
          }else if (url.indexOf('task/read?ch=') > 0) {
            mock = 1 // mock倒计时页面
            if (params.ch) {
              param = `?ch=${$.chMap[params.ch]||params.ch}`
            }
          } else if (url.indexOf('/yunonline/v1/jump?') > 0) {
            param=`?ch=ysm`
            mock = url302.indexOf('&chksm=') == -1 ? 1 : 0
          } else if (url.indexOf('/task/takeUrl?') > 0) {
            if (params.sn) {
              // 金银手指10秒内获取过检测文章，不进倒计时
              let time = ($.getval(params.sn) || '0') - 0
              if ((Date.now() - time) / 1000 > 10) {
                param = `?ch=jysz&jumpUrl=${encodeURIComponent(url302)}&silent=1`
                mock = 1
              }
            }
          } else if (url.match(/\/read_task\/\w+\?/)) {
            param = `?ch=lbread`
            if (url302.indexOf('&chksm=') > 0) {
              param += `&jumpUrl=${encodeURIComponent(url302)}&silent=1`
            }
            mock = 1
          } else if (url.indexOf('/j/t?') > 0) {
            param = `?ch=ydz`
            mock = url302.indexOf('&chksm=') == -1 ? 1 : 0
          }
          if (mock) {
            $.log('修改重定向地址为倒计时空白页面')
            // let host = url.match(/^https?:\/\/(.+?)\//)[1]
            $response.headers['Location'] = `http://www.read-mock.com/mock/read${param}`
            $.done({headers: $response.headers})
          } else {
            $.msg($.name, `${params.ch||url}`, '需滑动页面避免受限')
          }
        } else if(url302) {
          let params2 = $.parseParams(url302, {})
          let tfbParam = '', ydzParam = ''
          if ((url.match(/\/read\/jump\/\d+.html.uid=\d+/) && url302.indexOf('task/read?ch=') == -1)||(url.match(/\/read\/jump\/\d+.html.uid=\d+/) && url302.indexOf('/t/show.html?ch=') == -1)) {
            // 推粉宝 scene=0#wechat_redirect 结尾文章链接进入倒计时(特定篇数也可能匹配上，所以判断到特定篇数时不进入倒计时)
            let jumlMock = (params2.link || '').match(/https?:\/\/mp\.weixin\.qq\.com\/s.+&scene=0#wechat_redirect$/)
            if (params.uid && params2.link) {
              if (jumlMock) {
                tfbParam = `&jumpUrl=${encodeURIComponent(params2.link)}&silent=1`
                let data = await getApi({url: params2.link.replace(/&chksm=.+?(&|#)/, '$1'), headers: $.wxHd}, 5000)
                if (data) {
                  let jumpname = (data.match(/nickname = "(.+?)";/) || ['', ''])[1]
                  if (!jumpname) {
                    jumpname = (data.match(/<strong class="profile_nickname">(.+?)<\/strong>/) || ['', ''])[1]
                  }
                  if (jumpname) {
                    if (($.tfbInfo['names'] || []).findIndex(name => ~jumpname.indexOf(name))>-1) {
                      tfbParam = '-'
                    } else {
                      tfbParam += `&jumpname=${encodeURIComponent(jumpname)}`
                    }
                  } else {
                    $.log(`未匹配到公众号名称：${url302}`)
                  }
                } else {
                  $.log(`未获取到文章页面数据：${url302}`)
                }
              }
            } else {
              $.log(JSON.stringify($response, null, 2))
            }
          } else if (url.match(/\/a\/\w+?\?qlru=/) && (params.qlru||'').indexOf('/j/t?') == -1) {
            ydzParam = '-'
          }
          if (url302.indexOf('task/read?ch=') > 0 || tfbParam || ydzParam) {
            // 进入倒计时
            if (url302.indexOf('jumpid=') > 0 || ydzParam) {
              // 阅读赚
              await getApi({url:url302, headers: $.wxHd}, 1500)
            }
            if (url.match(/\/(reada|fast_reada)\/\w+\?/)) {
              url302 = `http://www.read-mock.com/mock/read?ch=fqkk`
            } else if (url.indexOf('/yunonline/v1/jump?') > 0) {
              url302 = `http://www.read-mock.com/mock/read?ch=ysm`
            } else if (url.match(/\/read_task\/\w+\?/)) {
              url302 = `http://www.read-mock.com/mock/read?ch=lbread`
            } else if (url.match(/\/read\/jump\/\d+.html.uid=\d+/)) {
              if (tfbParam == '-') {
                $.msg($.name, `推粉宝`, '需滑动页面避免受限')
              } else {
                url302 = `http://www.read-mock.com/mock/read?ch=tfb${tfbParam}`
              }
            } else if (url.match(/\/a\/\w+?\?qlru=/)) {
              url302 = `http://www.read-mock.com/mock/read?ch=ydz`
            }
          }
          $response.headers['Location'] = url302
          $.done({headers: $response.headers})
        }
        // 处理响应体
        let body = $response.body || ''
        if (body) {
          if (url.indexOf('task/read?ch=') > 0) {
            let [, callback, json] = (body.match(/^(\w+)\(({[^()]+})\)$/) || ['', '', ''])
            if (callback && json) {
              json = $.toObj(json, {})
              if (json.url) {
                let po = $.parseParams(url, {ch:''})
                let param = ''
                if (po.ch) {
                  param = `?ch=${$.chMap[po.ch]||po.ch}`
                }
                json.url = `http://www.read-mock.com/mock/read${param}`
                body = `${callback}(${$.toStr(json)})`
                $.done({body})
              } else {
                $.msg($.name, `修改url失败:${po.ch}`, body)
              }
            }
          }
        }
      }
    // ===============================  请求重写  ===============================
    } else if ($request.headers && $request.headers['Connection-Type']) {
      delete $request.headers['Connection-Type']
      $.log(`脚本请求进重写了：${url}`)
      $.done({headers: $request.headers})
    } else if (url.indexOf('/mock/read') > 0) {
      let params = $.parseParams(url, {ch:''})
      if (params.ch) {
        let chMin = parseInt($.chArr[params.ch])
        if (!isNaN(chMin)) {
          if (!isNaN(params.setDelay)) {
            let rchTimes = {...$.getjson('rchTimes', {})}
            rchTimes[params.ch] = parseInt(params.setDelay)
            $.setjson(rchTimes, 'rchTimes')
            $.msg($.name, '设置倒计时秒数', JSON.stringify(rchTimes, null, 2))
            chMin = rchTimes[params.ch]
          }
          $.min = Math.abs(chMin)
          $.max = $.min + (chMin > 0 ? 1 : 0)
        }
      }
      // 含有指定的倒计时秒数，直接使用该数据
      $.min = (params.minDelay || $.min) - 0
      $.max = Math.max($.min, (params.maxDelay || $.max) - 0)
      let delay = parseInt(Math.random() * ($.max - $.min + 1) + $.min, 10)
      let articleDiv = ''
      if (params.jumpUrl) {
        articleDiv = `<div id="linkUrl" onclick="javascript:location.href='${params.jumpUrl}';" style="color: red;">↘️点击进入↙️</div>`
        if (!params.silent) {
          $.msg($.name, `跳转地址:${params.ch}`, params.jumpUrl)
        }
      }
       let body = `
      <html>
      <head><meta charset="UTF-8"></head>
      <style>div {position:relative; top:68%; left:22%; border:0px solid #000000; font-size: 16vw}</style>
      <body bgcolor="#D2E9FF">${articleDiv}<div id="timer" onclick="javascript:clickTime()"></div></body>
      <script>
        var oBox= document.getElementById('timer');
        var go = -1
        if (navigator && navigator.userAgent && (navigator.userAgent.indexOf('Macintosh;') > 0 || navigator.userAgent.indexOf('WindowsWechat') > 0) && !${$.specBack}.includes('${params.ch}')) {
          // macOS or window端微信需返回2次页面的情况
          go = -2
        }
        var maxtime = ${delay};
        function CountDown() {
          if (maxtime >= 0) {
            oBox.innerHTML = '' + maxtime  ;
            --maxtime;
          } else {
            clearInterval(timer);
            window.history.go(go);
          }
        }
        timer = setInterval("CountDown()", 1050);
        CountDown();
        function clickTime() {
          if (timer) {
            clearInterval(timer)
            timer = null
          } else {
            timer = setInterval("CountDown()", 1050);
          }
        }
        function jumpPage() {
          clickTime()
          window.location.href =url_add_random('${params.jumpUrl}')
        }
        function url_add_random(url, key) {
          var key = (key || '_r') + '='; //默认是"_r"
          var timestamp = +new Date();
          if (url.indexOf(key) > -1) {
            return url.replace(new RegExp(key + '\\d+'), key + timestamp);
          } else {
            if (url.indexOf('\?') > -1) {
              return url.split('?').join('?' + key + timestamp + '&')
            } else {
              if (url.indexOf('#') > -1) {
                return url.split('#').join('?' + key + timestamp + '#')
              } else {
                return url + '?' + key + timestamp;
              }
            }
          }
        }
      </script>
      </html>
      `
      const headers = {
        "Connection": "Close",
        'Content-Type': 'text/html; charset=utf-8'
      };
      if ($.isSurge() || $.isLoon()) {
        $.done({response: {status: 200, headers, body}})
      } else if ($.isQuanX()) {
        $.done({status: 'HTTP/1.1 200 OK', headers, body})
      }
    } else if (url.indexOf('task/read?ch=') > 0) {
      let po = $.parseParams(url, {ch:''})
      let param = ''
      if (po.ch) {
        param = `?ch=${$.chMap[po.ch]||po.ch}`
      }
      let data = await getApi({url, headers: $request.headers}, 3000)
      let [, callback, json] = (data.match(/^(\w+)\(({[^()]+})\)$/) || ['', '', ''])
      if (callback && json) {
        json = $.toObj(json, {})
        let body = data
        if (json.url) {
          json.url = `http://www.read-mock.com/mock/read${param}`
          body = `${callback}(${$.toStr(json)})`
        } else {
          $.msg($.name, `修改url失败:${po.ch}`, data)
        }
        const headers = {
          "Connection": "keep-alive",
          'Content-Type': 'text/html; charset=utf-8'
        };
        if ($.isSurge() || $.isLoon()) {
          $.done({response: {status: 200, headers, body}})
        } else if ($.isQuanX()) {
          $.done({status: 'HTTP/1.1 200 OK', headers, body})
        }
      } else {
        const headers = {
          "Connection": "keep-alive",
          'Content-Type': 'text/html; charset=utf-8',
          "Location": `http://www.read-mock.com/mock/read${param}`
        };
        if ($.isSurge() || $.isLoon()) {
          $.done({response: {status: 302, headers}})
        } else if ($.isQuanX()) {
          $.done({status: 'HTTP/1.1 302 Found', headers})
        }
      }
    } else if (url.indexOf('/yunonline/v1/gold?') > 0 || url.indexOf('/yunonline/v1/add_gold') > 0) {
      // 云扫码信息请求，直接代为转发，以便获取今日任务次数信息判断后续是否mock
      let body = $request.body || ''
      $.log($.name, body, url)
      let rtObj = ''
      let opts = {url, headers: $request.headers, body}
      if (url.indexOf('/yunonline/v1/gold?') > 0) {
        rtObj = await getApi(opts)
        // let signUrl = (url.match(/^(.+?\/v1\/gold).+/) || ['', ''])[1]
        // let params = $.parseParams(url, {})
        // if (signUrl && params.unionid) {
        //   let signBody = await postApi({url:signUrl.replace('v1/gold','v1/sign_in'), headers: $request.headers, body: `unionid=${params.unionid||''}`})
        //   $.log(`云扫码签到结果：${$.toObj(signBody,{}).msg}`)
        // }
      } else {
        rtObj = await postApi(opts)
      }
      rtObj = $.toObj(rtObj, {"errcode":410,"msg":"success","data":{"last_gold":"0","day_read":0,"day_gold":0,"remain_read":666}})
      const headers = {
        "Connection": "keep-alive",
        'Content-Type': 'application/json; charset=utf-8'
      };
      if ($.isSurge() || $.isLoon()) {
        $.done({response: {status: 200, headers, body: $.toStr(rtObj)}})
      } else if ($.isQuanX()) {
        $.done({status: 'HTTP/1.1 200 OK', headers, body: $.toStr(rtObj)})
      }
    } else if (url.match(/wx-read\.com\/?\?ch=.+/)) {
      let params = $.parseParams(url, {})
      params.idx = Math.max(0, parseInt(params.idx) || 0)
      let h5Url = ``
      let getH5Url = (data, defaultUrl, idx = 0) => {
        return ((data || '').match(`(h|url_h5|url_h52) = '(.+?)';`) || ['', '', ''])[2] || defaultUrl
      }
      let onlineUrl = async (idx) => ''
      switch (params.ch) {
        case 'fqkk':
          h5Url = `http://m.oo2u4.cn/entry` // http://m.pool8.cn/entry http://m.qqdgl.cn/entry
          onlineUrl = async (idx) => {
            // 根据番茄ck信息获取助力页面域名数据，并根据
            let backArr = $.getjson(`fqkk_back_url`, [])
            let fqkkUrl = backArr[idx - 1] || backArr[0]
            if (fqkkUrl) {
              fqkkUrl = fqkkUrl + '/fast_reada'
            }
            return fqkkUrl
          }
          getH5Url = (data, defaultUrl, idx = 0) => {
            let fqkkUrl = ((data || '').match(`(h|url_h5|url_h52) = '(.+?)';`) || ['', '', ''])[2] || defaultUrl
            if (fqkkUrl) {
              fqkkUrl = fqkkUrl + '/fast_reada'
            }
            return fqkkUrl
          }
          break;
        case 'tenread':
          h5Url = `http://h5.paike.pw/entry`; // http://h5.hljxinhao.top/entry
          break;
        case 'jysz':
          h5Url = `https://hh.102727.com/mini/getBackUrl`;
          getH5Url = (data, defaultUrl, idx = 0) => {
            let urlList = ($.toObj(data,{}).data || {}).urlList || []
            let jyszUrl = (urlList[idx] || urlList[0] || {}).value || defaultUrl
            if (jyszUrl) {
              jyszUrl = jyszUrl + '/fast_reada/'
            }
            return jyszUrl
          }
          break;
        case 'sixread':
          h5Url = `http://suxiaotang.cn/v4/version/url_read_random`;
          getH5Url = (data, defaultUrl, idx = 0) => {
            let obj = $.toObj(data,{}).data || {}
            let urlList = [obj.url || '', obj.url1 || '']
            return urlList[idx] || urlList[0] || defaultUrl
          }
          break;
        default:
          $.msg($.name, '未匹配到阅读地址标识', url)
      }
      if (h5Url) {
        let hasUrl = false
        if (params.idx) {
          // 尝试获取指定序号的备用链接，获取不到取默认的, 暂只实现番茄看看
          let backUrl = await onlineUrl(params.idx)
          if (backUrl) {
            h5Url = backUrl
            hasUrl = true
          }
        }
        if (!hasUrl) {
          let html = await getApi({url: h5Url, headers:{'User-Agent':$request.headers['User-Agent']}})
          h5Url = getH5Url(html, h5Url, params.idx)
        }
        $.log($.name, '获取阅读地址', `${url}\n\t\t\t👇\n${h5Url}`)
      } else {
        h5Url = 'https://www.google.com'
      }
      const headers = {
        "Connection": "Close",
        'Content-Type': 'text/html; charset=utf-8',
        "Location": h5Url
      }
      if ($.isSurge() || $.isLoon()) {
        $.done({response: {status: 302, headers}})
      } else if ($.isQuanX()) {
        $.done({status: 'HTTP/1.1 302 Found', headers})
      }
    } else if (url.match(/\/(reada|fast_reada)(\?|\/$|$)/) && $request.headers['Cookie']) {
      let fqkkBackList = []
      let urls = ['/user/zhuli', '/user/zhuli2', '/user/shoutu2']
      for (const path of urls) {
        try {
          let newUrl = url.replace(/\/(reada|fast_reada)/, path)
          if (url != newUrl) {
            let html = await getApi({...$request, url: newUrl}, 6000)
            fqkkBackList.push(...((html || '').match(/ -> https?:.+/g) || []).map(s => ((s || '').match(/(https?:\/\/.+)\//) || ['', ''])[1]).filter(s => s))
          }
        } catch (e) {
          $.logErr(e)
        }
      }
      if (fqkkBackList.length > 0) {
        $.setjson(fqkkBackList, `fqkk_back_url`)
        $.log(`更新番茄看看备用地址： ${JSON.stringify(fqkkBackList, null, 2)}`)
      }
    }
  }
})().catch((e) => $.logErr(e)).finally(() => $.done());

function getApi(opts, t = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      if ($.isSurge() && $.surgeTag) {
        opts.headers = {...opts.headers, 'Connection-Type': 'm'}
      } else if (!$.isSurge() && opts.headers) {
        delete opts.headers['Connection-Type']
      }
      $.get(opts, (err, resp, data) => {
        try {
          if (err) {
            $.logErr(`❌ API请求失败，请检查网络后重试\n url: ${opts.url} \n data: ${JSON.stringify(err, null, 2)}`)
          }
        } catch (e) {
          $.logErr(`url: ${opts.url}\nerror:${e}\ndata: ${data && data.substr(0, 999)}`)
        } finally {
          resolve(data||'')
        }
      })
    }, 0);
    if (t > 0) {
      setTimeout(() => resolve(''), t)
    }
  })
}
function postApi(opts, t = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      if ($.isSurge() && $.surgeTag) {
        opts.headers = {...opts.headers, 'Connection-Type': 'm'}
      } else if (!$.isSurge() && opts.headers) {
        delete opts.headers['Connection-Type']
      }
      $.post(opts, (err, resp, data) => {
        try {
          if (err) {
            $.logErr(`❌ API请求失败，请检查网络后重试\n url: ${opts.url} \n data: ${JSON.stringify(err, null, 2)}`)
          }
        } catch (e) {
          $.logErr(`url: ${opts.url}\nerror:${e}\ndata: ${data && data.substr(0, 999)}`)
        } finally {
          resolve(data||'')
        }
      })
    }, 0);
    if (t > 0) {
      setTimeout(() => resolve(''), t)
    }
  })
}

function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:i,statusCode:r,headers:o,rawBody:h}=t;e(null,{status:i,statusCode:r,headers:o,rawBody:h},s.decode(h,this.encoding))},t=>{const{message:i,response:r}=t;e(i,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){let i=require("iconv-lite");this.initGotEnv(t);const{url:r,...o}=t;this.got[s](r,o).then(t=>{const{statusCode:s,statusCode:r,headers:o,rawBody:h}=t;e(null,{status:s,statusCode:r,headers:o,rawBody:h},i.decode(h,this.encoding))},t=>{const{message:s,response:r}=t;e(s,r,r&&i.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
