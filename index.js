const WebpackIconfontPluginNodejs = require('webpack-iconfont-plugin-nodejs');
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
// icon json数据
const iconsData = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./resource/icons.json"), "utf-8"))

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
/**
 * 开始执行函数
 */
function run() {
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
      //过滤出彩色图标
      temp = temp.filter(item => item.name.includes(coloursFlagOfName))
      //保留各彩色icon的path
      temp.map(item => {
        let viewBox = item.svg.indexOf("viewBox")
        item.viewBoxSite = item.svg.substring(viewBox).split("\"")[1]

        let start = item.svg.indexOf("<path")
        let end = item.svg.lastIndexOf("</svg>")
        item.svg = item.svg.substring(start, end)
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
          //注入全局变量
          fs.writeFileSync(path.join(dir, 'fonts/view/icons.js'), "let thirdClass='" + thirdFontClass + "';let iconsData=" + JSON.stringify(iconsData))
          createHtml()
        }
      })
    })
  })
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
    $("body").empty().html(fs.readFileSync(path.join(dir, `../resource/template.html`)).toString())
    $("#num").text(iconsData.length)

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
