const WebpackIconfontPluginNodejs = require('webpack-iconfont-plugin-nodejs');
const path = require('path');
const express = require("express")
const app = express()
const fs = require("fs");
const dir = 'src'
//如果要与阿里的iconfont混用  这里指定阿里iconfont的类名（如果没做改动，这个类名默认是iconfont）
const aliIconFontClass = "iconfont"  //需要兼容的第三方iconfont样式
const fileName = "iconfont"  //资源文件名
const coloursFlagOfName = "-colours" //多色图标的名称标识
const colours = [] //多色图标集合

app.use(express.static("./"))

const options = {
  fontName: 'my-icons',
  cssPrefix: 'icon',
  svgs: path.join(dir, 'svg/*.svg'),
  fontsOutput: path.join(dir, 'fonts/'),
  cssOutput: path.join(dir, `fonts/${fileName}.css`),
  htmlOutput: path.join(dir, 'fonts/index.html'),
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
  fs.readFile(path.join(dir, "../jsTempalte.js"), (err, jsTpl) => {
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
      fs.writeFile(options.jsOutput, jsTemp, (error) => {
        if (error) {
          console.log(error)
        } else {
          getCssTpl()
        }
      })
    })
  })
}
/**
 * 读取css模板
 */
function getCssTpl() {
  fs.readFile(path.join(dir, "../cssTemplate.css"), (err, content) => {
    if (err) {
      console.error(err)
      return false
    }
    let css = content.toString()
    createHtml(css)
  })
}
/**
 * 生成样例html
 */
function createHtml(css) {
  fs.readFile(options.htmlOutput, (err, content) => {
    if (err) {
      console.error(err)
      return false
    }
    let temp = content.toString()
    //引入样例的css资源文件和js资源文件
    temp = temp.replace(/<style>/, `<script src="${fileName}.js"/>\n<style>`)
    let styleStartIndex = temp.indexOf("<style>")
    let styleEndtIndex = temp.indexOf("</style>")
    let temp1 = temp.substring(0, styleStartIndex)
    let temp2 = temp.substring(styleEndtIndex + 8)
    //获取处理后的 html文件
    temp = temp1 + temp2
    temp = temp.replace("<body>", `<style>\n${css}\n</style>\n</head>\n<body>`)
    const h3List = temp.match(/<h3.*\/h3>/g)
    const h4List = temp.match(/<h4(.|\n|\r)*\/h4>/g)
    const divList = temp.match(/<hr\/>(.|\n|\r)*<div class="info"(.|\n|\r)*<hr\/>/g)

    let num = h3List[1].substring(h3List[1].indexOf("(") + 1, h3List[1].indexOf(" icons"))
    temp = temp.replace(h3List[0], "")
    temp = temp.replace(h4List[0], "")

    let str = `
      <div class="info">
        <h3>共${num}个图标</h3>
        <div>
          <span>单色图标：</span>
          <span class="exmpale">
            &lt;span class="${aliIconFontClass} icon-name" /&gt;
          </span>
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
          <span>多色图标：</span>
          <span class="exmpale">
            &lt;svg class="icon" aria-hidden="true" &gt; &lt;use xlink:href="#icon-name" /&gt;  &lt;/svg&gt;
          </span>
        </div>
      </div>
      <hr/>
    `
    temp = temp.replace(divList[0], str)
    temp = temp.replace(/<i class="/g, `<i class="${aliIconFontClass} `)
    temp = temp.replace(/icon-icon-/g, `icon-`)

    colours.map(item => {
      let svg = `
        <svg class="icon" aria-hidden="true">
          <use xlink:href="#${item}"></use>
        </svg>
      `
      temp = temp.replace(`<i class="${aliIconFontClass} ${item}"></i>`, svg)
    })
    fs.writeFile(options.htmlOutput, temp, error => {
      if (error) {
        console.log(error)
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
    temp = temp.replace(classList[0], "." + aliIconFontClass)
    temp = temp.replace(/content:/g, "position:relative;\ntop:2px;\ncontent:")
    temp = temp.replace(/icon-icon-/g, `icon-`)

    let css = `
      .${aliIconFontClass}{
        font-family:"${aliIconFontClass}","my-icons" !important;
        font-size:16px;
        font-style:normal;
        -webkit-font-smoothing:antialiased;
        -moz-osx-font-smoothing:grayscale;
      }
      .icon {
        width: 1em;
        height: 1em;
        vertical-align: -0.15em;
        fill: currentColor;
        overflow: hidden;
      }
    `
    fs.writeFile(path.join(dir, "fonts/resetFontFamily.css"), css, (error) => {
      if (error) {
        console.log(error)
      } else {
        fs.writeFile(options.cssOutput, temp, (e) => {
          if (e) {
            console.log(e)
          } else {
            startServe()
          }
        })
      }
    })
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
