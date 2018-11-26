const fs = require('fs')
const gm = require('gm').subClass({ imageMagick: true })

// 海报资源
const avatarImg = 'https://cloud-minapp-6.cloud.ifanrusercontent.com/1gQ5Mat7WAwyW1hl.jpg'
const backgroundImg = 'https://cloud-minapp-6.cloud.ifanrusercontent.com/1gQ7hCpFCK1qw8XQ.jpeg'

const MyFile = new BaaS.File()
const imageSize = {
  width: 375,
  height: 250,
}

function downloadImage(url) {
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

function drawText(filename) {
  return new Promise((resolve, reject) => {
    gm(imageSize.width, imageSize.height, 'none')
      // 设置字体以及文字大小，这里只能设置云函数已支持的字体
      .font('/usr/share/fonts/ttf-bitstream-vera/VeraMoBd.ttf')  
      .fill('#fff')
      .fontSize(20)
      .drawText(140, 170, 'mincloud')
      .fill('#fff')
      .fontSize(14)
      .drawText(30, 200, 'An easy-to-use MiniApp development tool.')
      .write(filename, function(err) {
        if (err) {
          return reject(err)
        }
        resolve(filename)
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

module.exports = function (event, callback) {
  const {width, height} = imageSize
  const job1 = downloadImage(backgroundImg).then(res => genBackground(res))
  const job2 = downloadImage(avatarImg).then(res => genAvatar(res))
  const job3 = drawText('/tmp/textLayer.png')
  Promise.all([job1, job2, job3]).then(res => {
    gm(width, height, 'none')
      .fill(res[0])
      .drawRectangle(`0, 0, ${width}, ${height}`)   // 绘制背景
      .fill(res[1])
      .drawCircle(190, 80, 190, 125)                // 绘制头像
      .fill(res[2])
      .drawRectangle(`0, 0, ${width}, ${height}`)   // 绘制文本
      .toBuffer('PNG', function (err, buffer) {
        if (err) {
          return callback(err)
        }
        uploadImage(buffer).then((res) => {
          console.log('success')
          callback(null, res.data.file_link)
        }).catch(err => {
          callback(err)
        })
      })
  })
}

