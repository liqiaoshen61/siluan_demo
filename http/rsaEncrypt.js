import JSEncrypt from 'jsencrypt/bin/jsencrypt'
// import JSEncrypt from './jsencrypt'

// 密钥对生成 http://web.chacuo.net/netrsakeypair

let publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwwezdzrC4BxBs+SnNH7vtjIokOKwd6zaEDs65hDDlO8K5T3ptZQWt7XvQKkAm6jo7ZhfL42lATTF7oKKfe7MKFf6pwvjuWJhoLtvac40WZBHAQSoEnHWLpC3SsziuM7CwGLi1tnGm37hu20A5Ec86AaKpFdUGDZ2/SkVMGxznRQIDAQAB''

const privateKey =
  'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCzrqf9/n7R+nlO\n' +
  'LxFpmmxynVsHoqGNMUHIVAWPAyzw/RHS25VMzTYY80vaR7ppZshivA5NmJn4yGYd\n' +
  'lI4B0X9SgRZgxvoGMHPkgGsJw1r9XOJlYiP5sMpwu4v+9RG979sPX6K3DqC1AUSe\n' +
  'p9umJxS0mOldbWtJ8iEedzIExnag8Up0ngDUs8cV1JTkkGjbakerDgpuh8zsbF9m\n' +
  'JCWOnDYzGGw+Xkf7Mh3NrSyKB1PFrhDEDiklLlGfmzikFsgKIl4+BbWfhnxgpNIi\n' +
  'iuoOvW6F3a2h+vpGjOcmFiXlPsJM9JP23NMj/t4+9o5aOuIL8mTgWudS8qLDk7Ef\n' +
  'FHD37H3vAgMBAAECggEAHRsVq1cmQ+1G6RtGvsx89LP4ouv9L1njRggWPmxNQ1w7\n' +
  'HuTi8mXrdW8zwlAMKja0DwpXZsppZptPr0r5FeJRtZOjhFm29nmyzDjhHdu/SXta\n' +
  'UQHswe2ZXVmD+/DGxvWrjnn3aZ+8+JUUAH9AXVHHUNnUM4Yd8wR9yOmV+KANZ1Rp\n' +
  'I6xiDoz+Z+4NR5c05CVmz8V9AekabjWan9mzPOvmp6GwwdXO9RIVV0DuDjPqbjwU\n' +
  'l9UgZMmecW+m0CNONPcU2E5ruAVq+yRudRdiY3ZwGc55gydax8xhgKzFTkh+nN+c\n' +
  'NyRH+UalB40VP8iudmZ/jYxP6Ng6mP3109Wutw0zAQKBgQDgyqI3/ViUqlVu3mU3\n' +
  'CISD6IpttI7WgEegSqRqE2C2599wks140Fk+GRy+JiMs6W/KBfNjXeCKkltf0Nec\n' +
  'uYkHj05SjVRUtuIN3N4eFNEFDudEOju1uBF5U2GnBBEF9bz4BVfRyJnaJcj94VHC\n' +
  'LXyu56q806I6G6dXg6YzCVG/HwKBgQDMoMiGBXxzsydwWo7TBWLlZTtYpDfxCY/8\n' +
  '5uviSnIBnr8+VY8/Lq4uYgmlxzITIYlAqvbieha37jxeVBBUl6hXqW3J7t1kaxPA\n' +
  'w1DJyRiA/p353D9qALV3J2/duIa+uBqlO8fGk5EKs3XKzwBRFbUJaBnAp6FZxZ5w\n' +
  'tr14FCD3MQKBgDGyeuS3/RJ5CgRF5Mii+HEVQy134rBnke5NMkZFXHdzkgGYYxbX\n' +
  'sTM6aBFd6x7tyQo4AJQyWAcqzkrDqDd9CV+DfkRf/InyGM4Jy42I+qEMp3J9EWBe\n' +
  'fnZ9SbScAIt5xbprq/u0RtdkzSfb3bB5T/x3OVcfztjb7kY508+qusjvAoGBAIha\n' +
  '76RXDYovrK0yuw+k/DSuU3CK5XgqDhfRbQf64aNwvDF2ZCEPIyRnUdR1O0oCQ+qi\n' +
  'widCgdcI2pNk4wjrklLv5Of10vNyYtRFkpUT+s8iW/S+rkcdt85xqhqONsPp/F90\n' +
  'yXfqp3EBCxIdBDIEDAH7q4V0bpFanWywaOsWRq1RAoGAJrl+JYI5wrKF7tfV7UNT\n' +
  '65E4IAD5I+I6omhJ2zG1DBLxlZDpS9MSTC8NxKbL/699/nY0pNfZqDgNm2qpg5KX\n' +
  'b+4DnIs6CjsnwXon6/sq/oxc6lH3OiPuOx1JyudMs+6wwXw54SRKGEhlDSAOUMOJ\n' +
  'A7NbkhtAbiycqISre2WzBwQ='
// const privateKey = 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJuPJsypnG5HWaVFIiiyw3pVGN06BYSzczQqgskCb1fWeIcyJ7yw5uZZoL3DUVg+mYZbq/ELJ0fX5dPgvayqOcUCAwEAAQ=='

// 加密
export function encrypt(txt) {
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey) // 设置公钥
  return encryptor.encrypt(txt) // 对需要加密的数据进行加密
}

// 解密
export function decrypt(txt) {
  const encryptor = new JSEncrypt()
  encryptor.setPrivateKey(privateKey)
  return encryptor.decrypt(txt)
}
