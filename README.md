本工具旨在利用已有的svg图片，离线生成iconfont资源文件，可以与第三方iconfont（如阿里）混合使用，且用法与阿里iconfont基本一致

使用说明：

  1. 安装node

  2. 执行命令 npm install

  3. 将svg图片放在svg目录下，所有图标以“icon-”开头：多色图标命名必须已“-colours”结尾，单色图标结尾不做要求

  4. 配置icons.xlsx, "名称、类型、中文名称"，
     其中类型为下拉选项，如需要编辑下拉选项（增加、删减），
     通过excel: 选中类型列，点击 数据----数据验证----数据验证----设置----来源----输入选项（多个以逗号分隔）

  5. 执行 node index

  6. 完毕后，fonts/下以生成iconfont资源，可通过 http://localhost:3000 进行查看图标

  7. 在项目中使用，需先引入iconfont.css、iconfont.js，如与第三方iconfont混用，还需引入resetFontFamily.css.

  注意：

    1. 如果要与第三方iconfont混用，切记在index.js中修改thirdFontClass值和runWithThird标记。

    2. 如果要与第三方iconfont混用，切记要在引用第三方资源文件之后引用myIconfont的资源文件，最后引入resetFontFamily.css(此文件在fonts/下自动生成)

