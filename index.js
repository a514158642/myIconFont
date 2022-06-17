const WebpackIconfontPluginNodejs = require('webpack-iconfont-plugin-nodejs');
const path = require('path');
const express = require("express")
const app = express()
const fs = require("fs");
const dir = 'src'
//如果要与阿里的iconfont混用  这里指定阿里iconfont的类名（如果没做改动，这个类名默认是iconfont）
const aliIconFontClass = "iconfont"

app.use(express.static("./"))

const options = {
  fontName: 'my-icons',
  cssPrefix: 'icon',
  svgs: path.join(dir, 'svg/*.svg'),
  fontsOutput: path.join(dir, 'fonts/'),
  cssOutput: path.join(dir, 'fonts/iconfont.css'),
  htmlOutput: path.join(dir, 'fonts/index.html'),
  jsOutput: path.join(dir, 'fonts/iconfont.js'),
};

run()
/**
 * 开始执行函数
 */
function run() {
  new WebpackIconfontPluginNodejs(options).build().then(createHtml)
}
/**
 * 生成样例html
 */
function createHtml() {
  fs.readFile(options.htmlOutput, (err, content) => {
    let temp = content.toString()
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
          <span>使用方法：</span>
          <span style="background:#000;padding:3px 10px;border-radius:5px;color:#fff;font-weight:bold;font-size:14px;">
            &lt;span class="${aliIconFontClass} icon-name" /&gt;
          </span>
        </div>
      </div>
      <hr/>
    `
    temp = temp.replace(divList[0], str)
    temp = temp.replace(/<i class="/g, `<i class="${aliIconFontClass} `)

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
    let css = `
      .${aliIconFontClass}{
        font-family:"${aliIconFontClass}","my-icons" !important;
        font-size:16px;
        font-style:normal;
        -webkit-font-smoothing:antialiased;
        -moz-osx-font-smoothing:grayscale;
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
