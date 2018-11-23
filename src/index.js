const fs = require('fs')
const gm = require('gm').subClass({ imageMagick: true })

// 海报资源
const avatarImg = 'https://cloud-minapp-6.cloud.ifanrusercontent.com/1gQ5Mat7WAwyW1hl.jpg'
const backgroundImg = 'https://cloud-minapp-6.cloud.ifanrusercontent.com/1gQ7hCpFCK1qw8XQ.jpeg'

const MyFile = new BaaS.File()
const textLayer = '/tmp/textLayer.png'
const backgroundParams = {
  width: 375,
  height: 250,
}

function getImage(url) {
  const filename = `/tmp/${Math.random().toString().slice(2)}.jpg`
  const file = fs.createWriteStream(filename)
  return BaaS.request.get(url, {responseType: 'arraybuffer'}).then(res => {
    file.write(res.data)
    file.end()
    return filename
  })
}

function uploadImage(buffer) {
  return MyFile.upload(buffer, {filename: Math.random().toString().slice(2) + '.png'}) 
}

function genText() {
  return new Promise((resolve, reject) => {
    gm(width, height, 'none')
      // 设置字体以及文字大小，这里只能设置云函数已支持的字体
      .font('/usr/share/fonts/ttf-bitstream-vera/VeraMoBd.ttf')  
      .fill('#fff')
      .fontSize(20)
      .drawText(140, 170, 'mincloud')
      .fill('#fff')
      .fontSize(14)
      .drawText(30, 200, 'An easy-to-use MiniApp development tool.')
      .write(textLayer, function(err) {
        if (err) {
          return reject(err)
        }
        resolve(textLayer)
      })
  })
}

function genAvatar(avatar) {
  return new Promise((resolve, reject) => {
    gm(avatar)
      .resize(100, 100)
      .write(avatar, function(err) {
        if (err) {
          return reject(err)
        }
        resolve(avatar)
      })
  })
}

function genBackground(bg) {
  return new Promise((resolve, reject) => {
    gm(bg)
      .resize(500, 350)
      .blur(20, 2)
      .write(bg, function(err) {
        if (err) {
          return reject(err)
        }
        resolve(bg)
      })
  })
}

module.exports = async function (event, callback) {
  try {
    const {width, height} = backgroundParams
    const p1 = getImage(avatarImg)
    const p2 = getImage(backgroundImg)
    const [avatar, bg] = await Promise.all([p1, p2])
    Promise.all([genAvatar(avatar), genBackground(bg), genText()]).then(() => {
      gm(width, height, 'none')
        .fill(bg)
        .drawRectangle(`0, 0, ${width}, ${height}`)   // 绘制背景
        .fill(avatar)
        .drawCircle(190, 80, 190, 125)                // 绘制头像
        .draw(`image Over 0, 0 ${width}, ${height} "${textLayer}"`)  // 绘制文本
        .toBuffer('PNG', function (err, buffer) {
          if (err) {
            return callback(err)
          }
          uploadImage(buffer).then((res) => {
            // 海报 URL 为：res.data.file_link
            callback(null, 'success')
          }).catch(err => {
            callback(err)
          })
        })
    })
  } catch (error) {
    callback(err)
  }
}

