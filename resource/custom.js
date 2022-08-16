/*eslint-disable*/
let currentColorType = "all_color"
let currentMenuType = "all_menu"
let searchText = ""
let searchtimeout = null

function search() {
  clearTimeout(searchtimeout)
  searchtimeout = setTimeout(function () {
    searchText = $("#searchText").val()
    filterIcons()
  }, 300)
}
function down() {
  alert("敬请期待")
}
function copyName(name) {
  $("#input-" + name)[0].focus();
  $("#input-" + name)[0].select()
  document.execCommand('copy', false, null);
}

function showAPI() {
  $(".api_content").show()
  $(".mask").show()
}

function closeAPI() {
  $(".api_content").hide()
  $(".mask").hide()
}

function view(name) {
  let icon = iconsData.find(item => item.name === name)
  if ($("#iconview")) {
    $("#iconview").remove()
  }
  let str = ''
  let colorDiv = ''
  if (name.includes("colours")) {//多色
    str = `<svg class="icon" aria-hidden="true"><use xlink:href="#${icon.name}"></use></svg>`
    colorDiv = ''
  } else {//单色
    str = `<i class="${thirdClass} ${icon.name}"></i>`
    colorDiv = `
      <div class="view_color">
      <input type="color" id="view_color" onchange="changeViewColor('${icon.name}')"></input>
      <span id="res_color">#000000</span>
    </div>
    `
  }
  $(".mask").show()
  $("body").append(`
    <div id="iconview">
        ${colorDiv}
        <div class="header">
          <div>
            ${icon.zh_cn}
          </div>
          <div>
            ${icon.name}
          </div>
        </div>
        <div class="content">
        ${str}
        </div>
        <div class="close" onclick="closeIconview()">关闭</div>
    </div>
  `)
}
function closeIconview() {
  $("#iconview").hide()
  $(".mask").hide()
}
function changeViewColor(name) {
  var color = $("#view_color").val()
  $("#iconview ." + name).css("color", color)
  $("#res_color").text(color)
}

function changeClass(type) {
  $("div." + type + ">div").click(function (e) {
    let $e = $(e.target)
    if (!$e.hasClass("on")) {
      type === 'menu' ? currentMenuType = $e.attr("class") : currentColorType = $e.attr("class")
      $e.addClass("on").siblings().removeClass("on")
      filterIcons()
    }
  })
}

function filterIcons() {
  let res = []
  if (currentColorType === 'all_color') {
    res = iconsData
  } else if (currentColorType === 'single') {
    res = iconsData.filter(icon => !icon.name.includes("colours"))
  } else if (currentColorType === 'colours') {
    res = iconsData.filter(icon => icon.name.includes("colours"))
  }

  if (currentMenuType === 'all_menu') {
    res = res
  } else if (currentMenuType === 'pub') {
    res = res.filter(icon => icon.type === "0")
  } else if (currentMenuType === 'fun') {
    res = res.filter(icon => icon.type === "1")
  }

  if (searchText) {
    res = res.filter(item => item.name.includes(searchText) || item.zh_cn.includes(searchText))
  }
  renderHtml(res)
  renderAPI(res)
}

function renderHtml(datas) {
  $("#num").text(datas.length)
  $("#icon_content").empty()

  if (datas.length) {
    datas.map(icon => {
      let str = ``
      if (icon.name.includes("colours")) {//多色
        str = `<svg class="icon" aria-hidden="true"><use xlink:href="#${icon.name}"></use></svg>`
      } else {//单色
        str = `<i class="${thirdClass} ${icon.name}"></i>`
      }

      $("#icon_content").append(`<section> 
        <div class="name">${icon.zh_cn}</div> 
        <input type="text" id="input-${icon.name}" value="${icon.name}" readonly></input>
        <div class="icon_main">${str}</div>
        <div class="handle">
          <span class="copybtn" onclick="copyName('${icon.name}')">复制</span>
          <span class="downbtn" onclick="down('${icon.name}')">下载</span>
          <span class="view" onclick="view('${icon.name}')">查看</span>
        </div> 
        </section>`)
    })
  } else {
    $("#icon_content").append(`<div class="nodata">暂无数据</div>`)
  }

}

function renderAPI(res) {
  $("#api_wrap").empty()
  if (res.length) {
    res.map(item => {
      let str = ""
      if (item.name.includes("colours")) {
        str = `&lt;svg class="icon" aria-hidden="true" &gt; &lt;use xlink:href="#${item.name}" /&gt; &lt;/svg&gt;`
      } else {
        str = `&lt;span class="${thirdClass} ${item.name}" /&gt`
      }

      $("#api_wrap").append(`<div><span>${item.zh_cn}</span><span>${str}</span></div>`)
    })
  } else {
    $("#api_wrap").append(`<div class="nodata">暂无数据</div>`)
  }
}

function downLoadPng(name) {
  html2canvas(document.querySelector('#icon_' + name)).then(canvas => {
    const imgUrl = canvas.toDataURL('image/jpeg')
    const image = document.createElement('img')
    image.src = imgUrl
    // 将生成的图片放到 类名为 content 的元素中
    document.querySelector('#num').appendChild(image)
    const a = document.createElement('a')
    a.href = imgUrl
    // a.download 后面的内容为自定义图片的名称
    a.download = 'study_download'
    a.click()
  })
}
$(function () {
  changeClass("menu")
  changeClass("color")
  renderAPI(iconsData)
  $("#third_class").text(thirdClass)
})

