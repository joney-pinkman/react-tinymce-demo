const fetch = require('node-fetch')

 fetch('https://mail.onmail.com/v1/na/login', { headers: {
      'x-Auth-Password': 'lxw314671488',
      'x-Auth-User': 'xinwei@onmail.com'
    } }).then(res => {
      if (res.ok) {
        console.log(res.headers.get('x-Auth-token'))
      }
    })

