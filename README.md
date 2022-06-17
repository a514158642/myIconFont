本工具旨在利用已有的svg图片，离线生成iconfont资源文件，可以与阿里的iconfont混合使用，且用法与阿里iconfont基本一致（暂不支持多色图标）

使用说明：

  1. 安装node

  2. 执行命令 npm install

  3. 将svg图片放在svg目录下(svg图片名称不包含icon-)

  4. 执行 node index

  5. 完毕后，fonts/下以生成iconfont资源，可通过 http://localhost:3000 进行查看图标

  注意：

    1. 如果要与阿里的iconfont混用，且修改了阿里iconfont的类名（默认情况下是“iconfont”）,切记在index.js中修改aliIconFontClass值。

    2. 如果要与阿里的iconfont混用，切记要在引用阿里资源文件之后引用myIconfont的资源文件，最后引入resetFontFamily.css(此文件在fonts/下自动生成)

