// 云函数入口文件
const cloud = require('wx-server-sdk');
// sts
const sts = require('qcloud-cos-sts');
cloud.init()

// 云函数入口函数
exports.main = async(event, context) => new Promise((resolve, reject) => {
  const wxContext = cloud.getWXContext()
  const cosOptions = {
    secretId: process.env.secretId,
    secretKey: process.env.secretKey,
    bucket: 'fyt-1253560230',
    region: 'ap-guangzhou',
    policy: {
      'version': '2.0',
      'statement': [{
        'action': [
          "name/cos:GetBucket",
          "name/cos:PutObject",
          "name/cos:PostObject",
          "name/cos:DeleteObject",
          "name/cos:HeadObject",
          "name/cos:GetObject",
        ],
        'effect': 'allow',
        'principal': {
          'qcs': ['*']
        },
        'resource': [
          'qcs::cos:ap-guangzhou:uid/1253560230:prefix//1253560230/fyt/*'
        ],
      }]
    }
  }

  sts.getCredential({
    secretId: cosOptions.secretId,
    secretKey: cosOptions.secretKey,
    policy: cosOptions.policy,
    durationSeconds: 3600
  }, function(err, credential) {
    if (err) {
      console.error(err)
      resolve({
        event,
        err
      })
    } else {
      console.log(credential)
      resolve({
        event,
        credential
      })
    }
  })
})