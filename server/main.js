 
const express = require('express'),
      app = express(),
      { expressjwt: jwt} = require('express-jwt'),
      { jwtSecret } = require('./src/config/jwt'),
      { ErrorModel } = require('./src/model/responseModel'),
      { resSend } = require('./src/utils/tools'),
      userApi = require('./src/router/user'),
      goodsApi = require('./src/router/goods'),
      partyApi = require('./src/router/party'),
      dealApi = require('./src/router/deal');

app.all('*',function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://119.3.144.14:8095');//配置跨域
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.header('Access-Control-Allow-Credentials',true)//允许客户端携带验证信息
  next();
});

app.use(jwt({ secret: jwtSecret, algorithms: ['HS256']})
.unless({path: ['/api/register', '/api/login', '/api/checkLogin']}));

app.use(function (err, req, res, next) {
  console.log(err);
  if (err.name === 'UnauthorizedError') {
    resSend(res.status(401), new ErrorModel('无访问权限！'));
  }
});

app.use('/api',userApi);
app.use('/api',goodsApi);
app.use('/api',partyApi);
app.use('/api',dealApi);

const server = app.listen(8090,function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Server has running at http://%s:%s',host,port)
})
