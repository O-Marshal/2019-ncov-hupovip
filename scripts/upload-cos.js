
const fs = require('fs')
const path = require('path')
const COS = require('cos-nodejs-sdk-v5')

const store = new COS({
  SecretId: 'AKIDUlob9SSMwGjxvey8vTltnRq20mJaN71f',
  SecretKey: 'Zu2vZ3JJ3d2DAqNgjW4av4xgCTUI1Vjh'
})

const baseDir = path.resolve(__dirname, '../build')

async function uploadDir (dir) {
  const files = fs.readdirSync(path.resolve(baseDir, dir)).filter(x => !x.endsWith('map'))
  for (const file of files) {
    const fileName = path.join(dir, file)
    const realFileName = path.resolve(baseDir, dir, file)
    const realFileStats = fs.statSync(realFileName)
    if (!realFileStats.isFile()) return

    // 删除已有的
    await new Promise((resolve, reject) => {
      store.deleteObject({Key: fileName, Bucket: '2019-ncov-1300334035', Region: 'ap-chengdu'}, (err, data) => {
        if (err) {
          console.log(fileName + " : " + err)
          return reject(err)
        }
        return resolve(data)
      })
    })

    await new Promise((resolve, reject) => {
      store.putObject({Key: fileName, Bucket: '2019-ncov-1300334035', Region: 'ap-chengdu', Body: fs.createReadStream(realFileName)}, (err, data) => {
        if (err) {
          console.log(fileName + " : " + err)
          return reject(err)
        }
        return resolve(data)
      })
    })

    // 如果是文件，则上传到 oss，目录跳过
    // const isSkip = skip && await probeObjectMeta(path.join(dir, file))
    // if (stats.isFile()) {
    //   if (isSkip) {
    //     console.info(`skip: ${path.join(dir, file)}`)
    //   } else {
    //     const o = await store.put(path.join(dir, file), path.resolve(baseDir, dir, file), {
    //       headers
    //     })
    //     console.info(`done: ${o.name}`)
    //   }
    // }
  }
  return true
}

Promise.all([
  uploadDir('.'),
  uploadDir('static/media'),
  uploadDir('static/js'),
  uploadDir('static/css')
]).catch(e => {
  console.error(e)
  process.exit(1)
})
