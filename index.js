const WebpackIconfontPluginNodejs = require('webpack-iconfont-plugin-nodejs');
const xlsx = require("node-xlsx")
const cheeiro = require("cheerio")
const path = require('path');
const express = require("express")
const app = express()
const fs = require("fs");
const dir = 'src'
//如果要与阿里的iconfont混用  这里指定阿里iconfont的类名（如果没做改动，这个类名默认是iconfont）
const runWithThird = false; // 是否与第三方混用
const thirdFontClass = "iconfont"  //需要兼容的第三方iconfont样式
const fileName = "iconfont"  //资源文件名
const coloursFlagOfName = "-colours" //多色图标的名称标识
const colours = [] //多色图标集合
let typeList = []

// icon json数据
const iconsData = getIconsJson()

app.use(express.static("./"))

const options = {
  fontName: 'my-icons',
  cssPrefix: 'icon',
  svgs: path.join(dir, 'svg/*.svg'),
  fontsOutput: path.join(dir, 'fonts/'),
  cssOutput: path.join(dir, `fonts/${fileName}.css`),
  htmlOutput: path.join(dir, 'fonts/view/index.html'),
  jsOutput: path.join(dir, `fonts/${fileName}.js`),
};


run()

function getIconsJson() {
  let resJson = []
  let list = xlsx.parse("icons.xlsx")
  if (list && list[0] && list[0].data && list[0].data.length > 1) {
    list[0].data.shift()
    typeList = [...new Set(list[0].data.map(icon => icon[1]))]
    typeList.sort()
    list[0].data.map(icon => {
      if (icon[0] && icon[1] && icon[2]) {
        resJson.push({
          name: icon[0],
          type: typeList.findIndex(type => type === icon[1]),
          zh_cn: icon[2]
        })
      } else {
        throw new Error("图标excel配置不正确，请校准！")
      }

    })
  } else {
    throw new Error("图标excel配置不正确，请校准！")
  }
  resJson.sort(function (a, b) {
    if (a.name >= b.name) {
      return 1
    } else {
      return -1
    }
  })
  return resJson
}
/**
 * 检查json数据
 */
function checkJson() {
  let temp = new Set(iconsData.map(item => item.name))
  if (temp.size !== iconsData.length) {
    throw new Error(`JSON中含有重复name的数据，请检查。`)
  }
}
/**
 * 开始执行函数
 */
function run() {
  checkJson()
  new WebpackIconfontPluginNodejs(options).build().then(createJs)
}

/**
 * 处理iconfont.js
 */
function createJs() {
  //读取js模板
  fs.readFile(path.join(dir, "../resource/jsTempalte.js"), (err, jsTpl) => {
    if (err) {
      console.error(err)
      return false
    }
    let jsTemp = jsTpl.toString()
    //读取js资源文件
    fs.readFile(options.jsOutput, (err, content) => {
      if (err) {
        console.error(err)
        return false
      }
      let temp = content.toString()
      //若出现重复的前缀，进行处理
      temp = temp.replace(/icon-icon-/g, `icon-`)
      temp = JSON.parse(temp.substring(temp.indexOf("[")))
      temp.map(icon => {
        let num = 200  //统一各svg宽高为200
        let width = icon.svg.match(/width="[0-9]*"/)
        let height = icon.svg.match(/height="[0-9]*"/)
        let fill = icon.svg.match(/fill="#[0-9a-zA-Z]*"/g)
        if (width) {
          icon.svg = icon.svg.replace(width[0], `width="${num}"`)
        }

        if (height) {
          icon.svg = icon.svg.replace(height[0], `height="${num}"`)
        }

        if (!width || !height) {
          icon.svg = icon.svg.replace(/<svg/ig, `<svg width="${num}" height="${num}" class="icon"`)
        }
        if (!icon.name.includes("-colours") && fill) {
          fill.map(fItem => {
            icon.svg = icon.svg.replace(fItem, ``)
          })
        }
        //将个icon的svg存入iconsData
        let excelIcon = iconsData.find(item => item.name === icon.name)
        if (excelIcon) {
          excelIcon.svg = icon.svg
          excelIcon.svg = excelIcon.svg.replace(/<svg/ig, `<svg id="svg-${icon.name}"`)
        }
      })
      //过滤出彩色图标
      temp = temp.filter(item => item.name.includes(coloursFlagOfName))
      //保留各彩色icon的path
      temp.map(item => {
        let viewBox = item.svg.indexOf("viewBox")
        item.viewBoxSite = item.svg.substring(viewBox).split("\"")[1]

        let svgIndex = item.svg.indexOf("<svg")
        let svgStr = item.svg.substring(svgIndex)
        let start = svgStr.indexOf(">")
        let end = svgStr.lastIndexOf("</svg>")
        item.svg = getSvgContent(svgStr.substring(start + 1, end))
      })
      //填充symbol模板
      let symbolList = temp.map(item => {
        //获取彩色icon的列表
        colours.push(item.name)
        return `<symbol id="${item.name}" viewBox="${item.viewBoxSite}">${item.svg}</symbol>`
      })
      //绘制svg图片
      jsTemp = jsTemp.replace(/<svg><\/svg>/, `<svg>${symbolList.join("")}</svg>`)
      //写入js资源文件
      fs.writeFile(options.jsOutput, "/*eslint-disable*/ \n" + jsTemp + "\n /*eslint-disable*/", (error) => {
        if (error) {
          console.error(error)
        } else {
          fs.copyFileSync(path.resolve(__dirname, "./resource/jquery.js"), path.resolve(__dirname, "./src/fonts/view/jquery.js"))
          fs.copyFileSync(path.resolve(__dirname, "./resource/custom.js"), path.resolve(__dirname, "./src/fonts/view/custom.js"))
          fs.copyFileSync(path.resolve(__dirname, "./resource/custom.css"), path.resolve(__dirname, "./src/fonts/view/custom.css"))
          fs.copyFileSync(path.resolve(__dirname, "./resource/svgAsPng.js"), path.resolve(__dirname, "./src/fonts/view/svgAsPng.js"))
          //注入全局变量
          let cusJs = ` let thirdClass='${thirdFontClass}';\n let iconsData=${JSON.stringify(iconsData)};`
          fs.writeFileSync(path.join(dir, 'fonts/view/icons.js'), cusJs)
          createHtml()
        }
      })
    })
  })
}
/**
 * 获取svg内容，处理样式
 * 每个svg的style都是全局的，所以当多个svg在一起时，sytle会相互覆盖
 * 这里将各个style中的fill，重写到path上，确保各个样式不会相互影响
 * @param {*} svg 
 */
function getSvgContent(svg) {
  let classList = svg.match(/class="[a-zA-Z0-9]+"/g)
  if (classList) {
    [...new Set(classList)].map(item => {
      let className = item.match(/"[a-zA-Z0-9]+"/)[0].replace(/"/g, "")
      let styleStart = svg.indexOf("." + className + "{")
      let styleTemp = svg.substring(styleStart + className.length + 2)
      let styleObj = styleTemp.substring(0, styleTemp.indexOf(";}")).split(":")
      let styleStr = `${styleObj[0]}="${styleObj[1]}"`

      let classReg = new RegExp(item, "ig")
      svg = svg.replace(classReg, styleStr)
    })
  }
  if (svg.includes("</defs>")) {
    svg = svg.substring(svg.indexOf("</defs>") + 7)
  }
  if (svg.includes("</title>")) {
    svg = svg.substring(svg.indexOf("</title>") + 8)
  }
  return svg
}
/**
 * 生成样例html
 */
function createHtml() {
  fs.readFile(options.htmlOutput, (err, content) => {
    if (err) {
      console.error(err)
      return false
    }
    let $ = cheeiro.load(content.toString())
    //引入样例的css资源文件和js资源文件
    $("style").before(`
      <link rel="stylesheet" href="custom.css"/>
      <script src="icons.js"></script> 
      <script src="svgAsPng.js"></script>
      <script src="jquery.js"></script>
      <script src="../${fileName}.js"></script>
      <script src="custom.js"></script>
    `)
    $("script").map((index, item) => {
      if (!$(item).attr("src")) {
        $(item).remove()
      }
    })
    $("style").remove()
    let oldLen = $("section").length
    let jsonLen = iconsData.length

    if (oldLen !== jsonLen) {
      throw new Error(`列表中的svg数量（${oldLen}）与配置文件中的svg数量（${jsonLen}）不一致。`)
    }

    $("body").empty().html(fs.readFileSync(path.join(dir, `../resource/template.html`)).toString())
    $("#num").text(iconsData.length)

    let menuStr = `<div class="all_menu on">全部</div>`
    typeList.map((type, index) => {
      menuStr = menuStr + `<div class="type${index}">${type}</div>`
    })
    $(".left .menu").empty().append(menuStr)

    iconsData.map(icon => {
      let str = ``
      if (icon.name.includes("colours")) {//多色
        str = `<svg id="icon_${icon.name}" class="icon" aria-hidden="true"><use xlink:href="#${icon.name}"></use></svg>`
      } else {//单色
        str = `<i class="${thirdFontClass} ${icon.name}" id="icon_${icon.name}"></i>`
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

    fs.writeFile(options.htmlOutput, $.html(), error => {
      if (error) {
        console.error(error)
      } else {
        createCss()
      }
    })

  })

}
/**
 * 生成css
 */
function createCss() {
  fs.readFile(options.cssOutput, (err, content) => {
    let temp = content.toString()
    const classList = temp.match(/\[class\^=".*icon"]/g)
    temp = temp.replace(classList[0], "." + thirdFontClass)
    temp = temp.replace(/icon-icon-/g, `icon-`)
    let iconCss = `
      .icon {
        width: 1em;
        height: 1em;
        vertical- align: -0.15em;
        fill: currentColor;
        overflow: hidden;
      }
    `
    temp = iconCss + temp

    let css = `
      .${thirdFontClass}{
        font-family: "${thirdFontClass}", "my-icons"!important;
        font-size: 16px;
        font-style: normal;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `
    //是否与第三方混用
    if (runWithThird) {
      fs.writeFile(path.join(dir, "fonts/resetFontFamily.css"), css, (error) => {
        if (error) {
          console.error(error)
        } else {
          fs.writeFile(options.cssOutput, temp, (e) => {
            if (e) {
              console.error(e)
            } else {
              startServe()
            }
          })
        }
      })
    } else {
      fs.writeFile(options.cssOutput, temp, (e) => {
        if (e) {
          console.error(e)
        } else {
          startServe()
        }
      })
    }
  })
}
/**
 * 启动服务
 */
function startServe() {
  app.listen(3000, () => {
    console.log("服务启动成功，http://localhost:3000")
  })
}
