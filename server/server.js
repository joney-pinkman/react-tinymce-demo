const express = require('express')
const fileRouter = require('./fileRouter')
const cors = require('cors')
const fetch = require('node-fetch')
const bodyParser = require('body-parser')

const app = express()
app.use(express.json())
app.use(bodyParser.json())
app.use(cors())
const PORT = 8000

// Routes
app.use('/attachment', fileRouter)


const csrfToken = '84b92b50-0167-4cd9-adc6-15f960c47169'

app.post('/spellchecker', async (req, res) => {
  try {
    const loginResponse = await fetch('https://mail.onmail.com/v1/na/login', { headers: {
      'x-Auth-Password': '',
      'x-Auth-User': ''
    } })
    const authToken = loginResponse.headers.get('x-Auth-Token')

    console.log(authToken)
    const response = await fetch("https://wmapi.onmail.com/v1/assist_compose/batch_check", {
    "headers": {
      "accept": "*/*",
      "accept-language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7",
      "authorization": `Bearer ${authToken}`,
      "cache-control": "no-cache",
      "content-type": "application/json",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-auth-user": "",
      "x-requested-with": "XMLHttpRequest"
    },
    "referrer": "https://mail.onmail.com/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify(req.body),
    "method": "POST",
    "mode": "cors"
  })

  const result = await response.json()
  
  res.send(result.result)
  } catch(e) {
    res.status(500)
  }
  

  
})

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})
